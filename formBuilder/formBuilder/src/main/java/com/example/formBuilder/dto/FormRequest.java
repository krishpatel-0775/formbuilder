package com.example.formBuilder.dto;


import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class FormRequest {

    private String formName;
    private List<FieldRequest> fields;
}