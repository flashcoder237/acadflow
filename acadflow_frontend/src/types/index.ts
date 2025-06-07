// ========================================
// FICHIER: src/types/index.ts - Définitions TypeScript
// ========================================

// Types d'utilisateurs
export type UserType = 'etudiant' | 'enseignant' | 'admin' | 'scolarite' | 'direction';

// Types d'établissement
export interface TypeEtablissement {
  id: number;
  nom: string;
  code: string;
  description?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Universite {
  id: number;
  nom: string;
  code: string;
  acronyme?: string;
  ville: string;
  pays: string;
  site_web?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Campus {
  id: number;
  nom: string;
  etablissement: number;
  etablissement_nom?: string;
  adresse: string;
  ville: string;
  campus_principal: boolean;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationEtablissement {
  id: number;
  etablissement: number;
  duree_semestre_mois: number;
  nombre_semestres_par_annee: number;
  delai_saisie_notes_defaut: number;
  autoriser_modification_notes: boolean;
  precision_notes: number;
  arrondi_notes: 'NORMAL' | 'SUPERIEUR' | 'INFERIEUR';
  credits_minimum_passage: number;
  pourcentage_minimum_validation: number;
  langue_principale: string;
  format_date: string;
  fuseau_horaire: string;
  duree_session_heures: number;
  tentatives_connexion_max: number;
  created_at: string;
  updated_at: string;
}

export interface Etablissement {
  id: number;
  nom: string;
  nom_complet: string;
  acronyme: string;
  type_etablissement: number;
  type_etablissement_nom?: string;
  universite_tutelle?: number;
  universite_tutelle_nom?: string;
  adresse: string;
  ville: string;
  region: string;
  pays: string;
  code_postal?: string;
  telephone: string;
  email: string;
  site_web?: string;
  numero_autorisation: string;
  date_creation: string;
  date_autorisation: string;
  ministre_tutelle: string;
  logo?: string;
  couleur_principale: string;
  couleur_secondaire: string;
  systeme_credits: 'LMD' | 'ECTS' | 'CUSTOM';
  note_maximale: number;
  note_passage: number;
  actif: boolean;
  etablissement_principal: boolean;
  configuration?: ConfigurationEtablissement;
  campus?: Campus[];
  nombre_campus?: number;
  created_at: string;
  updated_at: string;
}

// User et profils
export interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  type_utilisateur: UserType;
  matricule: string;
  telephone?: string;
  adresse?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  photo?: string;
  actif: boolean;
  date_joined: string;
  last_login?: string;
  
  // Informations spécifiques selon le type
  etudiant_id?: number;
  numero_carte?: string;
  classe_actuelle?: {
    id: number;
    nom: string;
    niveau: string;
    filiere: string;
  };
  statut_actuel?: string;
  
  enseignant_id?: number;
  grade?: string;
  specialite?: string;
  nombre_enseignements?: number;
}

export interface Enseignant {
  id: number;
  user: User;
  grade: 'assistant' | 'maitre_assistant' | 'maitre_conference' | 'professeur';
  specialite: string;
  statut: string;
  matricule?: string;
  nom_complet?: string;
  created_at: string;
  updated_at: string;
}

export interface Etudiant {
  id: number;
  user: User;
  numero_carte: string;
  statut_current: string;
  matricule?: string;
  nom_complet?: string;
  created_at: string;
  updated_at: string;
}

// Types académiques
export interface Domaine {
  id: number;
  nom: string;
  code: string;
  etablissement: number;
  etablissement_nom?: string;
  description?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Cycle {
  id: number;
  nom: string;
  code: string;
  etablissement: number;
  etablissement_nom?: string;
  duree_annees: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface TypeFormation {
  id: number;
  nom: string;
  code: string;
  cycle: number;
  cycle_nom?: string;
  etablissement_nom?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Filiere {
  id: number;
  nom: string;
  code: string;
  domaine: number;
  domaine_nom?: string;
  type_formation: number;
  type_formation_nom?: string;
  campus?: number;
  campus_nom?: string;
  etablissement_nom?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Option {
  id: number;
  nom: string;
  code: string;
  filiere: number;
  filiere_nom?: string;
  etablissement_nom?: string;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Niveau {
  id: number;
  nom: string;
  numero: number;
  cycle: number;
  cycle_nom?: string;
  etablissement_nom?: string;
  credits_requis: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface AnneeAcademique {
  id: number;
  libelle: string;
  date_debut: string;
  date_fin: string;
  active: boolean;
  delai_saisie_notes: number;
  autoriser_modification_notes: boolean;
  generation_auto_recaps: boolean;
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: number;
  nom: string;
  code: string;
  ordre: number;
  actif: boolean;
  date_debut_session?: string;
  date_fin_session?: string;
  generation_recaps_auto: boolean;
  created_at: string;
  updated_at: string;
}

export interface Semestre {
  id: number;
  nom: string;
  numero: number;
  date_debut?: string;
  date_fin?: string;
  created_at: string;
  updated_at: string;
}

export interface Classe {
  id: number;
  nom: string;
  code: string;
  filiere: number;
  filiere_nom?: string;
  option?: number;
  option_nom?: string;
  niveau: number;
  niveau_nom?: string;
  annee_academique: number;
  annee_academique_libelle?: string;
  effectif_max: number;
  effectif_actuel?: number;
  active: boolean;
  responsable_classe?: number;
  responsable_nom?: string;
  recap_s1_genere: boolean;
  recap_s2_genere: boolean;
  date_recap_s1?: string;
  date_recap_s2?: string;
  created_at: string;
  updated_at: string;
}

export interface UE {
  id: number;
  nom: string;
  code: string;
  credits: number;
  type_ue: 'obligatoire' | 'optionnelle';
  niveau: number;
  niveau_nom?: string;
  semestre: number;
  semestre_nom?: string;
  volume_horaire_cm: number;
  volume_horaire_td: number;
  volume_horaire_tp: number;
  volume_horaire_total?: number;
  nombre_ec?: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface EC {
  id: number;
  nom: string;
  code: string;
  ue: number;
  ue_nom?: string;
  ue_code?: string;
  poids_ec: number;
  nombre_classes?: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface TypeEvaluation {
  id: number;
  nom: string;
  code: string;
  description?: string;
  delai_saisie_defaut?: number;
  nombre_utilisations?: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationEvaluationEC {
  id: number;
  ec: number;
  ec_nom?: string;
  type_evaluation: number;
  type_evaluation_nom?: string;
  pourcentage: number;
}

// Types d'évaluations et notes
export interface Enseignement {
  id: number;
  enseignant: number;
  enseignant_nom?: string;
  ec: number;
  ec_nom?: string;
  ec_code?: string;
  ue_nom?: string;
  classe: number;
  classe_nom?: string;
  annee_academique: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Evaluation {
  id: number;
  nom: string;
  enseignement: number;
  enseignement_details?: Enseignement;
  type_evaluation: number;
  type_evaluation_nom?: string;
  session: number;
  session_nom?: string;
  date_evaluation: string;
  note_sur: number;
  saisie_terminee: boolean;
  date_limite_saisie?: string;
  saisie_autorisee: boolean;
  modification_autorisee: boolean;
  nb_modifications: number;
  nombre_notes?: number;
  created_at: string;
  updated_at: string;
}

export interface Note {
  id: number;
  etudiant: number;
  etudiant_nom?: string;
  etudiant_matricule?: string;
  evaluation: number;
  evaluation_nom?: string;
  note_obtenue: number;
  note_sur_20?: number;
  absent: boolean;
  justifie: boolean;
  commentaire?: string;
  modifiee: boolean;
  date_modification?: string;
  modifiee_par?: number;
  note_precedente?: number;
  created_at: string;
  updated_at: string;
}

export interface MoyenneEC {
  id: number;
  etudiant: number;
  etudiant_nom?: string;
  etudiant_matricule?: string;
  ec: number;
  ec_nom?: string;
  ec_code?: string;
  session: number;
  annee_academique: number;
  moyenne: number;
  validee: boolean;
  created_at: string;
  updated_at: string;
}

export interface MoyenneUE {
  id: number;
  etudiant: number;
  etudiant_nom?: string;
  etudiant_matricule?: string;
  ue: number;
  ue_nom?: string;
  ue_code?: string;
  session: number;
  annee_academique: number;
  moyenne: number;
  credits_obtenus: number;
  validee: boolean;
  mention?: string;
  created_at: string;
  updated_at: string;
}

export interface MoyenneSemestre {
  id: number;
  etudiant: number;
  etudiant_nom?: string;
  etudiant_matricule?: string;
  classe: number;
  classe_nom?: string;
  semestre: number;
  semestre_nom?: string;
  session: number;
  annee_academique: number;
  moyenne_generale: number;
  credits_obtenus: number;
  credits_requis: number;
  taux_validation?: number;
  mention?: string;
  created_at: string;
  updated_at: string;
}

// Types pour les statistiques
export interface StatistiquesEvaluation {
  evaluation: Evaluation;
  nombre_notes: number;
  nombre_absents: number;
  moyenne: number;
  note_max: number;
  note_min: number;
  repartition: {
    excellents: number;
    bien: number;
    assez_bien: number;
    passable: number;
    insuffisant: number;
  };
}

export interface FeuilleNotes {
  evaluation: Evaluation;
  etudiants: Array<{
    etudiant_id: number;
    matricule: string;
    nom_complet: string;
    note_obtenue?: number;
    absent: boolean;
    justifie: boolean;
    commentaire?: string;
  }>;
}

export interface SaisieNote {
  etudiant_id: number;
  note_obtenue?: number;
  absent: boolean;
  justifie: boolean;
  commentaire?: string;
}

// Types pour l'authentification
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: 'success' | 'error';
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}

// Types pour les formulaires
export interface CreateEvaluationRequest {
  nom: string;
  enseignement: number;
  type_evaluation: number;
  session: number;
  date_evaluation: string;
  note_sur: number;
}

export interface UpdateEvaluationRequest extends Partial<CreateEvaluationRequest> {
  id: number;
}

export interface SaisieNotesRequest {
  notes: SaisieNote[];
}

// Types pour les filtres et recherches
export interface EvaluationFilters {
  enseignement?: number;
  session?: number;
  type_evaluation?: number;
  saisie_terminee?: boolean;
  search?: string;
}

export interface EnseignementFilters {
  enseignant?: number;
  classe?: number;
  ec?: number;
  annee_academique?: number;
  search?: string;
}

export interface NoteFilters {
  etudiant?: number;
  evaluation?: number;
  ec?: number;
  session?: number;
  absent?: boolean;
}

// Types pour les tableaux
export interface TableColumn<T> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  render?: (value: any, row: T) => React.ReactNode;
  className?: string;
}

export interface TableProps<T> {
  data: T[];
  columns: TableColumn<T>[];
  loading?: boolean;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
  };
  onSort?: (column: string, direction: 'asc' | 'desc') => void;
  className?: string;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  actions?: Array<{
    label: string;
    action: () => void;
  }>;
}

// Types pour les modales
export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

// Types pour le contexte de l'application
export interface AppContextType {
  etablissement: Etablissement | null;
  anneeAcademique: AnneeAcademique | null;
  sessions: Session[];
  semestres: Semestre[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
}

// Types d'erreur
export interface ApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Types pour les hooks
export interface UseQueryOptions<T> {
  enabled?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiError, variables: TVariables) => void;
  onSettled?: () => void;
}

// Types pour les routes
export interface RouteConfig {
  path: string;
  element: React.ComponentType;
  children?: RouteConfig[];
  requiredRole?: UserType[];
  requireAuth?: boolean;
}

// Export par défaut des types principaux
export type {
  // Utilisateurs
  User,
  Enseignant,
  Etudiant,
  UserType,
  
  // Établissement
  Etablissement,
  Campus,
  TypeEtablissement,
  Universite,
  ConfigurationEtablissement,
  
  // Académique
  Domaine,
  Cycle,
  TypeFormation,
  Filiere,
  Option,
  Niveau,
  AnneeAcademique,
  Session,
  Semestre,
  Classe,
  UE,
  EC,
  
  // Évaluations
  TypeEvaluation,
  ConfigurationEvaluationEC,
  Enseignement,
  Evaluation,
  Note,
  MoyenneEC,
  MoyenneUE,
  MoyenneSemestre,
  
  // Formulaires et requêtes
  LoginRequest,
  LoginResponse,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
  SaisieNotesRequest,
  SaisieNote,
  
  // Interface et composants
  TableProps,
  TableColumn,
  ModalProps,
  Notification,
  
  // API
  ApiResponse,
  PaginatedResponse,
  ApiError,
  
  // État de l'application
  AuthState,
  AppContextType,
};