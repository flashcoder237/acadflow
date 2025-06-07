// ========================================
// FICHIER: src/pages/StatistiquesPage.tsx - Page des statistiques complète
// ========================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award,
  Calendar,
  Filter,
  Download,
  Target,
  Clock,
  BookOpen,
  FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { useAuthStore } from '@/stores/authStore';
import { useSessions } from '@/stores/appStore';
import { apiClient } from '@/lib/api';

const StatistiquesPage: React.FC = () => {
  const { user } = useAuthStore();
  const sessions = useSessions();
  const [selectedSession, setSelectedSession] = useState<string>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('current');

  // Simuler des données statistiques
  const { data: stats, isLoading } = useQuery({
    queryKey: ['statistiques', selectedSession, selectedPeriod],
    queryFn: async () => {
      // Simuler un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        totalEvaluations: 24,
        totalEtudiants: 156,
        moyenneGenerale: 13.2,
        tauxReussite: 78.5,
        repartitionNotes: {
          excellent: 12,
          bien: 28,
          assezBien: 35,
          passable: 43,
          insuffisant: 38
        },
        evolutionMoyennes: [
          { periode: 'Sept', moyenne: 12.1 },
          { periode: 'Oct', moyenne: 12.8 },
          { periode: 'Nov', moyenne: 13.2 },
          { periode: 'Déc', moyenne: 13.5 },
          { periode: 'Jan', moyenne: 13.7 },
          { periode: 'Fév', moyenne: 14.1 }
        ],
        performancesParEC: [
          { ec: 'MATH101', nom: 'Algèbre Linéaire', moyenne: 14.2, etudiants: 45, taux: 82 },
          { ec: 'INFO102', nom: 'Programmation Python', moyenne: 13.8, etudiants: 42, taux: 76 },
          { ec: 'PHYS103', nom: 'Mécanique', moyenne: 12.9, etudiants: 38, taux: 71 },
          { ec: 'ANGL104', nom: 'Anglais Technique', moyenne: 15.1, etudiants: 45, taux: 89 }
        ],
        evaluationsParType: {
          'Contrôle Continu': { nombre: 8, moyenne: 13.5 },
          'Devoir Surveillé': { nombre: 6, moyenne: 12.8 },
          'Examen Final': { nombre: 4, moyenne: 13.9 },
          'Travaux Pratiques': { nombre: 6, moyenne: 14.7 }
        },
        tendances: {
          participation: 94.2,
          assiduite: 87.5,
          progression: 8.3,
          satisfaction: 4.2
        }
      };
    },
    enabled: !!user?.enseignant_id
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loading size="lg" text="Chargement des statistiques..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Statistiques</h1>
          <p className="text-gray-600">
            Analyse des performances de vos enseignements
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="current">Période actuelle</option>
            <option value="semester">Ce semestre</option>
            <option value="year">Cette année</option>
            <option value="all">Toute la période</option>
          </select>
          
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
          
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Cartes de statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Évaluations"
          value={stats?.totalEvaluations || 0}
          icon={FileText}
          color="blue"
          description="Total créées"
        />
        <StatCard
          title="Étudiants"
          value={stats?.totalEtudiants || 0}
          icon={Users}
          color="green"
          description="Concernés"
        />
        <StatCard
          title="Moyenne générale"
          value={`${stats?.moyenneGenerale || 0}/20`}
          icon={TrendingUp}
          color="purple"
          description="Toutes évaluations"
        />
        <StatCard
          title="Taux de réussite"
          value={`${stats?.tauxReussite || 0}%`}
          icon={Award}
          color="orange"
          description="≥ 10/20"
        />
      </div>

      {/* Graphiques et analyses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Répartition des mentions */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition des mentions</CardTitle>
            <CardDescription>
              Distribution des résultats par mention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.repartitionNotes && Object.entries(stats.repartitionNotes).map(([mention, count]) => {
                const getMentionLabel = (key: string) => {
                  const labels: Record<string, string> = {
                    excellent: 'Très Bien (≥16)',
                    bien: 'Bien (14-15.99)',
                    assezBien: 'Assez Bien (12-13.99)',
                    passable: 'Passable (10-11.99)',
                    insuffisant: 'Insuffisant (<10)'
                  };
                  return labels[key] || key;
                };

                const getMentionColor = (key: string) => {
                  const colors: Record<string, string> = {
                    excellent: 'bg-green-500',
                    bien: 'bg-blue-500',
                    assezBien: 'bg-orange-500',
                    passable: 'bg-yellow-500',
                    insuffisant: 'bg-red-500'
                  };
                  return colors[key] || 'bg-gray-500';
                };

                const total = Object.values(stats.repartitionNotes).reduce((sum, val) => sum + val, 0);
                const percentage = total > 0 ? (count / total) * 100 : 0;

                return (
                  <div key={mention} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getMentionColor(mention)}`} />
                      <span className="text-sm font-medium">{getMentionLabel(mention)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${getMentionColor(mention)}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-600 w-12 text-right">{count}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Évolution des moyennes */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des moyennes</CardTitle>
            <CardDescription>
              Progression au fil du temps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.evolutionMoyennes.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.periode}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="h-2 bg-blue-500 rounded-full transition-all duration-300"
                        style={{ width: `${(item.moyenne / 20) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-12 text-right">
                      {item.moyenne}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performances par EC */}
      <Card>
        <CardHeader>
          <CardTitle>Performances par Élément Constitutif</CardTitle>
          <CardDescription>
            Analyse détaillée de chaque EC enseigné
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">EC</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Nom</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Étudiants</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Moyenne</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Taux réussite</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-900">Performance</th>
                </tr>
              </thead>
              <tbody>
                {stats?.performancesParEC.map((ec, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Badge variant="outline">{ec.ec}</Badge>
                    </td>
                    <td className="py-3 px-4 font-medium">{ec.nom}</td>
                    <td className="py-3 px-4 text-center">{ec.etudiants}</td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-semibold">{ec.moyenne}/20</span>
                    </td>
                    <td className="py-3 px-4 text-center">{ec.taux}%</td>
                    <td className="py-3 px-4 text-center">
                      <Badge 
                        variant={ec.taux >= 80 ? "success" : ec.taux >= 70 ? "warning" : "destructive"}
                      >
                        {ec.taux >= 80 ? "Excellent" : ec.taux >= 70 ? "Bon" : "À améliorer"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Évaluations par type et tendances */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Types d'évaluations */}
        <Card>
          <CardHeader>
            <CardTitle>Évaluations par type</CardTitle>
            <CardDescription>
              Répartition et performances par type d'évaluation
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.evaluationsParType && Object.entries(stats.evaluationsParType).map(([type, data]) => (
                <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{type}</p>
                    <p className="text-sm text-gray-600">{data.nombre} évaluations</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">{data.moyenne}/20</p>
                    <p className="text-sm text-gray-600">Moyenne</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Indicateurs de tendance */}
        <Card>
          <CardHeader>
            <CardTitle>Indicateurs clés</CardTitle>
            <CardDescription>
              Tendances et métriques importantes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {stats?.tendances.participation}%
                </div>
                <p className="text-sm text-blue-700 font-medium">Participation</p>
                <p className="text-xs text-blue-600">Présence aux évaluations</p>
              </div>
              
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats?.tendances.assiduite}%
                </div>
                <p className="text-sm text-green-700 font-medium">Assiduité</p>
                <p className="text-xs text-green-600">Présence en cours</p>
              </div>
              
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  +{stats?.tendances.progression}%
                </div>
                <p className="text-sm text-purple-700 font-medium">Progression</p>
                <p className="text-xs text-purple-600">Amélioration moyenne</p>
              </div>
              
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {stats?.tendances.satisfaction}/5
                </div>
                <p className="text-sm text-orange-700 font-medium">Satisfaction</p>
                <p className="text-xs text-orange-600">Retours étudiants</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommandations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommandations et actions</CardTitle>
          <CardDescription>
            Suggestions pour améliorer les performances
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center gap-2 mb-3">
                <Award className="w-5 h-5 text-green-600" />
                <h4 className="font-medium text-green-900">Points forts</h4>
              </div>
              <ul className="text-sm text-green-800 space-y-1">
                <li>• Excellent taux de participation (94%)</li>
                <li>• Progression constante des moyennes</li>
                <li>• Bonne performance en TP</li>
                <li>• Satisfaction étudiante élevée</li>
              </ul>
            </div>
            
            <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
              <div className="flex items-center gap-2 mb-3">
                <Target className="w-5 h-5 text-orange-600" />
                <h4 className="font-medium text-orange-900">Axes d'amélioration</h4>
              </div>
              <ul className="text-sm text-orange-800 space-y-1">
                <li>• Renforcer le soutien aux étudiants en difficulté</li>
                <li>• Améliorer les résultats en DS</li>
                <li>• Diversifier les méthodes d'évaluation</li>
                <li>• Augmenter l'assiduité en cours</li>
              </ul>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-5 h-5 text-blue-600" />
                <h4 className="font-medium text-blue-900">Actions suggérées</h4>
              </div>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Organiser des séances de révision</li>
                <li>• Mettre en place du tutorat</li>
                <li>• Créer des exercices d'entraînement</li>
                <li>• Planifier un suivi individualisé</li>
              </ul>
            </div>
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
  color: 'blue' | 'green' | 'purple' | 'orange';
  description: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon: Icon, color, description }) => {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
    orange: 'bg-orange-50 text-orange-600 border-orange-200'
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
          </div>
          <div className={`p-3 rounded-lg border ${colorClasses[color]}`}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatistiquesPage;