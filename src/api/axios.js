import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL || 'http://localhost:3004/api',
  withCredentials: true,
  timeout: 15000,
})

const token = localStorage.getItem('LMS_accessToken')
if (token) {
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`
}

api.interceptors.request.use((config) => {
  const t = localStorage.getItem('LMS_accessToken')
  if (t) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = `Bearer ${t}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      try {
        localStorage.removeItem('LMS_accessToken')
      } catch (_) { /* ignore */ }
      delete api.defaults.headers.common['Authorization']
    }
    return Promise.reject(error)
  }
)

export default api
