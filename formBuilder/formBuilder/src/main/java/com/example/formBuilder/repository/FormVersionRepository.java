package com.example.formBuilder.repository;

import com.example.formBuilder.entity.FormVersion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FormVersionRepository extends JpaRepository<FormVersion, Long> {

    List<FormVersion> findByFormIdOrderByVersionNumberAsc(Long formId);

    Optional<FormVersion> findFirstByFormIdOrderByVersionNumberDesc(Long formId);

    Optional<FormVersion> findByFormIdAndIsActiveTrue(Long formId);

    Optional<FormVersion> findByFormIdAndVersionNumber(Long formId, Integer versionNumber);
    
    Optional<FormVersion> findFirstByFormIdAndIsActiveFalseOrderByVersionNumberDesc(Long formId);

    @Query("SELECT COALESCE(MAX(fv.versionNumber), 0) FROM FormVersion fv WHERE fv.formId = :formId")
    Integer findMaxVersionNumber(@Param("formId") Long formId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE FormVersion fv SET fv.isActive = false WHERE fv.formId = :formId AND fv.isActive = true")
    void deactivateAllForForm(@Param("formId") Long formId);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE FormVersion fv SET fv.isLatest = false WHERE fv.formId = :formId AND fv.isLatest = true")
    void unsetLatestForForm(@Param("formId") Long formId);

    boolean existsByFormId(Long formId);
}
