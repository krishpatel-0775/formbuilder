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
    private long submittedCount;
    private long totalViews;
    private double engagementRate;

    /** Average number of submissions per day over the trend window */
    private double avgSubmissionsPerDay;

    /** The calendar date with the highest number of submissions (ISO-8601 string) */
    private String peakDay;

    /** Number of submissions on the peak day */
    private long peakCount;

    private List<Map<String, Object>> submissionTrend; // List of { date: "2023-01-01", count: 5 }
    private List<Map<String, Object>> dayOfWeekTrend;  // List of { day: "Monday", count: 5 }
    private List<FieldStatDto> fieldAnalytics;
    private List<FormVersionDto> availableVersions;
    private UUID selectedVersionId;
}
