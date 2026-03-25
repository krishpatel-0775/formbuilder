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

    List<FormVersion> findByFormIdOrderByVersionNumberAsc(UUID formId);

    Optional<FormVersion> findFirstByFormIdOrderByVersionNumberDesc(UUID formId);

    Optional<FormVersion> findByFormIdAndIsActiveTrue(UUID formId);

    Optional<FormVersion> findByFormIdAndVersionNumber(UUID formId, Integer versionNumber);
    
    Optional<FormVersion> findFirstByFormIdAndIsActiveFalseOrderByVersionNumberDesc(UUID formId);

    @Query("SELECT COALESCE(MAX(fv.versionNumber), 0) FROM FormVersion fv WHERE fv.formId = :formId")
    Integer findMaxVersionNumber(@Param("formId") UUID formId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE FormVersion fv SET fv.isActive = false WHERE fv.formId = :formId AND fv.isActive = true")
    void deactivateAllForForm(@Param("formId") UUID formId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE FormVersion fv SET fv.isLatest = false WHERE fv.formId = :formId AND fv.isLatest = true")
    void unsetLatestForForm(@Param("formId") UUID formId);

    boolean existsByFormId(UUID formId);
}
