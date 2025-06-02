// src/lib/api-extended.ts - Extensions API pour nouvelles fonctionnalités
import { apiClient } from './api'

// Extensions pour gestion multi-institutionnelle
export const institutionApi = {
  // Gestion des domaines
  getDomaines: (params?: any) =>
    apiClient.get<any>('/core/domaines/', params),
  
  getDomaine: (id: number) =>
    apiClient.get<any>(`/core/domaines/${id}/`),
  
  createDomaine: (data: any) =>
    apiClient.post<any>('/core/domaines/', data),
  
  updateDomaine: (id: number, data: any) =>
    apiClient.put<any>(`/core/domaines/${id}/`, data),
  
  deleteDomaine: (id: number) =>
    apiClient.delete(`/core/domaines/${id}/`),
  
  // Statistiques domaines
  getDomainesStatistiques: () =>
    apiClient.get<any[]>('/core/domaines/statistiques/'),
  
  // Gestion des filières avec options
  getFilieres: (params?: any) =>
    apiClient.get<any>('/core/filieres/', params),
  
  getFiliere: (id: number) =>
    apiClient.get<any>(`/core/filieres/${id}/`),
  
  getFiliereOptions: (id: number) =>
    apiClient.get<any[]>(`/core/filieres/${id}/options/`),
  
  createFiliereOption: (filiereId: number, data: any) =>
    apiClient.post<any>(`/core/filieres/${filiereId}/options/`, data),
  
  // Gestion des cycles et niveaux
  getCycles: () =>
    apiClient.get<any>('/core/cycles/'),
  
  getCycleNiveaux: (id: number) =>
    apiClient.get<any[]>(`/core/cycles/${id}/niveaux/`),
  
  getNiveaux: (params?: any) =>
    apiClient.get<any>('/core/niveaux/', params),
  
  getNiveauUEsParSemestre: (id: number) =>
    apiClient.get<any>(`/core/niveaux/${id}/ues_par_semestre/`),
}

// Extensions pour parcours et transitions
export const parcoursApi = {
  // Parcours académique
  getParcoursAcademique: (etudiantId: number) =>
    apiClient.get<any>(`/auth/etudiants/${etudiantId}/parcours_academique/`),
  
  // Gestion des transitions
  getTransitionsNiveau: (niveauId: number) =>
    apiClient.get<any>(`/core/niveaux/${niveauId}/transitions/`),
  
  validerTransition: (etudiantId: number, data: any) =>
    apiClient.post<any>(`/auth/etudiants/${etudiantId}/valider_transition/`, data),
  
  // Gestion des passerelles
  getPasserellesDisponibles: (etudiantId: number) =>
    apiClient.get<any>(`/auth/etudiants/${etudiantId}/passerelles_disponibles/`),
  
  demanderPasserelle: (etudiantId: number, data: any) =>
    apiClient.post<any>(`/auth/etudiants/${etudiantId}/demander_passerelle/`, data),
  
  // Prérequis
  verifierPrerequis: (etudiantId: number, ueId: number) =>
    apiClient.get<any>(`/auth/etudiants/${etudiantId}/verifier_prerequis/${ueId}/`),
  
  getPrerequisUE: (ueId: number) =>
    apiClient.get<any>(`/academics/ues/${ueId}/prerequis/`),
}

// Extensions pour exports avancés
export const exportApi = {
  // Relevés semestriels
  genererReleveSemestriel: (etudiantId: number, params: any) =>
    apiClient.post<Blob>(`/exports/releves-semestriels/`, { 
      etudiant_id: etudiantId, 
      ...params 
    }),
  
  // Relevés annuels consolidés
  genererReleveAnnuel: (etudiantId: number, params: any) =>
    apiClient.post<Blob>(`/exports/releves-annuels/`, { 
      etudiant_id: etudiantId, 
      ...params 
    }),
  
  // Procès-verbaux de jury
  genererProcesVerbal: (classeId: number, sessionId: number, params: any) =>
    apiClient.post<Blob>(`/exports/proces-verbaux/`, { 
      classe_id: classeId, 
      session_id: sessionId, 
      ...params 
    }),
  
  // Tableaux de notes classe
  genererTableauNotes: (classeId: number, sessionId: number, params: any) =>
    apiClient.post<Blob>(`/exports/tableaux-notes/`, { 
      classe_id: classeId, 
      session_id: sessionId, 
      ...params 
    }),
  
  // Rapports statistiques
  genererRapportStatistiques: (params: any) =>
    apiClient.post<Blob>(`/exports/rapports-statistiques/`, params),
  
  // Listes de délibération
  genererListeDeliberation: (classeId: number, sessionId: number, params: any) =>
    apiClient.post<Blob>(`/exports/listes-deliberation/`, { 
      classe_id: classeId, 
      session_id: sessionId, 
      ...params 
    }),
  
  // Gestion des exports planifiés
  getExportsPlanifies: () =>
    apiClient.get<any>('/exports/planifies/'),
  
  createExportPlanifie: (data: any) =>
    apiClient.post<any>('/exports/planifies/', data),
  
  updateExportPlanifie: (id: number, data: any) =>
    apiClient.put<any>(`/exports/planifies/${id}/`, data),
  
  deleteExportPlanifie: (id: number) =>
    apiClient.delete(`/exports/planifies/${id}/`),
  
  // Historique des exports
  getHistoriqueExports: (params?: any) =>
    apiClient.get<any>('/exports/historique/', params),
}

// Extensions pour configuration avancée
export const configApi = {
  // Configuration institutionnelle
  getConfigurationInstitution: () =>
    apiClient.get<any>('/configuration/institution/'),
  
  updateConfigurationInstitution: (data: any) =>
    apiClient.put<any>('/configuration/institution/', data),
  
  // Configuration académique
  getConfigurationAcademique: () =>
    apiClient.get<any>('/configuration/academique/'),
  
  updateConfigurationAcademique: (data: any) =>
    apiClient.put<any>('/configuration/academique/', data),
  
  // Configuration des évaluations
  getConfigurationEvaluations: () =>
    apiClient.get<any>('/configuration/evaluations/'),
  
  updateConfigurationEvaluations: (data: any) =>
    apiClient.put<any>('/configuration/evaluations/', data),
  
  // Configuration des notifications
  getConfigurationNotifications: () =>
    apiClient.get<any>('/configuration/notifications/'),
  
  updateConfigurationNotifications: (data: any) =>
    apiClient.put<any>('/configuration/notifications/', data),
  
  // Configuration des exports
  getConfigurationExports: () =>
    apiClient.get<any>('/configuration/exports/'),
  
  updateConfigurationExports: (data: any) =>
    apiClient.put<any>('/configuration/exports/', data),
  
  // Configuration de sécurité
  getConfigurationSecurite: () =>
    apiClient.get<any>('/configuration/securite/'),
  
  updateConfigurationSecurite: (data: any) =>
    apiClient.put<any>('/configuration/securite/', data),
  
  // Logs et audit
  getLogsAudit: (params?: any) =>
    apiClient.get<any>('/configuration/logs-audit/', params),
  
  // Sauvegardes
  getSauvegardes: () =>
    apiClient.get<any>('/configuration/sauvegardes/'),
  
  creerSauvegarde: (data: any) =>
    apiClient.post<any>('/configuration/sauvegardes/', data),
  
  restaurerSauvegarde: (id: number) =>
    apiClient.post<any>(`/configuration/sauvegardes/${id}/restaurer/`),
}

// Extensions pour statistiques avancées
export const statistiquesAvanceesApi = {
  // Statistiques multi-niveaux
  getStatistiquesMultiniveau: (params?: any) =>
    apiClient.get<any>('/statistiques/multiniveau/', params),
  
  // Flux de progression
  getFluxProgression: (params?: any) =>
    apiClient.get<any>('/statistiques/flux-progression/', params),
  
  // Analyse des cohortes
  getAnalyseCohortes: (params?: any) =>
    apiClient.get<any>('/statistiques/cohortes/', params),
  
  // Prédictions et projections
  getPredictionsReussite: (params?: any) =>
    apiClient.get<any>('/statistiques/predictions/', params),
  
  // Comparaisons inter-établissements
  getComparaisonsNationales: (params?: any) =>
    apiClient.get<any>('/statistiques/comparaisons-nationales/', params),
  
  // Indicateurs de performance
  getIndicateursPerformance: (params?: any) =>
    apiClient.get<any>('/statistiques/indicateurs-performance/', params),
  
  // Analyse des abandons
  getAnalyseAbandons: (params?: any) =>
    apiClient.get<any>('/statistiques/analyse-abandons/', params),
  
  // Satisfaction et qualité
  getStatistiquesSatisfaction: (params?: any) =>
    apiClient.get<any>('/statistiques/satisfaction/', params),
  
  // Insertion professionnelle
  getStatistiquesInsertion: (params?: any) =>
    apiClient.get<any>('/statistiques/insertion-professionnelle/', params),
}
