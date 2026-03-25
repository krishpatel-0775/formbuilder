package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.SubmissionRequest;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.entity.FormVersion;
import com.example.formBuilder.repository.UserRepository;
import com.example.formBuilder.repository.FormRepository;
import com.example.formBuilder.repository.FormFieldRepository;
import com.example.formBuilder.repository.FormVersionRepository;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.security.SessionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class SubmissionService {

    private final FormRepository formRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RuleEngineService ruleEngineService;
    private final UserRepository userRepository;
    private final FormFieldRepository fieldRepository;
    private final FormVersionRepository versionRepository;

    private User getCurrentUser() {
        String username = SessionUtil.getCurrentUsername();
        if (username == null) throw new ValidationException("Unauthorized");
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ValidationException("User not found"));
    }

    private void checkUserPermission(UUID formId) {
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found"));
        User user = getCurrentUser();
        
        if (form.getUser() != null && !form.getUser().getId().equals(user.getId())) {
            throw new ValidationException("Access denied: You do not own this form");
        }
    }

    /** Returns true for types that are purely visual and have no DB column. */
    private static boolean isDisplayOnly(String type) {
        return type != null && (type.equals("page_break") ||
                type.equals("heading") || type.equals("paragraph") || type.equals("divider"));
    }

    /**
     * Soft-deletes a specific response by marking its 'is_deleted' flag to true.
     */
    public String deleteResponse(UUID formId, UUID responseId) {
        checkUserPermission(formId);
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found"));
        String tableName = form.getTableName();
        String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE id = ?::uuid";
        jdbcTemplate.update(sql, responseId.toString());
        return "response deleted";
    }

    /**
     * Bulk soft-deletes responses by marking their 'is_deleted' flag to true.
     */
    public String deleteResponses(UUID formId, List<UUID> responseIds) {
        if (responseIds == null || responseIds.isEmpty()) {
            return "No responses selected";
        }
        checkUserPermission(formId);
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found"));
        String tableName = form.getTableName();
        String inClause = responseIds.stream()
                .map(id -> "'" + id.toString() + "'::uuid")
                .collect(Collectors.joining(","));
        String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE id IN (" + inClause + ")";
        jdbcTemplate.update(sql);
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

        // STEP 1 — Resolve target version and its fields
        FormVersion targetVersion = null;
        if (request.getVersionId() != null) {
            targetVersion = versionRepository.findById(request.getVersionId())
                    .orElseThrow(() -> new ResourceNotFoundException("Version " + request.getVersionId() + " not found"));
        } else {
            targetVersion = versionRepository.findByFormIdAndIsActiveTrue(form.getId()).orElse(null);
        }

        List<FormField> formFields = (targetVersion != null)
                ? fieldRepository.findByFormVersionId(targetVersion.getId())
                : form.getFields();
        UUID activeVersionId = targetVersion != null ? targetVersion.getId() : null;

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
            // Display-only fields (heading, paragraph, divider, page_break) have no values
            if (isDisplayOnly(field.getFieldType())) continue;

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
                .filter(f -> !isDisplayOnly(f.getFieldType()))
                .filter(f -> values.containsKey(f.getFieldName()))
                .map(FormField::getFieldName)
                .collect(Collectors.joining(","));

        String placeholders = formFields.stream()
                .filter(f -> !isDisplayOnly(f.getFieldType()))
                .filter(f -> values.containsKey(f.getFieldName()))
                .map(f -> "?")
                .collect(Collectors.joining(","));

        Object[] safeValues = formFields.stream()
                .filter(f -> !isDisplayOnly(f.getFieldType()))
                .filter(f -> values.containsKey(f.getFieldName()))
                .map(f -> getSafeValue(f, values.get(f.getFieldName())))
                .toArray();

        String sql;
        Object[] finalValues;
        boolean isDraft = Boolean.TRUE.equals(request.getIsDraft());
        String currentUser = SessionUtil.getCurrentUsername();

        // Rule 4.1: Users CANNOT submit drafts for INACTIVE versions.
        if (isDraft && targetVersion != null && !Boolean.TRUE.equals(targetVersion.getIsActive())) {
            throw new ValidationException("Your draft was discarded because the form was updated.");
        }

        // Rule 5.1: Only one draft per user per form.
        // Check if an existing draft exists in this version for this user.
        UUID existingDraftId = null;
        if (activeVersionId != null) {
            try {
                String checkSql = "SELECT id FROM " + tableName + 
                                  " WHERE form_version_id = ?::uuid AND submitted_by = ? AND is_draft = true AND is_deleted = false LIMIT 1";
                existingDraftId = jdbcTemplate.queryForObject(checkSql, UUID.class, activeVersionId.toString(), currentUser);
            } catch (Exception e) { /* no existing draft */ }
        }

        if (existingDraftId != null) {
            // UPDATE existing draft
            StringBuilder updateSql = new StringBuilder("UPDATE " + tableName + " SET ");
            List<Object> updateValues = new ArrayList<>();
            for (FormField f : formFields) {
                if (isDisplayOnly(f.getFieldType())) continue;
                if (values.containsKey(f.getFieldName())) {
                    updateSql.append(f.getFieldName()).append(" = ?, ");
                    updateValues.add(getSafeValue(f, values.get(f.getFieldName())));
                }
            }
            updateSql.append("is_draft = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?::uuid");
            updateValues.add(isDraft);
            updateValues.add(existingDraftId.toString());
            jdbcTemplate.update(updateSql.toString(), updateValues.toArray());
        } else {
            // INSERT new record
            if (activeVersionId != null) {
                sql = "INSERT INTO " + tableName +
                        " (" + columns + ",form_version_id,is_draft,submitted_by) VALUES (" + placeholders + ",?::uuid,?,?)";
                Object[] extraValues = new Object[safeValues.length + 3];
                System.arraycopy(safeValues, 0, extraValues, 0, safeValues.length);
                extraValues[safeValues.length] = activeVersionId.toString();
                extraValues[safeValues.length + 1] = isDraft;
                extraValues[safeValues.length + 2] = currentUser;
                finalValues = extraValues;
            } else {
                sql = "INSERT INTO " + tableName +
                        " (" + columns + ",is_draft,submitted_by) VALUES (" + placeholders + ",?,?)";
                Object[] extraValues = new Object[safeValues.length + 2];
                System.arraycopy(safeValues, 0, extraValues, 0, safeValues.length);
                extraValues[safeValues.length] = isDraft;
                extraValues[safeValues.length + 1] = currentUser;
                finalValues = extraValues;
            }
            jdbcTemplate.update(sql, finalValues);
        }

        // STEP 6 — Trigger post-submission workflows
        ruleEngineService.executePostSubmissionWorkflows(form, values);

        return isDraft ? "Draft Saved" : "Form Submitted Successfully";
    }

    private Object getSafeValue(FormField f, Object value) {
        if (value == null || value.toString().trim().isEmpty()) return null;
        String strVal = value.toString().trim();
        switch (f.getFieldType()) {
            case "number":
                try { return Integer.parseInt(strVal); }
                catch (NumberFormatException e) {
                    try { return Double.parseDouble(strVal); }
                    catch (NumberFormatException e2) { return null; }
                }
            case "date": try { return java.sql.Date.valueOf(strVal); } catch (Exception e) { return null; }
            case "time":
                try {
                    if (strVal.length() == 5) strVal = strVal + ":00";
                    return java.sql.Time.valueOf(strVal);
                } catch (Exception e) { return null; }
            case "toggle": return "true".equalsIgnoreCase(strVal);
            case "file_upload":
                // File UUID stored as text
                return strVal;
            default:
                if (f.getSourceTable() != null && !f.getSourceTable().isBlank()) {
                    // Lookup references — store as string (UUID)
                    return strVal;
                }
                return strVal;
        }
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
            case "time" -> {
                if (field.getAfterTime() != null && !field.getAfterTime().isBlank()) {
                    if (stringValue.compareTo(field.getAfterTime()) < 0) {
                        errors.add(field.getFieldName() + " must be after " + field.getAfterTime());
                    }
                }
                if (field.getBeforeTime() != null && !field.getBeforeTime().isBlank()) {
                    if (stringValue.compareTo(field.getBeforeTime()) > 0) {
                        errors.add(field.getFieldName() + " must be before " + field.getBeforeTime());
                    }
                }
            }
        }
    }
}
