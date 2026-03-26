package com.example.formBuilder.dto;
 
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
import java.util.Map;
import java.util.UUID;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DraftResponse {
    private UUID submissionId;
    private UUID formVersionId;
    private Map<String, Object> data;
    private String status;
}
