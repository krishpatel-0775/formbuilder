package com.example.formBuilder.enums;

/**
 * Defines the set of comparison operators supported by the Rule Engine.
 * <p>
 * Used inside {@code RuleConditionDTO} to specify how a field value
 * should be compared against a rule's expected value.
 * </p>
 *
 * <ul>
 *   <li>{@link #EQUALS}        - Exact match (e.g., {@code name == "krish"})</li>
 *   <li>{@link #NOT_EQUALS}    - Negated match (e.g., {@code name != "krish"})</li>
 *   <li>{@link #GREATER_THAN}  - Numeric greater than (e.g., {@code age > 18})</li>
 *   <li>{@link #LESS_THAN}     - Numeric less than (e.g., {@code age < 60})</li>
 *   <li>{@link #CONTAINS}      - Substring check (e.g., {@code description CONTAINS "error"})</li>
 * </ul>
 */
public enum RuleOperator {
    EQUALS,
    NOT_EQUALS,
    GREATER_THAN,
    LESS_THAN,
    CONTAINS
}
