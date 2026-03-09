export const API_BASE_URL = "http://localhost:9090";

export const ENDPOINTS = {
    FORMS: `${API_BASE_URL}/api/forms`,
    SUBMISSIONS: `${API_BASE_URL}/api/submissions`,
    VISIBILITY: `${API_BASE_URL}/api/submissions/visibility`,
    // Auth
    AUTH_REGISTER: `${API_BASE_URL}/api/auth/register`,
    AUTH_LOGIN: `${API_BASE_URL}/api/auth/login`,
    AUTH_LOGOUT: `${API_BASE_URL}/api/auth/logout`,
    AUTH_ME: `${API_BASE_URL}/api/auth/me`,
    // Helper functions for per-form endpoints
    formRules: (id) => `${API_BASE_URL}/api/forms/${id}/rules`,
};
