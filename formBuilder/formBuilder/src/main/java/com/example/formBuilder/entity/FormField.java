package com.example.formBuilder.entity;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

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
    private LocalDate afterDate;

    @ElementCollection
    @CollectionTable(name = "form_field_options", joinColumns = @JoinColumn(name = "field_id"))
    @Column(name = "option_value")
    private List<String> options;

    @Column(name = "source_table")
    private String sourceTable;

    @Column(name = "source_column")
    private String sourceColumn;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "form_id")
    private Form form;
}