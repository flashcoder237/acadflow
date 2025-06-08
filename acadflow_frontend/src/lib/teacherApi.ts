// ========================================
// FICHIER: src/lib/teacherApi.ts - Mise à jour avec les nouvelles routes
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
  // GESTION DES ÉTUDIANTS - NOUVELLE SECTION
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

  async getDetailsEtudiant(etudiant_id: number, params?: { session?: number; semestre?: number }): Promise<EtudiantDetails> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/etudiants/${etudiant_id}/details/`,
      params
    });
  }

  async getStatistiquesEtudiants(): Promise<{
    total_etudiants: number;
    repartition_par_niveau: Array<{ niveau: string; nombre: number }>;
    repartition_par_classe: Array<{ classe: string; nombre: number }>;
  }> {
    return apiClient.request({
      method: 'GET',
      url: '/evaluations/enseignants/etudiants/statistiques/'
    });
  }

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

  // ========================================
  // MÉTHODES POUR LA RECHERCHE ET FILTRAGE D'ÉTUDIANTS
  // ========================================

  async rechercherEtudiants(query: string, filters?: {
    classe?: number;
    niveau?: string;
    statut?: string;
  }): Promise<PaginatedResponse<EtudiantDetails>> {
    return this.getEtudiantsEnseignant({
      search: query,
      ...filters
    });
  }

  async getEtudiantsParClasse(classe_id: number): Promise<PaginatedResponse<EtudiantDetails>> {
    return this.getEtudiantsEnseignant({
      classe: classe_id
    });
  }

  async getEtudiantsParEC(ec_id: number): Promise<PaginatedResponse<EtudiantDetails>> {
    return this.getEtudiantsEnseignant({
      ec: ec_id
    });
  }

  // ========================================
  // MÉTHODES POUR LES MOYENNES ET NOTES
  // ========================================

  async getNotesEtudiantParEnseignant(
    etudiant_id: number, 
    params?: { session?: number; semestre?: number }
  ): Promise<any> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/etudiants/${etudiant_id}/details/`,
      params
    });
  }

  async getMoyennesEtudiantToutes(etudiant_id: number, session_id?: number): Promise<{
    moyennes_ec: any[];
    moyennes_ue: any[];
    moyenne_generale: number;
    statistiques: any;
  }> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/etudiants/${etudiant_id}/moyennes/`,
      params: { session: session_id }
    });
  }

  // ========================================
  // GESTION AVANCÉE DES ÉVALUATIONS
  // ========================================

  async dupliquerEvaluation(evaluation_id: number, nouveaux_params: {
    nom?: string;
    date_evaluation?: string;
    classe_id?: number;
  }): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/dupliquer/`,
      data: nouveaux_params
    });
  }

  async programmerEvaluation(data: {
    nom: string;
    enseignement_id: number;
    type_evaluation_id: number;
    date_evaluation: string;
    date_limite_saisie?: string;
    note_sur: number;
    instructions?: string;
  }): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: '/evaluations/evaluations/programmer/',
      data
    });
  }

  async annulerEvaluation(evaluation_id: number, raison: string): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/annuler/`,
      data: { raison }
    });
  }

  // ========================================
  // GESTION DES DÉLAIS ET NOTIFICATIONS
  // ========================================

  async prolongerDelaiSaisie(evaluation_id: number, nouveaux_jours: number): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/prolonger-delai/`,
      data: { jours_supplementaires: nouveaux_jours }
    });
  }

  async demanderProlongationDelai(evaluation_id: number, justification: string): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/demander-prolongation/`,
      data: { justification }
    });
  }

  async getEvaluationsEnRetard(): Promise<any[]> {
    return apiClient.request({
      method: 'GET',
      url: '/evaluations/evaluations/en-retard/'
    });
  }

  async getEvaluationsUrgentes(jours_limite: number = 3): Promise<any[]> {
    return apiClient.request({
      method: 'GET',
      url: '/evaluations/evaluations/urgentes/',
      params: { jours_limite }
    });
  }

  // ========================================
  // ANALYTICS ET COMPARAISONS
  // ========================================

  async comparerPerformancesClasses(params: {
    classes_ids: number[];
    session_id: number;
    ec_id?: number;
  }): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: '/evaluations/analytics/comparer-classes/',
      data: params
    });
  }

  async getEvolutionMoyennes(params: {
    etudiant_id: number;
    periode_debut: string;
    periode_fin: string;
  }): Promise<any> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/analytics/evolution-moyennes/`,
      params
    });
  }

  async getTendancesResultats(enseignant_id: number, annees?: number): Promise<any> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/enseignants/${enseignant_id}/tendances/`,
      params: { annees }
    });
  }

  // ========================================
  // IMPORT/EXPORT AVANCÉ
  // ========================================

  async importerNotesDepuisFichier(evaluation_id: number, fichier: File, options?: {
    format: 'xlsx' | 'csv';
    mapping_colonnes?: Record<string, string>;
    ignorer_erreurs?: boolean;
  }): Promise<{
    success: boolean;
    notes_importees: number;
    erreurs: string[];
    avertissements: string[];
  }> {
    const formData = new FormData();
    formData.append('fichier', fichier);
    
    if (options) {
      formData.append('options', JSON.stringify(options));
    }

    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/importer-notes/`,
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  }

  async exporterNotesPersonnalise(params: {
    evaluation_ids?: number[];
    classe_id?: number;
    format: 'xlsx' | 'csv' | 'pdf';
    inclure_statistiques?: boolean;
    inclure_graphiques?: boolean;
    template?: string;
  }): Promise<Blob> {
    const response = await apiClient.client.request({
      method: 'POST',
      url: '/evaluations/export/personnalise/',
      data: params,
      responseType: 'blob'
    });
    
    return response.data;
  }

  // ========================================
  // COLLABORATION ET PARTAGE
  // ========================================

  async partagerEvaluation(evaluation_id: number, data: {
    enseignants_ids: number[];
    permissions: ('lecture' | 'modification' | 'saisie_notes')[];
    message?: string;
  }): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/partager/`,
      data
    });
  }

  async accepterPartage(partage_id: string): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/partages/${partage_id}/accepter/`
    });
  }

  async refuserPartage(partage_id: string, raison?: string): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/partages/${partage_id}/refuser/`,
      data: { raison }
    });
  }

  // ========================================
  // SAUVEGARDE ET SYNCHRONISATION
  // ========================================

  async sauvegarderBrouillon(evaluation_id: number, notes_temporaires: any[]): Promise<any> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/sauvegarder-brouillon/`,
      data: { notes: notes_temporaires }
    });
  }

  async chargerBrouillon(evaluation_id: number): Promise<{
    notes: any[];
    derniere_sauvegarde: string;
  }> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluation_id}/brouillon/`
    });
  }

  async synchroniserDonnees(): Promise<{
    mises_a_jour: number;
    conflits: any[];
    derniere_sync: string;
  }> {
    return apiClient.request({
      method: 'POST',
      url: '/evaluations/synchroniser/'
    });
  }

  // ========================================
  // OUTILS D'AIDE À LA CORRECTION
  // ========================================

  async genererGrilleCorrection(evaluation_id: number, params?: {
    nombre_criteres?: number;
    types_questions?: string[];
    bareme_detaille?: boolean;
  }): Promise<{
    grille: any;
    suggestions: string[];
  }> {
    return apiClient.request({
      method: 'POST',
      url: `/evaluations/evaluations/${evaluation_id}/grille-correction/`,
      data: params
    });
  }

  async detecterAnomalies(evaluation_id: number): Promise<{
    anomalies_detectees: any[];
    recommandations: string[];
    niveau_confiance: number;
  }> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluation_id}/detecter-anomalies/`
    });
  }

  async suggererAmeliorations(evaluation_id: number): Promise<{
    suggestions_pedagogiques: string[];
    suggestions_techniques: string[];
    ressources_utiles: Array<{ titre: string; url: string }>;
  }> {
    return apiClient.request({
      method: 'GET',
      url: `/evaluations/evaluations/${evaluation_id}/suggestions-ameliorations/`
    });
  }

  // ========================================
  // MÉTHODES UTILITAIRES
  // ========================================

  async verifierConnexionServeur(): Promise<boolean> {
    try {
      await apiClient.request({
        method: 'GET',
        url: '/evaluations/health/',
        timeout: 5000
      });
      return true;
    } catch {
      return false;
    }
  }

  async obtenirVersionAPI(): Promise<{
    version: string;
    date_mise_a_jour: string;
    fonctionnalites: string[];
  }> {
    return apiClient.request({
      method: 'GET',
      url: '/evaluations/version/'
    });
  }

  async signalerProbleme(data: {
    type: 'bug' | 'suggestion' | 'question';
    description: string;
    contexte?: any;
    capture_ecran?: File;
  }): Promise<{
    ticket_id: string;
    message: string;
  }> {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value instanceof File) {
        formData.append(key, value);
      } else if (typeof value === 'object') {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, String(value));
      }
    });

    return apiClient.request({
      method: 'POST',
      url: '/evaluations/signaler-probleme/',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      }
    });
  }
}

export const teacherApi = new TeacherApiClient();

// Export des méthodes principales pour faciliter l'importation
export const {
  getEtudiantsEnseignant,
  getDetailsEtudiant,
  getStatistiquesEtudiants,
  getStatistiquesEnseignant,
  marquerAbsence,
  validerNotes,
  exporterDonnees,
  exporterFeuillePresence,
  importerNotesDepuisFichier,
  recalculerMoyennes,
  verifierCoherence,
  rechercherEtudiants,
  getEtudiantsParClasse,
  getEtudiantsParEC,
  prolongerDelaiSaisie,
  getEvaluationsEnRetard,
  getEvaluationsUrgentes,
  sauvegarderBrouillon,
  chargerBrouillon,
  synchroniserDonnees
} = teacherApi;

export default teacherApi;