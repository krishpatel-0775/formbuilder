package com.example.formBuilder.entity;

import com.example.formBuilder.entity.PermittedUser;
import com.example.formBuilder.enums.FormStatus;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonRawValue;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Where;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Where(clause = "is_deleted = false")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Form {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String formName;

    private String tableName;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private FormStatus status = FormStatus.DRAFT;


    @JsonRawValue
    @JsonProperty("rules")
    @Column(columnDefinition = "TEXT")
    private String rules;
    
    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @JsonManagedReference
    @OneToMany(mappedBy = "form", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @Where(clause = "is_deleted = false")
    private List<FormField> fields;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(name = "visibility_type")
    private String visibilityType;

    @OneToMany(mappedBy = "form", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PermittedUser> permittedUsers = new ArrayList<>();
}
