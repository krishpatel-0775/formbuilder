package com.example.formBuilder.entity;
 
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.UUID;
 
@Entity
@Table(name = "form_submission_meta")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormSubmissionMeta {
 
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
 
    @Column(name = "form_id", nullable = false)
    private UUID formId;
 
    @Column(name = "form_version_id")
    private UUID formVersionId;
 
    @Column(name = "submission_table", nullable = false)
    private String submissionTable;
 
    @Column(name = "submission_row_id", nullable = false)
    private UUID submissionRowId;
 
    @Column(name = "status", nullable = false)
    private String status; // DRAFT or SUBMITTED
 
    @Column(name = "submitted_by")
    private String submittedBy;
 
    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
 
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;
 
    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
