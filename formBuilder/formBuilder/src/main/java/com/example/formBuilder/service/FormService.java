package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormVersion;
import com.example.formBuilder.entity.PermittedUser;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.UserRepository;
import com.example.formBuilder.repository.FormFieldRepository;
import com.example.formBuilder.repository.FormRepository;
import com.example.formBuilder.repository.FormVersionRepository;
import com.example.formBuilder.security.SessionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static com.example.formBuilder.enums.FormStatus.PUBLISHED;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;


@Slf4j
@Service
@RequiredArgsConstructor
public class FormService {

    private final FormRepository formRepository;
    private final FormFieldRepository fieldRepository;
    private final JdbcTemplate jdbcTemplate;
    private final SchemaManager schemaManager;
    private final ObjectMapper objectMapper;
    private final UserRepository userRepository;
    private final FormVersionRepository versionRepository;

    
    @Autowired
    private FormVersionService versionService;

    private User getCurrentUser() {
        String username = SessionUtil.getCurrentUsername();
        if (username == null) throw new ValidationException("Unauthorized");
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ValidationException("User not found"));
    }

    private Form getFormWithPermission(UUID id) {
        Form form = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + id + " not found"));
        
        // Basic user check - only creator can edit
        User user = getCurrentUser();
        if (form.getUser() != null && !form.getUser().getId().equals(user.getId())) {
             throw new ValidationException("Access denied: You do not own this form");
        }
        
        return form;
    }

    private static final Pattern VALID_NAME =
            Pattern.compile(AppConstants.VALID_NAME_REGEX);

    /** Returns true for types that are purely visual and have no DB column. */
    private static boolean isDisplayOnly(String type) {
        return type != null && (type.equals("page_break") ||
                type.equals("heading") || type.equals("paragraph") || type.equals("divider"));
    }

    /** Converts a UUID to a safe PostgreSQL table-name suffix (hyphens → underscores). */
    private static String uuidToTableSuffix(UUID id) {
        return id.toString().replace("-", "_");
    }

    public Form getFormById(UUID id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + id + " not found"));
    }

    public FormResponseDto getFormResponseById(UUID id) {
        Form form = getFormById(id);
        
        // If form is not published, only the owner can see it
        if (form.getStatus() != PUBLISHED) {
            getFormWithPermission(id);
        }

        FormResponseDto dto = mapToResponseDto(form);
        try {
            String json = objectMapper.writeValueAsString(dto);
            log.info("Successfully serialized form DTO: {}", json.substring(0, Math.min(json.length(), 100)));
        } catch (Exception e) {
            log.error("Failed to serialize form DTO manually: {}", e.getMessage(), e);
            throw new RuntimeException("Serialization failed for form " + id + ": " + e.getMessage());
        }
        return dto;
    }

    private List<FormField> getActiveFields(Form form) {
        return versionRepository.findByFormIdAndIsActiveTrue(form.getId())
                .map(v -> fieldRepository.findByFormVersionId(v.getId()))
                .orElseGet(form::getFields);
    }

    private String getActiveRules(Form form) {
        return versionRepository.findByFormIdAndIsActiveTrue(form.getId())
                .map(FormVersion::getRules)
                .orElseGet(form::getRules);
    }

    private FormResponseDto mapToResponseDto(Form form) {
        List<FormField> activeFields = getActiveFields(form);
        String activeRules = getActiveRules(form);

        return FormResponseDto.builder()
                .id(form.getId())
                .formName(form.getFormName())
                .tableName(form.getTableName())
                .createdAt(form.getCreatedAt())
                .status(form.getStatus())
                .rules(activeRules)
                .fields(activeFields.stream()
                        .map(this::mapFieldToResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private FormFieldResponseDto mapFieldToResponse(FormField f) {
        return FormFieldResponseDto.builder()
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
                .build();
    }

    private List<FormField> getFieldsForVersion(Form form, UUID versionId) {
        if (versionId != null) {
            return fieldRepository.findByFormVersionId(versionId);
        }
        return getActiveFields(form);
    }

    public Map<String, Object> getAllDataFromTable(UUID id, UUID versionId, int page, int size, String sortBy, String direction) {
        Form form = getFormWithPermission(id);

        String tableName = form.getTableName();

        if (!tableName.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid table name");
        }

        // Validate sorting direction
        if (!direction.equalsIgnoreCase("asc") && !direction.equalsIgnoreCase("desc")) {
            direction = "asc";
        }

        int offset = page * size;

        StringBuilder queryBuilder = new StringBuilder("SELECT * FROM " + tableName + " WHERE is_deleted = false");
        List<Object> queryParams = new ArrayList<>();

        if (versionId != null) {
            queryBuilder.append(" AND form_version_id = ?");
            queryParams.add(versionId);
        }

        queryBuilder.append(" ORDER BY ").append(sortBy).append(" ").append(direction).append(" LIMIT ? OFFSET ?");
        queryParams.add(size);
        queryParams.add(offset);

        List<Map<String, Object>> dataList = jdbcTemplate.queryForList(queryBuilder.toString(), queryParams.toArray());

        // Filter columns to only include active fields for the target version
        List<FormField> activeFields = getFieldsForVersion(form, versionId);
        Set<String> activeFieldNames = activeFields.stream()
                .filter(f -> !isDisplayOnly(f.getFieldType()))
                .map(FormField::getFieldName)
                .collect(Collectors.toSet());
        activeFieldNames.add("id");
        activeFieldNames.add("created_at");

        for (Map<String, Object> row : dataList) {
            row.keySet().retainAll(activeFieldNames);
        }

        // STEP: Resolve Lookup UUIDs to Labels for Display
        List<FormField> lookupFields = activeFields.stream()
                .filter(f -> f.getSourceTable() != null && !f.getSourceTable().isBlank())
                .collect(Collectors.toList());

        for (FormField field : lookupFields) {
            String col = field.getFieldName();
            String sourceFormId = field.getSourceTable();
            // sourceTable stores a form UUID or legacy form ID — build table name accordingly
            String sourceTable = "form_" + sourceFormId.replace("-", "_");
            String sourceCol = field.getSourceColumn();

            // Collect unique UUID strings from this column in the current page
            Set<String> idsToResolve = new HashSet<>();
            for (Map<String, Object> row : dataList) {
                Object val = row.get(col);
                if (val != null) {
                    String[] parts = val.toString().split(",");
                    for (String part : parts) {
                        String trimmed = part.trim();
                        if (!trimmed.isEmpty()) {
                            idsToResolve.add(trimmed);
                        }
                    }
                }
            }

            if (idsToResolve.isEmpty()) continue;

            // Batch fetch labels: Map<id-string, label>
            String inClause = idsToResolve.stream()
                    .map(s -> "'" + s.replace("'", "''") + "'")
                    .collect(Collectors.joining(","));
            String labelSql = "SELECT id::text, " + sourceCol + " as label FROM " + sourceTable + " WHERE id::text IN (" + inClause + ")";
            
            try {
                Map<String, String> labelMap = jdbcTemplate.query(labelSql, rs -> {
                    Map<String, String> map = new HashMap<>();
                    while (rs.next()) {
                        map.put(rs.getString("id"), rs.getString("label"));
                    }
                    return map;
                });

                // Replace IDs with Labels in the data list
                for (Map<String, Object> row : dataList) {
                    Object idVal = row.get(col);
                    if (idVal != null) {
                        String[] parts = idVal.toString().split(",");
                        List<String> labels = new ArrayList<>();
                        for (String part : parts) {
                            String trimmed = part.trim();
                            String label = labelMap.get(trimmed);
                            labels.add(label != null ? label : trimmed);
                        }
                        row.put(col, String.join(", ", labels));
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to resolve lookup labels for column {} using table {}: {}", col, sourceTable, e.getMessage());
            }
        }

        StringBuilder countQueryBuilder = new StringBuilder("SELECT COUNT(*) FROM " + tableName + " WHERE is_deleted = false");
        List<Object> countParams = new ArrayList<>();
        if (versionId != null) {
            countQueryBuilder.append(" AND form_version_id = ?");
            countParams.add(versionId);
        }
        Integer total = jdbcTemplate.queryForObject(countQueryBuilder.toString(), Integer.class, countParams.toArray());

        Map<String, Object> response = new HashMap<>();
        response.put("content", dataList);
        response.put("page", page);
        response.put("size", size);
        response.put("totalElements", total);
        response.put("totalPages", (int) Math.ceil((double) total / size));

        return response;
    }

    public List<FormListDto> getAllForms() {
        User user = getCurrentUser();
        List<Form> forms = formRepository.findByUserId(user.getId());
        
        return forms.stream()
                .map(form -> new FormListDto(form.getId(), form.getFormName(), form.getStatus()))
                .collect(Collectors.toList());
    }


    public List<Map<String, Object>> getLookupValues(UUID formId, String columnName) {
        Form form = getFormById(formId);
        String tableName = form.getTableName();

        // Check if the column belongs to an active field
        boolean isActive = getActiveFields(form).stream()
                .anyMatch(f -> f.getFieldName().equals(columnName));

        if (!isActive) {
            throw new ValidationException("Cannot lookup values for inactive or non-existent field: " + columnName);
        }

        if (!columnName.matches("^[a-zA-Z][a-zA-Z0-9_]*$")) {
            throw new IllegalArgumentException("Invalid column name");
        }

        String sql = "SELECT MIN(id::text) as id, " + columnName + " as value FROM " + tableName +
                " WHERE is_deleted = false AND " + columnName + " IS NOT NULL" +
                " GROUP BY " + columnName;
        return jdbcTemplate.queryForList(sql);
    }

    public String publishForm(UUID id) {
        Form form = getFormWithPermission(id);

        // Find the latest non-active (draft) version for this form
        Optional<FormVersion> draftVersionOpt = versionRepository.findByFormIdOrderByVersionNumberAsc(form.getId())
                .stream()
                .filter(v -> !Boolean.TRUE.equals(v.getIsActive()))
                .reduce((first, second) -> second);

        if (draftVersionOpt.isPresent()) {
            // Activate the draft version through the version service
            versionService.activateVersion(form.getId(), draftVersionOpt.get().getId());
            return "Form published via version " + draftVersionOpt.get().getVersionNumber();
        }

        // If the form has NO versions at all (e.g., just created), generate Version 1 now.
        if (!versionRepository.existsByFormId(form.getId())) {
            List<FormField> fields = fieldRepository.findByFormId(id);
            versionService.createInitialVersion(form.getId(), fields, form.getRules());
            return "Form Published Successfully";
        }

        return "Form is already published and has no pending drafts.";
    }

    @Transactional
    public String createForm(FormRequest request) {
        // Step 1: Pre-validate all fields before saving anything
        Set<String> fieldNames = new HashSet<>();
        for (FieldRequest field : request.getFields()) {
            if (!isDisplayOnly(field.getType())) {
                String name = field.getName();
                if (name == null || name.isBlank()) {
                    throw new ValidationException("Field name cannot be empty");
                }
                schemaManager.validateColumnName(name); // Throws if reserved or invalid
                String lowerName = name.toLowerCase();
                if (fieldNames.contains(lowerName)) {
                    throw new ValidationException("Duplicate field name found: " + name + ". Each field must have a unique name.");
                }
                fieldNames.add(lowerName);
            }
        }

        User user = getCurrentUser();
        
        Form form = new Form();
        form.setFormName(request.getFormName());
        form.setUser(user);
        form.setStatus(com.example.formBuilder.enums.FormStatus.DRAFT);
        form = formRepository.save(form);

        // Build table name from UUID (replace hyphens with underscores for PostgreSQL compatibility)
        String tableName = "form_" + uuidToTableSuffix(form.getId());
        form.setTableName(tableName);

        // Serialize rules if provided
        if (request.getRules() != null && !request.getRules().isEmpty()) {
            try {
                form.setRules(objectMapper.writeValueAsString(request.getRules()));
            } catch (Exception e) {
                log.warn("Failed to serialize rules — rules will not be saved: {}", e.getMessage());
            }
        }

        formRepository.save(form);

        List<FormField> fieldList = new ArrayList<>();

        for (FieldRequest field : request.getFields()) {

            // Display-only fields (page_break, heading, paragraph, divider) — persist but never as DB columns
            boolean isDisplayOnlyField = isDisplayOnly(field.getType());

            FormField formField = new FormField();

            formField.setFieldName(field.getName());
            formField.setFieldType(field.getType());

            if (!isDisplayOnlyField) {
                formField.setRequired(field.getRequired());
                formField.setMinLength(field.getMinLength());
                formField.setMaxLength(field.getMaxLength());
                formField.setMin(field.getMin());
                formField.setMax(field.getMax());
                formField.setPattern(field.getPattern());
                formField.setDefaultValue(field.getDefaultValue());
                formField.setAfterTime(field.getAfterTime());
                formField.setBeforeTime(field.getBeforeTime());
                formField.setMaxFileSize(field.getMaxFileSize());
                formField.setAllowedFileTypes(field.getAllowedFileTypes());
                formField.setBeforeDate(
                        field.getBeforeDate() != null ?
                                LocalDate.parse(field.getBeforeDate()) : null
                );
                formField.setAfterDate(
                        field.getAfterDate() != null ?
                                LocalDate.parse(field.getAfterDate()) : null
                );
                formField.setOptions(field.getOptions());
                formField.setPlaceholder(field.getPlaceholder());
                formField.setHelperText(field.getHelperText());
                formField.setSourceTable(field.getSourceTable());
                formField.setSourceColumn(field.getSourceColumn());
                formField.setIsReadOnly(field.getIsReadOnly() != null ? field.getIsReadOnly() : false);
            } else {
                // For display-only types, store the human-readable label text in defaultValue
                // so the public form can render it without needing a separate column
                formField.setDefaultValue(field.getDefaultValue());
            }

            formField.setForm(form);
            fieldList.add(formField);
        }

        // Save the fields to the database associated with the form (but no version yet)
        fieldRepository.saveAll(fieldList);

        return "Form Created Successfully";
    }

    @Transactional
    public String updateForm(UUID formId, UpdateFormRequest request) {

        Form form = getFormWithPermission(formId);

        if (form.getStatus() == PUBLISHED) {
            throw new ValidationException("Cannot edit a published form directly. Please use the version editor.");
        }

        List<UpdateFieldRequest> incoming = request.getFields();

        // Validate field name uniqueness and keywords
        Set<String> fieldNames = new HashSet<>();
        for (UpdateFieldRequest fieldReq : incoming) {
            if (!isDisplayOnly(fieldReq.getType())) {
                String name = fieldReq.getName();
                schemaManager.validateColumnName(name); // Throws if invalid or reserved
                
                String lowerName = name.toLowerCase();
                if (fieldNames.contains(lowerName)) {
                    throw new ValidationException("Duplicate field name found: " + name);
                }
                fieldNames.add(lowerName);
            }
        }

        List<FormField> existingFields = fieldRepository.findByFormId(formId);

        Set<UUID> incomingIds = incoming.stream()
                .filter(f -> f.getId() != null)
                .map(UpdateFieldRequest::getId)
                .collect(Collectors.toSet());

        List<FormField> toDelete = existingFields.stream()
                .filter(f -> !incomingIds.contains(f.getId()))
                .toList();

        for (FormField deleted : toDelete) {
            deleted.setIsDeleted(true);
            // Relax database constraint if field was required
            if (!isDisplayOnly(deleted.getFieldType()) && form.getStatus() == PUBLISHED) {
                schemaManager.makeColumnNullable(form.getTableName(), deleted.getFieldName());
            }
        }
        fieldRepository.saveAll(toDelete);

        for (UpdateFieldRequest fieldReq : incoming) {
            boolean isDisplayOnly = isDisplayOnly(fieldReq.getType());

            if (fieldReq.getId() != null) {
                FormField existing = fieldRepository.findById(fieldReq.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldReq.getId() + " not found"));

                String oldName = existing.getFieldName();
                String newName = fieldReq.getName();

                if (!isDisplayOnly && form.getStatus() == PUBLISHED
                        && !oldName.equals(newName)) {
                    schemaManager.renameColumn(form.getTableName(), oldName, newName);
                }

                applyFieldUpdates(existing, fieldReq, form);
                fieldRepository.save(existing);

            } else {
                FormField newField = buildFormField(fieldReq, form);
                fieldRepository.save(newField);

                // Only add real data fields to the DB table schema
                if (!isDisplayOnly && form.getStatus() == PUBLISHED) {
                    schemaManager.addColumn(form.getTableName(), newField);
                }
            }
        }

        if (request.getRules() != null) {
            try {
                form.setRules(objectMapper.writeValueAsString(request.getRules()));
            } catch (Exception e) {
                log.warn("Failed to serialize updated rules: {}", e.getMessage());
            }
        }

        formRepository.save(form);
        return "Form updated successfully";
    }

    private void applyFieldUpdates(FormField field, UpdateFieldRequest req, Form form) {
        boolean isDisplayOnly = isDisplayOnly(req.getType());
        // Display-only fields don't need column-name validation since they're never DB columns
        if (!isDisplayOnly) {
            schemaManager.validateColumnName(req.getName());
        }
        field.setFieldName(req.getName());
        field.setFieldType(req.getType());
        if (!isDisplayOnly) {
            if (form.getStatus() == PUBLISHED && Boolean.TRUE.equals(field.getRequired()) && !Boolean.TRUE.equals(req.getRequired())) {
                schemaManager.makeColumnNullable(form.getTableName(), field.getFieldName());
            }
            field.setRequired(req.getRequired());
            field.setMinLength(req.getMinLength());
            field.setMaxLength(req.getMaxLength());
            field.setMin(req.getMin());
            field.setMax(req.getMax());
            field.setPattern(req.getPattern());
            field.setDefaultValue(req.getDefaultValue());
            field.setBeforeDate(req.getBeforeDate() != null
                    ? LocalDate.parse(req.getBeforeDate()) : null);
            field.setAfterDate(req.getAfterDate() != null
                    ? LocalDate.parse(req.getAfterDate()) : null);
            field.setOptions(req.getOptions());
            field.setPlaceholder(req.getPlaceholder());
            field.setHelperText(req.getHelperText());
            field.setAfterTime(req.getAfterTime());
            field.setBeforeTime(req.getBeforeTime());
            field.setSourceTable(req.getSourceTable());
            field.setSourceColumn(req.getSourceColumn());
            field.setMaxFileSize(req.getMaxFileSize());
            field.setAllowedFileTypes(req.getAllowedFileTypes());
            field.setIsReadOnly(req.getIsReadOnly() != null ? req.getIsReadOnly() : false);
        } else {
            // Persist label text for display-only elements (heading, paragraph, etc.)
            field.setDefaultValue(req.getDefaultValue());
        }
    }

    private FormField buildFormField(UpdateFieldRequest req, Form form) {
        FormField f = new FormField();
        applyFieldUpdates(f, req, form);
        f.setForm(form);
        return f;
    }

    public String getFormRules(UUID formId) {
        Form form = getFormWithPermission(formId);
        return getActiveRules(form);
    }

    public String saveFormRules(UUID formId, List<FormRuleDTO> rules) {
        Form form = getFormWithPermission(formId);
        try {
            form.setRules(objectMapper.writeValueAsString(rules));
            formRepository.save(form);
        } catch (Exception e) {
            throw new ValidationException("Failed to save rules: " + e.getMessage());
        }
        return "Rules saved successfully";
    }

    @Transactional
    public String deleteForm(UUID id) {
        Form form = getFormWithPermission(id);
        
        // Rule 3.4: Prevent deletion if there are live submissions
        if (hasLiveSubmissions(form)) {
            throw new ValidationException("Cannot delete form: It has live submissions. Please clear submissions first or disable the form.");
        }
        
        form.setIsDeleted(true);
        formRepository.save(form);
        return "Form deleted successfully";
    }

    private boolean hasLiveSubmissions(Form form) {
        if (form.getTableName() == null) return false;
        try {
            // "Live Submission" = active SUBMITTED row (not draft, not deleted)
            String sql = "SELECT COUNT(*) FROM " + form.getTableName() + " WHERE is_deleted = false AND is_draft = false";
            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
            return count != null && count > 0;
        } catch (Exception e) {
            log.warn("Could not check live submissions for form {}: {}", form.getId(), e.getMessage());
            return false;
        }
    }

    @Transactional
    public String updateVisibility(UUID formId, VisibilityRequest request) {
        Form form = getFormWithPermission(formId);

        if (request.getVisibilityType() != null) {
            form.setVisibilityType(request.getVisibilityType());
        }

        if (request.getPermittedUsers() != null) {
            form.getPermittedUsers().clear();
            final Form f = form;
            List<PermittedUser> puList = request.getPermittedUsers().stream()
                    .map(identifier -> {
                        PermittedUser pu = new PermittedUser();
                        pu.setIdentifier(identifier);
                        pu.setForm(f);
                        return pu;
                    }).collect(Collectors.toList());
            form.getPermittedUsers().addAll(puList);
        }

        formRepository.save(form);
        return "Visibility settings updated successfully";
    }
}