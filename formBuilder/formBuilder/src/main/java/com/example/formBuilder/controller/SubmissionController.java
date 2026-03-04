package com.example.formBuilder.controller;


import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.dto.SubmissionRequest;
import com.example.formBuilder.service.FormService;
import com.example.formBuilder.service.SubmissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {

    private final SubmissionService submissionService;
    //for response submision
    @PostMapping
    public ResponseEntity<ApiResponse<String>> submitForm(@RequestBody SubmissionRequest request) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.submitForm(request), null));
    }

    //record submission delete by id
    @DeleteMapping("/{formId}/response/{responseId}")
    public ResponseEntity<ApiResponse<String>> deleteResponse(@PathVariable Long formId, @PathVariable Long responseId) {
        return ResponseEntity.ok(ApiResponse.success(submissionService.deleteResponse(formId, responseId), null));
    }
}