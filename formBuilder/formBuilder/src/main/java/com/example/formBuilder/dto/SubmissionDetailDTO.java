package com.example.formBuilder.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmissionDetailDTO {
    private UUID id;
    private String submittedBy;
    private LocalDateTime submittedAt;
    private String status;
    private Map<String, Object> data;
    private Map<String, String> fieldLabels;
    private Map<String, String> fieldTypes;
}
