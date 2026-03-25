package com.example.formBuilder.service;

import com.example.formBuilder.constants.AppConstants;
import com.example.formBuilder.entity.FormField;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.regex.Pattern;

import static java.lang.Boolean.TRUE;

@Service
@RequiredArgsConstructor
public class SchemaManager {

    private final JdbcTemplate jdbcTemplate;

    private static final Pattern VALID_NAME = Pattern.compile(AppConstants.VALID_NAME_REGEX);

    /** Field types that are purely visual — they have no database column. */
    private static final java.util.Set<String> DISPLAY_ONLY_TYPES = java.util.Set.of(
            "page_break", "heading", "paragraph", "divider"
    );

    private static final java.util.Set<String> RESERVED_KEYWORDS = java.util.Set.of(
            "select", "from", "where", "join", "table", "order",
            "group", "limit", "offset", "insert", "update",
            "delete", "index", "primary", "key", "constraint",
            "id", "is_deleted", "created_at", "form_version_id",
            "user", "check", "all", "any", "and", "or", "case", "when", "then", "else", "end"
    );

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
                .append(", created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL")
                .append(", updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL");

        for (FormField field : fields) {
            // Display-only elements (page_break, heading, paragraph, divider) have no DB column
            if (DISPLAY_ONLY_TYPES.contains(field.getFieldType())) continue;

            validateColumnName(field.getFieldName());

            sql.append(", ")
                    .append(field.getFieldName())
                    .append(" ")
                    .append(mapType(field));

            if (TRUE.equals(field.getRequired())) {
                sql.append(" NOT NULL");
            }

            if (field.getMinLength() != null) {
                sql.append(" CHECK (char_length(")
                        .append(field.getFieldName())
                        .append(") >= ")
                        .append(field.getMinLength())
                        .append(")");
            }

            if (field.getMaxLength() != null) {
                sql.append(" CHECK (char_length(")
                        .append(field.getFieldName())
                        .append(") <= ")
                        .append(field.getMaxLength())
                        .append(")");
            }

            if (field.getMin() != null) {
                sql.append(" CHECK (")
                        .append(field.getFieldName())
                        .append(" >= ")
                        .append(field.getMin())
                        .append(")");
            }

            if (field.getMax() != null) {
                sql.append(" CHECK (")
                        .append(field.getFieldName())
                        .append(" <= ")
                        .append(field.getMax())
                        .append(")");
            }

            if (field.getPattern() != null) {
                sql.append(" CHECK (")
                        .append(field.getFieldName())
                        .append(" ~ '")
                        .append(field.getPattern().replace("'", "''"))
                        .append("')");
            }
        }

        sql.append(")");
        jdbcTemplate.execute(sql.toString());
    }

    /**
     * Renames an existing column in the specified dynamic table.
     */
    public void renameColumn(String tableName, String oldName, String newName) {
        validateColumnName(oldName);
        validateColumnName(newName);
        String sql = "ALTER TABLE " + tableName +
                " RENAME COLUMN " + oldName + " TO " + newName;
        jdbcTemplate.execute(sql);
    }

    /**
     * Drops a column from the specified dynamic table if it exists.
     */
    public void dropColumn(String tableName, String columnName) {
        validateColumnName(columnName);
        String sql = "ALTER TABLE " + tableName +
                " DROP COLUMN IF EXISTS " + columnName;
        jdbcTemplate.execute(sql);
    }


    public void makeColumnNullable(String tableName, String columnName) {
        validateColumnName(columnName);
        String sql = "ALTER TABLE " + tableName +
                " ALTER COLUMN " + columnName + " DROP NOT NULL";
        jdbcTemplate.execute(sql);
    }

    /**
     * Adds a new column to the specified dynamic table.
     */
    public void addColumn(String tableName, FormField field) {
        validateColumnName(field.getFieldName());
        StringBuilder sql = new StringBuilder();
        sql.append("ALTER TABLE ").append(tableName)
                .append(" ADD COLUMN ").append(field.getFieldName())
                .append(" ").append(mapType(field));

        jdbcTemplate.execute(sql.toString());
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
            case "date" -> "DATE";
            case "time" -> "TIME";
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
