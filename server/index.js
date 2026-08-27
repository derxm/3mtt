require('./config/env')

const express      = require('express')
const cors         = require('cors')
const errorHandler = require('./middleware/errorHandler')

// Route modules
const authRoutes         = require('./routes/auth')
const goalsRoutes        = require('./routes/goals')
const transactionsRoutes = require('./routes/transactions')

const app  = express()
const PORT = process.env.PORT || 5000

// ─── CORS ─────────────────────────────────────────────────────────────────────
// CLIENT_ORIGIN can be a comma-separated list for multiple allowed origins
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
}))

// ─── Body Parsers ─────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes)
app.use('/api/goals',        goalsRoutes)
app.use('/api/transactions', transactionsRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: `Route ${req.method} ${req.originalUrl} not found.` })
})

// ─── Centralised Error Handler ────────────────────────────────────────────────
app.use(errorHandler)

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀  Server running on port ${PORT}`)
})

module.exports = app
