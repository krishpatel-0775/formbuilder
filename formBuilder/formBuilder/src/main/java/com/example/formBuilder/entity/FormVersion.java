package com.example.formBuilder.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "form_version")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FormVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "form_id", nullable = false)
    private UUID formId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive;

    @Column(name = "is_latest", nullable = false)
    private Boolean isLatest;

    /** Serialized JSON array of FormRuleDTO — the rules for this version */
    @Column(name = "rules", columnDefinition = "TEXT")
    private String rules;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "formVersion", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<FormField> fields;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = LocalDateTime.now();
        if (updatedAt == null) updatedAt = LocalDateTime.now();
        if (isActive == null) isActive = false;
        if (isLatest == null) isLatest = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
