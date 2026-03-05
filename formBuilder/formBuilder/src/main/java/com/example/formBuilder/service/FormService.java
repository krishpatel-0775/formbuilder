package com.example.formBuilder.service;

import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormField;
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

    private static final Pattern VALID_NAME =
            Pattern.compile("^[a-zA-Z][a-zA-Z0-9_]*$");


    // get a single form data for show form in frontend
    public Form getFormById(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Form not found"));
    }

    // get all data of a perticular form using id
    public List<Map<String, Object>> getAllDataFromTable(Long id) {

        String tableName = "form_" + id;

        if (!tableName.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid table name");
        }

        String sql = "SELECT * FROM " + tableName;

        return jdbcTemplate.queryForList(sql);
    }

    // return all form data for show form list
    public List<FormListDto> getAllForms() {
        List<Form> forms = formRepository.findAll();
        List<FormListDto> formListDtos = new ArrayList<>();

        for (Form form : forms) {
            formListDtos.add(new FormListDto(form.getId(), form.getFormName(), form.getStatus()));
        }

        return formListDtos;
    }

    // get drop down value in form
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

    // for form publish ( draft state -> published state)
    public String publishForm(Long id) {
        Form form = formRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        String tableName = form.getTableName();

        List<FormField> fields = fieldRepository.findByFormId(id);

        createDynamicTable(tableName, fields);

        form.setStatus(PUBLISHED);

        formRepository.save(form);

        return "Form Published Successfully";
    }


    //create form (dynamic form is not create)
    public String createForm(FormRequest request) {

        if (request.getFields() == null || request.getFields().isEmpty()) {
            throw new RuntimeException("Form must contain at least one field");
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
                throw new RuntimeException(field.getName() + " is a reserved field name. Please choose a different name.");
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

    // create dynamic table according field
    private void createDynamicTable(String tableName, List<FormField> fields) {

        StringBuilder sql = new StringBuilder();

        sql.append("CREATE TABLE ")
                .append(tableName)
                .append(" (id BIGSERIAL PRIMARY KEY")
                .append(", is_deleted BOOLEAN DEFAULT FALSE NOT NULL")
                .append(", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL");


        for (FormField field : fields) {

            validateColumnName(field.getFieldName());

            sql.append(", ")
                    .append(field.getFieldName())
                    .append(" ")
                    .append(mapType(field.getFieldType()));

            // REQUIRED
            if (TRUE.equals(field.getRequired())) {
                sql.append(" NOT NULL");
            }

            // TEXT length constraints
            if (field.getMinLength() != null) {
                sql.append(" CHECK (char_length(")
                        .append(field.getFieldName())
                        .append(") >= ")
                        .append(field.getMinLength())
                        .append(")");
            }

            if (field.getMaxLength() != null) {
                sql.append(" CHECK (char_length(")
                        .append(field.getFieldName())
                        .append(") <= ")
                        .append(field.getMaxLength())
                        .append(")");
            }

            // NUMBER constraints
            if (field.getMin() != null) {
                sql.append(" CHECK (")
                        .append(field.getFieldName())
                        .append(" >= ")
                        .append(field.getMin())
                        .append(")");
            }

            if (field.getMax() != null) {
                sql.append(" CHECK (")
                        .append(field.getFieldName())
                        .append(" <= ")
                        .append(field.getMax())
                        .append(")");
            }


            if (field.getPattern() != null) {
                sql.append(" CHECK (")
                        .append(field.getFieldName())
                        .append(" ~ '")
                        .append(field.getPattern().replace("'", "''"))
                        .append("')");
            }
        }

        sql.append(")");

        jdbcTemplate.execute(sql.toString());
    }


    //give data type according field type
    private String mapType(String type) {
        return switch (type) {
            case "text", "email", "radio", "select" -> "VARCHAR(255)";
            case "number" -> "INT";
            case "date" -> "DATE";
            case "textarea", "checkbox" -> "TEXT";
            default -> "VARCHAR(255)";
        };
    }

    //validate column name it is valide or not
    private void validateColumnName(String name) {

        if (name == null || name.trim().isEmpty()) {
            throw new RuntimeException("Field name cannot be empty");
        }

        if (!VALID_NAME.matcher(name).matches()) {
            throw new RuntimeException(
                    "Invalid field name: " + name +
                            " (Only letters, numbers, underscore allowed & must start with letter)"
            );
        }
    }


    @Transactional
    public String updateForm(Long formId, UpdateFormRequest request) {

        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new RuntimeException("Form not found"));

        // 1. Update form name if provided
        if (request.getFormName() != null && !request.getFormName().isBlank()) {
            form.setFormName(request.getFormName());
        }

        List<UpdateFieldRequest> incoming = request.getFields();

        // 2. Find existing fields
        List<FormField> existingFields = fieldRepository.findByFormId(formId);

        // IDs that came in from frontend (only non-null ones = existing)
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
                dropColumn(form.getTableName(), deleted.getFieldName());
            }
        }
        fieldRepository.deleteAll(toDelete);

        // 5. UPDATE or INSERT fields
        for (UpdateFieldRequest fieldReq : incoming) {

            if (fieldReq.getId() != null) {
                // UPDATE existing field
                FormField existing = fieldRepository.findById(fieldReq.getId())
                        .orElseThrow(() -> new RuntimeException("Field not found"));

                String oldName = existing.getFieldName();
                String newName = fieldReq.getName();

                // If PUBLISHED and name changed → RENAME column
                if (form.getStatus() == PUBLISHED
                        && !oldName.equals(newName)) {
                    renameColumn(form.getTableName(), oldName, newName);
                }

                applyFieldUpdates(existing, fieldReq);
                fieldRepository.save(existing);

            } else {
                // INSERT new field
                FormField newField = buildFormField(fieldReq, form);
                fieldRepository.save(newField);

                // If PUBLISHED → ADD COLUMN immediately
                if (form.getStatus() == PUBLISHED) {
                    addColumn(form.getTableName(), newField);
                }
            }
        }

        formRepository.save(form);
        return "Form updated successfully";
    }


    // Rename a column
    private void renameColumn(String tableName, String oldName, String newName) {
        validateColumnName(oldName);
        validateColumnName(newName);
        String sql = "ALTER TABLE " + tableName +
                " RENAME COLUMN " + oldName + " TO " + newName;
        jdbcTemplate.execute(sql);
    }

    // Drop a column
    private void dropColumn(String tableName, String columnName) {
        validateColumnName(columnName);
        String sql = "ALTER TABLE " + tableName +
                " DROP COLUMN IF EXISTS " + columnName;
        jdbcTemplate.execute(sql);
    }

    // Add a new column
    private void addColumn(String tableName, FormField field) {
        validateColumnName(field.getFieldName());
        StringBuilder sql = new StringBuilder();
        sql.append("ALTER TABLE ").append(tableName)
                .append(" ADD COLUMN ").append(field.getFieldName())
                .append(" ").append(mapType(field.getFieldType()));

        // New columns on published forms can't be NOT NULL
        // (existing rows would violate it), so skip that constraint

        jdbcTemplate.execute(sql.toString());
    }

    // Apply FieldRequest values onto a FormField entity
    private void applyFieldUpdates(FormField field, UpdateFieldRequest req) {
        validateColumnName(req.getName());
        field.setFieldName(req.getName());
        field.setFieldType(req.getType());
        field.setRequired(req.getRequired());
        field.setMinLength(req.getMinLength());
        field.setMaxLength(req.getMaxLength());
        field.setMin(req.getMin());
        field.setMax(req.getMax());
        field.setPattern(req.getPattern());
        field.setBeforeDate(req.getBeforeDate() != null
                ? LocalDate.parse(req.getBeforeDate()) : null);
        field.setAfterDate(req.getAfterDate() != null
                ? LocalDate.parse(req.getAfterDate()) : null);
        field.setOptions(req.getOptions());
        field.setSourceTable(req.getSourceTable());
        field.setSourceColumn(req.getSourceColumn());
    }

    // Build a brand new FormField from request
    private FormField buildFormField(UpdateFieldRequest req, Form form) {
        FormField f = new FormField();
        applyFieldUpdates(f, req);
        f.setForm(form);
        return f;
    }
}