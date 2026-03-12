package com.example.formBuilder.dto;

import com.example.formBuilder.enums.FormStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormResponseDto {
    private Long id;
    private String formName;
    private String tableName;
    private LocalDateTime createdAt;
    private FormStatus status;
    private String rules;
    private List<FormFieldResponseDto> fields;
    private Long teamId;
}
