import axios from 'axios'


const isProd = String(import.meta.env.VITE_IS_PRODUCTION || '').toLowerCase() === 'true'
const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3004/api',
    withCredentials: true, // set this to true if backend uses httpOnly cookies
})


// Attach token from localStorage if present (initial load)
const token = localStorage.getItem('LMS_accessToken')
if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

// Always attach token on requests, in case it changes after login
api.interceptors.request.use((config) => {
    const t = localStorage.getItem('LMS_accessToken')
    if (t) {
        config.headers = config.headers || {}
        config.headers['Authorization'] = `Bearer ${t}`
    }
    return config
})

// Handle 401 globally by clearing token and redirecting to login
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status
        const FRONTEND_BASE = (import.meta.env.VITE_FRONTEND_BASE_PATH || '/').replace(/\/+$/, '')
        if (status === 401) {
            try {
                // localStorage.removeItem('LMS_accessToken')
            } catch (_) { }
            if (typeof window !== 'undefined' && window.location.pathname !== `${FRONTEND_BASE}/login`) {
                // window.location.href = `${FRONTEND_BASE}/login`
            }
        }
        return Promise.reject(error)
    }
)

export default api
