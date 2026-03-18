package com.example.formBuilder.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FormRequest {

    @NotBlank(message = "Form name is required")
    private String formName;

    @NotEmpty(message = "At least one field is required")
    @Valid
    private List<FieldRequest> fields;

    @Valid
    private List<FormRuleDTO> rules;
}