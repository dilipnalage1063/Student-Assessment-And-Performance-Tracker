// Centralized API Configuration

// Default to localhost, but allow override via Environment Variable (Vercel)
const LOCAL_URL = 'http://localhost:8080'; // Default backend port

const getBaseUrl = () => {
    // 1. Prioritize Environment Variable (Vercel/Railway)
    let url = import.meta.env.VITE_API_BASE_URL;
    if (url) {
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        return url;
    }
    // 2. Fallback to Localhost for development
    return LOCAL_URL;
};

export const API_BASE_URL = getBaseUrl();

console.log('API_BASE_URL configured as:', API_BASE_URL);

export const endpoints = {
    login: `${API_BASE_URL}/api/auth/login`,
    users: `${API_BASE_URL}/api/users`,
    subjects: `${API_BASE_URL}/api/subjects`,
    // Reporting Service URL
    report: (studentId) => {
        let url = import.meta.env.VITE_REPORTING_URL || 'http://localhost:5174';
        if (!url.startsWith('http') && !url.includes('localhost')) {
            url = `https://${url}`;
        }
        return `${url}/api/reports/student/${studentId}`;
    },
};
