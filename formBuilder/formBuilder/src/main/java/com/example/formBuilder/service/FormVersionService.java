package com.example.formBuilder.service;

import com.example.formBuilder.dto.FormFieldResponseDto;
import com.example.formBuilder.dto.FormVersionDto;
import com.example.formBuilder.dto.UpdateFieldRequest;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.entity.FormVersion;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
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

    // ─────────────────────────────────────────────────────────────────────────
    // PUBLIC API
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Returns all versions for a form, ordered ascending (oldest first).
     */
    public List<FormVersionDto> getVersions(Long formId) {
        getFormOrThrow(formId);
        return versionRepository.findByFormIdOrderByVersionNumberAsc(formId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /**
     * Returns a specific version with full field list.
     */
    public FormVersionDto getVersion(Long formId, Long versionId) {
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
    public FormVersionDto createVersion(Long formId) {
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
                .isActive(true)
                .isLatest(true)
                .rules(source != null && source.getRules() != null ? source.getRules() : (form.getRules() != null ? form.getRules() : "[]"))
                .createdBy(username)
                .createdAt(LocalDateTime.now())
                .build();
        newVersion = versionRepository.save(newVersion);

        // Clone fields from source version (or from the form's legacy fields)
        List<FormField> sourceFields = resolveFieldsToClone(formId, source);
        List<FormField> clonedFields = cloneFields(sourceFields, newVersion);
        fieldRepository.saveAll(clonedFields);

        // Ensure schema is updated for this new active version
        ensureSchemaForVersion(form, newVersion);
        
        // Sync parent form status
        form.setStatus(com.example.formBuilder.enums.FormStatus.PUBLISHED);
        formRepository.save(form);

        log.info("Created and activated version {} for form {}", nextNumber, formId);
        return toDtoWithFields(newVersion);
    }

    /**
     * Seeds the very first version (v1) for a brand new form.
     */
    @Transactional
    public FormVersionDto createInitialVersion(Long formId, List<FormField> fields, String rules) {
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
        fieldRepository.saveAll(fields);

        ensureSchemaForVersion(form, v1);
        
        form.setStatus(com.example.formBuilder.enums.FormStatus.PUBLISHED);
        formRepository.save(form);

        return toDtoWithFields(v1);
    }

    /**
     * Activates a version, deactivating all others. Also discards draft submissions
     * written against any previously active version.
     */
    @Transactional
    public FormVersionDto activateVersion(Long formId, Long versionId) {
        Form form = getFormOrThrow(formId);

        FormVersion toActivate = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version " + versionId + " not found"));
        if (!toActivate.getFormId().equals(formId)) {
            throw new ValidationException("Version does not belong to the specified form");
        }

        // Requirement 3: isLatest should NOT change when manually activating an older version.
        // But we must deactivate all others.
        log.info("Manually activating version {} for form {}", toActivate.getVersionNumber(), formId);
        
        // Rule 8: On every activation, old drafts MUST be deleted.
        // We delete drafts for ALL versions except the one being activated? 
        // No, rule says "drafts from the previous version MUST be deleted" when a NEW one becomes active.
        // And "On every activation: Old drafts MUST be deleted".
        // This implies we should clear drafts for the form generally when switching.
        discardDraftsForForm(formId);

        versionRepository.deactivateAllForForm(formId);
        toActivate.setIsActive(true);
        versionRepository.saveAndFlush(toActivate);

        // Ensure DB schema reflects this version's fields
        ensureSchemaForVersion(form, toActivate);

        // Sync Form status
        form.setStatus(com.example.formBuilder.enums.FormStatus.PUBLISHED);
        formRepository.saveAndFlush(form);

        log.info("Successfully activated version {} for form {}", toActivate.getVersionNumber(), formId);
        return toDtoWithFields(toActivate);
    }

    /**
     * Requirement 2: Do NOT update the existing form record. Create a new form record as a new version.
     * We use 'versionId' as the source for the NEW version.
     */
    @Transactional
    public FormVersionDto updateVersionFields(Long versionId, List<UpdateFieldRequest> incoming) {
        FormVersion current = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found"));
        
        // Rule 5: Once a field is created with a specific type, its type MUST NEVER change.
        validateFieldConsistency(current.getId(), incoming);

        // REUSE LOGIC: If the LATEST version for this form is very recent (< 10s) 
        // and was created by the same user, UPDATE it instead of creating another version.
        FormVersion latest = versionRepository.findFirstByFormIdOrderByVersionNumberDesc(current.getFormId()).orElse(current);
        if (isRecent(latest)) {
            log.info("Edit session: Reusing very recent version v{} for fields update", latest.getVersionNumber());
            // Clear existing fields for this version before re-saving
            fieldRepository.deleteByFormVersionId(latest.getId());
            
            List<FormField> newFields = new ArrayList<>();
            int order = 1;
            Form form = getFormOrThrow(current.getFormId());
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
        // Rule 8: On every activation (or creation of new active version), old drafts MUST be deleted.
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
        Form form = getFormOrThrow(current.getFormId());
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
        
        form.setStatus(com.example.formBuilder.enums.FormStatus.PUBLISHED);
        formRepository.save(form);

        log.info("Edit session: Created new active version {} for form {}", nextNumber, current.getFormId());
        return toDtoWithFields(newVersion);
    }

    @Transactional
    public FormVersionDto updateVersionRules(Long versionId, String rulesJson) {
        FormVersion current = versionRepository.findById(versionId)
                .orElseThrow(() -> new ResourceNotFoundException("Version not found"));

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
        List<FormField> currentFields = fieldRepository.findByFormVersionId(versionId);
        List<FormField> clonedFields = cloneFields(currentFields, newVersion);
        fieldRepository.saveAll(clonedFields);
        
        Form form = getFormOrThrow(current.getFormId());
        form.setStatus(com.example.formBuilder.enums.FormStatus.PUBLISHED);
        formRepository.save(form);

        log.info("Rules update: Created new active version {} for form {}", nextNumber, current.getFormId());
        return toDtoWithFields(newVersion);
    }

    private void discardDraftsForVersion(Long formId, Long versionId) {
        Form form = getFormOrThrow(formId);
        String tableName = form.getTableName();
        if (tableName == null) return;
        try {
            String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE form_version_id = ? AND is_draft = true";
            int count = jdbcTemplate.update(sql, versionId);
            if (count > 0) log.info("Discarded {} drafts for version {} of form {}", count, versionId, formId);
        } catch (Exception e) { log.warn("Could not discard drafts for version {}: {}", versionId, e.getMessage()); }
    }

    private void discardDraftsForForm(Long formId) {
        Form form = getFormOrThrow(formId);
        String tableName = form.getTableName();
        if (tableName == null) return;
        try {
            String sql = "UPDATE " + tableName + " SET is_deleted = true WHERE is_draft = true";
            int count = jdbcTemplate.update(sql);
            if (count > 0) log.info("Discarded all {} drafts for form {}", count, formId);
        } catch (Exception e) { log.warn("Could not discard drafts for form {}: {}", formId, e.getMessage()); }
    }

    private void validateFieldConsistency(Long sourceVersionId, List<UpdateFieldRequest> incoming) {
        List<FormField> sourceFields = fieldRepository.findByFormVersionId(sourceVersionId);
        java.util.Map<String, String> nameToType = sourceFields.stream()
                .filter(f -> f.getFieldName() != null)
                .collect(java.util.stream.Collectors.toMap(FormField::getFieldName, FormField::getFieldType, (a, b) -> a));
        
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
    public FormVersionDto getOrCreateDraft(Long formId) {
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
        List<FormField> legacyFields = fieldRepository.findByFormId(form.getId());
        int order = 1;
        for (FormField f : legacyFields) {
            f.setFormVersion(v1);
            f.setDisplayOrder(order++);
        }
        fieldRepository.saveAll(legacyFields);
    }

    private FormVersion resolveSourceVersion(Long formId) {
        // prefer active version; fall back to the highest numbered version
        return versionRepository.findByFormIdAndIsActiveTrue(formId)
                .or(() -> versionRepository.findByFormIdOrderByVersionNumberAsc(formId)
                        .stream().reduce((a, b) -> b))
                .orElse(null);
    }

    private List<FormField> resolveFieldsToClone(Long formId, FormVersion source) {
        if (source == null) {
            // seed from legacy form fields
            return fieldRepository.findByFormId(formId);
        }
        return fieldRepository.findByFormVersionId(source.getId());
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
            clone.setIsDeleted(false);
            clone.setForm(f.getForm());
            clone.setFormVersion(targetVersion);
            clone.setDisplayOrder(f.getDisplayOrder() != null ? f.getDisplayOrder() : order);
            order++;
            clones.add(clone);
        }
        return clones;
    }

    private void discardDraftsForVersion(Form form, FormVersion prev) {
        String tableName = form.getTableName();
        if (tableName == null) return;
        try {
            // Check if is_draft column exists before attempting update
            String checkSql = "SELECT COUNT(*) FROM information_schema.columns " +
                    "WHERE table_name = ? AND column_name = 'is_draft'";
            Integer count = jdbcTemplate.queryForObject(checkSql, Integer.class, tableName);
            if (count != null && count > 0) {
                String discardSql = "UPDATE " + tableName +
                        " SET is_deleted = true WHERE form_version_id = ? AND is_draft = true";
                int discarded = jdbcTemplate.update(discardSql, prev.getId());
                log.info("Discarded {} drafts from version {} for form {}", discarded, prev.getId(), form.getId());
            }
        } catch (Exception e) {
            log.warn("Could not discard drafts for version {}: {}", prev.getId(), e.getMessage());
        }
    }

    private void ensureSchemaForVersion(Form form, FormVersion version) {
        String tableName = form.getTableName();
        if (tableName == null) return;
        List<FormField> fields = fieldRepository.findByFormVersionId(version.getId());

        // If table doesn't exist yet, create it
        // Check if table exists via information_schema
        String tableCheckSql = "SELECT COUNT(*) FROM information_schema.tables WHERE table_name = ?";
        Integer tableCount = jdbcTemplate.queryForObject(tableCheckSql, Integer.class, tableName);
        
        if (tableCount == null || tableCount == 0) {
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
    }

    private void addMissingCommonColumns(String tableName) {
        try {
            jdbcTemplate.execute("ALTER TABLE " + tableName + " ADD COLUMN IF NOT EXISTS form_version_id BIGINT");
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

    private Form getFormOrThrow(Long formId) {
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
        List<FormField> fields = fieldRepository.findByFormVersionId(version.getId());
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
