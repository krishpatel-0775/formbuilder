package com.example.formBuilder.dto;

import lombok.Getter;
import lombok.Setter;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateFormRequest {

    private String formName;
    private List<UpdateFieldRequest> fields;  // ← make sure this exact type is here
}