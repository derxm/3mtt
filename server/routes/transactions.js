const express  = require('express')
const { body } = require('express-validator')
const router   = express.Router()

const {
  getTransactions, createTransaction, deleteTransaction,
} = require('../controllers/transactionsController')

const authMiddleware = require('../middleware/auth')
const validate       = require('../middleware/validate')

router.use(authMiddleware)

const createRules = [
  body('goal_id')
    .notEmpty().withMessage('goal_id is required.')
    .isUUID().withMessage('goal_id must be a valid UUID.'),
  body('amount')
    .isFloat({ gt: 0 }).withMessage('Amount must be a positive number.'),
  body('type')
    .isIn(['deposit', 'withdrawal']).withMessage('Type must be deposit or withdrawal.'),
  body('note')
    .optional({ nullable: true, checkFalsy: true })
    .isLength({ max: 200 }).withMessage('Note must be 200 characters or fewer.'),
  body('date')
    .optional({ nullable: true, checkFalsy: true })
    .isDate().withMessage('Date must be a valid date (YYYY-MM-DD).'),
]

router.get('/',     getTransactions)
router.post('/',    createRules, validate, createTransaction)
router.delete('/:id', deleteTransaction)

module.exports = router
