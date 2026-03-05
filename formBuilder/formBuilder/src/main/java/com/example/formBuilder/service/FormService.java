package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.FormFieldRepository;
import com.example.formBuilder.repository.FormRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.example.formBuilder.enums.FormStatus.PUBLISHED;
import static java.lang.Boolean.TRUE;

@Service
@RequiredArgsConstructor
public class FormService {

    private final FormRepository formRepository;
    private final FormFieldRepository fieldRepository;
    private final JdbcTemplate jdbcTemplate;
    private final SchemaManager schemaManager;

    private static final Pattern VALID_NAME =
            Pattern.compile(AppConstants.VALID_NAME_REGEX);

    /**
     * Retrieves a specific form entity by its ID.
     */
    public Form getFormById(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + id + " not found"));
    }

    /**
     * Retrieves all submitted response data for a particular form's generated table.
     */
    public List<Map<String, Object>> getAllDataFromTable(Long id) {

        String tableName = "form_" + id;

        if (!tableName.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid table name");
        }

        String sql = "SELECT * FROM " + tableName;

        return jdbcTemplate.queryForList(sql);
    }

    /**
     * Retrieves a high-level summary list of all forms for dashboard display.
     */
    public List<FormListDto> getAllForms() {
        List<Form> forms = formRepository.findAll();
        List<FormListDto> formListDtos = new ArrayList<>();

        for (Form form : forms) {
            formListDtos.add(new FormListDto(form.getId(), form.getFormName(), form.getStatus()));
        }

        return formListDtos;
    }

    /**
     * Fetches distinct drop-down values from a specific database column within a form.
     */
    public List<String> getLookupValues(Long formId, String columnName) {
        Form form = getFormById(formId);
        String tableName = form.getTableName();

        // ⚠ IMPORTANT: Prevent SQL Injection for column name
        if (!columnName.matches("^[a-zA-Z][a-zA-Z0-9_]*$")) {
            throw new IllegalArgumentException("Invalid column name");
        }

        String sql = "SELECT DISTINCT " + columnName + " FROM " + tableName + " WHERE is_deleted = false AND " + columnName + " IS NOT NULL";
        return jdbcTemplate.queryForList(sql, String.class);
    }

    /**
     * Publishes a draft form by generating its corresponding dynamic database table
     * and changing its status to PUBLISHED.
     */
    public String publishForm(Long id) {
        Form form = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + id + " not found"));

        String tableName = form.getTableName();

        List<FormField> fields = fieldRepository.findByFormId(id);

        schemaManager.createDynamicTable(tableName, fields);

        form.setStatus(PUBLISHED);

        formRepository.save(form);

        return "Form Published Successfully";
    }

    /**
     * Creates a new form definition along with its composite fields.
     * Note: This does not generate the dynamic database table (see publishForm).
     */
    public String createForm(FormRequest request) {

        if (request.getFields() == null || request.getFields().isEmpty()) {
            throw new ValidationException("Form must contain at least one field");
        }

        Form form = new Form();
        form.setFormName(request.getFormName());
        form = formRepository.save(form);

        String tableName = "form_" + form.getId();
        form.setTableName(tableName);
        formRepository.save(form);

        List<FormField> fieldList = new ArrayList<>();

        for (FieldRequest field : request.getFields()) {

            Set<String> reserved = Set.of(
                    "select","from","where","join","table","order",
                    "group","limit","offset","insert","update",
                    "delete","index","primary","key","constraint",
                    "id"
            );

            if(reserved.contains(field.getName().toLowerCase())){
                throw new ValidationException(field.getName() + " is a reserved field name. Please choose a different name.");
            }

            FormField formField = new FormField();

            formField.setFieldName(field.getName());
            formField.setFieldType(field.getType());

            formField.setRequired(field.getRequired());
            formField.setMinLength(field.getMinLength());
            formField.setMaxLength(field.getMaxLength());
            formField.setMin(field.getMin());
            formField.setMax(field.getMax());
            formField.setPattern(field.getPattern());

            formField.setDefaultValue(field.getDefaultValue());

            formField.setBeforeDate(
                    field.getBeforeDate() != null ?
                            LocalDate.parse(field.getBeforeDate()) : null
            );

            formField.setAfterDate(
                    field.getAfterDate() != null ?
                            LocalDate.parse(field.getAfterDate()) : null
            );

            formField.setOptions(field.getOptions());

            formField.setForm(form);
            formField.setSourceTable(field.getSourceTable());
            formField.setSourceColumn(field.getSourceColumn());

            fieldList.add(formField);
        }

        fieldRepository.saveAll(fieldList);

        return "Form Created Successfully";
    }

    @Transactional
    public String updateForm(Long formId, UpdateFormRequest request) {

        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + formId + " not found"));

        // 1. Update form name if provided
        /** 1. Update form name if provided */
        if (request.getFormName() != null && !request.getFormName().isBlank()) {
            form.setFormName(request.getFormName());
        }

        List<UpdateFieldRequest> incoming = request.getFields();

        /**
     * Maps an application field type (e.g., text, number, date) to its corresponding PostgreSQL data type.
     */
        /** 2. Find existing fields */
        List<FormField> existingFields = fieldRepository.findByFormId(formId);

        /** IDs that came in from frontend (only non-null ones = existing) */
        Set<Long> incomingIds = incoming.stream()
                .filter(f -> f.getId() != null)
                .map(UpdateFieldRequest::getId)
                .collect(Collectors.toSet());

        // 3. DELETE fields not in incoming list
        List<FormField> toDelete = existingFields.stream()
                .filter(f -> !incomingIds.contains(f.getId()))
                .toList();

        // 4. If PUBLISHED — handle ALTER TABLE for deleted fields
        if (form.getStatus() == PUBLISHED) {
            for (FormField deleted : toDelete) {
                schemaManager.dropColumn(form.getTableName(), deleted.getFieldName());
            }
        }
        fieldRepository.deleteAll(toDelete);

        // 5. UPDATE or INSERT fields
        for (UpdateFieldRequest fieldReq : incoming) {

            if (fieldReq.getId() != null) {
                // UPDATE existing field
                FormField existing = fieldRepository.findById(fieldReq.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldReq.getId() + " not found"));

                String oldName = existing.getFieldName();
                String newName = fieldReq.getName();

                // If PUBLISHED and name changed → RENAME column
                if (form.getStatus() == PUBLISHED
                        && !oldName.equals(newName)) {
                    schemaManager.renameColumn(form.getTableName(), oldName, newName);
                }

                applyFieldUpdates(existing, fieldReq);
                fieldRepository.save(existing);

            } else {
                // INSERT new field
                FormField newField = buildFormField(fieldReq, form);
                fieldRepository.save(newField);

                // If PUBLISHED → ADD COLUMN immediately
                if (form.getStatus() == PUBLISHED) {
                    schemaManager.addColumn(form.getTableName(), newField);
                }
            }
        }

        formRepository.save(form);
        return "Form updated successfully";
    }

    /**
     * Applies updates from an incoming UpdateFieldRequest to an existing FormField entity.
     */
    private void applyFieldUpdates(FormField field, UpdateFieldRequest req) {
        schemaManager.validateColumnName(req.getName());
        field.setFieldName(req.getName());
        field.setFieldType(req.getType());
        field.setRequired(req.getRequired());
        field.setMinLength(req.getMinLength());
        field.setMaxLength(req.getMaxLength());
        field.setMin(req.getMin());
        field.setMax(req.getMax());
        field.setPattern(req.getPattern());

        field.setDefaultValue(req.getDefaultValue());

        field.setBeforeDate(req.getBeforeDate() != null
                ? LocalDate.parse(req.getBeforeDate()) : null);
        field.setAfterDate(req.getAfterDate() != null
                ? LocalDate.parse(req.getAfterDate()) : null);
        field.setOptions(req.getOptions());
        field.setSourceTable(req.getSourceTable());
        field.setSourceColumn(req.getSourceColumn());
    }

    /**
     * Builds and initializes a new FormField entity from an incoming UpdateFieldRequest.
     */
    private FormField buildFormField(UpdateFieldRequest req, Form form) {
        FormField f = new FormField();
        applyFieldUpdates(f, req);
        f.setForm(form);
        return f;
    }
}