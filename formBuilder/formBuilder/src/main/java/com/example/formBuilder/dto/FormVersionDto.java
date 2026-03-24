package com.example.formBuilder.dto;

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
public class FormVersionDto {
    private Long id;
    private Long formId;
    private Integer versionNumber;
    private Boolean isActive;
    private Boolean isLatest;
    private String createdBy;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String rules;
    private List<FormFieldResponseDto> fields;
}
