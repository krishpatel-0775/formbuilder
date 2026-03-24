package com.example.formBuilder.controller;

import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.service.FormVersionService;
import com.example.formBuilder.constants.AppConstants;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = AppConstants.FRONTEND_URL, allowCredentials = "true")
@RequestMapping("/api/forms/{formId}/versions")
@RequiredArgsConstructor
public class FormVersionController {

    private final FormVersionService versionService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FormVersionDto>>> getVersions(@PathVariable Long formId) {
        return ResponseEntity.ok(ApiResponse.success(versionService.getVersions(formId)));
    }

    /** GET /api/forms/{formId}/versions/draft — get or create a draft version */
    @GetMapping("/draft")
    public ResponseEntity<ApiResponse<FormVersionDto>> getOrCreateDraft(@PathVariable Long formId) {
        return ResponseEntity.ok(ApiResponse.success(versionService.getOrCreateDraft(formId)));
    }

    /** POST /api/forms/{formId}/versions — create a new version (clone from latest) */
    @PostMapping
    public ResponseEntity<ApiResponse<FormVersionDto>> createVersion(
            @PathVariable Long formId,
            @RequestBody(required = false) CreateVersionRequest req) {
        return ResponseEntity.ok(ApiResponse.success(versionService.createVersion(formId)));
    }

    /** GET /api/forms/{formId}/versions/{versionId} — fetch a specific version with fields */
    @GetMapping("/{versionId}")
    public ResponseEntity<ApiResponse<FormVersionDto>> getVersion(
            @PathVariable Long formId,
            @PathVariable Long versionId) {
        return ResponseEntity.ok(ApiResponse.success(versionService.getVersion(formId, versionId)));
    }

    /** POST /api/forms/{formId}/versions/{versionId}/activate — activate a version */
    @PostMapping("/{versionId}/activate")
    public ResponseEntity<ApiResponse<FormVersionDto>> activateVersion(
            @PathVariable Long formId,
            @PathVariable Long versionId) {
        return ResponseEntity.ok(ApiResponse.success(versionService.activateVersion(formId, versionId)));
    }

    /** PUT /api/forms/{formId}/versions/{versionId} — update version fields */
    @PutMapping("/{versionId}")
    public ResponseEntity<ApiResponse<FormVersionDto>> updateVersionFields(
            @PathVariable Long formId,
            @PathVariable Long versionId,
            @RequestBody List<UpdateFieldRequest> fields) {
        FormVersionDto newVersion = versionService.updateVersionFields(versionId, fields);
        return ResponseEntity.ok(ApiResponse.success(newVersion));
    }

    /** POST /api/forms/{formId}/versions/{versionId}/rules — update version rules */
    @PostMapping("/{versionId}/rules")
    public ResponseEntity<ApiResponse<Void>> updateVersionRules(
            @PathVariable Long formId,
            @PathVariable Long versionId,
            @RequestBody List<FormRuleDTO> rules) {
        try {
            String rulesJson = new ObjectMapper().writeValueAsString(rules);
            versionService.updateVersionRules(versionId, rulesJson);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to serialize rules"));
        }
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
