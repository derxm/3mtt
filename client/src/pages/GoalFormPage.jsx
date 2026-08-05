import React, { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useGoals } from '../context/GoalsContext'
import { CATEGORIES } from '../utils/helpers'
import './GoalFormPage.css'

const EMPTY = { title: '', targetAmount: '', category: 'Other', deadline: '' }

export default function GoalFormPage() {
  const { id }                     = useParams()
  const navigate                   = useNavigate()
  const { goals, addGoal, updateGoal } = useGoals()
  const isEdit = Boolean(id)

  const [form,    setForm]    = useState(EMPTY)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isEdit) {
      const goal = goals.find(g => g.id === id)
      if (goal) {
        setForm({
          title:        goal.title,
          targetAmount: goal.targetAmount,
          category:     goal.category,
          deadline:     goal.deadline || '',
        })
      }
    }
  }, [id, goals, isEdit])

  const onChange = e => setForm(f => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    const amount = parseFloat(form.targetAmount)
    if (!form.title.trim())  { setError('Goal title is required.'); return }
    if (!amount || amount <= 0) { setError('Enter a valid target amount.'); return }

    setLoading(true)
    try {
      const data = { title: form.title.trim(), targetAmount: amount, category: form.category, deadline: form.deadline }
      if (isEdit) {
        await updateGoal(id, data)
        navigate(`/goals/${id}`)
      } else {
        const goal = await addGoal(data)
        navigate(`/goals/${goal.id}`)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="goal-form-page">
      <div className="page-inner">
        <Link to={isEdit ? `/goals/${id}` : '/dashboard'} className="btn-back">
          ← {isEdit ? 'Back to Goal' : 'Dashboard'}
        </Link>

        <div className="form-card glass-strong">
          <div className="form-card-header">
            <h1 className="form-card-title">{isEdit ? '✏️ Edit Goal' : '🎯 New Savings Goal'}</h1>
            <p className="form-card-sub">
              {isEdit ? 'Update your goal details below.' : 'Define a target and start saving towards it.'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="goal-form">
            {/* Title */}
            <div className="form-group">
              <label htmlFor="title">Goal Title *</label>
              <input
                id="title" name="title" type="text"
                placeholder="e.g. Emergency Fund, Trip to Japan…"
                value={form.title} onChange={onChange}
                className="form-input" maxLength={60} required
              />
            </div>

            {/* Amount */}
            <div className="form-group">
              <label htmlFor="targetAmount">Target Amount (₦) *</label>
              <input
                id="targetAmount" name="targetAmount" type="number"
                placeholder="e.g. 500000"
                min="1" step="any"
                value={form.targetAmount} onChange={onChange}
                className="form-input" required
              />
            </div>

            {/* Category */}
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category" name="category"
                value={form.category} onChange={onChange}
                className="form-input form-select"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Deadline */}
            <div className="form-group">
              <label htmlFor="deadline">Deadline (optional)</label>
              <input
                id="deadline" name="deadline" type="date"
                value={form.deadline} onChange={onChange}
                className="form-input"
                min={new Date().toISOString().slice(0, 10)}
              />
            </div>

            {error && <p className="form-error">{error}</p>}

            <div className="form-actions">
              <Link to={isEdit ? `/goals/${id}` : '/dashboard'} className="btn-cancel-link">
                Cancel
              </Link>
              <button type="submit" className="btn-save" disabled={loading}>
                {loading ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Goal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
