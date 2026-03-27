package com.example.formBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

@Getter
@Setter
public class UpdateFieldRequest {
    private UUID id;            // NULL = new field, non-null = existing field
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
    private List<String> options;
    private String defaultValue;
    private String placeholder;
    private String helperText;
    private String sourceTable;
    private String sourceColumn;
    private String afterTime;
    private String beforeTime;
    private Integer maxFileSize;
    private String allowedFileTypes;
    private Boolean isReadOnly;
    @com.fasterxml.jackson.annotation.JsonProperty("isMultiSelect")
    private Boolean isMultiSelect;

}
