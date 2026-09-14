require('./config/env')

const express      = require('express')
const cors         = require('cors')
const fs           = require('fs')
const path         = require('path')
const { Pool }     = require('pg')
const errorHandler = require('./middleware/errorHandler')

// Route modules
const authRoutes         = require('./routes/auth')
const goalsRoutes        = require('./routes/goals')
const transactionsRoutes = require('./routes/transactions')

const app  = express()
const PORT = process.env.PORT || 5000

// ─── Run DB migration before server starts ────────────────────────────────────
async function runMigration() {
  if (!process.env.DATABASE_URL) {
    console.log('ℹ️   No DATABASE_URL — skipping auto-migration.')
    return
  }
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })
  const client = await pool.connect()
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'config', 'schema.sql'), 'utf8')
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    for (const stmt of statements) {
      await client.query(stmt)
    }
    console.log('✅  Schema migration complete.')
  } catch (err) {
    console.error('❌  Migration error:', err.message)
  } finally {
    client.release()
    await pool.end()
  }
}

// ─── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, callback) => {
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

// ─── Start ────────────────────────────────────────────────────────────────────
runMigration().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀  Server running on port ${PORT}`)
  })
})

module.exports = app
