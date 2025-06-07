// ========================================
// FICHIER: src/pages/NotesPage.tsx - Saisie des notes avec import
// ========================================

import React, { useState, useEffect, useMemo, useRef } from 'react';
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
  EyeOff,
  Search,
  Download,
  Upload,
  Lock,
  Unlock,
  RotateCcw,
  Filter,
  SortAsc,
  SortDesc,
  Target,
  TrendingUp,
  UserCheck,
  UserX,
  Edit3,
  Trash2,
  Keyboard,
  ArrowDown,
  ArrowUp,
  FileSpreadsheet,
  AlertTriangle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationActions } from '@/stores/appStore';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { FeuilleNotes, SaisieNote, Evaluation } from '@/types';

type SortField = 'nom' | 'matricule' | 'note' | 'status';
type SortOrder = 'asc' | 'desc';
type FilterType = 'tous' | 'saisies' | 'non_saisies' | 'absents' | 'justifies';

interface EtudiantAvecNote {
  etudiant_id: number;
  nom_complet: string;
  matricule: string;
  note_obtenue?: number;
  absent: boolean;
  justifie: boolean;
  commentaire?: string;
  locked?: boolean;
}

interface ImportResult {
  success: number;
  errors: Array<{
    ligne: number;
    matricule?: string;
    nom?: string;
    erreur: string;
  }>;
  warnings: Array<{
    ligne: number;
    matricule?: string;
    nom?: string;
    message: string;
  }>;
}

const NotesPage: React.FC = () => {
  const { id: evaluationId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { showSuccess, showError } = useNotificationActions();

  // États pour la saisie
  const [notes, setNotes] = useState<Record<number, SaisieNote & { locked?: boolean }>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [filterType, setFilterType] = useState<FilterType>('tous');
  const [saving, setSaving] = useState(false);
  const [selectedEtudiant, setSelectedEtudiant] = useState<number | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedEtudiants, setSelectedEtudiants] = useState<Set<number>>(new Set());

  // États pour l'import
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [showImportPreview, setShowImportPreview] = useState(false);

  // Refs
  const searchInputRef = useRef<HTMLInputElement>(null);
  const noteInputRefs = useRef<Record<number, HTMLInputElement>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Queries et mutations existantes...
  const { data: feuilleNotes, isLoading, error, refetch } = useQuery({
    queryKey: ['feuille-notes', evaluationId],
    queryFn: () => apiClient.getFeuilleNotes(parseInt(evaluationId!)),
    enabled: !!evaluationId,
    refetchInterval: 30000
  });

  const { data: delaiInfo } = useQuery({
    queryKey: ['delai-saisie', evaluationId],
    queryFn: () => apiClient.verifierDelaiSaisie(parseInt(evaluationId!)),
    enabled: !!evaluationId,
    refetchInterval: 60000
  });

  const saveMutation = useMutation({
    mutationFn: (data: { notes: SaisieNote[] }) => 
      apiClient.saisirNotes(parseInt(evaluationId!), data),
    onSuccess: () => {
      showSuccess('Notes sauvegardées', 'Les notes ont été enregistrées avec succès');
      queryClient.invalidateQueries({ queryKey: ['feuille-notes', evaluationId] });
      queryClient.invalidateQueries({ queryKey: ['evaluations'] });
    },
    onError: (error: any) => {
      showError('Erreur de sauvegarde', error.message || 'Impossible de sauvegarder les notes');
    }
  });

  const exportMutation = useMutation({
    mutationFn: (format: 'xlsx' | 'csv' | 'pdf') => 
      apiClient.exporterNotes(parseInt(evaluationId!), format),
    onSuccess: (blob, format) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notes_${feuilleNotes?.evaluation.nom}_${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showSuccess('Export réussi', 'Les notes ont été exportées avec succès');
    },
    onError: (error: any) => {
      showError('Erreur d\'export', error.message || 'Impossible d\'exporter les notes');
    }
  });

  // Nouvelle mutation pour l'import
  const importMutation = useMutation({
    mutationFn: (file: File) => apiClient.importerNotes(parseInt(evaluationId!), file),
    onSuccess: (result: ImportResult) => {
      setImportResult(result);
      if (result.success > 0) {
        showSuccess(
          'Import réussi', 
          `${result.success} note(s) importée(s) avec succès`
        );
        queryClient.invalidateQueries({ queryKey: ['feuille-notes', evaluationId] });
      }
      if (result.errors.length > 0) {
        showError(
          'Erreurs d\'import', 
          `${result.errors.length} ligne(s) en erreur`
        );
      }
    },
    onError: (error: any) => {
      showError('Erreur d\'import', error.message || 'Impossible d\'importer le fichier');
      setImportResult(null);
    }
  });

  // Fonction pour traiter le fichier et générer un aperçu
  const handleFileSelect = async (file: File) => {
    setImportFile(file);
    setImportResult(null);
    
    if (!file) return;

    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        showError('Fichier invalide', 'Le fichier doit contenir au moins un en-tête et une ligne de données');
        return;
      }

      // Parser le CSV (simple)
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      const preview = lines.slice(1, 6).map((line, index) => {
        const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
        const row: any = { ligne: index + 2 };
        headers.forEach((header, i) => {
          row[header] = values[i] || '';
        });
        return row;
      });

      setImportPreview(preview);
      setShowImportPreview(true);
    } catch (error) {
      showError('Erreur de lecture', 'Impossible de lire le fichier');
    }
  };

  const handleImport = async () => {
    if (!importFile) return;
    
    setImporting(true);
    try {
      await importMutation.mutateAsync(importFile);
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = () => {
    const headers = ['matricule', 'nom_complet', 'note', 'absent', 'justifie', 'commentaire'];
    const csvContent = [
      headers.join(','),
      '# Exemple:',
      '20230001,DUPONT Jean,15.5,0,0,Très bon travail',
      '20230002,MARTIN Marie,,1,1,Absence justifiée',
      '# Notes:',
      '# - matricule: obligatoire',
      '# - note: optionnelle (laisser vide si absent)',
      '# - absent: 1 pour absent, 0 pour présent',
      '# - justifie: 1 pour justifié, 0 pour non justifié',
      '# - commentaire: optionnel'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `template_import_notes_${feuilleNotes?.evaluation.nom || 'evaluation'}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  // Fonctions existantes...
  useEffect(() => {
    if (feuilleNotes?.etudiants) {
      const initialNotes: Record<number, SaisieNote & { locked?: boolean }> = {};
      feuilleNotes.etudiants.forEach(etudiant => {
        const hasExistingNote = etudiant.note_obtenue !== null && etudiant.note_obtenue !== undefined;
        initialNotes[etudiant.etudiant_id] = {
          etudiant_id: etudiant.etudiant_id,
          note_obtenue: etudiant.note_obtenue || undefined,
          absent: etudiant.absent,
          justifie: etudiant.justifie,
          commentaire: etudiant.commentaire || '',
          locked: hasExistingNote
        };
      });
      setNotes(initialNotes);
    }
  }, [feuilleNotes]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault();
            handleSave();
            break;
          case 'f':
            e.preventDefault();
            searchInputRef.current?.focus();
            break;
          case 'e':
            e.preventDefault();
            if (peutExporter) setShowExportDialog(true);
            break;
          case 'i':
            e.preventDefault();
            if (peutSaisir) setShowImportDialog(true);
            break;
        }
      }
      
      if (e.key === 'Escape') {
        setSelectedEtudiant(null);
        setSearchTerm('');
        setShowImportDialog(false);
        setShowExportDialog(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fonctions de filtrage et tri (inchangées)...
  const etudiantsFiltres = useMemo(() => {
    if (!feuilleNotes?.etudiants) return [];

    let filtered = feuilleNotes.etudiants.filter(etudiant => {
      const note = notes[etudiant.etudiant_id];
      
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesName = etudiant.nom_complet.toLowerCase().includes(searchLower);
        const matchesMatricule = etudiant.matricule.toLowerCase().includes(searchLower);
        if (!matchesName && !matchesMatricule) return false;
      }

      switch (filterType) {
        case 'saisies':
          return note?.note_obtenue !== undefined || note?.absent;
        case 'non_saisies':
          return note?.note_obtenue === undefined && !note?.absent;
        case 'absents':
          return note?.absent;
        case 'justifies':
          return note?.justifie;
        default:
          return true;
      }
    });

    filtered.sort((a, b) => {
      const noteA = notes[a.etudiant_id];
      const noteB = notes[b.etudiant_id];
      
      let comparison = 0;
      
      switch (sortField) {
        case 'nom':
          comparison = a.nom_complet.localeCompare(b.nom_complet);
          break;
        case 'matricule':
          comparison = a.matricule.localeCompare(b.matricule);
          break;
        case 'note':
          const valA = noteA?.note_obtenue ?? -1;
          const valB = noteB?.note_obtenue ?? -1;
          comparison = valA - valB;
          break;
        case 'status':
          const statusA = noteA?.absent ? 'absent' : (noteA?.note_obtenue !== undefined ? 'note' : 'vide');
          const statusB = noteB?.absent ? 'absent' : (noteB?.note_obtenue !== undefined ? 'note' : 'vide');
          comparison = statusA.localeCompare(statusB);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [feuilleNotes?.etudiants, notes, searchTerm, filterType, sortField, sortOrder]);

  // Autres fonctions (inchangées)...
  const handleNoteChange = (etudiantId: number, field: keyof SaisieNote, value: any) => {
    const currentNote = notes[etudiantId];
    
    if (currentNote?.locked && field === 'note_obtenue') {
      return;
    }

    setNotes(prev => {
      const updated = {
        ...prev,
        [etudiantId]: {
          ...prev[etudiantId],
          [field]: value,
          ...(field === 'absent' && value ? { note_obtenue: undefined } : {}),
          ...(field === 'note_obtenue' && value !== undefined ? { 
            absent: false,
            locked: true 
          } : {})
        }
      };
      
      if (field === 'note_obtenue' || field === 'absent') {
        setTimeout(() => handleSave(), 500);
      }
      
      return updated;
    });
  };

  const handleUnlockNote = (etudiantId: number) => {
    setNotes(prev => ({
      ...prev,
      [etudiantId]: {
        ...prev[etudiantId],
        locked: false
      }
    }));
  };

  const handleSave = async () => {
    if (saving) return;
    
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

  const handleExport = async (format: 'xlsx' | 'csv' | 'pdf') => {
    await exportMutation.mutateAsync(format);
    setShowExportDialog(false);
  };

  const handleBulkAction = (action: 'absent' | 'present' | 'delete') => {
    const updates: Record<number, Partial<SaisieNote>> = {};
    
    selectedEtudiants.forEach(etudiantId => {
      switch (action) {
        case 'absent':
          updates[etudiantId] = { absent: true, note_obtenue: undefined };
          break;
        case 'present':
          updates[etudiantId] = { absent: false };
          break;
        case 'delete':
          updates[etudiantId] = { note_obtenue: undefined, absent: false, commentaire: '' };
          break;
      }
    });

    setNotes(prev => {
      const newNotes = { ...prev };
      Object.entries(updates).forEach(([id, update]) => {
        newNotes[parseInt(id)] = { ...newNotes[parseInt(id)], ...update };
      });
      return newNotes;
    });

    setSelectedEtudiants(new Set());
    setBulkMode(false);
    handleSave();
  };

  const calculerStatistiques = () => {
    const notesValides = Object.values(notes)
      .filter(note => note.note_obtenue !== undefined)
      .map(note => note.note_obtenue!);

    if (notesValides.length === 0) return null;

    const moyenne = notesValides.reduce((sum, note) => sum + note, 0) / notesValides.length;
    const noteMax = Math.max(...notesValides);
    const noteMin = Math.min(...notesValides);
    const notesSup10 = notesValides.filter(n => n >= 10).length;
    const tauxReussite = (notesSup10 / notesValides.length) * 100;

    return { moyenne, noteMax, noteMin, count: notesValides.length, tauxReussite };
  };

  const stats = calculerStatistiques();
  const totalEtudiants = feuilleNotes?.etudiants.length || 0;
  const notesSaisies = Object.values(notes).filter(n => n.note_obtenue !== undefined || n.absent).length;
  const absents = Object.values(notes).filter(n => n.absent).length;
  const justifies = Object.values(notes).filter(n => n.justifie).length;
  const progression = (notesSaisies / totalEtudiants) * 100;
  const peutExporter = progression === 100;

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
    <TooltipProvider>
      <div className="space-y-6">
        {/* Header avec raccourcis clavier */}
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
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <Keyboard className="w-3 h-3" />
                <span>Ctrl+S: Sauvegarder</span>
                <span>•</span>
                <span>Ctrl+F: Rechercher</span>
                <span>•</span>
                <span>Ctrl+I: Importer</span>
                <span>•</span>
                <span>Ctrl+E: Exporter</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {peutSaisir && (
              <Button
                variant="outline"
                onClick={() => setShowImportDialog(true)}
                className="bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              >
                <Upload className="w-4 h-4 mr-2" />
                Importer
              </Button>
            )}
            {peutExporter && (
              <Button
                variant="outline"
                onClick={() => setShowExportDialog(true)}
                className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              >
                <Download className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            )}
            {evaluation.saisie_terminee ? (
              <Badge variant="success">Saisie terminée</Badge>
            ) : delaiDepasse ? (
              <Badge variant="destructive">Délai dépassé</Badge>
            ) : (
              <Badge variant="secondary">En cours</Badge>
            )}
          </div>
        </div>

        {/* Barre de recherche et filtres - INCHANGÉE */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  ref={searchInputRef}
                  placeholder="Rechercher un étudiant (nom ou matricule)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les étudiants</SelectItem>
                  <SelectItem value="saisies">Notes saisies</SelectItem>
                  <SelectItem value="non_saisies">Non saisies</SelectItem>
                  <SelectItem value="absents">Absents</SelectItem>
                  <SelectItem value="justifies">Justifiés</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nom">Nom</SelectItem>
                  <SelectItem value="matricule">Matricule</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="status">Statut</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span>{etudiantsFiltres.length} étudiant(s) affiché(s)</span>
                <Separator orientation="vertical" className="h-4" />
                <span className="flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  {notesSaisies}/{totalEtudiants} saisies
                </span>
                <span className="flex items-center gap-1">
                  <UserX className="w-3 h-3" />
                  {absents} absent(s)
                </span>
                {stats && (
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Moy: {stats.moyenne.toFixed(2)}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant={bulkMode ? "default" : "outline"}
                  size="sm"
                  onClick={() => setBulkMode(!bulkMode)}
                >
                  Actions groupées
                </Button>
                {bulkMode && selectedEtudiants.size > 0 && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('absent')}
                    >
                      <UserX className="w-3 h-3 mr-1" />
                      Absent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('present')}
                    >
                      <UserCheck className="w-3 h-3 mr-1" />
                      Présent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleBulkAction('delete')}
                    >
                      <Trash2 className="w-3 h-3 mr-1" />
                      Effacer
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Feuille de notes - INCHANGÉE (trop longue pour reproduire) */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Feuille de notes
                  <Badge variant="outline" className="ml-auto">
                    {etudiantsFiltres.length} étudiant(s)
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {etudiantsFiltres.map((etudiant, index) => {
                    const note = notes[etudiant.etudiant_id];
                    const isLocked = note?.locked;
                    const isSelected = selectedEtudiants.has(etudiant.etudiant_id);
                    
                    return (
                      <div
                        key={etudiant.etudiant_id}
                        className={cn(
                          "grid grid-cols-12 gap-3 p-3 rounded-lg border transition-all",
                          note?.absent 
                            ? "bg-red-50 border-red-200" 
                            : note?.note_obtenue !== undefined
                            ? "bg-green-50 border-green-200"
                            : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm",
                          isSelected && "ring-2 ring-blue-500",
                          selectedEtudiant === etudiant.etudiant_id && "ring-2 ring-blue-400"
                        )}
                        onClick={() => setSelectedEtudiant(etudiant.etudiant_id)}
                      >
                        {/* Sélection en mode bulk */}
                        {bulkMode && (
                          <div className="col-span-1 flex items-center justify-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                const newSelected = new Set(selectedEtudiants);
                                if (e.target.checked) {
                                  newSelected.add(etudiant.etudiant_id);
                                } else {
                                  newSelected.delete(etudiant.etudiant_id);
                                }
                                setSelectedEtudiants(newSelected);
                              }}
                              className="w-4 h-4 text-blue-600 rounded"
                            />
                          </div>
                        )}

                        {/* Étudiant */}
                        <div className={cn("col-span-4", bulkMode && "col-span-3")}>
                          <p className="font-medium text-gray-900">{etudiant.nom_complet}</p>
                          <p className="text-sm text-gray-500">{etudiant.matricule}</p>
                        </div>

                        {/* Note avec verrouillage */}
                        <div className="col-span-2 relative">
                          <div className="flex items-center gap-1">
                            <Input
                              ref={(el) => {
                                if (el) noteInputRefs.current[etudiant.etudiant_id] = el;
                              }}
                              type="number"
                              min="0"
                              max={evaluation.note_sur}
                              step="0.25"
                              placeholder="Note"
                              value={note?.note_obtenue || ''}
                              onChange={(e) => handleNoteChange(
                                etudiant.etudiant_id, 
                                'note_obtenue', 
                                e.target.value ? parseFloat(e.target.value) : undefined
                              )}
                              disabled={!peutSaisir || note?.absent || isLocked}
                              className={cn(
                                "text-center pr-8",
                                note?.absent && "bg-gray-100",
                                isLocked && "bg-gray-50 border-gray-300"
                              )}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  const nextIndex = etudiantsFiltres.findIndex(
                                    et => et.etudiant_id === etudiant.etudiant_id
                                  ) + 1;
                                  if (nextIndex < etudiantsFiltres.length) {
                                    const nextEtudiant = etudiantsFiltres[nextIndex];
                                    noteInputRefs.current[nextEtudiant.etudiant_id]?.focus();
                                  }
                                }
                              }}
                            />
                            {isLocked && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute right-1 h-6 w-6"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleUnlockNote(etudiant.etudiant_id);
                                    }}
                                  >
                                    <Lock className="w-3 h-3" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  Cliquer pour déverrouiller
                                </TooltipContent>
                              </Tooltip>
                            )}
                          </div>
                        </div>

                        {/* Absent */}
                        <div className="col-span-1 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={note?.absent || false}
                            onChange={(e) => handleNoteChange(
                              etudiant.etudiant_id, 
                              'absent', 
                              e.target.checked
                            )}
                            disabled={!peutSaisir}
                            className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
                          />
                        </div>

                        {/* Justifié */}
                        <div className="col-span-1 flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={note?.justifie || false}
                            onChange={(e) => handleNoteChange(
                              etudiant.etudiant_id, 
                              'justifie', 
                              e.target.checked
                            )}
                            disabled={!peutSaisir || !note?.absent}
                            className="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                          />
                        </div>

                        {/* Commentaire */}
                        <div className={cn("col-span-3", bulkMode && "col-span-2")}>
                          <Input
                            type="text"
                            placeholder="Commentaire"
                            value={note?.commentaire || ''}
                            onChange={(e) => handleNoteChange(
                              etudiant.etudiant_id, 
                              'commentaire', 
                              e.target.value
                            )}
                            disabled={!peutSaisir}
                            className="text-sm"
                          />
                        </div>

                        {/* Statut visuel */}
                        <div className="col-span-1 flex items-center justify-center">
                          {note?.absent ? (
                            <UserX className="w-4 h-4 text-red-500" />
                          ) : note?.note_obtenue !== undefined ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <div className="w-4 h-4 rounded-full border-2 border-gray-300" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {etudiantsFiltres.length === 0 && (
                  <div className="text-center py-8">
                    <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-gray-500">Aucun étudiant trouvé avec ces critères</p>
                  </div>
                )}

                {/* Légende */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Légende</h4>
                  <div className={cn(
                    "grid gap-3 text-xs text-gray-600",
                    bulkMode ? "grid-cols-12" : "grid-cols-11"
                  )}>
                    {bulkMode && <div className="col-span-1">☑️</div>}
                    <div className={cn("col-span-4", bulkMode && "col-span-3")}>Étudiant</div>
                    <div className="col-span-2">Note (/{evaluation.note_sur})</div>
                    <div className="col-span-1">Absent</div>
                    <div className="col-span-1">Justifié</div>
                    <div className={cn("col-span-3", bulkMode && "col-span-2")}>Commentaire</div>
                    <div className="col-span-1">Statut</div>
                  </div>
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t text-xs">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      Note saisie
                    </span>
                    <span className="flex items-center gap-1">
                      <UserX className="w-3 h-3 text-red-500" />
                      Absent
                    </span>
                    <span className="flex items-center gap-1">
                      <Lock className="w-3 h-3 text-gray-500" />
                      Note verrouillée
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar avec statistiques et actions */}
          <div className="space-y-4">
            {/* Progression - INCHANGÉE */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Progression</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">
                      {Math.round(progression)}%
                    </div>
                    <div className="text-sm text-gray-500">Complété</div>
                    <div className="w-full bg-gray-200 rounded-full h-3 mt-2">
                      <div 
                        className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${progression}%` }}
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="font-semibold text-blue-700">{notesSaisies}</div>
                      <div className="text-blue-600">Saisies</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="font-semibold text-gray-700">{totalEtudiants - notesSaisies}</div>
                      <div className="text-gray-600">Restantes</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques */}
            {stats && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Calculator className="w-5 h-5" />
                    Statistiques
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-2 bg-green-50 rounded">
                      <div className="font-semibold text-green-700">{stats.moyenne.toFixed(2)}</div>
                      <div className="text-green-600 text-xs">Moyenne</div>
                    </div>
                    <div className="text-center p-2 bg-purple-50 rounded">
                      <div className="font-semibold text-purple-700">{stats.tauxReussite.toFixed(0)}%</div>
                      <div className="text-purple-600 text-xs">Réussite</div>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2 border-t">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Note max</span>
                      <span className="font-medium">{stats.noteMax}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Note min</span>
                      <span className="font-medium">{stats.noteMin}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Absents</span>
                      <span className="font-medium text-red-600">{absents}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Justifiés</span>
                      <span className="font-medium text-orange-600">{justifies}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <div className="space-y-2">
              <Button
                onClick={handleSave}
                disabled={!peutSaisir || saving || saveMutation.isPending}
                className="w-full"
                size="lg"
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

              {peutSaisir && (
                <Button
                  variant="outline"
                  onClick={() => setShowImportDialog(true)}
                  className="w-full bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Importer les notes
                </Button>
              )}

              {peutExporter && (
                <Button
                  variant="outline"
                  onClick={() => setShowExportDialog(true)}
                  className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Exporter les notes
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => navigate(`/evaluations/${evaluationId}`)}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                Voir détails
              </Button>

              <Button
                variant="outline"
                onClick={() => refetch()}
                className="w-full"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Actualiser
              </Button>
            </div>

            {/* Raccourcis */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-3">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Raccourcis</h4>
                <div className="space-y-1 text-xs text-blue-700">
                  <div>• Entrée: Passer à l'étudiant suivant</div>
                  <div>• Ctrl+S: Sauvegarder</div>
                  <div>• Ctrl+F: Rechercher</div>
                  <div>• Ctrl+I: Importer</div>
                  <div>• Echap: Annuler sélection</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Dialog d'import */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Importer des notes</DialogTitle>
              <DialogDescription>
                Importez des notes depuis un fichier CSV pour l'évaluation "{evaluation.nom}"
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="upload" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="upload">Fichier</TabsTrigger>
                <TabsTrigger value="template">Modèle</TabsTrigger>
                <TabsTrigger value="help">Aide</TabsTrigger>
              </TabsList>

              <TabsContent value="upload" className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                  <div className="text-center">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Sélectionner un fichier CSV
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Glissez-déposez votre fichier ou cliquez pour parcourir
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv,.txt"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleFileSelect(file);
                      }}
                      className="hidden"
                    />
                    <Button 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                      Choisir un fichier
                    </Button>
                  </div>

                  {importFile && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                        <span className="font-medium text-blue-900">{importFile.name}</span>
                        <span className="text-blue-600 text-sm">
                          ({(importFile.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {showImportPreview && importPreview.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Aperçu du fichier (5 premières lignes)</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Ligne</th>
                              <th className="px-3 py-2 text-left">Matricule</th>
                              <th className="px-3 py-2 text-left">Nom</th>
                              <th className="px-3 py-2 text-left">Note</th>
                              <th className="px-3 py-2 text-left">Absent</th>
                              <th className="px-3 py-2 text-left">Justifié</th>
                              <th className="px-3 py-2 text-left">Commentaire</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importPreview.map((row, index) => (
                              <tr key={index} className="border-t">
                                <td className="px-3 py-2">{row.ligne}</td>
                                <td className="px-3 py-2 font-mono">{row.matricule || '-'}</td>
                                <td className="px-3 py-2">{row.nom_complet || row.nom || '-'}</td>
                                <td className="px-3 py-2">{row.note || '-'}</td>
                                <td className="px-3 py-2">{row.absent || '0'}</td>
                                <td className="px-3 py-2">{row.justifie || '0'}</td>
                                <td className="px-3 py-2">{row.commentaire || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <Alert>
                      <Info className="w-4 h-4" />
                      <AlertDescription>
                        Vérifiez que les données correspondent aux colonnes attendues avant de procéder à l'import.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {importResult && (
                  <div className="space-y-4">
                    <h4 className="font-medium">Résultat de l'import</h4>
                    
                    {importResult.success > 0 && (
                      <Alert className="border-green-200 bg-green-50">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <AlertDescription className="text-green-800">
                          {importResult.success} note(s) importée(s) avec succès
                        </AlertDescription>
                      </Alert>
                    )}

                    {importResult.warnings.length > 0 && (
                      <Alert className="border-orange-200 bg-orange-50">
                        <AlertTriangle className="w-4 h-4 text-orange-600" />
                        <AlertDescription className="text-orange-800">
                          {importResult.warnings.length} avertissement(s)
                        </AlertDescription>
                      </Alert>
                    )}

                    {importResult.errors.length > 0 && (
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="w-4 h-4 text-red-600" />
                        <AlertDescription className="text-red-800">
                          {importResult.errors.length} erreur(s) détectée(s)
                        </AlertDescription>
                      </Alert>
                    )}

                    {(importResult.errors.length > 0 || importResult.warnings.length > 0) && (
                      <div className="max-h-60 overflow-y-auto border rounded-lg">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-3 py-2 text-left">Type</th>
                              <th className="px-3 py-2 text-left">Ligne</th>
                              <th className="px-3 py-2 text-left">Matricule</th>
                              <th className="px-3 py-2 text-left">Message</th>
                            </tr>
                          </thead>
                          <tbody>
                            {importResult.errors.map((error, index) => (
                              <tr key={`error-${index}`} className="border-t">
                                <td className="px-3 py-2">
                                  <Badge variant="destructive" className="text-xs">Erreur</Badge>
                                </td>
                                <td className="px-3 py-2">{error.ligne}</td>
                                <td className="px-3 py-2 font-mono">{error.matricule || '-'}</td>
                                <td className="px-3 py-2">{error.erreur}</td>
                              </tr>
                            ))}
                            {importResult.warnings.map((warning, index) => (
                              <tr key={`warning-${index}`} className="border-t">
                                <td className="px-3 py-2">
                                  <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
                                    Attention
                                  </Badge>
                                </td>
                                <td className="px-3 py-2">{warning.ligne}</td>
                                <td className="px-3 py-2 font-mono">{warning.matricule || '-'}</td>
                                <td className="px-3 py-2">{warning.message}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="template" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Modèle de fichier CSV</h3>
                    <Button variant="outline" onClick={downloadTemplate}>
                      <Download className="w-4 h-4 mr-2" />
                      Télécharger le modèle
                    </Button>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-2">Structure du fichier :</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Colonnes obligatoires :</h5>
                        <ul className="space-y-1 text-gray-600">
                          <li>• <code className="bg-white px-1 rounded">matricule</code> - Matricule de l'étudiant</li>
                          <li>• <code className="bg-white px-1 rounded">nom_complet</code> - Nom complet (optionnel)</li>
                        </ul>
                      </div>
                      <div>
                        <h5 className="font-medium text-gray-700 mb-1">Colonnes optionnelles :</h5>
                        <ul className="space-y-1 text-gray-600">
                          <li>• <code className="bg-white px-1 rounded">note</code> - Note sur {evaluation.note_sur}</li>
                          <li>• <code className="bg-white px-1 rounded">absent</code> - 1 si absent, 0 sinon</li>
                          <li>• <code className="bg-white px-1 rounded">justifie</code> - 1 si justifié, 0 sinon</li>
                          <li>• <code className="bg-white px-1 rounded">commentaire</code> - Commentaire libre</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gray-100 px-4 py-2 border-b">
                      <span className="font-medium text-sm">Exemple de fichier CSV :</span>
                    </div>
                    <div className="p-4 bg-gray-50 font-mono text-sm overflow-x-auto">
                      <pre>{`matricule,nom_complet,note,absent,justifie,commentaire
20230001,DUPONT Jean,15.5,0,0,Très bon travail
20230002,MARTIN Marie,,1,1,Absence justifiée
20230003,BERNARD Paul,12,0,0,
20230004,DURAND Sophie,8.5,0,0,Peut mieux faire`}</pre>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="help" className="space-y-4">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium mb-3">Guide d'import</h3>
                    <div className="space-y-4">
                      <div className="border-l-4 border-blue-500 pl-4">
                        <h4 className="font-medium text-blue-900">Préparation du fichier</h4>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          <li>• Utilisez un tableur (Excel, LibreOffice Calc) ou un éditeur de texte</li>
                          <li>• Sauvegardez au format CSV (séparateur : virgule)</li>
                          <li>• Encodage recommandé : UTF-8</li>
                          <li>• Première ligne : en-têtes des colonnes</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-green-500 pl-4">
                        <h4 className="font-medium text-green-900">Règles de validation</h4>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          <li>• Le matricule doit correspondre à un étudiant inscrit</li>
                          <li>• La note doit être entre 0 et {evaluation.note_sur}</li>
                          <li>• Les valeurs absent/justifié acceptent : 0, 1, oui, non, true, false</li>
                          <li>• Si absent = 1, la note sera ignorée</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-orange-500 pl-4">
                        <h4 className="font-medium text-orange-900">Comportement de l'import</h4>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          <li>• Les notes existantes sont écrasées</li>
                          <li>• Les lignes en erreur sont ignorées</li>
                          <li>• Un rapport détaillé est généré</li>
                          <li>• L'import peut être annulé avant validation</li>
                        </ul>
                      </div>

                      <div className="border-l-4 border-red-500 pl-4">
                        <h4 className="font-medium text-red-900">Erreurs courantes</h4>
                        <ul className="mt-2 space-y-1 text-sm text-gray-600">
                          <li>• Matricule inexistant ou mal formaté</li>
                          <li>• Note hors de la plage autorisée</li>
                          <li>• Colonnes manquantes ou mal nommées</li>
                          <li>• Caractères spéciaux non supportés</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Info className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Conseil :</strong> Testez d'abord avec un petit échantillon de données 
                      pour vous assurer que le format est correct.
                    </AlertDescription>
                  </Alert>
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setShowImportDialog(false)}>
                Annuler
              </Button>
              <div className="flex gap-2">
                {!importFile && (
                  <Button variant="outline" onClick={downloadTemplate}>
                    <Download className="w-4 h-4 mr-2" />
                    Télécharger modèle
                  </Button>
                )}
                {importFile && !importResult && (
                  <Button 
                    onClick={handleImport}
                    disabled={importing || importMutation.isPending}
                  >
                    {importing || importMutation.isPending ? (
                      <>
                        <Loading size="sm" className="mr-2" />
                        Import en cours...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Importer
                      </>
                    )}
                  </Button>
                )}
                {importResult && importResult.success > 0 && (
                  <Button onClick={() => setShowImportDialog(false)}>
                    Terminer
                  </Button>
                )}
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Dialog d'export - INCHANGÉ */}
        <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Exporter les notes</DialogTitle>
              <DialogDescription>
                Choisissez le format d'export pour les notes de l'évaluation "{evaluation.nom}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid grid-cols-3 gap-4 py-4">
              <Button
                variant="outline"
                onClick={() => handleExport('xlsx')}
                disabled={exportMutation.isPending}
                className="h-20 flex-col"
              >
                <FileText className="w-8 h-8 mb-2 text-green-600" />
                <span>Excel</span>
                <span className="text-xs text-gray-500">.xlsx</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('csv')}
                disabled={exportMutation.isPending}
                className="h-20 flex-col"
              >
                <FileText className="w-8 h-8 mb-2 text-blue-600" />
                <span>CSV</span>
                <span className="text-xs text-gray-500">.csv</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => handleExport('pdf')}
                disabled={exportMutation.isPending}
                className="h-20 flex-col"
              >
                <FileText className="w-8 h-8 mb-2 text-red-600" />
                <span>PDF</span>
                <span className="text-xs text-gray-500">.pdf</span>
              </Button>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowExportDialog(false)}>
                Annuler
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Alertes et notifications - INCHANGÉES */}
        {!peutSaisir && (
          <div className="fixed bottom-4 right-4 max-w-md">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 text-red-700">
                  <AlertCircle className="w-5 h-5" />
                  <div>
                    <p className="font-medium">Saisie non autorisée</p>
                    <p className="text-sm">
                      Le délai de saisie est dépassé. Contactez l'administration.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {saving && (
          <div className="fixed bottom-4 left-4">
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-blue-700">
                  <Loading size="sm" />
                  <span className="text-sm">Sauvegarde automatique...</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};

export default NotesPage;