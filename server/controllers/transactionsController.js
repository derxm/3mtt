const pool = require('../config/db')

// GET /api/transactions?goalId=xxx
async function getTransactions(req, res, next) {
  try {
    const { goalId } = req.query

    let query, params

    if (goalId) {
      // Verify the goal belongs to this user before returning its transactions
      const ownsGoal = await pool.query(
        'SELECT id FROM savings_goals WHERE id = $1 AND user_id = $2',
        [goalId, req.user.id]
      )
      if (ownsGoal.rows.length === 0) {
        return res.status(404).json({ message: 'Goal not found.' })
      }

      query  = `SELECT * FROM transactions WHERE goal_id = $1 AND user_id = $2 ORDER BY date DESC, created_at DESC`
      params = [goalId, req.user.id]
    } else {
      query  = `SELECT * FROM transactions WHERE user_id = $1 ORDER BY date DESC, created_at DESC`
      params = [req.user.id]
    }

    const result = await pool.query(query, params)
    res.json({ transactions: result.rows })
  } catch (err) {
    next(err)
  }
}

// POST /api/transactions
async function createTransaction(req, res, next) {
  const client = await pool.connect()
  try {
    const { goal_id, amount, type, note, date } = req.body

    await client.query('BEGIN')

    // Verify the goal belongs to this user
    const goalResult = await client.query(
      'SELECT id, current_amount FROM savings_goals WHERE id = $1 AND user_id = $2',
      [goal_id, req.user.id]
    )
    if (goalResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Goal not found.' })
    }

    // For withdrawals, ensure sufficient balance via computed transactions sum
    if (type === 'withdrawal') {
      const balanceResult = await client.query(
        `SELECT COALESCE(
           SUM(CASE WHEN type = 'deposit'    THEN amount ELSE 0 END) -
           SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END),
           0
         ) AS balance
         FROM transactions WHERE goal_id = $1`,
        [goal_id]
      )
      const balance = parseFloat(balanceResult.rows[0].balance)
      if (amount > balance) {
        await client.query('ROLLBACK')
        return res.status(400).json({
          message: `Insufficient balance. Current balance is ${balance.toFixed(2)}.`,
        })
      }
    }

    // Insert transaction
    const txResult = await client.query(
      `INSERT INTO transactions (goal_id, user_id, amount, type, note, date)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [goal_id, req.user.id, amount, type, note ? note.trim() : null, date || new Date().toISOString().slice(0, 10)]
    )

    // Keep current_amount in sync on the goal row
    const delta = type === 'deposit' ? amount : -amount
    await client.query(
      `UPDATE savings_goals
       SET current_amount = GREATEST(0, current_amount + $1)
       WHERE id = $2`,
      [delta, goal_id]
    )

    await client.query('COMMIT')
    res.status(201).json({ transaction: txResult.rows[0] })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

// DELETE /api/transactions/:id
async function deleteTransaction(req, res, next) {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')

    // Fetch the transaction and confirm ownership
    const txResult = await client.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    )
    if (txResult.rows.length === 0) {
      await client.query('ROLLBACK')
      return res.status(404).json({ message: 'Transaction not found.' })
    }

    const tx = txResult.rows[0]

    // Reverse the amount on the goal
    const delta = tx.type === 'deposit' ? -tx.amount : tx.amount
    await client.query(
      `UPDATE savings_goals
       SET current_amount = GREATEST(0, current_amount + $1)
       WHERE id = $2`,
      [delta, tx.goal_id]
    )

    await client.query(
      'DELETE FROM transactions WHERE id = $1',
      [req.params.id]
    )

    await client.query('COMMIT')
    res.json({ message: 'Transaction deleted.', id: req.params.id })
  } catch (err) {
    await client.query('ROLLBACK')
    next(err)
  } finally {
    client.release()
  }
}

module.exports = { getTransactions, createTransaction, deleteTransaction }
