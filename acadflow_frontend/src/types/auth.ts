// src/types/auth.ts
export interface User {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  type_utilisateur: 'etudiant' | 'enseignant' | 'admin' | 'scolarite' | 'direction'
  matricule: string
  telephone?: string
  adresse?: string
  date_naissance?: string
  lieu_naissance?: string
  photo?: string
  actif: boolean
  // Informations spécifiques selon le type
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

export interface AuthResponse {
  token: string
  user: User
}
