import React from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useGoals } from '../context/GoalsContext'
import SummaryStats from '../components/SummaryStats'
import GoalCard from '../components/GoalCard'
import './DashboardPage.css'

export default function DashboardPage() {
  const { user }                              = useAuth()
  const { goals, getCurrentAmount, loading, error } = useGoals()

  const firstName = user?.name?.split(' ')[0] || 'there'

  return (
    <div className="dashboard">
      <div className="page-inner">
        {/* Header */}
        <div className="dash-header">
          <div>
            <h1 className="dash-greeting">Hey, {firstName} 👋</h1>
            <p className="dash-sub">Here's your savings overview</p>
          </div>
          <Link to="/goals/new" className="btn-new-goal">+ New Goal</Link>
        </div>

        {error && <p className="api-error">{error}</p>}

        {loading ? (
          <div className="dash-loading">
            <span className="spinner" />
          </div>
        ) : (
          <>
            <SummaryStats goals={goals} getCurrentAmount={getCurrentAmount} />

            <div className="dash-section">
              <h2 className="section-title">Your Goals</h2>
              {goals.length === 0 ? (
                <div className="empty-state glass">
                  <span className="empty-icon">🎯</span>
                  <h3>No goals yet</h3>
                  <p>Create your first savings goal and start tracking your progress.</p>
                  <Link to="/goals/new" className="btn-new-goal">+ Create a Goal</Link>
                </div>
              ) : (
                <div className="goals-grid">
                  {goals.map(goal => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      currentAmount={getCurrentAmount(goal.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
