package com.example.formBuilder.controller;

import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.entity.Module;
import com.example.formBuilder.service.RoleModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/roles/{roleId}/modules")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class RoleModuleController {

    private final RoleModuleService roleModuleService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Module>>> getModulesByRole(@PathVariable Long roleId) {
        return ResponseEntity.ok(ApiResponse.success(roleModuleService.getModulesByRole(roleId)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<String>> assignModulesToRole(@PathVariable Long roleId, @RequestBody List<Long> moduleIds) {
        roleModuleService.assignModulesToRole(roleId, moduleIds);
        return ResponseEntity.ok(ApiResponse.success("Modules assigned to role successfully"));
    }
}
