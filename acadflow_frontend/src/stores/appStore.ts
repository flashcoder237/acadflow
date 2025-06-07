// ========================================
// FICHIER: src/stores/appStore.ts - Store avec vraies données du backend
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
  refreshData: () => Promise<void>;
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

  // Actions pour charger les données initiales depuis le backend
  loadInitialData: async () => {
    // Éviter les chargements multiples
    if (get().loading) return;
    
    set({ loading: true, error: null });
    
    try {
      // Charger les données en parallèle depuis le backend
      const [
        etablissement,
        anneeAcademique,
        sessions,
        semestres
      ] = await Promise.allSettled([
        apiClient.getEtablissementPrincipal(),
        apiClient.getAnneeAcademiqueActive(),
        apiClient.getSessions(),
        apiClient.getSemestres()
      ]);

      // Traiter les résultats
      const result = {
        etablissement: etablissement.status === 'fulfilled' ? etablissement.value : null,
        anneeAcademique: anneeAcademique.status === 'fulfilled' ? anneeAcademique.value : null,
        sessions: sessions.status === 'fulfilled' ? sessions.value : [],
        semestres: semestres.status === 'fulfilled' ? semestres.value : []
      };

      // Log des erreurs s'il y en a
      if (etablissement.status === 'rejected') {
        console.warn('Impossible de charger l\'établissement:', etablissement.reason);
      }
      if (anneeAcademique.status === 'rejected') {
        console.warn('Impossible de charger l\'année académique:', anneeAcademique.reason);
      }
      if (sessions.status === 'rejected') {
        console.warn('Impossible de charger les sessions:', sessions.reason);
      }
      if (semestres.status === 'rejected') {
        console.warn('Impossible de charger les semestres:', semestres.reason);
      }

      set({
        ...result,
        loading: false,
        error: null
      });

      // Afficher un avertissement si certaines données critiques manquent
      if (!result.etablissement || !result.anneeAcademique) {
        get().addNotification({
          type: 'warning',
          title: 'Données incomplètes',
          message: 'Certaines données de configuration sont manquantes. Contactez l\'administration.',
          duration: 8000
        });
      }

    } catch (error: any) {
      console.error('Erreur lors du chargement des données:', error);
      set({
        loading: false,
        error: error.message || 'Erreur lors du chargement des données'
      });

      // Fallback avec des données minimales pour permettre le fonctionnement
      set({
        etablissement: {
          id: 0,
          nom: "Établissement par défaut",
          nom_complet: "Établissement par défaut",
          acronyme: "ETAB",
          type_etablissement: 1,
          adresse: "",
          ville: "Douala",
          region: "Littoral",
          pays: "Cameroun",
          telephone: "",
          email: "",
          numero_autorisation: "",
          date_creation: new Date().toISOString().split('T')[0],
          date_autorisation: new Date().toISOString().split('T')[0],
          ministre_tutelle: "",
          couleur_principale: "#1e40af",
          couleur_secondaire: "#3b82f6",
          systeme_credits: "LMD",
          note_maximale: 20,
          note_passage: 10,
          actif: true,
          etablissement_principal: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        anneeAcademique: {
          id: 0,
          libelle: "2024-2025",
          date_debut: "2024-09-01",
          date_fin: "2025-07-31",
          active: true,
          delai_saisie_notes: 14,
          autoriser_modification_notes: true,
          generation_auto_recaps: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        sessions: [
          {
            id: 1,
            nom: "Session Normale",
            code: "SN",
            ordre: 1,
            actif: true,
            generation_recaps_auto: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ],
        semestres: [
          {
            id: 1,
            nom: "Semestre 1",
            numero: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 2,
            nom: "Semestre 2",
            numero: 2,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ]
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

// Hook pour l'action de rafraîchissement
export const useRefreshData = () => useAppStore((state) => state.refreshData);

export default useAppStore;