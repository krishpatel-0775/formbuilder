package com.example.formBuilder.repository;

import com.example.formBuilder.entity.RoleModule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface RoleModuleRepository extends JpaRepository<RoleModule, UUID> {
    List<RoleModule> findByRole_Id(UUID roleId);
    List<RoleModule> findByRole_IdIn(List<UUID> roleIds);
    List<RoleModule> findByModule_Id(UUID moduleId);
    void deleteByRole_Id(UUID roleId);
}
