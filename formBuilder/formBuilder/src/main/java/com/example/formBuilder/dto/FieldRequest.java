package com.example.formBuilder.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
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

    private String fieldKey;

    @NotBlank(message = "Field type is required")
    private String type;

    private Boolean required;
    private Integer minLength;
    private Integer maxLength;
    private Double min;
    private Double max;
    private String pattern;
    private String beforeDate;
    private String afterDate;
    private Integer maxFileSize; // in MB
    private String allowedFileTypes;
    private List<String> options;
    private String defaultValue;
    private String placeholder;
    private String helperText;
    private String sourceTable;
    private String sourceColumn;
    private String afterTime;
    private String beforeTime;
    private String beforeDatetime;
    private String afterDatetime;
    private Boolean isReadOnly;

    @JsonProperty("isMultiSelect")
    private Boolean isMultiSelect;

    @JsonProperty("isUnique")
    private Boolean isUnique;

    @JsonProperty("isCalculated")
    private Boolean isCalculated;

    private String calculationFormula;

}
