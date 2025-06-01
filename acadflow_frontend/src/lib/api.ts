// src/lib/api.ts - Version corrigée avec compatibilité backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      defaultHeaders.Authorization = `Token ${this.token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return {} as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(`Erreur réseau: ${error}`, 0)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
    }
    
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Types pour les réponses API
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
  date_naissance: string
  lieu_naissance: string
  photo: string
  actif: boolean
}

export interface AnneeAcademique {
  id: number
  libelle: string
  date_debut: string
  date_fin: string
  active: boolean
  created_at: string
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
}

export interface Etudiant {
  id: number
  user: User
  nom_complet: string
  matricule: string
  numero_carte: string
  statut_current: string
  created_at: string
}

export interface Enseignant {
  id: number
  user: User
  nom_complet: string
  matricule: string
  grade: 'assistant' | 'maitre_assistant' | 'maitre_conference' | 'professeur'
  specialite: string
  statut: string
  created_at: string
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

export interface NoteInput {
  etudiant_id: number
  note_obtenue: number | null
  absent: boolean
  justifie: boolean
  commentaire?: string
}

// Services d'API spécialisés
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login/', credentials),
  
  logout: () =>
    apiClient.post<{ message: string }>('/auth/logout/'),
}

export const academicsApi = {
  // Années académiques
  getAnneeActive: () =>
    apiClient.get<AnneeAcademique>('/academics/annees-academiques/active/'),
  
  getAnneesAcademiques: (params?: any) =>
    apiClient.get<ApiResponse<AnneeAcademique>>('/academics/annees-academiques/', params),
  
  // Classes
  getClasses: (params?: any) =>
    apiClient.get<ApiResponse<Classe>>('/academics/classes/', params),
  
  getClasse: (id: number) =>
    apiClient.get<Classe>(`/academics/classes/${id}/`),
  
  getClasseEtudiants: (id: number) =>
    apiClient.get<any[]>(`/academics/classes/${id}/etudiants/`),
  
  getClasseProgramme: (id: number) =>
    apiClient.get<any>(`/academics/classes/${id}/programme_pedagogique/`),
  
  getClasseResultatsSession: (id: number, params: { session: number }) =>
    apiClient.get<any>(`/academics/classes/${id}/resultats_session/`, params),
  
  // UEs
  getUEs: (params?: any) =>
    apiClient.get<ApiResponse<UE>>('/academics/ues/', params),
  
  getUE: (id: number) =>
    apiClient.get<UE>(`/academics/ues/${id}/`),
  
  getUEConfigurationEvaluations: (id: number) =>
    apiClient.get<any>(`/academics/ues/${id}/configuration_evaluations/`),
  
  // ECs
  getECs: (params?: any) =>
    apiClient.get<ApiResponse<EC>>('/academics/ecs/', params),
  
  getEC: (id: number) =>
    apiClient.get<EC>(`/academics/ecs/${id}/`),
  
  getECEnseignements: (id: number) =>
    apiClient.get<any[]>(`/academics/ecs/${id}/enseignements/`),
  
  // Sessions
  getSessions: () =>
    apiClient.get<ApiResponse<any>>('/academics/sessions/'),
  
  // Semestres
  getSemestres: () =>
    apiClient.get<ApiResponse<any>>('/academics/semestres/'),
  
  // Types d'évaluation
  getTypesEvaluation: () =>
    apiClient.get<ApiResponse<any>>('/academics/types-evaluation/'),
  
  // Configuration des évaluations
  configurerEC: (data: { ec_id: number; configurations: any[] }) =>
    apiClient.post<{ message: string }>('/academics/configurations-ec/configurer_ec/', data),
}

export const evaluationsApi = {
  // Enseignements
  getEnseignements: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/evaluations/enseignements/', params),
  
  getEnseignement: (id: number) =>
    apiClient.get<any>(`/evaluations/enseignements/${id}/`),
  
  getEnseignementEvaluations: (id: number) =>
    apiClient.get<any[]>(`/evaluations/enseignements/${id}/evaluations/`),
  
  getEnseignementEtudiants: (id: number) =>
    apiClient.get<any[]>(`/evaluations/enseignements/${id}/liste_etudiants/`),
  
  // Évaluations
  getEvaluations: (params?: any) =>
    apiClient.get<ApiResponse<Evaluation>>('/evaluations/evaluations/', params),
  
  getEvaluation: (id: number) =>
    apiClient.get<Evaluation>(`/evaluations/evaluations/${id}/`),
  
  createEvaluation: (data: any) =>
    apiClient.post<Evaluation>('/evaluations/evaluations/', data),
  
  updateEvaluation: (id: number, data: any) =>
    apiClient.put<Evaluation>(`/evaluations/evaluations/${id}/`, data),
  
  deleteEvaluation: (id: number) =>
    apiClient.delete(`/evaluations/evaluations/${id}/`),
  
  getFeuilleNotes: (id: number) =>
    apiClient.get<FeuilleNotes>(`/evaluations/evaluations/${id}/feuille_notes/`),
  
  saisirNotes: (id: number, notes: NoteInput[]) =>
    apiClient.post<{ message: string; erreurs: string[]; saisie_terminee: boolean }>(`/evaluations/evaluations/${id}/saisir_notes/`, { notes }),
  
  getStatistiquesEvaluation: (id: number) =>
    apiClient.get<any>(`/evaluations/evaluations/${id}/statistiques/`),
  
  // Notes
  getNotes: (params?: any) =>
    apiClient.get<ApiResponse<Note>>('/evaluations/notes/', params),
  
  getReleveNotesEtudiant: (params: { etudiant: number; session: number }) =>
    apiClient.get<any>('/evaluations/notes/releve_notes_etudiant/', params),
  
  // Moyennes EC
  getMoyennesEC: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/evaluations/moyennes-ec/', params),
  
  recalculerMoyennesEC: (data: { classe_id: number; session_id: number; ec_id?: number }) =>
    apiClient.post<{ message: string }>('/evaluations/moyennes-ec/recalculer_moyennes/', data),
  
  // Moyennes UE
  getMoyennesUE: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/evaluations/moyennes-ue/', params),
  
  recalculerMoyennesUE: (data: { classe_id: number; session_id: number }) =>
    apiClient.post<{ message: string }>('/evaluations/moyennes-ue/recalculer_moyennes/', data),
  
  // Moyennes Semestre
  getMoyennesSemestre: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/evaluations/moyennes-semestre/', params),
  
  getStatistiquesSemestre: (params: { classe: number; session: number }) =>
    apiClient.get<any>('/evaluations/moyennes-semestre/statistiques/', params),
  
  recalculerMoyennesSemestre: (data: { classe_id: number; session_id: number }) =>
    apiClient.post<{ message: string }>('/evaluations/moyennes-semestre/recalculer_moyennes/', data),
  
  getTableauNotesClasse: (params: { classe: number; session: number }) =>
    apiClient.get<any>('/evaluations/moyennes-semestre/tableau_notes_classe/', params),
}

export const usersApi = {
  // Utilisateurs
  getUsers: (params?: any) =>
    apiClient.get<ApiResponse<User>>('/auth/users/', params),
  
  getUserStatistiques: () =>
    apiClient.get<any>('/auth/users/statistiques/'),
  
  // Étudiants
  getEtudiants: (params?: any) =>
    apiClient.get<ApiResponse<Etudiant>>('/auth/etudiants/', params),
  
  getEtudiant: (id: number) =>
    apiClient.get<Etudiant>(`/auth/etudiants/${id}/`),
  
  getEtudiantNotesDetaillees: (id: number, params: { session: number }) =>
    apiClient.get<any>(`/auth/etudiants/${id}/notes_detaillees/`, params),
  
  getEtudiantParcoursAcademique: (id: number) =>
    apiClient.get<any>(`/auth/etudiants/${id}/parcours_academique/`),
  
  changerStatutEtudiant: (id: number, data: { statut_id: number; motif?: string }) =>
    apiClient.post<{ message: string }>(`/auth/etudiants/${id}/changer_statut/`, data),
  
  // Enseignants
  getEnseignants: (params?: any) =>
    apiClient.get<ApiResponse<Enseignant>>('/auth/enseignants/', params),
  
  getEnseignant: (id: number) =>
    apiClient.get<Enseignant>(`/auth/enseignants/${id}/`),
  
  getEnseignantEnseignements: (id: number) =>
    apiClient.get<any[]>(`/auth/enseignants/${id}/enseignements/`),
  
  getEnseignantPlanningEvaluations: (id: number, params?: { date_debut?: string; date_fin?: string }) =>
    apiClient.get<any[]>(`/auth/enseignants/${id}/planning_evaluations/`, params),
  
  getChargeTravailEnseignants: () =>
    apiClient.get<any[]>('/auth/enseignants/charge_travail/'),
  
  // Inscriptions
  getInscriptions: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/auth/inscriptions/', params),
  
  inscriptionMassive: (data: { classe_id: number; etudiants_ids: number[]; statut_id: number }) =>
    apiClient.post<{ message: string; erreurs: string[] }>('/auth/inscriptions/inscription_massive/', data),
  
  getStatistiquesClasse: (params: { classe: number }) =>
    apiClient.get<any>('/auth/inscriptions/statistiques_classe/', params),
  
  // Statuts étudiant
  getStatutsEtudiant: () =>
    apiClient.get<ApiResponse<any>>('/auth/statuts-etudiant/'),
  
  getStatutsUsageStatistics: () =>
    apiClient.get<any[]>('/auth/statuts-etudiant/usage_statistics/'),
  
  // Historique des statuts
  getHistoriqueStatuts: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/auth/historique-statuts/', params),
}

export const coreApi = {
  // Domaines
  getDomaines: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/core/domaines/', params),
  
  getDomaine: (id: number) =>
    apiClient.get<any>(`/core/domaines/${id}/`),
  
  getDomaineFilieres: (id: number) =>
    apiClient.get<any[]>(`/core/domaines/${id}/filieres/`),
  
  getDomainesStatistiques: () =>
    apiClient.get<any[]>('/core/domaines/statistiques/'),
  
  // Cycles
  getCycles: () =>
    apiClient.get<ApiResponse<any>>('/core/cycles/'),
  
  getCycleNiveaux: (id: number) =>
    apiClient.get<any[]>(`/core/cycles/${id}/niveaux/`),
  
  // Types de formation
  getTypesFormation: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/core/types-formation/', params),
  
  // Filières
  getFilieres: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/core/filieres/', params),
  
  getFiliere: (id: number) =>
    apiClient.get<any>(`/core/filieres/${id}/`),
  
  getFiliereOptions: (id: number) =>
    apiClient.get<any[]>(`/core/filieres/${id}/options/`),
  
  getFiliereClassesParNiveau: (id: number) =>
    apiClient.get<any>(`/core/filieres/${id}/classes_par_niveau/`),
  
  // Options
  getOptions: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/core/options/', params),
  
  // Niveaux
  getNiveaux: (params?: any) =>
    apiClient.get<ApiResponse<any>>('/core/niveaux/', params),
  
  getNiveauUEsParSemestre: (id: number) =>
    apiClient.get<any>(`/core/niveaux/${id}/ues_par_semestre/`),
}

export default apiClient