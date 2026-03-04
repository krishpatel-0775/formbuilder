package com.example.formBuilder.service;

import com.example.formBuilder.dto.SubmissionRequest;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.FormRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final FormRepository formRepository;
    private final JdbcTemplate jdbcTemplate;

    //delete response by id
    public String deleteResponse(Long formId, Long responseId) {
        String tableName = "form_" + formId;

        String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE id = ?";

        jdbcTemplate.update(sql, responseId);


        return "response deleted";

    }

    public String submitForm(SubmissionRequest request) {

        Form form = formRepository.findById(request.getFormId())
                .orElseThrow(() -> new RuntimeException("Form not found"));

        String tableName = form.getTableName();

        Map<String, Object> values = request.getValues();

        // STEP 1 — Fetch metadata fields
        List<FormField> formFields = form.getFields();

        Map<String, FormField> fieldMap =
                formFields.stream()
                        .collect(Collectors.toMap(
                                FormField::getFieldName,
                                f -> f
                        ));

        // STEP 2 — Validate unknown fields
        for (String key : values.keySet()) {
            if (!fieldMap.containsKey(key)) {
                throw new RuntimeException("Invalid field: " + key);
            }
        }

        // STEP 3 — Validate constraints
        for (FormField field : formFields) {

            Object value = values.get(field.getFieldName());

            // Required validation
            if (Boolean.TRUE.equals(field.getRequired())) {
                if (value == null || value.toString().trim().isEmpty()) {
                    throw new RuntimeException(
                            field.getFieldName() + " is required");
                }
            }

            if (value != null) {
                validateValue(field, value);
            }
        }

        // STEP 4 — Safe column building
        String columns = formFields.stream()
                .filter(f -> values.containsKey(f.getFieldName()))
                .map(FormField::getFieldName)
                .collect(Collectors.joining(","));

        String placeholders = formFields.stream()
                .filter(f -> values.containsKey(f.getFieldName()))
                .map(f -> "?")
                .collect(Collectors.joining(","));

        Object[] safeValues = formFields.stream()
                .filter(f -> values.containsKey(f.getFieldName()))
                .map(f -> {

                    Object value = values.get(f.getFieldName());

                    if (value == null) return null;

                    switch (f.getFieldType()) {

                        case "number":
                            return Integer.parseInt(value.toString());

                        case "date":
                            return java.sql.Date.valueOf(value.toString());

                        default:
                            return value.toString();
                    }

                })
                .toArray();

        String sql = "INSERT INTO " + tableName +
                " (" + columns + ") VALUES (" + placeholders + ")";

        jdbcTemplate.update(sql, safeValues);

        return "Form Submitted Successfully";
    }

    private void validateValue(FormField field, Object value) {

        String stringValue = value.toString();

        switch (field.getFieldType()) {

            case "text", "textarea", "email" -> {

                if (field.getMinLength() != null &&
                        stringValue.length() < field.getMinLength()) {
                    throw new RuntimeException(
                            field.getFieldName() + " must be at least "
                                    + field.getMinLength() + " characters");
                }

                if (field.getMaxLength() != null &&
                        stringValue.length() > field.getMaxLength()) {
                    throw new RuntimeException(
                            field.getFieldName() + " must be at most "
                                    + field.getMaxLength() + " characters");
                }

                if (field.getPattern() != null &&
                        !stringValue.matches(field.getPattern())) {
                    throw new ValidationException(
                            field.getFieldName() + " format invalid");
                }
            }

            case "date" -> {

                java.time.LocalDate inputDate;

                try {
                    inputDate = java.time.LocalDate.parse(stringValue);
                } catch (Exception e) {
                    throw new RuntimeException(
                            field.getFieldName() + " must be a valid date (yyyy-MM-dd)");
                }

                // AFTER validation (minimum date)
                if (field.getAfterDate() != null &&
                        inputDate.isBefore(field.getAfterDate())) {

                    throw new RuntimeException(
                            field.getFieldName() + " must be after "
                                    + field.getAfterDate());
                }

                // BEFORE validation (maximum date)
                if (field.getBeforeDate() != null &&
                        inputDate.isAfter(field.getBeforeDate())) {

                    throw new RuntimeException(
                            field.getFieldName() + " must be before "
                                    + field.getBeforeDate());
                }
            }

            case "number" -> {

                int number;

                try {
                    number = Integer.parseInt(stringValue);
                } catch (Exception e) {
                    throw new RuntimeException(
                            field.getFieldName() + " must be a number");
                }

                if (field.getMin() != null &&
                        number < field.getMin()) {
                    throw new RuntimeException(
                            field.getFieldName() + " must be >= "
                                    + field.getMin());
                }

                if (field.getMax() != null &&
                        number > field.getMax()) {
                    throw new RuntimeException(
                            field.getFieldName() + " must be <= "
                                    + field.getMax());
                }
            }
        }
    }
}
