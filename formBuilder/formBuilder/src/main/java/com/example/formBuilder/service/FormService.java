//package com.example.formBuilder.service;
//
//import com.example.formBuilder.dto.FieldRequest;
//import com.example.formBuilder.dto.FormRequest;
//import com.example.formBuilder.entity.Form;
//import com.example.formBuilder.entity.FormField;
//import com.example.formBuilder.repository.FormFieldRepository;
//import com.example.formBuilder.repository.FormRepository;
//import lombok.RequiredArgsConstructor;
//import org.springframework.jdbc.core.JdbcTemplate;
//import org.springframework.stereotype.Service;
//
//import java.util.ArrayList;
//import java.util.List;
//import java.util.regex.Pattern;
//
//@Service
//@RequiredArgsConstructor
//public class FormService {
//
//    private final FormRepository formRepository;
//    private final FormFieldRepository fieldRepository;
//    private final JdbcTemplate jdbcTemplate;
//
//    // Only allow letters, numbers and underscore
//    private static final Pattern VALID_NAME = Pattern.compile("^[a-zA-Z0-9_]+$");
//
//    public String createForm(FormRequest request) {
//
//        // Save basic form metadata
//        Form form = new Form();
//        form.setFormName(request.getFormName());
//        form = formRepository.save(form);
//
//        // Generate safe table name
//        String tableName = "form_" + form.getId();
//        form.setTableName(tableName);
//        formRepository.save(form);
//
//        // Create dynamic table
//        createDynamicTable(tableName, request.getFields());
//
//        // Save field metadata
//        List<FormField> fieldList = new ArrayList<>();
//
//        for (FieldRequest field : request.getFields()) {
//
//            validateColumnName(field.getName());
//
//            FormField formField = new FormField();
//            formField.setFieldName(field.getName());
//            formField.setFieldType(field.getType());
//            formField.setForm(form);
//            fieldList.add(formField);
//        }
//
//        fieldRepository.saveAll(fieldList);
//
//        return "Form Created Successfully";
//    }
//
//    private void createDynamicTable(String tableName, List<FieldRequest> fields) {
//
//        StringBuilder sql = new StringBuilder();
//
//        sql.append("CREATE TABLE ")
//                .append(tableName)
//                .append(" (id BIGSERIAL PRIMARY KEY");
//
//        for (FieldRequest field : fields) {
//
//            validateColumnName(field.getName());
//
//            sql.append(", ")
//                    .append(field.getName())
//                    .append(" ")
//                    .append(mapType(field.getType()));
//        }
//
//        sql.append(")");
//
//        jdbcTemplate.execute(sql.toString());
//    }
//
//    private String mapType(String type) {
//        return switch (type) {
//            case "text", "email" -> "VARCHAR(255)";
//            case "number" -> "INT";
//            case "date" -> "DATE";
//            case "textarea" -> "TEXT";
//            default -> "VARCHAR(255)";
//        };
//    }
//
//    private void validateColumnName(String name) {
//        if (!VALID_NAME.matcher(name).matches()) {
//            throw new RuntimeException("Invalid field name: " + name);
//        }
//    }
//}



package com.example.formBuilder.service;

import com.example.formBuilder.dto.FieldRequest;
import com.example.formBuilder.dto.FormListDto;
import com.example.formBuilder.dto.FormRequest;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.repository.FormFieldRepository;
import com.example.formBuilder.repository.FormRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;

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

    public Form getFormById(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Form not found"));
    }

    public List<Map<String, Object>> getAllDataFromTable(Long id) {

        String tableName = "form_" + id;

        // ⚠ IMPORTANT: Prevent SQL Injection
//        if (!tableName.matches("^[a-zA-Z0-9_]+$")) {
//            throw new IllegalArgumentException("Invalid table name");
//        }

        String sql = "SELECT * FROM " + tableName;

        return jdbcTemplate.queryForList(sql);
    }

    public List<FormListDto> getAllForms() {
        List<Form> forms = formRepository.findAll();
        List<FormListDto> formListDtos = new ArrayList<>();

        for (Form form : forms) {
            formListDtos.add(new FormListDto(form.getId(), form.getFormName(), form.getStatus()));
        }

        return formListDtos;
    }

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

    //delete response by id
    public String deleteResponse(Long formId, Long responseId) {
        String tableName = "form_" + formId;

        String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE id = ?";

        jdbcTemplate.update(sql, responseId);


        return "response deleted";

    }

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

//        createDynamicTable(tableName, request.getFields());

        List<FormField> fieldList = new ArrayList<>();

        for (FieldRequest field : request.getFields()) {

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

    private String mapType(String type) {
        return switch (type) {
            case "text", "email", "radio", "select" -> "VARCHAR(255)";
            case "number" -> "INT";
            case "date" -> "DATE";
            case "textarea", "checkbox" -> "TEXT";
            default -> "VARCHAR(255)";
        };
    }

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
}