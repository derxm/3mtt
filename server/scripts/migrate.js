/**
 * Applies schema.sql to the database.
 * Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.
 * Called automatically by Render's build step via "npm run build".
 */
const { Pool } = require('pg')
const fs   = require('fs')
const path = require('path')
require('../config/env')

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL — skipping migration (local dev uses DB_* vars, run schema.sql manually).')
    process.exit(0)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  try {
    const sql = fs.readFileSync(path.join(__dirname, '..', 'config', 'schema.sql'), 'utf8')
    await pool.query(sql)
    console.log('✅  Database schema applied successfully.')
    process.exit(0)
  } catch (err) {
    console.error('❌  Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

migrate()
