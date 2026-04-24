package com.example.formBuilder.repository;

import com.example.formBuilder.entity.FormVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface FormVersionRepository extends JpaRepository<FormVersion, UUID> {

    List<FormVersion> findByForm_IdOrderByVersionNumberAsc(UUID formId);
    List<FormVersion> findByForm_IdOrderByVersionNumberDesc(UUID formId);

    Optional<FormVersion> findFirstByForm_IdOrderByVersionNumberDesc(UUID formId);

    Optional<FormVersion> findByForm_IdAndIsActiveTrue(UUID formId);

    Optional<FormVersion> findByForm_IdAndVersionNumber(UUID formId, Integer versionNumber);
    
    Optional<FormVersion> findFirstByForm_IdAndIsActiveFalseOrderByVersionNumberDesc(UUID formId);

    @Query("SELECT COALESCE(MAX(fv.versionNumber), 0) FROM FormVersion fv WHERE fv.form.id = :formId")
    Integer findMaxVersionNumber(@Param("formId") UUID formId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE FormVersion fv SET fv.isActive = false WHERE fv.form.id = :formId AND fv.isActive = true")
    void deactivateAllForForm(@Param("formId") UUID formId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE FormVersion fv SET fv.isLatest = false WHERE fv.form.id = :formId AND fv.isLatest = true")
    void unsetLatestForForm(@Param("formId") UUID formId);

    boolean existsByForm_Id(UUID formId);
}
