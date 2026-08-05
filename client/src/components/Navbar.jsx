import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  const handleLogout = () => { logout(); navigate('/login') }
  const active = path => pathname === path ? 'active' : ''

  return (
    <nav className="navbar glass">
      <div className="navbar-inner">
        <Link to="/dashboard" className="navbar-brand">
          <span className="brand-icon">💰</span>
          <span className="brand-text">SaveTrack</span>
        </Link>

        {user && (
          <>
            <div className={`navbar-links${open ? ' open' : ''}`}>
              <Link to="/dashboard" className={`nav-link ${active('/dashboard')}`} onClick={() => setOpen(false)}>Dashboard</Link>
              <Link to="/goals/new" className={`nav-link ${active('/goals/new')}`} onClick={() => setOpen(false)}>+ New Goal</Link>
            </div>

            <div className="navbar-right">
              <div className="user-chip glass">
                <div className="user-avatar">{user.name.charAt(0).toUpperCase()}</div>
                <span className="user-name">{user.name}</span>
              </div>
              <button className="btn-logout" onClick={handleLogout}>Logout</button>
            </div>

            <button className="hamburger" onClick={() => setOpen(o => !o)} aria-label="Toggle menu">
              <span /><span /><span />
            </button>
          </>
        )}
      </div>
    </nav>
  )
}
