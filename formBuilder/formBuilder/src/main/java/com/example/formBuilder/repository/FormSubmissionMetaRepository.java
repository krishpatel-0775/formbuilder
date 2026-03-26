package com.example.formBuilder.repository;
 
import com.example.formBuilder.entity.FormSubmissionMeta;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.UUID;
import java.util.List;
 
@Repository
public interface FormSubmissionMetaRepository extends JpaRepository<FormSubmissionMeta, UUID> {
    Optional<FormSubmissionMeta> findBySubmissionTableAndSubmissionRowId(String table, UUID rowId);
    List<FormSubmissionMeta> findByFormIdOrderByCreatedAtDesc(UUID formId);
    List<FormSubmissionMeta> findByFormIdAndSubmittedByAndStatus(UUID formId, String submittedBy, String status);
    long countByFormIdIn(List<UUID> formIds);
}
