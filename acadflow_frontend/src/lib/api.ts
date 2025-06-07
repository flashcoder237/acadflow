// ========================================
// FICHIER: src/lib/api.ts - Client API
// ========================================

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { 
  LoginRequest, 
  LoginResponse, 
  User,
  Etablissement,
  AnneeAcademique,
  Session,
  Semestre,
  Enseignement,
  Evaluation,
  Note,
  FeuilleNotes,
  SaisieNotesRequest,
  StatistiquesEvaluation,
  CreateEvaluationRequest,
  UpdateEvaluationRequest,
  MoyenneEC,
  MoyenneUE,
  MoyenneSemestre,
  PaginatedResponse,
  ApiError
} from '@/types';

// Configuration de base d'Axios
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token d'authentification
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('acadflow_token');
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs de réponse
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Token expiré ou invalide
          localStorage.removeItem('acadflow_token');
          localStorage.removeItem('acadflow_user');
          window.location.href = '/login';
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || error.response.data?.detail || 'Une erreur est survenue',
        status: error.response.status,
        errors: error.response.data?.errors || error.response.data
      };
    } else if (error.request) {
      return {
        message: 'Problème de connexion au serveur',
        status: 0
      };
    } else {
      return {
        message: error.message || 'Une erreur inattendue est survenue'
      };
    }
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.request(config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  // ========================================
  // AUTHENTIFICATION
  // ========================================

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>({
      method: 'POST',
      url: '/auth/login/',
      data: credentials
    });
  }

  async logout(): Promise<void> {
    return this.request<void>({
      method: 'POST',
      url: '/auth/logout/'
    });
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>({
      method: 'GET',
      url: '/auth/users/me/'
    });
  }

  // ========================================
  // ÉTABLISSEMENT ET CONFIGURATION
  // ========================================

  async getEtablissementPrincipal(): Promise<Etablissement> {
    const etablissements = await this.request<Etablissement[]>({
      method: 'GET',
      url: '/core/etablissements/?etablissement_principal=true'
    });
    
    if (etablissements.length === 0) {
      throw new Error('Aucun établissement principal configuré');
    }
    
    return etablissements[0];
  }

  async getEtablissementPublic(): Promise<Etablissement> {
    return this.request<Etablissement>({
      method: 'GET',
      url: '/core/etablissements/public/'
    });
  }

  // ========================================
  // DONNÉES ACADÉMIQUES
  // ========================================

  async getAnneeAcademiqueActive(): Promise<AnneeAcademique> {
    return this.request<AnneeAcademique>({
      method: 'GET',
      url: '/academics/annees-academiques/active/'
    });
  }

  async getSessions(): Promise<Session[]> {
    return this.request<Session[]>({
      method: 'GET',
      url: '/academics/sessions/'
    });
  }

  async getSemestres(): Promise<Semestre[]> {
    return this.request<Semestre[]>({
      method: 'GET',
      url: '/academics/semestres/'
    });
  }

  // ========================================
  // ENSEIGNEMENTS (pour enseignants)
  // ========================================

  async getEnseignements(params?: Record<string, any>): Promise<PaginatedResponse<Enseignement>> {
    return this.request<PaginatedResponse<Enseignement>>({
      method: 'GET',
      url: '/evaluations/enseignements/',
      params
    });
  }

  async getEnseignement(id: number): Promise<Enseignement> {
    return this.request<Enseignement>({
      method: 'GET',
      url: `/evaluations/enseignements/${id}/`
    });
  }

  async getEnseignementEvaluations(enseignementId: number): Promise<Evaluation[]> {
    return this.request<Evaluation[]>({
      method: 'GET',
      url: `/evaluations/enseignements/${enseignementId}/evaluations/`
    });
  }

  async getEnseignementEtudiants(enseignementId: number): Promise<any[]> {
    return this.request<any[]>({
      method: 'GET',
      url: `/evaluations/enseignements/${enseignementId}/liste_etudiants/`
    });
  }

  // ========================================
  // ÉVALUATIONS
  // ========================================

  async getEvaluations(params?: Record<string, any>): Promise<PaginatedResponse<Evaluation>> {
    return this.request<PaginatedResponse<Evaluation>>({
      method: 'GET',
      url: '/evaluations/evaluations/',
      params
    });
  }

  async getEvaluation(id: number): Promise<Evaluation> {
    return this.request<Evaluation>({
      method: 'GET',
      url: `/evaluations/evaluations/${id}/`
    });
  }

  async createEvaluation(data: CreateEvaluationRequest): Promise<Evaluation> {
    return this.request<Evaluation>({
      method: 'POST',
      url: '/evaluations/evaluations/',
      data
    });
  }

  async updateEvaluation(id: number, data: Partial<UpdateEvaluationRequest>): Promise<Evaluation> {
    return this.request<Evaluation>({
      method: 'PATCH',
      url: `/evaluations/evaluations/${id}/`,
      data
    });
  }

  async deleteEvaluation(id: number): Promise<void> {
    return this.request<void>({
      method: 'DELETE',
      url: `/evaluations/evaluations/${id}/`
    });
  }

  // ========================================
  // FEUILLE DE NOTES
  // ========================================

  async getFeuilleNotes(evaluationId: number): Promise<FeuilleNotes> {
    return this.request<FeuilleNotes>({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluationId}/feuille_notes/`
    });
  }

  async saisirNotes(evaluationId: number, data: SaisieNotesRequest): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluationId}/saisir_notes/`,
      data
    });
  }

  // ========================================
  // STATISTIQUES ÉVALUATIONS
  // ========================================

  async getStatistiquesEvaluation(evaluationId: number): Promise<StatistiquesEvaluation> {
    return this.request<StatistiquesEvaluation>({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluationId}/statistiques/`
    });
  }

  async verifierDelaiSaisie(evaluationId: number): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluationId}/verifier_delai_saisie/`
    });
  }

  async autoriserModification(evaluationId: number, autoriser: boolean): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluationId}/autoriser_modification/`,
      data: { autoriser }
    });
  }

  async prolongerDelai(evaluationId: number, jours: number): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluationId}/prolonger_delai/`,
      data: { jours }
    });
  }

  // ========================================
  // NOTES
  // ========================================

  async getNotes(params?: Record<string, any>): Promise<PaginatedResponse<Note>> {
    return this.request<PaginatedResponse<Note>>({
      method: 'GET',
      url: '/evaluations/notes/',
      params
    });
  }

  async getNote(id: number): Promise<Note> {
    return this.request<Note>({
      method: 'GET',
      url: `/evaluations/notes/${id}/`
    });
  }

  async updateNote(id: number, data: Partial<Note>): Promise<Note> {
    return this.request<Note>({
      method: 'PATCH',
      url: `/evaluations/notes/${id}/`,
      data
    });
  }

  async getReleveNotesEtudiant(etudiantId: number, sessionId: number): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: '/evaluations/notes/releve_notes_etudiant/',
      params: { etudiant: etudiantId, session: sessionId }
    });
  }

  // ========================================
  // MOYENNES
  // ========================================

  async getMoyennesEC(params?: Record<string, any>): Promise<PaginatedResponse<MoyenneEC>> {
    return this.request<PaginatedResponse<MoyenneEC>>({
      method: 'GET',
      url: '/evaluations/moyennes-ec/',
      params
    });
  }

  async getMoyennesUE(params?: Record<string, any>): Promise<PaginatedResponse<MoyenneUE>> {
    return this.request<PaginatedResponse<MoyenneUE>>({
      method: 'GET',
      url: '/evaluations/moyennes-ue/',
      params
    });
  }

  async getMoyennesSemestre(params?: Record<string, any>): Promise<PaginatedResponse<MoyenneSemestre>> {
    return this.request<PaginatedResponse<MoyenneSemestre>>({
      method: 'GET',
      url: '/evaluations/moyennes-semestre/',
      params
    });
  }

  async recalculerMoyennesEC(classeId: number, sessionId: number, ecId?: number): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/evaluations/moyennes-ec/recalculer_moyennes/',
      data: { classe_id: classeId, session_id: sessionId, ec_id: ecId }
    });
  }

  async recalculerMoyennesUE(classeId: number, sessionId: number): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/evaluations/moyennes-ue/recalculer_moyennes/',
      data: { classe_id: classeId, session_id: sessionId }
    });
  }

  async recalculerMoyennesSemestre(classeId: number, sessionId: number): Promise<any> {
    return this.request<any>({
      method: 'POST',
      url: '/evaluations/moyennes-semestre/recalculer_moyennes/',
      data: { classe_id: classeId, session_id: sessionId }
    });
  }

  // ========================================
  // STATISTIQUES ET TABLEAUX
  // ========================================

  async getStatistiquesClasse(classeId: number, sessionId: number): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: '/evaluations/moyennes-semestre/statistiques/',
      params: { classe: classeId, session: sessionId }
    });
  }

  async getTableauNotesClasse(classeId: number, sessionId: number): Promise<any> {
    return this.request<any>({
      method: 'GET',
      url: '/evaluations/moyennes-semestre/tableau_notes_classe/',
      params: { classe: classeId, session: sessionId }
    });
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  async uploadFile(file: File, endpoint: string): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request<any>({
      method: 'POST',
      url: endpoint,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }

  async downloadFile(url: string): Promise<Blob> {
    const response = await this.client.get(url, {
      responseType: 'blob'
    });
    return response.data;
  }
}

// Instance unique du client API
export const apiClient = new ApiClient();

// Export des méthodes principales pour faciliter l'utilisation
export const {
  login,
  logout,
  getCurrentUser,
  getEtablissementPrincipal,
  getEtablissementPublic,
  getAnneeAcademiqueActive,
  getSessions,
  getSemestres,
  getEnseignements,
  getEnseignement,
  getEnseignementEvaluations,
  getEnseignementEtudiants,
  getEvaluations,
  getEvaluation,
  createEvaluation,
  updateEvaluation,
  deleteEvaluation,
  getFeuilleNotes,
  saisirNotes,
  getStatistiquesEvaluation,
  verifierDelaiSaisie,
  autoriserModification,
  prolongerDelai,
  getNotes,
  getNote,
  updateNote,
  getReleveNotesEtudiant,
  getMoyennesEC,
  getMoyennesUE,
  getMoyennesSemestre,
  recalculerMoyennesEC,
  recalculerMoyennesUE,
  recalculerMoyennesSemestre,
  getStatistiquesClasse,
  getTableauNotesClasse,
  uploadFile,
  downloadFile
} = apiClient;

export default apiClient;