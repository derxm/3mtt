import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import api from '../api/axiosInstance'
import { useAuth } from './AuthContext'

const GoalsContext = createContext(null)

export function GoalsProvider({ children }) {
  const { user }                        = useAuth()
  const [goals,        setGoals]        = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  // ── Fetch all goals (with computed_amount from server) ──────────────────────
  const fetchGoals = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const { data } = await api.get('/goals')
      setGoals(data.goals)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load goals.')
    } finally {
      setLoading(false)
    }
  }, [user])

  // ── Fetch all transactions (optionally filtered by goalId) ──────────────────
  const fetchTransactions = useCallback(async (goalId = null) => {
    if (!user) return
    try {
      const url = goalId ? `/transactions?goalId=${goalId}` : '/transactions'
      const { data } = await api.get(url)
      if (goalId) {
        // Merge — replace only the transactions for this goal
        setTransactions(prev => [
          ...prev.filter(t => t.goal_id !== goalId),
          ...data.transactions,
        ])
      } else {
        setTransactions(data.transactions)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load transactions.')
    }
  }, [user])

  // Load everything when the user session is established
  useEffect(() => {
    if (user) {
      fetchGoals()
      fetchTransactions()
    } else {
      setGoals([])
      setTransactions([])
    }
  }, [user, fetchGoals, fetchTransactions])

  // ── Goals CRUD ──────────────────────────────────────────────────────────────
  const addGoal = async (data) => {
    try {
      const res = await api.post('/goals', {
        title:         data.title,
        target_amount: data.targetAmount,
        category:      data.category,
        deadline:      data.deadline || null,
      })
      const goal = res.data.goal
      setGoals(prev => [goal, ...prev])
      return goal
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create goal.')
    }
  }

  const updateGoal = async (id, data) => {
    try {
      const res = await api.put(`/goals/${id}`, {
        title:         data.title,
        target_amount: data.targetAmount,
        category:      data.category,
        deadline:      data.deadline || null,
      })
      const updated = res.data.goal
      setGoals(prev => prev.map(g => g.id === id ? updated : g))
      return updated
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update goal.')
    }
  }

  const deleteGoal = async (id) => {
    try {
      await api.delete(`/goals/${id}`)
      setGoals(prev => prev.filter(g => g.id !== id))
      setTransactions(prev => prev.filter(t => t.goal_id !== id))
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete goal.')
    }
  }

  // ── Transactions ────────────────────────────────────────────────────────────
  const addTransaction = async ({ goalId, type, amount, note }) => {
    try {
      const res = await api.post('/transactions', {
        goal_id: goalId,
        type,
        amount,
        note: note || null,
      })
      const tx = res.data.transaction
      setTransactions(prev => [tx, ...prev])
      // Update current_amount on the matching goal locally
      setGoals(prev => prev.map(g => {
        if (g.id !== goalId) return g
        const delta = type === 'deposit' ? amount : -amount
        return {
          ...g,
          current_amount: Math.max(0, parseFloat(g.current_amount) + delta),
          computed_amount: Math.max(0, parseFloat(g.computed_amount || g.current_amount) + delta),
        }
      }))
      return tx
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to add transaction.')
    }
  }

  const deleteTransaction = async (id) => {
    try {
      // Find tx before deleting so we can reverse the local goal amount
      const tx = transactions.find(t => t.id === id)
      await api.delete(`/transactions/${id}`)
      setTransactions(prev => prev.filter(t => t.id !== id))
      if (tx) {
        const delta = tx.type === 'deposit' ? -tx.amount : tx.amount
        setGoals(prev => prev.map(g => {
          if (g.id !== tx.goal_id) return g
          return {
            ...g,
            current_amount: Math.max(0, parseFloat(g.current_amount) + delta),
            computed_amount: Math.max(0, parseFloat(g.computed_amount || g.current_amount) + delta),
          }
        }))
      }
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to delete transaction.')
    }
  }

  // ── Helpers (same interface the UI components already use) ──────────────────
  const getCurrentAmount = (goalId) => {
    const goal = goals.find(g => g.id === goalId)
    if (!goal) return 0
    // Prefer computed_amount (JOIN result from server), fall back to current_amount
    return parseFloat(goal.computed_amount ?? goal.current_amount ?? 0)
  }

  const getGoalTransactions = (goalId) =>
    [...transactions.filter(t => t.goal_id === goalId)]
      .sort((a, b) => new Date(b.date) - new Date(a.date))

  return (
    <GoalsContext.Provider value={{
      goals,
      transactions,
      loading,
      error,
      fetchGoals,
      fetchTransactions,
      getCurrentAmount,
      addGoal,
      updateGoal,
      deleteGoal,
      addTransaction,
      deleteTransaction,
      getGoalTransactions,
    }}>
      {children}
    </GoalsContext.Provider>
  )
}

export function useGoals() {
  const ctx = useContext(GoalsContext)
  if (!ctx) throw new Error('useGoals must be inside GoalsProvider')
  return ctx
}
