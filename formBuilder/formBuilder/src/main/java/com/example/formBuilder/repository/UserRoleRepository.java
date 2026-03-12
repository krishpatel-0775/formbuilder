package com.example.formBuilder.repository;

import com.example.formBuilder.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface UserRoleRepository extends JpaRepository<UserRole, Long> {
    List<UserRole> findByUserId(Long userId);

    Collection<Object> findByRoleId(Long adminRoleId);
}
