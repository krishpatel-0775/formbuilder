package com.example.formBuilder.util;

import com.example.formBuilder.entity.Module;
import com.example.formBuilder.entity.Role;
import com.example.formBuilder.entity.RoleModule;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.UserRole;
import com.example.formBuilder.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final ModuleRepository moduleRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleModuleRepository roleModuleRepository;

    @Override
    public void run(String... args) throws Exception {
        if (moduleRepository.count() > 0) return;

        // 1. Create Roles
        Role adminRole = roleRepository.save(Role.builder()
                .roleName("SYSTEM_ADMIN")
                .roleDescription("Full access to all system modules")
                .build());

        // 2. Create Parent Modules
        Module formsParent = moduleRepository.save(Module.builder()
                .moduleName("Forms Management")
                .moduleDescription("Create and manage your forms")
                .isParent(true)
                .iconCss("file-text")
                .active(true)
                .build());

        Module adminParent = moduleRepository.save(Module.builder()
                .moduleName("System Admin")
                .moduleDescription("Manage modules and roles")
                .isParent(true)
                .iconCss("shield")
                .active(true)
                .build());

        // 3. Create Links
        Module formVault = moduleRepository.save(Module.builder()
                .moduleName("Form Vault")
                .prefix("/forms/all")
                .parentId(formsParent.getId())
                .active(true)
                .build());

        Module createForm = moduleRepository.save(Module.builder()
                .moduleName("Create New Form")
                .prefix("/")
                .parentId(formsParent.getId())
                .active(true)
                .build());

        Module moduleMgmt = moduleRepository.save(Module.builder()
                .moduleName("Module Management")
                .prefix("/admin/modules")
                .parentId(adminParent.getId())
                .active(true)
                .build());

        Module roleMgmt = moduleRepository.save(Module.builder()
                .moduleName("Role Management")
                .prefix("/admin/roles")
                .parentId(adminParent.getId())
                .active(true)
                .build());

        // 4. Map Modules to Role
        for (UUID modId : Arrays.asList(formsParent.getId(), adminParent.getId(), formVault.getId(), createForm.getId(), moduleMgmt.getId(), roleMgmt.getId())) {
            roleModuleRepository.save(RoleModule.builder()
                    .roleId(adminRole.getId())
                    .moduleId(modId)
                    .build());
        }

        // 5. Assign Role to existing users (for demo)
        userRepository.findAll().forEach(user -> {
            if (userRoleRepository.findByUserId(user.getId()).isEmpty()) {
                userRoleRepository.save(UserRole.builder()
                        .userId(user.getId())
                        .roleId(adminRole.getId())
                        .build());
            }
        });
    }
}
