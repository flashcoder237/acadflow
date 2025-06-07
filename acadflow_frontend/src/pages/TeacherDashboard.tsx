// ========================================
// FICHIER: src/pages/TeacherDashboard.tsx - Dashboard enseignant complet
// ========================================

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  FileText, 
  Users, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Edit,
  Loader2,
  RefreshCw,
  BarChart3,
  Target,
  Bell,
  Download,
  Upload,
  UserCheck,
  UserX,
  Award,
  Bookmark,
  Filter,
  Search,
  Settings,
  HelpCircle,
  MessageSquare,
  ClipboardList
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore, useNotificationActions, useSessions } from '@/stores/appStore';
import { teacherApi } from '@/lib/teacherApi';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { Enseignement, Evaluation } from '@/types';
import { StatistiquesEnseignant, PlanningEnseignant, NotificationEnseignant } from '@/types/teacher';

const TeacherDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { anneeAcademique, sessions, etablissement } = useAppStore();
  const { showSuccess, showError, showWarning } = useNotificationActions();
  
  // États locaux
  const [activeTab, setActiveTab] = useState('apercu');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedSemestre, setSelectedSemestre] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Query pour charger les statistiques enseignant
  const { 
    data: stats, 
    isLoading: loadingStats, 
    error: errorStats,
    refetch: refetchStats 
  } = useQuery({
    queryKey: ['teacher-stats', user?.enseignant_id, selectedSession, selectedSemestre],
    queryFn: () => teacherApi.getStatistiquesEnseignant({
      session: selectedSession !== 'all' ? parseInt(selectedSession) : undefined,
      semestre: selectedSemestre !== 'all' ? parseInt(selectedSemestre) : undefined
    }),
    enabled: !!user?.enseignant_id,
    refetchInterval: 2 * 60 * 1000, // 2 minutes
    staleTime: 1 * 60 * 1000 // 1 minute
  });

  // Query pour le planning
  const { data: planning, isLoading: loadingPlanning } = useQuery({
    queryKey: ['teacher-planning', user?.enseignant_id],
    queryFn: () => teacherApi.getPlanningEnseignant(user!.enseignant_id!),
    enabled: !!user?.enseignant_id,
    refetchInterval: 5 * 60 * 1000 // 5 minutes
  });

  // Query pour les notifications
  const { data: notifications, isLoading: loadingNotifications } = useQuery({
    queryKey: ['teacher-notifications', user?.enseignant_id],
    queryFn: () => teacherApi.getNotificationsEnseignant(user!.enseignant_id!),
    enabled: !!user?.enseignant_id,
    refetchInterval: 30 * 1000 // 30 secondes
  });

  // Query pour les enseignements
  const { data: enseignements, isLoading: loadingEnseignements } = useQuery({
    queryKey: ['enseignements-teacher', searchTerm, filterStatus],
    queryFn: () => apiClient.getEnseignements({
      search: searchTerm || undefined,
      page_size: 50
    }),
    enabled: !!user?.enseignant_id
  });

  // Query pour les évaluations récentes
  const { data: evaluations, isLoading: loadingEvaluations } = useQuery({
    queryKey: ['evaluations-teacher', selectedSession, filterStatus],
    queryFn: () => apiClient.getEvaluations({
      session: selectedSession !== 'all' ? selectedSession : undefined,
      saisie_terminee: filterStatus === 'terminee' ? true : 
                     filterStatus === 'en_attente' ? false : undefined,
      page_size: 20,
      ordering: '-date_evaluation'
    }),
    enabled: !!user?.enseignant_id
  });

  // Calculer les statistiques dérivées
  const evaluationsUrgentes = evaluations?.results.filter(evaluation => {
    if (!evaluation.date_limite_saisie || evaluation.saisie_terminee) return false;
    const limite = new Date(evaluation.date_limite_saisie);
    const maintenant = new Date();
    const diff = limite.getTime() - maintenant.getTime();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 jours
  }) || [];

  const notificationsNonLues = notifications?.filter(n => !n.lue) || [];

  // Session active
  const sessionActuelle = sessions.find(s => {
    if (!s.date_debut_session || !s.date_fin_session) return false;
    const now = new Date();
    const debut = new Date(s.date_debut_session);
    const fin = new Date(s.date_fin_session);
    return now >= debut && now <= fin;
  });

  // Handler pour marquer une notification comme lue
  const handleMarkNotificationRead = async (notificationId: string) => {
    try {
      await teacherApi.marquerNotificationLue(notificationId);
      // Recharger les notifications
      refetchStats();
    } catch (error) {
      showError('Erreur', 'Impossible de marquer la notification comme lue');
    }
  };

  // Handler pour l'export rapide
  const handleQuickExport = async (type: 'statistiques' | 'planning') => {
    try {
      const blob = await teacherApi.exporterDonnees({
        format: 'xlsx',
        type: type === 'statistiques' ? 'statistiques' : 'notes',
        session_id: selectedSession !== 'all' ? parseInt(selectedSession) : undefined
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Export réussi', `${type} exporté avec succès`);
    } catch (error) {
      showError('Erreur d\'export', 'Impossible d\'exporter les données');
    }
  };

  if (loadingStats && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loading size="lg" text="Chargement de votre espace enseignant..." />
          <p className="mt-4 text-sm text-gray-600">Préparation de votre tableau de bord</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header personnalisé avec salutation et contexte */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 rounded-xl p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bonjour, {user?.first_name} {user?.last_name} 👋
            </h1>
            <p className="text-gray-600 mb-3">
              {loadingStats ? (
                "Chargement de vos données d'enseignement..."
              ) : stats ? (
                `Vous gérez ${stats.totalEnseignements} enseignement(s) avec ${stats.totalEtudiants} étudiants`
              ) : (
                "Bienvenue dans votre espace enseignant"
              )}
            </p>
            
            {/* Informations contextuelles */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {etablissement && (
                <div className="flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    {etablissement.acronyme}
                  </span>
                </div>
              )}
              
              {anneeAcademique && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">
                    {anneeAcademique.libelle}
                  </span>
                </div>
              )}
              
              {sessionActuelle && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">
                    Session : {sessionActuelle.nom}
                  </span>
                </div>
              )}

              {/* Indicateur de notifications */}
              {notificationsNonLues.length > 0 && (
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700">
                    {notificationsNonLues.length} notification(s)
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Actions rapides */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            {notificationsNonLues.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveTab('notifications')}
                className="bg-orange-50 border-orange-200 text-orange-700 hover:bg-orange-100 relative"
              >
                <Bell className="w-4 h-4" />
                <Badge 
                  variant="destructive" 
                  className="absolute -top-2 -right-2 w-5 h-5 text-xs flex items-center justify-center p-0"
                >
                  {notificationsNonLues.length}
                </Badge>
              </Button>
            )}

            {/* Refresh */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchStats()}
              disabled={loadingStats}
              className="bg-white/80"
            >
              {loadingStats ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            
            {/* Export rapide */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickExport('statistiques')}
              className="bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
            
            {/* Avatar enseignant */}
            <div className="hidden sm:block">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                {user?.photo ? (
                  <img 
                    src={user.photo} 
                    alt="Photo"
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <Users className="w-6 h-6 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Alertes urgentes */}
      {evaluationsUrgentes.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="w-4 h-4 text-red-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-red-800">Attention !</strong>
                <span className="text-red-700 ml-2">
                  {evaluationsUrgentes.length} évaluation(s) nécessitent une saisie urgente (délai de moins de 3 jours)
                </span>
              </div>
              <Button 
                asChild 
                size="sm" 
                className="bg-red-600 hover:bg-red-700"
              >
                <Link to="/evaluations?filter=urgent">
                  Voir tout
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Filtres globaux */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Rechercher enseignements, évaluations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger className="w-48">
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

            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="en_attente">En attente</SelectItem>
                <SelectItem value="terminee">Terminées</SelectItem>
                <SelectItem value="urgent">Urgentes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="apercu" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Aperçu</span>
          </TabsTrigger>
          <TabsTrigger value="enseignements" className="flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            <span className="hidden sm:inline">Enseignements</span>
          </TabsTrigger>
          <TabsTrigger value="evaluations" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            <span className="hidden sm:inline">Évaluations</span>
          </TabsTrigger>
          <TabsTrigger value="etudiants" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="hidden sm:inline">Étudiants</span>
          </TabsTrigger>
          <TabsTrigger value="planning" className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            <span className="hidden sm:inline">Planning</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Alertes</span>
            {notificationsNonLues.length > 0 && (
              <Badge variant="destructive" className="text-xs w-5 h-5 p-0">
                {notificationsNonLues.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab: Aperçu */}
        <TabsContent value="apercu" className="space-y-6">
          {/* Cartes de statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              title="Enseignements"
              value={stats?.totalEnseignements || 0}
              icon={BookOpen}
              description="Matières assignées"
              color="blue"
              isLoading={loadingStats}
              onClick={() => setActiveTab('enseignements')}
            />
            
            <StatCard
              title="Étudiants"
              value={stats?.totalEtudiants || 0}
              icon={Users}
              description="Total concernés"
              color="green"
              isLoading={loadingStats}
              onClick={() => setActiveTab('etudiants')}
            />
            
            <StatCard
              title="Évaluations"
              value={stats?.totalEvaluations || 0}
              icon={FileText}
              description="Total créées"
              color="purple"
              isLoading={loadingStats}
              badge={evaluationsUrgentes.length > 0 ? evaluationsUrgentes.length.toString() : undefined}
              onClick={() => setActiveTab('evaluations')}
            />
            
            <StatCard
              title="Taux saisie"
              value={`${stats?.tauxSaisie || 0}%`}
              icon={TrendingUp}
              description="Notes complétées"
              color="orange"
              isLoading={loadingStats}
              trend={{
                value: stats?.tauxSaisie >= 80 ? "Excellent" : stats?.tauxSaisie >= 60 ? "Bon" : "À améliorer",
                positive: (stats?.tauxSaisie || 0) >= 80
              }}
            />
          </div>

          {/* Performances par EC et tendances */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performances par EC */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Performances par EC
                </CardTitle>
                <CardDescription>
                  Vue d'ensemble de vos enseignements
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loading size="md" text="Chargement..." />
                  </div>
                ) : stats?.performancesParEC?.length ? (
                  <div className="space-y-4">
                    {stats.performancesParEC.slice(0, 5).map((perf, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 truncate">
                            {perf.ec_code} - {perf.ec_nom}
                          </h4>
                          <p className="text-sm text-gray-600">
                            {perf.classe} • {perf.effectif} étudiants • {perf.evaluationsCount} évaluation(s)
                          </p>
                        </div>
                        <div className="text-right ml-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-gray-900">
                              {perf.moyenne.toFixed(1)}/20
                            </span>
                            <Badge 
                              variant={perf.tauxReussite >= 75 ? "success" : 
                                     perf.tauxReussite >= 60 ? "warning" : "destructive"}
                              className="text-xs"
                            >
                              {perf.tauxReussite}%
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {stats.performancesParEC.length > 5 && (
                      <Button 
                        variant="ghost" 
                        className="w-full"
                        onClick={() => setActiveTab('enseignements')}
                      >
                        Voir tous les enseignements
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Target className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucune donnée de performance disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Répartition des notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-5 h-5" />
                  Répartition des notes
                </CardTitle>
                <CardDescription>
                  Distribution globale des résultats
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingStats ? (
                  <div className="flex items-center justify-center py-8">
                    <Loading size="md" text="Chargement..." />
                  </div>
                ) : stats?.repartitionNotes ? (
                  <div className="space-y-4">
                    {Object.entries(stats.repartitionNotes).map(([mention, count]) => {
                      const getMentionData = (key: string) => {
                        const data = {
                          excellent: { label: 'Très Bien (≥16)', color: 'bg-green-500', textColor: 'text-green-700' },
                          bien: { label: 'Bien (14-15.99)', color: 'bg-blue-500', textColor: 'text-blue-700' },
                          assezBien: { label: 'Assez Bien (12-13.99)', color: 'bg-orange-500', textColor: 'text-orange-700' },
                          passable: { label: 'Passable (10-11.99)', color: 'bg-yellow-500', textColor: 'text-yellow-700' },
                          insuffisant: { label: 'Insuffisant (<10)', color: 'bg-red-500', textColor: 'text-red-700' }
                        };
                        return data[key as keyof typeof data] || { label: key, color: 'bg-gray-500', textColor: 'text-gray-700' };
                      };

                      const mentionData = getMentionData(mention);
                      const total = Object.values(stats.repartitionNotes).reduce((sum, val) => sum + val, 0);
                      const percentage = total > 0 ? (count / total) * 100 : 0;

                      return (
                        <div key={mention} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${mentionData.color}`} />
                            <span className="text-sm font-medium">{mentionData.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div 
                                className={`h-2 rounded-full ${mentionData.color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium w-8 text-right">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 text-gray-500">
                    <Award className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">Aucune donnée de répartition disponible</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Actions rapides et raccourcis */}
          <Card>
            <CardHeader>
              <CardTitle>Actions rapides</CardTitle>
              <CardDescription>
                Accédez rapidement aux fonctionnalités principales
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <QuickActionButton
                  title="Saisir notes"
                  description="Accéder aux feuilles de notes"
                  icon={Edit}
                  onClick={() => navigate('/evaluations?filter=en_attente')}
                  color="blue"
                  badge={stats?.evaluationsEnAttente}
                />
                
                <QuickActionButton
                  title="Mes étudiants"
                  description="Liste de tous mes étudiants"
                  icon={Users}
                  onClick={() => setActiveTab('etudiants')}
                  color="green"
                  badge={stats?.totalEtudiants}
                />
                
                <QuickActionButton
                  title="Statistiques"
                  description="Analyser les performances"
                  icon={BarChart3}
                  onClick={() => navigate('/statistiques')}
                  color="purple"
                />
                
                <QuickActionButton
                  title="Exporter données"
                  description="Télécharger vos données"
                  icon={Download}
                  onClick={() => handleQuickExport('statistiques')}
                  color="orange"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Enseignements */}
        <TabsContent value="enseignements" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mes enseignements</h2>
              <p className="text-gray-600">Gérez vos cours et matières</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {enseignements?.count || 0} enseignement(s)
            </Badge>
          </div>

          {loadingEnseignements ? (
            <div className="flex items-center justify-center py-12">
              <Loading size="lg" text="Chargement des enseignements..." />
            </div>
          ) : enseignements?.results.length ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enseignements.results.map((enseignement) => (
                <EnseignementCard 
                  key={enseignement.id} 
                  enseignement={enseignement}
                  onViewDetails={() => navigate(`/enseignements/${enseignement.id}`)}
                  onCreateEvaluation={() => navigate(`/evaluations/create?enseignement=${enseignement.id}`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucun enseignement trouvé
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm 
                    ? "Aucun enseignement ne correspond à votre recherche"
                    : "Vous n'avez pas d'enseignements assignés pour le moment"
                  }
                </p>
                {searchTerm && (
                  <Button onClick={() => setSearchTerm('')} variant="outline">
                    Effacer la recherche
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Évaluations */}
        <TabsContent value="evaluations" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mes évaluations</h2>
              <p className="text-gray-600">Suivi des évaluations et saisie des notes</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {evaluations?.count || 0} évaluation(s)
              </Badge>
              {evaluationsUrgentes.length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {evaluationsUrgentes.length} urgente(s)
                </Badge>
              )}
            </div>
          </div>

          {loadingEvaluations ? (
            <div className="flex items-center justify-center py-12">
              <Loading size="lg" text="Chargement des évaluations..." />
            </div>
          ) : evaluations?.results.length ? (
            <div className="space-y-4">
              {evaluations.results.map((evaluation) => (
                <EvaluationCard 
                  key={evaluation.id} 
                  evaluation={evaluation}
                  onViewDetails={() => navigate(`/evaluations/${evaluation.id}`)}
                  onSaisirNotes={() => navigate(`/evaluations/${evaluation.id}/notes`)}
                  onViewStats={() => navigate(`/evaluations/${evaluation.id}/statistiques`)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune évaluation trouvée
                </h3>
                <p className="text-gray-600 mb-4">
                  Aucune évaluation ne correspond aux critères sélectionnés
                </p>
                <Button onClick={() => setFilterStatus('all')} variant="outline">
                  Voir toutes les évaluations
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Étudiants */}
        <TabsContent value="etudiants" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mes étudiants</h2>
              <p className="text-gray-600">Vue d'ensemble de vos étudiants</p>
            </div>
            <Badge variant="outline" className="text-sm">
              {stats?.totalEtudiants || 0} étudiant(s)
            </Badge>
          </div>

          {/* Cette section nécessiterait une nouvelle query pour charger les étudiants */}
          <Card>
            <CardContent className="p-12 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Liste des étudiants
              </h3>
              <p className="text-gray-600 mb-4">
                Cette fonctionnalité sera implémentée pour afficher la liste détaillée de vos étudiants
                avec leurs performances par matière.
              </p>
              <Button variant="outline" disabled>
                Fonctionnalité en développement
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Planning */}
        <TabsContent value="planning" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Mon planning</h2>
              <p className="text-gray-600">Évaluations à venir et échéances</p>
            </div>
            <Button onClick={() => handleQuickExport('planning')} variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2" />
              Exporter planning
            </Button>
          </div>

          {loadingPlanning ? (
            <div className="flex items-center justify-center py-12">
              <Loading size="lg" text="Chargement du planning..." />
            </div>
          ) : planning ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
             {/* Évaluations à venir */}
<Card>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      <Calendar className="w-5 h-5" />
      Évaluations à venir
    </CardTitle>
  </CardHeader>
  <CardContent>
    {planning.evaluations_a_venir?.length ? (
      <div className="space-y-3">
        {planning.evaluations_a_venir.slice(0, 5).map((evaluation) => (
          <div key={evaluation.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">{evaluation.nom}</h4>
              <p className="text-sm text-gray-600">
                {evaluation.ec} • {evaluation.classe}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(evaluation.date_evaluation)}
              </p>
            </div>
            <Badge variant="outline">
              {evaluation.status}
            </Badge>
          </div>
        ))}
      </div>
    ) : (
      <p className="text-center text-gray-500 py-6">
        Aucune évaluation à venir
      </p>
    )}
  </CardContent>
</Card>

              {/* Échéances proches */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Prochaines échéances
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {planning.prochaines_echeances?.length ? (
                    <div className="space-y-3">
                      {planning.prochaines_echeances.slice(0, 5).map((echeance) => (
                        <div key={echeance.evaluation_id} className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          echeance.urgence === 'critique' ? "bg-red-50 border border-red-200" :
                          echeance.urgence === 'urgent' ? "bg-orange-50 border border-orange-200" :
                          "bg-gray-50"
                        )}>
                          <div>
                            <h4 className="font-medium text-gray-900">{echeance.nom}</h4>
                            <p className="text-sm text-gray-600">{echeance.ec}</p>
                            <p className="text-xs text-gray-500">
                              Délai: {formatDate(echeance.date_limite)}
                            </p>
                          </div>
                          <div className="text-right">
                            <Badge 
                              variant={
                                echeance.urgence === 'critique' ? 'destructive' :
                                echeance.urgence === 'urgent' ? 'warning' : 'secondary'
                              }
                            >
                              {echeance.jours_restants}j
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-gray-500 py-6">
                      Aucune échéance proche
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Planning non disponible
                </h3>
                <p className="text-gray-600">
                  Impossible de charger votre planning pour le moment
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tab: Notifications */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Notifications et alertes</h2>
              <p className="text-gray-600">Messages importants et rappels</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-sm">
                {notifications?.length || 0} notification(s)
              </Badge>
              {notificationsNonLues.length > 0 && (
                <Badge variant="destructive" className="text-sm">
                  {notificationsNonLues.length} non lue(s)
                </Badge>
              )}
            </div>
          </div>

          {loadingNotifications ? (
            <div className="flex items-center justify-center py-12">
              <Loading size="lg" text="Chargement des notifications..." />
            </div>
          ) : notifications?.length ? (
            <div className="space-y-3">
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkAsRead={() => handleMarkNotificationRead(notification.id)}
                />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Aucune notification
                </h3>
                <p className="text-gray-600">
                  Vous n'avez aucune notification pour le moment
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// ========================================
// COMPOSANTS AUXILIAIRES
// ========================================

// Composant pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  isLoading?: boolean;
  badge?: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  onClick?: () => void;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color,
  isLoading = false,
  badge,
  trend,
  onClick
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <Card 
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-lg hover:scale-105"
      )}
      onClick={onClick}
    >
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-medium text-gray-600">{title}</p>
              {badge && (
                <Badge variant="destructive" className="text-xs">
                  {badge}
                </Badge>
              )}
            </div>
            
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
                {trend && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className={cn(
                      "text-xs font-medium",
                      trend.positive ? "text-green-600" : "text-red-600"
                    )}>
                      {trend.value}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
          <div className={cn('p-3 rounded-lg border ml-4', colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour les actions rapides
interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: React.ElementType;
  onClick: () => void;
  color: 'blue' | 'green' | 'purple' | 'orange';
  badge?: number;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  description,
  icon: Icon,
  onClick,
  color,
  badge
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  };

  return (
    <Button
      onClick={onClick}
      variant="outline"
      className={cn(
        "h-auto p-4 bg-gradient-to-r text-white border-0 hover:scale-105 transition-all duration-200 relative",
        colorClasses[color]
      )}
    >
      <div className="text-center w-full">
        <Icon className="w-8 h-8 mx-auto mb-2" />
        <h3 className="font-semibold text-sm">{title}</h3>
        <p className="text-xs opacity-90">{description}</p>
        {badge !== undefined && badge > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-[20px] h-5">
            {badge}
          </Badge>
        )}
      </div>
    </Button>
  );
};

// Composant pour les cartes d'enseignement
interface EnseignementCardProps {
  enseignement: Enseignement;
  onViewDetails: () => void;
  onCreateEvaluation: () => void;
}

const EnseignementCard: React.FC<EnseignementCardProps> = ({ 
  enseignement, 
  onViewDetails,
  onCreateEvaluation 
}) => {
  // Simuler quelques statistiques pour l'exemple
  const stats = {
    nombreEtudiants: Math.floor(Math.random() * 50) + 20,
    nombreEvaluations: Math.floor(Math.random() * 5) + 1,
    notesEnAttente: Math.floor(Math.random() * 3),
    moyenneGenerale: (Math.random() * 8 + 12).toFixed(1)
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 truncate">
              {enseignement.ec_code}
            </CardTitle>
            <CardDescription className="text-sm text-gray-600 mt-1">
              {enseignement.ec_nom}
            </CardDescription>
          </div>
          <Badge 
            variant={enseignement.actif ? "success" : "secondary"}
            className="ml-2 flex-shrink-0"
          >
            {enseignement.actif ? "Actif" : "Inactif"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Informations de base */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <BookOpen className="w-4 h-4" />
            <span className="font-medium">UE:</span>
            <span className="truncate">{enseignement.ue_nom}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">Classe:</span>
            <span className="truncate">{enseignement.classe_nom}</span>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-2 gap-3 py-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.nombreEtudiants}</div>
            <div className="text-xs text-gray-500">Étudiants</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.moyenneGenerale}/20</div>
            <div className="text-xs text-gray-500">Moyenne</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 bg-purple-50 rounded">
            <div className="font-semibold text-purple-700">{stats.nombreEvaluations}</div>
            <div className="text-xs text-purple-600">Évaluations</div>
          </div>
          <div className="text-center p-2 bg-orange-50 rounded">
            <div className={cn(
              "font-semibold",
              stats.notesEnAttente > 0 ? "text-orange-700" : "text-gray-700"
            )}>
              {stats.notesEnAttente}
            </div>
            <div className="text-xs text-orange-600">En attente</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button 
            onClick={onViewDetails}
            variant="outline" 
            size="sm" 
            className="flex-1"
          >
            <Eye className="w-4 h-4 mr-2" />
            Détails
          </Button>
          <Button 
            onClick={onCreateEvaluation}
            variant="default" 
            size="sm" 
            className="flex-1"
          >
            <Plus className="w-4 h-4 mr-2" />
            Évaluation
          </Button>
        </div>

        {/* Indicateur d'urgence */}
        {stats.notesEnAttente > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-orange-600" />
              <span className="text-sm font-medium text-orange-700">
                {stats.notesEnAttente} évaluation(s) en attente de saisie
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Composant pour les cartes d'évaluation
interface EvaluationCardProps {
  evaluation: Evaluation;
  onViewDetails: () => void;
  onSaisirNotes: () => void;
  onViewStats: () => void;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({ 
  evaluation, 
  onViewDetails,
  onSaisirNotes,
  onViewStats 
}) => {
  // Calculer l'urgence
  const getUrgence = () => {
    if (!evaluation.date_limite_saisie) return null;
    const limite = new Date(evaluation.date_limite_saisie);
    const maintenant = new Date();
    const diff = limite.getTime() - maintenant.getTime();
    
    if (diff < 0) return 'dépassée';
    if (diff < 24 * 60 * 60 * 1000) return 'critique';
    if (diff < 3 * 24 * 60 * 60 * 1000) return 'urgente';
    return null;
  };

  const urgence = getUrgence();

  const getStatusBadge = () => {
    if (evaluation.saisie_terminee) {
      return <Badge variant="success">Terminée</Badge>;
    }
    
    switch (urgence) {
      case 'dépassée':
        return <Badge variant="destructive">Dépassée</Badge>;
      case 'critique':
        return <Badge variant="destructive">Critique</Badge>;
      case 'urgente':
        return <Badge variant="warning">Urgente</Badge>;
      default:
        return <Badge variant="secondary">En attente</Badge>;
    }
  };

  return (
    <Card className={cn(
      "hover:shadow-md transition-all duration-200",
      urgence === 'critique' && "border-red-300 bg-red-50",
      urgence === 'urgente' && "border-orange-300 bg-orange-50"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {evaluation.nom}
              </h3>
              {getStatusBadge()}
            </div>

            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>Évaluation du {formatDate(evaluation.date_evaluation)}</span>
              </div>
              
              {evaluation.date_limite_saisie && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span>
                    Limite : {formatDateTime(evaluation.date_limite_saisie)}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{evaluation.type_evaluation_nom}</span>
                <span className="text-gray-400">•</span>
                <span>Note sur {evaluation.note_sur}</span>
              </div>

              {evaluation.session_nom && (
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>Session : {evaluation.session_nom}</span>
                </div>
              )}
            </div>

            {/* Indicateur d'urgence */}
            {urgence && urgence !== 'dépassée' && (
              <div className={cn(
                "mt-3 p-2 rounded-lg text-sm",
                urgence === 'critique' ? "bg-red-100 text-red-700" : "bg-orange-100 text-orange-700"
              )}>
                <AlertTriangle className="w-4 h-4 inline mr-2" />
                {urgence === 'critique' 
                  ? "Saisie requise dans moins de 24h !"
                  : "Saisie requise dans moins de 3 jours"
                }
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            <Button onClick={onViewDetails} variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Détails
            </Button>
            
            {!evaluation.saisie_terminee && (
              <Button onClick={onSaisirNotes} size="sm">
                <Edit className="w-4 h-4 mr-2" />
                Saisir
              </Button>
            )}
            
            {evaluation.saisie_terminee && (
              <Button onClick={onViewStats} variant="outline" size="sm">
                <BarChart3 className="w-4 h-4 mr-2" />
                Stats
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour les cartes de notification
interface NotificationCardProps {
  notification: NotificationEnseignant;
  onMarkAsRead: () => void;
}

const NotificationCard: React.FC<NotificationCardProps> = ({ 
  notification, 
  onMarkAsRead 
}) => {
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'delai_saisie':
        return <Clock className="w-5 h-5" />;
      case 'nouvelle_evaluation':
        return <FileText className="w-5 h-5" />;
      case 'validation_requise':
        return <CheckCircle className="w-5 h-5" />;
      case 'modification_autorisee':
        return <Edit className="w-5 h-5" />;
      default:
        return <Bell className="w-5 h-5" />;
    }
  };

  const getNotificationColor = (urgence: string) => {
    switch (urgence) {
      case 'critique':
        return 'border-red-200 bg-red-50';
      case 'haute':
        return 'border-orange-200 bg-orange-50';
      case 'moyenne':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const getTextColor = (urgence: string) => {
    switch (urgence) {
      case 'critique':
        return 'text-red-800';
      case 'haute':
        return 'text-orange-800';
      case 'moyenne':
        return 'text-yellow-800';
      default:
        return 'text-blue-800';
    }
  };

  return (
    <Card className={cn(
      "transition-all duration-200",
      getNotificationColor(notification.urgence),
      !notification.lue && "ring-2 ring-blue-400 ring-opacity-50"
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            getNotificationColor(notification.urgence)
          )}>
            {getNotificationIcon(notification.type)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h4 className={cn(
                  "font-semibold text-sm",
                  getTextColor(notification.urgence)
                )}>
                  {notification.titre}
                </h4>
                <p className={cn(
                  "text-sm mt-1",
                  getTextColor(notification.urgence)
                )}>
                  {notification.message}
                </p>
                <p className="text-xs text-gray-500 mt-2">
                  {formatDateTime(notification.date_creation)}
                </p>
              </div>
              
              {!notification.lue && (
                <Button
                  onClick={onMarkAsRead}
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                >
                  Marquer comme lu
                </Button>
              )}
            </div>
            
            {/* Actions spécifiques à la notification */}
            {notification.evaluation_id && (
              <div className="mt-3">
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  <Link to={`/evaluations/${notification.evaluation_id}/notes`}>
                    Accéder à l'évaluation
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeacherDashboard;