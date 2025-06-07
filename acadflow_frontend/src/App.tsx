// ========================================
// FICHIER: src/App.tsx - Application principale corrigée
// ========================================

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

// Pages
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import EnseignementsPage from '@/pages/EnseignementsPage';
import EvaluationsPage from '@/pages/EvaluationsPage';
import CreateEvaluationPage from '@/pages/CreateEvaluationPage';
import NotesPage from '@/pages/NotesPage';
import ProfilePage from '@/pages/ProfilePage';
import StatistiquesPage from '@/pages/StatistiquesPage';

// Layout
import DashboardLayout from '@/components/layout/DashboardLayout';

// Composants
import { Loading } from '@/components/ui/loading';
import NotificationSystem from '@/components/NotificationSystem';
import ProtectedRoute from '@/components/ProtectedRoute';

// Pages de détails (à créer plus tard ou simplifiées)
const EnseignementDetailPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Détails de l'enseignement</h1>
      <p className="text-gray-600">Cette page sera développée prochainement.</p>
    </div>
  );
};

const EvaluationDetailPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Détails de l'évaluation</h1>
      <p className="text-gray-600">Cette page sera développée prochainement.</p>
    </div>
  );
};

// Configuration React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App: React.FC = () => {
  const { checkAuth, isLoading, isAuthenticated } = useAuthStore();
  const { loadInitialData } = useAppStore();
  const [appInitialized, setAppInitialized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        // Vérifier l'authentification d'abord
        await checkAuth();
        
        if (isMounted) {
          // Charger les données initiales seulement si nécessaire
          await loadInitialData();
          setAppInitialized(true);
        }
      } catch (error) {
        console.error('Erreur lors de l\'initialisation:', error);
        if (isMounted) {
          setAppInitialized(true); // Permettre le rendu même en cas d'erreur
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []); // Dépendances vides pour éviter les boucles

  // Afficher le loading pendant l'initialisation
  if (!appInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" text="Initialisation de l'application..." />
          <p className="mt-4 text-sm text-gray-600">AcadFlow</p>
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Route publique */}
            <Route 
              path="/login" 
              element={
                isAuthenticated ? <Navigate to="/dashboard" replace /> : <LoginPage />
              } 
            />
            
            {/* Routes protégées */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requiredRole={['enseignant', 'admin', 'scolarite', 'direction']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<DashboardPage />} />
              <Route path="enseignements" element={<EnseignementsPage />} />
              <Route path="enseignements/:id" element={<EnseignementDetailPage />} />
              <Route path="evaluations" element={<EvaluationsPage />} />
              <Route path="evaluations/create" element={<CreateEvaluationPage />} />
              <Route path="evaluations/:id" element={<EvaluationDetailPage />} />
              <Route path="evaluations/:id/notes" element={<NotesPage />} />
              <Route path="notes" element={<NotesPage />} />
              <Route path="statistiques" element={<StatistiquesPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Route par défaut - rediriger selon l'état d'authentification */}
            <Route 
              path="*" 
              element={
                isAuthenticated ? 
                  <Navigate to="/dashboard" replace /> : 
                  <Navigate to="/login" replace />
              } 
            />
          </Routes>

          {/* Système de notifications global */}
          <NotificationSystem />
        </div>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;