// ========================================
// FICHIER: src/pages/EvaluationsPage.tsx - Gestion des évaluations
// ========================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Calendar, 
  Clock, 
  Users,
  Edit,
  Eye,
  BarChart3,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/stores/authStore';
import { useSessions } from '@/stores/appStore';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { Evaluation, PaginatedResponse } from '@/types';

const EvaluationsPage: React.FC = () => {
  const { user } = useAuthStore();
  const sessions = useSessions();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Charger les évaluations
  const { data: evaluations, isLoading, error, refetch } = useQuery({
    queryKey: ['evaluations', searchTerm, selectedSession, selectedStatus],
    queryFn: () => apiClient.getEvaluations({
      search: searchTerm || undefined,
      session: selectedSession !== 'all' ? selectedSession : undefined,
      saisie_terminee: selectedStatus === 'terminee' ? true : 
                      selectedStatus === 'en_attente' ? false : undefined
    }),
    enabled: !!user?.enseignant_id
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    refetch();
  };

  // Statistiques calculées
  const stats = {
    total: evaluations?.count || 0,
    terminee: evaluations?.results.filter(e => e.saisie_terminee).length || 0,
    enAttente: evaluations?.results.filter(e => !e.saisie_terminee).length || 0,
    urgentes: evaluations?.results.filter(e => {
      if (!e.date_limite_saisie) return false;
      const limite = new Date(e.date_limite_saisie);
      const maintenant = new Date();
      const diff = limite.getTime() - maintenant.getTime();
      return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000; // 3 jours
    }).length || 0
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Chargement des évaluations..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec statistiques */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes évaluations</h1>
          <p className="text-gray-600">
            Gérez vos évaluations et la saisie des notes
          </p>
        </div>
        <Button asChild className="w-fit">
          <Link to="/evaluations/create">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle évaluation
          </Link>
        </Button>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="Terminées"
          value={stats.terminee}
          icon={CheckCircle}
          color="green"
        />
        <StatCard
          title="En attente"
          value={stats.enAttente}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Urgentes"
          value={stats.urgentes}
          icon={AlertCircle}
          color="red"
          alert={stats.urgentes > 0}
        />
      </div>

      {/* Filtres et recherche */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col lg:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher une évaluation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filtre par session */}
            <select
              value={selectedSession}
              onChange={(e) => setSelectedSession(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Toutes les sessions</option>
              {sessions.map(session => (
                <option key={session.id} value={session.id}>
                  {session.nom}
                </option>
              ))}
            </select>

            {/* Filtre par statut */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tous les statuts</option>
              <option value="terminee">Terminées</option>
              <option value="en_attente">En attente</option>
            </select>

            <Button type="submit" variant="outline">
              <Search className="w-4 h-4 mr-2" />
              Rechercher
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des évaluations */}
      {evaluations?.results.length ? (
        <div className="space-y-4">
          {evaluations.results.map((evaluation) => (
            <EvaluationCard key={evaluation.id} evaluation={evaluation} />
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
              {searchTerm 
                ? "Aucune évaluation ne correspond à votre recherche"
                : "Vous n'avez pas encore créé d'évaluations"
              }
            </p>
            <div className="flex justify-center gap-3">
              {searchTerm && (
                <Button onClick={() => setSearchTerm('')} variant="outline">
                  Effacer la recherche
                </Button>
              )}
              <Button asChild>
                <Link to="/evaluations/create">
                  <Plus className="w-4 h-4 mr-2" />
                  Créer une évaluation
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Composant pour les cartes de statistiques
interface StatCardProps {
  title: string;
  value: number;
  icon: React.ElementType;
  color: 'blue' | 'green' | 'orange' | 'red';
  alert?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, alert }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200',
    red: 'bg-red-50 text-red-600 border-red-200'
  };

  return (
    <Card className={cn(alert && 'ring-2 ring-red-400 ring-opacity-50')}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">
              {value}
              {alert && <AlertCircle className="inline w-5 h-5 ml-2 text-red-500" />}
            </p>
          </div>
          <div className={cn('p-3 rounded-lg border', colorClasses[color])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Composant pour une carte d'évaluation
interface EvaluationCardProps {
  evaluation: Evaluation;
}

const EvaluationCard: React.FC<EvaluationCardProps> = ({ evaluation }) => {
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
      "hover:shadow-md transition-shadow",
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
                    Limite de saisie : {formatDateTime(evaluation.date_limite_saisie)}
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
                <AlertCircle className="w-4 h-4 inline mr-2" />
                {urgence === 'critique' 
                  ? "Saisie requise dans moins de 24h !"
                  : "Saisie requise dans moins de 3 jours"
                }
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 ml-4">
            <Button asChild variant="outline" size="sm">
              <Link to={`/evaluations/${evaluation.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                Détails
              </Link>
            </Button>
            
            {!evaluation.saisie_terminee && (
              <Button asChild size="sm">
                <Link to={`/evaluations/${evaluation.id}/notes`}>
                  <Edit className="w-4 h-4 mr-2" />
                  Saisir
                </Link>
              </Button>
            )}
            
            {evaluation.saisie_terminee && (
              <Button asChild variant="outline" size="sm">
                <Link to={`/evaluations/${evaluation.id}/statistiques`}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Stats
                </Link>
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EvaluationsPage;