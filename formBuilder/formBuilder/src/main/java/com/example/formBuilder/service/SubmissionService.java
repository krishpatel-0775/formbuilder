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
import com.example.formBuilder.util.CalculationEngine;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@Slf4j
public class SubmissionService {

    private final FormRepository formRepository;
    private final JdbcTemplate jdbcTemplate;
    private final RuleEngineService ruleEngineService;
    private final UserRepository userRepository;
    private final FormFieldRepository fieldRepository;
    private final FormVersionRepository versionRepository;
    private final FormSubmissionMetaRepository metaRepository;
    private final SchemaManager schemaManager;
    private final CalculationEngine calculationEngine;

    public SubmissionService(
            FormRepository formRepository,
            JdbcTemplate jdbcTemplate,
            RuleEngineService ruleEngineService,
            UserRepository userRepository,
            FormFieldRepository fieldRepository,
            FormVersionRepository versionRepository,
            FormSubmissionMetaRepository metaRepository,
            SchemaManager schemaManager,
            CalculationEngine calculationEngine) {
        this.formRepository = formRepository;
        this.jdbcTemplate = jdbcTemplate;
        this.ruleEngineService = ruleEngineService;
        this.userRepository = userRepository;
        this.fieldRepository = fieldRepository;
        this.versionRepository = versionRepository;
        this.metaRepository = metaRepository;
        this.schemaManager = schemaManager;
        this.calculationEngine = calculationEngine;
    }


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
        if (meta.getFormVersion() != null) {
            fields = fieldRepository.findByFormVersion_IdOrderByDisplayOrderAscIdAsc(meta.getFormVersion().getId());
        } else {
            fields = fieldRepository.findByForm_IdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(formId);
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
        FormVersion activeVersion = versionRepository.findByForm_IdAndIsActiveTrue(form.getId()).orElse(null);
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
                ? fieldRepository.findByFormVersion_IdOrderByDisplayOrderAscIdAsc(targetVersion.getId())
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

        // Strip any keys from stale draft data that don't belong to the active version's schema.
        // This happens when a user saved a draft under a newer version (e.g. v2 with "bio"),
        // the admin then activates an older version (e.g. v1 without "bio"), and the frontend
        // re-submits the cached draft data. Instead of throwing "Invalid field: bio", we
        // silently drop those extra fields so the submission succeeds against the active version.
        values.keySet().retainAll(fieldMap.keySet());

        // Validation for final submission
        java.util.Map<String, java.util.List<String>> fieldErrors = new java.util.HashMap<>();

        for (FormField field : formFields) {
            String key = field.getFieldKey() != null ? field.getFieldKey() : field.getFieldName();
            if (isDisplayOnly(field.getFieldType())) continue;
            
            Object value = values.get(key);
            if (Boolean.TRUE.equals(field.getRequired()) && (value == null || value.toString().trim().isEmpty())) {
                fieldErrors.computeIfAbsent(key, k -> new java.util.ArrayList<>()).add("This field is required");
                continue;
            }
            if (value != null && !value.toString().trim().isEmpty()) {
                validateValue(field, value, fieldErrors);

                // Uniqueness check: only for non-draft, non-deleted records
                // AND only if no errors were found for this field during basic validation
                if (Boolean.TRUE.equals(field.getIsUnique()) && !fieldErrors.containsKey(key)) {
                    String checkSql = "SELECT COUNT(*) FROM " + tableName + " WHERE " + key + " = ? AND is_deleted = false AND is_draft = false";
                    Object safeValue = getSafeValue(field, value);
                    Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, safeValue);
                    if (count != null && count > 0) {
                        fieldErrors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                                  .add("The value '" + value + "' for field '" + field.getFieldName() + "' must be unique.");
                    }
                }
            }
        }

        if (!fieldErrors.isEmpty()) throw new ValidationException(fieldErrors);
        ruleEngineService.validateSubmission(form, values);

        // ── Apply server-side calculations ─────────────────────────────────────
        // Must run AFTER validation so operand values are confirmed valid,
        // and BEFORE the INSERT/UPDATE so the correct computed value is stored.
        applyCalculatedFields(formFields, values);

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
        syncMetadata(form, targetVersion, tableName, submissionId, "SUBMITTED", currentUser);

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

        FormVersion targetVersion = null;
        if (request.getFormVersionId() != null) {
            targetVersion = versionRepository.findById(request.getFormVersionId()).orElse(null);
        }
        if (targetVersion == null) {
            targetVersion = versionRepository.findByForm_IdAndIsActiveTrue(form.getId())
                    .orElse(null);
        }
        UUID versionId = targetVersion != null ? targetVersion.getId() : null;

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
                ? fieldRepository.findByFormVersion_IdOrderByDisplayOrderAscIdAsc(versionId)
                // FIXED: Use findByFormIdAndFormVersionIsNull to avoid picking up fields from drafts/versions
                : fieldRepository.findByForm_IdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(form.getId());

        Map<String, FormField> fieldMap = fields.stream()
                .collect(Collectors.toMap(FormField::getFieldKey, f -> f, (existing, replacement) -> existing));

        // ── Apply server-side calculations before the DB write ─────────────────
        applyCalculatedFields(fields, values);

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

        syncMetadata(form, targetVersion, tableName, submissionId, "DRAFT", currentUser);

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

        // Resolve the currently active version so we can match the correct draft
        // and filter out fields that no longer exist in this version.
        FormVersion activeVersion = versionRepository.findByForm_IdAndIsActiveTrue(form.getId()).orElse(null);
        UUID activeVersionId = activeVersion != null ? activeVersion.getId() : null;

        // Find the draft that matches the active version specifically.
        // If a draft exists for a different (now inactive) version, ignore it — it's stale.
        FormSubmissionMeta meta;
        if (activeVersionId != null) {
            meta = metaRepository.findByForm_IdAndSubmittedByAndStatus(formId, currentUser, "DRAFT")
                    .stream()
                    .filter(m -> m.getFormVersion() != null && activeVersionId.equals(m.getFormVersion().getId()))
                    .findFirst()
                    .orElse(null);
        } else {
            meta = metaRepository.findByForm_IdAndSubmittedByAndStatus(formId, currentUser, "DRAFT")
                    .stream()
                    .filter(m -> m.getFormVersion() == null)
                    .findFirst()
                    .orElse(null);
        }

        if (meta == null) return null;

        // Load the valid field keys for the active version so we can strip stale columns.
        List<FormField> activeFields = (activeVersionId != null)
                ? fieldRepository.findByFormVersion_IdOrderByDisplayOrderAscIdAsc(activeVersionId)
                : fieldRepository.findByForm_IdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(formId);

        java.util.Set<String> validKeys = activeFields.stream()
                .filter(f -> !isDisplayOnly(f.getFieldType()))
                .map(f -> f.getFieldKey() != null ? f.getFieldKey() : f.getFieldName())
                .collect(Collectors.toSet());

        String sql = "SELECT * FROM " + tableName + " WHERE id = ?::uuid AND is_draft = true";
        try {
            log.info("Retrieving draft for form {} and user {}", formId, currentUser);
            Map<String, Object> data = jdbcTemplate.queryForMap(sql, meta.getSubmissionRowId().toString());

            // Remove internal / metadata columns
            data.remove("id");
            data.remove("is_deleted");
            data.remove("is_draft");
            data.remove("submitted_by");
            data.remove("created_at");
            data.remove("updated_at");
            data.remove("form_version_id");

            // Strip any columns that don't belong to the active version's schema
            // (e.g. "bio" from a v2 draft when v1 is now active).
            data.keySet().retainAll(validKeys);

            return DraftResponse.builder()
                    .submissionId(meta.getSubmissionRowId())
                    .formVersionId(meta.getFormVersion() != null ? meta.getFormVersion().getId() : null)
                    .data(data)
                    .status("DRAFT")
                    .build();
        } catch (Exception e) {
            return null;
        }
    }

    private void syncMetadata(Form form, FormVersion version, String table, UUID rowId, String status, String user) {
        FormSubmissionMeta meta = metaRepository.findBySubmissionTableAndSubmissionRowId(table, rowId)
                .orElse(FormSubmissionMeta.builder()
                        .form(form)
                        .submissionTable(table)
                        .submissionRowId(rowId)
                        .build());

        meta.setFormVersion(version);
        meta.setStatus(status);
        meta.setSubmittedBy(user);
        if ("SUBMITTED".equals(status)) {
            meta.setSubmittedAt(LocalDateTime.now());
        }
        metaRepository.save(meta);
    }


    /**
     * Iterates all fields in the form that have {@code isCalculated = true},
     * re-computes their value using the stored formula and the submitted operand values,
     * and writes the result back into the {@code values} map before the DB write.
     *
     * <p>This is the single source of truth: whatever the frontend sends for a
     * calculated field is always overwritten by the server-side computation.
     */
    private void applyCalculatedFields(List<FormField> formFields, Map<String, Object> values) {
        for (FormField field : formFields) {
            if (!Boolean.TRUE.equals(field.getIsCalculated())) continue;
            if (field.getCalculationFormula() == null || field.getCalculationFormula().isBlank()) continue;

            // Use the same fallback logic for the key as the DB write logic
            String key = field.getFieldKey();
            if (key == null || key.isBlank()) {
                key = field.getFieldName();
            }
            
            Double result = calculationEngine.compute(field.getCalculationFormula(), values);

            if (result == null) {
                values.put(key, null);
                log.debug("[Calc] Field '{}': formula evaluation returned null", key);
            } else {
                if ("number".equals(field.getFieldType())) {
                    values.put(key, result.longValue());
                } else {
                    values.put(key, result);
                }
                log.info("[Calc] Field '{}' = {} (computed)", key, result);
            }
        }
    }

    private Object getSafeValue(FormField f, Object value) {
        if (value == null || value.toString().trim().isEmpty()) return null;
        String strVal = value.toString().trim();
        switch (f.getFieldType()) {
            case "number":
                try { return Integer.parseInt(strVal); }
                catch (NumberFormatException e) { return null; }
            case "decimal":
                try { return Double.parseDouble(strVal); }
                catch (NumberFormatException e) { return null; }
            case "date": try { return java.sql.Date.valueOf(strVal); } catch (Exception e) { return null; }
            case "time":
                try {
                    if (strVal.length() == 5) strVal = strVal + ":00";
                    return java.sql.Time.valueOf(strVal);
                } catch (Exception e) { return null; }
            case "datetime":
                try {
                    String ts = strVal.replace("T", " ");
                    if (ts.length() == 16) ts = ts + ":00";
                    return java.sql.Timestamp.valueOf(ts);
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
    private void validateValue(FormField field, Object value, java.util.Map<String, java.util.List<String>> errors) {
        String key = field.getFieldKey() != null ? field.getFieldKey() : field.getFieldName();
        String stringValue = value.toString();

        switch (field.getFieldType()) {
            case "text", "textarea", "email" -> {
                if (field.getMinLength() != null && stringValue.length() < field.getMinLength()) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Minimum " + field.getMinLength() + " characters required");
                }
                if (field.getMaxLength() != null && stringValue.length() > field.getMaxLength()) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Maximum " + field.getMaxLength() + " characters allowed");
                }
                if (field.getPattern() != null && !stringValue.matches(field.getPattern())) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Format invalid");
                }
            }
            case "date" -> {
                LocalDate inputDate = null;
                try {
                    inputDate = LocalDate.parse(stringValue);
                } catch (Exception e) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Invalid date format (yyyy-MM-dd)");
                }
                if (inputDate != null) {
                    if (field.getAfterDate() != null && inputDate.isBefore(field.getAfterDate())) {
                        errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                              .add("Must be after " + field.getAfterDate());
                    }
                    if (field.getBeforeDate() != null && inputDate.isAfter(field.getBeforeDate())) {
                        errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                              .add("Must be before " + field.getBeforeDate());
                    }
                }
            }
            case "url" -> {
                if (!stringValue.matches(AppConstants.URL_REGEX)) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Invalid URL format");
                }
            }
            case "phone" -> {
                String digitsOnly = stringValue.replaceAll("[\\s\\-().+]", "");
                if (!digitsOnly.matches(AppConstants.PHONE_REGEX)) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Invalid phone number");
                }
            }
            case "number" -> {
                int number = 0;
                boolean isNumber = true;
                try {
                    number = Integer.parseInt(stringValue);
                } catch (Exception e) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Must be a whole number");
                    isNumber = false;
                }
                if (isNumber) {
                    if (field.getMin() != null && number < field.getMin().intValue()) {
                        errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                              .add("Value must be at least " + field.getMin().intValue());
                    }
                    if (field.getMax() != null && number > field.getMax().intValue()) {
                        errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                              .add("Value must be at most " + field.getMax().intValue());
                    }
                }
            }
            case "decimal" -> {
                double number = 0;
                boolean isNumber = true;
                try {
                    number = Double.parseDouble(stringValue);
                } catch (Exception e) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Must be a valid decimal number");
                    isNumber = false;
                }
                if (isNumber) {
                    if (field.getMin() != null && number < field.getMin()) {
                        errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                              .add("Value must be at least " + field.getMin());
                    }
                    if (field.getMax() != null && number > field.getMax()) {
                        errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                              .add("Value must be at most " + field.getMax());
                    }
                }
            }
            case "time" -> {
                if (field.getAfterTime() != null && !field.getAfterTime().isBlank()) {
                    if (stringValue.compareTo(field.getAfterTime()) < 0) {
                        errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                              .add("Must be after " + field.getAfterTime());
                    }
                }
                if (field.getBeforeTime() != null && !field.getBeforeTime().isBlank()) {
                    if (stringValue.compareTo(field.getBeforeTime()) > 0) {
                        errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                              .add("Must be before " + field.getBeforeTime());
                    }
                }
            }
            case "datetime" -> {
                java.time.LocalDateTime inputDt = null;
                try {
                    String s = stringValue.replace(" ", "T");
                    if (s.length() == 16) s += ":00";
                    inputDt = java.time.LocalDateTime.parse(s);
                } catch (Exception e) {
                    errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                          .add("Must be a valid date-time (yyyy-MM-ddTHH:mm)");
                }
                if (inputDt != null) {
                    if (field.getAfterDatetime() != null && !field.getAfterDatetime().isBlank()) {
                        try {
                            String sAfter = field.getAfterDatetime().replace(" ", "T");
                            if (sAfter.length() == 16) sAfter += ":00";
                            java.time.LocalDateTime after = java.time.LocalDateTime.parse(sAfter);
                            if (inputDt.isBefore(after)) {
                                errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                                      .add("Must be after " + field.getAfterDatetime());
                            }
                        } catch (Exception e) {}
                    }
                    if (field.getBeforeDatetime() != null && !field.getBeforeDatetime().isBlank()) {
                        try {
                            String sBefore = field.getBeforeDatetime().replace(" ", "T");
                            if (sBefore.length() == 16) sBefore += ":00";
                            java.time.LocalDateTime before = java.time.LocalDateTime.parse(sBefore);
                            if (inputDt.isAfter(before)) {
                                errors.computeIfAbsent(key, k -> new java.util.ArrayList<>())
                                      .add("Must be before " + field.getBeforeDatetime());
                            }
                        } catch (Exception e) {}
                    }
                }
            }
        }
    }
}
