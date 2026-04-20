package com.example.formBuilder.service;

import com.example.formBuilder.entity.Module;
import com.example.formBuilder.entity.Role;
import com.example.formBuilder.entity.RoleModule;
import com.example.formBuilder.repository.ModuleRepository;
import com.example.formBuilder.repository.RoleModuleRepository;
import com.example.formBuilder.repository.RoleRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RoleModuleService {

    private final RoleModuleRepository roleModuleRepository;
    private final ModuleRepository moduleRepository;
    private final RoleRepository roleRepository;

    public List<Module> getModulesByRole(UUID roleId) {
        List<RoleModule> mappings = roleModuleRepository.findByRole_Id(roleId);
        List<UUID> moduleIds = mappings.stream().map(rm -> rm.getModule().getId()).collect(Collectors.toList());
        return moduleRepository.findAllById(moduleIds);
    }

    @Transactional
    public void assignModulesToRole(UUID roleId, List<UUID> moduleIds) {
        roleModuleRepository.deleteByRole_Id(roleId);
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        
        for (UUID moduleId : moduleIds) {
            Module module = moduleRepository.findById(moduleId)
                    .orElseThrow(() -> new RuntimeException("Module not found"));
            
            RoleModule mapping = RoleModule.builder()
                    .role(role)
                    .module(module)
                    .build();
            roleModuleRepository.save(mapping);
        }
    }
}
