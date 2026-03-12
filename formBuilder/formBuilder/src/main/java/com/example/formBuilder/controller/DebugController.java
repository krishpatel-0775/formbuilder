package com.example.formBuilder.controller;

import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.UserRole;
import com.example.formBuilder.entity.RoleModule;
import com.example.formBuilder.entity.Module;
import com.example.formBuilder.repository.*;
import com.example.formBuilder.service.ModuleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final ModuleRepository moduleRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleModuleRepository roleModuleRepository;
    private final ModuleService moduleService;

    @GetMapping("/db-status")
    public Map<String, Object> getDbStatus() {
        Map<String, Object> status = new HashMap<>();
        status.put("usersCount", userRepository.count());
        status.put("rolesCount", roleRepository.count());
        status.put("modulesCount", moduleRepository.count());
        
        status.put("allUsers", userRepository.findAll());
        status.put("allRoles", roleRepository.findAll());
        status.put("allModules", moduleRepository.findAll());
        status.put("allUserRoles", userRoleRepository.findAll());
        status.put("allRoleModules", roleModuleRepository.findAll());
        
        return status;
    }

    @GetMapping("/whoami")
    public Map<String, Object> whoAmI() {
        Map<String, Object> info = new HashMap<>();
        String username = com.example.formBuilder.security.SessionUtil.getCurrentUsername();
        info.put("currentUsername", username);
        
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth != null) {
            info.put("isAuthenticated", auth.isAuthenticated());
            info.put("name", auth.getName());
            info.put("principal", auth.getPrincipal());
        } else {
            info.put("isAuthenticated", false);
        }
        
        return info;
    }
}
