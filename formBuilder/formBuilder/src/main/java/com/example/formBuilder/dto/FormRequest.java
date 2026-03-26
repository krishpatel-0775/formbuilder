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
public class FormRequest {

    @NotBlank(message = "Form name is required")
    @Size(min = 3, max = 50, message = "Form name must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-z][a-z0-9_]{2,49}$", message = "Invalid form name: Only lowercase letters, numbers, and underscores are allowed. Must start with a letter.")
    private String formName;

    @NotEmpty(message = "At least one field is required")
    @Valid
    private List<FieldRequest> fields;

    @Valid
    private List<FormRuleDTO> rules;
}