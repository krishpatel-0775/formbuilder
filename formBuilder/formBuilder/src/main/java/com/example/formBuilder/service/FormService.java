package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.User;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.UserRepository;
import com.example.formBuilder.repository.FormFieldRepository;
import com.example.formBuilder.repository.FormRepository;
import com.example.formBuilder.security.SessionUtil;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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

    private User getCurrentUser() {
        String username = SessionUtil.getCurrentUsername();
        if (username == null) throw new ValidationException("Unauthorized");
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ValidationException("User not found"));
    }

    private Form getFormWithPermission(Long id) {
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

    public Form getFormById(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + id + " not found"));
    }

    public FormResponseDto getFormResponseById(Long id) {
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

    private FormResponseDto mapToResponseDto(Form form) {
        return FormResponseDto.builder()
                .id(form.getId())
                .formName(form.getFormName())
                .tableName(form.getTableName())
                .createdAt(form.getCreatedAt())
                .status(form.getStatus())
                .rules(form.getRules())
                .fields(form.getFields().stream()
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
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    public Map<String, Object> getAllDataFromTable(Long id, int page, int size, String sortBy, String direction) {
        Form form = getFormWithPermission(id);

        String tableName = "form_" + id;

        if (!tableName.matches("^[a-zA-Z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid table name");
        }

        // Validate sorting direction
        if (!direction.equalsIgnoreCase("asc") && !direction.equalsIgnoreCase("desc")) {
            direction = "asc";
        }

        int offset = page * size;

        String dataQuery = "SELECT * FROM " + tableName +
                " WHERE is_deleted = false" +
                " ORDER BY " + sortBy + " " + direction +
                " LIMIT ? OFFSET ?";

        List<Map<String, Object>> dataList = jdbcTemplate.queryForList(dataQuery, size, offset);

        // Filter columns to only include active fields
        Set<String> activeFieldNames = form.getFields().stream()
                .filter(f -> !isDisplayOnly(f.getFieldType()))
                .map(FormField::getFieldName)
                .collect(Collectors.toSet());
        activeFieldNames.add("id");
        activeFieldNames.add("created_at");

        for (Map<String, Object> row : dataList) {
            row.keySet().retainAll(activeFieldNames);
        }

        // STEP: Resolve Lookup IDs to Labels for Display
        List<FormField> lookupFields = form.getFields().stream()
                .filter(f -> f.getSourceTable() != null && !f.getSourceTable().isBlank())
                .collect(Collectors.toList());

        for (FormField field : lookupFields) {
            String col = field.getFieldName();
            String sourceFormId = field.getSourceTable();
            String sourceTable = "form_" + sourceFormId; // Convert Form ID to Table Name
            String sourceCol = field.getSourceColumn();

            // Collect unique IDs from this column in the current page
            Set<Long> idsToResolve = new java.util.HashSet<>();
            for (Map<String, Object> row : dataList) {
                Object val = row.get(col);
                if (val != null) {
                    String[] parts = val.toString().split(",");
                    for (String part : parts) {
                        try {
                            idsToResolve.add(Long.valueOf(part.trim()));
                        } catch (NumberFormatException e) {
                            // Skip non-numeric parts
                        }
                    }
                }
            }

            if (idsToResolve.isEmpty()) continue;

            // Batch fetch labels: Map<ID, Label>
            String inClause = idsToResolve.stream().map(String::valueOf).collect(Collectors.joining(","));
            String labelSql = "SELECT id, " + sourceCol + " as label FROM " + sourceTable + " WHERE id IN (" + inClause + ")";
            
            try {
                Map<Long, String> labelMap = jdbcTemplate.query(labelSql, rs -> {
                    Map<Long, String> map = new HashMap<>();
                    while (rs.next()) {
                        map.put(rs.getLong("id"), rs.getString("label"));
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
                            try {
                                String label = labelMap.get(Long.valueOf(part.trim()));
                                labels.add(label != null ? label : part.trim());
                            } catch (NumberFormatException e) {
                                labels.add(part.trim());
                            }
                        }
                        row.put(col, String.join(", ", labels));
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to resolve lookup labels for column {} using table {}: {}", col, sourceTable, e.getMessage());
            }
        }

        String countQuery = "SELECT COUNT(*) FROM " + tableName + " WHERE is_deleted = false";
        Integer total = jdbcTemplate.queryForObject(countQuery, Integer.class);

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


    public List<Map<String, Object>> getLookupValues(Long formId, String columnName) {
        Form form = getFormById(formId);
        String tableName = form.getTableName();

        // Check if the column belongs to an active field
        boolean isActive = form.getFields().stream()
                .anyMatch(f -> f.getFieldName().equals(columnName));

        if (!isActive) {
            throw new ValidationException("Cannot lookup values for inactive or non-existent field: " + columnName);
        }

        if (!columnName.matches("^[a-zA-Z][a-zA-Z0-9_]*$")) {
            throw new IllegalArgumentException("Invalid column name");
        }

        String sql = "SELECT MIN(id) as id, " + columnName + " as value FROM " + tableName +
                " WHERE is_deleted = false AND " + columnName + " IS NOT NULL" +
                " GROUP BY " + columnName;
        return jdbcTemplate.queryForList(sql);
    }

    public String publishForm(Long id) {
        Form form = getFormWithPermission(id);

        String tableName = form.getTableName();

        List<FormField> fields = fieldRepository.findByFormId(id);

        schemaManager.createDynamicTable(tableName, fields);

        form.setStatus(PUBLISHED);

        formRepository.save(form);

        return "Form Published Successfully";
    }

    @Transactional
    public String createForm(FormRequest request) {
        // Step 1: Pre-validate all fields before saving anything
        Set<String> reserved = Set.of(
                "select", "from", "where", "join", "table", "order",
                "group", "limit", "offset", "insert", "update",
                "delete", "index", "primary", "key", "constraint",
                "id"
        );

        for (FieldRequest field : request.getFields()) {
            if (!isDisplayOnly(field.getType())) {
                if (field.getName() == null || field.getName().isBlank()) {
                    throw new ValidationException("Field name cannot be empty");
                }
                if (reserved.contains(field.getName().toLowerCase())) {
                    throw new ValidationException(field.getName() + " is a reserved field name. Please choose a different name.");
                }
            }
        }

        User user = getCurrentUser();
        
        Form form = new Form();
        form.setFormName(request.getFormName());
        form.setUser(user);
        form = formRepository.save(form);

        String tableName = "form_" + form.getId();
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
                formField.setBeforeDate(
                        field.getBeforeDate() != null ?
                                LocalDate.parse(field.getBeforeDate()) : null
                );
                formField.setAfterDate(
                        field.getAfterDate() != null ?
                                LocalDate.parse(field.getAfterDate()) : null
                );
                formField.setOptions(field.getOptions());
                formField.setSourceTable(field.getSourceTable());
                formField.setSourceColumn(field.getSourceColumn());
            } else {
                // For display-only types, store the human-readable label text in defaultValue
                // so the public form can render it without needing a separate column
                formField.setDefaultValue(field.getDefaultValue());
            }

            formField.setForm(form);
            fieldList.add(formField);
        }

        fieldRepository.saveAll(fieldList);

        return "Form Created Successfully";
    }

    @Transactional
    public String updateForm(Long formId, UpdateFormRequest request) {

        Form form = getFormWithPermission(formId);

        if (request.getFormName() != null && !request.getFormName().isBlank()) {
            form.setFormName(request.getFormName());
        }

        List<UpdateFieldRequest> incoming = request.getFields();

        List<FormField> existingFields = fieldRepository.findByFormId(formId);

        Set<Long> incomingIds = incoming.stream()
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
            field.setAfterTime(req.getAfterTime());
            field.setBeforeTime(req.getBeforeTime());
            field.setSourceTable(req.getSourceTable());
            field.setSourceColumn(req.getSourceColumn());
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

    public String getFormRules(Long formId) {
        Form form = getFormWithPermission(formId);
        return form.getRules();
    }

    public String saveFormRules(Long formId, List<FormRuleDTO> rules) {
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
    public String deleteForm(Long id) {
        Form form = getFormWithPermission(id);
        form.setIsDeleted(true);
        formRepository.save(form);
        return "Form deleted successfully";
    }
}