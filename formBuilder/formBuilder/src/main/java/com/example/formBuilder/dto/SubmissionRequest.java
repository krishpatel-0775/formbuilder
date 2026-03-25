package com.example.formBuilder.dto;



import lombok.Getter;
import lombok.Setter;

import java.util.Map;
import java.util.UUID;

@Getter
@Setter
public class SubmissionRequest {

    private UUID formId;
    private UUID versionId;
    private Boolean isDraft;
    private Map<String, Object> values;
}
