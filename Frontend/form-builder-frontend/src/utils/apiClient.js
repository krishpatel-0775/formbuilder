import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';

/**
 * Centralized API Client using Axios.
 * Configured with base URL and credentials for session-based auth.
 */
const apiClient = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Response Interceptor for Global Error Handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        // Normalize error message from Spring Boot's ApiResponse or generic Axios error
        const message = 
            error.response?.data?.message || 
            error.response?.data?.error || 
            error.message || 
            'An unexpected error occurred';
        
        // You could trigger a global toast here if a notification system was present
        // log.error('[API Error]', message);

        // Handle 401 Unauthorized globally
        if (error.response?.status === 401) {
            // Note: Middleware usually handles route protection, 
            // but this helps if a session expires while on a page.
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
                // Optional: window.location.href = '/login';
            }
        }

        return Promise.reject({ ...error, message });
    }
);

export default apiClient;
