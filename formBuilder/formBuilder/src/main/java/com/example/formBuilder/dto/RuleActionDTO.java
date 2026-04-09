package com.example.formBuilder.dto;

import com.example.formBuilder.enums.ActionType;
import com.example.formBuilder.enums.RuleScope;
import com.fasterxml.jackson.annotation.JsonInclude;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@JsonInclude(JsonInclude.Include.NON_EMPTY)
public class RuleActionDTO {

    @NotNull(message = "Action type is required")
    private ActionType type;

    private String targetField;

    private String message;

    private RuleScope scope;
}
