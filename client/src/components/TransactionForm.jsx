import React, { useState } from 'react'
import './TransactionForm.css'

export default function TransactionForm({ onSubmit, maxWithdraw }) {
  const [type,   setType]   = useState('deposit')
  const [amount, setAmount] = useState('')
  const [note,   setNote]   = useState('')
  const [error,  setError]  = useState('')

  const handleSubmit = e => {
    e.preventDefault()
    setError('')
    const num = parseFloat(amount)
    if (!num || num <= 0) { setError('Enter a valid amount.'); return }
    if (type === 'withdrawal' && num > maxWithdraw) {
      setError(`Cannot withdraw more than ${maxWithdraw.toLocaleString('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 })}.`)
      return
    }
    onSubmit({ type, amount: num, note: note.trim() })
    setAmount('')
    setNote('')
  }

  return (
    <form className="tx-form glass" onSubmit={handleSubmit}>
      <h4 className="tx-form-title">Add Transaction</h4>

      <div className="type-toggle">
        <button
          type="button"
          className={`toggle-btn deposit ${type === 'deposit' ? 'active' : ''}`}
          onClick={() => setType('deposit')}
        >
          ↑ Deposit
        </button>
        <button
          type="button"
          className={`toggle-btn withdrawal ${type === 'withdrawal' ? 'active' : ''}`}
          onClick={() => setType('withdrawal')}
        >
          ↓ Withdraw
        </button>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="tx-amount">Amount (₦)</label>
          <input
            id="tx-amount"
            type="number"
            min="1"
            step="any"
            placeholder="0"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            className="form-input"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="tx-note">Note (optional)</label>
          <input
            id="tx-note"
            type="text"
            placeholder="e.g. Monthly salary"
            value={note}
            onChange={e => setNote(e.target.value)}
            className="form-input"
            maxLength={80}
          />
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <button type="submit" className={`btn-submit ${type}`}>
        {type === 'deposit' ? '+ Add Deposit' : '- Record Withdrawal'}
      </button>
    </form>
  )
}
