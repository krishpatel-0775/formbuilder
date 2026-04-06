package com.example.formBuilder.dto;

import com.example.formBuilder.enums.RuleOperator;
import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class RuleConditionDTO {

    private String field;

    private RuleOperator operator;

    private Object value;

    //if this is null then only one condition is apply to this field
    //this is for multicondition("AND", "OR")
    private String logicalOperator;

    private List<RuleConditionDTO> conditions;
}
