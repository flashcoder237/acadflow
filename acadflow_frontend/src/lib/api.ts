// ========================================
// FICHIER: src/lib/api.ts - Client API complet et corrigé
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
  TypeEvaluation,
  PaginatedResponse,
  ApiError
} from '@/types';

// Configuration de base
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Intercepteur pour ajouter le token
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

    // Intercepteur pour gérer les réponses
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
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
      const data = error.response.data;
      
      if (typeof data === 'string') {
        return { message: data, status: error.response.status };
      }
      
      if (data?.detail) {
        return { message: data.detail, status: error.response.status, errors: data };
      }
      
      if (data?.error) {
        return { message: data.error, status: error.response.status, errors: data };
      }
      
      // Gestion des erreurs de validation Django
      if (data && typeof data === 'object') {
        const firstError = Object.values(data)[0];
        const message = Array.isArray(firstError) 
          ? firstError[0] 
          : firstError || 'Erreur de validation';
        
        return {
          message: String(message),
          status: error.response.status,
          errors: data
        };
      }
      
      return {
        message: `Erreur ${error.response.status}`,
        status: error.response.status
      };
    } else if (error.request) {
      return { message: 'Problème de connexion au serveur', status: 0 };
    } else {
      return { message: error.message || 'Une erreur inattendue est survenue' };
    }
  }

  private async request<T>(config: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.request(config);
    return response.data;
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
  // DONNÉES DE BASE
  // ========================================

  async getEtablissementPrincipal(): Promise<Etablissement> {
    const response = await this.request<PaginatedResponse<Etablissement>>({
      method: 'GET',
      url: '/core/etablissements/',
      params: { etablissement_principal: true }
    });
    
    if (response.results.length === 0) {
      throw new Error('Aucun établissement principal configuré');
    }
    
    return response.results[0];
  }

  async getAnneeAcademiqueActive(): Promise<AnneeAcademique> {
    return this.request<AnneeAcademique>({
      method: 'GET',
      url: '/academics/annees-academiques/active/'
    });
  }

  async getSessions(): Promise<Session[]> {
    const response = await this.request<PaginatedResponse<Session>>({
      method: 'GET',
      url: '/academics/sessions/',
      params: { actif: true }
    });
    return response.results;
  }

  async getSemestres(): Promise<Semestre[]> {
    const response = await this.request<PaginatedResponse<Semestre>>({
      method: 'GET',
      url: '/academics/semestres/'
    });
    return response.results;
  }

  async getTypesEvaluation(): Promise<TypeEvaluation[]> {
    const response = await this.request<PaginatedResponse<TypeEvaluation>>({
      method: 'GET',
      url: '/academics/types-evaluation/',
      params: { actif: true }
    });
    return response.results;
  }

  // ========================================
  // ENSEIGNEMENTS
  // ========================================

  async getEnseignements(params?: Record<string, any>): Promise<PaginatedResponse<Enseignement>> {
    return this.request<PaginatedResponse<Enseignement>>({
      method: 'GET',
      url: '/evaluations/enseignements/',
      params: {
        page_size: 20,
        ...params
      }
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
      params: {
        page_size: 20,
        ordering: '-date_evaluation',
        ...params
      }
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
  // STATISTIQUES
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

  // ========================================
  // IMPORT/EXPORT
  // ========================================

  async importerNotes(evaluationId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    return this.request<any>({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluationId}/importer_notes/`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  }

  async exporterNotes(evaluationId: number, format: 'xlsx' | 'csv' | 'pdf'): Promise<Blob> {
    const response = await this.client.request({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluationId}/exporter_notes/`,
      params: { format },
      responseType: 'blob'
    });
    
    return response.data;
  }

  // ========================================
  // DASHBOARD STATISTIQUES
  // ========================================

  async getDashboardStats(): Promise<any> {
    try {
      const [enseignements, evaluations] = await Promise.all([
        this.getEnseignements({ page_size: 100 }),
        this.getEvaluations({ page_size: 100 })
      ]);

      const evaluationsEnAttente = evaluations.results.filter(e => !e.saisie_terminee);
      const evaluationsTerminees = evaluations.results.filter(e => e.saisie_terminee);

      return {
        totalEnseignements: enseignements.count,
        totalEvaluations: evaluations.count,
        evaluationsEnAttente: evaluationsEnAttente.length,
        evaluationsTerminees: evaluationsTerminees.length,
        evaluationsRecentes: evaluations.results.slice(0, 5),
        enseignementsRecents: enseignements.results.slice(0, 5),
        tauxSaisie: evaluations.count > 0 
          ? Math.round((evaluationsTerminees.length / evaluations.count) * 100)
          : 0
      };
    } catch (error) {
      console.error('Erreur lors du chargement des stats dashboard:', error);
      return {
        totalEnseignements: 0,
        totalEvaluations: 0,
        evaluationsEnAttente: 0,
        evaluationsTerminees: 0,
        evaluationsRecentes: [],
        enseignementsRecents: [],
        tauxSaisie: 0
      };
    }
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  async healthCheck(): Promise<boolean> {
    try {
      await this.request<any>({
        method: 'GET',
        url: '/health/',
        timeout: 5000
      });
      return true;
    } catch (error) {
      return false;
    }
  }
}

// Instance unique du client API
export const apiClient = new ApiClient();

// Export des méthodes principales
export const {
  login,
  logout,
  getCurrentUser,
  getEtablissementPrincipal,
  getAnneeAcademiqueActive,
  getSessions,
  getSemestres,
  getTypesEvaluation,
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
  importerNotes,
  exporterNotes,
  getDashboardStats,
  healthCheck
} = apiClient;

export default apiClient;