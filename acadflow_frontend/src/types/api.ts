// src/types/api.ts
export interface ApiResponse<T> {
  results?: T[]
  count?: number
  next?: string | null
  previous?: string | null
  data?: T
}

export interface AnneeAcademique {
  id: number
  libelle: string
  date_debut: string
  date_fin: string
  active: boolean
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

export interface Enseignant {
  id: number
  user: User
  nom_complet: string
  matricule: string
  grade: string
  specialite: string
  statut: string
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

export interface Evaluation {
  id: number
  nom: string
  enseignement_details: any
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