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
import java.util.OptionalDouble;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.DoubleSummaryStatistics;
import com.example.formBuilder.entity.FormSubmissionMeta;
import com.example.formBuilder.repository.FormSubmissionMetaRepository;

import static com.example.formBuilder.enums.FormStatus.PUBLISHED;
import java.time.format.DateTimeFormatter;
import java.sql.Timestamp;
import java.sql.Time;

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
    private final FormSubmissionMetaRepository submissionMetaRepository;

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
                type.equals("heading") || type.equals("paragraph") || 
                type.equals("divider") || type.equals("group"));
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
        Form form = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + id + " not found"));
        
        // Privacy Check:
        // 1. If form is DRAFT, only the owner should see it.
        // 2. If form is PUBLISHED, anyone can see it FOR FILLING, but not administrative data (like tableName).
        
        boolean isOwner = false;
        try {
            User user = getCurrentUser();
            isOwner = form.getUser() != null && form.getUser().getId().equals(user.getId());
        } catch (Exception e) {
            // Unauthenticated - definitely not the owner
        }

        if (form.getStatus() != PUBLISHED && !isOwner) {
            throw new ValidationException("Access denied: You do not own this draft form");
        }

        FormResponseDto dto = mapToResponseDto(form);
        
        // Mask internal metadata if the requester is not the owner or is unauthenticated
        if (!isOwner) {
            dto.setTableName(null); // Guests don't need to see technical table names
        }
        
        return dto;
    }

    private List<FormField> getActiveFields(Form form) {
        return versionRepository.findByForm_IdAndIsActiveTrue(form.getId())
                .map(v -> fieldRepository.findByFormVersion_IdOrderByDisplayOrderAscIdAsc(v.getId()))
                .orElseGet(form::getFields);
    }


    private String getActiveRules(Form form) {
        return versionRepository.findByForm_IdAndIsActiveTrue(form.getId())
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
                .formVersionId(versionRepository.findByForm_IdAndIsActiveTrue(form.getId())
                        .map(com.example.formBuilder.entity.FormVersion::getId)
                        .orElse(null))
                .activeVersionNumber(versionRepository.findByForm_IdAndIsActiveTrue(form.getId())
                        .map(com.example.formBuilder.entity.FormVersion::getVersionNumber)
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
                .beforeDatetime(f.getBeforeDatetime())
                .afterDatetime(f.getAfterDatetime())
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
                .isUnique(f.getIsUnique())
                .isCalculated(f.getIsCalculated())
                .calculationFormula(f.getCalculationFormula())
                .parentId(f.getParent() != null ? f.getParent().getId().toString() : null)
                .build();

    }

    private List<FormField> getFieldsForVersion(Form form, UUID versionId) {
        if (versionId != null) {
            return fieldRepository.findByFormVersion_IdOrderByDisplayOrderAscIdAsc(versionId);
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

        // Prevent SQL Injection on sortBy
        if (sortBy == null || !sortBy.matches("^[a-zA-Z][a-zA-Z0-9_]*$")) {
            sortBy = "created_at";
        }

        int offset = page * size;

        String condition = deletedOnly ? "is_deleted = true AND is_draft = false" : "is_deleted = false AND is_draft = false";
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

        // STEP: Format Date and Time fields for readability
        DateTimeFormatter dateTimeFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter timeFormatter = DateTimeFormatter.ofPattern("HH:mm:ss");

        for (Map<String, Object> row : dataList) {
            for (FormField field : activeFields) {
                String key = field.getFieldKey() != null ? field.getFieldKey() : field.getFieldName();
                Object val = row.get(key);
                if (val == null) continue;

                try {
                    if ("datetime".equals(field.getFieldType())) {
                        if (val instanceof java.time.LocalDateTime ldt) row.put(key, ldt.format(dateTimeFormatter));
                        else if (val instanceof Timestamp ts) row.put(key, ts.toLocalDateTime().format(dateTimeFormatter));
                    } else if ("date".equals(field.getFieldType())) {
                        if (val instanceof LocalDate ld) row.put(key, ld.format(dateFormatter));
                        else if (val instanceof java.sql.Date sd) row.put(key, sd.toLocalDate().format(dateFormatter));
                    } else if ("time".equals(field.getFieldType())) {
                        if (val instanceof java.time.LocalTime lt) row.put(key, lt.format(timeFormatter));
                        else if (val instanceof Time st) row.put(key, st.toLocalTime().format(timeFormatter));
                    }
                } catch (Exception e) {
                    log.warn("Failed to format date/time field {}: {}", key, e.getMessage());
                }
            }
            // Format standard created_at column
            Object createdAt = row.get("created_at");
            if (createdAt != null) {
                try {
                    if (createdAt instanceof java.time.LocalDateTime ldt) row.put("created_at", ldt.format(dateTimeFormatter));
                    else if (createdAt instanceof Timestamp ts) row.put("created_at", ts.toLocalDateTime().format(dateTimeFormatter));
                } catch (Exception e) {
                    log.warn("Failed to format created_at: {}", e.getMessage());
                }
            }
        }

        String countCondition = deletedOnly ? "is_deleted = true AND is_draft = false" : "is_deleted = false AND is_draft = false";
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
                .map(form -> {
                    Integer activeVersion = versionRepository
                            .findByForm_IdAndIsActiveTrue(form.getId())
                            .map(FormVersion::getVersionNumber)
                            .orElse(null);
                    return FormListDto.builder()
                            .id(form.getId())
                            .formName(form.getFormName())
                            .status(form.getStatus())
                            .createdAt(form.getCreatedAt())
                            .updatedAt(form.getUpdatedAt())
                            .activeVersion(activeVersion)
                            .build();
                })
                .collect(Collectors.toList());
    }

    public List<FormListDto> getDeletedForms() {
        User user = getCurrentUser();
        List<Form> forms = formRepository.findDeletedByUserId(user.getId());

        return forms.stream()
                .map(form -> {
                    Integer activeVersion = versionRepository
                            .findByForm_IdAndIsActiveTrue(form.getId())
                            .map(FormVersion::getVersionNumber)
                            .orElse(null);
                    return FormListDto.builder()
                            .id(form.getId())
                            .formName(form.getFormName())
                            .status(form.getStatus())
                            .createdAt(form.getCreatedAt())
                            .updatedAt(form.getUpdatedAt())
                            .activeVersion(activeVersion)
                            .build();
                })
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
        Optional<FormVersion> draftVersionOpt = versionRepository.findByForm_IdOrderByVersionNumberAsc(form.getId())
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
        if (!versionRepository.existsByForm_Id(form.getId())) {
            // FIXED: Use findByFormIdAndFormVersionIsNull to avoid picking up unrelated fields
            List<FormField> fields = fieldRepository.findByForm_IdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(id);
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
            Integer minLength = null, maxLength = null, maxFileSize = null;
            Double min = null, max = null;
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
        Map<String, FormField> keyToField = new HashMap<>();
        List<FieldRequest> fieldRequests = request.getFields();

        // 1st Pass: Create all fields and map them by key
        for (int i = 0; i < fieldRequests.size(); i++) {
            FieldRequest field = fieldRequests.get(i);
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
                formField.setBeforeDatetime(field.getBeforeDatetime());
                formField.setAfterDatetime(field.getAfterDatetime());
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
                formField.setIsUnique(field.getIsUnique() != null ? field.getIsUnique() : false);
                formField.setIsCalculated(field.getIsCalculated() != null ? field.getIsCalculated() : false);
                formField.setCalculationFormula(field.getCalculationFormula());
            } else {
                formField.setDefaultValue(field.getDefaultValue());
            }

            formField.setDisplayOrder(i);
            formField.setForm(form);
            
            keyToField.put(formField.getFieldKey(), formField);
            fieldList.add(formField);
        }

        // 2nd Pass: Wire up parents
        for (int i = 0; i < fieldRequests.size(); i++) {
            FieldRequest req = fieldRequests.get(i);
            FormField field = fieldList.get(i);
            if (req.getParentId() != null && !req.getParentId().isBlank()) {
                field.setParent(keyToField.get(req.getParentId()));
            }
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
//        List<FormField> existingFields = fieldRepository.findByForm_IdOrderByDisplayOrderAscIdAsc(formId);
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
        List<FormField> fields = fieldRepository.findByForm_IdOrderByDisplayOrderAscIdAsc(formId);
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

    public FormAnalyticsDto getFormAnalytics(UUID formId, UUID versionId) {
        Form form = getFormWithPermission(formId);
        List<FormSubmissionMeta> metas = submissionMetaRepository.findByForm_IdOrderByCreatedAtDesc(formId);

        // Fetch all versions for the dropdown
        List<FormVersion> versions = versionRepository.findByForm_IdOrderByVersionNumberDesc(formId);
        List<FormVersionDto> versionDtos = versions.stream()
                .map(v -> FormVersionDto.builder()
                        .id(v.getId())
                        .versionNumber(v.getVersionNumber())
                        .isActive(v.getIsActive())
                        .isLatest(v.getIsLatest())
                        .createdAt(v.getCreatedAt())
                        .views(v.getViews())
                        .build())
                .collect(Collectors.toList());

        // If no versionId provided, default to active version
        if (versionId == null) {
            versionId = versions.stream()
                    .filter(FormVersion::getIsActive)
                    .map(FormVersion::getId)
                    .findFirst()
                    .orElse(null);
        }

        final UUID finalVersionId = versionId;

        // Filter metas by version
        List<FormSubmissionMeta> filteredMetas = metas;
        if (finalVersionId != null) {
            filteredMetas = metas.stream()
                    .filter(m -> m.getFormVersion() != null && m.getFormVersion().getId().equals(finalVersionId))
                    .collect(Collectors.toList());
        }

        long total = filteredMetas.size();
        long drafts = filteredMetas.stream().filter(m -> "DRAFT".equals(m.getStatus())).count();
        long submitted = total - drafts;

        // ── Completion rate: submitted / total (avoid divide-by-zero)
        double completionRate = total > 0 ? ((double) submitted / total) * 100 : 0.0;

        // ── Submission Trend: fill ALL 30 days (zero-padded)
        LocalDate today = LocalDate.now();
        LocalDate windowStart = today.minusDays(29); // last 30 days inclusive

        Map<LocalDate, Long> trendMap = filteredMetas.stream()
                .filter(m -> m.getSubmittedAt() != null)
                .filter(m -> !m.getSubmittedAt().toLocalDate().isBefore(windowStart))
                .collect(Collectors.groupingBy(
                        m -> m.getSubmittedAt().toLocalDate(),
                        Collectors.counting()
                ));

        List<Map<String, Object>> trend = new ArrayList<>();
        for (int i = 0; i < 30; i++) {
            LocalDate day = windowStart.plusDays(i);
            Map<String, Object> point = new HashMap<>();
            point.put("date", day.format(java.time.format.DateTimeFormatter.ofPattern("MMM d")));
            point.put("count", trendMap.getOrDefault(day, 0L));
            trend.add(point);
        }

        // ── Avg submissions per day (only non-zero days to avoid skewing)
        double avgPerDay = trendMap.isEmpty() ? 0.0
                : trendMap.values().stream().mapToLong(Long::longValue).average().orElse(0.0);

        // ── Peak day
        Map.Entry<LocalDate, Long> peakEntry = trendMap.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .orElse(null);
        String peakDay = peakEntry != null ? peakEntry.getKey().toString() : null;
        long peakCount = peakEntry != null ? peakEntry.getValue() : 0L;

        // ── Day-of-week aggregation (use ALL submitted metas, not just 30-day window)
        Map<java.time.DayOfWeek, Long> dowMap = filteredMetas.stream()
                .filter(m -> m.getSubmittedAt() != null && "SUBMITTED".equals(m.getStatus()))
                .collect(Collectors.groupingBy(
                        m -> m.getSubmittedAt().getDayOfWeek(),
                        Collectors.counting()
                ));

        List<Map<String, Object>> dayOfWeekTrend = java.util.Arrays.stream(java.time.DayOfWeek.values())
                .map(dow -> {
                    Map<String, Object> p = new HashMap<>();
                    p.put("day", capitalize(dow.name()));
                    p.put("count", dowMap.getOrDefault(dow, 0L));
                    return p;
                })
                .collect(Collectors.toList());

        // ── Views
        long viewsToUse = 0;
        List<FormField> fieldsToAnalyze;
        if (finalVersionId != null) {
            FormVersion selectedVersion = versionRepository.findById(finalVersionId)
                    .orElseThrow(() -> new ResourceNotFoundException("Form version not found with id: " + finalVersionId));
            fieldsToAnalyze = selectedVersion.getFields().stream()
                    .filter(f -> !f.getIsDeleted())
                    .collect(Collectors.toList());
            viewsToUse = selectedVersion.getViews() != null ? selectedVersion.getViews() : 0;
        } else {
            fieldsToAnalyze = getActiveFields(form);
            viewsToUse = form.getViews();
        }

        // ── Fetch all submitted row data
        String tableName = form.getTableName();
        String sql = "SELECT * FROM " + tableName + " WHERE is_deleted = false AND is_draft = false";
        if (finalVersionId != null) {
            sql += " AND form_version_id = '" + finalVersionId + "'";
        }
        List<Map<String, Object>> allData = jdbcTemplate.queryForList(sql);
        long totalRows = allData.size();

        // ── Field-level analytics
        List<FieldStatDto> fieldAnalytics = new ArrayList<>();

        for (FormField field : fieldsToAnalyze) {
            if (isDisplayOnly(field.getFieldType())) continue;

            String key = field.getFieldKey() != null ? field.getFieldKey() : field.getFieldName();
            String type = field.getFieldType();

            // Compute fill rate across all submitted rows
            long filledCount = allData.stream()
                    .map(row -> row.get(key))
                    .filter(val -> val != null && !val.toString().trim().isEmpty())
                    .count();
            double fillRate = totalRows > 0 ? ((double) filledCount / totalRows) * 100 : 0.0;

            Map<String, Object> stats = new HashMap<>();
            stats.put("totalResponses", filledCount);
            stats.put("fillRate", Math.round(fillRate * 10.0) / 10.0); // 1 decimal

            if ("select".equals(type) || "radio".equals(type) || "checkbox".equals(type)) {
                // Distribution map
                Map<String, Long> counts = allData.stream()
                        .map(row -> row.get(key))
                        .filter(Objects::nonNull)
                        .flatMap(val -> {
                            if (val instanceof String s && s.contains(",")) {
                                return Arrays.stream(s.split(",")).map(String::trim).filter(v -> !v.isEmpty());
                            }
                            String sv = val.toString().trim();
                            return sv.isEmpty() ? Stream.empty() : Stream.of(sv);
                        })
                        .collect(Collectors.groupingBy(v -> v, Collectors.counting()));
                stats.put("distribution", counts);

                // Top-3 options
                List<Map<String, Object>> topN = counts.entrySet().stream()
                        .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                        .limit(3)
                        .map(e -> {
                            Map<String, Object> m = new HashMap<>();
                            m.put("option", e.getKey());
                            m.put("count", e.getValue());
                            return m;
                        })
                        .collect(Collectors.toList());
                stats.put("topN", topN);

                if (!counts.isEmpty()) {
                    String mostCommon = counts.entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse(null);
                    stats.put("mostCommon", mostCommon);
                }

            } else if ("number".equals(type)) {
                List<Double> numbers = allData.stream()
                        .map(row -> row.get(key))
                        .filter(Objects::nonNull)
                        .map(val -> {
                            try { return Double.parseDouble(val.toString()); }
                            catch (Exception e) { return null; }
                        })
                        .filter(Objects::nonNull)
                        .sorted()
                        .collect(Collectors.toList());

                if (!numbers.isEmpty()) {
                    DoubleSummaryStatistics summary = numbers.stream()
                            .mapToDouble(Double::doubleValue)
                            .summaryStatistics();
                    stats.put("avg", Math.round(summary.getAverage() * 100.0) / 100.0);
                    stats.put("min", summary.getMin());
                    stats.put("max", summary.getMax());
                    stats.put("count", summary.getCount());

                    // Median
                    int size = numbers.size();
                    double median = size % 2 == 0
                            ? (numbers.get(size / 2 - 1) + numbers.get(size / 2)) / 2.0
                            : numbers.get(size / 2);
                    stats.put("median", Math.round(median * 100.0) / 100.0);

                    // Standard deviation
                    double avg = summary.getAverage();
                    double variance = numbers.stream()
                            .mapToDouble(n -> Math.pow(n - avg, 2))
                            .average()
                            .orElse(0.0);
                    stats.put("stdDev", Math.round(Math.sqrt(variance) * 100.0) / 100.0);
                }

            } else if ("date".equals(type) || "datetime".equals(type) || "time".equals(type)) {
                List<String> dateValues = allData.stream()
                        .map(row -> row.get(key))
                        .filter(Objects::nonNull)
                        .map(val -> val.toString().trim())
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());

                if (!dateValues.isEmpty()) {
                    stats.put("earliest", dateValues.stream().min(String::compareTo).orElse(null));
                    stats.put("latest", dateValues.stream().max(String::compareTo).orElse(null));

                    // Most common date/time value
                    String mostCommonDate = dateValues.stream()
                            .collect(Collectors.groupingBy(v -> v, Collectors.counting()))
                            .entrySet().stream()
                            .max(Map.Entry.comparingByValue())
                            .map(Map.Entry::getKey)
                            .orElse(null);
                    stats.put("mostCommonDate", mostCommonDate);

                    long uniqueDates = dateValues.stream().distinct().count();
                    stats.put("uniqueCount", uniqueDates);
                }

            } else {
                // Text, email, textarea, tel, url, etc.
                List<String> textValues = allData.stream()
                        .map(row -> row.get(key))
                        .filter(Objects::nonNull)
                        .map(val -> val.toString().trim())
                        .filter(s -> !s.isEmpty())
                        .collect(Collectors.toList());

                long uniqueCount = textValues.stream().distinct().count();
                stats.put("uniqueCount", uniqueCount);

                // Average length for text/textarea
                if ("text".equals(type) || "textarea".equals(type)) {
                    OptionalDouble avgLen = textValues.stream()
                            .mapToInt(String::length)
                            .average();
                    if (avgLen.isPresent()) {
                        stats.put("avgLength", Math.round(avgLen.getAsDouble() * 10.0) / 10.0);
                    }
                }
            }

            fieldAnalytics.add(FieldStatDto.builder()
                    .fieldLabel(field.getFieldName())
                    .fieldName(key)
                    .fieldType(type)
                    .fillRate(Math.round(fillRate * 10.0) / 10.0)
                    .stats(stats)
                    .build());
        }

        return FormAnalyticsDto.builder()
                .totalSubmissions(total)
                .draftCount(drafts)
                .submittedCount(submitted)
                .totalViews(viewsToUse)
                .engagementRate(viewsToUse > 0 ? ((double) submitted / viewsToUse) * 100 : 0)
                .completionRate(completionRate)
                .avgSubmissionsPerDay(Math.round(avgPerDay * 10.0) / 10.0)
                .peakDay(peakDay)
                .peakCount(peakCount)
                .submissionTrend(trend)
                .dayOfWeekTrend(dayOfWeekTrend)
                .fieldAnalytics(fieldAnalytics)
                .availableVersions(versionDtos)
                .selectedVersionId(finalVersionId)
                .build();
    }

    /** Capitalizes the first letter and lowercases the rest of a string. */
    private String capitalize(String s) {
        if (s == null || s.isEmpty()) return s;
        return s.charAt(0) + s.substring(1).toLowerCase();
    }


    @Transactional
    public void incrementViewCount(UUID formId) {
        // Initialize views to 0 if they are NULL (for older records) before incrementing
        jdbcTemplate.update("UPDATE form SET views = 0 WHERE id = ? AND views IS NULL", formId);
        jdbcTemplate.update("UPDATE form_version SET views = 0 WHERE form_id = ? AND views IS NULL", formId);

        // Increment form total views
        jdbcTemplate.update("UPDATE form SET views = views + 1 WHERE id = ?", formId);
        
        // Increment active version views
        jdbcTemplate.update("UPDATE form_version SET views = views + 1 WHERE form_id = ? AND is_active = true", formId);
    }
}
