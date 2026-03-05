package com.example.formBuilder.controller;


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
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/forms")
@RequiredArgsConstructor
public class FormController {

    private final FormService formService;

    // get all forms
    @GetMapping
    public ResponseEntity<ApiResponse<List<FormListDto>>> getAllForms() {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllForms()));
    }

    // this for form build
    @PostMapping
    public ResponseEntity<ApiResponse<String>> createForm(@RequestBody FormRequest request) {
        return ResponseEntity.ok(ApiResponse.success(formService.createForm(request), null));
    }

    // get form by id
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Form>> getForm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getFormById(id)));
    }

    // get form data by id
    @GetMapping("/data/{id}")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getFormData(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.getAllDataFromTable(id)));
    }


    // form publish endpoint
    @PostMapping("/publish/{id}")
    public ResponseEntity<ApiResponse<String>> publishForm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(formService.publishForm(id), null));
    }

    // get dynamic lookup values for a form's column
    @GetMapping("/{id}/lookup/{columnName}")
    public ResponseEntity<ApiResponse<List<String>>> getLookupValues(@PathVariable Long id, @PathVariable String columnName) {
        return ResponseEntity.ok(ApiResponse.success(formService.getLookupValues(id, columnName)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> updateForm(
            @PathVariable Long id,
            @RequestBody UpdateFormRequest request) {
        return ResponseEntity.ok(
                ApiResponse.success(formService.updateForm(id, request), null)
        );
    }

}