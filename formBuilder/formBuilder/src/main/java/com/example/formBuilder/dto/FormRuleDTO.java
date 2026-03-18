package com.example.formBuilder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class FormRuleDTO {

    @Valid
    private RuleConditionDTO condition;

    @NotNull(message = "Rule action is required")
    @Valid
    private RuleActionDTO action;

}
