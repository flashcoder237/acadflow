// ========================================
// FICHIER: src/App.tsx - Application avec authentification corrigée
// ========================================

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';

// Pages principales
import LoginPage from '@/pages/LoginPage';
import DashboardPage from '@/pages/DashboardPage';
import TeacherDashboard from '@/pages/TeacherDashboard';
import TeacherStudentsPage from '@/pages/TeacherStudentsPage';
import TeacherValidationPage from '@/pages/TeacherValidationPage';

// Pages existantes
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

// Pages de détails et nouvelles fonctionnalités
const EnseignementDetailPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Détails de l'enseignement</h1>
      <p className="text-gray-600">Cette page affichera les détails complets d'un enseignement.</p>
    </div>
  );
};

const EvaluationDetailPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Détails de l'évaluation</h1>
      <p className="text-gray-600">Cette page affichera les détails complets d'une évaluation.</p>
    </div>
  );
};

const TeacherReportsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Mes rapports</h1>
      <p className="text-gray-600">
        Génération et consultation de rapports sur vos enseignements et évaluations.
      </p>
    </div>
  );
};

const TeacherHistoryPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Historique des modifications</h1>
      <p className="text-gray-600">
        Consultez l'historique de toutes vos modifications de notes.
      </p>
    </div>
  );
};

const TeacherSettingsPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Paramètres enseignant</h1>
      <p className="text-gray-600">
        Configurez vos préférences d'enseignement et notifications.
      </p>
    </div>
  );
};

const HelpPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Aide & Support</h1>
      <p className="text-gray-600">
        Documentation, tutoriels et support technique.
      </p>
    </div>
  );
};

// Pages d'administration (à créer plus tard)
const AdminDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Administration</h1>
      <p className="text-gray-600">Tableau de bord administrateur</p>
    </div>
  );
};

const AdminUsersPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Gestion des utilisateurs</h1>
      <p className="text-gray-600">Gestion des comptes utilisateurs</p>
    </div>
  );
};

const AdminClassesPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Gestion des classes</h1>
      <p className="text-gray-600">Gestion des classes et inscriptions</p>
    </div>
  );
};

// Pages étudiants (à créer plus tard)
const StudentDashboard: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Espace étudiant</h1>
      <p className="text-gray-600">Tableau de bord étudiant</p>
    </div>
  );
};

const StudentNotesPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Mes notes</h1>
      <p className="text-gray-600">Consultation de vos notes et moyennes</p>
    </div>
  );
};

const StudentPlanningPage: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Mon planning</h1>
      <p className="text-gray-600">Planning des cours et évaluations</p>
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
  const { checkAuth, isLoading, isAuthenticated, user } = useAuthStore();
  const { loadInitialData } = useAppStore();
  const [appInitialized, setAppInitialized] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        console.log('🚀 Initialisation de l\'application...');
        
        // Vérifier l'authentification d'abord
        await checkAuth();
        
        if (isMounted) {
          console.log('✅ Authentification vérifiée');
          setAuthChecked(true);
          
          // Charger les données initiales seulement si on a un token
          const hasToken = localStorage.getItem('acadflow_token');
          if (hasToken) {
            console.log('📊 Chargement des données initiales...');
            try {
              await loadInitialData();
              console.log('✅ Données initiales chargées');
            } catch (dataError) {
              console.warn('⚠️ Erreur chargement données (non bloquant):', dataError);
            }
          }
          
          setAppInitialized(true);
          console.log('✅ Application initialisée');
        }
      } catch (error) {
        console.error('❌ Erreur lors de l\'initialisation:', error);
        if (isMounted) {
          setAuthChecked(true);
          setAppInitialized(true); // Permettre le rendu même en cas d'erreur
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, [checkAuth, loadInitialData]);

  // Debug state pour diagnostiquer les problèmes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('=== DEBUG AUTH STATE ===');
      console.log('isAuthenticated:', isAuthenticated);
      console.log('isLoading:', isLoading);
      console.log('user:', user);
      console.log('localStorage token:', !!localStorage.getItem('acadflow_token'));
      console.log('localStorage user:', !!localStorage.getItem('acadflow_user'));
      console.log('authChecked:', authChecked);
      console.log('appInitialized:', appInitialized);
      console.log('========================');
    }
  }, [isAuthenticated, isLoading, user, authChecked, appInitialized]);

  // Attendre que l'authentification soit vérifiée ET que l'app soit initialisée
  if (!authChecked || isLoading || !appInitialized) {
    const loadingText = !authChecked 
      ? "Vérification de l'authentification..." 
      : !appInitialized 
        ? "Initialisation de l'application..."
        : "Chargement...";

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" text={loadingText} />
          <p className="mt-4 text-sm text-gray-600">AcadFlow</p>
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-400">
              <p>Auth: {authChecked ? '✅' : '⏳'} | App: {appInitialized ? '✅' : '⏳'}</p>
            </div>
          )}
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
            
            {/* Routes protégées pour ENSEIGNANTS */}
            <Route 
              path="/" 
              element={
                <ProtectedRoute requiredRole={['enseignant']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Dashboard principal selon le rôle */}
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={
                user?.type_utilisateur === 'enseignant' ? <TeacherDashboard /> : <DashboardPage />
              } />
              
              {/* Routes spécifiques aux enseignants */}
              <Route path="enseignements" element={<EnseignementsPage />} />
              <Route path="enseignements/:id" element={<EnseignementDetailPage />} />
              
              <Route path="evaluations" element={<EvaluationsPage />} />
              <Route path="evaluations/create" element={<CreateEvaluationPage />} />
              <Route path="evaluations/:id" element={<EvaluationDetailPage />} />
              <Route path="evaluations/:id/notes" element={<NotesPage />} />
              <Route path="evaluations/:id/validation" element={<TeacherValidationPage />} />
              
              <Route path="etudiants" element={<TeacherStudentsPage />} />
              <Route path="statistiques" element={<StatistiquesPage />} />
              <Route path="rapports" element={<TeacherReportsPage />} />
              <Route path="historique" element={<TeacherHistoryPage />} />
              <Route path="teacher-settings" element={<TeacherSettingsPage />} />
              
              {/* Routes communes */}
              <Route path="profile" element={<ProfilePage />} />
              <Route path="help" element={<HelpPage />} />
            </Route>

            {/* Routes protégées pour ADMINISTRATEURS */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute requiredRole={['admin', 'scolarite', 'direction']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboard />} />
              <Route path="users" element={<AdminUsersPage />} />
              <Route path="classes" element={<AdminClassesPage />} />
              <Route path="curriculum" element={<div className="p-6"><h1>Gestion des programmes</h1></div>} />
              <Route path="rapports" element={<div className="p-6"><h1>Rapports administratifs</h1></div>} />
              <Route path="settings" element={<div className="p-6"><h1>Paramètres système</h1></div>} />
            </Route>

            {/* Routes protégées pour ÉTUDIANTS */}
            <Route 
              path="/student" 
              element={
                <ProtectedRoute requiredRole={['etudiant']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<StudentDashboard />} />
              <Route path="notes" element={<StudentNotesPage />} />
              <Route path="planning" element={<StudentPlanningPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>

            {/* Routes mixtes (tous les utilisateurs connectés) */}
            <Route 
              path="/settings" 
              element={
                <ProtectedRoute requiredRole={['enseignant', 'admin', 'scolarite', 'direction', 'etudiant']}>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<div className="p-6"><h1>Paramètres généraux</h1></div>} />
            </Route>

            {/* Route par défaut - rediriger selon le rôle */}
            <Route 
              path="*" 
              element={
                isAuthenticated ? (
                  user?.type_utilisateur === 'enseignant' ? <Navigate to="/dashboard" replace /> :
                  user?.type_utilisateur === 'etudiant' ? <Navigate to="/student" replace /> :
                  ['admin', 'scolarite', 'direction'].includes(user?.type_utilisateur || '') ? <Navigate to="/admin" replace /> :
                  <Navigate to="/dashboard" replace />
                ) : (
                  <Navigate to="/login" replace />
                )
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