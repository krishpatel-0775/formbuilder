package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.SubmissionRequest;
import com.example.formBuilder.service.FormService;
import com.example.formBuilder.service.RuleEngineService;
import com.example.formBuilder.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = AppConstants.FRONTEND_URL)
@RequestMapping(AppConstants.API_BASE_SUBMISSIONS)
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    private final FormService formService;
    private final RuleEngineService ruleEngineService;

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

    /**
     * Evaluates the current field visibility state based on the provided field values.
     * Call this endpoint as the user fills in the form to dynamically show/hide fields.
     *
     * @param formId the ID of the form whose rules will be evaluated
     * @param values the current map of field names to values
     * @return a map of field names to their visibility state ("SHOW" or "HIDE")
     */
    @PostMapping(AppConstants.API_SUBMISSION_VISIBILITY)
    public ResponseEntity<ApiResponse<Map<String, String>>> evaluateVisibility(
            @RequestParam Long formId,
            @RequestBody Map<String, Object> values) {
        var form = formService.getFormById(formId);
        Map<String, String> visibility = ruleEngineService.evaluateVisibility(form, values);
        return ResponseEntity.ok(ApiResponse.success(visibility));
    }
}