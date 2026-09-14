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

// Always use /api as the base path.
// In local dev: Vite's dev server proxy forwards /api → http://localhost:5000
// In production: Vercel's rewrite rule forwards /api/* → Render backend
// This avoids CORS issues since the request origin stays the same domain.
const api = axios.create({
  baseURL: '/api',
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
