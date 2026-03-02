package com.example.formBuilder.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.Map;

@Getter
@AllArgsConstructor
public class SubmissionResponse {

    private Long submissionId;
    private Long formId;
    private Map<String, Object> values;
}
