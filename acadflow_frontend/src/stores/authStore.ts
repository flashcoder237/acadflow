// ========================================
// FICHIER: src/stores/authStore.ts - Store Zustand pour l'authentification corrigé
// ========================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, LoginRequest, AuthState } from '@/types';
import { apiClient } from '@/lib/api';

interface AuthStore extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
  error: string | null;
  // Nouveaux états pour le debug
  lastAuthCheck: string | null;
  authSource: 'cache' | 'api' | 'none';
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      // État initial
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      lastAuthCheck: null,
      authSource: 'none',

      // Actions
      login: async (credentials: LoginRequest) => {
        console.log('🔐 Tentative de connexion...');
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.login(credentials);
          
          // Stocker le token dans localStorage
          localStorage.setItem('acadflow_token', response.token);
          localStorage.setItem('acadflow_user', JSON.stringify(response.user));
          
          console.log('✅ Connexion réussie:', response.user.username);
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastAuthCheck: new Date().toISOString(),
            authSource: 'api'
          });
        } catch (error: any) {
          console.error('❌ Erreur de connexion:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Erreur de connexion',
            authSource: 'none'
          });
          throw error;
        }
      },

      logout: async () => {
        console.log('🚪 Déconnexion...');
        set({ isLoading: true });
        
        try {
          await apiClient.logout();
          console.log('✅ Déconnexion côté serveur réussie');
        } catch (error) {
          // Continuer même si la déconnexion côté serveur échoue
          console.warn('⚠️ Erreur lors de la déconnexion côté serveur:', error);
        }
        
        // Nettoyer le stockage local
        localStorage.removeItem('acadflow_token');
        localStorage.removeItem('acadflow_user');
        
        console.log('🧹 Cache local nettoyé');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          lastAuthCheck: new Date().toISOString(),
          authSource: 'none'
        });
      },

      checkAuth: async () => {
        console.log('🔍 Vérification de l\'authentification...');
        
        const token = localStorage.getItem('acadflow_token');
        const userStr = localStorage.getItem('acadflow_user');
        
        // Si pas de token, déconnecter silencieusement
        if (!token || !userStr) {
          console.log('❌ Aucun token ou utilisateur en cache');
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastAuthCheck: new Date().toISOString(),
            authSource: 'none'
          });
          return;
        }

        try {
          const cachedUser = JSON.parse(userStr);
          console.log('📦 Utilisateur trouvé en cache:', cachedUser.username);
          
          // IMPORTANT : Restaurer immédiatement l'état depuis le cache
          // Cela évite le problème de redirection au rafraîchissement
          set({
            user: cachedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null,
            lastAuthCheck: new Date().toISOString(),
            authSource: 'cache'
          });

          console.log('✅ État restauré depuis le cache');

          // Vérification en arrière-plan SANS bloquer l'interface
          // Utiliser setTimeout pour éviter de bloquer le rendu initial
          setTimeout(async () => {
            try {
              console.log('🔄 Vérification du token en arrière-plan...');
              const freshUser = await apiClient.getCurrentUser();
              
              // Mettre à jour seulement si différent du cache
              const currentState = get();
              if (JSON.stringify(freshUser) !== JSON.stringify(currentState.user)) {
                console.log('🔄 Mise à jour utilisateur depuis l\'API');
                localStorage.setItem('acadflow_user', JSON.stringify(freshUser));
                set({ 
                  user: freshUser,
                  authSource: 'api',
                  lastAuthCheck: new Date().toISOString()
                });
              } else {
                console.log('✅ Utilisateur en cache à jour');
                set({ 
                  authSource: 'api',
                  lastAuthCheck: new Date().toISOString()
                });
              }
            } catch (apiError: any) {
              console.warn('⚠️ Erreur vérification API:', apiError);
              
              // Token invalide - déconnecter SEULEMENT si erreur 401
              if (apiError.status === 401) {
                console.warn('🔑 Token invalide, déconnexion automatique');
                localStorage.removeItem('acadflow_token');
                localStorage.removeItem('acadflow_user');
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                  error: null,
                  lastAuthCheck: new Date().toISOString(),
                  authSource: 'none'
                });
                
                // Rediriger vers login si on n'y est pas déjà
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }
              // Ignorer les autres erreurs (réseau, timeout, etc.)
              // L'utilisateur reste connecté avec les données du cache
            }
          }, 100); // Délai court pour permettre le rendu initial
            
        } catch (parseError: any) {
          // Erreur de parsing - nettoyer le cache corrompu
          console.error('💥 Cache utilisateur corrompu:', parseError);
          localStorage.removeItem('acadflow_token');
          localStorage.removeItem('acadflow_user');
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            lastAuthCheck: new Date().toISOString(),
            authSource: 'none'
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          localStorage.setItem('acadflow_user', JSON.stringify(updatedUser));
          set({ 
            user: updatedUser,
            lastAuthCheck: new Date().toISOString()
          });
          console.log('👤 Utilisateur mis à jour');
        }
      },

      clearError: () => {
        set({ error: null });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      }
    }),
    {
      name: 'acadflow-auth',
      // Persister plus d'informations pour une meilleure restauration
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        token: state.token,
        user: state.user,
        lastAuthCheck: state.lastAuthCheck
      }),
      skipHydration: false,
      
      // Gestion de l'hydratation pour corriger les incohérences
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error('💥 Erreur hydratation Zustand:', error);
          return undefined;
        }
        
        if (state) {
          console.log('💧 Hydratation Zustand...');
          
          // Vérifier la cohérence avec localStorage direct
          const token = localStorage.getItem('acadflow_token');
          const userStr = localStorage.getItem('acadflow_user');
          
          if (token && userStr && !state.isAuthenticated) {
            console.log('🔧 Correction incohérence auth après hydratation');
            try {
              const user = JSON.parse(userStr);
              return {
                ...state,
                user,
                token,
                isAuthenticated: true,
                isLoading: false,
                authSource: 'cache' as const,
                lastAuthCheck: new Date().toISOString()
              };
            } catch (e) {
              console.error('💥 Erreur parsing user lors hydratation:', e);
              // Nettoyer en cas d'erreur
              localStorage.removeItem('acadflow_token');
              localStorage.removeItem('acadflow_user');
              return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                authSource: 'none' as const
              };
            }
          } else if (!token && state.isAuthenticated) {
            console.log('🔧 Correction incohérence token après hydratation');
            return {
              ...state,
              user: null,
              token: null,
              isAuthenticated: false,
              authSource: 'none' as const
            };
          }
          
          console.log('✅ État cohérent après hydratation');
        }
        
        return state;
      }
    }
  )
);

// Sélecteurs pour faciliter l'utilisation
export const useAuth = () => useAuthStore();
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useAuthLoading = () => useAuthStore((state) => state.isLoading);
export const useAuthError = () => useAuthStore((state) => state.error);

// Hook pour vérifier les permissions
export const useHasRole = (roles: string | string[]) => {
  const user = useUser();
  
  if (!user) return false;
  
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  return requiredRoles.includes(user.type_utilisateur);
};

// Hook pour vérifier si c'est un enseignant
export const useIsEnseignant = () => {
  const user = useUser();
  return user?.type_utilisateur === 'enseignant';
};

// Hook pour vérifier si c'est un étudiant
export const useIsEtudiant = () => {
  const user = useUser();
  return user?.type_utilisateur === 'etudiant';
};

// Hook pour vérifier si c'est un admin/scolarité
export const useIsAdmin = () => {
  const user = useUser();
  return user?.type_utilisateur && ['admin', 'scolarite', 'direction'].includes(user.type_utilisateur);
};

// Hook pour debug de l'état d'authentification
export const useAuthDebug = () => {
  return useAuthStore((state) => ({
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    user: state.user?.username,
    authSource: state.authSource,
    lastAuthCheck: state.lastAuthCheck,
    hasToken: !!localStorage.getItem('acadflow_token'),
    hasUser: !!localStorage.getItem('acadflow_user')
  }));
};

export default useAuthStore;