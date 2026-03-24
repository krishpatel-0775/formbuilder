package com.example.formBuilder.dto;



import lombok.Getter;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
public class SubmissionRequest {

    private Long formId;
    private Long versionId;
    private Boolean isDraft;
    private Map<String, Object> values;
}
