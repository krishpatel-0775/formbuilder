package com.example.formBuilder.config;

import com.example.formBuilder.entity.Form;
import com.example.formBuilder.service.FormVersionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.ApplicationListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;

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
    private final com.example.formBuilder.repository.FormRepository formRepository;
    private final com.example.formBuilder.repository.FormFieldRepository formFieldRepository;
    private final com.example.formBuilder.repository.FormVersionRepository formVersionRepository;
    private final com.example.formBuilder.service.SchemaManager schemaManager;


    @Override
    public void onApplicationEvent(ApplicationReadyEvent event) {
        initSchema();
        formVersionService.migrateExistingForms();
        log.info("Form versioning schema and migration completed.");
        checkSchemaDrift();
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

    /**
     * Startup schema drift scan (fail-fast).
     *
     * Checks every PUBLISHED form against its active version's field definitions.
     * If any form's table is missing one or more expected columns, the application
     * refuses to start. This prevents silent partial writes and confusing runtime errors.
     *
     * Called last in onApplicationEvent(), after all migrations have run.
     */
    private void checkSchemaDrift() {
        List<Form> publishedForms =
                formRepository.findByStatus(com.example.formBuilder.enums.FormStatus.PUBLISHED);

        if (publishedForms.isEmpty()) {
            log.info("[SchemaDrift] No published forms found. Drift check skipped.");
            return;
        }

        log.info("[SchemaDrift] Checking {} published form(s) for schema drift...", publishedForms.size());
        boolean driftFound = false;

        for (com.example.formBuilder.entity.Form form : publishedForms) {
            if (form.getTableName() == null || form.getTableName().isBlank()) {
                log.error("[SchemaDrift] PROBLEM: Form '{}' (id={}) is PUBLISHED but has no tableName set.",
                        form.getFormName(), form.getId());
                driftFound = true;
                continue;
            }

            // Get the active version's fields
            com.example.formBuilder.entity.FormVersion activeVersion =
                    formVersionRepository.findByFormIdAndIsActiveTrue(form.getId()).orElse(null);

            List<com.example.formBuilder.entity.FormField> fields;
            if (activeVersion != null) {
                fields = formFieldRepository.findByFormVersionIdOrderByDisplayOrderAscIdAsc(activeVersion.getId());
            } else {
                // Fallback: use legacy fields not yet associated with any version
                fields = formFieldRepository.findByFormIdAndFormVersionIsNullOrderByDisplayOrderAscIdAsc(form.getId());
            }

            List<String> missingColumns = schemaManager.detectDrift(form.getTableName(), fields);

            if (!missingColumns.isEmpty()) {
                log.error("[SchemaDrift] DRIFT DETECTED — form: '{}' (id={}) table: '{}'",
                        form.getFormName(), form.getId(), form.getTableName());
                log.error("[SchemaDrift] Missing columns: {}", String.join(", ", missingColumns));
                driftFound = true;
            } else {
                log.info("[SchemaDrift] OK — form: '{}'", form.getFormName());
            }
        }

        if (driftFound) {
            throw new IllegalStateException(
                "APPLICATION STARTUP ABORTED: Schema drift detected in one or more published forms. " +
                "Review the [SchemaDrift] log entries above for the exact missing columns. " +
                "Fix the database schema before restarting."
            );
        }

        log.info("[SchemaDrift] All published forms passed drift check.");
    }
}

