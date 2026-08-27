const bcrypt  = require('bcryptjs')
const jwt     = require('jsonwebtoken')
const pool    = require('../config/db')
require('../config/env')

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not set. Add it to server/.env.')
}

function signToken(user) {
  return jwt.sign(
    { id: user.id, name: user.name, email: user.email },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  )
}

// POST /api/auth/register
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body

    // Check duplicate email
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email])
    if (exists.rows.length > 0) {
      return res.status(409).json({ message: 'Email is already registered.' })
    }

    const password_hash = await bcrypt.hash(password, 12)

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash)
       VALUES ($1, $2, $3)
       RETURNING id, name, email, created_at`,
      [name.trim(), email.toLowerCase().trim(), password_hash]
    )

    const user  = result.rows[0]
    const token = signToken(user)

    res.status(201).json({ token, user })
  } catch (err) {
    next(err)
  }
}

// POST /api/auth/login
async function login(req, res, next) {
  try {
    const { email, password } = req.body

    const result = await pool.query(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email.toLowerCase().trim()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const user  = result.rows[0]
    const match = await bcrypt.compare(password, user.password_hash)

    if (!match) {
      return res.status(401).json({ message: 'Invalid email or password.' })
    }

    const token = signToken(user)
    const { password_hash: _, ...safeUser } = user

    res.json({ token, user: safeUser })
  } catch (err) {
    next(err)
  }
}

// GET /api/auth/me  (protected)
async function getMe(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT id, name, email, created_at FROM users WHERE id = $1',
      [req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' })
    }

    res.json({ user: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

module.exports = { register, login, getMe }
