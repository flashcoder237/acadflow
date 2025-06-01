// src/pages/StatistiquesPage.tsx - Version améliorée
import React, { useState, useEffect } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  GraduationCap, 
  Award, 
  AlertCircle,
  Download,
  Filter,
  Calendar,
  Target,
  BookOpen
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { useApi } from '../hooks/useApi'
import { useNotifications } from '@/components/ui/notification-system'
import { evaluationsApi, academicsApi } from '../lib/api'

// Composant pour les graphiques améliorés
const EnhancedBarChart: React.FC<{ 
  data: Array<{ name: string; value: number; color?: string; percentage?: number }> 
  title?: string
}> = ({ data, title }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="space-y-4">
      {title && <h4 className="font-semibold text-sm">{title}</h4>}
      <div className="space-y-3">
        {data.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{item.name}</span>
              <div className="flex items-center space-x-2">
                <span className="font-bold">{item.value}</span>
                {item.percentage !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    {item.percentage.toFixed(1)}%
                  </Badge>
                )}
              </div>
            </div>
            <Progress 
              value={(item.value / maxValue) * 100} 
              className="h-2"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

// Composant pour les métriques clés
const MetricCard: React.FC<{
  title: string
  value: string | number
  description?: string
  trend?: { value: number; isPositive: boolean }
  icon: React.ComponentType<{ className?: string }>
  color?: 'default' | 'success' | 'warning' | 'destructive'
}> = ({ title, value, description, trend, icon: Icon, color = 'default' }) => {
  const colorClasses = {
    default: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    destructive: 'text-red-600'
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${colorClasses[color]}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${colorClasses[color]}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">
            {description}
          </p>
        )}
        {trend && (
          <div className={`flex items-center mt-2 text-xs ${
            trend.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.isPositive ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {trend.isPositive ? '+' : ''}{trend.value}% vs période précédente
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export const StatistiquesPage: React.FC = () => {
  const [selectedClass, setSelectedClass] = useState<string>('all')
  const [selectedSession, setSelectedSession] = useState<string>('current')
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>()
  const { notifySuccess, notifyError } = useNotifications()

  // Données mockées améliorées (à remplacer par de vraies données API)
  const [statsData, setStatsData] = useState({
    global: {
      totalEtudiants: 345,
      totalClasses: 12,
      totalEnseignants: 25,
      totalEvaluations: 128,
      moyenneGenerale: 13.2,
      tauxReussite: 78.5
    },
    repartitionNotes: [
      { name: 'Très Bien (≥16)', value: 45, color: 'green', percentage: 13.0 },
      { name: 'Bien (14-15.99)', value: 78, color: 'blue', percentage: 22.6 },
      { name: 'Assez Bien (12-13.99)', value: 92, color: 'yellow', percentage: 26.7 },
      { name: 'Passable (10-11.99)', value: 87, color: 'orange', percentage: 25.2 },
      { name: 'Insuffisant (<10)', value: 43, color: 'red', percentage: 12.5 }
    ],
    repartitionFilieres: [
      { name: 'Informatique', value: 145, percentage: 42.0 },
      { name: 'Mathématiques', value: 89, percentage: 25.8 },
      { name: 'Physique', value: 67, percentage: 19.4 },
      { name: 'Chimie', value: 44, percentage: 12.8 }
    ],
    moyennesParNiveau: [
      { name: 'L1', value: 12.5, trend: -2.3 },
      { name: 'L2', value: 13.2, trend: 1.8 },
      { name: 'L3', value: 14.1, trend: 3.2 },
      { name: 'M1', value: 14.8, trend: 2.1 },
      { name: 'M2', value: 15.2, trend: 1.5 }
    ],
    tauxReussite: {
      global: 78.5,
      parNiveau: [
        { niveau: 'L1', taux: 72.3, trend: -3.2 },
        { niveau: 'L2', taux: 78.9, trend: 2.1 },
        { niveau: 'L3', taux: 81.2, trend: 4.5 },
        { niveau: 'M1', taux: 85.6, trend: 1.8 },
        { niveau: 'M2', taux: 89.1, trend: 2.3 }
      ]
    },
    evolutionTemporelle: [
      { mois: 'Sept', moyenne: 12.8, reussite: 75.2 },
      { mois: 'Oct', moyenne: 13.1, reussite: 76.8 },
      { mois: 'Nov', moyenne: 13.3, reussite: 78.1 },
      { mois: 'Déc', moyenne: 13.2, reussite: 78.5 }
    ],
    alertes: [
      {
        type: 'warning',
        title: 'Taux de réussite L1 en baisse',
        description: '72.3% de réussite (-3.2% vs dernier trimestre)',
        priority: 'high'
      },
      {
        type: 'success',
        title: 'Amélioration significative en L3',
        description: 'Progression de +4.5% du taux de réussite',
        priority: 'medium'
      },
      {
        type: 'info',
        title: 'Objectif atteint en M2',
        description: '89.1% de réussite, objectif de 85% dépassé',
        priority: 'low'
      }
    ]
  })

  const getTauxColor = (taux: number) => {
    if (taux >= 80) return 'text-green-600'
    if (taux >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMoyenneColor = (moyenne: number) => {
    if (moyenne >= 14) return 'text-green-600'
    if (moyenne >= 12) return 'text-yellow-600'
    return 'text-red-600'
  }

  const handleExportStats = () => {
    try {
      // Logique d'export des statistiques
      notifySuccess('Export réussi', 'Les statistiques ont été exportées')
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible d\'exporter les statistiques')
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête avec filtres */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Statistiques Académiques</h2>
            <p className="text-muted-foreground">
              Analyse des performances et indicateurs clés de l'établissement
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={handleExportStats}>
              <Download className="mr-2 h-4 w-4" />
              Exporter rapport
            </Button>
          </div>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtres :</span>
          </div>
          
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner une classe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les classes</SelectItem>
              <SelectItem value="l1-info">L1 Informatique</SelectItem>
              <SelectItem value="l2-info">L2 Informatique</SelectItem>
              <SelectItem value="l3-info">L3 Informatique</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner une session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Session courante</SelectItem>
              <SelectItem value="session1">Session 1</SelectItem>
              <SelectItem value="session2">Session 2</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm">Période personnalisée</span>
          </div>
        </div>
      </div>

      {/* Indicateurs globaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <MetricCard
          title="Total étudiants"
          value={statsData.global.totalEtudiants}
          description="Étudiants actifs"
          icon={GraduationCap}
          trend={{ value: 5.2, isPositive: true }}
        />
        <MetricCard
          title="Classes actives"
          value={statsData.global.totalClasses}
          description="Toutes filières"
          icon={Users}
          trend={{ value: 8.1, isPositive: true }}
        />
        <MetricCard
          title="Enseignants"
          value={statsData.global.totalEnseignants}
          description="Corps enseignant"
          icon={Award}
          trend={{ value: 2.3, isPositive: true }}
        />
        <MetricCard
          title="Évaluations"
          value={statsData.global.totalEvaluations}
          description="Ce semestre"
          icon={BarChart3}
          trend={{ value: 12.5, isPositive: true }}
        />
        <MetricCard
          title="Moyenne générale"
          value={`${statsData.global.moyenneGenerale}/20`}
          description="Toutes filières"
          icon={Target}
          color="success"
          trend={{ value: 2.1, isPositive: true }}
        />
        <MetricCard
          title="Taux de réussite"
          value={`${statsData.global.tauxReussite}%`}
          description="≥ 10/20"
          icon={TrendingUp}
          color="success"
          trend={{ value: 3.2, isPositive: true }}
        />
      </div>

      {/* Onglets pour les différentes analyses */}
      <Tabs defaultValue="repartition" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="repartition">Répartition des notes</TabsTrigger>
          <TabsTrigger value="filieres">Par filières</TabsTrigger>
          <TabsTrigger value="niveaux">Par niveaux</TabsTrigger>
          <TabsTrigger value="evolution">Évolution</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
        </TabsList>

        <TabsContent value="repartition" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distribution des mentions</CardTitle>
                <CardDescription>
                  Répartition des notes par mention (toutes évaluations)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedBarChart data={statsData.repartitionNotes} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analyse comparative</CardTitle>
                <CardDescription>
                  Comparaison avec les objectifs et moyennes nationales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Taux de réussite actuel</span>
                    <span className="text-2xl font-bold text-green-600">
                      {statsData.global.tauxReussite}%
                    </span>
                  </div>
                  <Progress value={statsData.global.tauxReussite} className="h-2" />
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="text-center p-2 bg-blue-50 rounded">
                      <div className="text-sm text-blue-600">Objectif</div>
                      <div className="font-bold text-blue-800">75%</div>
                    </div>
                    <div className="text-center p-2 bg-gray-50 rounded">
                      <div className="text-sm text-gray-600">Moyenne nationale</div>
                      <div className="font-bold text-gray-800">72%</div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h4 className="font-semibold text-sm mb-3">Points clés</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center text-green-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Objectif institutionnel dépassé (+3.5%)
                    </div>
                    <div className="flex items-center text-green-700">
                      <Award className="h-4 w-4 mr-2" />
                      Au-dessus de la moyenne nationale (+6.5%)
                    </div>
                    <div className="flex items-center text-blue-700">
                      <Target className="h-4 w-4 mr-2" />
                      {((statsData.repartitionNotes[0].value + statsData.repartitionNotes[1].value) / statsData.global.totalEtudiants * 100).toFixed(1)}% d'excellentes notes (≥14)
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filieres" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Effectifs par filière</CardTitle>
                <CardDescription>
                  Répartition des étudiants par domaine d'études
                </CardDescription>
              </CardHeader>
              <CardContent>
                <EnhancedBarChart data={statsData.repartitionFilieres} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performances par filière</CardTitle>
                <CardDescription>
                  Moyennes et taux de réussite par domaine
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsData.repartitionFilieres.map((filiere, index) => {
                    // Données simulées pour les performances
                    const moyennes = [13.8, 12.9, 14.2, 13.1]
                    const tauxReussite = [82.3, 75.6, 86.1, 78.9]
                    
                    return (
                      <div key={index} className="p-3 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{filiere.name}</span>
                          <Badge variant="outline">{filiere.value} étudiants</Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Moyenne: </span>
                            <span className={`font-bold ${getMoyenneColor(moyennes[index])}`}>
                              {moyennes[index]}/20
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Réussite: </span>
                            <span className={`font-bold ${getTauxColor(tauxReussite[index])}`}>
                              {tauxReussite[index]}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="niveaux" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Moyennes par niveau</CardTitle>
                <CardDescription>
                  Performance académique selon le niveau d'études
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsData.moyennesParNiveau.map((niveau, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="font-bold text-blue-600">{niveau.name}</span>
                        </div>
                        <div>
                          <div className="font-medium">Niveau {niveau.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Moyenne générale
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getMoyenneColor(niveau.value)}`}>
                          {niveau.value.toFixed(1)}/20
                        </div>
                        <div className={`text-xs flex items-center ${
                          niveau.trend > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {niveau.trend > 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {niveau.trend > 0 ? '+' : ''}{niveau.trend}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Taux de réussite par niveau</CardTitle>
                <CardDescription>
                  Pourcentage d'étudiants avec moyenne ≥ 10/20
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {statsData.tauxReussite.parNiveau.map((item, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{item.niveau}</span>
                        <div className="flex items-center space-x-2">
                          <span className={`text-sm font-bold ${getTauxColor(item.taux)}`}>
                            {item.taux}%
                          </span>
                          <div className={`text-xs flex items-center ${
                            item.trend > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {item.trend > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                            {item.trend > 0 ? '+' : ''}{item.trend}%
                          </div>
                        </div>
                      </div>
                      <Progress value={item.taux} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="evolution" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Évolution des moyennes</CardTitle>
                <CardDescription>
                  Progression des moyennes sur les 4 derniers mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsData.evolutionTemporelle.map((periode, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
                      <span className="font-medium">{periode.mois}</span>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Moyenne</div>
                          <div className="font-bold">{periode.moyenne}/20</div>
                        </div>
                        <div className="w-24">
                          <Progress value={(periode.moyenne / 20) * 100} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Évolution du taux de réussite</CardTitle>
                <CardDescription>
                  Progression du taux de réussite sur la période
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsData.evolutionTemporelle.map((periode, index) => (
                    <div key={index} className="flex items-center justify-between p-2">
                      <span className="font-medium">{periode.mois}</span>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Réussite</div>
                          <div className="font-bold">{periode.reussite}%</div>
                        </div>
                        <div className="w-24">
                          <Progress value={periode.reussite} className="h-2" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4 pt-4 border-t">
                  <div className="flex items-center space-x-2 text-green-600">
                    <TrendingUp className="h-4 w-4" />
                    <span className="text-sm font-medium">
                      Progression constante depuis septembre (+3.3%)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="alertes" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-1">
            <Card>
              <CardHeader>
                <CardTitle>Alertes et recommandations</CardTitle>
                <CardDescription>
                  Points d'attention identifiés et actions recommandées
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {statsData.alertes.map((alerte, index) => {
                    const alerteStyles = {
                      warning: {
                        border: 'border-l-yellow-500',
                        bg: 'bg-yellow-50',
                        icon: AlertCircle,
                        iconColor: 'text-yellow-600',
                        titleColor: 'text-yellow-800',
                        textColor: 'text-yellow-700'
                      },
                      success: {
                        border: 'border-l-green-500',
                        bg: 'bg-green-50',
                        icon: TrendingUp,
                        iconColor: 'text-green-600',
                        titleColor: 'text-green-800',
                        textColor: 'text-green-700'
                      },
                      info: {
                        border: 'border-l-blue-500',
                        bg: 'bg-blue-50',
                        icon: BarChart3,
                        iconColor: 'text-blue-600',
                        titleColor: 'text-blue-800',
                        textColor: 'text-blue-700'
                      }
                    }

                    const style = alerteStyles[alerte.type as keyof typeof alerteStyles]
                    const IconComponent = style.icon

                    return (
                      <div key={index} className={`flex items-start space-x-3 p-4 border-l-4 ${style.border} ${style.bg} rounded-r-lg`}>
                        <IconComponent className={`h-5 w-5 ${style.iconColor} mt-0.5 flex-shrink-0`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div className={`font-medium ${style.titleColor}`}>
                              {alerte.title}
                            </div>
                            <Badge variant={alerte.priority === 'high' ? 'destructive' : alerte.priority === 'medium' ? 'warning' : 'secondary'}>
                              {alerte.priority === 'high' ? 'Priorité haute' : alerte.priority === 'medium' ? 'Priorité moyenne' : 'Priorité basse'}
                            </Badge>
                          </div>
                          <div className={`text-sm ${style.textColor} mt-1`}>
                            {alerte.description}
                          </div>
                          <div className="mt-3">
                            <Button variant="outline" size="sm">
                              Voir détails
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-sm mb-3 flex items-center">
                    <Target className="h-4 w-4 mr-2" />
                    Actions recommandées
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start space-x-2">
                      <span className="font-medium text-blue-600">1.</span>
                      <span>Organiser des séances de soutien pour les étudiants de L1</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-medium text-blue-600">2.</span>
                      <span>Analyser les méthodes pédagogiques en L3 pour les reproduire</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <span className="font-medium text-blue-600">3.</span>
                      <span>Maintenir les bonnes pratiques en M2</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}