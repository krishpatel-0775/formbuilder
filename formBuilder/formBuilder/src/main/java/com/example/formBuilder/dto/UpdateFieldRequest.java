package com.example.formBuilder.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateFieldRequest {
    private Long id;            // NULL = new field, non-null = existing field
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
    private String sourceTable;
    private String sourceColumn;
    private String afterTime;
    private String beforeTime;
    private Integer maxFileSize;
    private String allowedFileTypes;
    private Boolean isReadOnly;
}
