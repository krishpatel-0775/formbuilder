package com.example.formBuilder.constants;

public class AppConstants {
    // Cross Origin
    public static final String FRONTEND_URL = "http://localhost:3000";

    // Base API Endpoints
    public static final String API_BASE_FORMS = "/api/v1/forms";
    public static final String API_BASE_SUBMISSIONS = "/api/v1/submissions";

    // Form API Sub-Endpoints
    public static final String API_FORM_BY_ID = "/{id}";
    public static final String API_FORM_DELETED_DATA = "/{id}/deleted-data";
    public static final String API_FORM_PUBLISH = "/publish/{id}";
    public static final String API_FORM_LOOKUP = "/{id}/lookup/{columnName}";
    public static final String API_FORM_RESTORE = "/restore/{id}";
    public static final String API_FORM_DELETED = "/deleted";


    // Submission API Sub-Endpoints
    public static final String API_SUBMISSION_DELETE = "/{formId}/response/{responseId}";
    public static final String API_SUBMISSION_RESTORE = "/{formId}/response/{responseId}/restore";
    public static final String API_SUBMISSION_BULK_DELETE = "/{formId}/responses/bulk-delete";
    public static final String API_SUBMISSION_BULK_RESTORE = "/{formId}/responses/bulk-restore";

    // Form Rules Sub-Endpoints
    public static final String API_FORM_RULES = "/{id}/rules";

    // Regex Patterns
    public static final String URL_REGEX = "^(https?://)(localhost|[\\w\\-]+(\\.[\\w\\-]+)+)(:\\d+)?(/.*)?$";
    public static final String PHONE_REGEX = "^\\d{7,15}$";
    public static final String VALID_NAME_REGEX = "^[a-zA-Z][a-zA-Z0-9_]*$";
    // Regex for the auto-generated formCode (internal, never user-facing validation)
    public static final String FORM_CODE_REGEX = "^[a-z][a-z0-9_]{2,49}$";

    // Display name: any printable characters, 3–100 chars, at least one non-space character
    public static final String FORM_DISPLAY_NAME_REGEX = "^.{3,100}$";

    public static String sanitizeKey(String input) {
        if (input == null) return null;
        return input.trim().toLowerCase()
                .replaceAll("[\\s\\-]", "_")
                .replaceAll("[^a-z0-9_]", "")
                .replaceAll("^\\d+", "f_$0");
    }
    
    private AppConstants() {
        // Private constructor to prevent instantiation
    }
}
