package com.example.formBuilder.entity;


import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

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

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "form_id")
    private Form form;
}