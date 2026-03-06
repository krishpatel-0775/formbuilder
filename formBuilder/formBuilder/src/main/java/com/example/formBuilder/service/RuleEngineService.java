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

/**
 * Core Rule Engine service that evaluates conditional form rules during submission.
 *
 * <p>Rules are stored as a JSON array on the {@link Form} entity and follow the structure:</p>
 * <pre>
 * IF (condition) THEN (action)
 * </pre>
 *
 * <p>Supported operators: EQUALS, NOT_EQUALS, GREATER_THAN, LESS_THAN, CONTAINS</p>
 * <p>Supported actions: SHOW, HIDE, REQUIRE, VALIDATION_ERROR</p>
 *
 * <h3>Multi-condition support (AND / OR):</h3>
 * <p>Conditions can be nested by setting {@code logicalOperator} to "AND" or "OR" and
 * providing a {@code conditions} list inside the condition block.</p>
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RuleEngineService {

    private final ObjectMapper objectMapper;

    // ─────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────

    /**
     * Parses and validates all rules against the submitted form values.
     *
     * <p>Validation steps:</p>
     * <ol>
     *   <li>Deserialize rules JSON from the Form entity.</li>
     *   <li>Evaluate each rule's condition.</li>
     *   <li>If a rule triggers {@code VALIDATION_ERROR}, throw a {@link ValidationException} immediately.</li>
     *   <li>If a rule triggers {@code REQUIRE}, check that the target field has a non-blank value.</li>
     * </ol>
     *
     * @param form   the Form entity containing the rule JSON configuration
     * @param values the map of field names to submitted values
     * @throws ValidationException if any rule triggers a VALIDATION_ERROR or a REQUIRE check fails
     */
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

    /**
     * Evaluates all rules and returns the visibility state for each affected field.
     *
     * <p>Returns a map of field name → "SHOW" or "HIDE" based on which rules are triggered.</p>
     *
     * <h3>Example output:</h3>
     * <pre>
     * {
     *   "driving_license": "SHOW",
     *   "nickname": "HIDE"
     * }
     * </pre>
     *
     * @param form   the Form entity containing the rule JSON configuration
     * @param values the current map of submitted/live field values
     * @return a map of field names to their computed visibility state
     */
    public Map<String, String> evaluateVisibility(Form form, Map<String, Object> values) {
        List<FormRuleDTO> rules = parseRules(form.getRules());
        Map<String, String> visibility = new LinkedHashMap<>();

        for (FormRuleDTO rule : rules) {
            if (rule.getCondition() == null || rule.getAction() == null) {
                continue;
            }

            RuleActionDTO action = rule.getAction();
            if (action.getType() != ActionType.SHOW && action.getType() != ActionType.HIDE) {
                continue;
            }

            String targetField = action.getTargetField();
            if (targetField == null || targetField.isBlank()) {
                continue;
            }

            boolean conditionMet = evaluateCondition(rule.getCondition(), values);
            if (conditionMet) {
                visibility.put(targetField, action.getType().name());
            }
        }

        return visibility;
    }

    /**
     * Placeholder hook for any post-submission workflows.
     *
     * <p>Extend this method to trigger follow-up logic after the form has been
     * successfully saved to the database, e.g., notifications or audit logging.</p>
     *
     * @param form   the submitted Form entity
     * @param values the submitted field values
     */
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

    // ─────────────────────────────────────────
    // Condition Evaluation
    // ─────────────────────────────────────────

    /**
     * Evaluates a condition (simple or compound) against the submitted values.
     *
     * <p>If the condition has a {@code logicalOperator} set and a non-empty
     * {@code conditions} list, it will recursively evaluate each nested condition
     * and combine the results using AND / OR logic.</p>
     *
     * <p>Otherwise, it evaluates the condition as a simple leaf-level comparison.</p>
     *
     * @param condition the condition DTO to evaluate
     * @param values    the submitted field values
     * @return {@code true} if the condition is satisfied, {@code false} otherwise
     */
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

    /**
     * Evaluates a compound condition using AND / OR logic.
     *
     * @param condition the root compound condition containing nested conditions
     * @param values    the submitted field values
     * @return the combined boolean result
     */
    private boolean evaluateCompoundCondition(RuleConditionDTO condition, Map<String, Object> values) {
        String logical = condition.getLogicalOperator();
        List<RuleConditionDTO> nested = condition.getConditions();

        if ("OR".equalsIgnoreCase(logical)) {
            return nested.stream().anyMatch(c -> evaluateCondition(c, values));
        }

        // Default: AND
        return nested.stream().allMatch(c -> evaluateCondition(c, values));
    }

    /**
     * Evaluates a single leaf-level condition (field + operator + expectedValue).
     *
     * <p>Handles the following field types safely:</p>
     * <ul>
     *   <li>String: case-insensitive comparison</li>
     *   <li>Number: parsed as {@code double} to support both integer and decimal values</li>
     *   <li>Null: safely returns {@code false} when field is missing or empty</li>
     * </ul>
     *
     * @param condition the leaf condition to evaluate
     * @param values    the submitted field values
     * @return {@code true} if the condition matches
     */
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

    // ─────────────────────────────────────────
    // Utilities
    // ─────────────────────────────────────────

    /**
     * Parses the rules JSON string stored on the Form entity into a list of {@code FormRuleDTO}.
     *
     * @param rulesJson the JSON string (may be null or empty)
     * @return a list of parsed rules, or an empty list if there are none
     */
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

    /**
     * Compares two string-encoded numeric values as {@code double}.
     *
     * @param actual   the value from the form submission
     * @param expected the value from the rule condition
     * @return a negative integer, zero, or positive integer as the first value
     *         is less than, equal to, or greater than the second
     * @throws IllegalArgumentException if either value cannot be parsed as a number
     */
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
