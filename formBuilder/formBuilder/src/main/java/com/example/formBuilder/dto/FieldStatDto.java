package com.example.formBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FieldStatDto {
    private String fieldLabel;
    private String fieldName;
    private String fieldType;
    /** Percentage (0-100) of submitted rows where this field has a non-null, non-empty response */
    private double fillRate;
    private Map<String, Object> stats;
}
