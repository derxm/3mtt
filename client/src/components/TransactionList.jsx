import React from 'react'
import { formatCurrency, formatDate } from '../utils/helpers'
import './TransactionList.css'

export default function TransactionList({ transactions, onDelete }) {
  if (!transactions.length) {
    return (
      <div className="tx-empty">
        <span>No transactions yet. Add your first deposit!</span>
      </div>
    )
  }

  return (
    <div className="tx-list">
      {transactions.map(tx => (
        <div key={tx.id} className={`tx-item glass ${tx.type}`}>
          <div className="tx-icon">{tx.type === 'deposit' ? '↑' : '↓'}</div>
          <div className="tx-info">
            <span className="tx-note">{tx.note || '—'}</span>
            <span className="tx-date">{formatDate(tx.date)}</span>
          </div>
          <span className={`tx-amount ${tx.type}`}>
            {tx.type === 'deposit' ? '+' : '-'}{formatCurrency(tx.amount)}
          </span>
          <button className="tx-delete" onClick={() => onDelete(tx.id)} aria-label="Delete transaction">✕</button>
        </div>
      ))}
    </div>
  )
}
