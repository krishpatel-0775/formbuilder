package com.example.formBuilder.service;

import com.example.formBuilder.entity.Role;
import com.example.formBuilder.repository.RoleRepository;
import com.example.formBuilder.repository.RoleModuleRepository;
import com.example.formBuilder.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;
    private final RoleModuleRepository roleModuleRepository;
    private final UserRoleRepository userRoleRepository;

    public List<Role> getAllRoles() {
        return roleRepository.findAll();
    }

    public Role createRole(Role role) {
        return roleRepository.save(role);
    }

    public Role updateRole(UUID id, Role roleDetails) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Role not found"));
        role.setRoleName(roleDetails.getRoleName());
        role.setRoleDescription(roleDetails.getRoleDescription());
        return roleRepository.save(role);
    }

    @Transactional
    public void deleteRole(UUID id) {
        // First delete mappings to avoid foreign key constraints
        roleModuleRepository.deleteByRole_Id(id);
        userRoleRepository.deleteByRole_Id(id);
        
        // Then delete the role itself
        roleRepository.deleteById(id);
    }
}
