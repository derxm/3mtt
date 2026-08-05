import React from 'react'
import './ProgressBar.css'

export default function ProgressBar({ percent, color = 'var(--accent-green)' }) {
  const clamped = Math.min(100, Math.max(0, percent))

  return (
    <div className="progress-track">
      <div
        className="progress-fill"
        style={{ width: `${clamped}%`, background: color }}
      />
    </div>
  )
}
