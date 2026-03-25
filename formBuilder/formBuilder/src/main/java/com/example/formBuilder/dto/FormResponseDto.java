package com.example.formBuilder.dto;

import com.example.formBuilder.enums.FormStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormResponseDto {
    private UUID id;
    private String formName;
    private String code;
    private String tableName;
    private LocalDateTime createdAt;
    private FormStatus status;
    private String rules;
    private List<FormFieldResponseDto> fields;
}
