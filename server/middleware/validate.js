const { validationResult } = require('express-validator')

// Run after express-validator chains — returns 422 if any errors exist
module.exports = function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({
      message: 'Validation failed.',
      errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
    })
  }
  next()
}
