// ========================================
// FICHIER: src/stores/appStore.ts - Store global de l'application
// ========================================

import { create } from 'zustand';
import { 
  Etablissement, 
  AnneeAcademique, 
  Session, 
  Semestre,
  AppContextType,
  Notification 
} from '@/types';
import { apiClient } from '@/lib/api';

interface AppStore extends AppContextType {
  // État des notifications
  notifications: Notification[];
  
  // Actions pour les données globales
  loadInitialData: () => Promise<void>;
  setEtablissement: (etablissement: Etablissement) => void;
  setAnneeAcademique: (anneeAcademique: AnneeAcademique) => void;
  setSessions: (sessions: Session[]) => void;
  setSemestres: (semestres: Semestre[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions pour les notifications
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  
  // Actions utilitaires
  reset: () => void;
}

const generateId = () => Math.random().toString(36).substr(2, 9);

export const useAppStore = create<AppStore>((set, get) => ({
  // État initial
  etablissement: null,
  anneeAcademique: null,
  sessions: [],
  semestres: [],
  loading: false,
  error: null,
  notifications: [],

  // Actions pour charger les données initiales
  loadInitialData: async () => {
    set({ loading: true, error: null });
    
    try {
      // Charger les données de base en parallèle
      const [etablissement, anneeAcademique, sessions, semestres] = await Promise.all([
        apiClient.getEtablissementPrincipal().catch(() => null),
        apiClient.getAnneeAcademiqueActive().catch(() => null),
        apiClient.getSessions().catch(() => []),
        apiClient.getSemestres().catch(() => [])
      ]);

      set({
        etablissement,
        anneeAcademique,
        sessions,
        semestres,
        loading: false,
        error: null
      });
    } catch (error: any) {
      set({
        loading: false,
        error: error.message || 'Erreur lors du chargement des données'
      });
    }
  },

  refreshData: async () => {
    const { loadInitialData } = get();
    await loadInitialData();
  },

  // Setters individuels
  setEtablissement: (etablissement: Etablissement) => {
    set({ etablissement });
  },

  setAnneeAcademique: (anneeAcademique: AnneeAcademique) => {
    set({ anneeAcademique });
  },

  setSessions: (sessions: Session[]) => {
    set({ sessions });
  },

  setSemestres: (semestres: Semestre[]) => {
    set({ semestres });
  },

  setLoading: (loading: boolean) => {
    set({ loading });
  },

  setError: (error: string | null) => {
    set({ error });
  },

  // Gestion des notifications
  addNotification: (notification: Omit<Notification, 'id'>) => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration || 5000
    };

    set((state) => ({
      notifications: [...state.notifications, newNotification]
    }));

    // Auto-supprimer après la durée spécifiée
    if (newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }
  },

  removeNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  // Reset de l'état
  reset: () => {
    set({
      etablissement: null,
      anneeAcademique: null,
      sessions: [],
      semestres: [],
      loading: false,
      error: null,
      notifications: []
    });
  }
}));

// Sélecteurs pour faciliter l'utilisation
export const useEtablissement = () => useAppStore((state) => state.etablissement);
export const useAnneeAcademique = () => useAppStore((state) => state.anneeAcademique);
export const useSessions = () => useAppStore((state) => state.sessions);
export const useSemestres = () => useAppStore((state) => state.semestres);
export const useAppLoading = () => useAppStore((state) => state.loading);
export const useAppError = () => useAppStore((state) => state.error);
export const useNotifications = () => useAppStore((state) => state.notifications);

// Hooks pour les actions
export const useNotificationActions = () => {
  const addNotification = useAppStore((state) => state.addNotification);
  const removeNotification = useAppStore((state) => state.removeNotification);
  const clearNotifications = useAppStore((state) => state.clearNotifications);

  return {
    addNotification,
    removeNotification,
    clearNotifications,
    // Helpers pour les types de notifications
    showSuccess: (title: string, message?: string) => 
      addNotification({ type: 'success', title, message }),
    showError: (title: string, message?: string) => 
      addNotification({ type: 'error', title, message }),
    showWarning: (title: string, message?: string) => 
      addNotification({ type: 'warning', title, message }),
    showInfo: (title: string, message?: string) => 
      addNotification({ type: 'info', title, message })
  };
};

export default useAppStore;