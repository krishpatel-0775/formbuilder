package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.SubmissionRequest;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.FormRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final FormRepository formRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RuleEngineService ruleEngineService;

    /**
     * Soft-deletes a specific response by marking its 'is_deleted' flag to true.
     */
    public String deleteResponse(Long formId, Long responseId) {
        String tableName = "form_" + formId;

        String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE id = ?";

        jdbcTemplate.update(sql, responseId);


        return "response deleted";

    }

    /**
     * Bulk soft-deletes responses by marking their 'is_deleted' flag to true.
     */
    public String deleteResponses(Long formId, List<Long> responseIds) {
        if (responseIds == null || responseIds.isEmpty()) {
            return "No responses selected";
        }

        String tableName = "form_" + formId;
        String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE id IN (" +
                responseIds.stream().map(id -> "?").collect(Collectors.joining(",")) + ")";

        jdbcTemplate.update(sql, responseIds.toArray());

        return responseIds.size() + " responses deleted";
    }

    /**
     * Processes and stores a new form submission into the form's generated database table.
     */
    public String submitForm(SubmissionRequest request) {

        Form form = formRepository.findById(request.getFormId())
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + request.getFormId() + " not found"));

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

        List<String> validationErrors = new ArrayList<>();

        // STEP 2 — Validate unknown fields
        for (String key : values.keySet()) {
            if (!fieldMap.containsKey(key)) {
                validationErrors.add("Invalid field: " + key);
            }
        }

        // STEP 3 — Validate constraints
        for (FormField field : formFields) {

            Object value = values.get(field.getFieldName());

            // Required validation
            if (Boolean.TRUE.equals(field.getRequired())) {
                if (value == null || value.toString().trim().isEmpty()) {
                    validationErrors.add(field.getFieldName() + " is required");
                    continue; // Skip further validations if null
                }
            }

            if (value != null && !value.toString().trim().isEmpty()) {
                validateValue(field, value, validationErrors);
            }
        }

        if (!validationErrors.isEmpty()) {
            throw new ValidationException(String.join(", ", validationErrors));
        }

        // STEP 4 — Evaluate form rules (VALIDATION_ERROR + REQUIRE enforcement)
        ruleEngineService.validateSubmission(form, values);

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

                    // Treat null or blank string as SQL NULL — safe for optional fields
                    if (value == null || value.toString().trim().isEmpty()) return null;

                    String strVal = value.toString().trim();
                    switch (f.getFieldType()) {
                        case "number":
                            try {
                                return Integer.parseInt(strVal);
                            } catch (NumberFormatException e) {
                                try { return Double.parseDouble(strVal); }
                                catch (NumberFormatException e2) { return null; }
                            }
                        case "date":
                            try { return java.sql.Date.valueOf(strVal); }
                            catch (Exception e) { return null; }
                        case "time":
                            try {
                                if (strVal.length() == 5) strVal = strVal + ":00";
                                return java.sql.Time.valueOf(strVal);
                            } catch (Exception e) { return null; }
                        default:
                            return strVal;
                    }
                })
                .toArray();

        String sql = "INSERT INTO " + tableName +
                " (" + columns + ") VALUES (" + placeholders + ")";

        jdbcTemplate.update(sql, safeValues);

        // STEP 6 — Trigger post-submission workflows (notifications, hooks, etc.)
        ruleEngineService.executePostSubmissionWorkflows(form, values);

        return "Form Submitted Successfully";
    }


    /**
     * Validates a submitted value against the constraints defined in the form field metadata.
     */
    private void validateValue(FormField field, Object value, List<String> errors) {

        String stringValue = value.toString();

        switch (field.getFieldType()) {

            case "text", "textarea", "email" -> {

                if (field.getMinLength() != null &&
                        stringValue.length() < field.getMinLength()) {
                    errors.add(field.getFieldName() + " must be at least "
                                    + field.getMinLength() + " characters");
                }

                if (field.getMaxLength() != null &&
                        stringValue.length() > field.getMaxLength()) {
                    errors.add(field.getFieldName() + " must be at most "
                                    + field.getMaxLength() + " characters");
                }

                if (field.getPattern() != null &&
                        !stringValue.matches(field.getPattern())) {
                    errors.add(field.getFieldName() + " format invalid");
                }
            }

            case "date" -> {

                java.time.LocalDate inputDate = null;

                try {
                    inputDate = java.time.LocalDate.parse(stringValue);
                } catch (Exception e) {
                    errors.add(field.getFieldName() + " must be a valid date (yyyy-MM-dd)");
                }

                if (inputDate != null) {
                    // AFTER validation (minimum date)
                    if (field.getAfterDate() != null &&
                            inputDate.isBefore(field.getAfterDate())) {
                        errors.add(field.getFieldName() + " must be after "
                                        + field.getAfterDate());
                    }

                    // BEFORE validation (maximum date)
                    if (field.getBeforeDate() != null &&
                            inputDate.isAfter(field.getBeforeDate())) {
                        errors.add(field.getFieldName() + " must be before "
                                        + field.getBeforeDate());
                    }
                }
            }

            case "url" -> {
                if (!stringValue.matches(AppConstants.URL_REGEX)) {
                    errors.add(field.getFieldName() + " must be a valid URL (starting with http:// or https://)");
                }
            }

            case "phone" -> {
                // strips spaces, dashes, brackets, plus sign then checks 7–15 digits
                String digitsOnly = stringValue.replaceAll("[\\s\\-().+]", "");
                if (!digitsOnly.matches(AppConstants.PHONE_REGEX)) {
                    errors.add(field.getFieldName() + " must be a valid phone number");
                }
            }

            case "number" -> {

                int number = 0;
                boolean isNumber = true;

                try {
                    number = Integer.parseInt(stringValue);
                } catch (Exception e) {
                    errors.add(field.getFieldName() + " must be a number");
                    isNumber = false;
                }

                if (isNumber) {
                    if (field.getMin() != null &&
                            number < field.getMin()) {
                        errors.add(field.getFieldName() + " must be >= "
                                        + field.getMin());
                    }

                    if (field.getMax() != null &&
                            number > field.getMax()) {
                        errors.add(field.getFieldName() + " must be <= "
                                        + field.getMax());
                    }
                }
            }
        }
    }
}
