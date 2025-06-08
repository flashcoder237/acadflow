// ========================================
// FICHIER: src/hooks/useTeacherData.ts - Hooks pour les vraies données enseignant
// ========================================

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

// Hook pour les statistiques de badges en temps réel
export const useTeacherBadges = () => {
  const { user } = useAuthStore();
  const isEnseignant = user?.type_utilisateur === 'enseignant';

  return useQuery({
    queryKey: ['teacher-badges', user?.id],
    queryFn: async () => {
      if (!isEnseignant) return null;

      // Charger les évaluations pour calculer les badges
      const evaluationsResponse = await apiClient.getEvaluations({ 
        page_size: 100,
        ordering: '-date_evaluation'
      });

      const evaluations = evaluationsResponse.results;
      const now = new Date();

      // Calculer les statistiques réelles
      const evaluationsEnAttente = evaluations.filter(e => !e.saisie_terminee);
      const evaluationsValidation = evaluations.filter(e => 
        e.saisie_terminee && !e.modification_autorisee
      );
      
      // Évaluations urgentes (délai < 3 jours)
      const evaluationsUrgentes = evaluations.filter(e => {
        if (!e.date_limite_saisie || e.saisie_terminee) return false;
        const limite = new Date(e.date_limite_saisie);
        const diff = limite.getTime() - now.getTime();
        return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
      });

      return {
        evaluationsEnAttente: evaluationsEnAttente.length,
        evaluationsValidation: evaluationsValidation.length,
        evaluationsUrgentes: evaluationsUrgentes.length,
        evaluationsTerminees: evaluations.filter(e => e.saisie_terminee).length,
        totalEvaluations: evaluations.length
      };
    },
    enabled: isEnseignant,
    refetchInterval: 2 * 60 * 1000, // Actualiser toutes les 2 minutes
    staleTime: 1 * 60 * 1000, // Données fraîches pendant 1 minute
    retry: 2
  });
};

// Hook pour les notifications réelles
export const useTeacherNotifications = () => {
  const { user } = useAuthStore();
  const isEnseignant = user?.type_utilisateur === 'enseignant';

  return useQuery({
    queryKey: ['teacher-notifications', user?.id],
    queryFn: async () => {
      if (!isEnseignant) return [];

      // Charger les évaluations avec délais proches
      const evaluationsResponse = await apiClient.getEvaluations({ 
        page_size: 50,
        saisie_terminee: false 
      });

      const evaluations = evaluationsResponse.results;
      const now = new Date();

      // Créer des notifications basées sur les évaluations
      const notifications = evaluations
        .filter(e => {
          if (!e.date_limite_saisie) return false;
          const limite = new Date(e.date_limite_saisie);
          const diff = limite.getTime() - now.getTime();
          return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000; // 7 jours
        })
        .map(e => {
          const limite = new Date(e.date_limite_saisie!);
          const jours = Math.ceil((limite.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
          
          return {
            id: `eval-${e.id}`,
            title: jours <= 1 ? 'Délai urgent !' : 'Délai proche',
            message: `${e.nom} - ${jours} jour(s) restant(s)`,
            time: `${jours}j`,
            read: false,
            type: jours <= 1 ? 'error' as const : 'warning' as const,
            evaluation_id: e.id
          };
        })
        .sort((a, b) => parseInt(a.time) - parseInt(b.time));

      return notifications.slice(0, 10); // Limiter à 10 notifications
    },
    enabled: isEnseignant,
    refetchInterval: 5 * 60 * 1000, // Actualiser toutes les 5 minutes
    staleTime: 2 * 60 * 1000,
    retry: 2
  });
};

// Hook pour les statistiques du dashboard enseignant
export const useTeacherDashboardStats = () => {
  const { user } = useAuthStore();
  const isEnseignant = user?.type_utilisateur === 'enseignant';

  return useQuery({
    queryKey: ['teacher-dashboard-stats', user?.id],
    queryFn: async () => {
      if (!isEnseignant) return null;

      // Charger toutes les données nécessaires en parallèle
      const [enseignementsResponse, evaluationsResponse] = await Promise.all([
        apiClient.getEnseignements({ page_size: 100 }),
        apiClient.getEvaluations({ page_size: 100 })
      ]);

      const enseignements = enseignementsResponse.results;
      const evaluations = evaluationsResponse.results;

      // Calculer les statistiques
      const evaluationsEnAttente = evaluations.filter(e => !e.saisie_terminee);
      const evaluationsTerminees = evaluations.filter(e => e.saisie_terminee);
      const tauxSaisie = evaluations.length > 0 
        ? Math.round((evaluationsTerminees.length / evaluations.length) * 100)
        : 0;

      // Évaluations récentes (30 derniers jours)
      const dateLimite = new Date();
      dateLimite.setDate(dateLimite.getDate() - 30);
      
      const evaluationsRecentes = evaluations
        .filter(e => new Date(e.date_evaluation) >= dateLimite)
        .sort((a, b) => new Date(b.date_evaluation).getTime() - new Date(a.date_evaluation).getTime())
        .slice(0, 5);

      const enseignementsRecents = enseignements
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 5);

      return {
        totalEnseignements: enseignements.length,
        totalEvaluations: evaluations.length,
        evaluationsEnAttente: evaluationsEnAttente.length,
        evaluationsTerminees: evaluationsTerminees.length,
        tauxSaisie,
        evaluationsRecentes,
        enseignementsRecents,
        
        // Statistiques par classe
        classesStats: enseignements.reduce((acc, ens) => {
          const classe = ens.classe_nom || 'Non définie';
          if (!acc[classe]) {
            acc[classe] = {
              totalEnseignements: 0,
              totalEvaluations: 0,
              moyenneGenerale: 0
            };
          }
          acc[classe].totalEnseignements++;
          acc[classe].totalEvaluations += evaluations.filter(e => e.enseignement === ens.id).length;
          return acc;
        }, {} as Record<string, any>)
      };
    },
    enabled: isEnseignant,
    refetchInterval: 5 * 60 * 1000, // Actualiser toutes les 5 minutes
    staleTime: 2 * 60 * 1000,
    retry: 2
  });
};

// Hook pour les messages/communications
export const useTeacherMessages = () => {
  const { user } = useAuthStore();
  const isEnseignant = user?.type_utilisateur === 'enseignant';

  return useQuery({
    queryKey: ['teacher-messages', user?.id],
    queryFn: async () => {
      if (!isEnseignant) return [];

      // TODO: Implémenter l'endpoint pour les messages
      // En attendant, retourner des données mockées basées sur les activités récentes
      
      try {
        // Charger les modifications récentes de notes comme proxy pour les "messages"
        const evaluationsResponse = await apiClient.getEvaluations({ 
          page_size: 20,
          saisie_terminee: true
        });

        const messages = evaluationsResponse.results
          .filter(e => e.nb_modifications > 0)
          .map(e => ({
            id: `msg-${e.id}`,
            title: 'Modification de notes validée',
            content: `Les modifications pour "${e.nom}" ont été validées`,
            date: e.updated_at,
            read: Math.random() > 0.3, // Simuler des messages lus/non lus
            type: 'info' as const
          }))
          .slice(0, 5);

        return messages;
      } catch (error) {
        console.error('Erreur chargement messages:', error);
        return [];
      }
    },
    enabled: isEnseignant,
    refetchInterval: 10 * 60 * 1000, // Actualiser toutes les 10 minutes
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
};

// Hook pour les actions rapides contextuelles
export const useTeacherQuickActions = () => {
  const { user } = useAuthStore();
  const isEnseignant = user?.type_utilisateur === 'enseignant';

  return useQuery({
    queryKey: ['teacher-quick-actions', user?.id],
    queryFn: async () => {
      if (!isEnseignant) return [];

      try {
        // Charger les enseignements pour déterminer les actions possibles
        const enseignementsResponse = await apiClient.getEnseignements({ page_size: 10 });
        const enseignements = enseignementsResponse.results;

        const actions = [];

        // Action : Créer une évaluation (si on a des enseignements)
        if (enseignements.length > 0) {
          actions.push({
            id: 'create-evaluation',
            label: 'Nouvelle évaluation',
            description: 'Créer une évaluation pour vos enseignements',
            icon: 'Plus',
            path: '/evaluations/create',
            enabled: true,
            priority: 1
          });
        }

        // Action : Saisir des notes (si on a des évaluations en attente)
        const evaluationsResponse = await apiClient.getEvaluations({ 
          page_size: 5,
          saisie_terminee: false
        });

        if (evaluationsResponse.results.length > 0) {
          actions.push({
            id: 'saisir-notes',
            label: 'Saisir des notes',
            description: `${evaluationsResponse.results.length} évaluation(s) en attente`,
            icon: 'Edit',
            path: '/evaluations?filter=en_attente',
            enabled: true,
            priority: 2,
            badge: evaluationsResponse.results.length
          });
        }

        // Action : Voir statistiques (si on a des données)
        if (enseignements.length > 0) {
          actions.push({
            id: 'voir-stats',
            label: 'Mes statistiques',
            description: 'Analyser vos performances d\'enseignement',
            icon: 'BarChart3',
            path: '/statistiques',
            enabled: true,
            priority: 3
          });
        }

        return actions.sort((a, b) => a.priority - b.priority);
      } catch (error) {
        console.error('Erreur chargement actions rapides:', error);
        return [];
      }
    },
    enabled: isEnseignant,
    refetchInterval: 10 * 60 * 1000, // Actualiser toutes les 10 minutes
    staleTime: 5 * 60 * 1000,
    retry: 1
  });
};

// Hook pour la session académique active
export const useActiveSession = () => {
  const { sessions } = useAppStore();

  return React.useMemo(() => {
    const now = new Date();
    return sessions.find(session => {
      if (!session.date_debut_session || !session.date_fin_session) return false;
      const debut = new Date(session.date_debut_session);
      const fin = new Date(session.date_fin_session);
      return now >= debut && now <= fin;
    }) || null;
  }, [sessions]);
};

// Hook pour les alertes contextuelles
export const useTeacherAlerts = () => {
  const { user } = useAuthStore();
  const isEnseignant = user?.type_utilisateur === 'enseignant';

  return useQuery({
    queryKey: ['teacher-alerts', user?.id],
    queryFn: async () => {
      if (!isEnseignant) return [];

      try {
        const evaluationsResponse = await apiClient.getEvaluations({ 
          page_size: 50 
        });

        const evaluations = evaluationsResponse.results;
        const now = new Date();
        const alerts = [];

        // Alerte : Évaluations avec délai dépassé
        const evaluationsDepassees = evaluations.filter(e => {
          if (!e.date_limite_saisie || e.saisie_terminee) return false;
          return new Date(e.date_limite_saisie) < now;
        });

        if (evaluationsDepassees.length > 0) {
          alerts.push({
            id: 'delai-depasse',
            type: 'error',
            title: 'Délais dépassés',
            message: `${evaluationsDepassees.length} évaluation(s) ont dépassé leur délai de saisie`,
            actions: [
              {
                label: 'Voir les évaluations',
                path: '/evaluations?filter=retard'
              }
            ],
            dismissible: false
          });
        }

        // Alerte : Évaluations à valider
        const evaluationsAValider = evaluations.filter(e => 
          e.saisie_terminee && !e.modification_autorisee
        );

        if (evaluationsAValider.length > 0) {
          alerts.push({
            id: 'validation-requise',
            type: 'warning',
            title: 'Validations requises',
            message: `${evaluationsAValider.length} évaluation(s) nécessitent votre validation`,
            actions: [
              {
                label: 'Valider maintenant',
                path: '/evaluations?filter=validation'
              }
            ],
            dismissible: true
          });
        }

        return alerts;
      } catch (error) {
        console.error('Erreur chargement alertes:', error);
        return [];
      }
    },
    enabled: isEnseignant,
    refetchInterval: 3 * 60 * 1000, // Actualiser toutes les 3 minutes
    staleTime: 1 * 60 * 1000,
    retry: 2
  });
};

export default {
  useTeacherBadges,
  useTeacherNotifications,
  useTeacherDashboardStats,
  useTeacherMessages,
  useTeacherQuickActions,
  useActiveSession,
  useTeacherAlerts
};