package com.example.formBuilder.service;

import com.example.formBuilder.dto.FormFieldResponseDto;
import com.example.formBuilder.dto.FormVersionDto;
import com.example.formBuilder.dto.UpdateFieldRequest;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.entity.FormVersion;
import com.example.formBuilder.enums.FormStatus;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.FormFieldRepository;
import com.example.formBuilder.repository.FormRepository;
import com.example.formBuilder.repository.FormVersionRepository;
import com.example.formBuilder.security.SessionUtil;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class FormVersionService {

    private final FormVersionRepository versionRepository;
    private final FormRepository formRepository;
    private final FormFieldRepository fieldRepository;
    private final JdbcTemplate jdbcTemplate;
    private final SchemaManager schemaManager;


    /**
     * Returns all versions for a form, ordered ascending (oldest first).
     */
    public List<FormVersionDto> getVersions(UUID formId) {
        getFormOrThrow(formId);
        return versionRepository.findByFormIdOrderByVersionNumberAsc(formId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Returns a specific version with full field list.
     */
    public FormVersionDto getVersion(UUID formId, UUID versionId) {
        FormVersion version = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version " + versionId + " not found"));
        if (!version.getFormId().equals(formId)) {
            throw new ValidationException("Version does not belong to the specified form");
        }
        return toDtoWithFields(version);
    }

    /**
     * Creates a new version by cloning the latest existing version.
     * If no version exists yet, seeds version 1 from the form's current fields/rules.
     */
    @Transactional
    public FormVersionDto createVersion(UUID formId) {
        Form form = getFormOrThrow(formId);
        String username = SessionUtil.getCurrentUsername();

        FormVersion source = resolveSourceVersion(formId);
        int nextNumber = versionRepository.findMaxVersionNumber(formId) + 1;

        // Requirement: set previous version's isLatest = false, isActive = false
        versionRepository.unsetLatestForForm(formId);
        versionRepository.deactivateAllForForm(formId);

        FormVersion newVersion = FormVersion.builder()
                .formId(formId)
                .versionNumber(nextNumber)
                // FIXED: New version of a DRAFT form should be INACTIVE.
                // It only becomes active when you click Publish.
                .isActive(form.getStatus() == com.example.formBuilder.enums.FormStatus.PUBLISHED)
                .isLatest(true)
                .rules(source != null && source.getRules() != null ? source.getRules() : (form.getRules() != null ? form.getRules() : "[]"))
                .createdBy(username)
                .createdAt(LocalDateTime.now())
                .build();
        newVersion = versionRepository.save(newVersion);

        // Clone fields from source version (or from the form's legacy fields)
        List<FormField> sourceFields = resolveFieldsToClone(formId, source);
        List<FormField> clonedFields = cloneFields(sourceFields, newVersion);
        // FIXED: Ensure no duplicates before saving
        validateUniqueFields(clonedFields);
        fieldRepository.saveAll(clonedFields);

        // Ensure schema is updated for this new active version
        ensureSchemaForVersion(form, newVersion);
        
        // FIXED: Removed form.setStatus(PUBLISHED) from here. 
        // Versioning and Publishing are now decoupled.
        // ensureSchemaForVersion(form, newVersion); // Still needed to ensure schema if form is already published
        
        log.info("Created and activated version {} for form {}", nextNumber, formId);
        return toDtoWithFields(newVersion);
    }

    /**
     * Seeds the very first version (v1) for a new form.
     */
    @Transactional
    public FormVersionDto createInitialVersion(UUID formId, List<FormField> fields, String rules) {
        Form form = getFormOrThrow(formId);
        String username = SessionUtil.getCurrentUsername();

        FormVersion v1 = FormVersion.builder()
                .formId(formId)
                .versionNumber(1)
                .isActive(true)
                .isLatest(true)
                .rules(rules != null ? rules : "[]")
                .createdBy(username)
                .createdAt(LocalDateTime.now())
                .build();
        v1 = versionRepository.save(v1);

        for (FormField f : fields) {
            f.setFormVersion(v1);
        }
        // FIXED: Final check for unique field names before publication
        validateUniqueFields(fields);
        fieldRepository.saveAll(fields);

        form.setStatus(FormStatus.PUBLISHED);
        formRepository.save(form);
        
        ensureSchemaForVersion(form, v1);
 
        return toDtoWithFields(v1);
    }

    /**
     * Activates a version, deactivating all others. Also discards draft submissions
     * written against any previously active version.
     */
    @Transactional
    public FormVersionDto activateVersion(UUID formId, UUID versionId) {
        Form form = getFormOrThrow(formId);

        FormVersion toActivate = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version " + versionId + " not found"));
        if (!toActivate.getFormId().equals(formId)) {
            throw new ValidationException("Version does not belong to the specified form");
        }

        log.info("Manually activating version {} for form {}", toActivate.getVersionNumber(), formId);
        
        // Rule 8: On every activation, old drafts MUST be deleted.
        // FIXED: Only discard drafts if the form is already PUBLISHED.
        // For new draft forms, no submission table exists yet, so this would fail.
        if (form.getStatus() == com.example.formBuilder.enums.FormStatus.PUBLISHED) {
            discardDraftsForForm(formId);
        } else {
            log.info("Skipping draft cleanup for form {}: currently in {} state", formId, form.getStatus());
        }

        versionRepository.deactivateAllForForm(formId);
        toActivate.setIsActive(true);
        versionRepository.saveAndFlush(toActivate);

        // FIXED: Set status to PUBLISHED BEFORE schema sync so guard allows it
        form.setStatus(com.example.formBuilder.enums.FormStatus.PUBLISHED);
        formRepository.saveAndFlush(form);
        
        // Ensure DB schema reflects this version's fields
        log.info("Activating version {} for form {}. Status is {}. Pre-sync schema check.", 
                toActivate.getVersionNumber(), formId, form.getStatus());
        ensureSchemaForVersion(form, toActivate);

        log.info("Successfully activated version {} for form {}", toActivate.getVersionNumber(), formId);
        return toDtoWithFields(toActivate);
    }


    @Transactional
    public FormVersionDto updateVersionFields(UUID versionId, List<UpdateFieldRequest> incoming) {
        FormVersion current = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found"));
        
        // Rule 5: Once a field is created with a specific type, its type MUST NEVER change.
        validateFieldConsistency(current.getId(), incoming);
        
        // FIXED: Ensure all field names are unique within the version to prevent bad SQL grammar
        validateUniqueFieldNames(incoming);

        Form form = getFormOrThrow(current.getFormId()); // FIXED: Need form to check status

        // FIXED: IF form is DRAFT, update the existing version in-place
        if (form.getStatus() == com.example.formBuilder.enums.FormStatus.DRAFT) {
            log.info("Draft Edit: Updating existing draft version v{} for fields. Replacing all fields.", current.getVersionNumber()); // FIXED: Added log
            fieldRepository.deleteByFormVersionId(current.getId());
            fieldRepository.flush(); // FIXED: Force flush to ensure old fields are deleted before saveAll
            
            List<FormField> newFields = new ArrayList<>();
            int order = 1;
            for (UpdateFieldRequest req : incoming) {
                FormField field = buildFormField(req);
                field.setFormVersion(current);
                field.setForm(form);
                field.setDisplayOrder(order++);
                newFields.add(field);
            }
            fieldRepository.saveAll(newFields);
            log.info("Successfully saved {} new fields for draft version v{}", newFields.size(), current.getVersionNumber()); // FIXED: Added log
            // FIXED: Do NOT call ensureSchemaForVersion for DRAFT forms (no table exists yet)
            return toDtoWithFields(current); // FIXED: Return same version
        }

        // REUSE LOGIC: If the LATEST version for this form is very recent (< 10s) 
        // and was created by the same user, UPDATE it instead of creating another version.
        FormVersion latest = versionRepository.findFirstByFormIdOrderByVersionNumberDesc(current.getFormId()).orElse(current);
        if (isRecent(latest)) {
            log.info("Edit session: Reusing very recent version v{} for fields update", latest.getVersionNumber());
            // Clear existing fields for this version before re-saving
            fieldRepository.deleteByFormVersionId(latest.getId());
            
            List<FormField> newFields = new ArrayList<>();
            int order = 1;
            for (UpdateFieldRequest req : incoming) {
                FormField field = buildFormField(req);
                field.setFormVersion(latest);
                field.setForm(form);
                field.setDisplayOrder(order++);
                newFields.add(field);
            }
            fieldRepository.saveAll(newFields);
            ensureSchemaForVersion(form, latest);
            return toDtoWithFields(latest);
        }

        int nextNumber = versionRepository.findMaxVersionNumber(current.getFormId()) + 1;
        
        // Rule 4.2: When a NEW version becomes ACTIVE, ALL drafts from the previous version MUST be deleted.
        discardDraftsForVersion(current.getFormId(), current.getId());

        versionRepository.unsetLatestForForm(current.getFormId());
        versionRepository.deactivateAllForForm(current.getFormId());

        FormVersion newVersion = FormVersion.builder()
                .formId(current.getFormId())
                .versionNumber(nextNumber)
                .isActive(true) // Rule 2: New version automatically becomes ACTIVE.
                .isLatest(true)
                .rules(current.getRules() != null ? current.getRules() : "[]")
                .createdBy(SessionUtil.getCurrentUsername())
                .createdAt(LocalDateTime.now())
                .build();
        newVersion = versionRepository.save(newVersion);

        // Save incoming fields to the NEW version
        List<FormField> newFields = new ArrayList<>();
        int order = 1;
        for (UpdateFieldRequest req : incoming) {
            FormField field = buildFormField(req);
            field.setFormVersion(newVersion);
            field.setForm(form);
            field.setDisplayOrder(order++);
            newFields.add(field);
        }
        fieldRepository.saveAll(newFields);

        // Sync schema
        ensureSchemaForVersion(form, newVersion);
        
        // FIXED: Removed form.setStatus(PUBLISHED). Save does not trigger publish.

        log.info("Edit session: Created new active version {} for form {}", nextNumber, current.getFormId());
        return toDtoWithFields(newVersion);
    }

    @Transactional
    public FormVersionDto updateVersionRules(UUID versionId, String rulesJson) {
        FormVersion current = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found"));

        Form form = getFormOrThrow(current.getFormId()); // FIXED: Need form to check status

        // FIXED: IF form is DRAFT, update the existing version in-place
        if (form.getStatus() == com.example.formBuilder.enums.FormStatus.DRAFT) {
            log.info("Draft Rules Update: Updating existing draft version v{} rules", current.getVersionNumber());
            current.setRules(rulesJson != null ? rulesJson : "[]");
            current.setUpdatedAt(LocalDateTime.now());
            versionRepository.save(current);
            // FIXED: Do NOT call ensureSchemaForVersion or change form status
            return toDtoWithFields(current);
        }

        // REUSE LOGIC: Update existing if very recent
        FormVersion latest = versionRepository.findFirstByFormIdOrderByVersionNumberDesc(current.getFormId()).orElse(current);
        if (isRecent(latest)) {
            log.info("Rules update: Reusing very recent version v{}", latest.getVersionNumber());
            latest.setRules(rulesJson != null ? rulesJson : "[]");
            latest.setUpdatedAt(LocalDateTime.now());
            latest = versionRepository.save(latest);
            return toDtoWithFields(latest);
        }

        int nextNumber = versionRepository.findMaxVersionNumber(current.getFormId()) + 1;
        
        // Rule 4.2: Discard drafts when a NEW version becomes active.
        discardDraftsForVersion(current.getFormId(), current.getId());

        versionRepository.unsetLatestForForm(current.getFormId());
        versionRepository.deactivateAllForForm(current.getFormId());

        FormVersion newVersion = FormVersion.builder()
                .formId(current.getFormId())
                .versionNumber(nextNumber)
                .isActive(true)
                .isLatest(true)
                .rules(rulesJson != null ? rulesJson : "[]")
                .createdBy(SessionUtil.getCurrentUsername())
                .createdAt(LocalDateTime.now())
                .build();
        newVersion = versionRepository.save(newVersion);

        // Clone fields from 'current' to the NEW version
        List<FormField> currentFields = fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(versionId);

        List<FormField> clonedFields = cloneFields(currentFields, newVersion);
        fieldRepository.saveAll(clonedFields);
        
        // FIXED: Removed form.setStatus(PUBLISHED). Rules update does not trigger publish.
 
        log.info("Rules update: Created new active version {} for form {}", nextNumber, current.getFormId());
        return toDtoWithFields(newVersion);
    }

    private void validateUniqueFields(List<FormField> fields) {
        if (fields == null) return;
        Set<String> seen = new java.util.HashSet<>();
        for (FormField f : fields) {
            if (isDisplayOnly(f.getFieldType())) continue;
            String name = f.getFieldName();
            if (name == null || name.isBlank()) continue;
            String lower = name.toLowerCase();
            if (seen.contains(lower)) {
                log.error("CRITICAL: Duplicate field name '{}' detected for Version ID {}", name, f.getFormVersion() != null ? f.getFormVersion().getId() : "NULL");
                throw new ValidationException("Architectural error: Duplicate field name '" + name + "' found. Please ensure all form labels are unique.");
            }
            seen.add(lower);
        }
    }

    private void validateUniqueFieldNames(List<UpdateFieldRequest> incoming) {
        if (incoming == null) return;
        java.util.Set<String> seen = new java.util.HashSet<>();
        for (com.example.formBuilder.dto.UpdateFieldRequest req : incoming) {
            String name = req.getName();
            // Skip validation for display-only types since they have no DB column
            if (isDisplayOnly(req.getType())) continue;
             
            if (name == null || name.isBlank()) continue;
            
            if (seen.contains(name)) {
                log.error("Duplicate field name found: {}", name); // FIXED: Log duplicate
                throw new ValidationException("Duplicate field name: '" + name + "'. Each database-backed field MUST have a unique name.");
            }
            seen.add(name);
        }
    }

    private void discardDraftsForVersion(UUID formId, UUID versionId) {
        Form form = getFormOrThrow(formId);
        String tableName = form.getTableName();
        if (tableName == null) return;

        // FIXED: Check if table even exists before trying to UPDATE it. 
        // For DRAFT forms, the table is only created upon publication.
        if (!tableExists(tableName)) return;

        try {
            String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE form_version_id = ?::uuid AND is_draft = true";
            int count = jdbcTemplate.update(sql, versionId.toString());
            if (count > 0) log.info("Discarded {} drafts for version {} of form {}", count, versionId, formId);
        } catch (Exception e) { log.warn("Could not discard drafts for version {}: {}", versionId, e.getMessage()); }
    }

    private void discardDraftsForForm(UUID formId) {
        Form form = getFormOrThrow(formId);
        String tableName = form.getTableName();
        if (tableName == null) return;

        // FIXED: Check if table even exists before trying to UPDATE it.
        // Fails previously for edited DRAFT forms where table wasn't created yet.
        if (!tableExists(tableName)) return;

        try {
            String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE is_draft = true";
            int count = jdbcTemplate.update(sql);
            if (count > 0) log.info("Discarded all {} drafts for form {}", count, formId);
        } catch (Exception e) { log.warn("Could not discard drafts for form {}: {}", formId, e.getMessage()); }
    }

    private void validateFieldConsistency(UUID sourceVersionId, List<UpdateFieldRequest> incoming) {
        List<FormField> sourceFields = fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(sourceVersionId);

        Map<String, String> nameToType = sourceFields.stream()
                .filter(f -> f.getFieldName() != null)
                .collect(Collectors.toMap(FormField::getFieldName, FormField::getFieldType, (a, b) -> a));
        
        for (UpdateFieldRequest req : incoming) {
            String oldType = nameToType.get(req.getName());
            if (oldType != null && !oldType.equals(req.getType())) {
                throw new ValidationException("Field type consistency rule: Field '" + req.getName() + 
                        "' cannot change from " + oldType + " to " + req.getType());
            }
        }
    }

    private void applyFieldUpdates(FormField field, UpdateFieldRequest req) {
        field.setFieldName(req.getName());
        field.setFieldType(req.getType());
        field.setRequired(req.getRequired());
        field.setMinLength(req.getMinLength());
        field.setMaxLength(req.getMaxLength());
        field.setMin(req.getMin());
        field.setMax(req.getMax());
        field.setPattern(req.getPattern());
        field.setDefaultValue(req.getDefaultValue());
        field.setPlaceholder(req.getPlaceholder());
        field.setHelperText(req.getHelperText());
        field.setOptions(req.getOptions());
        field.setSourceTable(req.getSourceTable());
        field.setSourceColumn(req.getSourceColumn());
        field.setIsReadOnly(Boolean.TRUE.equals(req.getIsReadOnly()));
        field.setIsMultiSelect(Boolean.TRUE.equals(req.getIsMultiSelect()));
    }


    private FormField buildFormField(UpdateFieldRequest req) {
        FormField field = new FormField();
        applyFieldUpdates(field, req);
        return field;
    }

    /**
     * Requirement: Always create a new version on edit.
     * To prevent the 'triple version' issue caused by multiple rapid frontend requests (e.g. React StrictMode),
     * we reuse a version if it was created within the last 10 seconds for the same form and user.
     */
    @Transactional
    public FormVersionDto getOrCreateDraft(UUID formId) {
        java.util.Optional<FormVersion> latestOpt = versionRepository.findFirstByFormIdOrderByVersionNumberDesc(formId);

        if (latestOpt.isPresent()) {
            // Return the latest version. Branching (creating a new version) will only happen 
            // when the user actually saves their changes via updateVersionFields.
            return toDtoWithFields(latestOpt.get());
        }
        
        return createVersion(formId);
    }

    private boolean isRecent(FormVersion v) {
        if (v == null || v.getCreatedAt() == null) return false;
        LocalDateTime now = LocalDateTime.now();
        return v.getCreatedAt().isAfter(now.minusSeconds(10)) &&
               java.util.Objects.equals(v.getCreatedBy(), SessionUtil.getCurrentUsername());
    }

    /**
     * Startup migration: for every published/existing form that has no version records yet,
     * auto-create version 1 (active) from the form's current legacy fields/rules.
     * Runs idempotently — checks before inserting.
     */
    @Transactional
    public void migrateExistingForms() {
        List<Form> allForms = formRepository.findAll();
        for (Form form : allForms) {
            if (!versionRepository.existsByFormId(form.getId())) {
                log.info("Migrating form {} to versioning model", form.getId());
                autoCreateVersionForForm(form);
            }
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    private void autoCreateVersionForForm(Form form) {
        FormVersion v1 = FormVersion.builder()
                .formId(form.getId())
                .versionNumber(1)
                .isActive(form.getStatus() == com.example.formBuilder.enums.FormStatus.PUBLISHED)
                .isLatest(true) // Migrated first version is the latest
                .rules(form.getRules() != null ? form.getRules() : "[]")
                .createdBy("system-migration")
                .createdAt(form.getCreatedAt() != null ? form.getCreatedAt() : LocalDateTime.now())
                .build();
        v1 = versionRepository.save(v1);

        // Link existing fields to this version
        List<FormField> legacyFields = fieldRepository.findByFormIdOrderByDisplayOrderAscIdAsc(form.getId());

        int order = 1;
        for (FormField f : legacyFields) {
            f.setFormVersion(v1);
            f.setDisplayOrder(order++);
        }
        fieldRepository.saveAll(legacyFields);
    }

    private FormVersion resolveSourceVersion(UUID formId) {
        // prefer active version; fall back to the highest numbered version
        return versionRepository.findByFormIdAndIsActiveTrue(formId)
                .or(() -> versionRepository.findByFormIdOrderByVersionNumberAsc(formId)
                        .stream().reduce((a, b) -> b))
                .orElse(null);
    }

    private List<FormField> resolveFieldsToClone(UUID formId, FormVersion source) {
        if (source == null) {
            // FIXED: seed from initial/legacy form fields (where version_id is null)
            // findByFormId was previously returning duplicates (v1 fields + null fields)
            return fieldRepository.findByFormIdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(formId);
        }
        return fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(source.getId());
    }

    private List<FormField> cloneFields(List<FormField> source, FormVersion targetVersion) {
        List<FormField> clones = new ArrayList<>();
        int order = 1;
        for (FormField f : source) {
            FormField clone = new FormField();
            clone.setFieldName(f.getFieldName());
            clone.setFieldType(f.getFieldType());
            clone.setRequired(f.getRequired());
            clone.setMinLength(f.getMinLength());
            clone.setMaxLength(f.getMaxLength());
            clone.setMin(f.getMin());
            clone.setMax(f.getMax());
            clone.setPattern(f.getPattern());
            clone.setBeforeDate(f.getBeforeDate());
            clone.setAfterDate(f.getAfterDate());
            clone.setAfterTime(f.getAfterTime());
            clone.setBeforeTime(f.getBeforeTime());
            clone.setMaxFileSize(f.getMaxFileSize());
            clone.setAllowedFileTypes(f.getAllowedFileTypes());
            clone.setOptions(f.getOptions() != null ? new ArrayList<>(f.getOptions()) : null);
            clone.setSourceTable(f.getSourceTable());
            clone.setSourceColumn(f.getSourceColumn());
            clone.setDefaultValue(f.getDefaultValue());
            clone.setPlaceholder(f.getPlaceholder());
            clone.setHelperText(f.getHelperText());
            clone.setIsReadOnly(f.getIsReadOnly());
            clone.setIsMultiSelect(f.getIsMultiSelect());
            clone.setIsDeleted(false);

            clone.setForm(f.getForm());
            clone.setFormVersion(targetVersion);
            clone.setDisplayOrder(f.getDisplayOrder() != null ? f.getDisplayOrder() : order);
            order++;
            clones.add(clone);
        }
        return clones;
    }

    private boolean tableExists(String tableName) {
        if (tableName == null) return false;
        try {
            // FIXED: Using to_regclass is safer and faster in Postgres
            String sql = "SELECT to_regclass(?) IS NOT NULL";
            return Boolean.TRUE.equals(jdbcTemplate.queryForObject(sql, Boolean.class, tableName));
        } catch (Exception e) {
            log.warn("Table existence check failed for {}: {}", tableName, e.getMessage());
            return false;
        }
    }

    private void ensureSchemaForVersion(Form form, FormVersion version) {
        // FIXED: Do NOT perform schema operations for DRAFT forms. table is created only on publish.
        if (form.getStatus() != FormStatus.PUBLISHED) {
            log.info("Skipping schema sync: form {} is in {} state", form.getId(), form.getStatus()); // FIXED: Changed to info for visibility
            return;
        }

        String tableName = form.getTableName();
        log.info("Ensuring schema for form {} (table: {}) using version {}", form.getId(), tableName, version.getVersionNumber());
        
        if (tableName == null) {
            log.warn("Cannot ensure schema: tableName is null for form {}", form.getId());
            return;
        }
        
        List<FormField> fields = fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(version.getId());

        log.info("Found {} fields for version {} of form {}", fields.size(), version.getVersionNumber(), form.getId());
        
        // FIXED: Fail early if there are duplicates to prevent Bad SQL Grammar
        validateUniqueFields(fields);
        
        if (fields.isEmpty()) {
            log.warn("Warning: version {} has NO fields. Table creation might yield an empty form.", version.getVersionNumber());
        }

        // FIXED: Use helper method
        if (!tableExists(tableName)) {
            // Table doesn't exist — create it
            schemaManager.createDynamicTable(tableName, fields);
            // Add common columns if not present
            addMissingCommonColumns(tableName);
            return;
        }

        // Table exists — add any missing columns (schema evolution)
        addMissingCommonColumns(tableName);
        for (FormField field : fields) {
            if (isDisplayOnly(field.getFieldType())) continue;
            try {
                String colCheck = "SELECT COUNT(*) FROM information_schema.columns " +
                        "WHERE table_name = ? AND column_name = ?";
                Integer colCount = jdbcTemplate.queryForObject(colCheck, Integer.class,
                        tableName, field.getFieldName());
                if (colCount == null || colCount == 0) {
                    schemaManager.addColumn(tableName, field);
                }
            } catch (Exception ex) {
                log.warn("Could not check/add column {} to {}: {}", field.getFieldName(), tableName, ex.getMessage());
            }
        }

        // ── Drift verification after schema sync ─────────────────────────────────
        // All missing columns should have been added above. If drift still exists,
        // something went wrong — block the publish to prevent broken submissions.
        List<String> remainingDrift = schemaManager.detectDrift(tableName, fields);
        if (!remainingDrift.isEmpty()) {
            throw new com.example.formBuilder.exception.ValidationException(
                "Publish blocked: schema drift detected after migration attempt. " +
                "Missing columns in table '" + tableName + "': " +
                String.join(", ", remainingDrift) + ". Manual database intervention required."
            );
        }
    }


    private void addMissingCommonColumns(String tableName) {
        try {
            // form_version_id is now UUID (not BIGINT)
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN IF NOT EXISTS form_version_id UUID");
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT FALSE NOT NULL");
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL");
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN IF NOT EXISTS submitted_by VARCHAR(100)");
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL");
        } catch (Exception e) {
            log.warn("Could not add common columns to {}: {}", tableName, e.getMessage());
        }
    }

    private boolean isDisplayOnly(String type) {
        return type != null && (type.equals("page_break") || type.equals("heading")
                || type.equals("paragraph") || type.equals("divider"));
    }

    private Form getFormOrThrow(UUID formId) {
        return formRepository.findById(formId)
                .orElseThrow(() -> new ResourceNotFoundException("Form " + formId + " not found"));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // DTO MAPPING
    // ─────────────────────────────────────────────────────────────────────────

    private FormVersionDto toDto(FormVersion v) {
        return FormVersionDto.builder()
                .id(v.getId())
                .formId(v.getFormId())
                .versionNumber(v.getVersionNumber())
                .isActive(v.getIsActive())
                .isLatest(v.getIsLatest())
                .rules(v.getRules())
                .createdBy(v.getCreatedBy())
                .createdAt(v.getCreatedAt())
                .updatedAt(v.getUpdatedAt())
                .build();
    }

    private FormVersionDto toDtoWithFields(FormVersion version) {
        List<FormField> fields = fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(version.getId());

        List<FormFieldResponseDto> fieldDtos = fields.stream()
                .filter(f -> !Boolean.TRUE.equals(f.getIsDeleted()))
                .map(f -> FormFieldResponseDto.builder()
                        .id(f.getId())
                        .fieldName(f.getFieldName())
                        .fieldType(f.getFieldType())
                        .required(f.getRequired())
                        .minLength(f.getMinLength())
                        .maxLength(f.getMaxLength())
                        .min(f.getMin())
                        .max(f.getMax())
                        .pattern(f.getPattern())
                        .beforeDate(f.getBeforeDate())
                        .afterDate(f.getAfterDate())
                        .afterTime(f.getAfterTime())
                        .beforeTime(f.getBeforeTime())
                        .options(f.getOptions() != null ? new ArrayList<>(f.getOptions()) : null)
                        .sourceTable(f.getSourceTable())
                        .sourceColumn(f.getSourceColumn())
                        .defaultValue(f.getDefaultValue())
                        .placeholder(f.getPlaceholder())
                        .helperText(f.getHelperText())
                        .maxFileSize(f.getMaxFileSize())
                        .allowedFileTypes(f.getAllowedFileTypes())
                        .isReadOnly(f.getIsReadOnly())
                        .isMultiSelect(f.getIsMultiSelect())
                        .build())

                .collect(Collectors.toList());

        return FormVersionDto.builder()
                .id(version.getId())
                .formId(version.getFormId())
                .versionNumber(version.getVersionNumber())
                .isActive(version.getIsActive())
                .createdBy(version.getCreatedBy())
                .createdAt(version.getCreatedAt())
                .rules(version.getRules())
                .fields(fieldDtos)
                .build();
    }
}
