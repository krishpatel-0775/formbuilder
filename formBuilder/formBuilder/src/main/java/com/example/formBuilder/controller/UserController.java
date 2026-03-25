package com.example.formBuilder.controller;

import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.UserRole;
import com.example.formBuilder.repository.UserRepository;
import com.example.formBuilder.repository.UserRoleRepository;
import com.example.formBuilder.service.AuthService;
import com.example.formBuilder.security.SessionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final AuthService authService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> getAllUsersWithRoles() {
        List<User> users = userRepository.findAll();
        List<Map<String, Object>> userList = users.stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("email", user.getEmail());
            map.put("name", user.getName());
            
            List<UUID> roles = userRoleRepository.findByUserId(user.getId())
                    .stream()
                    .map(UserRole::getRoleId)
                    .collect(Collectors.toList());
            map.put("roleIds", roles);
            return map;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success(userList));
    }

    @PostMapping("/{userId}/roles")
    @Transactional
    public ResponseEntity<ApiResponse<String>> assignRoles(@PathVariable UUID userId, @RequestBody List<UUID> roleIds) {
        // Remove existing roles
        List<UserRole> currentRoles = userRoleRepository.findByUserId(userId);
        userRoleRepository.deleteAll(currentRoles);

        // Add new roles
        List<UserRole> newRoles = roleIds.stream().map(roleId -> 
            UserRole.builder().userId(userId).roleId(roleId).build()
        ).collect(Collectors.toList());
        
        userRoleRepository.saveAll(newRoles);

        // Refresh security context if the updated user is the current user
        String currentUsername = SessionUtil.getCurrentUsername();
        userRepository.findById(userId).ifPresent(user -> {
            if (user.getUsername().equals(currentUsername)) {
                authService.refreshSecurityContext(currentUsername);
            }
        });

        return ResponseEntity.ok(ApiResponse.success("Roles updated successfully"));
    }
}
