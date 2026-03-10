package com.example.formBuilder.constants;

public class AppConstants {
    // Cross Origin
    public static final String FRONTEND_URL = "http://localhost:3000";

    // Base API Endpoints
    public static final String API_BASE_FORMS = "/api/forms";
    public static final String API_BASE_SUBMISSIONS = "/api/submissions";

    // Form API Sub-Endpoints
    public static final String API_FORM_BY_ID = "/{id}";
    public static final String API_FORM_DATA = "/data/{id}";
    public static final String API_FORM_PUBLISH = "/publish/{id}";
    public static final String API_FORM_LOOKUP = "/{id}/lookup/{columnName}";

    // Submission API Sub-Endpoints
    public static final String API_SUBMISSION_DELETE = "/{formId}/response/{responseId}";
    public static final String API_SUBMISSION_BULK_DELETE = "/{formId}/responses/bulk-delete";
    public static final String API_SUBMISSION_VISIBILITY = "/visibility";

    // Form Rules Sub-Endpoints
    public static final String API_FORM_RULES = "/{id}/rules";

    // Regex Patterns
    public static final String URL_REGEX = "^(https?://)(localhost|[\\w\\-]+(\\.[\\w\\-]+)+)(:\\d+)?(/.*)?$";
    public static final String PHONE_REGEX = "^\\d{7,15}$";
    public static final String VALID_NAME_REGEX = "^[a-zA-Z][a-zA-Z0-9_]*$";
    
    private AppConstants() {
        // Private constructor to prevent instantiation
    }
}
