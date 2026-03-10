package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.dto.*;
import com.example.formBuilder.entity.Form;
import com.example.formBuilder.entity.Admin;
import com.example.formBuilder.entity.FormField;
import com.example.formBuilder.exception.ResourceNotFoundException;
import com.example.formBuilder.exception.ValidationException;
import com.example.formBuilder.repository.AdminRepository;
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
    private final AdminRepository adminRepository;

    private Admin getCurrentAdmin() {
        String username = SessionUtil.getCurrentAdminUsername();
        if (username == null) throw new ValidationException("Unauthorized");
        return adminRepository.findByUsername(username)
                .orElseThrow(() -> new ValidationException("Admin not found"));
    }

    private Form getFormForAdmin(Long id) {
        Admin admin = getCurrentAdmin();
        Form form = formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + id + " not found"));
        if (!form.getAdmin().getId().equals(admin.getId())) {
            throw new ValidationException("Unauthorized access to this form");
        }
        return form;
    }

    private static final Pattern VALID_NAME =
            Pattern.compile(AppConstants.VALID_NAME_REGEX);

    public Form getFormById(Long id) {
        return formRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Form with ID " + id + " not found"));
    }

//    public List<Map<String, Object>> getAllDataFromTable(Long id) {
//        // Ensure administration privileges over this form
//        getFormForAdmin(id);
//
//        String tableName = "form_" + id;
//
//        if (!tableName.matches("^[a-zA-Z0-9_]+$")) {
//            throw new IllegalArgumentException("Invalid table name");
//        }
//
//        String sql = "SELECT * FROM " + tableName;
//
//        return jdbcTemplate.queryForList(sql);
//    }

    public Map<String, Object> getAllDataFromTable(Long id, int page, int size, String sortBy, String direction) {

        // Ensure admin has access
        getFormForAdmin(id);

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

        List<Map<String, Object>> data = jdbcTemplate.queryForList(dataQuery, size, offset);

        String countQuery = "SELECT COUNT(*) FROM " + tableName + " WHERE is_deleted = false";
        Integer total = jdbcTemplate.queryForObject(countQuery, Integer.class);

        Map<String, Object> response = new HashMap<>();
        response.put("content", data);
        response.put("page", page);
        response.put("size", size);
        response.put("totalElements", total);
        response.put("totalPages", (int) Math.ceil((double) total / size));

        return response;
    }

    public List<FormListDto> getAllForms() {
        Admin admin = getCurrentAdmin();
        List<Form> forms = formRepository.findByAdminId(admin.getId());
        List<FormListDto> formListDtos = new ArrayList<>();

        for (Form form : forms) {
            formListDtos.add(new FormListDto(form.getId(), form.getFormName(), form.getStatus()));
        }

        return formListDtos;
    }


    public List<String> getLookupValues(Long formId, String columnName) {
        Form form = getFormById(formId);
        String tableName = form.getTableName();

        if (!columnName.matches("^[a-zA-Z][a-zA-Z0-9_]*$")) {
            throw new IllegalArgumentException("Invalid column name");
        }

        String sql = "SELECT DISTINCT " + columnName + " FROM " + tableName + " WHERE is_deleted = false AND " + columnName + " IS NOT NULL";
        return jdbcTemplate.queryForList(sql, String.class);
    }

    public String publishForm(Long id) {
        Form form = getFormForAdmin(id);

        String tableName = form.getTableName();

        List<FormField> fields = fieldRepository.findByFormId(id);

        schemaManager.createDynamicTable(tableName, fields);

        form.setStatus(PUBLISHED);

        formRepository.save(form);

        return "Form Published Successfully";
    }

    public String createForm(FormRequest request) {
        Admin admin = getCurrentAdmin();

        if (request.getFields() == null || request.getFields().isEmpty()) {
            throw new ValidationException("Form must contain at least one field");
        }

        Form form = new Form();
        form.setFormName(request.getFormName());
        form.setAdmin(admin);
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

            Set<String> reserved = Set.of(
                    "select","from","where","join","table","order",
                    "group","limit","offset","insert","update",
                    "delete","index","primary","key","constraint",
                    "id"
            );

            if(reserved.contains(field.getName().toLowerCase())){
                throw new ValidationException(field.getName() + " is a reserved field name. Please choose a different name.");
            }

            FormField formField = new FormField();

            formField.setFieldName(field.getName());
            formField.setFieldType(field.getType());

            formField.setRequired(field.getRequired());
            formField.setMinLength(field.getMinLength());
            formField.setMaxLength(field.getMaxLength());
            formField.setMin(field.getMin());
            formField.setMax(field.getMax());
            formField.setPattern(field.getPattern());

            formField.setDefaultValue(field.getDefaultValue());

            formField.setMinTime(field.getMinTime());
            formField.setMaxTime(field.getMaxTime());


            formField.setBeforeDate(
                    field.getBeforeDate() != null ?
                            LocalDate.parse(field.getBeforeDate()) : null
            );

            formField.setAfterDate(
                    field.getAfterDate() != null ?
                            LocalDate.parse(field.getAfterDate()) : null
            );

            formField.setOptions(field.getOptions());

            formField.setForm(form);
            formField.setSourceTable(field.getSourceTable());
            formField.setSourceColumn(field.getSourceColumn());

            fieldList.add(formField);
        }

        fieldRepository.saveAll(fieldList);

        return "Form Created Successfully";
    }

    @Transactional
    public String updateForm(Long formId, UpdateFormRequest request) {

        Form form = getFormForAdmin(formId);

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

        if (form.getStatus() == PUBLISHED) {
            for (FormField deleted : toDelete) {
                schemaManager.dropColumn(form.getTableName(), deleted.getFieldName());
            }
        }
        fieldRepository.deleteAll(toDelete);

        for (UpdateFieldRequest fieldReq : incoming) {

            if (fieldReq.getId() != null) {
                FormField existing = fieldRepository.findById(fieldReq.getId())
                        .orElseThrow(() -> new ResourceNotFoundException("Field with ID " + fieldReq.getId() + " not found"));

                String oldName = existing.getFieldName();
                String newName = fieldReq.getName();

                if (form.getStatus() == PUBLISHED
                        && !oldName.equals(newName)) {
                    schemaManager.renameColumn(form.getTableName(), oldName, newName);
                }

                applyFieldUpdates(existing, fieldReq);
                fieldRepository.save(existing);

            } else {
                FormField newField = buildFormField(fieldReq, form);
                fieldRepository.save(newField);

                if (form.getStatus() == PUBLISHED) {
                    schemaManager.addColumn(form.getTableName(), newField);
                }
            }
        }

        formRepository.save(form);
        return "Form updated successfully";
    }

    private void applyFieldUpdates(FormField field, UpdateFieldRequest req) {
        schemaManager.validateColumnName(req.getName());
        field.setFieldName(req.getName());
        field.setFieldType(req.getType());
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
        field.setSourceTable(req.getSourceTable());
        field.setSourceColumn(req.getSourceColumn());
    }

    private FormField buildFormField(UpdateFieldRequest req, Form form) {
        FormField f = new FormField();
        applyFieldUpdates(f, req);
        f.setForm(form);
        return f;
    }

    public String getFormRules(Long formId) {
        Form form = getFormForAdmin(formId);
        return form.getRules();
    }

    public String saveFormRules(Long formId, List<FormRuleDTO> rules) {
        Form form = getFormForAdmin(formId);
        try {
            form.setRules(objectMapper.writeValueAsString(rules));
            formRepository.save(form);
        } catch (Exception e) {
            throw new ValidationException("Failed to save rules: " + e.getMessage());
        }
        return "Rules saved successfully";
    }
}