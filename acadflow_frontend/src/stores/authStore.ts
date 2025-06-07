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

      // Actions
      login: async (credentials: LoginRequest) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await apiClient.login(credentials);
          
          // Stocker le token dans localStorage
          localStorage.setItem('acadflow_token', response.token);
          localStorage.setItem('acadflow_user', JSON.stringify(response.user));
          
          set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
        } catch (error: any) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: error.message || 'Erreur de connexion'
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        
        try {
          await apiClient.logout();
        } catch (error) {
          // Continuer même si la déconnexion côté serveur échoue
          console.warn('Erreur lors de la déconnexion côté serveur:', error);
        }
        
        // Nettoyer le stockage local
        localStorage.removeItem('acadflow_token');
        localStorage.removeItem('acadflow_user');
        
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        });
      },

      checkAuth: async () => {
        const token = localStorage.getItem('acadflow_token');
        const userStr = localStorage.getItem('acadflow_user');
        
        if (!token || !userStr) {
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          return;
        }

        try {
          const cachedUser = JSON.parse(userStr);
          
          // Restaurer immédiatement depuis le cache
          set({
            user: cachedUser,
            token,
            isAuthenticated: true,
            isLoading: false,
            error: null
          });

          // Vérifier en arrière-plan si le token est toujours valide
          // Mais ne pas bloquer l'interface
          apiClient.getCurrentUser()
            .then((user) => {
              // Mettre à jour avec les données fraîches si différentes
              if (JSON.stringify(user) !== JSON.stringify(cachedUser)) {
                localStorage.setItem('acadflow_user', JSON.stringify(user));
                set({ user });
              }
            })
            .catch((error) => {
              // Token invalide, déconnecter
              console.warn('Token invalide, déconnexion automatique:', error);
              localStorage.removeItem('acadflow_token');
              localStorage.removeItem('acadflow_user');
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                error: null
              });
            });
            
        } catch (error: any) {
          // Erreur de parsing ou autre
          console.error('Erreur lors de la vérification d\'authentification:', error);
          localStorage.removeItem('acadflow_token');
          localStorage.removeItem('acadflow_user');
          
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        }
      },

      updateUser: (userData: Partial<User>) => {
        const currentUser = get().user;
        if (currentUser) {
          const updatedUser = { ...currentUser, ...userData };
          localStorage.setItem('acadflow_user', JSON.stringify(updatedUser));
          set({ user: updatedUser });
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
      partialize: (state) => ({
        // Persister seulement l'état d'authentification, pas les données
        isAuthenticated: state.isAuthenticated
      }),
      skipHydration: false
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

export default useAuthStore;