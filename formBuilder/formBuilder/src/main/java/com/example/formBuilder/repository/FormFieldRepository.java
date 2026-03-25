package com.example.formBuilder.repository;


import com.example.formBuilder.entity.FormField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FormFieldRepository extends JpaRepository<FormField, UUID> {

    List<FormField> findByFormId(UUID formId);

    List<FormField> findByFormVersionId(UUID formVersionId);

    void deleteByFormVersionId(UUID formVersionId);
}
