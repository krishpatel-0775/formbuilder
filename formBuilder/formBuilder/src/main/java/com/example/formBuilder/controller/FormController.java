package com.example.formBuilder.controller;


import com.example.formBuilder.dto.FieldRequest;
import com.example.formBuilder.dto.FormListDto;
import com.example.formBuilder.dto.FormRequest;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.service.FormService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
}