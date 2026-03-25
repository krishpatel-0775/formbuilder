package com.example.formBuilder.service;

import com.example.formBuilder.entity.Module;
import com.example.formBuilder.entity.RoleModule;
import com.example.formBuilder.repository.ModuleRepository;
import com.example.formBuilder.repository.RoleModuleRepository;
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

    public List<Module> getModulesByRole(UUID roleId) {
        List<RoleModule> mappings = roleModuleRepository.findByRoleId(roleId);
        List<UUID> moduleIds = mappings.stream().map(RoleModule::getModuleId).collect(Collectors.toList());
        return moduleRepository.findAllById(moduleIds);
    }

    @Transactional
    public void assignModulesToRole(UUID roleId, List<UUID> moduleIds) {
        roleModuleRepository.deleteByRoleId(roleId);
        for (UUID moduleId : moduleIds) {
            RoleModule mapping = RoleModule.builder()
                    .roleId(roleId)
                    .moduleId(moduleId)
                    .build();
            roleModuleRepository.save(mapping);
        }
    }
}
