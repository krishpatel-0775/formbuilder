package com.example.formBuilder.service;

import com.example.formBuilder.entity.Role;
import com.example.formBuilder.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RoleService {

    private final RoleRepository roleRepository;

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

    public void deleteRole(UUID id) {
        roleRepository.deleteById(id);
    }
}
