package com.example.formBuilder.repository;

import com.example.formBuilder.entity.RoleModule;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RoleModuleRepository extends JpaRepository<RoleModule, Long> {
    List<RoleModule> findByRoleId(Long roleId);
    List<RoleModule> findByRoleIdIn(List<Long> roleIds);
    void deleteByRoleId(Long roleId);
}
