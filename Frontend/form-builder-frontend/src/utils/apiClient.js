import axios from 'axios';
import { API_BASE_URL } from '../config/apiConfig';
import Swal from 'sweetalert2';

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

// Utility to parse a cookie by name
const getCookie = (name) => {
    if (typeof document === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return decodeURIComponent(parts.pop().split(';').shift());
    return null;
};

// Request Interceptor to inject CSRF Token
apiClient.interceptors.request.use(
    (config) => {
        const methodsThatRequireCsrf = ['post', 'put', 'delete', 'patch'];
        if (config.method && methodsThatRequireCsrf.includes(config.method.toLowerCase())) {
            const csrfToken = getCookie('XSRF-TOKEN');
            if (csrfToken) {
                config.headers['X-XSRF-TOKEN'] = csrfToken;
            }
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor for Global Error Handling
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;
        
        // Handle 401 Unauthorized globally
        if (status === 401) {
            const isAuthCheck = error.config?.url?.includes('/auth/me');
            if (typeof window !== 'undefined' && !window.location.pathname.includes('/login') && !isAuthCheck) {
                window.location.href = '/login?expired=true';
                return Promise.reject(error);
            }
        }

        // Normalize error message
        const message = 
            error.response?.data?.message || 
            error.response?.data?.error || 
            error.message || 
            'An unexpected error occurred';
        
        // Show SweetAlert2 popup for all other errors (exclude 401s and auth checks)
        const isAuthCheck = error.config?.url?.includes('/auth/me');
        const skipModal = error.config?.skipErrorModal;

        if (typeof window !== 'undefined' && !isAuthCheck && status !== 401 && !skipModal) {
            Swal.fire({
                icon: 'error',
                title: status === 403 ? 'Access Denied' : 'Request Failed',
                text: message,
                confirmButtonColor: '#4F46E5', // Indigo-600
                background: '#ffffff',
                customClass: {
                    popup: 'rounded-[32px] border-none shadow-2xl',
                    title: 'text-2xl font-black text-slate-800 uppercase tracking-tight pt-4',
                    htmlContainer: 'text-slate-500 font-medium',
                    confirmButton: 'rounded-2xl px-10 py-3 font-black uppercase tracking-widest text-xs transition-all hover:scale-105 active:scale-95'
                },
                buttonsStyling: true,
                showClass: {
                    popup: 'animate__animated animate__zoomIn animate__faster'
                },
                hideClass: {
                    popup: 'animate__animated animate__zoomOut animate__faster'
                }
            });
        }

        // Resolve instead of reject to prevent Next.js dev overlay from showing "Issues" (red badge)
        // Calling components can still check res.data.success
        return Promise.resolve({
            data: {
                success: false,
                message: message,
                data: null,
                error: error.response?.data || error.message,
                status: status
            }
        });
    }
);

export default apiClient;
