package com.example.formBuilder.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;


@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class FormRuleDTO {

    private RuleConditionDTO condition;
    private RuleActionDTO action;

}
