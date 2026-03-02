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

import java.util.ArrayList;
import java.util.List;
import java.util.regex.Pattern;

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

    public List<FormListDto> getAllForms() {
        List<Form> forms = formRepository.findAll();
        List<FormListDto> formListDtos = new ArrayList<>();

        for (Form form : forms) {
            formListDtos.add(new FormListDto(form.getId(), form.getFormName()));
        }

        return formListDtos;
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

        createDynamicTable(tableName, request.getFields());

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

            formField.setForm(form);

            fieldList.add(formField);
        }

        fieldRepository.saveAll(fieldList);

        return "Form Created Successfully";
    }

    private void createDynamicTable(String tableName, List<FieldRequest> fields) {

        StringBuilder sql = new StringBuilder();

        sql.append("CREATE TABLE ")
                .append(tableName)
                .append(" (id BIGSERIAL PRIMARY KEY");

        for (FieldRequest field : fields) {

            validateColumnName(field.getName());

            sql.append(", ")
                    .append(field.getName())
                    .append(" ")
                    .append(mapType(field.getType()));

            // REQUIRED
            if (Boolean.TRUE.equals(field.getRequired())) {
                sql.append(" NOT NULL");
            }

            // TEXT length constraints
            if (field.getMinLength() != null) {
                sql.append(" CHECK (char_length(")
                        .append(field.getName())
                        .append(") >= ")
                        .append(field.getMinLength())
                        .append(")");
            }

            if (field.getMaxLength() != null) {
                sql.append(" CHECK (char_length(")
                        .append(field.getName())
                        .append(") <= ")
                        .append(field.getMaxLength())
                        .append(")");
            }

            // NUMBER constraints
            if (field.getMin() != null) {
                sql.append(" CHECK (")
                        .append(field.getName())
                        .append(" >= ")
                        .append(field.getMin())
                        .append(")");
            }

            if (field.getMax() != null) {
                sql.append(" CHECK (")
                        .append(field.getName())
                        .append(" <= ")
                        .append(field.getMax())
                        .append(")");
            }


            if (field.getPattern() != null) {
                sql.append(" CHECK (")
                        .append(field.getName())
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
            case "text", "email" -> "VARCHAR(255)";
            case "number" -> "INT";
            case "date" -> "DATE";
            case "textarea" -> "TEXT";
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