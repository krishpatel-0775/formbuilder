package com.example.formBuilder.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.*;

import org.hibernate.annotations.Where;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Where(clause = "is_deleted = false")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class FormField {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String fieldName;
    @Column(name = "field_key")
    private String fieldKey;
    private String fieldType;

    private Boolean required;

    private Integer minLength;
    private Integer maxLength;

    @Column(columnDefinition = "NUMERIC(19,4)")
    private Double min;
    @Column(columnDefinition = "NUMERIC(19,4)")
    private Double max;

    private String pattern;

    private LocalDate beforeDate;
    private LocalDate afterDate;

    private String afterTime;
    private String beforeTime;

    @Column(name = "before_datetime")
    private String beforeDatetime;

    @Column(name = "after_datetime")
    private String afterDatetime;

    @Column(name = "max_file_size")
    private Integer maxFileSize; // in MB

    @Column(name = "allowed_file_types")
    private String allowedFileTypes; // comma-separated, e.g., "pdf,jpg,png"

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "form_field_options", joinColumns = @JoinColumn(name = "field_id"))
    @Column(name = "option_value")
    private List<String> options;

    @Column(name = "source_table")
    private String sourceTable;

    @Column(name = "source_column")
    private String sourceColumn;

    @Column(name = "default_value")
    private String defaultValue;

    @Column(name = "placeholder")
    private String placeholder;

    @Column(name = "helper_text")
    private String helperText;

    @Column(name = "is_read_only")
    private Boolean isReadOnly = false;

    @Column(name = "is_deleted")
    private Boolean isDeleted = false;

    @JsonBackReference
    @ManyToOne
    @JoinColumn(name = "form_id")
    private Form form;

    /** The version this field belongs to. Null for legacy fields migrated before versioning. */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "form_version_id")
    private FormVersion formVersion;

    @Column(name = "display_order")
    private Integer displayOrder;

    @Column(name = "is_multi_select")
    private Boolean isMultiSelect = false;

    @Column(name = "is_unique")
    private Boolean isUnique = false;

    /** When true, the value of this field is computed from other numeric fields. */
    @Column(name = "is_calculated")
    private Boolean isCalculated = false;

    /**
     * JSON defining the calculation formula, e.g.:
     * {"operator":"+","operands":["field_a","field_b"]}
     * Only relevant when isCalculated = true.
     */
    @Column(name = "calculation_formula", columnDefinition = "TEXT")
    private String calculationFormula;

    @Column(name = "parent_id")
    private String parentId;
}