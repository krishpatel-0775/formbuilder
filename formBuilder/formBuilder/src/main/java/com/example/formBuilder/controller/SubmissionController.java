package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.DraftRequest;
import com.example.formBuilder.dto.DraftResponse;
import com.example.formBuilder.dto.SubmissionDetailDTO;
import com.example.formBuilder.dto.SubmissionRequest;
import com.example.formBuilder.service.FormService;
import com.example.formBuilder.service.RuleEngineService;
import com.example.formBuilder.service.SubmissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@CrossOrigin(origins = AppConstants.FRONTEND_URL, allowCredentials = "true")
@RequestMapping(AppConstants.API_BASE_SUBMISSIONS)
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    private final FormService formService;
    private final RuleEngineService ruleEngineService;

    // Submits a new response for a specific form and persists it to the dynamic table.
    @PostMapping
    public ResponseEntity<ApiResponse<String>> submitForm(@Valid @RequestBody SubmissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.submitForm(request), null));
    }
 
    @PostMapping("/draft")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DraftResponse>> saveDraft(@RequestBody DraftRequest request) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.saveDraft(request)));
    }
 
    @GetMapping("/draft")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<DraftResponse>> getDraft(@RequestParam UUID formId) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.getDraft(formId)));
    }

    @GetMapping("/{formId}/response/{responseId}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<SubmissionDetailDTO>> getSubmissionDetail(
            @PathVariable UUID formId,
            @PathVariable UUID responseId) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.getSubmissionDetail(formId, responseId)));
    }


    // Soft-deletes a specific submission record from a form's dynamic table.
    @DeleteMapping(AppConstants.API_SUBMISSION_DELETE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> deleteResponse(@PathVariable UUID formId, @PathVariable UUID responseId) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.deleteResponse(formId, responseId), null));
    }

    @PutMapping(AppConstants.API_SUBMISSION_RESTORE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> restoreResponse(@PathVariable UUID formId, @PathVariable UUID responseId) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.restoreResponse(formId, responseId), null));
    }

    // Bulk soft-deletes submission records.
    @PostMapping(AppConstants.API_SUBMISSION_BULK_DELETE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> deleteBulkResponses(@PathVariable UUID formId, @RequestBody List<UUID> responseIds) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.deleteResponses(formId, responseIds), null));
    }

    @PostMapping(AppConstants.API_SUBMISSION_BULK_RESTORE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> restoreBulkResponses(@PathVariable UUID formId, @RequestBody List<UUID> responseIds) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.restoreResponses(formId, responseIds), null));
    }
}