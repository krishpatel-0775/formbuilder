package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.SubmissionRequest;
import com.example.formBuilder.service.FormService;
import com.example.formBuilder.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = AppConstants.FRONTEND_URL)
@RequestMapping(AppConstants.API_BASE_SUBMISSIONS)
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;

    // Submits a new response for a specific form and persists it to the dynamic table.
    @PostMapping
    public ResponseEntity<ApiResponse<String>> submitForm(@RequestBody SubmissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.submitForm(request), null));
    }



    // Soft-deletes a specific submission record from a form's dynamic table.
    @DeleteMapping(AppConstants.API_SUBMISSION_DELETE)
    public ResponseEntity<ApiResponse<String>> deleteResponse(@PathVariable Long formId, @PathVariable Long responseId) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.deleteResponse(formId, responseId), null));
    }
}