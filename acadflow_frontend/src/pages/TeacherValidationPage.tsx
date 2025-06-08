// ========================================
// FICHIER: src/pages/TeacherValidationPage.tsx - Validation des notes par l'enseignant
// ========================================

import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  ArrowLeft,
  Users,
  BarChart3,
  TrendingUp,
  Award,
  Clock,
  FileText,
  MessageSquare,
  Lock,
  Unlock,
  Eye,
  Download,
  RefreshCw,
  Target,
  Info,
  Loader2,
  Calendar,
  UserCheck,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationActions } from '@/stores/appStore';
import { teacherApi } from '@/lib/teacherApi';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { Evaluation, StatistiquesEvaluation } from '@/types';

const TeacherValidationPage: React.FC = () => {
  const { id: evaluationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError, showWarning } = useNotificationActions();

  // États locaux
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [validationComment, setValidationComment] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [validating, setValidating] = useState(false);

  // New states for import/export
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; notes_importees?: number; erreurs?: string[]; avertissements?: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handler to download the feuille de presence
  const handleDownloadFeuillePresence = async (format: 'xlsx' | 'pdf') => {
    if (!evaluationId) return;
    try {
      const blob = await teacherApi.exporterFeuillePresence(parseInt(evaluationId), format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `feuille_presence_${evaluationId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Téléchargement réussi', `Feuille de présence téléchargée en format ${format.toUpperCase()}`);
    } catch (error) {
      showError('Erreur de téléchargement', 'Impossible de télécharger la feuille de présence');
    }
  };

  // Handler to import notes from file
  const handleImportNotes = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!evaluationId) return;
    const files = event.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    setImporting(true);
    setImportResult(null);
    try {
      const result = await teacherApi.importerNotesDepuisFichier(parseInt(evaluationId), file, { format: file.name.endsWith('.csv') ? 'csv' : 'xlsx' });
      setImportResult(result);
      if (result.success) {
        showSuccess('Import réussi', `${result.notes_importees} notes importées avec succès`);
        queryClient.invalidateQueries({ queryKey: ['evaluation-validation', evaluationId] });
      } else {
        showWarning('Import partiel', `Import partiel avec ${result.erreurs?.length || 0} erreurs`);
      }
    } catch (error) {
      showError('Erreur d\'import', 'Impossible d\'importer les notes');
    } finally {
      setImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Query pour charger l'évaluation
  const { data: evaluation, isLoading: loadingEvaluation, error } = useQuery({
    queryKey: ['evaluation-validation', evaluationId],
    queryFn: () => {
      if (!evaluationId) throw new Error('ID d\'évaluation manquant');
      return apiClient.getEvaluation(parseInt(evaluationId));
    },
    enabled: !!evaluationId
  });

  // Query pour les statistiques de l'évaluation
  const { data: stats, isLoading: loadingStats } = useQuery({
    queryKey: ['evaluation-stats', evaluationId],
    queryFn: () => {
      if (!evaluationId) throw new Error('ID d\'évaluation manquant');
      return apiClient.getStatistiquesEvaluation(parseInt(evaluationId));
    },
    enabled: !!evaluationId && !!evaluation?.saisie_terminee
  });

  // Query pour vérifier le statut de validation
  const { data: validationStatus, isLoading: loadingStatus } = useQuery({
    queryKey: ['validation-status', evaluationId],
    queryFn: () => {
      if (!evaluationId) throw new Error('ID d\'évaluation manquant');
      return teacherApi.getStatutValidation(parseInt(evaluationId));
    },
    enabled: !!evaluationId
  });

  // Query pour charger la feuille de notes (pour aperçu)
  const { data: feuilleNotes } = useQuery({
    queryKey: ['feuille-notes-validation', evaluationId],
    queryFn: () => {
      if (!evaluationId) throw new Error('ID d\'évaluation manquant');
      return apiClient.getFeuilleNotes(parseInt(evaluationId));
    },
    enabled: !!evaluationId && !!evaluation?.saisie_terminee
  });

  // Mutation pour valider les notes
  const validateMutation = useMutation({
    mutationFn: (data: { validation_notes: boolean; commentaire_validation?: string }) => {
      if (!evaluationId) throw new Error('ID d\'évaluation manquant');
      return teacherApi.validerNotes({
        evaluation_id: parseInt(evaluationId),
        validation_notes: data.validation_notes,
        commentaire_validation: data.commentaire_validation
      });
    },
    onSuccess: () => {
      showSuccess('Validation réussie', 'Les notes ont été validées avec succès');
      queryClient.invalidateQueries({ queryKey: ['validation-status', evaluationId] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-validation', evaluationId] });
      setShowValidationDialog(false);
      setValidationComment('');
    },
    onError: (error: any) => {
      showError('Erreur de validation', error.message || 'Impossible de valider les notes');
    }
  });

  // Mutation pour annuler la validation
  const cancelValidationMutation = useMutation({
    mutationFn: (raison: string) => {
      if (!evaluationId) throw new Error('ID d\'évaluation manquant');
      return teacherApi.annulerValidation(parseInt(evaluationId), raison);
    },
    onSuccess: () => {
      showSuccess('Validation annulée', 'La validation des notes a été annulée');
      queryClient.invalidateQueries({ queryKey: ['validation-status', evaluationId] });
      queryClient.invalidateQueries({ queryKey: ['evaluation-validation', evaluationId] });
      setShowCancelDialog(false);
      setCancelReason('');
    },
    onError: (error: any) => {
      showError('Erreur d\'annulation', error.message || 'Impossible d\'annuler la validation');
    }
  });

  // Handlers
  const handleValidate = async () => {
    setValidating(true);
    try {
      await validateMutation.mutateAsync({
        validation_notes: true,
        commentaire_validation: validationComment.trim() || undefined
      });
    } finally {
      setValidating(false);
    }
  };

  const handleCancelValidation = async () => {
    if (!cancelReason.trim()) {
      showError('Raison requise', 'Veuillez indiquer la raison de l\'annulation');
      return;
    }

    try {
      await cancelValidationMutation.mutateAsync(cancelReason.trim());
    } catch (error) {
      // L'erreur est gérée dans onError
    }
  };

  const handleExportValidation = async () => {
    try {
      const blob = await teacherApi.exporterDonnees({
        format: 'pdf',
        type: 'notes',
        evaluation_id: parseInt(evaluationId!)
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `validation_${evaluation?.nom}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Export réussi', 'Document de validation exporté');
    } catch (error) {
      showError('Erreur d\'export', 'Impossible d\'exporter le document');
    }
  };

  // Calculs dérivés
  const totalEtudiants = feuilleNotes?.etudiants.length || 0;
  const notesSaisies = feuilleNotes?.etudiants.filter(e => 
    e.note_obtenue !== null && e.note_obtenue !== undefined || e.absent
  ).length || 0;
  const absents = feuilleNotes?.etudiants.filter(e => e.absent).length || 0;
  const presents = notesSaisies - absents;

  if (loadingEvaluation) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Chargement de l'évaluation..." />
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="space-y-6">
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {error?.message || 'Impossible de charger l\'évaluation'}
          </AlertDescription>
        </Alert>
        
        <div className="text-center py-8">
          <Button onClick={() => navigate('/evaluations')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour aux évaluations
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/evaluations')}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{evaluation.nom}</h1>
            <p className="text-gray-600">
              Validation des notes • {formatDate(evaluation.date_evaluation)}
            </p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs">
                {evaluation.type_evaluation_nom}
              </Badge>
              <Badge variant="outline" className="text-xs">
                Note sur {evaluation.note_sur}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {evaluation.session_nom}
              </Badge>
            </div>
          </div>
        </div>

        {/* Statut de validation */}
        <div className="flex items-center gap-3">
          {loadingStatus ? (
            <Loading size="sm" />
          ) : validationStatus ? (
            <div className="flex items-center gap-2">
              {validationStatus.validee ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-700">Validée</p>
                    <p className="text-xs text-gray-500">
                      {validationStatus.date_validation && formatDateTime(validationStatus.date_validation)}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <Clock className="w-5 h-5 text-orange-500" />
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-700">En attente</p>
                    <p className="text-xs text-gray-500">Non validée</p>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* Alerte si saisie non terminée */}
      {!evaluation.saisie_terminee && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <AlertDescription className="text-orange-800">
            <strong>Saisie non terminée :</strong> Vous devez d'abord terminer la saisie de toutes les notes 
            avant de pouvoir valider cette évaluation.
          </AlertDescription>
        </Alert>
      )}

      {/* Informations de l'évaluation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Informations de l'évaluation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Enseignement</p>
                <p className="font-semibold">{evaluation.enseignement_details?.ec_code} - {evaluation.enseignement_details?.ec_nom}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Classe</p>
                <p className="text-sm">{evaluation.enseignement_details?.classe_nom}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Date d'évaluation</p>
                <p className="text-sm">{formatDate(evaluation.date_evaluation)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Limite de saisie</p>
                <p className="text-sm">
                  {evaluation.date_limite_saisie 
                    ? formatDateTime(evaluation.date_limite_saisie)
                    : 'Non définie'
                  }
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-600">Statut saisie</p>
                <Badge variant={evaluation.saisie_terminee ? "success" : "warning"}>
                  {evaluation.saisie_terminee ? "Terminée" : "En cours"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Modifications</p>
                <p className="text-sm">{evaluation.nb_modifications} modification(s)</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques de saisie */}
      {evaluation.saisie_terminee && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{totalEtudiants}</div>
              <p className="text-sm text-gray-600">Total étudiants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{presents}</div>
              <p className="text-sm text-gray-600">Présents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{absents}</div>
              <p className="text-sm text-gray-600">Absents</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {totalEtudiants > 0 ? Math.round((notesSaisies / totalEtudiants) * 100) : 0}%
              </div>
              <p className="text-sm text-gray-600">Saisie complète</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques détaillées */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistiques globales */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Statistiques globales
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-xl font-bold text-blue-600">
                    {stats.moyenne.toFixed(2)}
                  </div>
                  <p className="text-sm text-blue-700">Moyenne</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-xl font-bold text-green-600">
                    {Math.round((stats.repartition.excellents + stats.repartition.bien + stats.repartition.assez_bien + stats.repartition.passable) / stats.nombre_notes * 100)}%
                  </div>
                  <p className="text-sm text-green-700">Réussite</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Note maximum</span>
                  <span className="font-semibold">{stats.note_max.toFixed(2)}/{evaluation.note_sur}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Note minimum</span>
                  <span className="font-semibold">{stats.note_min.toFixed(2)}/{evaluation.note_sur}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Nombre de notes</span>
                  <span className="font-semibold">{stats.nombre_notes}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Absents</span>
                  <span className="font-semibold">{stats.nombre_absents}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Répartition par mention */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5" />
                Répartition par mention
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { key: 'excellents', label: 'Très Bien (≥16)', color: 'bg-green-500', count: stats.repartition.excellents },
                  { key: 'bien', label: 'Bien (14-15.99)', color: 'bg-blue-500', count: stats.repartition.bien },
                  { key: 'assez_bien', label: 'Assez Bien (12-13.99)', color: 'bg-orange-500', count: stats.repartition.assez_bien },
                  { key: 'passable', label: 'Passable (10-11.99)', color: 'bg-yellow-500', count: stats.repartition.passable },
                  { key: 'insuffisant', label: 'Insuffisant (<10)', color: 'bg-red-500', count: stats.repartition.insuffisant }
                ].map((mention) => {
                  const percentage = stats.nombre_notes > 0 ? (mention.count / stats.nombre_notes) * 100 : 0;
                  
                  return (
                    <div key={mention.key} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${mention.color}`} />
                        <span className="text-sm font-medium">{mention.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${mention.color}`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{mention.count}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Aperçu de la feuille de notes */}
      {feuilleNotes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Aperçu des notes saisies
            </CardTitle>
            <CardDescription>
              Vérifiez les notes avant validation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-h-96 overflow-y-auto">
              <div className="space-y-2">
                {feuilleNotes.etudiants.slice(0, 10).map((etudiant, index) => (
                  <div
                    key={etudiant.etudiant_id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-lg border",
                      etudiant.absent 
                        ? "bg-red-50 border-red-200" 
                        : etudiant.note_obtenue !== null && etudiant.note_obtenue !== undefined
                        ? "bg-green-50 border-green-200"
                        : "bg-gray-50 border-gray-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium w-8">{index + 1}.</span>
                      <div>
                        <p className="font-medium text-gray-900">{etudiant.nom_complet}</p>
                        <p className="text-sm text-gray-500">{etudiant.matricule}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {etudiant.absent ? (
                        <>
                          <UserX className="w-4 h-4 text-red-500" />
                          <Badge variant="destructive" className="text-xs">
                            Absent{etudiant.justifie ? ' (J)' : ''}
                          </Badge>
                        </>
                      ) : etudiant.note_obtenue !== null && etudiant.note_obtenue !== undefined ? (
                        <>
                          <UserCheck className="w-4 h-4 text-green-500" />
                          <div className="text-right">
                            <span className="font-semibold">
                              {etudiant.note_obtenue.toFixed(2)}/{evaluation.note_sur}
                            </span>
                            {etudiant.commentaire && (
                              <p className="text-xs text-gray-500">{etudiant.commentaire}</p>
                            )}
                          </div>
                        </>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Non saisi
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
                
                {feuilleNotes.etudiants.length > 10 && (
                  <div className="text-center py-3 border-t">
                    <p className="text-sm text-gray-500">
                      ... et {feuilleNotes.etudiants.length - 10} autres étudiants
                    </p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => navigate(`/evaluations/${evaluationId}/notes`)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Voir la feuille complète
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions de validation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {validationStatus?.validee ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            Actions de validation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!evaluation.saisie_terminee ? (
            <Alert className="border-orange-200 bg-orange-50">
              <Info className="w-4 h-4 text-orange-600" />
              <AlertDescription className="text-orange-800">
                La validation ne sera possible qu'après la finalisation de la saisie des notes.
              </AlertDescription>
            </Alert>
          ) : validationStatus?.validee ? (
            <div className="space-y-4">
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>Notes validées</strong> le {validationStatus.date_validation && formatDateTime(validationStatus.date_validation)}
                  {validationStatus.validee_par && ` par ${validationStatus.validee_par}`}
                  {validationStatus.commentaire && (
                    <div className="mt-2 p-2 bg-white rounded border">
                      <p className="text-sm"><strong>Commentaire :</strong> {validationStatus.commentaire}</p>
                    </div>
                  )}
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-3">
                <Button onClick={handleExportValidation} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Exporter validation
                </Button>

                {validationStatus.peut_annuler && (
                  <Button 
                    onClick={() => setShowCancelDialog(true)}
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Annuler validation
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert className="border-blue-200 bg-blue-50">
                <Info className="w-4 h-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Vérifiez attentivement toutes les notes avant de procéder à la validation. 
                  Une fois validées, les notes ne pourront plus être modifiées sans autorisation spéciale.
                </AlertDescription>
              </Alert>

              <div className="flex items-center gap-3">
                <Button 
                  onClick={() => setShowValidationDialog(true)}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!stats || loadingStats}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Valider les notes
                </Button>

                <Button 
                  onClick={() => navigate(`/evaluations/${evaluationId}/notes`)}
                  variant="outline"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Revoir les notes
                </Button>

                <Button onClick={handleExportValidation} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Aperçu export
                </Button>
              </div>

              {/* New buttons for feuille de presence download and import */}
              <div className="flex items-center gap-3 mt-4">
                <Button 
                  onClick={() => handleDownloadFeuillePresence('xlsx')}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger feuille (XLSX)
                </Button>
                <Button 
                  onClick={() => handleDownloadFeuillePresence('pdf')}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger feuille (PDF)
                </Button>
                <input 
                  type="file" 
                  accept=".xlsx,.csv" 
                  ref={fileInputRef} 
                  onChange={handleImportNotes} 
                  className="hidden" 
                  id="import-file-input"
                />
                <label htmlFor="import-file-input" className="btn btn-outline cursor-pointer">
                  <Button asChild variant="outline">
                    <span>Importer notes</span>
                  </Button>
                </label>
              </div>

              {importing && (
                <div className="mt-2 text-sm text-gray-600 flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Import en cours...
                </div>
              )}

              {importResult && (
                <div className={`mt-2 p-2 rounded ${importResult.success ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {importResult.success 
                    ? `${importResult.notes_importees} notes importées avec succès.` 
                    : `Import échoué avec ${importResult.erreurs?.length || 0} erreurs.`}
                  {importResult.erreurs && importResult.erreurs.length > 0 && (
                    <ul className="list-disc list-inside mt-1">
                      {importResult.erreurs.map((err, idx) => (
                        <li key={idx}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de validation */}
      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Valider les notes
            </DialogTitle>
            <DialogDescription>
              Confirmez la validation des notes pour cette évaluation.
              Cette action ne pourra pas être annulée facilement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
              <div className="flex justify-between text-sm">
                <span>Évaluation :</span>
                <span className="font-medium">{evaluation.nom}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Notes saisies :</span>
                <span className="font-medium">{notesSaisies}/{totalEtudiants}</span>
              </div>
              {stats && (
                <div className="flex justify-between text-sm">
                  <span>Moyenne :</span>
                  <span className="font-medium">{stats.moyenne.toFixed(2)}/20</span>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Commentaire de validation (optionnel)
              </label>
              <Textarea
                placeholder="Ajoutez un commentaire sur cette validation..."
                value={validationComment}
                onChange={(e) => setValidationComment(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowValidationDialog(false)}
              disabled={validating}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleValidate}
              disabled={validating}
              className="bg-green-600 hover:bg-green-700"
            >
              {validating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Validation...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer la validation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'annulation de validation */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-600" />
              Annuler la validation
            </DialogTitle>
            <DialogDescription>
              Indiquez la raison de l'annulation de la validation des notes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Cette action va permettre de nouveau la modification des notes.
                Les étudiants et l'administration seront notifiés.
              </AlertDescription>
            </Alert>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Raison de l'annulation *
              </label>
              <Textarea
                placeholder="Expliquez pourquoi vous annulez cette validation..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={4}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setShowCancelDialog(false)}
              disabled={cancelValidationMutation.isPending}
            >
              Annuler
            </Button>
            <Button 
              onClick={handleCancelValidation}
              disabled={cancelValidationMutation.isPending || !cancelReason.trim()}
              variant="destructive"
            >
              {cancelValidationMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Annulation...
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 mr-2" />
                  Confirmer l'annulation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherValidationPage;