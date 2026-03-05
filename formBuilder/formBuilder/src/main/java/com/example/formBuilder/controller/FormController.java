package com.example.formBuilder.controller;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.FormListDto;
import com.example.formBuilder.dto.FormRequest;
import com.example.formBuilder.dto.UpdateFormRequest;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.service.FormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@CrossOrigin(origins = AppConstants.FRONTEND_URL)
@RequestMapping(AppConstants.API_BASE_FORMS)
@RequiredArgsConstructor
public class FormController {

    private final FormService formService;

    // Retrieves a summary list of all available forms.
    @GetMapping
    public ResponseEntity<ApiResponse<List<FormListDto>>> getAllForms() {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllForms()));
    }

    // Creates a new form structure and saves its field definitions.
    @PostMapping
    public ResponseEntity<ApiResponse<String>> createForm(@RequestBody FormRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formService.createForm(request), null));
    }

    // Retrieves the metadata and structure for a specific form by its ID.
    @GetMapping(AppConstants.API_FORM_BY_ID)
    public ResponseEntity<ApiResponse<Form>> getForm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFormById(id)));
    }

    // Retrieves all submitted data responses for a specific published form.
    @GetMapping(AppConstants.API_FORM_DATA)
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFormData(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllDataFromTable(id)));
    }


    // Publishes a form, moving it out of draft state and generating its dynamic database table.
    @PostMapping(AppConstants.API_FORM_PUBLISH)
    public ResponseEntity<ApiResponse<String>> publishForm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.publishForm(id), null));
    }

    // Retrieves dynamic drop-down lookup values from a specific column of a published form.
    @GetMapping(AppConstants.API_FORM_LOOKUP)
    public ResponseEntity<ApiResponse<List<String>>> getLookupValues(@PathVariable Long id, @PathVariable String columnName) {
        return ResponseEntity.ok(ApiResponse.success(formService.getLookupValues(id, columnName)));
    }

    @PutMapping(AppConstants.API_FORM_BY_ID)
    public ResponseEntity<ApiResponse<String>> updateForm(
            @PathVariable Long id,
            @RequestBody UpdateFormRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(formService.updateForm(id, request), null)
        );
    }

}