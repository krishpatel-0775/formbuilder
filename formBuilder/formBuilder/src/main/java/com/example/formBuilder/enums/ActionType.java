package com.example.formBuilder.enums;

/**
 * Defines the set of actions the Rule Engine can execute when a condition is met.
 * <p>
 * Used inside {@code RuleActionDTO} to describe what should happen to a target field
 * when its associated condition evaluates to true.
 * </p>
 *
 * <ul>
 *   <li>{@link #SHOW}             - Make the target field visible on the form.</li>
 *   <li>{@link #HIDE}             - Hide the target field from the form.</li>
 *   <li>{@link #REQUIRE}          - Mark the target field as mandatory; reject submission if empty.</li>
 *   <li>{@link #VALIDATION_ERROR} - Reject the entire form submission with a custom error message.</li>
 * </ul>
 */
public enum ActionType {
    SHOW,
    HIDE,
    REQUIRE,
    VALIDATION_ERROR
}
