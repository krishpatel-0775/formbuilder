package com.example.formBuilder.dto;


import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

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
    private String beforeDate;   // max allowed date
    private String afterDate;    // min allowed date   // min date allowed
    private java.util.List<String> options;
}
