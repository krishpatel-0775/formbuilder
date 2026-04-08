package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.DraftRequest;
import com.example.formBuilder.dto.DraftResponse;
import com.example.formBuilder.dto.SubmissionDetailDTO;
import com.example.formBuilder.dto.SubmissionRequest;
import com.example.formBuilder.entity.*;
import com.example.formBuilder.repository.*;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.security.SessionUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;

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
    private final FormSubmissionMetaRepository metaRepository;
    private final SchemaManager schemaManager;


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

    public SubmissionDetailDTO getSubmissionDetail(UUID formId, UUID responseId) {
        checkUserPermission(formId);
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found"));

        String tableName = form.getTableName();

        // 1. Fetch Metadata
        FormSubmissionMeta meta = metaRepository.findBySubmissionTableAndSubmissionRowId(tableName, responseId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission metadata not found"));

        // 2. Fetch Data from dynamic table
        String sql = "SELECT * FROM " + tableName + " WHERE id = ?::uuid";
        Map<String, Object> rowData;
        try {
            rowData = jdbcTemplate.queryForMap(sql, responseId.toString());
        } catch (Exception e) {
            throw new ResourceNotFoundException("Submission data not found");
        }

        if (Boolean.TRUE.equals(rowData.get("is_deleted"))) {
            throw new ValidationException("if you want to see detail of this response plze restore form first.");
        }

        // 3. Fetch Field Labels (currently just using fieldName as based on existing patterns)
        List<FormField> fields;
        if (meta.getFormVersionId() != null) {
            fields = fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(meta.getFormVersionId());
        } else {
            fields = fieldRepository.findByFormIdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(formId);
        }

        Map<String, String> fieldLabels = fields.stream()
                .filter(f -> !isDisplayOnly(f.getFieldType()))
                .collect(Collectors.toMap(
                        f -> f.getFieldKey() != null ? f.getFieldKey() : f.getFieldName(),
                        f -> f.getFieldName() != null ? f.getFieldName() : "",
                        (existing, replacement) -> existing
                ));
        
        // Remove internal columns from data
        rowData.keySet().retainAll(fieldLabels.keySet());

        return SubmissionDetailDTO.builder()
                .id(responseId)
                .submittedBy(meta.getSubmittedBy())
                .submittedAt(meta.getSubmittedAt())
                .status(meta.getStatus())
                .data(rowData)
                .fieldLabels(fieldLabels)
                .build();
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
     * Restores a soft-deleted response by marking its 'is_deleted' flag back to false.
     */
    public String restoreResponse(UUID formId, UUID responseId) {
        checkUserPermission(formId);
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found"));
        String tableName = form.getTableName();
        String sql = "UPDATE " + tableName + " SET is_deleted = false WHERE id = ?::uuid";
        jdbcTemplate.update(sql, responseId.toString());
        return "response restored";
    }

    /**
     * Bulk restores soft-deleted responses by marking their 'is_deleted' flag back to false.
     */
    public String restoreResponses(UUID formId, List<UUID> responseIds) {
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
        String sql = "UPDATE " + tableName + " SET is_deleted = false WHERE id IN (" + inClause + ")";
        jdbcTemplate.update(sql);
        return responseIds.size() + " responses restored";
    }

    @Transactional
    public String submitForm(SubmissionRequest request) {
        Form form = formRepository.findById(request.getFormId())
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + request.getFormId() + " not found"));

        String tableName = form.getTableName();
        Map<String, Object> values = request.getValues();
        String currentUser = SessionUtil.getCurrentUsername();

        // Resolve target version and validate against the currently active one
        FormVersion activeVersion = versionRepository.findByFormIdAndIsActiveTrue(form.getId()).orElse(null);
        UUID activeVersionId = (activeVersion != null) ? activeVersion.getId() : null;
        FormVersion targetVersion;

        if (request.getVersionId() != null) {
            // Version specified in request — must match the active version
            if (activeVersionId == null || !request.getVersionId().equals(activeVersionId)) {
                throw new ValidationException("This form version is old. Please refresh the page to load the latest version.");
            }
            targetVersion = activeVersion;
        } else {
            // No version specified — only allowed if no version is active
            if (activeVersionId != null) {
                throw new ValidationException("This form version is outdated. Please refresh the page to load the latest version.");
            }
            targetVersion = null;
        }

        List<FormField> formFields = (targetVersion != null)
                ? fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(targetVersion.getId())
                : form.getFields();

        // ── Schema drift check ────────────────────────────────────────────────────
        List<String> driftedColumns = schemaManager.detectDrift(tableName, formFields);
        if (!driftedColumns.isEmpty()) {
            throw new ValidationException(
                "Submission blocked: the form's data table is out of sync with its field definitions. " +
                "Missing columns: " + String.join(", ", driftedColumns) + ". " +
                "Please contact the form administrator."
            );
        }

        Map<String, FormField> fieldMap = formFields.stream()
                .collect(Collectors.toMap(
                        f -> f.getFieldKey() != null ? f.getFieldKey() : f.getFieldName(),
                        f -> f,
                        (existing, replacement) -> existing));

        // Validation for final submission
        List<String> validationErrors = new ArrayList<>();
        for (String key : values.keySet()) {
            if (!fieldMap.containsKey(key)) validationErrors.add("Invalid field: " + key);
        }

        for (FormField field : formFields) {
            if (isDisplayOnly(field.getFieldType())) continue;
            Object value = values.get(field.getFieldKey() != null ? field.getFieldKey() : field.getFieldName());
            if (Boolean.TRUE.equals(field.getRequired()) && (value == null || value.toString().trim().isEmpty())) {
                validationErrors.add(field.getFieldName() + " is required");
                continue;
            }
            if (value != null && !value.toString().trim().isEmpty()) {
                validateValue(field, value, validationErrors);
            }
        }

        if (!validationErrors.isEmpty()) throw new ValidationException(String.join(", ", validationErrors));
        ruleEngineService.validateSubmission(form, values);

        // Check if an existing draft exists to update it
        UUID submissionId = null;
        try {
            if (activeVersionId != null) {
                String checkSql = "SELECT id FROM " + tableName + " WHERE submitted_by = ? AND form_version_id = ?::uuid AND is_draft = true AND is_deleted = false LIMIT 1";
                submissionId = jdbcTemplate.queryForObject(checkSql, UUID.class, currentUser, activeVersionId.toString());
            } else {
                String checkSql = "SELECT id FROM " + tableName + " WHERE submitted_by = ? AND is_draft = true AND is_deleted = false LIMIT 1";
                submissionId = jdbcTemplate.queryForObject(checkSql, UUID.class, currentUser);
            }
        } catch (Exception e) { /* no draft */ }

        if (submissionId != null) {
            // Update existing draft to final submission
            StringBuilder updateSql = new StringBuilder("UPDATE " + tableName + " SET ");
            List<Object> updateValues = new ArrayList<>();
            for (FormField f : formFields) {
                if (!isDisplayOnly(f.getFieldType()) && values.containsKey(f.getFieldKey())) {
                    updateSql.append(f.getFieldKey()).append(" = ?, ");
                    updateValues.add(getSafeValue(f, values.get(f.getFieldKey())));
                }
            }
            updateSql.append("is_draft = false, form_version_id = ?::uuid, updated_at = CURRENT_TIMESTAMP WHERE id = ?::uuid");
            updateValues.add(activeVersionId != null ? activeVersionId.toString() : null);
            updateValues.add(submissionId.toString());
            jdbcTemplate.update(updateSql.toString(), updateValues.toArray());
        } else {
            // New submission
            String columns = formFields.stream()
                    .filter(f -> !isDisplayOnly(f.getFieldType()) && values.containsKey(f.getFieldKey()))
                    .map(FormField::getFieldKey).collect(Collectors.joining(","));
            String placeholders = formFields.stream()
                    .filter(f -> !isDisplayOnly(f.getFieldType()) && values.containsKey(f.getFieldKey()))
                    .map(f -> "?").collect(Collectors.joining(","));
            Object[] safeValues = formFields.stream()
                    .filter(f -> !isDisplayOnly(f.getFieldType()) && values.containsKey(f.getFieldKey()))
                    .map(f -> getSafeValue(f, values.get(f.getFieldKey()))).toArray();

            String sql = "INSERT INTO " + tableName + " (" + columns + ",form_version_id,is_draft,submitted_by) VALUES (" + placeholders + ",?::uuid,false,?) RETURNING id";
            Object[] finalValues = new Object[safeValues.length + 2];
            System.arraycopy(safeValues, 0, finalValues, 0, safeValues.length);
            finalValues[safeValues.length] = activeVersionId != null ? activeVersionId.toString() : null;
            finalValues[safeValues.length + 1] = currentUser;
            submissionId = jdbcTemplate.queryForObject(sql, UUID.class, finalValues);
        }

        // Sync Metadata
        syncMetadata(form.getId(), activeVersionId, tableName, submissionId, "SUBMITTED", currentUser);

        ruleEngineService.executePostSubmissionWorkflows(form, values);
        return "Form Submitted Successfully";
    }

    @Transactional
    public DraftResponse saveDraft(DraftRequest request) {
        Form form = formRepository.findById(request.getFormId())
                .orElseThrow(() -> new ResourceNotFoundException("Form not found"));
        String tableName = form.getTableName();
        String currentUser = SessionUtil.getCurrentUsername();
        Map<String, Object> values = request.getData();

        UUID versionId = request.getFormVersionId();
        if (versionId == null) {
            versionId = versionRepository.findByFormIdAndIsActiveTrue(form.getId())
                    .map(com.example.formBuilder.entity.FormVersion::getId)
                    .orElse(null);
        }

        UUID submissionId = null;
        try {
            if (versionId != null) {
                String checkSql = "SELECT id FROM " + tableName + " WHERE submitted_by = ? AND form_version_id = ?::uuid AND is_draft = true AND is_deleted = false LIMIT 1";
                submissionId = jdbcTemplate.queryForObject(checkSql, UUID.class, currentUser, versionId.toString());
            } else {
                String checkSql = "SELECT id FROM " + tableName + " WHERE submitted_by = ? AND is_draft = true AND is_deleted = false LIMIT 1";
                submissionId = jdbcTemplate.queryForObject(checkSql, UUID.class, currentUser);
            }
        } catch (Exception e) { /* no draft for this version */ }

        List<FormField> fields = (versionId != null) 
                ? fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(versionId)
                // FIXED: Use findByFormIdAndFormVersionIsNull to avoid picking up fields from drafts/versions
                : fieldRepository.findByFormIdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(form.getId());

        Map<String, FormField> fieldMap = fields.stream()
                .collect(Collectors.toMap(FormField::getFieldKey, f -> f, (existing, replacement) -> existing));

        if (submissionId != null) {
            // Update existing
            StringBuilder updateSql = new StringBuilder("UPDATE " + tableName + " SET ");
            List<Object> updateValues = new ArrayList<>();
            for (String key : values.keySet()) {
                if (fieldMap.containsKey(key)) {
                    updateSql.append(key).append(" = ?, ");
                    updateValues.add(getSafeValue(fieldMap.get(key), values.get(key)));
                }
            }
            updateSql.append("updated_at = CURRENT_TIMESTAMP WHERE id = ?::uuid");
            updateValues.add(submissionId.toString());
            jdbcTemplate.update(updateSql.toString(), updateValues.toArray());
        } else {
            // Insert new
            List<String> cols = new ArrayList<>();
            List<String> placeholders = new ArrayList<>();
            List<Object> params = new ArrayList<>();
            for (String key : values.keySet()) {
                if (fieldMap.containsKey(key)) {
                    cols.add(key);
                    placeholders.add("?");
                    params.add(getSafeValue(fieldMap.get(key), values.get(key)));
                }
            }
            cols.add("form_version_id"); placeholders.add("?::uuid"); params.add(versionId);
            cols.add("is_draft"); placeholders.add("?"); params.add(true);
            cols.add("submitted_by"); placeholders.add("?"); params.add(currentUser);

            String sql = "INSERT INTO " + tableName + " (" + String.join(",", cols) + ") VALUES (" + String.join(",", placeholders) + ") RETURNING id";
            submissionId = jdbcTemplate.queryForObject(sql, UUID.class, params.toArray());
        }

        syncMetadata(form.getId(), versionId, tableName, submissionId, "DRAFT", currentUser);

        return DraftResponse.builder()
                .submissionId(submissionId)
                .formVersionId(versionId)
                .data(values)
                .status("DRAFT")
                .build();
    }

    public DraftResponse getDraft(UUID formId) {
        Form form = formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form not found"));
        String currentUser = SessionUtil.getCurrentUsername();
        String tableName = form.getTableName();

        FormSubmissionMeta meta = metaRepository.findByFormIdAndSubmittedByAndStatus(formId, currentUser, "DRAFT")
                .stream().findFirst().orElse(null);

        if (meta == null) return null;

        String sql = "SELECT * FROM " + tableName + " WHERE id = ?::uuid AND is_draft = true";
        try {
            Map<String, Object> data = jdbcTemplate.queryForMap(sql, meta.getSubmissionRowId().toString());
            data.remove("id");
            data.remove("is_deleted");
            data.remove("is_draft");
            data.remove("submitted_by");
            data.remove("created_at");
            data.remove("updated_at");
            data.remove("form_version_id");

            return DraftResponse.builder()
                    .submissionId(meta.getSubmissionRowId())
                    .formVersionId(meta.getFormVersionId())
                    .data(data)
                    .status("DRAFT")
                    .build();
        } catch (Exception e) {
            return null;
        }
    }

    private void syncMetadata(UUID formId, UUID versionId, String table, UUID rowId, String status, String user) {
        FormSubmissionMeta meta = metaRepository.findBySubmissionTableAndSubmissionRowId(table, rowId)
                .orElse(FormSubmissionMeta.builder()
                        .formId(formId)
                        .submissionTable(table)
                        .submissionRowId(rowId)
                        .build());

        meta.setFormVersionId(versionId);
        meta.setStatus(status);
        meta.setSubmittedBy(user);
        if ("SUBMITTED".equals(status)) {
            meta.setSubmittedAt(LocalDateTime.now());
        }
        metaRepository.save(meta);
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

                LocalDate inputDate = null;

                try {
                    inputDate = LocalDate.parse(stringValue);
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
