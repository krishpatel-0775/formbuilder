package com.example.formBuilder.dto;

import com.example.formBuilder.enums.RuleOperator;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

/**
 * Represents a single condition block in a form rule.
 * <p>
 * A condition specifies which field to evaluate, how to evaluate it (via operator),
 * and what value to compare against. Multiple conditions can be nested using
 * {@code logicalOperator} (AND / OR) for future multi-condition support.
 * </p>
 *
 * <h3>Example (Single condition):</h3>
 * <pre>
 * {
 *   "field": "age",
 *   "operator": "GREATER_THAN",
 *   "value": 18
 * }
 * </pre>
 *
 * <h3>Example (Multi-condition — future support):</h3>
 * <pre>
 * {
 *   "logicalOperator": "AND",
 *   "conditions": [
 *     { "field": "age", "operator": "GREATER_THAN", "value": 18 },
 *     { "field": "country", "operator": "EQUALS", "value": "India" }
 *   ]
 * }
 * </pre>
 */
@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class RuleConditionDTO {

    /**
     * The name of the form field to evaluate (e.g., "age", "name").
     * Required for a leaf-level condition (without nested conditions).
     */
    private String field;

    /**
     * The comparison operator to apply (e.g., EQUALS, GREATER_THAN).
     * Required for a leaf-level condition.
     */
    private RuleOperator operator;

    /**
     * The expected value to compare against.
     * Can be a String or a Number depending on the field type.
     */
    private Object value;

    /**
     * Logical combinator for multi-condition support.
     * Accepted values: "AND", "OR"
     * If null or omitted, this is treated as a simple single-condition rule.
     */
    private String logicalOperator;

    /**
     * A list of nested conditions to be combined using {@code logicalOperator}.
     * Enables future support for complex rule expressions like:
     * <pre>age &gt; 18 AND country == "India"</pre>
     */
    private List<RuleConditionDTO> conditions;
}
