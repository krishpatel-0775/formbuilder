package com.example.formBuilder.controller;


import com.example.formBuilder.dto.SubmissionRequest;
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
    public ResponseEntity<?> submitForm(@RequestBody SubmissionRequest request) {

        return ResponseEntity.ok(submissionService.submitForm(request));
    }
}