package com.example.formBuilder.dto;

import com.example.formBuilder.enums.ActionType;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents the action to execute when a rule condition evaluates to true.
 * <p>
 * An action targets a specific form field and specifies what should happen to it.
 * For {@link ActionType#VALIDATION_ERROR}, the {@code targetField} may be omitted
 * and a custom {@code message} should be provided to describe the error.
 * </p>
 *
 * <h3>Example (Show a field):</h3>
 * <pre>
 * {
 *   "type": "SHOW",
 *   "targetField": "driving_license"
 * }
 * </pre>
 *
 * <h3>Example (Validation error):</h3>
 * <pre>
 * {
 *   "type": "VALIDATION_ERROR",
 *   "message": "You must be 18+ to submit this form"
 * }
 * </pre>
 */
@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class RuleActionDTO {

    @NotNull(message = "Action type is required")
    private ActionType type;

    private String targetField;

    private String message;
}
