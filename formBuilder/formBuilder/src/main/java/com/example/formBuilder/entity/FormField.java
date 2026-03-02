package com.example.formBuilder.entity;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class FormField {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String fieldName;
    private String fieldType;

    private Boolean required;

    private Integer minLength;
    private Integer maxLength;

    private Integer min;
    private Integer max;

    private String pattern;

    private LocalDate beforeDate;
    private LocalDate afterDate;   // min allowed date    // min date allowed

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "form_id")
    private Form form;
}