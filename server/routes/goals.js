const express  = require('express')
const { body } = require('express-validator')
const router   = express.Router()

const {
  getGoals, getGoalById, createGoal, updateGoal, deleteGoal,
} = require('../controllers/goalsController')

const authMiddleware = require('../middleware/auth')
const validate       = require('../middleware/validate')

// All goals routes require authentication
router.use(authMiddleware)

const createRules = [
  body('title')
    .trim().notEmpty().withMessage('Title is required.')
    .isLength({ max: 100 }).withMessage('Title must be 100 characters or fewer.'),
  body('target_amount')
    .isFloat({ gt: 0 }).withMessage('Target amount must be a positive number.'),
  body('category')
    .optional()
    .isLength({ max: 50 }).withMessage('Category must be 50 characters or fewer.'),
  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isDate().withMessage('Deadline must be a valid date (YYYY-MM-DD).'),
]

const updateRules = [
  body('title')
    .optional()
    .trim().notEmpty().withMessage('Title cannot be empty.')
    .isLength({ max: 100 }).withMessage('Title must be 100 characters or fewer.'),
  body('target_amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Target amount must be a positive number.'),
  body('category')
    .optional()
    .isLength({ max: 50 }).withMessage('Category must be 50 characters or fewer.'),
  body('deadline')
    .optional({ nullable: true, checkFalsy: true })
    .isDate().withMessage('Deadline must be a valid date (YYYY-MM-DD).'),
]

router.get('/',     getGoals)
router.get('/:id',  getGoalById)
router.post('/',    createRules, validate, createGoal)
router.put('/:id',  updateRules, validate, updateGoal)
router.delete('/:id', deleteGoal)

module.exports = router
