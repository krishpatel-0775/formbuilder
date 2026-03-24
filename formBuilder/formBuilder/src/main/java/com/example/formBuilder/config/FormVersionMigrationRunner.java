package com.example.formBuilder.config;

import com.example.formBuilder.service.FormVersionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Runs once after Spring Boot application has fully started.
 * 1. Creates the form_version table and form_field.form_version_id column if missing.
 * 2. Auto-migrates any existing forms that have no version records.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class FormVersionMigrationRunner implements ApplicationListener<ApplicationReadyEvent> {

    private final JdbcTemplate jdbcTemplate;
    private final FormVersionService formVersionService;

    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        initSchema();
        formVersionService.migrateExistingForms();
        log.info("Form versioning schema and migration completed.");
    }

    private void initSchema() {
        // Create form_version table
        jdbcTemplate.execute(
            "CREATE TABLE IF NOT EXISTS form_version (" +
            "    id             BIGSERIAL PRIMARY KEY," +
            "    form_id        BIGINT NOT NULL," +
            "    version_number INTEGER NOT NULL," +
            "    is_active      BOOLEAN NOT NULL DEFAULT FALSE," +
            "    rules          TEXT," +
            "    created_by     VARCHAR(255)," +
            "    created_at     TIMESTAMP NOT NULL DEFAULT NOW()," +
            "    CONSTRAINT uq_form_version UNIQUE (form_id, version_number)" +
            ")"
        );

        // Add form_version_id column to form_field if it doesn't exist
        jdbcTemplate.execute(
            "ALTER TABLE form_field ADD COLUMN IF NOT EXISTS form_version_id BIGINT REFERENCES form_version(id)"
        );

        // Add display_order column to form_field if it doesn't exist
        jdbcTemplate.execute(
            "ALTER TABLE form_field ADD COLUMN IF NOT EXISTS display_order INTEGER"
        );

        log.info("form_version schema initialized.");
    }
}
