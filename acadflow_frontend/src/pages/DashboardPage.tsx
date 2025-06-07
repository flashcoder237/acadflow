// ========================================
// FICHIER: src/pages/DashboardPage.tsx - Dashboard avec vraies données
// ========================================

import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  BookOpen, 
  FileText, 
  GraduationCap, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Edit,
  Loader2,
  RefreshCw,
  BarChart3,
  Target
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore, useNotificationActions } from '@/stores/appStore';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { Enseignement, Evaluation } from '@/types';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { anneeAcademique, sessions, etablissement } = useAppStore();
  const { showError } = useNotificationActions();

  // Requête pour charger les données du dashboard avec vraies données
  const { 
    data: dashboardData, 
    isLoading, 
    error, 
    refetch,
    isRefetching 
  } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: () => apiClient.getDashboardStats(),
    enabled: !!user && user.type_utilisateur === 'enseignant',
    refetchInterval: 5 * 60 * 1000, // Actualiser toutes les 5 minutes
    staleTime: 2 * 60 * 1000, // Considérer les données fraîches pendant 2 minutes
    retry: 2,
    onError: (error: any) => {
      console.error('Erreur dashboard:', error);
      showError(
        'Erreur de chargement',
        'Impossible de charger les données du tableau de bord'
      );
    }
  });

  // Session active
  const sessionActuelle = sessions.find(s => {
    if (!s.date_debut_session || !s.date_fin_session) return false;
    const now = new Date();
    const debut = new Date(s.date_debut_session);
    const fin = new Date(s.date_fin_session);
    return now >= debut && now <= fin;
  });

  // Calcul des évaluations urgentes (délai < 3 jours)
  const evaluationsUrgentes = React.useMemo(() => {
    if (!dashboardData?.evaluationsRecentes) return [];
    
    return dashboardData.evaluationsRecentes.filter((evaluation: Evaluation) => {
      if (!evaluation.date_limite_saisie || evaluation.saisie_terminee) return false;
      const limite = new Date(evaluation.date_limite_saisie);
      const maintenant = new Date();
      const diff = limite.getTime() - maintenant.getTime();
      return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 jours
    });
  }, [dashboardData?.evaluationsRecentes]);

  // Gestion des erreurs avec retry
  if (error && !dashboardData) {
    return (
      <div className="space-y-6">
        {/* Header d'erreur */}
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="w-4 h-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Impossible de charger les données du tableau de bord. 
            Vérifiez votre connexion internet.
          </AlertDescription>
        </Alert>

        {/* Actions de récupération */}
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <XCircle className="w-16 h-16 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Erreur de chargement
            </h3>
            <p className="text-gray-600 mb-4">
              {error.message || 'Une erreur est survenue'}
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={() => refetch()} 
                variant="outline"
                disabled={isRefetching}
              >
                {isRefetching ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4 mr-2" />
                )}
                Réessayer
              </Button>
              <Button asChild variant="outline">
                <Link to="/enseignements">
                  Voir mes enseignements
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec salutation et informations contextuelles */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bonjour, {user?.first_name} {user?.last_name} 👋
            </h1>
            <p className="text-gray-600 mb-3">
              {isLoading ? (
                "Chargement de vos activités d'enseignement..."
              ) : (
                `Voici un aperçu de vos ${dashboardData?.totalEnseignements || 0} enseignements`
              )}
            </p>
            
            {/* Informations contextuelles */}
            <div className="flex flex-wrap items-center gap-4 text-sm">
              {etablissement && (
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-blue-600" />
                  <span className="font-medium text-blue-700">
                    {etablissement.acronyme}
                  </span>
                </div>
              )}
              
              {anneeAcademique && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-700">
                    Année : {anneeAcademique.libelle}
                  </span>
                </div>
              )}
              
              {sessionActuelle && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-green-600" />
                  <span className="text-green-700">
                    Session active : {sessionActuelle.nom}
                  </span>
                </div>
              )}
            </div>
          </div>
          
          {/* Bouton de rafraîchissement */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isRefetching}
              className="bg-white/80"
            >
              {isRefetching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
            </Button>
            
            <div className="hidden sm:block">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                <GraduationCap className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Enseignements"
          value={dashboardData?.totalEnseignements || 0}
          icon={BookOpen}
          description="Cours assignés"
          color="blue"
          isLoading={isLoading}
          trend={user?.nombre_enseignements ? {
            value: dashboardData?.totalEnseignements > user.nombre_enseignements ? "+1" : "0",
            positive: true
          } : undefined}
        />
        
        <StatCard
          title="Évaluations"
          value={dashboardData?.totalEvaluations || 0}
          icon={FileText}
          description="Total créées"
          color="green"
          isLoading={isLoading}
          trend={{
            value: `${dashboardData?.evaluationsRecentes?.length || 0}`,
            label: "récentes",
            positive: true
          }}
        />
        
        <StatCard
          title="En attente"
          value={dashboardData?.evaluationsEnAttente || 0}
          icon={Clock}
          description="Notes à saisir"
          color="orange"
          alert={(dashboardData?.evaluationsEnAttente || 0) > 0}
          isLoading={isLoading}
          trend={{
            value: `${evaluationsUrgentes.length}`,
            label: "urgentes",
            positive: false
          }}
        />
        
        <StatCard
          title="Taux de saisie"
          value={`${dashboardData?.tauxSaisie || 0}%`}
          icon={TrendingUp}
          description="Notes complétées"
          color="purple"
          isLoading={isLoading}
          trend={{
            value: dashboardData?.tauxSaisie >= 80 ? "Excellent" : dashboardData?.tauxSaisie >= 60 ? "Bon" : "À améliorer",
            positive: (dashboardData?.tauxSaisie || 0) >= 80
          }}
        />
      </div>

      {/* Alertes urgentes */}
      {evaluationsUrgentes.length > 0 && (
        <Alert className="border-orange-200 bg-orange-50">
          <AlertTriangle className="w-4 h-4 text-orange-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <div>
                <strong className="text-orange-800">Attention !</strong>
                <span className="text-orange-700 ml-2">
                  {evaluationsUrgentes.length} évaluation(s) nécessitent une saisie urgente
                </span>
              </div>
              <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700">
                <Link to="/evaluations?filter=urgent">
                  Voir tout
                </Link>
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enseignements récents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Mes enseignements</CardTitle>
            <div className="flex items-center gap-2">
              {dashboardData?.totalEnseignements && (
                <Badge variant="outline" className="text-xs">
                  {dashboardData.totalEnseignements}
                </Badge>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/enseignements">
                  <Eye className="w-4 h-4 mr-2" />
                  Voir tout
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="md" text="Chargement..." />
              </div>
            ) : dashboardData?.enseignementsRecents?.length ? (
              <div className="space-y-3">
                {dashboardData.enseignementsRecents.map((enseignement: Enseignement) => (
                  <EnseignementCard 
                    key={enseignement.id} 
                    enseignement={enseignement}
                    showActions={true}
                  />
                ))}
                
                {dashboardData.totalEnseignements > dashboardData.enseignementsRecents.length && (
                  <div className="text-center pt-3 border-t">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/enseignements">
                        Voir {dashboardData.totalEnseignements - dashboardData.enseignementsRecents.length} autres enseignements
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucun enseignement assigné</p>
                <p className="text-xs text-gray-400 mt-1">
                  Contactez l'administration pour obtenir vos affectations
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Évaluations en attente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Évaluations en attente</CardTitle>
            <div className="flex items-center gap-2">
              {dashboardData?.evaluationsEnAttente && (
                <Badge 
                  variant={dashboardData.evaluationsEnAttente > 0 ? "destructive" : "success"}
                  className="text-xs"
                >
                  {dashboardData.evaluationsEnAttente}
                </Badge>
              )}
              <Button asChild variant="outline" size="sm">
                <Link to="/evaluations/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="md" text="Chargement..." />
              </div>
            ) : dashboardData?.evaluationsRecentes?.filter((e: Evaluation) => !e.saisie_terminee)?.length ? (
              <div className="space-y-3">
                {dashboardData.evaluationsRecentes
                  .filter((e: Evaluation) => !e.saisie_terminee)
                  .slice(0, 5)
                  .map((evaluation: Evaluation) => (
                    <EvaluationCard 
                      key={evaluation.id} 
                      evaluation={evaluation}
                      compact={true}
                    />
                  ))}
                
                {dashboardData.evaluationsEnAttente > 5 && (
                  <div className="text-center pt-3 border-t">
                    <Button asChild variant="ghost" size="sm">
                      <Link to="/evaluations?filter=en_attente">
                        Voir {dashboardData.evaluationsEnAttente - 5} autres évaluations
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            ) : dashboardData?.totalEvaluations === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <FileText className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Aucune évaluation créée</p>
                <Button asChild size="sm" className="mt-3">
                  <Link to="/evaluations/create">
                    <Plus className="w-4 h-4 mr-2" />
                    Créer votre première évaluation
                  </Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-6 text-green-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm font-medium">Toutes les notes sont saisies !</p>
                <p className="text-xs text-green-600 mt-1">
                  Excellent travail 🎉
                </p>
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
              title="Nouvelle évaluation"
              description="Créer une évaluation"
              icon={Plus}
              to="/evaluations/create"
              color="blue"
              disabled={!dashboardData?.totalEnseignements}
            />
            
            <QuickActionButton
              title="Saisir des notes"
              description="Remplir une feuille de notes"
              icon={Edit}
              to="/evaluations?filter=en_attente"
              color="green"
              badge={dashboardData?.evaluationsEnAttente}
            />
            
            <QuickActionButton
              title="Voir statistiques"
              description="Analyser les résultats"
              icon={BarChart3}
              to="/statistiques"
              color="purple"
              disabled={!dashboardData?.totalEvaluations}
            />
            
            <QuickActionButton
              title="Mes enseignements"
              description="Gérer mes cours"
              icon={BookOpen}
              to="/enseignements"
              color="orange"
              badge={dashboardData?.totalEnseignements}
            />
          </div>
        </CardContent>
      </Card>

      {/* Informations de contexte */}
      {(isLoading || dashboardData) && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Target className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1 text-sm">
                <p className="font-medium text-blue-900">
                  Objectif : {dashboardData?.tauxSaisie >= 100 ? "Atteint !" : "Compléter toutes les saisies"}
                </p>
                <p className="text-blue-700">
                  {dashboardData?.evaluationsEnAttente > 0 
                    ? `Il reste ${dashboardData.evaluationsEnAttente} évaluation(s) à compléter`
                    : "Toutes vos évaluations sont complètes"
                  }
                </p>
              </div>
              {dashboardData?.tauxSaisie >= 100 && (
                <Badge className="bg-green-100 text-green-800 border-green-200">
                  ✓ Terminé
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Composant pour les cartes de statistiques avec tendances
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  alert?: boolean;
  isLoading?: boolean;
  trend?: {
    value: string;
    label?: string;
    positive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color,
  alert = false,
  isLoading = false,
  trend
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <Card className={cn(alert && 'ring-2 ring-orange-400 ring-opacity-50')}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <>
                <p className="text-2xl font-bold text-gray-900 flex items-center">
                  {value}
                  {alert && <AlertTriangle className="inline w-5 h-5 ml-2 text-orange-500" />}
                </p>
                <p className="text-xs text-gray-500 mt-1">{description}</p>
                {trend && (
                  <div className="flex items-center gap-1 mt-2">
                    <span className={cn(
                      "text-xs font-medium",
                      trend.positive ? "text-green-600" : "text-red-600"
                    )}>
                      {trend.value}
                    </span>
                    {trend.label && (
                      <span className="text-xs text-gray-500">{trend.label}</span>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
          <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour les cartes d'enseignement avec actions
interface EnseignementCardProps {
  enseignement: Enseignement;
  showActions?: boolean;
}

const EnseignementCard: React.FC<EnseignementCardProps> = ({ 
  enseignement, 
  showActions = false 
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-gray-900 truncate">
          {enseignement.ec_code} - {enseignement.ec_nom}
        </h4>
        <p className="text-sm text-gray-600 truncate">
          {enseignement.classe_nom} • {enseignement.ue_nom}
        </p>
      </div>
      {showActions && (
        <div className="flex items-center gap-1 ml-3">
          <Button asChild variant="ghost" size="sm">
            <Link to={`/enseignements/${enseignement.id}`}>
              <Eye className="w-4 h-4" />
            </Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to={`/evaluations/create?enseignement=${enseignement.id}`}>
              <Plus className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
};

// Composant pour les cartes d'évaluation compactes
interface EvaluationCardProps {
  evaluation: Evaluation;
  compact?: boolean;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({ 
  evaluation, 
  compact = false 
}) => {
  const isUrgent = evaluation.date_limite_saisie && 
    new Date(evaluation.date_limite_saisie) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg transition-colors",
      isUrgent ? "bg-red-50 border border-red-200" : "bg-gray-50 hover:bg-gray-100"
    )}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900 truncate">{evaluation.nom}</h4>
          {isUrgent && <Badge variant="destructive" className="text-xs">Urgent</Badge>}
        </div>
        <p className="text-sm text-gray-600 truncate">
          {formatDate(evaluation.date_evaluation)}
          {evaluation.date_limite_saisie && (
            <span className="ml-2 text-xs">
              • Limite: {formatDateTime(evaluation.date_limite_saisie)}
            </span>
          )}
        </p>
      </div>
      <Button asChild variant="ghost" size="sm" className="ml-3">
        <Link to={`/evaluations/${evaluation.id}/notes`}>
          <Edit className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
};

// Composant pour les actions rapides avec état
interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
  disabled?: boolean;
  badge?: number;
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  description,
  icon: Icon,
  to,
  color,
  disabled = false,
  badge
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  };

  const disabledClasses = 'from-gray-300 to-gray-400 cursor-not-allowed';

  if (disabled) {
    return (
      <div className={cn(
        "h-auto p-4 bg-gradient-to-r text-white border-0 rounded-lg opacity-50 cursor-not-allowed",
        disabledClasses
      )}>
        <div className="text-center w-full">
          <Icon className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs opacity-90">{description}</p>
          <p className="text-xs mt-1 opacity-75">Non disponible</p>
        </div>
      </div>
    );
  }

  return (
    <Button
      asChild
      variant="outline"
      className="h-auto p-4 bg-gradient-to-r text-white border-0 hover:scale-105 transition-all duration-200 relative"
      style={{
        background: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`,
      }}
    >
      <Link to={to} className={cn('bg-gradient-to-r', colorClasses[color])}>
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
      </Link>
    </Button>
  );
};

export default DashboardPage;