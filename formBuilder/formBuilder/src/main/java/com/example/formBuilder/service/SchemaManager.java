package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.entity.FormField;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import java.util.regex.Pattern;
import java.util.stream.Collectors;

import static java.lang.Boolean.TRUE;

@Service
@RequiredArgsConstructor
public class SchemaManager {

    private final JdbcTemplate jdbcTemplate;

    private static final Pattern VALID_NAME = Pattern.compile(AppConstants.VALID_NAME_REGEX);
 
    /** Field types that are purely visual — they have no database column. */

    /** Field types that are purely visual — they have no database column. */
    private static final Set<String> DISPLAY_ONLY_TYPES = Set.of(
            "page_break", "heading", "paragraph", "divider"
    );

    private static final Set<String> RESERVED_KEYWORDS = Set.of(
            "select", "insert", "update", "delete",
            "from", "where", "join", "inner", "left", "right", "full",
            "group", "order", "by", "having", "limit", "offset",
            "union", "distinct",
            "table", "column", "index", "primary", "foreign", "key", "constraint", "references",
            "view", "sequence", "trigger",
            "user", "role", "grant", "revoke",
            "all", "any", "and", "or",
            "case", "when", "then", "else", "end",
            "id", "is_deleted", "created_at", "form_version_id"
    );

    /**
     * Builds a safe PostgreSQL table name from a user-provided form name.
     * Sanitizes by lowercasing, replacing spaces/hyphens with underscores,
     * and removing non-alphanumeric characters.
     */
//    public String buildSafeTableName(String formName) {
//        if (formName == null || formName.isBlank()) {
//            throw new IllegalArgumentException("Form name cannot be empty");
//        }
//
//        // 1. Lowercase
//        String sanitized = formName.trim().toLowerCase();
//
//        // 2. Replace spaces and hyphens with underscores
//        sanitized = sanitized.replaceAll("[\\s\\-]", "_");
//
//        // 3. Remove any remaining characters that are not a-z, 0-9, or _
//        sanitized = sanitized.replaceAll("[^a-z0-9_]", "");
//
//        // 4. Ensure it doesn't start with a number (Postgres requirement for unquoted identifiers)
//        if (Character.isDigit(sanitized.charAt(0))) {
//            sanitized = "f_" + sanitized;
//        }
//
//        // 5. Truncate to 50 chars to leave room for the "form_data_" prefix and any suffixes
//        if (sanitized.length() > 50) {
//            sanitized = sanitized.substring(0, 50);
//        }
//
//        return "form_data_" + sanitized;
//    }

    /**
     * Generates and executes the CREATE TABLE SQL statement with constraints for a new form.
     */
    public void createDynamicTable(String tableName, List<FormField> fields) {
        StringBuilder sql = new StringBuilder();

        sql.append("CREATE TABLE IF NOT EXISTS ")
                .append(tableName)
                .append(" (id UUID PRIMARY KEY DEFAULT gen_random_uuid()")
                .append(", is_deleted BOOLEAN DEFAULT FALSE NOT NULL")
                .append(", is_draft BOOLEAN DEFAULT FALSE NOT NULL")
                .append(", submitted_by VARCHAR(100)")
                .append(", form_version_id UUID")
                .append(", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL")
                .append(", updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL");

        for (FormField field : fields) {
            // Display-only elements (page_break, heading, paragraph, divider) have no DB column
            if (DISPLAY_ONLY_TYPES.contains(field.getFieldType())) continue;

            validateColumnName(field.getFieldKey());

            sql.append(", ")
                    .append(field.getFieldKey())
                    .append(" ")
                    .append(mapType(field));
            
            // FIXED: Removed NOT NULL and CHECK constraints from DB (minLength, maxLength, min, max, pattern).
            // All validation is now handled in the backend (SubmissionService) to avoid version conflicts.
        }

        sql.append(")");
        jdbcTemplate.execute(sql.toString());
    }

    /**
     * Renames an existing column in the specified dynamic table.
     */
//    public void renameColumn(String tableName, String oldName, String newName) {
//        validateColumnName(oldName);
//        validateColumnName(newName);
//        String sql = "ALTER TABLE " + tableName +
//                " RENAME COLUMN " + oldName + " TO " + newName;
//        jdbcTemplate.execute(sql);
//    }

    /**
     * Drops a column from the specified dynamic table if it exists.
     */
//    public void dropColumn(String tableName, String columnName) {
//        validateColumnName(columnName);
//        String sql = "ALTER TABLE " + tableName +
//                " DROP COLUMN IF EXISTS " + columnName;
//        jdbcTemplate.execute(sql);
//    }


//    public void makeColumnNullable(String tableName, String columnName) {
//        validateColumnName(columnName);
//        String sql = "ALTER TABLE " + tableName +
//                " ALTER COLUMN " + columnName + " DROP NOT NULL";
//        jdbcTemplate.execute(sql);
//    }

    /**
     * Adds a new column to the specified dynamic table.
     */
    public void addColumn(String tableName, FormField field) {
        validateColumnName(field.getFieldKey());
        StringBuilder sql = new StringBuilder();
        sql.append("ALTER TABLE ").append(tableName)
                .append(" ADD COLUMN ").append(field.getFieldKey())
                .append(" ").append(mapType(field));

        jdbcTemplate.execute(sql.toString());
    }

    /**
     * Detects schema drift for a single published form.
     *
     * Drift = a field exists in the active form version's field list but its
     * corresponding column is missing from the physical PostgreSQL table.
     *
     * Rules:
     * - Display-only field types (page_break, heading, paragraph, divider) are
     *   excluded — they produce no DB columns and are never checked.
     * - Soft-deleted fields (isDeleted = true) are excluded.
     * - Extra columns in the table that have no matching field are NOT drift
     *   (they are preserved for historical data).
     *
     * @param tableName the physical PostgreSQL table name from Form.tableName
     * @param fields    the active FormField list for this form's current version
     * @return list of field names (lowercased) that are missing from the table.
     *         Empty list means no drift.
     */
    public List<String> detectDrift(String tableName, List<FormField> fields) {
        if (tableName == null || tableName.isBlank()) {
            return List.of();
        }

        // Fetch the actual columns that exist in PostgreSQL right now
        String sql = "SELECT column_name FROM information_schema.columns WHERE table_name = ?";
        Set<String> existingColumns;
        try {
            existingColumns = jdbcTemplate
                    .queryForList(sql, String.class, tableName)
                    .stream()
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());
        } catch (Exception e) {
            // Table does not exist at all — all non-display fields are missing
            return fields.stream()
                    .filter(f -> !DISPLAY_ONLY_TYPES.contains(f.getFieldType()))
                    .filter(f -> !Boolean.TRUE.equals(f.getIsDeleted()))
                    .map(f -> f.getFieldKey().toLowerCase())
                    .collect(java.util.stream.Collectors.toList());
        }

        // Find field names present in the definition but absent from the table
        List<String> missingColumns = new ArrayList<>();
        for (FormField field : fields) {
            if (DISPLAY_ONLY_TYPES.contains(field.getFieldType())) continue;
            if (Boolean.TRUE.equals(field.getIsDeleted())) continue;

            String expectedColumn = field.getFieldKey().toLowerCase();
            if (!existingColumns.contains(expectedColumn)) {
                missingColumns.add(expectedColumn);
            }
        }
        return missingColumns;
    }


    /**
     * Maps an application field type (e.g., text, number, date) to its corresponding PostgreSQL data type.
     * Lookup fields and file_upload now use TEXT to store UUID references.
     */
    private String mapType(FormField field) {
        // If it's a lookup field, store referenced UUID as TEXT.
        // Checkboxes (multi-select) already use TEXT; radio/select also become TEXT with UUID refs.
        if (field.getSourceTable() != null && !field.getSourceTable().isBlank()) {
            return "TEXT"; // UUID stored as text (single or comma-separated for checkbox)
        }

        return switch (field.getFieldType()) {
            case "text", "email", "radio", "select", "url", "phone" -> "VARCHAR(255)";
            case "number" -> "INT";
            case "decimal" -> "NUMERIC(19,4)";
            case "date" -> "DATE";
            case "time" -> "TIME";
            case "datetime" -> "TIMESTAMP";
            case "textarea", "checkbox" -> "TEXT";
            case "toggle" -> "BOOLEAN";
            case "file_upload" -> "TEXT"; // file UUID stored as text
            // Display-only types should never reach here, but default safely
            default -> "VARCHAR(255)";
        };
    }

    /**
     * Validates a given column name against SQL naming conventions to prevent injection and errors.
     */
    public void validateColumnName(String name) {
        if (name == null || name.trim().isEmpty()) {
            throw new IllegalArgumentException("Field name cannot be empty");
        }

        String trimmed = name.trim().toLowerCase();
        if (RESERVED_KEYWORDS.contains(trimmed)) {
            throw new IllegalArgumentException("Invalid field name: '" + name + "' is a reserved SQL keyword");
        }

        if (!VALID_NAME.matcher(name).matches()) {
            throw new IllegalArgumentException(
                    "Invalid field name: " + name +
                            " (Only letters, numbers, underscore allowed & must start with letter)"
            );
        }
    }
}
