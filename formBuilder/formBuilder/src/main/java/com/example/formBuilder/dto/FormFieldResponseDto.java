package com.example.formBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormFieldResponseDto {
    private Long id;
    private String fieldName;
    private String fieldType;
    private Boolean required;
    private Integer minLength;
    private Integer maxLength;
    private Integer min;
    private Integer max;
    private String pattern;
    private LocalDate beforeDate;
    private LocalDate afterDate;
    private String afterTime;
    private String beforeTime;
    private List<String> options;
    private String sourceTable;
    private String sourceColumn;
    private String defaultValue;
    private Integer maxFileSize;
    private String allowedFileTypes;
}
