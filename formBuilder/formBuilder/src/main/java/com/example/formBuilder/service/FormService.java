package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.FormVersion;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.enums.FormStatus;
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
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.io.PrintWriter;
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
    private final FormVersionService versionService;

    @Value("${app.limits.max-fields-per-form:50}")
    private int maxFields;

    @Value("${app.limits.max-validations-per-form:100}")
    private int maxValidations;

    @Value("${app.limits.max-pages-per-form:10}")
    private int maxPages;

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

    //private static String uuidToTableSuffix(UUID id) {
    //    return id.toString().replace("-", "_");
    //}


    private String generateFormCode(String displayName) {
        if (displayName == null) return null;
        String code = displayName.trim().toLowerCase();
        code = code.replaceAll("[\\s\\-]+", "_");         // spaces/hyphens → underscore
        code = code.replaceAll("[^a-z0-9_]", "");          // strip everything else
        code = code.replaceAll("_+", "_");                 // collapse multiple underscores
        code = code.replaceAll("^_+|_+$", "");             // trim leading/trailing underscores
        if (code.isEmpty()) return null;
        if (Character.isDigit(code.charAt(0))) code = "f_" + code;  // must start with letter
        if (code.length() > 50) code = code.substring(0, 50);
        return code;
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
                .map(v -> fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(v.getId()))
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
                .formVersionId(versionRepository.findByFormIdAndIsActiveTrue(form.getId())
                        .map(com.example.formBuilder.entity.FormVersion::getId)
                        .orElse(null))
                .fields(activeFields.stream()
                        .map(this::mapFieldToResponse)
                        .collect(Collectors.toList()))
                .build();
    }

    private FormFieldResponseDto mapFieldToResponse(FormField f) {
        return FormFieldResponseDto.builder()
                .id(f.getId())
                .fieldName(f.getFieldName())
                .fieldKey(f.getFieldKey())
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
                .build();

    }

    private List<FormField> getFieldsForVersion(Form form, UUID versionId) {
        if (versionId != null) {
            return fieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(versionId);
        }
        return getActiveFields(form);
    }


    public Map<String, Object> getAllDataFromTable(UUID id, UUID versionId, int page, int size, String sortBy, String direction, boolean deletedOnly) {
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

        String condition = deletedOnly ? "is_deleted = true" : "is_deleted = false";
        StringBuilder queryBuilder = new StringBuilder("SELECT * FROM " + tableName + " WHERE " + condition);
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
                .map(f -> f.getFieldKey() != null ? f.getFieldKey() : f.getFieldName())
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
            String col = field.getFieldKey() != null ? field.getFieldKey() : field.getFieldName();
            String sourceFormId = field.getSourceTable();
            // Resolve correct table name for lookups
            String sourceTable;
            try {
                Form sourceForm = formRepository.findById(UUID.fromString(sourceFormId)).orElse(null);
                if (sourceForm == null) {
                    log.warn("Lookup source form {} not found", sourceFormId);
                    continue;
                }
                sourceTable = sourceForm.getTableName();
            } catch (Exception e) {
                log.warn("Invalid sourceFormId UUID: {}", sourceFormId);
                continue;
            }
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

        String countCondition = deletedOnly ? "is_deleted = true" : "is_deleted = false";
        StringBuilder countQueryBuilder = new StringBuilder("SELECT COUNT(*) FROM " + tableName + " WHERE " + countCondition);
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

    public Map<String, Object> getDeletedDataFromTable(UUID id, UUID versionId, int page, int size, String sortBy, String direction) {
        return getAllDataFromTable(id, versionId, page, size, sortBy, direction, true);
    }

    public List<FormListDto> getAllForms() {
        User user = getCurrentUser();
        List<Form> forms = formRepository.findByUserId(user.getId());
        
        return forms.stream()
                .map(form -> new FormListDto(form.getId(), form.getFormName(), form.getStatus(), form.getCreatedAt(), form.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    public List<FormListDto> getDeletedForms() {
        User user = getCurrentUser();
        List<Form> forms = formRepository.findDeletedByUserId(user.getId());

        return forms.stream()
                .map(form -> new FormListDto(form.getId(), form.getFormName(), form.getStatus(), form.getCreatedAt(), form.getUpdatedAt()))
                .collect(Collectors.toList());
    }

    @Transactional
    public String restoreForm(UUID id) {
        // We use a native query to restore because the @Where filter blocks findById for deleted forms
        User user = getCurrentUser();
        
        // Security check: Verify the form exists and belongs to the user (using native query)
        List<Form> deletedForms = formRepository.findDeletedByUserId(user.getId());
        boolean existsAndOwned = deletedForms.stream().anyMatch(f -> f.getId().equals(id));
        
        if (!existsAndOwned) {
            throw new ResourceNotFoundException("Deleted form with ID " + id + " not found or access denied");
        }

        formRepository.restoreFormById(id);
        return "Form restored successfully";
    }


    public List<Map<String, Object>> getLookupValues(UUID formId, String columnName) {
        Form form = getFormById(formId);
        String tableName = form.getTableName();

        // Check if the column belongs to an active field (by either key or name)
        boolean isActive = getActiveFields(form).stream()
                .anyMatch(f -> (f.getFieldKey() != null && f.getFieldKey().equals(columnName)) || 
                               (f.getFieldName() != null && f.getFieldName().equals(columnName)));
        
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
            form.setUpdatedAt(java.time.LocalDateTime.now());
            formRepository.save(form);
            return "Form published via version " + draftVersionOpt.get().getVersionNumber();
        }

        // If the form has NO versions at all (e.g., just created), generate Version 1 now.
        if (!versionRepository.existsByFormId(form.getId())) {
            // FIXED: Use findByFormIdAndFormVersionIsNull to avoid picking up unrelated fields
            List<FormField> fields = fieldRepository.findByFormIdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(id);
            versionService.createInitialVersion(form.getId(), fields, form.getRules());

            form.setUpdatedAt(java.time.LocalDateTime.now());
            formRepository.save(form);
            return "Form published (v1 created)";
        }

        return "Form is already published and has no pending drafts.";
    }

    private void validateFormLimits(String formName, List<?> fields, List<FormRuleDTO> rules) {
        if (fields == null) return;
        
        // 1. Max Fields
        if (fields.size() > maxFields) {
            throw new ValidationException("Form '" + formName + "' exceeds the maximum limit of " + maxFields + " fields.");
        }

        int pageCount = 1; // Start with 1 page
        int validationCount = (rules != null) ? rules.size() : 0;

        for (Object fieldObj : fields) {
            String type = null;
            Boolean required = null;
            Integer minLength = null, maxLength = null, min = null, max = null, maxFileSize = null;
            String pattern = null, beforeDate = null, afterDate = null, afterTime = null, beforeTime = null, allowedFileTypes = null;

            if (fieldObj instanceof FieldRequest f) {
                type = f.getType();
                required = f.getRequired();
                minLength = f.getMinLength();
                maxLength = f.getMaxLength();
                min = f.getMin();
                max = f.getMax();
                pattern = f.getPattern();
                beforeDate = f.getBeforeDate();
                afterDate = f.getAfterDate();
                afterTime = f.getAfterTime();
                beforeTime = f.getBeforeTime();
                maxFileSize = f.getMaxFileSize();
                allowedFileTypes = f.getAllowedFileTypes();
            } else if (fieldObj instanceof UpdateFieldRequest f) {
                type = f.getType();
                required = f.getRequired();
                minLength = f.getMinLength();
                maxLength = f.getMaxLength();
                min = f.getMin();
                max = f.getMax();
                pattern = f.getPattern();
                beforeDate = f.getBeforeDate();
                afterDate = f.getAfterDate();
                afterTime = f.getAfterTime();
                beforeTime = f.getBeforeTime();
                maxFileSize = f.getMaxFileSize();
                allowedFileTypes = f.getAllowedFileTypes();
            }

            if ("page_break".equals(type)) {
                pageCount++;
            }

            if (!isDisplayOnly(type)) {
                // Count constraints: 1 for each present validation constraint
                if (Boolean.TRUE.equals(required)) validationCount++;
                if (minLength != null) validationCount++;
                if (maxLength != null) validationCount++;
                if (min != null) validationCount++;
                if (max != null) validationCount++;
                if (pattern != null && !pattern.isBlank()) validationCount++;
                if (beforeDate != null && !beforeDate.isBlank()) validationCount++;
                if (afterDate != null && !afterDate.isBlank()) validationCount++;
                if (afterTime != null && !afterTime.isBlank()) validationCount++;
                if (beforeTime != null && !beforeTime.isBlank()) validationCount++;
                if (maxFileSize != null) validationCount++;
                if (allowedFileTypes != null && !allowedFileTypes.isBlank()) validationCount++;
            }
        }

        // 2. Max Pages
        if (pageCount > maxPages) {
            throw new ValidationException("Form '" + formName + "' exceeds the maximum limit of " + maxPages + " pages.");
        }

        // 3. Max Validations
        if (validationCount > maxValidations) {
            throw new ValidationException("Form '" + formName + "' exceeds the maximum limit of " + maxValidations + " validations (current: " + validationCount + ").");
        }
    }

    @Transactional
    public String createForm(FormRequest request) {
        String formName = request.getFormName();
        if (formName == null || formName.isBlank()) {
            throw new ValidationException("Form name cannot be empty");
        }

        String formCode = generateFormCode(formName);

        // Validate the generated code is usable
        if (formCode == null || formCode.length() < 3) {
            throw new ValidationException(
                "Form name '" + formName + "' produces a code that is too short. " +
                "Please include at least 3 letters or numbers."
            );
        }

        // Build the full table name from the code
        String tableName = "form_data_" + formCode;

        // Check uniqueness against formCode, not formName
        if (formRepository.findByFormCode(formCode).isPresent()) {
            throw new ValidationException(
                "A form with a similar name already exists. Please choose a different name."
            );
        }

        // Apply Guardrails
        validateFormLimits(formName, request.getFields(), request.getRules());

        // Step 1: Pre-validate all fields before saving anything
        Set<String> fieldNames = new HashSet<>();
        for (FieldRequest field : request.getFields()) {
            if (!isDisplayOnly(field.getType())) {
                String name = field.getName();
                if (name == null || name.isBlank()) {
                    throw new ValidationException("Field name cannot be empty");
                }
                String key = field.getFieldKey();
                if (key == null || key.isBlank()) {
                    key = AppConstants.sanitizeKey(name);
                }
                schemaManager.validateColumnName(key); // Throws if reserved or invalid
                String lowerKey = key.toLowerCase();
                if (fieldNames.contains(lowerKey)) {
                    throw new ValidationException("Two fields have the same name or very similar labels. Please ensure every field has a unique name.");
                }
                fieldNames.add(lowerKey);
            }
        }

        User user = getCurrentUser();
        
        Form form = new Form();
        form.setFormName(formName);       // store the display name exactly as given
        form.setFormCode(formCode);       // store the generated code
        form.setUser(user);
        form.setStatus(FormStatus.DRAFT);
        form.setTableName(tableName);
        
        form = formRepository.save(form);

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
        List<FieldRequest> fieldRequests = request.getFields();

        for (int i = 0; i < fieldRequests.size(); i++) {
            FieldRequest field = fieldRequests.get(i);


            // Display-only fields (page_break, heading, paragraph, divider) — persist but never as DB columns
            boolean isDisplayOnlyField = isDisplayOnly(field.getType());

            FormField formField = new FormField();

            formField.setFieldName(field.getName());
            String key = field.getFieldKey();
            if (key == null || key.isBlank()) {
                key = AppConstants.sanitizeKey(field.getName());
            }
            formField.setFieldKey(key);
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
                formField.setIsMultiSelect(field.getIsMultiSelect() != null ? field.getIsMultiSelect() : false);
            } else {

                // For display-only types, store the human-readable label text in defaultValue
                // so the public form can render it without needing a separate column
                formField.setDefaultValue(field.getDefaultValue());
            }

            formField.setDisplayOrder(i);
            formField.setForm(form);

            fieldList.add(formField);
        }

        // Save the fields to the database associated with the form (but no version yet)
        fieldRepository.saveAll(fieldList);

        return "Form Created Successfully";
    }

//    @Transactional
//    public String updateForm(UUID formId, UpdateFormRequest request) {
//
//        Form form = getFormWithPermission(formId);
//
//        if (form.getStatus() == PUBLISHED) {
//            throw new ValidationException("Cannot edit a published form directly. Please use the version editor.");
//        }
//
//        String newFormName = request.getFormName();
//        if (newFormName == null || newFormName.isBlank()) {
//            throw new ValidationException("Form name cannot be empty");
//        }
//
//        // formCode and tableName do NOT change when the display name is edited.
//        // Only update the display name.
//
//        // Apply Guardrails
//        validateFormLimits(newFormName, request.getFields(), request.getRules());
//
//        form.setFormName(newFormName);
//
//        List<UpdateFieldRequest> incoming = request.getFields();
//
//        // Validate field name uniqueness and keywords
//        Set<String> fieldNames = new HashSet<>();
//        for (UpdateFieldRequest fieldReq : incoming) {
//            if (!isDisplayOnly(fieldReq.getType())) {
//                String name = fieldReq.getName();
//                schemaManager.validateColumnName(name); // Throws if invalid or reserved
//
//                String lowerName = name.toLowerCase();
//                if (fieldNames.contains(lowerName)) {
//                    throw new ValidationException("Duplicate field name found: " + name);
//                }
//                fieldNames.add(lowerName);
//            }
//        }
//
//        List<FormField> existingFields = fieldRepository.findByFormIdOrderByDisplayOrderAscIdAsc(formId);
//
//
//        Set<UUID> incomingIds = incoming.stream()
//                .filter(f -> f.getId() != null)
//                .map(UpdateFieldRequest::getId)
//                .collect(Collectors.toSet());
//
//        List<FormField> toDelete = existingFields.stream()
//                .filter(f -> !incomingIds.contains(f.getId()))
//                .toList();
//
//        for (FormField deleted : toDelete) {
//            deleted.setIsDeleted(true);
//            // Relax database constraint if field was required
//            if (!isDisplayOnly(deleted.getFieldType()) && form.getStatus() == PUBLISHED) {
//                schemaManager.makeColumnNullable(form.getTableName(), deleted.getFieldName());
//            }
//        }
//        fieldRepository.saveAll(toDelete);
//
//        for (int i = 0; i < incoming.size(); i++) {
//            UpdateFieldRequest fieldReq = incoming.get(i);
//            boolean isDisplayOnly = isDisplayOnly(fieldReq.getType());
//
//            if (fieldReq.getId() != null) {
//                FormField existing = fieldRepository.findById(fieldReq.getId())
//                        .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldReq.getId() + " not found"));
//
//                String oldName = existing.getFieldName();
//                String newName = fieldReq.getName();
//
//                if (!isDisplayOnly && form.getStatus() == PUBLISHED
//                        && !oldName.equals(newName)) {
//                    schemaManager.renameColumn(form.getTableName(), oldName, newName);
//                }
//
//                applyFieldUpdates(existing, fieldReq, form);
//                existing.setDisplayOrder(i);
//                fieldRepository.save(existing);
//
//            } else {
//                FormField newField = buildFormField(fieldReq, form);
//                newField.setDisplayOrder(i);
//                fieldRepository.save(newField);
//
//                // Only add real data fields to the DB table schema
//                if (!isDisplayOnly && form.getStatus() == PUBLISHED) {
//                    schemaManager.addColumn(form.getTableName(), newField);
//                }
//            }
//        }
//
//
//        if (request.getRules() != null) {
//            try {
//                form.setRules(objectMapper.writeValueAsString(request.getRules()));
//            } catch (Exception e) {
//                log.warn("Failed to serialize updated rules: {}", e.getMessage());
//            }
//        }
//
//        form.setUpdatedAt(java.time.LocalDateTime.now());
//        formRepository.save(form);
//        return "Form updated successfully";
//    }
//    private void applyFieldUpdates(FormField field, UpdateFieldRequest req, Form form) {
//        boolean isDisplayOnly = isDisplayOnly(req.getType());
//        // Display-only fields don't need column-name validation since they're never DB columns
//        if (!isDisplayOnly) {
//            schemaManager.validateColumnName(req.getName());
//        }
//        field.setFieldName(req.getName());
//        field.setFieldType(req.getType());
//        if (!isDisplayOnly) {
//            // FIXED: Redundant makeColumnNullable removed as all columns are now nullable by default.
//            field.setRequired(req.getRequired());
//            field.setMinLength(req.getMinLength());
//            field.setMaxLength(req.getMaxLength());
//            field.setMin(req.getMin());
//            field.setMax(req.getMax());
//            field.setPattern(req.getPattern());
//            field.setDefaultValue(req.getDefaultValue());
//            field.setBeforeDate(req.getBeforeDate() != null
//                    ? LocalDate.parse(req.getBeforeDate()) : null);
//            field.setAfterDate(req.getAfterDate() != null
//                    ? LocalDate.parse(req.getAfterDate()) : null);
//            field.setOptions(req.getOptions());
//            field.setPlaceholder(req.getPlaceholder());
//            field.setHelperText(req.getHelperText());
//            field.setAfterTime(req.getAfterTime());
//            field.setBeforeTime(req.getBeforeTime());
//            field.setSourceTable(req.getSourceTable());
//            field.setSourceColumn(req.getSourceColumn());
//            field.setMaxFileSize(req.getMaxFileSize());
//            field.setIsReadOnly(req.getIsReadOnly() != null ? req.getIsReadOnly() : false);
//            field.setIsMultiSelect(req.getIsMultiSelect() != null ? req.getIsMultiSelect() : false);
//            field.setAllowedFileTypes(req.getAllowedFileTypes());
//        } else {
//
//            // Persist label text for display-only elements (heading, paragraph, etc.)
//            field.setDefaultValue(req.getDefaultValue());
//        }
//    }
//    private FormField buildFormField(UpdateFieldRequest req, Form form) {
//        FormField f = new FormField();
//        applyFieldUpdates(f, req, form);
//        f.setForm(form);
//        return f;
//    }

    public String getFormRules(UUID formId) {
        Form form = getFormWithPermission(formId);
        return getActiveRules(form);
    }

    public String saveFormRules(UUID formId, List<FormRuleDTO> rules) {
        Form form = getFormWithPermission(formId);
        
        // Count existing field validations + new rules
        List<FormField> fields = fieldRepository.findByFormIdOrderByDisplayOrderAscIdAsc(formId);
        int validationCount = (rules != null) ? rules.size() : 0;
        for (FormField f : fields) {
            if (!isDisplayOnly(f.getFieldType())) {
                if (Boolean.TRUE.equals(f.getRequired())) validationCount++;
                if (f.getMinLength() != null) validationCount++;
                if (f.getMaxLength() != null) validationCount++;
                if (f.getMin() != null) validationCount++;
                if (f.getMax() != null) validationCount++;
                if (f.getPattern() != null && !f.getPattern().isBlank()) validationCount++;
                if (f.getBeforeDate() != null) validationCount++; // LocalDate is not string here
                if (f.getAfterDate() != null) validationCount++;
                if (f.getAfterTime() != null && !f.getAfterTime().isBlank()) validationCount++;
                if (f.getBeforeTime() != null && !f.getBeforeTime().isBlank()) validationCount++;
                if (f.getMaxFileSize() != null) validationCount++;
                if (f.getAllowedFileTypes() != null && !f.getAllowedFileTypes().isBlank()) validationCount++;
            }
        }
        
        if (validationCount > maxValidations) {
            throw new ValidationException("Saving rules would exceed the maximum limit of " + maxValidations + " validations.");
        }

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
        
        form.setIsDeleted(true);
        form.setUpdatedAt(java.time.LocalDateTime.now());
        formRepository.save(form);
        return "Form deleted successfully";
    }

//    private boolean hasLiveSubmissions(Form form) {
//        if (form.getTableName() == null) return false;
//        try {
//            // "Live Submission" = active SUBMITTED row (not draft, not deleted)
//            String sql = "SELECT COUNT(*) FROM " + form.getTableName() + " WHERE is_deleted = false AND is_draft = false";
//            Integer count = jdbcTemplate.queryForObject(sql, Integer.class);
//            return count != null && count > 0;
//        } catch (Exception e) {
//            log.warn("Could not check live submissions for form {}: {}", form.getId(), e.getMessage());
//            return false;
//        }
//    }

    public void exportCsv(UUID formId, UUID versionId, PrintWriter writer) {
        Form form = getFormWithPermission(formId);
        List<FormField> activeFields = getFieldsForVersion(form, versionId);

        List<FormField> exportFields = activeFields.stream()
                .filter(f -> !isDisplayOnly(f.getFieldType()))
                .collect(Collectors.toList());

        // Header Row
        String header = exportFields.stream()
                .map(f -> escapeCsv(f.getFieldName()))
                .collect(Collectors.joining(","));
        writer.println(header + ",submitted_at");

        String tableName = form.getTableName();
        StringBuilder sql = new StringBuilder("SELECT * FROM " + tableName + " WHERE is_deleted = false");
        List<Object> params = new ArrayList<>();

        if (versionId != null) {
            sql.append(" AND form_version_id = ?::uuid");
            params.add(versionId.toString());
        }
        sql.append(" ORDER BY created_at DESC");

        jdbcTemplate.query(sql.toString(), params.toArray(), rs -> {
            List<String> values = new ArrayList<>();
            for (FormField field : exportFields) {
                try {
                    Object val = rs.getObject(field.getFieldName());
                    values.add(formatCsvValue(val));
                } catch (Exception e) {
                    values.add("");
                }
            }
            
            Object createdAt = "";
            try {
                createdAt = rs.getObject("created_at");
            } catch (Exception e) {}
            
            writer.println(String.join(",", values) + "," + (createdAt != null ? createdAt.toString() : ""));
        });
        
        writer.flush();
    }

    private String formatCsvValue(Object val) {
        if (val == null) return "";
        String str = val.toString();

        // CSV Injection Protection: prefix with ' if starts with =, +, -, @
        if (str.startsWith("=") || str.startsWith("+") || str.startsWith("-") || str.startsWith("@")) {
            str = "'" + str;
        }

        return escapeCsv(str);
    }

    private String escapeCsv(String value) {
        if (value == null) return "";
        // If it contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
        if (value.contains(",") || value.contains("\"") || value.contains("\n") || value.contains("\r")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
