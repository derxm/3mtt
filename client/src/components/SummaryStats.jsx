import React from 'react'
import { formatCurrency } from '../utils/helpers'
import './SummaryStats.css'

export default function SummaryStats({ goals, getCurrentAmount }) {
  const totalSaved     = goals.reduce((s, g) => s + getCurrentAmount(g.id), 0)
  const totalTarget    = goals.reduce((s, g) => s + g.targetAmount, 0)
  const completed      = goals.filter(g => getCurrentAmount(g.id) >= g.targetAmount).length
  const overallPercent = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0

  const stats = [
    { label: 'Total Saved',    value: formatCurrency(totalSaved),    sub: `of ${formatCurrency(totalTarget)}`, color: 'var(--accent-green)' },
    { label: 'Active Goals',   value: goals.length,                  sub: `${completed} completed`,           color: 'var(--accent-blue)' },
    { label: 'Overall Progress', value: `${overallPercent}%`,        sub: 'across all goals',                 color: 'var(--accent-purple)' },
    { label: 'Remaining',      value: formatCurrency(Math.max(0, totalTarget - totalSaved)), sub: 'to reach all goals', color: 'var(--accent-orange)' },
  ]

  return (
    <div className="stats-grid">
      {stats.map(s => (
        <div key={s.label} className="stat-card glass">
          <span className="stat-label">{s.label}</span>
          <span className="stat-value" style={{ color: s.color }}>{s.value}</span>
          <span className="stat-sub">{s.sub}</span>
        </div>
      ))}
    </div>
  )
}
