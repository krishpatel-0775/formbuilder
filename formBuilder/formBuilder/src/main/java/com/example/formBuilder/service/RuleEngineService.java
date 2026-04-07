package com.example.formBuilder.service;

import com.example.formBuilder.dto.FormRuleDTO;
import com.example.formBuilder.dto.RuleActionDTO;
import com.example.formBuilder.dto.RuleConditionDTO;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.enums.ActionType;
import com.example.formBuilder.exception.ValidationException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.*;


@Slf4j
@Service
@RequiredArgsConstructor
public class RuleEngineService {

    private final ObjectMapper objectMapper;

    public void validateSubmission(Form form, Map<String, Object> values) {
        List<FormRuleDTO> rules = parseRules(form.getRules());
        if (rules.isEmpty()) {
            return;
        }

        List<String> requireErrors = new ArrayList<>();

        for (FormRuleDTO rule : rules) {
            if (rule.getCondition() == null || rule.getAction() == null) {
                log.warn("Skipping malformed rule (null condition or action)");
                continue;
            }

            boolean conditionMet = evaluateCondition(rule.getCondition(), values);

            if (!conditionMet) {
                continue;
            }

            RuleActionDTO action = rule.getAction();

            switch (action.getType()) {
                case VALIDATION_ERROR -> {
                    String message = (action.getMessage() != null && !action.getMessage().isBlank())
                            ? action.getMessage()
                            : "Form submission rejected by a validation rule.";
                    throw new ValidationException(message);
                }
                case REQUIRE -> {
                    String targetField = action.getTargetField();
                    if (targetField == null || targetField.isBlank()) {
                        log.warn("REQUIRE action has no targetField — skipping");
                        break;
                    }
                    Object fieldValue = values.get(targetField);
                    if (fieldValue == null || fieldValue.toString().trim().isEmpty()) {
                        requireErrors.add(targetField + " is required based on the form rules");
                    }
                }
                // SHOW and HIDE are visibility-only; they do not affect submission validation
                default -> log.debug("Rule action {} handled during visibility evaluation", action.getType());
            }
        }

        if (!requireErrors.isEmpty()) {
            throw new ValidationException(String.join(", ", requireErrors));
        }
    }


    public void executePostSubmissionWorkflows(Form form, Map<String, Object> values) {
        List<FormRuleDTO> rules = parseRules(form.getRules());
        if (rules.isEmpty()) {
            return;
        }

        for (FormRuleDTO rule : rules) {
            if (rule.getCondition() == null || rule.getAction() == null) {
                continue;
            }
            boolean conditionMet = evaluateCondition(rule.getCondition(), values);
            if (conditionMet) {
                log.info("[PostSubmission] Rule triggered — action: {}, targetField: {}",
                        rule.getAction().getType(), rule.getAction().getTargetField());
                // Future: emit events, send emails, trigger webhooks, etc.
            }
        }
    }

    public boolean evaluateCondition(RuleConditionDTO condition, Map<String, Object> values) {
        if (condition == null) {
            return false;
        }

        // ── Multi-condition block (AND / OR) ──
        if (condition.getConditions() != null && !condition.getConditions().isEmpty()) {
            return evaluateCompoundCondition(condition, values);
        }

        // ── Leaf-level condition ──
        return evaluateLeafCondition(condition, values);
    }

    private boolean evaluateCompoundCondition(RuleConditionDTO condition, Map<String, Object> values) {
        String logical = condition.getLogicalOperator();
        List<RuleConditionDTO> nested = condition.getConditions();

        if ("OR".equalsIgnoreCase(logical)) {
            return nested.stream().anyMatch(c -> evaluateCondition(c, values));
        }

        // Default: AND
        return nested.stream().allMatch(c -> evaluateCondition(c, values));
    }

    private boolean evaluateLeafCondition(RuleConditionDTO condition, Map<String, Object> values) {
        if (condition.getField() == null || condition.getOperator() == null) {
            log.warn("Leaf condition is missing field or operator — skipping");
            return false;
        }

        Object rawValue = values.get(condition.getField());
        Object ruleValue = condition.getValue();

        // Null-safety: if the field doesn't exist, condition cannot be satisfied
        if (rawValue == null || rawValue.toString().trim().isEmpty()) {
            return false;
        }
        String actualStr = rawValue.toString().trim();
        String expectedStr = (ruleValue != null) ? ruleValue.toString().trim() : "";

        return switch (condition.getOperator()) {
            case EQUALS -> actualStr.equalsIgnoreCase(expectedStr);
            case NOT_EQUALS -> !actualStr.equalsIgnoreCase(expectedStr);
            case CONTAINS -> actualStr.toLowerCase().contains(expectedStr.toLowerCase());
            case GREATER_THAN -> {
                // Skip numeric comparison if either side is blank/non-numeric
                if (expectedStr.isBlank()) yield false;
                yield compareNumeric(actualStr, expectedStr) > 0;
            }
            case LESS_THAN -> {
                if (expectedStr.isBlank()) yield false;
                yield compareNumeric(actualStr, expectedStr) < 0;
            }
        };
    }

    private List<FormRuleDTO> parseRules(String rulesJson) {
        if (rulesJson == null || rulesJson.isBlank()) {
            return Collections.emptyList();
        }
        try {
            return objectMapper.readValue(rulesJson, new TypeReference<List<FormRuleDTO>>() {});
        } catch (Exception e) {
            log.error("Failed to parse form rules JSON: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private int compareNumeric(String actual, String expected) {
        try {
            double a = Double.parseDouble(actual);
            double e = Double.parseDouble(expected);
            return Double.compare(a, e);
        } catch (NumberFormatException ex) {
            // Non-numeric values cannot satisfy a numeric comparison — treat as unmet condition
            log.warn("GREATER_THAN / LESS_THAN: non-numeric value encountered. actual='{}' expected='{}' — condition skipped", actual, expected);
            return Integer.MIN_VALUE; // Will make > 0 and < 0 both false
        }
    }
}
