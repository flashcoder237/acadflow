// ========================================
// FICHIER: src/lib/teacherApi.ts - API spécifique aux enseignants
// ========================================

import { apiClient } from './api';
import {
  StatistiquesEnseignant,
  ValidationNotes,
  GestionAbsence,
  ExportOptions,
  EnseignantFilters,
  EtudiantDetails,
  NotificationEnseignant,
  PlanningEnseignant,
  HistoriqueModification,
  RapportEnseignant
} from '@/types/teacher';
import { PaginatedResponse } from '@/types';

class TeacherApiClient {
  // ========================================
  // STATISTIQUES ENSEIGNANT
  // ========================================

  async getStatistiquesEnseignant(filters?: EnseignantFilters): Promise<StatistiquesEnseignant> {
    return apiClient.request({
      method: 'GET',
      url: '/evaluations/enseignants/statistiques/',
      params: filters
    });
  }

  async getPerformancesParEC(enseignant_id: number, params?: any): Promise<any[]> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/${enseignant_id}/performances-ec/`,
      params
    });
  }

  // ========================================
  // GESTION DES ÉTUDIANTS
  // ========================================

  async getEtudiantsEnseignant(params?: EnseignantFilters): Promise<PaginatedResponse<EtudiantDetails>> {
    return apiClient.request({
      method: 'GET',
      url: '/evaluations/enseignants/etudiants/',
      params: {
        page_size: 50,
        ...params
      }
    });
  }

  async getDetailsEtudiant(etudiant_id: number, enseignant_id: number): Promise<EtudiantDetails> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/${enseignant_id}/etudiants/${etudiant_id}/`
    });
  }

  async getNotesEtudiantParEnseignant(
    etudiant_id: number, 
    enseignant_id: number,
    params?: { session?: number; semestre?: number }
  ): Promise<any> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/${enseignant_id}/etudiants/${etudiant_id}/notes/`,
      params
    });
  }

  // ========================================
  // GESTION DES ABSENCES
  // ========================================

  async marquerAbsence(data: GestionAbsence): Promise<any> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });

    return apiClient.request({
      method: 'POST',
      url: '/evaluations/absences/',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  }

  async getAbsencesEvaluation(evaluation_id: number): Promise<GestionAbsence[]> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluation_id}/absences/`
    });
  }

  async justifierAbsence(absence_id: number, data: {
    justifie: boolean;
    motif?: string;
    document?: File;
  }): Promise<any> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else {
        formData.append(key, String(value));
      }
    });

    return apiClient.request({
      method: 'PATCH',
      url: `/evaluations/absences/${absence_id}/justifier/`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  }

  // ========================================
  // VALIDATION DES NOTES
  // ========================================

  async validerNotes(data: ValidationNotes): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${data.evaluation_id}/valider/`,
      data: {
        validation_notes: data.validation_notes,
        commentaire_validation: data.commentaire_validation
      }
    });
  }

  async annulerValidation(evaluation_id: number, raison: string): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/annuler-validation/`,
      data: { raison }
    });
  }

  async getStatutValidation(evaluation_id: number): Promise<{
    validee: boolean;
    date_validation?: string;
    validee_par?: string;
    commentaire?: string;
    peut_annuler: boolean;
  }> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluation_id}/statut-validation/`
    });
  }

  // ========================================
  // EXPORT DES DONNÉES
  // ========================================

  async exporterDonnees(options: ExportOptions): Promise<Blob> {
    const response = await apiClient.client.request({
      method: 'POST',
      url: '/evaluations/enseignants/export/',
      data: options,
      responseType: 'blob'
    });
    
    return response.data;
  }

  async exporterFeuillePresence(evaluation_id: number, format: 'xlsx' | 'pdf'): Promise<Blob> {
    const response = await apiClient.client.request({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluation_id}/feuille-presence/`,
      params: { format },
      responseType: 'blob'
    });
    
    return response.data;
  }

  async exporterReleveNotes(
    etudiant_id: number, 
    session_id: number, 
    format: 'pdf' | 'xlsx'
  ): Promise<Blob> {
    const response = await apiClient.client.request({
      method: 'GET',
      url: `/evaluations/etudiants/${etudiant_id}/releve-notes/`,
      params: { session: session_id, format },
      responseType: 'blob'
    });
    
    return response.data;
  }

  // ========================================
  // PLANNING ET NOTIFICATIONS
  // ========================================

  async getPlanningEnseignant(enseignant_id: number): Promise<PlanningEnseignant> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/${enseignant_id}/planning/`
    });
  }

  async getNotificationsEnseignant(enseignant_id: number): Promise<NotificationEnseignant[]> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/${enseignant_id}/notifications/`
    });
  }

  async marquerNotificationLue(notification_id: string): Promise<any> {
    return apiClient.request({
      method: 'PATCH',
      url: `/evaluations/notifications/${notification_id}/`,
      data: { lue: true }
    });
  }

  // ========================================
  // HISTORIQUE ET MODIFICATIONS
  // ========================================

  async getHistoriqueModifications(
    enseignant_id: number,
    params?: { evaluation?: number; etudiant?: number; date_debut?: string; date_fin?: string }
  ): Promise<PaginatedResponse<HistoriqueModification>> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/${enseignant_id}/historique-modifications/`,
      params
    });
  }

  async demanderModificationNote(data: {
    note_id: number;
    nouvelle_note?: number;
    nouveau_statut_absence?: boolean;
    raison_modification: string;
  }): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: '/evaluations/demandes-modification/',
      data
    });
  }

  // ========================================
  // RAPPORTS
  // ========================================

  async genererRapportEnseignant(
    enseignant_id: number,
    params: {
      session_id: number;
      semestre_id?: number;
      date_debut?: string;
      date_fin?: string;
    }
  ): Promise<RapportEnseignant> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/enseignants/${enseignant_id}/rapport/`,
      data: params
    });
  }

  async exporterRapport(
    enseignant_id: number,
    rapport_id: string,
    format: 'pdf' | 'xlsx'
  ): Promise<Blob> {
    const response = await apiClient.client.request({
      method: 'GET',
      url: `/evaluations/enseignants/${enseignant_id}/rapports/${rapport_id}/export/`,
      params: { format },
      responseType: 'blob'
    });
    
    return response.data;
  }

  // ========================================
  // CALCULS ET MOYENNES
  // ========================================

  async recalculerMoyennes(params: {
    enseignement_id: number;
    session_id: number;
    force_recalcul?: boolean;
  }): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: '/evaluations/recalculer-moyennes/',
      data: params
    });
  }

  async previsualiserMoyennes(enseignement_id: number, session_id: number): Promise<{
    moyennes_ec: any[];
    moyennes_ue: any[];
    statistiques: any;
  }> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignements/${enseignement_id}/previsualiser-moyennes/`,
      params: { session: session_id }
    });
  }

  // ========================================
  // UTILITAIRES
  // ========================================

  async verifierCoherence(evaluation_id: number): Promise<{
    erreurs: string[];
    avertissements: string[];
    suggestions: string[];
  }> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluation_id}/verifier-coherence/`
    });
  }

  async obtenirAideContextuelle(section: string): Promise<{
    titre: string;
    contenu: string;
    liens_utiles: Array<{ label: string; url: string }>;
  }> {
    return apiClient.request({
      method: 'GET',
      url: '/evaluations/aide-contextuelle/',
      params: { section }
    });
  }

  // ========================================
  // TEMPLATES ET MODÈLES
  // ========================================

  async obtenirTemplateImport(type: 'notes' | 'absences' | 'etudiants'): Promise<Blob> {
    const response = await apiClient.client.request({
      method: 'GET',
      url: '/evaluations/templates/import/',
      params: { type },
      responseType: 'blob'
    });
    
    return response.data;
  }
}

export const teacherApi = new TeacherApiClient();
export default teacherApi;