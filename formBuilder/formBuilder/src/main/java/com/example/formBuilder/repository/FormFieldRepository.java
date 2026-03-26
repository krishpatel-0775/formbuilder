package com.example.formBuilder.repository;


import com.example.formBuilder.entity.FormField;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface FormFieldRepository extends JpaRepository<FormField, UUID> {

    List<FormField> findByFormId(UUID formId);

    List<FormField> findByFormVersionId(UUID formVersionId);

    // FIXED: Find fields that are not yet associated with a version (legacy/initial fields)
    List<FormField> findByFormIdAndFormVersionIsNull(UUID formId);

    // FIXED: Explicitly hard-delete fields by version ID to avoid stale data accumulation or @Where clause interference
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM FormField f WHERE f.formVersion.id = :versionId")
    void deleteByFormVersionId(@org.springframework.data.repository.query.Param("versionId") UUID versionId);
 
    // FIXED: Explicitly delete fields by form ID. Using @Modifying to avoid JPA soft-delete/Where clause issues.
    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM FormField f WHERE f.form.id = :formId")
    void deleteByFormId(@org.springframework.data.repository.query.Param("formId") UUID formId);
}
