package com.example.formBuilder.repository;


import com.example.formBuilder.entity.Form;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FormRepository extends JpaRepository<Form, UUID> {
    List<Form> findByUserId(UUID userId);
    Optional<Form> findByIdAndUserId(UUID id, UUID userId);
}
