// src/types/index.ts - Types complets pour le système AcadFlow

export interface ApiResponse<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface AuthResponse {
  token: string
  user: User & {
    etudiant_id?: number
    numero_carte?: string
    classe_actuelle?: {
      id: number
      nom: string
      niveau: string
      filiere: string
    }
    statut_actuel?: string
    enseignant_id?: number
    grade?: string
    specialite?: string
    nombre_enseignements?: number
  }
}

export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  type_utilisateur: 'etudiant' | 'enseignant' | 'admin' | 'scolarite' | 'direction'
  matricule: string
  telephone: string
  adresse: string
  date_naissance: string | null
  lieu_naissance: string
  photo: string | null
  actif: boolean
  date_joined: string
  last_login: string | null
}

// Core Models
export interface Domaine {
  id: number
  nom: string
  code: string
  description: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Cycle {
  id: number
  nom: string
  code: string
  duree_annees: number
  actif: boolean
  created_at: string
  updated_at: string
}

export interface TypeFormation {
  id: number
  nom: string
  code: string
  cycle: number
  cycle_nom: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Filiere {
  id: number
  nom: string
  code: string
  domaine: number
  domaine_nom: string
  type_formation: number
  type_formation_nom: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Option {
  id: number
  nom: string
  code: string
  filiere: number
  filiere_nom: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Niveau {
  id: number
  nom: string
  numero: number
  cycle: number
  cycle_nom: string
  credits_requis: number
  actif: boolean
  created_at: string
  updated_at: string
}

// Academic Models
export interface AnneeAcademique {
  id: number
  libelle: string
  date_debut: string
  date_fin: string
  active: boolean
  created_at: string
  updated_at: string
}

export interface Session {
  id: number
  nom: string
  code: string
  ordre: number
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Semestre {
  id: number
  nom: string
  numero: number
  created_at: string
  updated_at: string
}

export interface Classe {
  id: number
  nom: string
  code: string
  filiere: number
  filiere_nom: string
  option?: number
  option_nom?: string
  niveau: number
  niveau_nom: string
  annee_academique: number
  annee_academique_libelle: string
  effectif_max: number
  effectif_actuel: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface UE {
  id: number
  nom: string
  code: string
  credits: number
  coefficient: number
  type_ue: 'obligatoire' | 'optionnelle'
  niveau: number
  niveau_nom: string
  semestre: number
  semestre_nom: string
  nombre_ec: number
  actif: boolean
  created_at: string
  updated_at: string
}

export interface EC {
  id: number
  nom: string
  code: string
  ue: number
  ue_nom: string
  ue_code: string
  poids_ec: number
  actif: boolean
  created_at: string
  updated_at: string
}

export interface TypeEvaluation {
  id: number
  nom: string
  code: string
  description: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface ConfigurationEvaluationEC {
  id: number
  ec: number
  ec_nom: string
  type_evaluation: number
  type_evaluation_nom: string
  pourcentage: number
}

// User Models
export interface Enseignant {
  id: number
  user: User
  nom_complet: string
  matricule: string
  grade: 'assistant' | 'maitre_assistant' | 'maitre_conference' | 'professeur'
  specialite: string
  statut: string
  created_at: string
  updated_at: string
}

export interface Etudiant {
  id: number
  user: User
  nom_complet: string
  matricule: string
  numero_carte: string
  statut_current: string
  created_at: string
  updated_at: string
}

export interface StatutEtudiant {
  id: number
  nom: string
  code: string
  description: string
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Inscription {
  id: number
  etudiant: number
  etudiant_nom: string
  etudiant_matricule: string
  classe: number
  classe_nom: string
  annee_academique: number
  date_inscription: string
  statut: number
  statut_nom: string
  nombre_redoublements: number
  active: boolean
  created_at: string
  updated_at: string
}

export interface HistoriqueStatut {
  id: number
  etudiant: number
  etudiant_nom: string
  statut: number
  statut_nom: string
  date_changement: string
  annee_academique: number
  motif: string
  created_at: string
  updated_at: string
}

// Evaluation Models
export interface Enseignement {
  id: number
  enseignant: number
  enseignant_nom: string
  ec: number
  ec_nom: string
  ec_code: string
  classe: number
  classe_nom: string
  ue_nom: string
  annee_academique: number
  actif: boolean
  created_at: string
  updated_at: string
}

export interface Evaluation {
  id: number
  nom: string
  enseignement: number
  enseignement_details: {
    enseignant_nom: string
    ec_nom: string
    ec_code: string
    classe_nom: string
    ue_nom: string
  }
  type_evaluation: number
  type_evaluation_nom: string
  session: number
  session_nom: string
  date_evaluation: string
  note_sur: number
  coefficient: number
  saisie_terminee: boolean
  nombre_notes: number
  created_at: string
  updated_at: string
}

export interface Note {
  id: number
  etudiant: number
  etudiant_nom: string
  etudiant_matricule: string
  evaluation: number
  evaluation_nom: string
  note_obtenue: number
  note_sur_20: number
  absent: boolean
  justifie: boolean
  commentaire: string
  created_at: string
  updated_at: string
}

export interface MoyenneEC {
  id: number
  etudiant: number
  etudiant_nom: string
  etudiant_matricule: string
  ec: number
  ec_nom: string
  ec_code: string
  session: number
  annee_academique: number
  moyenne: number
  validee: boolean
  created_at: string
  updated_at: string
}

export interface MoyenneUE {
  id: number
  etudiant: number
  etudiant_nom: string
  etudiant_matricule: string
  ue: number
  ue_nom: string
  ue_code: string
  session: number
  annee_academique: number
  moyenne: number
  credits_obtenus: number
  validee: boolean
  mention: string
  created_at: string
  updated_at: string
}

export interface MoyenneSemestre {
  id: number
  etudiant: number
  etudiant_nom: string
  etudiant_matricule: string
  classe: number
  classe_nom: string
  semestre: number
  semestre_nom: string
  session: number
  annee_academique: number
  moyenne_generale: number
  credits_obtenus: number
  credits_requis: number
  taux_validation: number
  mention: string
  created_at: string
  updated_at: string
}

// Interfaces for API inputs
export interface NoteInput {
  etudiant_id: number
  note_obtenue: number | null
  absent: boolean
  justifie: boolean
  commentaire?: string
}

export interface EvaluationConfigInput {
  type_evaluation_id: number
  pourcentage: number
}

export interface FeuilleNotes {
  evaluation: Evaluation
  etudiants: {
    etudiant_id: number
    matricule: string
    nom_complet: string
    note_obtenue: number | null
    absent: boolean
    justifie: boolean
    commentaire: string
  }[]
}

// Response interfaces for complex endpoints
export interface ProgrammePedagogique {
  classe: Classe
  semestres: {
    semestre: Semestre
    ues: UE[]
    total_credits: number
    nombre_ues: number
  }[]
}

export interface StatistiquesEvaluation {
  evaluation: Evaluation
  nombre_notes: number
  nombre_absents: number
  moyenne: number
  note_max: number
  note_min: number
  repartition: {
    excellents: number
    bien: number
    assez_bien: number
    passable: number
    insuffisant: number
  }
}

export interface StatistiquesClasse {
  classe_id: number
  session_id: number
  nombre_etudiants: number
  moyenne_classe: number
  moyenne_max: number
  moyenne_min: number
  taux_reussite: number
  taux_reussite_pct: number
  mentions: {
    tres_bien: number
    bien: number
    assez_bien: number
    passable: number
    insuffisant: number
  }
  credits: {
    moyenne_credits_obtenus: number
    total_credits_requis: number
  }
}

export interface ReleveNotes {
  etudiant: Etudiant
  session: Session
  annee_academique: AnneeAcademique
  classe: Classe
  notes_par_ue: {
    ue: {
      code: string
      nom: string
      credits: number
      coefficient: number
      semestre: string
    }
    moyenne_ue: number | null
    credits_obtenus: number
    validee: boolean
    moyennes_ec: {
      ec: {
        code: string
        nom: string
        poids: number
      }
      moyenne: number
      validee: boolean
    }[]
  }[]
  moyennes_semestre: {
    semestre: string
    moyenne_generale: number
    credits_obtenus: number
    credits_requis: number
    taux_validation: number
    mention: string
  }[]
  bilan: {
    moyenne_generale_annee: number
    total_credits_obtenus: number
    total_credits_requis: number
    taux_validation_annee: number
    mention_annee: string
    decision: string
  }
}

export interface TableauNotesClasse {
  classe: Classe
  session: Session
  structure_ues: {
    id: number
    code: string
    nom: string
    credits: number
    semestre: string
    elements_constitutifs: {
      id: number
      code: string
      nom: string
      poids: number
    }[]
  }[]
  etudiants_notes: {
    etudiant: {
      id: number
      matricule: string
      nom_complet: string
    }
    moyennes_ue: Record<number, MoyenneUE>
    moyennes_semestre: Record<number, MoyenneSemestre>
    bilan: {
      moyenne_annee: number
      credits_obtenus: number
      credits_requis: number
      taux_validation: number
      mention: string
    }
  }[]
  statistiques_classe: {
    nombre_etudiants: number
    moyenne_classe: number
    moyenne_max: number
    moyenne_min: number
    taux_reussite: number
    mentions: {
      tres_bien: number
      bien: number
      assez_bien: number
      passable: number
      insuffisant: number
    }
  }
}

export interface ParcoursAcademique {
  etudiant: Etudiant
  inscriptions: Inscription[]
  historique_statuts: HistoriqueStatut[]
  statistiques: {
    nombre_redoublements: number
    classes_frequentees: number
    annees_etudes: number
  }
}

export interface ChargeTravailEnseignant {
  enseignant: Enseignant
  nombre_ec: number
  nombre_classes: number
  nombre_evaluations_en_attente: number
}

export interface StatistiquesUtilisateurs {
  total_utilisateurs: number
  par_type: Record<string, number>
  nouveaux_cette_semaine: number
}

export interface StatistiquesDomaine {
  id: number
  nom: string
  code: string
  nombre_filieres: number
  nombre_etudiants: number
}

export interface StatistiquesFiliere {
  nombre_etudiants: number
  nombre_classes: number
  repartition_par_niveau: Record<string, number>
}

export interface ConfigurationEvaluationUE {
  ue: UE
  elements_constitutifs: {
    ec: EC
    evaluations: {
      type_evaluation: string
      pourcentage: number
    }[]
    total_pourcentage: number
  }[]
}

export interface PlanningEvaluation {
  enseignant: Enseignant
  evaluations: Evaluation[]
}

export interface UsageStatutEtudiant {
  statut: StatutEtudiant
  inscriptions_actuelles: number
  changements_historique: number
  total_utilisation: number
}

export interface UsageTypeEvaluation {
  type_evaluation: TypeEvaluation
  nombre_utilisations: number
}

// Enums
export type TypeUtilisateur = 'etudiant' | 'enseignant' | 'admin' | 'scolarite' | 'direction'
export type GradeEnseignant = 'assistant' | 'maitre_assistant' | 'maitre_conference' | 'professeur'
export type TypeUE = 'obligatoire' | 'optionnelle'
export type Mention = 'Très Bien' | 'Bien' | 'Assez Bien' | 'Passable' | 'Insuffisant'
export type Decision = 'Admis(e)' | 'Admis(e) avec dettes' | 'Autorisé(e) à continuer' | 'Redoublement'

// Utility types
export type CreateEvaluationData = Omit<Evaluation, 'id' | 'created_at' | 'updated_at' | 'enseignement_details' | 'type_evaluation_nom' | 'session_nom' | 'nombre_notes'>

export type UpdateEvaluationData = Partial<CreateEvaluationData>

export type CreateUserData = Omit<User, 'id' | 'date_joined' | 'last_login'> & {
  password: string
}

export type UpdateUserData = Partial<Omit<CreateUserData, 'username' | 'password'>>

// Form interfaces
export interface LoginForm {
  username: string
  password: string
}

export interface EvaluationForm {
  nom: string
  enseignement: number
  type_evaluation: number
  session: number
  date_evaluation: string
  note_sur: number
  coefficient: number
}

export interface ConfigurationECForm {
  ec_id: number
  configurations: EvaluationConfigInput[]
}

export interface InscriptionMassiveForm {
  classe_id: number
  etudiants_ids: number[]
  statut_id: number
}

export interface ChangementStatutForm {
  statut_id: number
  motif?: string
}

// API Error type
export interface ApiErrorResponse {
  message?: string
  error?: string
  detail?: string
  non_field_errors?: string[]
  [key: string]: any
}