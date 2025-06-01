// src/pages/StatistiquesPage.tsx
import React, { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, GraduationCap, Award, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { Progress } from '../components/ui/progress'
import { Badge } from '../components/ui/badge'
import { StatsCard } from '../components/dashboard/StatsCard'
import { useApi } from '../hooks/useApi'

// Composant pour les graphiques (version simplifiée sans bibliothèque externe)
const SimpleBarChart: React.FC<{ data: Array<{ name: string; value: number; color?: string }> }> = ({ data }) => {
  const maxValue = Math.max(...data.map(d => d.value))
  
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <div key={index} className="flex items-center space-x-3">
          <div className="w-20 text-sm font-medium">{item.name}</div>
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <Progress 
                value={(item.value / maxValue) * 100} 
                className="flex-1 h-2"
              />
              <span className="text-sm font-medium w-12">{item.value}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export const StatistiquesPage: React.FC = () => {
  const [statsData, setStatsData] = useState({
    global: {
      totalEtudiants: 345,
      totalClasses: 12,
      totalEnseignants: 25,
      totalEvaluations: 128
    },
    repartitionNotes: [
      { name: 'Très Bien', value: 45, color: 'green' },
      { name: 'Bien', value: 78, color: 'blue' },
      { name: 'Assez Bien', value: 92, color: 'yellow' },
      { name: 'Passable', value: 87, color: 'orange' },
      { name: 'Insuffisant', value: 43, color: 'red' }
    ],
    repartitionFilieres: [
      { name: 'Informatique', value: 145 },
      { name: 'Mathématiques', value: 89 },
      { name: 'Physique', value: 67 },
      { name: 'Chimie', value: 44 }
    ],
    moyennesParNiveau: [
      { name: 'L1', value: 12.5 },
      { name: 'L2', value: 13.2 },
      { name: 'L3', value: 14.1 },
      { name: 'M1', value: 14.8 },
      { name: 'M2', value: 15.2 }
    ],
    tauxReussite: {
      global: 78.5,
      parNiveau: [
        { niveau: 'L1', taux: 72.3 },
        { niveau: 'L2', taux: 78.9 },
        { niveau: 'L3', taux: 81.2 },
        { niveau: 'M1', taux: 85.6 },
        { niveau: 'M2', taux: 89.1 }
      ]
    }
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

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Statistiques</h2>
          <p className="text-muted-foreground">
            Analyse des performances et indicateurs clés
          </p>
        </div>
      </div>

      {/* Indicateurs globaux */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total étudiants"
          value={statsData.global.totalEtudiants}
          description="Étudiants actifs"
          icon={GraduationCap}
          trend={{ value: 5.2, isPositive: true }}
        />
        <StatsCard
          title="Classes actives"
          value={statsData.global.totalClasses}
          description="Toutes filières confondues"
          icon={Users}
          trend={{ value: 8.1, isPositive: true }}
        />
        <StatsCard
          title="Enseignants"
          value={statsData.global.totalEnseignants}
          description="Corps enseignant"
          icon={Award}
          trend={{ value: 2.3, isPositive: true }}
        />
        <StatsCard
          title="Évaluations"
          value={statsData.global.totalEvaluations}
          description="Ce semestre"
          icon={BarChart3}
          trend={{ value: 12.5, isPositive: true }}
        />
      </div>

      <Tabs defaultValue="repartition" className="space-y-4">
        <TabsList>
          <TabsTrigger value="repartition">Répartition des notes</TabsTrigger>
          <TabsTrigger value="filieres">Par filières</TabsTrigger>
          <TabsTrigger value="niveaux">Par niveaux</TabsTrigger>
          <TabsTrigger value="reussite">Taux de réussite</TabsTrigger>
        </TabsList>

        <TabsContent value="repartition" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition des mentions</CardTitle>
                <CardDescription>
                  Distribution des notes par mention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart data={statsData.repartitionNotes} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analyse des performances</CardTitle>
                <CardDescription>
                  Indicateurs de réussite
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Taux de réussite global</span>
                  <span className={`text-2xl font-bold ${getTauxColor(statsData.tauxReussite.global)}`}>
                    {statsData.tauxReussite.global}%
                  </span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Excellentes notes (≥16)</span>
                    <Badge variant="success">
                      {((statsData.repartitionNotes[0].value / statsData.global.totalEtudiants) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Notes insuffisantes (&lt;10)</span>
                    <Badge variant="destructive">
                      {((statsData.repartitionNotes[4].value / statsData.global.totalEtudiants) * 100).toFixed(1)}%
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="filieres" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Effectifs par filière</CardTitle>
              <CardDescription>
                Répartition des étudiants par domaine d'études
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart data={statsData.repartitionFilieres} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="niveaux" className="space-y-4">
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
                      <Progress value={(niveau.value / 20) * 100} className="w-24" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reussite" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
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
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.niveau}</span>
                      <div className="flex items-center space-x-2">
                        <Progress value={item.taux} className="w-24" />
                        <span className={`text-sm font-bold ${getTauxColor(item.taux)}`}>
                          {item.taux}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Alertes et recommandations</CardTitle>
                <CardDescription>
                  Points d'attention identifiés
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-3 border-l-4 border-yellow-500 bg-yellow-50">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-yellow-800">
                        Taux de réussite L1 faible
                      </div>
                      <div className="text-sm text-yellow-700">
                        72.3% de réussite, en dessous de l'objectif de 75%
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border-l-4 border-green-500 bg-green-50">
                    <TrendingUp className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-green-800">
                        Excellentes performances M2
                      </div>
                      <div className="text-sm text-green-700">
                        89.1% de réussite, au-dessus des attentes
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-3 p-3 border-l-4 border-blue-500 bg-blue-50">
                    <BarChart3 className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <div className="font-medium text-blue-800">
                        Progression continue
                      </div>
                      <div className="text-sm text-blue-700">
                        Amélioration des moyennes de L1 à M2
                      </div>
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