export const API_BASE_URL = "http://localhost:9090";

export const ENDPOINTS = {
    FORMS: `${API_BASE_URL}/api/v1/forms`,
    SUBMISSIONS: `${API_BASE_URL}/api/v1/submissions`,
    DASHBOARD_STATS: `${API_BASE_URL}/api/v1/dashboard/stats`,
    VISIBILITY: `${API_BASE_URL}/api/v1/submissions/visibility`,
    // Auth
    AUTH_REGISTER: `${API_BASE_URL}/api/v1/auth/register`,
    AUTH_LOGIN: `${API_BASE_URL}/api/v1/auth/login`,
    AUTH_LOGOUT: `${API_BASE_URL}/api/v1/auth/logout`,
    AUTH_ME: `${API_BASE_URL}/api/v1/auth/me`,
    // Helper functions for per-form endpoints
    formRules: (id) => `${API_BASE_URL}/api/v1/forms/${id}/rules`,
    // Version management
    formVersions: (formId) => `${API_BASE_URL}/api/v1/forms/${formId}/versions`,
    formVersion: (formId, versionId) => `${API_BASE_URL}/api/v1/forms/${formId}/versions/${versionId}`,
    formVersionRules: (formId, versionId) => `${API_BASE_URL}/api/v1/forms/${formId}/versions/${versionId}/rules`,
    formDraft: (formId) => `${API_BASE_URL}/api/v1/forms/${formId}/versions/draft`,
    activateVersion: (formId, versionId) => `${API_BASE_URL}/api/v1/forms/${formId}/versions/${versionId}/activate`,
};

