// ========================================
// FICHIER: src/types/teacher.ts - Types spécifiques aux enseignants
// ========================================

import { User, Evaluation, Note, Enseignement } from './index';

// Types pour les statistiques enseignant
export interface StatistiquesEnseignant {
  totalEnseignements: number;
  totalEvaluations: number;
  totalEtudiants: number;
  evaluationsEnAttente: number;
  evaluationsTerminees: number;
  tauxSaisie: number;
  moyenneGenerale: number;
  repartitionNotes: {
    excellent: number;
    bien: number;
    assezBien: number;
    passable: number;
    insuffisant: number;
  };
  performancesParEC: Array<{
    ec_code: string;
    ec_nom: string;
    classe: string;
    moyenne: number;
    effectif: number;
    tauxReussite: number;
    evaluationsCount: number;
  }>;
}

// Types pour la validation des notes
export interface ValidationNotes {
  evaluation_id: number;
  validation_notes: boolean;
  commentaire_validation?: string;
  date_validation?: string;
}

// Types pour la gestion des absences
export interface GestionAbsence {
  etudiant_id: number;
  evaluation_id: number;
  type_absence: 'absent' | 'present' | 'retard';
  justifie: boolean;
  motif_absence?: string;
  document_justificatif?: File;
}

// Types pour l'export des données
export interface ExportOptions {
  format: 'xlsx' | 'csv' | 'pdf';
  type: 'notes' | 'statistiques' | 'feuille_presence' | 'releve_notes';
  enseignement_id?: number;
  evaluation_id?: number;
  session_id?: number;
  semestre_id?: number;
  date_debut?: string;
  date_fin?: string;
}

// Types pour les filtres enseignant
export interface EnseignantFilters {
  annee_academique?: number;
  session?: number;
  semestre?: number;
  classe?: number;
  ec?: number;
  statut_saisie?: 'tous' | 'en_attente' | 'terminees';
}

// Types pour la liste des étudiants
export interface EtudiantDetails {
  id: number;
  matricule: string;
  nom_complet: string;
  photo?: string;
  telephone?: string;
  email?: string;
  classe: string;
  niveau: string;
  statut: string;
  moyennes: {
    [ec_code: string]: {
      moyenne: number;
      validee: boolean;
      derniere_evaluation?: string;
    };
  };
  absences: {
    total: number;
    justifiees: number;
    non_justifiees: number;
  };
  progression: {
    notes_saisies: number;
    total_evaluations: number;
    pourcentage: number;
  };
}

// Types pour les notifications enseignant
export interface NotificationEnseignant {
  id: string;
  type: 'delai_saisie' | 'nouvelle_evaluation' | 'validation_requise' | 'modification_autorisee';
  titre: string;
  message: string;
  evaluation_id?: number;
  enseignement_id?: number;
  date_limite?: string;
  urgence: 'faible' | 'moyenne' | 'haute' | 'critique';
  lue: boolean;
  date_creation: string;
}

// Types pour le planning enseignant
export interface PlanningEnseignant {
  evaluations_a_venir: Array<{
    id: number;
    nom: string;
    ec: string;
    classe: string;
    date_evaluation: string;
    type_evaluation: string;
    note_sur: number;
    date_limite_saisie: string;
    status: 'planifiee' | 'en_cours' | 'a_corriger';
  }>;
  evaluations_en_retard: Array<{
    id: number;
    nom: string;
    ec: string;
    classe: string;
    date_limite_depassee: string;
    jours_retard: number;
  }>;
  prochaines_echeances: Array<{
    evaluation_id: number;
    nom: string;
    ec: string;
    date_limite: string;
    jours_restants: number;
    urgence: 'critique' | 'urgent' | 'normal';
  }>;
}

// Types pour l'historique des modifications
export interface HistoriqueModification {
  id: number;
  evaluation_id: number;
  etudiant_matricule: string;
  etudiant_nom: string;
  ancienne_note?: number;
  nouvelle_note?: number;
  ancien_statut_absence: boolean;
  nouveau_statut_absence: boolean;
  raison_modification: string;
  date_modification: string;
  modifie_par: string;
  approuve_par?: string;
  statut: 'en_attente' | 'approuve' | 'rejete';
}

// Types pour les alertes et rappels
export interface AlerteEnseignant {
  id: string;
  type: 'delai_proche' | 'delai_depasse' | 'saisie_incomplete' | 'validation_requise';
  titre: string;
  description: string;
  evaluation?: {
    id: number;
    nom: string;
    ec: string;
    classe: string;
  };
  date_limite?: string;
  actions_possibles: Array<{
    label: string;
    action: string;
    url?: string;
  }>;
  severite: 'info' | 'warning' | 'error' | 'critical';
  dismissible: boolean;
}

// Types pour les rapports enseignant
export interface RapportEnseignant {
  periode: {
    debut: string;
    fin: string;
    session: string;
    semestre?: string;
  };
  enseignements: Array<{
    ec_code: string;
    ec_nom: string;
    classes: string[];
    total_etudiants: number;
    evaluations_effectuees: number;
    moyenne_generale: number;
    taux_reussite: number;
    repartition_mentions: {
      [mention: string]: number;
    };
  }>;
  synthese: {
    total_evaluations: number;
    total_etudiants: number;
    moyenne_generale_toutes_matieres: number;
    taux_reussite_global: number;
    temps_moyen_correction: number; // en jours
    notes_modifiees: number;
  };
  recommandations: string[];
}

export default {
  StatistiquesEnseignant,
  ValidationNotes,
  GestionAbsence,
  ExportOptions,
  EnseignantFilters,
  EtudiantDetails,
  NotificationEnseignant,
  PlanningEnseignant,
  HistoriqueModification,
  AlerteEnseignant,
  RapportEnseignant
};