/**
 * Applies schema.sql to the database.
 * Safe to run multiple times — uses CREATE TABLE IF NOT EXISTS.
 * Called automatically by Render's build step via "npm run build".
 *
 * pg's pool.query() only executes one statement at a time, so we split
 * the SQL file on semicolons and run each statement individually.
 */
const { Pool } = require('pg')
const fs   = require('fs')
const path = require('path')
require('../config/env')

async function migrate() {
  if (!process.env.DATABASE_URL) {
    console.log('No DATABASE_URL — skipping migration.')
    process.exit(0)
  }

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  })

  const client = await pool.connect()

  try {
    const sql = fs.readFileSync(
      path.join(__dirname, '..', 'config', 'schema.sql'),
      'utf8'
    )

    // Split on semicolons, drop blank/comment-only chunks
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))

    console.log(`Running ${statements.length} SQL statements...`)

    await client.query('BEGIN')
    for (const statement of statements) {
      await client.query(statement)
    }
    await client.query('COMMIT')

    console.log('✅  Database schema applied successfully.')
    process.exit(0)
  } catch (err) {
    await client.query('ROLLBACK')
    console.error('❌  Migration failed:', err.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

migrate()
