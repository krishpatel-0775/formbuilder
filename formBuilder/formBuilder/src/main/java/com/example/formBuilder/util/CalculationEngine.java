package com.example.formBuilder.util;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Evaluates flat arithmetic formula definitions stored as JSON.
 *
 * <p>Formula JSON schema:
 * <pre>{"operator":"+","operands":["field_a","field_b","field_c"]}</pre>
 *
 * <p>Supported operators: {@code +}, {@code -}, {@code *}, {@code /}
 * <p>All operands must be field keys whose values resolve to numeric values.
 * Division by zero returns {@code null}.
 */
@Slf4j
@Component
public class CalculationEngine {

    private final ObjectMapper objectMapper;

    public CalculationEngine(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    /**
     * Computes the result of a formula given a map of field values.
     *
     * @param formulaJson JSON string like {@code {"operator":"+","operands":["a","b"]}}
     * @param values      map of fieldKey → submitted value
     * @return computed Double, or {@code null} if any operand is missing, non-numeric,
     *         or if division by zero occurs
     */
    public Double compute(String formulaJson, Map<String, Object> values) {
        if (formulaJson == null || formulaJson.isBlank()) {
            log.warn("[CalculationEngine] Null or blank formula JSON — returning null");
            return null;
        }

        try {
            JsonNode root = objectMapper.readTree(formulaJson);
            String operator = root.path("operator").asText("+");
            JsonNode operandsNode = root.path("operands");

            if (!operandsNode.isArray() || operandsNode.isEmpty()) {
                log.warn("[CalculationEngine] No operands defined in formula: {}", formulaJson);
                return null;
            }

            // Resolve the first operand as the starting accumulator
            String firstKey = operandsNode.get(0).asText();
            Double accumulator = resolveNumeric(firstKey, values);
            if (accumulator == null) {
                log.debug("[CalculationEngine] Operand '{}' is null/non-numeric — computed result is null", firstKey);
                return null;
            }

            // Apply the operator to each subsequent operand
            for (int i = 1; i < operandsNode.size(); i++) {
                String key = operandsNode.get(i).asText();
                Double operandValue = resolveNumeric(key, values);
                if (operandValue == null) {
                    log.debug("[CalculationEngine] Operand '{}' is null/non-numeric — computed result is null", key);
                    return null;
                }

                switch (operator) {
                    case "+" -> accumulator += operandValue;
                    case "-" -> accumulator -= operandValue;
                    case "*" -> accumulator *= operandValue;
                    case "/" -> {
                        if (operandValue == 0.0) {
                            log.warn("[CalculationEngine] Division by zero for key '{}' — returning null", key);
                            return null;
                        }
                        accumulator /= operandValue;
                    }
                    default -> {
                        log.warn("[CalculationEngine] Unknown operator '{}' — returning null", operator);
                        return null;
                    }
                }
            }

            return accumulator;

        } catch (Exception e) {
            log.error("[CalculationEngine] Failed to evaluate formula '{}': {}", formulaJson, e.getMessage());
            return null;
        }
    }

    private Double resolveNumeric(String key, Map<String, Object> values) {
        if (key == null) return 0.0;
        
        // 1. Try exact match
        Object raw = values.get(key);
        
        // 2. Try case-insensitive match if not found
        if (raw == null) {
            String target = key.toLowerCase();
            for (Map.Entry<String, Object> entry : values.entrySet()) {
                if (entry.getKey().equalsIgnoreCase(target)) {
                    raw = entry.getValue();
                    break;
                }
            }
        }
        
        // 3. Fallback to 0.0 if still not found
        if (raw == null) return 0.0;
        
        String str = raw.toString().trim();
        if (str.isEmpty()) return 0.0;
        
        try {
            return Double.parseDouble(str);
        } catch (NumberFormatException e) {
            // Treat non-numeric content as 0.0 to prevent breaking the formula
            return 0.0;
        }
    }
}
