import axios from 'axios'

// ── camelCase conversion helpers ────────────────────────────────────────────
function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase())
}

function deepCamel(obj) {
  if (Array.isArray(obj)) return obj.map(deepCamel)
  if (obj !== null && typeof obj === 'object') {
    return Object.fromEntries(
      Object.entries(obj).map(([k, v]) => [toCamel(k), deepCamel(v)])
    )
  }
  return obj
}

const api = axios.create({
  // In production VITE_API_URL = https://your-app.railway.app/api
  // In local dev the Vite proxy forwards /api → http://localhost:5000
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
})

// Attach JWT to every request if one exists in localStorage
api.interceptors.request.use(config => {
  const token = localStorage.getItem('st_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Convert snake_case response keys → camelCase; on 401 clear the expired
// session, but never redirect while on the auth pages (so login/register
// errors like "Invalid email or password" can actually be shown).
const PUBLIC_PATHS = ['/login', '/register']

api.interceptors.response.use(
  response => {
    response.data = deepCamel(response.data)
    return response
  },
  error => {
    if (error.response?.status === 401 && !PUBLIC_PATHS.includes(window.location.pathname)) {
      localStorage.removeItem('st_token')
      localStorage.removeItem('st_user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
