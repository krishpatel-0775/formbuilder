export const API_BASE_URL = "http://localhost:9090";

const API_V1 = "/api/v1";

export const ENDPOINTS = {
    FORMS: `${API_V1}/forms`,
    DELETED_FORMS: `${API_V1}/forms/deleted`,
    SUBMISSIONS: `${API_V1}/submissions`,
    DASHBOARD_STATS: `${API_V1}/dashboard/stats`,
    // Auth
    AUTH_REGISTER: `${API_V1}/auth/register`,
    AUTH_LOGIN: `${API_V1}/auth/login`,
    AUTH_LOGOUT: `${API_V1}/auth/logout`,
    AUTH_ME: `${API_V1}/auth/me`,
    // Helper functions for per-form endpoints
    formRules: (id) => `${API_V1}/forms/${id}/rules`,
    // Version management
    formVersions: (formId) => `${API_V1}/forms/${formId}/versions`,
    formVersion: (formId, versionId) => `${API_V1}/forms/${formId}/versions/${versionId}`,
    formVersionRules: (formId, versionId) => `${API_V1}/forms/${formId}/versions/${versionId}/rules`,
    formDraft: (formId) => `${API_V1}/forms/${formId}/versions/draft`,
    activateVersion: (formId, versionId) => `${API_V1}/forms/${formId}/versions/${versionId}/activate`,
    exportCsv: (id) => `${API_V1}/forms/${id}/export/csv`,
    formAnalytics: (id) => `${API_V1}/forms/${id}/analytics`,
    incrementFormView: (id) => `${API_V1}/forms/${id}/view`,
    restoreForm: (id) => `${API_V1}/forms/restore/${id}`,
    submissionDetail: (formId, responseId) => `${API_V1}/submissions/${formId}/response/${responseId}`,
    deletedFormData: (id) => `${API_V1}/forms/${id}/deleted-data`,
    restoreResponse: (formId, responseId) => `${API_V1}/submissions/${formId}/response/${responseId}/restore`,
    bulkRestoreResponses: (formId) => `${API_V1}/submissions/${formId}/responses/bulk-restore`,
    // Modules & Users
    MODULES: `${API_V1}/modules`,
    USERS: `${API_V1}/users`,
    ROLES: `${API_V1}/roles`,
    FILES_UPLOAD: `${API_V1}/files/upload`,
};


