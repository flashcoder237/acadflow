// ========================================
// FICHIER: src/pages/NotesPage.tsx - Saisie des notes
// ========================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save, 
  ArrowLeft, 
  Users, 
  AlertCircle, 
  CheckCircle,
  XCircle,
  FileText,
  Calculator,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationActions } from '@/stores/appStore';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { FeuilleNotes, SaisieNote, Evaluation } from '@/types';

const NotesPage: React.FC = () => {
  const { id: evaluationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotificationActions();

  const [notes, setNotes] = useState<Record<number, SaisieNote>>({});
  const [showAbsents, setShowAbsents] = useState(true);
  const [saving, setSaving] = useState(false);

  // Charger la feuille de notes
  const { data: feuilleNotes, isLoading, error } = useQuery({
    queryKey: ['feuille-notes', evaluationId],
    queryFn: () => apiClient.getFeuilleNotes(parseInt(evaluationId!)),
    enabled: !!evaluationId
  });

  // Vérifier les délais de saisie
  const { data: delaiInfo } = useQuery({
    queryKey: ['delai-saisie', evaluationId],
    queryFn: () => apiClient.verifierDelaiSaisie(parseInt(evaluationId!)),
    enabled: !!evaluationId
  });

  // Mutation pour sauvegarder les notes
  const saveMutation = useMutation({
    mutationFn: (data: { notes: SaisieNote[] }) => 
      apiClient.saisirNotes(parseInt(evaluationId!), data),
    onSuccess: () => {
      showSuccess(
        'Notes sauvegardées',
        'Les notes ont été enregistrées avec succès'
      );
      queryClient.invalidateQueries({ queryKey: ['feuille-notes', evaluationId] });
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
    onError: (error: any) => {
      showError(
        'Erreur de sauvegarde',
        error.message || 'Impossible de sauvegarder les notes'
      );
    }
  });

  // Initialiser les notes depuis la feuille
  useEffect(() => {
    if (feuilleNotes?.etudiants) {
      const initialNotes: Record<number, SaisieNote> = {};
      feuilleNotes.etudiants.forEach(etudiant => {
        initialNotes[etudiant.etudiant_id] = {
          etudiant_id: etudiant.etudiant_id,
          note_obtenue: etudiant.note_obtenue || undefined,
          absent: etudiant.absent,
          justifie: etudiant.justifie,
          commentaire: etudiant.commentaire || ''
        };
      });
      setNotes(initialNotes);
    }
  }, [feuilleNotes]);

  const handleNoteChange = (etudiantId: number, field: keyof SaisieNote, value: any) => {
    setNotes(prev => ({
      ...prev,
      [etudiantId]: {
        ...prev[etudiantId],
        [field]: value,
        // Si on marque comme absent, effacer la note
        ...(field === 'absent' && value ? { note_obtenue: undefined } : {}),
        // Si on saisit une note, décocher absent
        ...(field === 'note_obtenue' && value !== undefined ? { absent: false } : {})
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const notesToSave = Object.values(notes).filter(note => 
        note.note_obtenue !== undefined || note.absent || note.commentaire
      );
      
      await saveMutation.mutateAsync({ notes: notesToSave });
    } finally {
      setSaving(false);
    }
  };

  const calculerStatistiques = () => {
    const notesValides = Object.values(notes)
      .filter(note => note.note_obtenue !== undefined)
      .map(note => note.note_obtenue!);

    if (notesValides.length === 0) return null;

    const moyenne = notesValides.reduce((sum, note) => sum + note, 0) / notesValides.length;
    const noteMax = Math.max(...notesValides);
    const noteMin = Math.min(...notesValides);

    return { moyenne, noteMax, noteMin, count: notesValides.length };
  };

  const stats = calculerStatistiques();
  const totalEtudiants = feuilleNotes?.etudiants.length || 0;
  const notesSaisies = Object.values(notes).filter(n => n.note_obtenue !== undefined || n.absent).length;
  const absents = Object.values(notes).filter(n => n.absent).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Chargement de la feuille de notes..." />
      </div>
    );
  }

  if (error || !feuilleNotes) {
    return (
      <div className="text-center py-8">
        <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Impossible de charger la feuille de notes
        </h3>
        <Button onClick={() => navigate('/evaluations')} variant="outline">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux évaluations
        </Button>
      </div>
    );
  }

  const evaluation = feuilleNotes.evaluation;
  const peutSaisir = delaiInfo?.peut_saisir ?? true;
  const delaiDepasse = delaiInfo?.delai_depasse ?? false;

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
              Saisie des notes • {formatDate(evaluation.date_evaluation)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {evaluation.saisie_terminee ? (
            <Badge variant="success">Saisie terminée</Badge>
          ) : delaiDepasse ? (
            <Badge variant="destructive">Délai dépassé</Badge>
          ) : (
            <Badge variant="secondary">En cours</Badge>
          )}
        </div>
      </div>

      {/* Alerte délai */}
      {!peutSaisir && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <div>
                <p className="font-medium">Saisie non autorisée</p>
                <p className="text-sm">
                  Le délai de saisie est dépassé. Contactez l'administration pour autoriser la modification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informations délai */}
      {evaluation.date_limite_saisie && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-sm text-gray-600">
                  Limite de saisie : {formatDateTime(evaluation.date_limite_saisie)}
                </span>
              </div>
              {delaiInfo && (
                <Badge variant={delaiDepasse ? "destructive" : "warning"}>
                  {delaiDepasse ? "Dépassé" : "En cours"}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Feuille de notes */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Feuille de notes
                </CardTitle>
                <CardDescription>
                  Note sur {evaluation.note_sur} • {totalEtudiants} étudiant(s)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAbsents(!showAbsents)}
                >
                  {showAbsents ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showAbsents ? 'Masquer' : 'Afficher'} absents
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {feuilleNotes.etudiants
                  .filter(etudiant => showAbsents || !notes[etudiant.etudiant_id]?.absent)
                  .map((etudiant) => (
                  <div
                    key={etudiant.etudiant_id}
                    className={cn(
                      "grid grid-cols-12 gap-3 p-3 rounded-lg border",
                      notes[etudiant.etudiant_id]?.absent 
                        ? "bg-gray-50 border-gray-200" 
                        : "bg-white border-gray-200 hover:border-gray-300"
                    )}
                  >
                    {/* Étudiant */}
                    <div className="col-span-4">
                      <p className="font-medium text-gray-900">{etudiant.nom_complet}</p>
                      <p className="text-sm text-gray-500">{etudiant.matricule}</p>
                    </div>

                    {/* Note */}
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        max={evaluation.note_sur}
                        step="0.25"
                        placeholder="Note"
                        value={notes[etudiant.etudiant_id]?.note_obtenue || ''}
                        onChange={(e) => handleNoteChange(
                          etudiant.etudiant_id, 
                          'note_obtenue', 
                          e.target.value ? parseFloat(e.target.value) : undefined
                        )}
                        disabled={!peutSaisir || notes[etudiant.etudiant_id]?.absent}
                        className={cn(
                          "text-center",
                          notes[etudiant.etudiant_id]?.absent && "bg-gray-100"
                        )}
                      />
                    </div>

                    {/* Absent */}
                    <div className="col-span-1 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={notes[etudiant.etudiant_id]?.absent || false}
                        onChange={(e) => handleNoteChange(
                          etudiant.etudiant_id, 
                          'absent', 
                          e.target.checked
                        )}
                        disabled={!peutSaisir}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>

                    {/* Justifié */}
                    <div className="col-span-1 flex items-center justify-center">
                      <input
                        type="checkbox"
                        checked={notes[etudiant.etudiant_id]?.justifie || false}
                        onChange={(e) => handleNoteChange(
                          etudiant.etudiant_id, 
                          'justifie', 
                          e.target.checked
                        )}
                        disabled={!peutSaisir || !notes[etudiant.etudiant_id]?.absent}
                        className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                      />
                    </div>

                    {/* Commentaire */}
                    <div className="col-span-4">
                      <Input
                        type="text"
                        placeholder="Commentaire (optionnel)"
                        value={notes[etudiant.etudiant_id]?.commentaire || ''}
                        onChange={(e) => handleNoteChange(
                          etudiant.etudiant_id, 
                          'commentaire', 
                          e.target.value
                        )}
                        disabled={!peutSaisir}
                        className="text-sm"
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Légende */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Légende</h4>
                <div className="grid grid-cols-12 gap-3 text-xs text-gray-600">
                  <div className="col-span-4">Étudiant</div>
                  <div className="col-span-2">Note (/{evaluation.note_sur})</div>
                  <div className="col-span-1">Absent</div>
                  <div className="col-span-1">Justifié</div>
                  <div className="col-span-4">Commentaire</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar avec statistiques et actions */}
        <div className="space-y-6">
          {/* Statistiques */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5" />
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {notesSaisies}/{totalEtudiants}
                </div>
                <div className="text-sm text-gray-500">Notes saisies</div>
              </div>

              {stats && (
                <div className="space-y-3 pt-3 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Moyenne</span>
                    <span className="font-medium">{stats.moyenne.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Note max</span>
                    <span className="font-medium">{stats.noteMax}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Note min</span>
                    <span className="font-medium">{stats.noteMin}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Absents</span>
                    <span className="font-medium">{absents}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleSave}
              disabled={!peutSaisir || saving || saveMutation.isPending}
              className="w-full"
            >
              {saving || saveMutation.isPending ? (
                <>
                  <Loading size="sm" className="mr-2" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Sauvegarder
                </>
              )}
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate(`/evaluations/${evaluationId}`)}
              className="w-full"
            >
              <Eye className="w-4 h-4 mr-2" />
              Voir détails
            </Button>
          </div>

          {/* Progression */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                <span>Progression</span>
                <span>{Math.round((notesSaisies / totalEtudiants) * 100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(notesSaisies / totalEtudiants) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default NotesPage;