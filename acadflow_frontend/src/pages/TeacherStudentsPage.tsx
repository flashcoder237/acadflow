// ========================================
// FICHIER: src/pages/TeacherStudentsPage.tsx - Gestion des étudiants par l'enseignant
// ========================================

import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Users, 
  Search, 
  Filter, 
  Eye, 
  UserCheck, 
  UserX,
  Award,
  TrendingUp,
  TrendingDown,
  Calendar,
  Phone,
  Mail,
  Download,
  Upload,
  BarChart3,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  BookOpen,
  FileText,
  Edit,
  MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import { useSessions, useNotificationActions } from '@/stores/appStore';
import { teacherApi } from '@/lib/teacherApi';
import { apiClient } from '@/lib/api';
import { formatDate, cn } from '@/lib/utils';
import { EtudiantDetails, EnseignantFilters } from '@/types/teacher';

type SortField = 'nom' | 'matricule' | 'classe' | 'moyenne' | 'presence';
type SortOrder = 'asc' | 'desc';
type FilterType = 'tous' | 'excellents' | 'en_difficulte' | 'absents_frequents' | 'progression_positive';

const TeacherStudentsPage: React.FC = () => {
  const { user } = useAuthStore();
  const sessions = useSessions();
  const { showSuccess, showError } = useNotificationActions();

  // États locaux
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedClasse, setSelectedClasse] = useState<string>('all');
  const [filterType, setFilterType] = useState<FilterType>('tous');
  const [sortField, setSortField] = useState<SortField>('nom');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedStudent, setSelectedStudent] = useState<EtudiantDetails | null>(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);

  // Query pour charger les étudiants de l'enseignant
  const { 
    data: etudiants, 
    isLoading, 
    error,
    refetch 
  } = useQuery({
    queryKey: ['teacher-students', user?.enseignant_id, selectedSession, selectedClasse, searchTerm],
    queryFn: () => teacherApi.getEtudiantsEnseignant({
      session: selectedSession !== 'all' ? parseInt(selectedSession) : undefined,
      classe: selectedClasse !== 'all' ? parseInt(selectedClasse) : undefined,
      search: searchTerm || undefined
    }),
    enabled: !!user?.enseignant_id,
    staleTime: 2 * 60 * 1000
  });

  // Query pour charger les enseignements (pour les filtres de classe)
  const { data: enseignements } = useQuery({
    queryKey: ['enseignements-for-filter', user?.enseignant_id],
    queryFn: () => apiClient.getEnseignements({ page_size: 100 }),
    enabled: !!user?.enseignant_id
  });

  // Traitement et filtrage des étudiants
  const etudiantsFiltres = useMemo(() => {
    if (!etudiants?.results) return [];

    let filtered = etudiants.results.filter(etudiant => {
      // Filtre par type
      switch (filterType) {
        case 'excellents':
          return Object.values(etudiant.moyennes).some(m => m.moyenne >= 16);
        case 'en_difficulte':
          return Object.values(etudiant.moyennes).some(m => m.moyenne < 10);
        case 'absents_frequents':
          return etudiant.absences.non_justifiees > 3;
        case 'progression_positive':
          return etudiant.progression.pourcentage > 75;
        default:
          return true;
      }
    });

    // Tri
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortField) {
        case 'nom':
          comparison = a.nom_complet.localeCompare(b.nom_complet);
          break;
        case 'matricule':
          comparison = a.matricule.localeCompare(b.matricule);
          break;
        case 'classe':
          comparison = a.classe.localeCompare(b.classe);
          break;
        case 'moyenne':
          const moyA = Object.values(a.moyennes).reduce((sum, m) => sum + m.moyenne, 0) / Object.keys(a.moyennes).length || 0;
          const moyB = Object.values(b.moyennes).reduce((sum, m) => sum + m.moyenne, 0) / Object.keys(b.moyennes).length || 0;
          comparison = moyA - moyB;
          break;
        case 'presence':
          const presenceA = ((a.absences.total - a.absences.non_justifiees) / Math.max(a.absences.total, 1)) * 100;
          const presenceB = ((b.absences.total - b.absences.non_justifiees) / Math.max(b.absences.total, 1)) * 100;
          comparison = presenceA - presenceB;
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [etudiants?.results, filterType, sortField, sortOrder]);

  // Statistiques calculées
  const stats = useMemo(() => {
    if (!etudiantsFiltres.length) return null;

    const totalEtudiants = etudiantsFiltres.length;
    const moyennesGenerales = etudiantsFiltres.map(e => {
      const moyennes = Object.values(e.moyennes);
      return moyennes.length > 0 ? moyennes.reduce((sum, m) => sum + m.moyenne, 0) / moyennes.length : 0;
    });

    const moyenneClasse = moyennesGenerales.reduce((sum, m) => sum + m, 0) / totalEtudiants;
    const excellents = moyennesGenerales.filter(m => m >= 16).length;
    const enDifficulte = moyennesGenerales.filter(m => m < 10).length;
    const tauxReussite = ((totalEtudiants - enDifficulte) / totalEtudiants) * 100;

    return {
      totalEtudiants,
      moyenneClasse,
      excellents,
      enDifficulte,
      tauxReussite,
      tauxPresence: etudiantsFiltres.reduce((sum, e) => {
        const presence = e.absences.total > 0 
          ? ((e.absences.total - e.absences.non_justifiees) / e.absences.total) * 100 
          : 100;
        return sum + presence;
      }, 0) / totalEtudiants
    };
  }, [etudiantsFiltres]);

  // Handlers
  const handleViewStudentDetails = async (etudiant: EtudiantDetails) => {
    try {
      const details = await teacherApi.getDetailsEtudiant(etudiant.id, user!.enseignant_id!);
      setSelectedStudent(details);
      setShowStudentDetails(true);
    } catch (error) {
      showError('Erreur', 'Impossible de charger les détails de l\'étudiant');
    }
  };

  const handleExportStudentData = async () => {
    try {
      const blob = await teacherApi.exporterDonnees({
        format: 'xlsx',
        type: 'notes',
        session_id: selectedSession !== 'all' ? parseInt(selectedSession) : undefined
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `etudiants_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Export réussi', 'Liste des étudiants exportée');
    } catch (error) {
      showError('Erreur d\'export', 'Impossible d\'exporter les données');
    }
  };

  const getMoyenneGenerale = (etudiant: EtudiantDetails) => {
    const moyennes = Object.values(etudiant.moyennes);
    return moyennes.length > 0 ? moyennes.reduce((sum, m) => sum + m.moyenne, 0) / moyennes.length : 0;
  };

  const getMentionColor = (moyenne: number) => {
    if (moyenne >= 16) return "text-green-600";
    if (moyenne >= 14) return "text-blue-600";
    if (moyenne >= 12) return "text-orange-600";
    if (moyenne >= 10) return "text-gray-600";
    return "text-red-600";
  };

  const getPresenceRate = (etudiant: EtudiantDetails) => {
    if (etudiant.absences.total === 0) return 100;
    return ((etudiant.absences.total - etudiant.absences.non_justifiees) / etudiant.absences.total) * 100;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Chargement des étudiants..." />
      </div>
    );
  }

  if (error) {
    return (
      <Alert className="border-red-200 bg-red-50">
        <XCircle className="w-4 h-4 text-red-600" />
        <AlertDescription className="text-red-800">
          Erreur lors du chargement des étudiants. Veuillez réessayer.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes étudiants</h1>
          <p className="text-gray-600">
            Suivi et gestion de vos étudiants
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="text-sm">
            {etudiantsFiltres.length} étudiant(s)
          </Badge>
          <Button onClick={handleExportStudentData} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Statistiques globales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalEtudiants}</div>
              <p className="text-sm text-gray-600">Total étudiants</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.moyenneClasse.toFixed(1)}/20</div>
              <p className="text-sm text-gray-600">Moyenne classe</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.excellents}</div>
              <p className="text-sm text-gray-600">Excellents (≥16)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-red-600">{stats.enDifficulte}</div>
              <p className="text-sm text-gray-600">En difficulté (moins de 10)</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-orange-600">{stats.tauxPresence.toFixed(1)}%</div>
              <p className="text-sm text-gray-600">Taux présence</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4">
            {/* Recherche */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher un étudiant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Session */}
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les sessions</SelectItem>
                {sessions.map(session => (
                  <SelectItem key={session.id} value={session.id.toString()}>
                    {session.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Classe */}
            <Select value={selectedClasse} onValueChange={setSelectedClasse}>
              <SelectTrigger>
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                {enseignements?.results.map(enseignement => (
                  <SelectItem key={enseignement.id} value={enseignement.classe.toString()}>
                    {enseignement.classe_nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Filtre par type */}
            <Select value={filterType} onValueChange={(value) => setFilterType(value as FilterType)}>
              <SelectTrigger>
                <SelectValue placeholder="Filtre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tous">Tous les étudiants</SelectItem>
                <SelectItem value="excellents">Excellents (≥16)</SelectItem>
                <SelectItem value="en_difficulte">En difficulté (moins de 10)</SelectItem>
                <SelectItem value="absents_frequents">Absents fréquents</SelectItem>
                <SelectItem value="progression_positive">Bonne progression</SelectItem>
              </SelectContent>
            </Select>

            {/* Tri */}
            <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
              <SelectTrigger>
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="nom">Nom</SelectItem>
                <SelectItem value="matricule">Matricule</SelectItem>
                <SelectItem value="classe">Classe</SelectItem>
                <SelectItem value="moyenne">Moyenne</SelectItem>
                <SelectItem value="presence">Présence</SelectItem>
              </SelectContent>
            </Select>

            {/* Ordre de tri */}
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="w-full"
            >
              {sortOrder === 'asc' ? (
                <TrendingUp className="w-4 h-4 mr-2" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-2" />
              )}
              {sortOrder === 'asc' ? 'Croissant' : 'Décroissant'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Liste des étudiants */}
      {etudiantsFiltres.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {etudiantsFiltres.map((etudiant) => {
            const moyenneGenerale = getMoyenneGenerale(etudiant);
            const tauxPresence = getPresenceRate(etudiant);
            
            return (
              <Card 
                key={etudiant.id} 
                className="hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => handleViewStudentDetails(etudiant)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                        {etudiant.photo ? (
                          <img 
                            src={etudiant.photo} 
                            alt={etudiant.nom_complet}
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <Users className="w-6 h-6 text-white" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {etudiant.nom_complet}
                        </h3>
                        <p className="text-sm text-gray-600">{etudiant.matricule}</p>
                        <p className="text-xs text-gray-500">{etudiant.classe}</p>
                      </div>
                    </div>
                    <Badge 
                      variant={etudiant.statut === 'inscrit' ? 'success' : 'secondary'}
                      className="text-xs"
                    >
                      {etudiant.statut}
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Moyenne générale */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Moyenne générale</span>
                    <span className={cn(
                      "text-lg font-bold",
                      getMentionColor(moyenneGenerale)
                    )}>
                      {moyenneGenerale.toFixed(1)}/20
                    </span>
                  </div>

                  {/* Barre de progression des notes */}
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">Progression notes</span>
                      <span className="font-medium">{etudiant.progression.pourcentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={cn(
                          "h-2 rounded-full transition-all duration-300",
                          etudiant.progression.pourcentage >= 80 ? "bg-green-500" :
                          etudiant.progression.pourcentage >= 60 ? "bg-orange-500" : "bg-red-500"
                        )}
                        style={{ width: `${etudiant.progression.pourcentage}%` }}
                      />
                    </div>
                  </div>

                  {/* Statistiques rapides */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-blue-50 rounded">
                      <div className="text-sm font-semibold text-blue-700">
                        {etudiant.progression.notes_saisies}/{etudiant.progression.total_evaluations}
                      </div>
                      <div className="text-xs text-blue-600">Notes</div>
                    </div>
                    <div className={cn(
                      "p-2 rounded",
                      tauxPresence >= 90 ? "bg-green-50" : tauxPresence >= 75 ? "bg-orange-50" : "bg-red-50"
                    )}>
                      <div className={cn(
                        "text-sm font-semibold",
                        tauxPresence >= 90 ? "text-green-700" : tauxPresence >= 75 ? "text-orange-700" : "text-red-700"
                      )}>
                        {tauxPresence.toFixed(0)}%
                      </div>
                      <div className={cn(
                        "text-xs",
                        tauxPresence >= 90 ? "text-green-600" : tauxPresence >= 75 ? "text-orange-600" : "text-red-600"
                      )}>
                        Présence
                      </div>
                    </div>
                    <div className="p-2 bg-purple-50 rounded">
                      <div className="text-sm font-semibold text-purple-700">
                        {Object.keys(etudiant.moyennes).length}
                      </div>
                      <div className="text-xs text-purple-600">Matières</div>
                    </div>
                  </div>

                  {/* Alertes */}
                  {(moyenneGenerale < 10 || etudiant.absences.non_justifiees > 3) && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="text-xs text-red-700">
                        {moyenneGenerale < 10 && "Moyenne en dessous de 10"}
                        {moyenneGenerale < 10 && etudiant.absences.non_justifiees > 3 && " • "}
                        {etudiant.absences.non_justifiees > 3 && "Absences fréquentes"}
                      </div>
                    </div>
                  )}

                  {/* Contact rapide */}
                  <div className="flex items-center gap-2 pt-2 border-t">
                    {etudiant.email && (
                      <Button variant="ghost" size="sm" className="flex-1 text-xs">
                        <Mail className="w-3 h-3 mr-1" />
                        Email
                      </Button>
                    )}
                    {etudiant.telephone && (
                      <Button variant="ghost" size="sm" className="flex-1 text-xs">
                        <Phone className="w-3 h-3 mr-1" />
                        Tel
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="flex-1 text-xs">
                      <Eye className="w-3 h-3 mr-1" />
                      Détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucun étudiant trouvé
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterType !== 'tous'
                ? "Aucun étudiant ne correspond aux critères de recherche"
                : "Vous n'avez pas d'étudiants assignés pour le moment"
              }
            </p>
            <div className="flex justify-center gap-3">
              {searchTerm && (
                <Button onClick={() => setSearchTerm('')} variant="outline">
                  Effacer la recherche
                </Button>
              )}
              {filterType !== 'tous' && (
                <Button onClick={() => setFilterType('tous')} variant="outline">
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de détails d'un étudiant */}
      <Dialog open={showStudentDetails} onOpenChange={setShowStudentDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                {selectedStudent?.photo ? (
                  <img 
                    src={selectedStudent.photo} 
                    alt={selectedStudent.nom_complet}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-bold">{selectedStudent?.nom_complet}</h2>
                <p className="text-sm text-gray-600">{selectedStudent?.matricule} • {selectedStudent?.classe}</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Informations détaillées et performances de l'étudiant
            </DialogDescription>
          </DialogHeader>

          {selectedStudent && (
            <Tabs defaultValue="performance" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="performance">Performances</TabsTrigger>
                <TabsTrigger value="absences">Absences</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="evolution">Évolution</TabsTrigger>
              </TabsList>

              <TabsContent value="performance" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {getMoyenneGenerale(selectedStudent).toFixed(1)}/20
                      </div>
                      <p className="text-sm text-gray-600">Moyenne générale</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedStudent.progression.pourcentage}%
                      </div>
                      <p className="text-sm text-gray-600">Progression</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Object.keys(selectedStudent.moyennes).length}
                      </div>
                      <p className="text-sm text-gray-600">Matières suivies</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Moyennes par matière</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(selectedStudent.moyennes).map(([ecCode, data]) => (
                        <div key={ecCode} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <h4 className="font-medium text-gray-900">{ecCode}</h4>
                            <p className="text-sm text-gray-600">
                              {data.validee ? 'Validé' : 'Non validé'}
                              {data.derniere_evaluation && ` • Dernière éval: ${formatDate(data.derniere_evaluation)}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className={cn(
                              "text-lg font-bold",
                              getMentionColor(data.moyenne)
                            )}>
                              {data.moyenne.toFixed(1)}/20
                            </span>
                            <div>
                              {data.validee ? (
                                <CheckCircle className="w-4 h-4 text-green-500 inline" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 inline" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="absences" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {selectedStudent.absences.total}
                      </div>
                      <p className="text-sm text-gray-600">Total absences</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {selectedStudent.absences.justifiees}
                      </div>
                      <p className="text-sm text-gray-600">Justifiées</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-red-600">
                        {selectedStudent.absences.non_justifiees}
                      </div>
                      <p className="text-sm text-gray-600">Non justifiées</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Taux de présence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Présence globale</span>
                        <span className={cn(
                          "font-bold",
                          getPresenceRate(selectedStudent) >= 90 ? "text-green-600" :
                          getPresenceRate(selectedStudent) >= 75 ? "text-orange-600" : "text-red-600"
                        )}>
                          {getPresenceRate(selectedStudent).toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3">
                        <div 
                          className={cn(
                            "h-3 rounded-full transition-all duration-300",
                            getPresenceRate(selectedStudent) >= 90 ? "bg-green-500" :
                            getPresenceRate(selectedStudent) >= 75 ? "bg-orange-500" : "bg-red-500"
                          )}
                          style={{ width: `${getPresenceRate(selectedStudent)}%` }}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Informations de contact</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {selectedStudent.email && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Email</p>
                          <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                          <Mail className="w-4 h-4 mr-2" />
                          Contacter
                        </Button>
                      </div>
                    )}

                    {selectedStudent.telephone && (
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium">Téléphone</p>
                          <p className="text-sm text-gray-600">{selectedStudent.telephone}</p>
                        </div>
                        <Button variant="outline" size="sm" className="ml-auto">
                          <Phone className="w-4 h-4 mr-2" />
                          Appeler
                        </Button>
                      </div>
                    )}

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Users className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-medium">Classe</p>
                        <p className="text-sm text-gray-600">{selectedStudent.classe} • {selectedStudent.niveau}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="evolution" className="space-y-4">
                <Card>
                  <CardContent className="p-12 text-center">
                    <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      Évolution des performances
                    </h3>
                    <p className="text-gray-600">
                      Cette fonctionnalité sera implémentée pour afficher l'évolution 
                      des notes et performances de l'étudiant au fil du temps.
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherStudentsPage;