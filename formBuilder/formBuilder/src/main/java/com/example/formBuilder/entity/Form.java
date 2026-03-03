package com.example.formBuilder.entity;


import com.example.formBuilder.enums.FormStatus;
import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Form {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String formName;

    private String tableName;

    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    private FormStatus status = FormStatus.DRAFT;

    @JsonManagedReference
    @OneToMany(mappedBy = "form", cascade = CascadeType.ALL)
    private List<FormField> fields;
}
