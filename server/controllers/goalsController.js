const pool = require('../config/db')

// GET /api/goals
async function getGoals(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         g.id, g.user_id, g.title, g.target_amount, g.current_amount,
         g.category, g.deadline, g.created_at, g.updated_at,
         COALESCE(
           SUM(CASE WHEN t.type = 'deposit'    THEN t.amount ELSE 0 END) -
           SUM(CASE WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END),
           0
         ) AS computed_amount
       FROM savings_goals g
       LEFT JOIN transactions t ON t.goal_id = g.id
       WHERE g.user_id = $1
       GROUP BY g.id
       ORDER BY g.created_at DESC`,
      [req.user.id]
    )
    res.json({ goals: result.rows })
  } catch (err) {
    next(err)
  }
}

// GET /api/goals/:id
async function getGoalById(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT
         g.id, g.user_id, g.title, g.target_amount, g.current_amount,
         g.category, g.deadline, g.created_at, g.updated_at,
         COALESCE(
           SUM(CASE WHEN t.type = 'deposit'    THEN t.amount ELSE 0 END) -
           SUM(CASE WHEN t.type = 'withdrawal' THEN t.amount ELSE 0 END),
           0
         ) AS computed_amount
       FROM savings_goals g
       LEFT JOIN transactions t ON t.goal_id = g.id
       WHERE g.id = $1 AND g.user_id = $2
       GROUP BY g.id`,
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found.' })
    }

    res.json({ goal: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// POST /api/goals
async function createGoal(req, res, next) {
  try {
    const { title, target_amount, category, deadline } = req.body

    const result = await pool.query(
      `INSERT INTO savings_goals (user_id, title, target_amount, category, deadline)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [
        req.user.id,
        title.trim(),
        target_amount,
        category || 'Other',
        deadline || null,
      ]
    )

    res.status(201).json({ goal: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// PUT /api/goals/:id
async function updateGoal(req, res, next) {
  try {
    const { title, target_amount, category, deadline } = req.body

    // Verify ownership first
    const owns = await pool.query(
      'SELECT id FROM savings_goals WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (owns.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found.' })
    }

    const result = await pool.query(
      `UPDATE savings_goals
       SET
         title         = COALESCE($1, title),
         target_amount = COALESCE($2, target_amount),
         category      = COALESCE($3, category),
         deadline      = $4
       WHERE id = $5 AND user_id = $6
       RETURNING *`,
      [
        title     ? title.trim() : null,
        target_amount || null,
        category  || null,
        deadline  || null,
        req.params.id,
        req.user.id,
      ]
    )

    res.json({ goal: result.rows[0] })
  } catch (err) {
    next(err)
  }
}

// DELETE /api/goals/:id
async function deleteGoal(req, res, next) {
  try {
    const result = await pool.query(
      'DELETE FROM savings_goals WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Goal not found.' })
    }

    res.json({ message: 'Goal deleted successfully.', id: result.rows[0].id })
  } catch (err) {
    next(err)
  }
}

module.exports = { getGoals, getGoalById, createGoal, updateGoal, deleteGoal }
