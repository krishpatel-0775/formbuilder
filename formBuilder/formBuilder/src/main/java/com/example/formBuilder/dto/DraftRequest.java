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
public class DraftRequest {
    private UUID formId;
    private UUID formVersionId;
    private Map<String, Object> data;
}
