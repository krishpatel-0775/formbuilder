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
    private Map<String, Object> stats;
}
