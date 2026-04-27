package com.example.formBuilder.repository;

import com.example.formBuilder.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    List<UserRole> findByUser_Id(UUID userId);

    List<UserRole> findByRole_Id(UUID roleId);
    void deleteByRole_Id(UUID roleId);
}
