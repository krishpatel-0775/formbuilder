package com.example.formBuilder.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Represents a complete conditional rule in the form's rule engine.
 * <p>
 * A rule encapsulates a single IF (condition) → THEN (action) pair.
 * Rules are stored as a JSON array on the {@code Form} entity and are
 * evaluated by {@code RuleEngineService} during form submission.
 * </p>
 *
 * <h3>Example Rule JSON:</h3>
 * <pre>
 * {
 *   "condition": {
 *     "field": "age",
 *     "operator": "GREATER_THAN",
 *     "value": 18
 *   },
 *   "action": {
 *     "type": "SHOW",
 *     "targetField": "driving_license"
 *   }
 * }
 * </pre>
 *
 * <h3>Example Multi-condition Rule (future support):</h3>
 * <pre>
 * {
 *   "condition": {
 *     "logicalOperator": "AND",
 *     "conditions": [
 *       { "field": "age", "operator": "GREATER_THAN", "value": 18 },
 *       { "field": "country", "operator": "EQUALS", "value": "India" }
 *     ]
 *   },
 *   "action": {
 *     "type": "SHOW",
 *     "targetField": "driving_license"
 *   }
 * }
 * </pre>
 */
@Getter
@Setter
@NoArgsConstructor
public class FormRuleDTO {

    /**
     * The condition that must evaluate to {@code true} for the action to be executed.
     */
    private RuleConditionDTO condition;

    /**
     * The action to execute when the condition is satisfied.
     */
    private RuleActionDTO action;
}
