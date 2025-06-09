// ========================================
// FICHIER: src/components/ProtectedRoute.tsx - Route protégée corrigée
// ========================================

import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Loading } from '@/components/ui/loading';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole = [] 
}) => {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const [waitingForAuth, setWaitingForAuth] = useState(false);

  // Vérification supplémentaire avec localStorage pour gérer les incohérences
  const hasToken = localStorage.getItem('acadflow_token');
  const hasUser = localStorage.getItem('acadflow_user');

  useEffect(() => {
    // Si on a des données en localStorage mais pas d'auth Zustand,
    // attendre un peu que l'état se restaure
    if (!isAuthenticated && hasToken && hasUser && !isLoading) {
      console.log('🔄 Attente restauration auth...');
      setWaitingForAuth(true);
      
      // Timeout de sécurité pour éviter d'attendre indéfiniment
      const timeout = setTimeout(() => {
        console.log('⏰ Timeout restauration auth');
        setWaitingForAuth(false);
      }, 2000); // 2 secondes max
      
      // Vérifier périodiquement si l'auth s'est restaurée
      const interval = setInterval(() => {
        if (useAuthStore.getState().isAuthenticated) {
          console.log('✅ Auth restaurée');
          setWaitingForAuth(false);
          clearTimeout(timeout);
          clearInterval(interval);
        }
      }, 100);

      return () => {
        clearTimeout(timeout);
        clearInterval(interval);
      };
    } else {
      setWaitingForAuth(false);
    }
  }, [isAuthenticated, hasToken, hasUser, isLoading]);

  // Debug des états pour diagnostiquer les problèmes
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🛡️ ProtectedRoute debug:', {
        isAuthenticated,
        isLoading,
        hasToken: !!hasToken,
        hasUser: !!hasUser,
        waitingForAuth,
        userType: user?.type_utilisateur,
        requiredRole
      });
    }
  }, [isAuthenticated, isLoading, hasToken, hasUser, waitingForAuth, user?.type_utilisateur, requiredRole]);

  // Affichage de loading si nécessaire
  if (isLoading || waitingForAuth) {
    const loadingText = isLoading 
      ? "Vérification des permissions..." 
      : waitingForAuth 
        ? "Restauration de la session..."
        : "Chargement...";

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" text={loadingText} />
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-2 text-xs text-gray-400">
              <p>Auth: {isAuthenticated ? '✅' : '❌'} | Token: {hasToken ? '✅' : '❌'}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Si pas authentifié et pas de données en localStorage, rediriger vers login
  if (!isAuthenticated && (!hasToken || !hasUser)) {
    console.log('🔒 Redirection vers login - pas d\'authentification');
    return <Navigate to="/login" replace />;
  }

  // Si on a des données localStorage mais toujours pas d'auth après l'attente,
  // il y a probablement un problème - rediriger vers login
  if (!isAuthenticated && hasToken && hasUser && !waitingForAuth) {
    console.log('🔒 Redirection vers login - problème restauration auth');
    // Nettoyer le cache corrompu
    localStorage.removeItem('acadflow_token');
    localStorage.removeItem('acadflow_user');
    return <Navigate to="/login" replace />;
  }

  // Vérifier les rôles si spécifiés et si on a un utilisateur
  if (requiredRole.length > 0 && user) {
    if (!requiredRole.includes(user.type_utilisateur)) {
      console.log('🚫 Accès refusé - rôle insuffisant:', user.type_utilisateur, 'requis:', requiredRole);
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.502 0L4.732 15.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Accès non autorisé
            </h1>
            <p className="text-gray-600 mb-4">
              Vous n'avez pas les permissions nécessaires pour accéder à cette page.
            </p>
            <p className="text-sm text-gray-500">
              Rôle actuel: <span className="font-medium">{user.type_utilisateur}</span>
            </p>
            <p className="text-sm text-gray-500">
              Rôles requis: <span className="font-medium">{requiredRole.join(', ')}</span>
            </p>
            <button 
              onClick={() => window.history.back()}
              className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Retour
            </button>
          </div>
        </div>
      );
    }
  }

  // Si on arrive ici, tout est OK - afficher le contenu protégé
  console.log('✅ Accès autorisé pour:', user?.type_utilisateur);
  return <>{children}</>;
};

export default ProtectedRoute;