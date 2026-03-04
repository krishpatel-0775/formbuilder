package com.example.formBuilder.controller;


import com.example.formBuilder.dto.FieldRequest;
import com.example.formBuilder.dto.FormListDto;
import com.example.formBuilder.dto.FormRequest;
import com.example.formBuilder.dto.SubmissionRequest;
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
    public List<FormListDto> getAllForms() {
        return formService.getAllForms();
    }

    // this for form build
    @PostMapping
    public ResponseEntity<?> createForm(@RequestBody FormRequest request) {


        return ResponseEntity.ok(formService.createForm(request));
    }

    // get form by id
    @GetMapping("/{id}")
    public ResponseEntity<Form> getForm(@PathVariable Long id) {
        return ResponseEntity.ok(formService.getFormById(id));
    }

    // get form data by id
    @GetMapping("/data/{id}")
    public ResponseEntity<List<Map<String, Object>>> getFormData(@PathVariable Long id) {

        return ResponseEntity.ok(formService.getAllDataFromTable(id));
    }


    // form publish endpoint
    @PostMapping("/publish/{id}")
    public ResponseEntity<?> publishForm(@PathVariable Long id) {
        return ResponseEntity.ok(formService.publishForm(id));
    }

    //record submission delete by id
    @DeleteMapping("/{formId}/response/{responseId}")
    public ResponseEntity<?> deleteResponse(@PathVariable Long formId, @PathVariable Long responseId) {

        return ResponseEntity.ok(formService.deleteResponse(formId, responseId));
    }

    // get dynamic lookup values for a form's column
    @GetMapping("/{id}/lookup/{columnName}")
    public ResponseEntity<List<String>> getLookupValues(@PathVariable Long id, @PathVariable String columnName) {
        return ResponseEntity.ok(formService.getLookupValues(id, columnName));
    }

}