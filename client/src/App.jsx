import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { GoalsProvider } from './context/GoalsContext'
import PrivateRoute from './components/PrivateRoute'
import Navbar from './components/Navbar'

import LoginPage      from './pages/LoginPage'
import RegisterPage   from './pages/RegisterPage'
import DashboardPage  from './pages/DashboardPage'
import GoalDetailPage from './pages/GoalDetailPage'
import GoalFormPage   from './pages/GoalFormPage'

export default function App() {
  return (
    <AuthProvider>
      <GoalsProvider>
        {/* Ambient background */}
        <div className="app-bg" aria-hidden="true" />

        <Navbar />

        <Routes>
          {/* Public */}
          <Route path="/login"    element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Protected */}
          <Route path="/dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
          <Route path="/goals/new" element={<PrivateRoute><GoalFormPage /></PrivateRoute>} />
          <Route path="/goals/:id" element={<PrivateRoute><GoalDetailPage /></PrivateRoute>} />
          <Route path="/goals/:id/edit" element={<PrivateRoute><GoalFormPage /></PrivateRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </GoalsProvider>
    </AuthProvider>
  )
}
