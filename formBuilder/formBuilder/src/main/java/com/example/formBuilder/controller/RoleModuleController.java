package com.example.formBuilder.controller;

import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.entity.Module;
import com.example.formBuilder.service.RoleModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/roles/{roleId}/modules")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class RoleModuleController {

    private final RoleModuleService roleModuleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Module>>> getModulesByRole(@PathVariable UUID roleId) {
        return ResponseEntity.ok(ApiResponse.success(roleModuleService.getModulesByRole(roleId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> assignModulesToRole(@PathVariable UUID roleId, @RequestBody List<UUID> moduleIds) {
        roleModuleService.assignModulesToRole(roleId, moduleIds);
        return ResponseEntity.ok(ApiResponse.success("Modules assigned to role successfully"));
    }
}
