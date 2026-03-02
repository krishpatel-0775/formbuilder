package com.example.formBuilder.dto;


import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FieldRequest {

    private String name;
    private String type;

    private Boolean required;
    private Integer minLength;
    private Integer maxLength;
    private Integer min;
    private Integer max;
    private String pattern;
}
