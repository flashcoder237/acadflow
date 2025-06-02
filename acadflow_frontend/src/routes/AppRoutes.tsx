// src/routes/AppRoutes.tsx - Routing complet mis à jour
import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { AppLayout } from '@/components/layout/AppLayout'

// Pages principales
import { LoginPage } from '@/pages/LoginPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { UnauthorizedPage } from '@/pages/UnauthorizedPage'

// Pages gestion de base
import { ClassesPage } from '@/pages/ClassesPage'
import { EtudiantsPage } from '@/pages/EtudiantsPage'
import { EvaluationsPage } from '@/pages/EvaluationsPage'
import { NotesPage } from '@/pages/NotesPage'
import { StatistiquesPage } from '@/pages/StatistiquesPage'

// Nouvelles pages avancées
import { DomainesPage } from '@/pages/DomainesPage'
import { FilieresPage } from '@/pages/FilieresPage'
import { ParcoursPage } from '@/pages/ParcoursPage'
import { ExportsPage } from '@/pages/ExportsPage'
import { ConfigurationPage } from '@/pages/ConfigurationPage'
import { MultiniveauPage } from '@/pages/MultiniveauPage'

// Pages détaillées
import { EnseignementsPage } from '@/pages/EnseignementsPage'
import { UEsPage } from '@/pages/UEsPage'
import { ECsPage } from '@/pages/ECsPage'
import { SessionsPage } from '@/pages/SessionsPage'
import { AnneeAcademiquePage } from '@/pages/AnneeAcademiquePage'
import { UtilisateursPage } from '@/pages/UtilisateursPage'
import { RapportsPage } from '@/pages/RapportsPage'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Route publique */}
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
        
        {/* Gestion institutionnelle */}
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
        
        {/* Gestion académique */}
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
        <Route path="enseignements" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
            <EnseignementsPage />
          </ProtectedRoute>
        } />
        
        {/* Gestion pédagogique */}
        <Route path="ues" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
            <UEsPage />
          </ProtectedRoute>
        } />
        <Route path="ecs" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
            <ECsPage />
          </ProtectedRoute>
        } />
        <Route path="evaluations" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction', 'enseignant']}>
            <EvaluationsPage />
          </ProtectedRoute>
        } />
        
        {/* Gestion des notes */}
        <Route path="notes" element={<NotesPage />} />
        
        {/* Parcours personnalisés */}
        <Route path="parcours" element={
          <ProtectedRoute requiredRole={['etudiant']}>
            <ParcoursPage />
          </ProtectedRoute>
        } />
        
        {/* Exports et rapports */}
        <Route path="exports" element={<ExportsPage />} />
        <Route path="rapports" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction']}>
            <RapportsPage />
          </ProtectedRoute>
        } />
        
        {/* Statistiques */}
        <Route path="statistiques" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction']}>
            <StatistiquesPage />
          </ProtectedRoute>
        } />
        
        {/* Configuration et administration */}
        <Route path="sessions" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite']}>
            <SessionsPage />
          </ProtectedRoute>
        } />
        <Route path="annee-academique" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite']}>
            <AnneeAcademiquePage />
          </ProtectedRoute>
        } />
        <Route path="utilisateurs" element={
          <ProtectedRoute requiredRole={['admin', 'scolarite']}>
            <UtilisateursPage />
          </ProtectedRoute>
        } />
        <Route path="configuration" element={
          <ProtectedRoute requiredRole={['admin']}>
            <ConfigurationPage />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Route de fallback */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}