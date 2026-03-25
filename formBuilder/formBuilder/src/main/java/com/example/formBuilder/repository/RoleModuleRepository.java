package com.example.formBuilder.repository;

import com.example.formBuilder.entity.RoleModule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RoleModuleRepository extends JpaRepository<RoleModule, UUID> {
    List<RoleModule> findByRoleId(UUID roleId);
    List<RoleModule> findByRoleIdIn(List<UUID> roleIds);
    List<RoleModule> findByModuleId(UUID moduleId);
    void deleteByRoleId(UUID roleId);
}
