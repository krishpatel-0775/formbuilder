package com.example.formBuilder.repository;


import com.example.formBuilder.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FormRepository extends JpaRepository<Form, UUID> {
    List<Form> findByUserId(UUID userId);
    Optional<Form> findByIdAndUserId(UUID id, UUID userId);
    Optional<Form> findByTableName(String tableName);
 
    long countByUserId(UUID userId);
    long countByUserIdAndStatus(UUID userId, com.example.formBuilder.enums.FormStatus status);
    List<Form> findTop5ByUserIdOrderByUpdatedAtDesc(UUID userId);
}
