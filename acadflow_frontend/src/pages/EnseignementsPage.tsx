// ========================================
// FICHIER: src/pages/EnseignementsPage.tsx - Gestion des enseignements
// ========================================

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, 
  Filter, 
  BookOpen, 
  Users, 
  FileText, 
  BarChart3,
  Eye,
  Plus,
  Calendar,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/lib/api';
import { Enseignement, PaginatedResponse } from '@/types';
import { cn } from '@/lib/utils';

const EnseignementsPage: React.FC = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Charger les enseignements
  const { data: enseignements, isLoading, error } = useQuery({
    queryKey: ['enseignements', searchTerm, selectedFilter],
    queryFn: () => apiClient.getEnseignements({
      search: searchTerm || undefined,
      classe: selectedFilter !== 'all' ? selectedFilter : undefined
    }),
    enabled: !!user?.enseignant_id
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // La recherche se fait automatiquement via useQuery
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Chargement des enseignements..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-4">
          <FileText className="w-12 h-12 mx-auto mb-2" />
          <p>Erreur lors du chargement des enseignements</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes enseignements</h1>
          <p className="text-gray-600">
            Gérez vos cours et évaluations pour l'année académique en cours
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {enseignements?.count || 0} enseignement(s)
          </Badge>
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  type="text"
                  placeholder="Rechercher par EC, UE ou classe..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button type="submit" variant="outline">
                <Search className="w-4 h-4 mr-2" />
                Rechercher
              </Button>
              <Button variant="outline" size="icon">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Liste des enseignements */}
      {enseignements?.results.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enseignements.results.map((enseignement) => (
            <EnseignementCard key={enseignement.id} enseignement={enseignement} />
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
    </div>
  );
};

// Composant pour une carte d'enseignement
interface EnseignementCardProps {
  enseignement: Enseignement;
}

const EnseignementCard: React.FC<EnseignementCardProps> = ({ enseignement }) => {
  // Simuler quelques données pour l'exemple
  const stats = {
    nombreEtudiants: Math.floor(Math.random() * 50) + 20,
    nombreEvaluations: Math.floor(Math.random() * 5) + 1,
    notesEnAttente: Math.floor(Math.random() * 3)
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
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
            <GraduationCap className="w-4 h-4" />
            <span className="font-medium">UE:</span>
            <span>{enseignement.ue_nom}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="w-4 h-4" />
            <span className="font-medium">Classe:</span>
            <span>{enseignement.classe_nom}</span>
          </div>
        </div>

        {/* Statistiques */}
        <div className="grid grid-cols-3 gap-3 py-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{stats.nombreEtudiants}</div>
            <div className="text-xs text-gray-500">Étudiants</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">{stats.nombreEvaluations}</div>
            <div className="text-xs text-gray-500">Évaluations</div>
          </div>
          <div className="text-center">
            <div className={cn(
              "text-lg font-bold",
              stats.notesEnAttente > 0 ? "text-orange-600" : "text-gray-400"
            )}>
              {stats.notesEnAttente}
            </div>
            <div className="text-xs text-gray-500">En attente</div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <Button asChild variant="outline" size="sm" className="flex-1">
            <Link to={`/enseignements/${enseignement.id}`}>
              <Eye className="w-4 h-4 mr-2" />
              Voir détails
            </Link>
          </Button>
          <Button asChild variant="default" size="sm" className="flex-1">
            <Link to={`/evaluations/create?enseignement=${enseignement.id}`}>
              <Plus className="w-4 h-4 mr-2" />
              Évaluation
            </Link>
          </Button>
        </div>

        {/* Indicateur d'urgence */}
        {stats.notesEnAttente > 0 && (
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-600" />
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

export default EnseignementsPage;