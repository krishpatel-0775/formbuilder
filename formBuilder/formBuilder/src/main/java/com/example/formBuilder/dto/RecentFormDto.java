package com.example.formBuilder.dto;
 
import com.example.formBuilder.enums.FormStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
import java.time.LocalDateTime;
import java.util.UUID;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RecentFormDto {
    private UUID id;
    private String formName;
    private FormStatus status;
    private LocalDateTime updatedAt;
}
