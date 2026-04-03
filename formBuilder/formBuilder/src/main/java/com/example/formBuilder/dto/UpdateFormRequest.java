package com.example.formBuilder.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateFormRequest {

    @NotBlank(message = "Form name is required")
    @Size(min = 3, max = 100, message = "Form name must be between 3 and 100 characters")
    private String formName;

    @NotEmpty(message = "At least one field is required")
    @Valid
    private List<UpdateFieldRequest> fields;  // ← make sure this exact type is here

    @Valid
    private List<FormRuleDTO> rules;
}