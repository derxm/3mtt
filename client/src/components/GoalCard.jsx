import React from 'react'
import { useNavigate } from 'react-router-dom'
import ProgressBar from './ProgressBar'
import { formatCurrency, formatDate, daysLeft, categoryColor } from '../utils/helpers'
import './GoalCard.css'

export default function GoalCard({ goal, currentAmount }) {
  const navigate = useNavigate()
  const percent   = goal.targetAmount > 0 ? (currentAmount / goal.targetAmount) * 100 : 0
  const remaining = goal.targetAmount - currentAmount
  const days      = daysLeft(goal.deadline)
  const color     = categoryColor(goal.category)
  const done      = percent >= 100

  return (
    <div className="goal-card glass" onClick={() => navigate(`/goals/${goal.id}`)}>
      <div className="goal-card-header">
        <div className="category-badge" style={{ background: color.dim, color: color.accent }}>
          {goal.category}
        </div>
        {done && <div className="completed-badge">✓ Complete</div>}
      </div>

      <h3 className="goal-title">{goal.title}</h3>

      <div className="goal-amounts">
        <span className="current-amount">{formatCurrency(currentAmount)}</span>
        <span className="target-amount">of {formatCurrency(goal.targetAmount)}</span>
      </div>

      <ProgressBar percent={percent} color={color.accent} />

      <div className="goal-card-footer">
        <span className="goal-percent" style={{ color: color.accent }}>
          {Math.min(100, Math.round(percent))}%
        </span>
        {!done && (
          <span className="goal-remaining">
            {formatCurrency(remaining)} left
          </span>
        )}
        {goal.deadline && (
          <span className={`goal-deadline ${days < 30 ? 'urgent' : ''}`}>
            {days > 0 ? `${days}d left` : 'Overdue'}
          </span>
        )}
      </div>
    </div>
  )
}
