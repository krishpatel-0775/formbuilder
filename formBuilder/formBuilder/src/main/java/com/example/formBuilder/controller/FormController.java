package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.FormListDto;
import com.example.formBuilder.dto.FormRequest;
import com.example.formBuilder.dto.FormRuleDTO;
import com.example.formBuilder.dto.FormResponseDto;
import com.example.formBuilder.dto.UpdateFormRequest;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.service.FormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = AppConstants.FRONTEND_URL, allowCredentials = "true")
@RequestMapping(AppConstants.API_BASE_FORMS)
@RequiredArgsConstructor
public class FormController {

    private final FormService formService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<FormListDto>>> getAllForms() {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllForms()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> createForm(@RequestBody FormRequest req) {
        return ResponseEntity.ok(ApiResponse.success(formService.createForm(req), null));
    }

    @GetMapping(AppConstants.API_FORM_BY_ID)
    public ResponseEntity<ApiResponse<FormResponseDto>> getForm(@PathVariable Long id) {
        System.out.println("bakaziki");
        return ResponseEntity.ok(ApiResponse.success(formService.getFormResponseById(id)));
    }

//    @GetMapping(AppConstants.API_FORM_DATA)
//    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFormData(@PathVariable Long id) {
//        return ResponseEntity.ok(ApiResponse.success(formService.getAllDataFromTable(id)));
//    }

    @GetMapping("/{id}/data")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getFormData(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "asc") String direction
    ) {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllDataFromTable(id, page, size, sortBy, direction)));
    }

    @PostMapping(AppConstants.API_FORM_PUBLISH)
    public ResponseEntity<ApiResponse<String>> publishForm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.publishForm(id), null));
    }

    @GetMapping(AppConstants.API_FORM_LOOKUP)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getLookupValues(@PathVariable Long id, @PathVariable String columnName) {
        return ResponseEntity.ok(ApiResponse.success(formService.getLookupValues(id, columnName)));
    }

    @PutMapping(AppConstants.API_FORM_BY_ID)
    public ResponseEntity<ApiResponse<String>> updateForm(
            @PathVariable Long id,
            @RequestBody UpdateFormRequest req) {
        return ResponseEntity.ok(
                ApiResponse.success(formService.updateForm(id, req), null)
        );
    }

    @GetMapping(AppConstants.API_FORM_RULES)
    public ResponseEntity<ApiResponse<String>> getFormRules(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFormRules(id)));
    }

    @PostMapping(AppConstants.API_FORM_RULES)
    public ResponseEntity<ApiResponse<String>> saveFormRules(
            @PathVariable Long id,
            @RequestBody java.util.List<FormRuleDTO> rules) {
        return ResponseEntity.ok(ApiResponse.success(formService.saveFormRules(id, rules), null));
    }

    @DeleteMapping(AppConstants.API_FORM_BY_ID)
    public ResponseEntity<ApiResponse<String>> deleteForm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.deleteForm(id), null));
    }
}