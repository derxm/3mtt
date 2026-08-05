import React, { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useGoals } from '../context/GoalsContext'
import ProgressBar from '../components/ProgressBar'
import TransactionForm from '../components/TransactionForm'
import TransactionList from '../components/TransactionList'
import { formatCurrency, formatDate, daysLeft, categoryColor } from '../utils/helpers'
import './GoalDetailPage.css'

export default function GoalDetailPage() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { goals, getCurrentAmount, getGoalTransactions, addTransaction, deleteTransaction, deleteGoal } = useGoals()
  const [confirmDel, setConfirmDel] = useState(false)

  const goal = goals.find(g => g.id === id)
  if (!goal) return (
    <div className="page-inner" style={{ padding: '48px 24px', textAlign: 'center' }}>
      <p style={{ color: 'var(--text-tertiary)' }}>Goal not found.</p>
      <Link to="/dashboard" className="btn-back" style={{ marginTop: 16, display: 'inline-block' }}>← Back</Link>
    </div>
  )

  const current   = getCurrentAmount(id)
  const percent   = goal.targetAmount > 0 ? (current / goal.targetAmount) * 100 : 0
  const remaining = Math.max(0, goal.targetAmount - current)
  const days      = daysLeft(goal.deadline)
  const color     = categoryColor(goal.category)
  const txs       = getGoalTransactions(id)
  const done      = percent >= 100

  const handleAddTx = async data => {
    try {
      await addTransaction({ ...data, goalId: id })
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteGoal(id)
      navigate('/dashboard')
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="goal-detail">
      <div className="page-inner">
        {/* Back */}
        <Link to="/dashboard" className="btn-back">← Dashboard</Link>

        {/* Hero card */}
        <div className="detail-hero glass">
          <div className="hero-header">
            <div>
              <div className="category-badge" style={{ background: color.dim, color: color.accent }}>
                {goal.category}
              </div>
              <h1 className="hero-title">{goal.title}</h1>
              <p className="hero-created">Created {formatDate(goal.createdAt)}</p>
            </div>
            <div className="hero-actions">
              <Link to={`/goals/${id}/edit`} className="btn-edit">Edit</Link>
              <button className="btn-delete-goal" onClick={() => setConfirmDel(true)}>Delete</button>
            </div>
          </div>

          <div className="hero-amounts">
            <div className="hero-current">
              <span className="label">Saved</span>
              <span className="big-value" style={{ color: color.accent }}>{formatCurrency(current)}</span>
            </div>
            <div className="hero-target">
              <span className="label">Target</span>
              <span className="big-value">{formatCurrency(goal.targetAmount)}</span>
            </div>
            {!done && (
              <div className="hero-remaining">
                <span className="label">Remaining</span>
                <span className="big-value">{formatCurrency(remaining)}</span>
              </div>
            )}
          </div>

          <div className="hero-progress">
            <div className="progress-label">
              <span style={{ color: color.accent }}>{Math.min(100, Math.round(percent))}% complete</span>
              {done && <span className="done-badge">✓ Goal Reached!</span>}
            </div>
            <ProgressBar percent={percent} color={color.accent} />
          </div>

          {goal.deadline && (
            <div className={`deadline-chip ${days !== null && days < 30 ? 'urgent' : ''}`}>
              📅 {days !== null && days > 0 ? `${days} days until deadline` : 'Deadline passed'} — {formatDate(goal.deadline)}
            </div>
          )}
        </div>

        {/* Body: Form + Transactions */}
        <div className="detail-body">
          <TransactionForm onSubmit={handleAddTx} maxWithdraw={current} />

          <div className="tx-section">
            <h3 className="section-title">Transaction History ({txs.length})</h3>
            <TransactionList transactions={txs} onDelete={deleteTransaction} />
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(false)}>
          <div className="modal-card glass-strong" onClick={e => e.stopPropagation()}>
            <h3>Delete "{goal.title}"?</h3>
            <p>This will permanently remove the goal and all its transactions.</p>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setConfirmDel(false)}>Cancel</button>
              <button className="btn-confirm-delete" onClick={handleDelete}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
