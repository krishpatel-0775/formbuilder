package com.example.formBuilder.controller;

import com.example.formBuilder.dto.ApiResponse;
import com.example.formBuilder.entity.Role;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.UserRole;
import com.example.formBuilder.repository.RoleRepository;
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
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@org.springframework.security.access.prepost.PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class UserController {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
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
            
            List<UUID> roles = userRoleRepository.findByUser_Id(user.getId())
                    .stream()
                    .map(ur -> ur.getRole().getId())
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
        List<UserRole> currentRoles = userRoleRepository.findByUser_Id(userId);
        userRoleRepository.deleteAll(currentRoles);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Add new roles
        List<UserRole> newRoles = roleIds.stream().map(roleId -> {
            Role role = roleRepository.findById(roleId)
                    .orElseThrow(() -> new RuntimeException("Role not found"));
            return UserRole.builder().user(user).role(role).build();
        }).collect(Collectors.toList());
        
        userRoleRepository.saveAll(newRoles);

        // Refresh security context if the updated user is the current user
        String currentUsername = SessionUtil.getCurrentUsername();
        if (user.getUsername().equals(currentUsername)) {
            authService.refreshSecurityContext(currentUsername);
        }

        return ResponseEntity.ok(ApiResponse.success("Roles updated successfully"));
    }
}
