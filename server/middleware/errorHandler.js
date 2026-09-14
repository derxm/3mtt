// Centralised error handler — must be registered last in Express
module.exports = function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${req.method} ${req.originalUrl} —`, err.message)

  // PostgreSQL unique violation (e.g. duplicate email)
  if (err.code === '23505') {
    return res.status(409).json({ message: 'A record with that value already exists.' })
  }

  // PostgreSQL foreign key violation
  if (err.code === '23503') {
    return res.status(400).json({ message: 'Referenced record does not exist.' })
  }

  // PostgreSQL check constraint violation
  if (err.code === '23514') {
    return res.status(400).json({ message: 'Value violates a database constraint.' })
  }

  // PostgreSQL "relation does not exist" — schema not applied yet
  if (err.code === '42P01') {
    return res.status(500).json({ message: 'Database table missing. Run the schema migration.' })
  }

  const status  = err.status || err.statusCode || 500
  // Always include the real error message so Render logs show what went wrong
  const message = err.message || 'Internal server error.'
  res.status(status).json({ message })
}
