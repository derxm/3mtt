const express  = require('express')
const { body } = require('express-validator')
const router   = express.Router()

const { register, login, getMe } = require('../controllers/authController')
const authMiddleware = require('../middleware/auth')
const validate       = require('../middleware/validate')

// Validation rules
const registerRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required.')
    .isLength({ max: 100 }).withMessage('Name must be 100 characters or fewer.'),
  body('email')
    .isEmail().withMessage('A valid email is required.')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.'),
]

const loginRules = [
  body('email').isEmail().withMessage('A valid email is required.').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required.'),
]

// Routes
router.post('/register', registerRules, validate, register)
router.post('/login',    loginRules,    validate, login)
router.get('/me',        authMiddleware, getMe)

module.exports = router
