package com.example.formBuilder.controller;

import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.entity.Module;
import com.example.formBuilder.service.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class ModuleController {

    private final ModuleService moduleService;

    @PostMapping("/modules")
    public ResponseEntity<ApiResponse<Module>> createModule(@RequestBody Module module) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.createModule(module)));
    }

    @PutMapping("/modules/{id}")
    public ResponseEntity<ApiResponse<Module>> updateModule(@PathVariable Long id, @RequestBody Module module) {
        return ResponseEntity.ok(ApiResponse.success(moduleService.updateModule(id, module)));
    }

    @GetMapping("/modules")
    public ResponseEntity<ApiResponse<List<Module>>> getAllModules() {
        return ResponseEntity.ok(ApiResponse.success(moduleService.getAllModules()));
    }

    @GetMapping("/menu")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getUserMenu() {
        return ResponseEntity.ok(ApiResponse.success(moduleService.getUserMenu()));
    }

    @PostMapping("/modules/seed")
    public ResponseEntity<ApiResponse<String>> seedModules() {
        moduleService.seedModules();
        return ResponseEntity.ok(ApiResponse.success("System seeded successfully"));
    }
}
