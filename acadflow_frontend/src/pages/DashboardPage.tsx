// ========================================
// FICHIER: src/pages/DashboardPage.tsx - Tableau de bord avec vraies données
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
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/stores/authStore';
import { useAppStore } from '@/stores/appStore';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { Enseignement, Evaluation } from '@/types';

const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const { anneeAcademique, sessions } = useAppStore();

  // Requête pour charger les données du dashboard
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiClient.getDashboardStats(),
    enabled: !!user?.enseignant_id,
    refetchInterval: 5 * 60 * 1000, // Actualiser toutes les 5 minutes
    staleTime: 2 * 60 * 1000, // Considérer les données fraîches pendant 2 minutes
  });

  // Session active
  const sessionActuelle = sessions.find(s => {
    if (!s.date_debut_session || !s.date_fin_session) return false;
    const now = new Date();
    const debut = new Date(s.date_debut_session);
    const fin = new Date(s.date_fin_session);
    return now >= debut && now <= fin;
  });

  // Calcul des évaluations urgentes
  const evaluationsUrgentes = dashboardData?.evaluationsRecentes?.filter((evaluation: Evaluation) => {
    if (!evaluation.date_limite_saisie || evaluation.saisie_terminee) return false;
    const limite = new Date(evaluation.date_limite_saisie);
    const maintenant = new Date();
    const diff = limite.getTime() - maintenant.getTime();
    return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 jours
  }) || [];

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <XCircle className="w-16 h-16 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Erreur de chargement
          </h3>
          <p className="text-gray-600 mb-4">
            Impossible de charger les données du tableau de bord
          </p>
          <Button onClick={() => refetch()} variant="outline">
            <Loader2 className="w-4 h-4 mr-2" />
            Réessayer
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec salutation */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Bonjour, {user?.first_name} {user?.last_name} 👋
            </h1>
            <p className="text-gray-600">
              Voici un aperçu de vos activités d'enseignement
            </p>
            {anneeAcademique && (
              <div className="flex items-center gap-2 mt-3">
                <Calendar className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Année académique : {anneeAcademique.libelle}
                </span>
                {sessionActuelle && (
                  <>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">
                      Session : {sessionActuelle.nom}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="hidden sm:block">
            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Enseignements"
          value={dashboardData?.totalEnseignements || 0}
          icon={BookOpen}
          description="Cours assignés"
          color="blue"
          isLoading={isLoading}
        />
        <StatCard
          title="Évaluations"
          value={dashboardData?.totalEvaluations || 0}
          icon={FileText}
          description="Total créées"
          color="green"
          isLoading={isLoading}
        />
        <StatCard
          title="En attente"
          value={dashboardData?.evaluationsEnAttente || 0}
          icon={Clock}
          description="Notes à saisir"
          color="yellow"
          alert={(dashboardData?.evaluationsEnAttente || 0) > 0}
          isLoading={isLoading}
        />
        <StatCard
          title="Taux de saisie"
          value={`${dashboardData?.tauxSaisie || 0}%`}
          icon={TrendingUp}
          description="Notes complétées"
          color="indigo"
          isLoading={isLoading}
        />
      </div>

      {/* Alertes urgentes */}
      {evaluationsUrgentes.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <AlertTriangle className="w-5 h-5" />
              Évaluations urgentes
            </CardTitle>
            <CardDescription className="text-orange-700">
              {evaluationsUrgentes.length} évaluation(s) nécessitent une attention immédiate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {evaluationsUrgentes.slice(0, 3).map((evaluation: Evaluation) => (
                <div key={evaluation.id} className="flex items-center justify-between p-2 bg-white rounded border">
                  <div>
                    <p className="font-medium text-gray-900">{evaluation.nom}</p>
                    <p className="text-sm text-gray-600">
                      Limite : {evaluation.date_limite_saisie ? formatDateTime(evaluation.date_limite_saisie) : 'Non définie'}
                    </p>
                  </div>
                  <Button asChild size="sm">
                    <Link to={`/evaluations/${evaluation.id}/notes`}>
                      Saisir
                    </Link>
                  </Button>
                </div>
              ))}
              {evaluationsUrgentes.length > 3 && (
                <div className="text-center pt-2">
                  <Button asChild variant="outline" size="sm">
                    <Link to="/evaluations?status=urgent">
                      Voir toutes ({evaluationsUrgentes.length})
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enseignements récents */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Mes enseignements</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/enseignements">
                <Eye className="w-4 h-4 mr-2" />
                Voir tout
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loading size="md" text="Chargement..." />
              </div>
            ) : dashboardData?.enseignementsRecents?.length ? (
              <div className="space-y-3">
                {dashboardData.enseignementsRecents.map((enseignement: Enseignement) => (
                  <EnseignementCard key={enseignement.id} enseignement={enseignement} />
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-500">
                <BookOpen className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>Aucun enseignement assigné</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Évaluations en attente */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-lg font-semibold">Évaluations en attente</CardTitle>
            <Button asChild variant="outline" size="sm">
              <Link to="/evaluations/create">
                <Plus className="w-4 h-4 mr-2" />
                Créer
              </Link>
            </Button>
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
                    <EvaluationCard key={evaluation.id} evaluation={evaluation} />
                  ))}
              </div>
            ) : (
              <div className="text-center py-6 text-green-600">
                <CheckCircle className="w-8 h-8 mx-auto mb-2" />
                <p>Toutes les notes sont saisies !</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
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
            />
            <QuickActionButton
              title="Saisir des notes"
              description="Remplir une feuille de notes"
              icon={Edit}
              to="/evaluations?filter=en_attente"
              color="green"
            />
            <QuickActionButton
              title="Voir statistiques"
              description="Analyser les résultats"
              icon={TrendingUp}
              to="/statistiques"
              color="purple"
            />
            <QuickActionButton
              title="Mes enseignements"
              description="Gérer mes cours"
              icon={BookOpen}
              to="/enseignements"
              color="orange"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Composant pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  description: string;
  color: 'blue' | 'green' | 'yellow' | 'indigo';
  alert?: boolean;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  color,
  alert = false,
  isLoading = false
}) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200'
  };

  return (
    <Card className={cn(alert && 'ring-2 ring-yellow-400 ring-opacity-50')}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="w-16 h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            ) : (
              <p className="text-2xl font-bold text-gray-900">
                {value}
                {alert && <AlertTriangle className="inline w-5 h-5 ml-2 text-yellow-500" />}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour les cartes d'enseignement
interface EnseignementCardProps {
  enseignement: Enseignement;
}

const EnseignementCard: React.FC<EnseignementCardProps> = ({ enseignement }) => {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900">
          {enseignement.ec_code} - {enseignement.ec_nom}
        </h4>
        <p className="text-sm text-gray-600">
          {enseignement.classe_nom} • {enseignement.ue_nom}
        </p>
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link to={`/enseignements/${enseignement.id}`}>
          <Eye className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
};

// Composant pour les cartes d'évaluation
interface EvaluationCardProps {
  evaluation: Evaluation;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation }) => {
  const isUrgent = evaluation.date_limite_saisie && 
    new Date(evaluation.date_limite_saisie) < new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg transition-colors",
      isUrgent ? "bg-red-50 border border-red-200" : "bg-gray-50 hover:bg-gray-100"
    )}>
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <h4 className="font-medium text-gray-900">{evaluation.nom}</h4>
          {isUrgent && <Badge variant="destructive">Urgent</Badge>}
        </div>
        <p className="text-sm text-gray-600">
          Évaluation du {formatDate(evaluation.date_evaluation)}
        </p>
        {evaluation.date_limite_saisie && (
          <p className="text-xs text-gray-500">
            Limite : {formatDateTime(evaluation.date_limite_saisie)}
          </p>
        )}
      </div>
      <Button asChild variant="ghost" size="sm">
        <Link to={`/evaluations/${evaluation.id}/notes`}>
          <Edit className="w-4 h-4" />
        </Link>
      </Button>
    </div>
  );
};

// Composant pour les actions rapides
interface QuickActionButtonProps {
  title: string;
  description: string;
  icon: React.ElementType;
  to: string;
  color: 'blue' | 'green' | 'purple' | 'orange';
}

const QuickActionButton: React.FC<QuickActionButtonProps> = ({
  title,
  description,
  icon: Icon,
  to,
  color
}) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
    green: 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
    purple: 'from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
    orange: 'from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
  };

  return (
    <Button
      asChild
      variant="outline"
      className="h-auto p-4 bg-gradient-to-r text-white border-0 hover:scale-105 transition-all duration-200"
      style={{
        background: `linear-gradient(to right, var(--tw-gradient-from), var(--tw-gradient-to))`,
      }}
    >
      <Link to={to} className={cn('bg-gradient-to-r', colorClasses[color])}>
        <div className="text-center w-full">
          <Icon className="w-8 h-8 mx-auto mb-2" />
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs opacity-90">{description}</p>
        </div>
      </Link>
    </Button>
  );
};

export default DashboardPage;