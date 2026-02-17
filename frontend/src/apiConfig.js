// Centralized API Configuration
// This ensures we always use the correct backend URL in production

const POLLING_INTERVAL = 30000; // 30 seconds

// Hardcoded production URL to ensure it works even if .env fails
const PROD_URL = 'https://optimistic-solace-production-f034.up.railway.app';
const LOCAL_URL = 'http://localhost:8085';

// Determine logic: 
// 1. If VITE_API_BASE_URL is set, use it.
// 2. If we are in production mode (import.meta.env.PROD), use PROD_URL.
// 3. Otherwise use LOCAL_URL.

const getBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) {
        return import.meta.env.VITE_API_BASE_URL;
    }
    if (import.meta.env.MODE === 'production') {
        return PROD_URL;
    }
    return LOCAL_URL;
};

export const API_BASE_URL = getBaseUrl();

console.log('API_BASE_URL configured as:', API_BASE_URL);

export const endpoints = {
    login: `${API_BASE_URL}/api/auth/login`,
    users: `${API_BASE_URL}/api/users`,
    subjects: `${API_BASE_URL}/api/subjects`,
    // Reporting Service URL (Update this after deploying .NET service on Railway)
    report: (studentId) => `${import.meta.env.VITE_REPORTING_URL || 'http://localhost:5174'}/api/reports/student/${studentId}`,
};
