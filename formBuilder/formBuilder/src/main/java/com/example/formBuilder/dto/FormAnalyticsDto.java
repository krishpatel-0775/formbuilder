package com.example.formBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FormAnalyticsDto {
    private long totalSubmissions;
    private long draftCount;
    private long submittedCount;
    private long totalViews;
    private double engagementRate;
    private List<Map<String, Object>> submissionTrend; // List of { date: "2023-01-01", count: 5 }
    private List<FieldStatDto> fieldAnalytics;
    private List<FormVersionDto> availableVersions;
    private UUID selectedVersionId;
}
