package com.example.formBuilder.repository;


import com.example.formBuilder.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    List<Form> findByStatus(com.example.formBuilder.enums.FormStatus status);


    @Query(value = "SELECT * FROM form WHERE user_id = :userId AND is_deleted = true", nativeQuery = true)
    List<Form> findDeletedByUserId(@Param("userId") UUID userId);

    @Modifying
    @Query(value = "UPDATE form SET is_deleted = false, updated_at = NOW() WHERE id = :id", nativeQuery = true)
    void restoreFormById(@Param("id") UUID id);
}
