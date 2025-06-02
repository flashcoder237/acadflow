// src/pages/DashboardPage.tsx - Version Avancée de Remplacement
import React, { useEffect, useState } from 'react'
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  TrendingUp,
  Calendar,
  Award,
  AlertTriangle,
  BarChart3,
  Target,
  Clock,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useApi } from '../hooks/useApi'
import { formatDate } from '../lib/utils'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { canViewStatistics, isEtudiant, isEnseignant, isAdmin, isScolarite, isDirection } = usePermissions()
  const [dashboardData, setDashboardData] = useState<any>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [user])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      // Simulation de chargement des données selon le rôle
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (isEtudiant) {
        setDashboardData({
          parcours: {
            niveau_actuel: 'L2 Informatique',
            progression: 65,
            credits_obtenus: 78,
            credits_requis: 120,
            moyenne_generale: 14.2,
            rang_classe: 8,
            total_classe: 45
          },
          evaluations_a_venir: [
            { nom: 'Partiel Mathématiques', date: '2024-02-15' },
            { nom: 'TP Base de Données', date: '2024-02-18' },
            { nom: 'Examen Algorithimique', date: '2024-02-22' }
          ],
          notes_recentes: [
            { matiere: 'Programmation Web', note: 16, date: '2024-01-28' },
            { matiere: 'Systèmes Distribués', note: 13, date: '2024-01-25' },
            { matiere: 'Interface Homme-Machine', note: 18, date: '2024-01-22' }
          ]
        })
      } else if (isEnseignant) {
        setDashboardData({
          enseignements: [
            { nom: 'L2 - Base de Données', effectif: 42, evaluations_en_attente: 2 },
            { nom: 'L3 - Systèmes Distribués', effectif: 38, evaluations_en_attente: 1 },
            { nom: 'M1 - Architecture Logicielle', effectif: 25, evaluations_en_attente: 0 }
          ],
          notes_a_saisir: 15,
          evaluations_planifiees: 3,
          moyenne_classes: 13.8
        })
      } else {
        setDashboardData({
          stats_globales: {
            total_etudiants: 1247,
            total_classes: 28,
            total_enseignants: 45,
            taux_reussite: 82.3
          },
          alertes: [
            { type: 'warning', message: 'Taux de réussite L1 en baisse (-3.2%)', urgent: true },
            { type: 'info', message: '15 nouvelles inscriptions cette semaine', urgent: false },
            { type: 'success', message: 'Objectif 85% de réussite atteint en M2', urgent: false }
          ]
        })
      }
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const getRoleSpecificCards = () => {
    if (isEtudiant && dashboardData.parcours) {
      return (
        <>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-blue-600" />
                Ma Progression Académique
              </CardTitle>
              <CardDescription>
                Niveau actuel : {dashboardData.parcours.niveau_actuel}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Crédits ECTS</p>
                  <p className="text-2xl font-bold text-green-600">
                    {dashboardData.parcours.credits_obtenus}/{dashboardData.parcours.credits_requis}
                  </p>
                  <Progress value={(dashboardData.parcours.credits_obtenus / dashboardData.parcours.credits_requis) * 100} className="mt-2" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Moyenne Générale</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {dashboardData.parcours.moyenne_generale}/20
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Rang {dashboardData.parcours.rang_classe}/{dashboardData.parcours.total_classe}
                  </p>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span>Progression du niveau</span>
                  <span>{dashboardData.parcours.progression}%</span>
                </div>
                <Progress value={dashboardData.parcours.progression} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2 text-orange-600" />
                Prochaines Évaluations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.evaluations_a_venir?.map((evaluation: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <p className="font-medium text-sm">{evaluation.nom}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(evaluation.date)}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {Math.ceil((new Date(evaluation.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} j
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-green-600" />
                Notes Récentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.notes_recentes?.map((note: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{note.matiere}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(note.date)}
                      </p>
                    </div>
                    <Badge variant={note.note >= 16 ? 'success' : note.note >= 12 ? 'warning' : 'destructive'}>
                      {note.note}/20
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )
    } else if (isEnseignant && dashboardData.enseignements) {
      return (
        <>
          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2 text-purple-600" />
                Mes Enseignements
              </CardTitle>
              <CardDescription>
                {dashboardData.enseignements.length} enseignement(s) cette année
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.enseignements.map((ens: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{ens.nom}</p>
                      <p className="text-sm text-muted-foreground">{ens.effectif} étudiants</p>
                    </div>
                    <div className="text-right">
                      {ens.evaluations_en_attente > 0 ? (
                        <Badge variant="warning">
                          {ens.evaluations_en_attente} éval. en attente
                        </Badge>
                      ) : (
                        <Badge variant="success">À jour</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClipboardList className="h-5 w-5 mr-2 text-red-600" />
                Tâches en Attente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Notes à saisir</span>
                <Badge variant="destructive">{dashboardData.notes_a_saisir}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Évaluations planifiées</span>
                <Badge variant="info">{dashboardData.evaluations_planifiees}</Badge>
              </div>
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground">Moyenne des classes</p>
                <p className="text-xl font-bold text-blue-600">{dashboardData.moyenne_classes}/20</p>
              </div>
            </CardContent>
          </Card>
        </>
      )
    } else if (canViewStatistics && dashboardData.stats_globales) {
      return (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2 text-blue-600" />
                Étudiants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats_globales.total_etudiants}</div>
              <p className="text-xs text-muted-foreground">inscrits cette année</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
                Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats_globales.total_classes}</div>
              <p className="text-xs text-muted-foreground">classes actives</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2 text-purple-600" />
                Enseignants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.stats_globales.total_enseignants}</div>
              <p className="text-xs text-muted-foreground">membres du corps enseignant</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2 text-orange-600" />
                Taux de Réussite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{dashboardData.stats_globales.taux_reussite}%</div>
              <p className="text-xs text-muted-foreground">moyenne institutionnelle</p>
            </CardContent>
          </Card>

          <Card className="col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                Alertes et Notifications
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {dashboardData.alertes?.map((alerte: any, index: number) => (
                  <div key={index} className={`p-3 border rounded-lg ${
                    alerte.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                    alerte.type === 'success' ? 'border-green-200 bg-green-50' :
                    'border-blue-200 bg-blue-50'
                  }`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{alerte.message}</p>
                      {alerte.urgent && <Badge variant="destructive">Urgent</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )
    }

    return null
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête personnalisé */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.first_name} !
        </h1>
        <p className="text-muted-foreground">
          {isEtudiant && 'Suivez votre progression académique et vos prochaines échéances'}
          {isEnseignant && 'Gérez vos enseignements et suivez vos étudiants'}
          {canViewStatistics && 'Vue d\'ensemble de votre établissement'}
        </p>
      </div>

      {/* Indicateurs rapides */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Activity className="h-4 w-4 mr-2 text-blue-600" />
              Activité Aujourd'hui
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {isEtudiant ? '3 cours' : isEnseignant ? '2 enseignements' : '15 connexions'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isEtudiant ? 'dans votre emploi du temps' : isEnseignant ? 'prévus aujourd\'hui' : 'nouvelles aujourd\'hui'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Target className="h-4 w-4 mr-2 text-green-600" />
              Objectifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-600">
              {isEtudiant ? '85%' : isEnseignant ? '92%' : '78%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isEtudiant ? 'vers validation semestre' : isEnseignant ? 'notes saisies' : 'objectifs atteints'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Clock className="h-4 w-4 mr-2 text-purple-600" />
              En Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-600">
              {isEtudiant ? '2' : isEnseignant ? '5' : '12'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isEtudiant ? 'résultats attendus' : isEnseignant ? 'évaluations à corriger' : 'tâches en cours'}
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <BarChart3 className="h-4 w-4 mr-2 text-orange-600" />
              Performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-600">
              {isEtudiant ? '14.2/20' : isEnseignant ? '13.8/20' : '+3.2%'}
            </div>
            <p className="text-xs text-muted-foreground">
              {isEtudiant ? 'moyenne générale' : isEnseignant ? 'moyenne classes' : 'vs mois dernier'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contenu principal spécifique au rôle */}
      <div className="grid gap-4 md:grid-cols-3">
        {getRoleSpecificCards()}
      </div>

      {/* Actions rapides selon le rôle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Activity className="h-5 w-5 mr-2" />
            Actions Rapides
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-4">
            {isEtudiant && (
              <>
                <Button variant="outline" className="justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Mon emploi du temps
                </Button>
                <Button variant="outline" className="justify-start">
                  <Award className="mr-2 h-4 w-4" />
                  Mes notes
                </Button>
                <Button variant="outline" className="justify-start">
                  <Target className="mr-2 h-4 w-4" />
                  Mon parcours
                </Button>
                <Button variant="outline" className="justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Mes évaluations
                </Button>
              </>
            )}
            
            {isEnseignant && (
              <>
                <Button variant="outline" className="justify-start">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Mes enseignements
                </Button>
                <Button variant="outline" className="justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Saisir notes
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Mes étudiants
                </Button>
                <Button variant="outline" className="justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Planning
                </Button>
              </>
            )}
            
            {canViewStatistics && (
              <>
                <Button variant="outline" className="justify-start">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Statistiques
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="mr-2 h-4 w-4" />
                  Gestion classes
                </Button>
                <Button variant="outline" className="justify-start">
                  <GraduationCap className="mr-2 h-4 w-4" />
                  Étudiants
                </Button>
                <Button variant="outline" className="justify-start">
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Rapports
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Activité récente */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Activité Récente
          </CardTitle>
          <CardDescription>
            Dernières actions dans le système
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              {
                action: isEtudiant ? 'Note publiée en Programmation Web' : isEnseignant ? 'Notes saisies pour L2 BD' : 'Nouvelle inscription L1 Info',
                time: '2 heures',
                type: 'success'
              },
              {
                action: isEtudiant ? 'Évaluation programmée en Maths' : isEnseignant ? 'Évaluation créée M1 Archi' : 'Rapport mensuel généré',
                time: '1 jour',
                type: 'info'
              },
              {
                action: isEtudiant ? 'Absence signalée en TP' : isEnseignant ? 'Correction terminée L3 SD' : 'Configuration mise à jour',
                time: '3 jours',
                type: 'warning'
              }
            ].map((item, index) => (
              <div key={index} className="flex items-center space-x-3 text-sm">
                <div className={`w-2 h-2 rounded-full ${
                  item.type === 'success' ? 'bg-green-500' :
                  item.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1">
                  <p className="font-medium">{item.action}</p>
                </div>
                <span className="text-muted-foreground">Il y a {item.time}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}