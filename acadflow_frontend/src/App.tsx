// src/App.tsx - Version complète mise à jour
import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { NotificationProvider } from '@/components/ui/notification-system'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages d'authentification
import { LoginPage } from '@/pages/LoginPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

// Pages principales
import { DashboardPage } from '@/pages/DashboardPage'

// Pages gestion institutionnelle
import { DomainesPage } from '@/pages/DomainesPage'
import { FilieresPage } from '@/pages/FilieresPage'
import { MultiniveauPage } from '@/pages/MultiniveauPage'

// Pages gestion académique de base
import { ClassesPage } from '@/pages/ClassesPage'
import { EtudiantsPage } from '@/pages/EtudiantsPage'
// import { EnseignementsPage } from '@/pages/EnseignementsPage'

// Pages gestion pédagogique
import { UEsPage } from '@/pages/UEsPage'
import { EvaluationsPage } from '@/pages/EvaluationsPage'
import { NotesPage } from '@/pages/NotesPage'

// Pages parcours et exports
import { ParcoursPage } from '@/pages/ParcoursPage'
import { ExportsPage } from '@/pages/ExportsPage'
import { RapportsPage } from '@/pages/RapportsPage'
import { StatistiquesPage } from '@/pages/StatistiquesPage'

// Pages administration
import { ConfigurationPage } from '@/pages/ConfigurationPage'

import './App.css'

function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/unauthorized" element={<UnauthorizedPage />} />
            
            {/* Routes protégées avec layout */}
            <Route path="/" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              {/* Dashboard */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              
              {/* === GESTION INSTITUTIONNELLE === */}
              <Route path="domaines" element={
                <ProtectedRoute requiredRole={['admin', 'direction']}>
                  <DomainesPage />
                </ProtectedRoute>
              } />
              
              <Route path="filieres" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction']}>
                  <FilieresPage />
                </ProtectedRoute>
              } />
              
              <Route path="multiniveau" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction']}>
                  <MultiniveauPage />
                </ProtectedRoute>
              } />
              
              {/* === GESTION ACADÉMIQUE DE BASE === */}
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
              
              {/* <Route path="enseignements" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
                  <EnseignementsPage />
                </ProtectedRoute>
              } /> */}
              
              {/* === GESTION PÉDAGOGIQUE === */}
              <Route path="ues" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
                  <UEsPage />
                </ProtectedRoute>
              } />
              
              <Route path="evaluations" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
                  <EvaluationsPage />
                </ProtectedRoute>
              } />
              
              <Route path="notes" element={<NotesPage />} />
              
              {/* === PARCOURS PERSONNALISÉS === */}
              <Route path="parcours" element={
                <ProtectedRoute requiredRole={['etudiant']}>
                  <ParcoursPage />
                </ProtectedRoute>
              } />
              
              {/* === EXPORTS ET RAPPORTS === */}
              <Route path="exports" element={<ExportsPage />} />
              
              <Route path="rapports" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction']}>
                  <RapportsPage />
                </ProtectedRoute>
              } />
              
              <Route path="statistiques" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction']}>
                  <StatistiquesPage />
                </ProtectedRoute>
              } />
              
              {/* === ADMINISTRATION === */}
              <Route path="configuration" element={
                <ProtectedRoute requiredRole={['admin']}>
                  <ConfigurationPage />
                </ProtectedRoute>
              } />
              
              {/* === ROUTES SUPPLÉMENTAIRES (À IMPLÉMENTER) === */}
              <Route path="sessions" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite']}>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold">Gestion des Sessions</h2>
                    <p className="text-muted-foreground">Page en cours de développement</p>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="annee-academique" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite']}>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold">Année Académique</h2>
                    <p className="text-muted-foreground">Page en cours de développement</p>
                  </div>
                </ProtectedRoute>
              } />
              
              <Route path="utilisateurs" element={
                <ProtectedRoute requiredRole={['admin', 'scolarite']}>
                  <div className="p-6">
                    <h2 className="text-2xl font-bold">Gestion des Utilisateurs</h2>
                    <p className="text-muted-foreground">Page en cours de développement</p>
                  </div>
                </ProtectedRoute>
              } />
            </Route>
            
            {/* Route de fallback */}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </NotificationProvider>
  )
}

export default App

