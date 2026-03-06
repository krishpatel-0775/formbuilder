export const API_BASE_URL = "http://localhost:9090";

export const ENDPOINTS = {
    FORMS: `${API_BASE_URL}/api/forms`,
    SUBMISSIONS: `${API_BASE_URL}/api/submissions`,
    VISIBILITY: `${API_BASE_URL}/api/submissions/visibility`,
    // Helper functions for per-form endpoints
    formRules: (id) => `${API_BASE_URL}/api/forms/${id}/rules`,
};
