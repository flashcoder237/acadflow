// src/App.tsx
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from '@/components/ui/notification-system'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'
import { LoginPage } from '@/pages/LoginPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ClassesPage } from '@/pages/ClassesPage'
import { EtudiantsPage } from '@/pages/EtudiantsPage'
import { EvaluationsPage } from '@/pages/EvaluationsPage'
import { NotesPage } from '@/pages/NotesPage'
import { StatistiquesPage } from '@/pages/StatistiquesPage'
import './App.css'

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Route publique */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Routes protégées */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              <Route path="classes" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
                  <ClassesPage />
                </ProtectedRoute>
              } />
              
              <Route path="etudiants" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
                  <EtudiantsPage />
                </ProtectedRoute>
              } />
              
              <Route path="evaluations" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
                  <EvaluationsPage />
                </ProtectedRoute>
              } />
              
              <Route path="notes" element={<NotesPage />} />
              
              <Route path="statistiques" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction']}>
                  <StatistiquesPage />
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Route par défaut */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  )
}

export default App