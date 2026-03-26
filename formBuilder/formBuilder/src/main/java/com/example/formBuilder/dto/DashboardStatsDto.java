package com.example.formBuilder.dto;
 
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
 
import java.util.List;
 
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DashboardStatsDto {
    private long totalForms;
    private long draftForms;
    private long publishedForms;
    private long totalSubmissions;
    private List<RecentFormDto> recentForms;
}
