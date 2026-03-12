package com.example.formBuilder.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FormRequest {

    private String formName;
    private Long teamId;
    private List<FieldRequest> fields;

    /**
     * Optional list of conditional rules attached to this form.
     * Rules are serialized to JSON and stored on the Form entity.
     */
    private List<FormRuleDTO> rules;
}