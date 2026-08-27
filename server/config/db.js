const { Pool } = require('pg')
require('./env')

// Allow either a full connection string (DATABASE_URL, as provided by
// Railway/Render/Neon) or individual DB_* variables.
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  const required = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD']
  const missing  = required.filter(key => !process.env[key])

  if (missing.length > 0) {
    console.error(`❌  Missing database configuration: ${missing.join(', ')}`)
    console.error('    Set DATABASE_URL, or set all of DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD.')
    process.exit(1)
  }
}

const pool = process.env.DATABASE_URL
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : new Pool({
      host:     process.env.DB_HOST,
      port:     parseInt(process.env.DB_PORT, 10),
      database: process.env.DB_NAME,
      user:     process.env.DB_USER,
      password: process.env.DB_PASSWORD,
    })

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌  Database connection failed:', err.message)
  } else {
    console.log('✅  Connected to PostgreSQL database')
    release()
  }
})

module.exports = pool
