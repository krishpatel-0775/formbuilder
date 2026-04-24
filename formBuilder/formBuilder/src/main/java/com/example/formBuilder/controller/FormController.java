package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.service.FormService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import jakarta.servlet.http.HttpServletResponse;


@RestController
@CrossOrigin(origins = AppConstants.FRONTEND_URL, allowCredentials = "true")
@RequestMapping(AppConstants.API_BASE_FORMS)
@RequiredArgsConstructor
public class FormController {

    private final FormService formService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FormListDto>>> getAllForms() {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllForms()));
    }

    @GetMapping(AppConstants.API_FORM_DELETED)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<FormListDto>>> getDeletedForms() {
        return ResponseEntity.ok(ApiResponse.success(formService.getDeletedForms()));
    }

    @PostMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> createForm(@Valid @RequestBody FormRequest req) {
        return ResponseEntity.ok(ApiResponse.success(formService.createForm(req), null));
    }

    @GetMapping(AppConstants.API_FORM_BY_ID)
    public ResponseEntity<ApiResponse<FormResponseDto>> getForm(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFormResponseById(id)));
    }

    @GetMapping("/{id}/data")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFormData(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID versionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllDataFromTable(id, versionId, page, size, sortBy, direction, false)));
    }

    @GetMapping(AppConstants.API_FORM_DELETED_DATA)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getDeletedFormData(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID versionId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.success(formService.getDeletedDataFromTable(id, versionId, page, size, sortBy, direction)));
    }
    

    @PostMapping(AppConstants.API_FORM_PUBLISH)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> publishForm(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(formService.publishForm(id), null));
    }

    @GetMapping(AppConstants.API_FORM_LOOKUP)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLookupValues(@PathVariable UUID id, @PathVariable String columnName) {
        return ResponseEntity.ok(ApiResponse.success(formService.getLookupValues(id, columnName)));
    }

//    @PutMapping(AppConstants.API_FORM_BY_ID)
//    public ResponseEntity<ApiResponse<String>> updateForm(
//            @PathVariable UUID id,
//            @Valid @RequestBody UpdateFormRequest req) {
//        return ResponseEntity.ok(
//                ApiResponse.success(formService.updateForm(id, req), null)
//        );
//    }

    @GetMapping(AppConstants.API_FORM_RULES)
    public ResponseEntity<ApiResponse<String>> getFormRules(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFormRules(id)));
    }

    @PostMapping(AppConstants.API_FORM_RULES)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> saveFormRules(
            @PathVariable UUID id,
            @RequestBody List<@Valid FormRuleDTO> rules) {
        return ResponseEntity.ok(ApiResponse.success(formService.saveFormRules(id, rules), null));
    }

    @DeleteMapping(AppConstants.API_FORM_BY_ID)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> deleteForm(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(formService.deleteForm(id), null));
    }

    @PutMapping(AppConstants.API_FORM_RESTORE)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<String>> restoreForm(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(formService.restoreForm(id), null));
    }

    @GetMapping(AppConstants.API_FORM_ANALYTICS)
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<FormAnalyticsDto>> getFormAnalytics(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID versionId) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFormAnalytics(id, versionId)));
    }

    @PostMapping(AppConstants.API_FORM_VIEW)
    public ResponseEntity<ApiResponse<String>> incrementViewCount(@PathVariable UUID id) {
        formService.incrementViewCount(id);
        return ResponseEntity.ok(ApiResponse.success("View counted", null));
    }

    @GetMapping("/{id}/export/csv")
    @PreAuthorize("isAuthenticated()")
    public void exportCsv(
            @PathVariable UUID id,
            @RequestParam(required = false) UUID versionId,
            HttpServletResponse response) throws IOException {
        response.setContentType("text/csv");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"form_export_" + id + ".csv\"");
        formService.exportCsv(id, versionId, response.getWriter());
    }
}
