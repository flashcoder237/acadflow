// ========================================
// FICHIER: src/stores/appStore.ts - Store global de l'application corrigé
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
    // Éviter les chargements multiples
    if (get().loading) return;
    
    set({ loading: true, error: null });
    
    try {
      // Données mockées pour le développement
      const mockEtablissement: Etablissement = {
        id: 1,
        nom: "École Supérieure Polytechnique",
        nom_complet: "École Supérieure Polytechnique de Douala",
        acronyme: "ESP",
        type_etablissement: 1,
        universite_tutelle: 1,
        universite_tutelle_nom: "Université de Douala",
        adresse: "BP 8390 Douala",
        ville: "Douala",
        region: "Littoral",
        pays: "Cameroun",
        telephone: "+237 233 427 935",
        email: "contact@esp.cm",
        site_web: "https://esp.cm",
        numero_autorisation: "ESP/2024/001",
        date_creation: "2024-01-01",
        date_autorisation: "2024-01-15",
        ministre_tutelle: "Ministère de l'Enseignement Supérieur",
        couleur_principale: "#1e40af",
        couleur_secondaire: "#3b82f6",
        systeme_credits: "LMD",
        note_maximale: 20,
        note_passage: 10,
        actif: true,
        etablissement_principal: true,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };

      const mockAnneeAcademique: AnneeAcademique = {
        id: 1,
        libelle: "2024-2025",
        date_debut: "2024-09-01",
        date_fin: "2025-07-31",
        active: true,
        delai_saisie_notes: 14,
        autoriser_modification_notes: true,
        generation_auto_recaps: false,
        created_at: "2024-01-01T00:00:00Z",
        updated_at: "2024-01-01T00:00:00Z"
      };

      const mockSessions: Session[] = [
        {
          id: 1,
          nom: "Session Normale",
          code: "SN",
          ordre: 1,
          actif: true,
          date_debut_session: "2024-11-01",
          date_fin_session: "2024-12-15",
          generation_recaps_auto: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        },
        {
          id: 2,
          nom: "Session de Rattrapage",
          code: "SR",
          ordre: 2,
          actif: true,
          date_debut_session: "2025-01-15",
          date_fin_session: "2025-02-28",
          generation_recaps_auto: false,
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        }
      ];

      const mockSemestres: Semestre[] = [
        {
          id: 1,
          nom: "Semestre 1",
          numero: 1,
          date_debut: "2024-09-01",
          date_fin: "2025-01-31",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        },
        {
          id: 2,
          nom: "Semestre 2",
          numero: 2,
          date_debut: "2025-02-01",
          date_fin: "2025-07-31",
          created_at: "2024-01-01T00:00:00Z",
          updated_at: "2024-01-01T00:00:00Z"
        }
      ];

      // Simuler un délai d'API
      await new Promise(resolve => setTimeout(resolve, 500));

      set({
        etablissement: mockEtablissement,
        anneeAcademique: mockAnneeAcademique,
        sessions: mockSessions,
        semestres: mockSemestres,
        loading: false,
        error: null
      });

    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
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