import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const register = (data) => api.post('auth/register', data)
export const login = (data) => api.post('auth/login', data)

// Track interaction with dynamic data
export const track = (featureName, data = {}) => {
  return api.post('/track', { 
    featureName,
    ...data
  }).catch(err => {
    console.error('Track API error:', err.response?.data || err.message)
  }) // log but don't block
}

// Analytics
export const getAnalytics = (params) => api.get('analytics', { 
  params: { ...params, _t: new Date().getTime() } 
})

export default api
