package com.example.formBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class FieldRequest {

    @NotBlank(message = "Field name is required")
    private String name;

    @NotBlank(message = "Field type is required")
    private String type;

    private Boolean required;
    private Integer minLength;
    private Integer maxLength;
    private Integer min;
    private Integer max;
    private String pattern;
    private String beforeDate;
    private String afterDate;
    private Integer maxFileSize; // in MB
    private String allowedFileTypes;
    private List<String> options;
    private String defaultValue;
    private String sourceTable;
    private String sourceColumn;
    private String afterTime;
    private String beforeTime;
    private Boolean isReadOnly;
}
