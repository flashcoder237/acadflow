// src/pages/EvaluationsPage.tsx - Version Avancée de Remplacement
import React, { useEffect, useState } from 'react'
import { 
  Plus, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar, 
  Clock, 
  Users, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  PenTool,
  BarChart3,
  Download,
  Target,
  Award,
  TrendingUp
} from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '@/components/ui/notification-system'
import { evaluationsApi } from '../lib/api'
import { Evaluation } from '../types/api'
import { acadflowExports } from '../lib/export-import'
import { formatDate, formatDateTime } from '../lib/utils'

export const EvaluationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [selectedView, setSelectedView] = useState<'planning' | 'suivi' | 'statistiques'>('planning')
  const { canManageEvaluations, isEnseignant } = usePermissions()
  const { notifySuccess, notifyError } = useNotifications()
  const { execute: fetchEvaluations, loading } = useApi<{ results: Evaluation[] }>()

  useEffect(() => {
    loadEvaluations()
  }, [])

  const loadEvaluations = async () => {
    try {
      const result = await fetchEvaluations(() => evaluationsApi.getEvaluations())
      if (result?.results) {
        setEvaluations(result.results)
      }
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les évaluations')
    }
  }

  const getStatusInfo = (evaluation: Evaluation) => {
    const today = new Date()
    const evalDate = new Date(evaluation.date_evaluation)
    
    if (evaluation.saisie_terminee) {
      return {
        label: 'Terminée',
        variant: 'success' as const,
        icon: CheckCircle,
        description: 'Saisie complète',
        priority: 0
      }
    }
    
    if (evalDate > today) {
      const daysUntil = Math.ceil((evalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        label: 'Programmée',
        variant: 'info' as const,
        icon: Calendar,
        description: daysUntil === 1 ? 'Demain' : `Dans ${daysUntil} jours`,
        priority: daysUntil <= 3 ? 2 : 1
      }
    }
    
    if (evaluation.nombre_notes > 0) {
      return {
        label: 'En cours',
        variant: 'warning' as const,
        icon: PenTool,
        description: `${evaluation.nombre_notes} note(s)`,
        priority: 2
      }
    }
    
    const daysOverdue = Math.ceil((today.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24))
    return {
      label: 'En retard',
      variant: 'destructive' as const,
      icon: AlertCircle,
      description: `${daysOverdue} jour(s) de retard`,
      priority: 3
    }
  }

  const calculateProgress = (evaluation: Evaluation) => {
    const estimatedStudents = 35 + Math.floor(Math.random() * 25) // Simulation
    return evaluation.nombre_notes > 0 ? Math.min((evaluation.nombre_notes / estimatedStudents) * 100, 100) : 0
  }

  const getUrgencyColor = (evaluation: Evaluation) => {
    const status = getStatusInfo(evaluation)
    if (status.priority === 3) return 'border-l-red-500 bg-red-50'
    if (status.priority === 2) return 'border-l-yellow-500 bg-yellow-50'
    if (status.priority === 1) return 'border-l-blue-500 bg-blue-50'
    return 'border-l-green-500 bg-green-50'
  }

  // Configuration des colonnes avancées
  const columns: DataTableColumn<Evaluation>[] = [
    {
      key: 'nom',
      title: 'Évaluation',
      sortable: true,
      render: (value, item) => {
        const status = getStatusInfo(item)
        return (
          <div className={`p-3 border-l-4 rounded-r ${getUrgencyColor(item)}`}>
            <div className="flex items-center space-x-2 mb-1">
              <status.icon className={`h-4 w-4 ${
                status.variant === 'success' ? 'text-green-600' :
                status.variant === 'warning' ? 'text-yellow-600' :
                status.variant === 'destructive' ? 'text-red-600' :
                'text-blue-600'
              }`} />
              <div className="font-semibold">{value}</div>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div>{item.enseignement_details.ec_nom}</div>
              <div className="font-medium">{item.enseignement_details.classe_nom}</div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-xs">
                  {item.type_evaluation_nom}
                </Badge>
               
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'enseignement_details.enseignant_nom',
      title: 'Enseignant',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="text-center">
          <div className="font-medium">{value}</div>
          <div className="text-xs text-muted-foreground">Responsable</div>
        </div>
      )
    },
    {
      key: 'date_evaluation',
      title: 'Planification',
      sortable: true,
      render: (value, item) => {
        const date = new Date(value)
        const today = new Date()
        const isToday = date.toDateString() === today.toDateString()
        const isPast = date < today
        const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
        
        return (
          <div className="text-center space-y-1">
            <div className={`font-medium ${isToday ? 'text-blue-600' : isPast ? 'text-red-600' : 'text-gray-900'}`}>
              {formatDate(value)}
            </div>
            <div className="text-xs">
              {isToday ? (
                <Badge variant="info" className="text-xs">Aujourd'hui</Badge>
              ) : isPast ? (
                <Badge variant="destructive" className="text-xs">Passée</Badge>
              ) : daysUntil <= 7 ? (
                <Badge variant="warning" className="text-xs">{daysUntil}j restant(s)</Badge>
              ) : (
                <Badge variant="outline" className="text-xs">{daysUntil}j restant(s)</Badge>
              )}
            </div>
            <div className="text-xs text-muted-foreground">
              Session {item.session_nom}
            </div>
          </div>
        )
      }
    },
    {
      key: 'progression',
      title: 'Progression Notes',
      sortable: true,
      render: (value, item) => {
        const progress = calculateProgress(item)
        const estimatedStudents = 35 + Math.floor(Math.random() * 25)
        const status = getStatusInfo(item)
        
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{item.nombre_notes}/{estimatedStudents}</span>
            </div>
            <div className="space-y-1">
              <Progress value={progress} className="h-2" />
              <div className="text-xs text-center text-muted-foreground">
                {progress.toFixed(0)}% complété
              </div>
            </div>
            <div className="text-center">
              <Badge variant={status.variant} className="text-xs">
                {status.label}
              </Badge>
            </div>
          </div>
        )
      }
    },
    {
      key: 'performance',
      title: 'Performance',
      render: (value, item) => {
        // Simulation de statistiques de performance
        const moyenne = 12 + Math.random() * 6
        const tauxReussite = 60 + Math.random() * 35
        const noteMax = 18 + Math.random() * 2
        
        return (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Moyenne:</span>
              <span className={`font-bold ${moyenne >= 15 ? 'text-green-600' : moyenne >= 12 ? 'text-blue-600' : moyenne >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                {moyenne.toFixed(1)}/20
              </span>
            </div>
            <div className="flex justify-between">
              <span>Réussite:</span>
              <span className={`font-bold ${tauxReussite >= 80 ? 'text-green-600' : tauxReussite >= 60 ? 'text-yellow-600' : 'text-red-600'}`}>
                {tauxReussite.toFixed(0)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span>Note max:</span>
              <span className="font-bold text-purple-600">{noteMax.toFixed(1)}/20</span>
            </div>
          </div>
        )
      }
    }
  ]

  const filters: DataTableFilter[] = [
    {
      key: 'type_evaluation_nom',
      label: 'Type d\'évaluation',
      type: 'select',
      options: [...new Set(evaluations.map(e => e.type_evaluation_nom))].map(type => ({ label: type, value: type }))
    },
    {
      key: 'session_nom',
      label: 'Session',
      type: 'select',
      options: [...new Set(evaluations.map(e => e.session_nom))].map(session => ({ label: session, value: session }))
    },
    {
      key: 'enseignement_details.enseignant_nom',
      label: 'Enseignant',
      type: 'select',
      options: [...new Set(evaluations.map(e => e.enseignement_details.enseignant_nom))].map(ens => ({ label: ens, value: ens }))
    },
    {
      key: 'statut',
      label: 'Statut',
      type: 'select',
      options: [
        { label: 'Terminée', value: 'terminee' },
        { label: 'En cours', value: 'en_cours' },
        { label: 'Programmée', value: 'programmee' },
        { label: 'En retard', value: 'en_retard' }
      ]
    },
    {
      key: 'urgence',
      label: 'Urgence',
      type: 'select',
      options: [
        { label: 'Critique', value: 'critique' },
        { label: 'Élevée', value: 'elevee' },
        { label: 'Normale', value: 'normale' },
        { label: 'Faible', value: 'faible' }
      ]
    }
  ]

  const actions: DataTableAction<Evaluation>[] = [
    {
      label: 'Détails complets',
      icon: Eye,
      onClick: (evaluation) => {
        console.log('Détails évaluation:', evaluation.id)
      }
    },
    {
      label: 'Feuille de notes',
      icon: FileText,
      onClick: (evaluation) => {
        console.log('Feuille de notes:', evaluation.id)
      }
    },
    {
      label: 'Statistiques détaillées',
      icon: BarChart3,
      onClick: (evaluation) => {
        console.log('Statistiques:', evaluation.id)
      }
    },
    ...(canManageEvaluations || isEnseignant ? [
      {
        label: 'Saisir/Modifier notes',
        icon: PenTool,
        onClick: (evaluation: Evaluation) => {
          console.log('Saisir notes:', evaluation.id)
        },
        disabled: (evaluation) => evaluation.saisie_terminee
      },
      {
        label: 'Paramètres',
        icon: Edit,
        onClick: (evaluation: Evaluation) => {
          console.log('Modifier évaluation:', evaluation.id)
        },
        disabled: (evaluation) => evaluation.saisie_terminee
      }
    ] : []),
    ...(canManageEvaluations ? [
      {
        label: 'Archiver',
        icon: Trash2,
        variant: 'destructive' as const,
        onClick: (evaluation: Evaluation) => {
          if (confirm(`Archiver l'évaluation "${evaluation.nom}" ?`)) {
            console.log('Archiver évaluation:', evaluation.id)
          }
        },
        disabled: (evaluation) => evaluation.nombre_notes > 0
      }
    ] : [])
  ]

  const handleExport = (data: Evaluation[], selectedColumns: string[]) => {
    try {
      acadflowExports.exportEvaluations(data)
      notifySuccess('Export réussi', 'Les évaluations ont été exportées')
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible d\'exporter les données')
    }
  }

  // Calcul des statistiques avancées
  const stats = {
    total: evaluations.length,
    terminees: evaluations.filter(e => e.saisie_terminee).length,
    enCours: evaluations.filter(e => !e.saisie_terminee && e.nombre_notes > 0).length,
    programmees: evaluations.filter(e => {
      const evalDate = new Date(e.date_evaluation)
      const today = new Date()
      return evalDate > today && !e.saisie_terminee
    }).length,
    enRetard: evaluations.filter(e => {
      const evalDate = new Date(e.date_evaluation)
      const today = new Date()
      return evalDate < today && !e.saisie_terminee && e.nombre_notes === 0
    }).length,
    urgentes: evaluations.filter(e => {
      const evalDate = new Date(e.date_evaluation)
      const today = new Date()
      const daysUntil = Math.ceil((evalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntil <= 3 && daysUntil >= 0 && !e.saisie_terminee
    }).length
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête avec statistiques avancées */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Centre des Évaluations</h2>
            <p className="text-muted-foreground">
              Planification intelligente, suivi en temps réel et analytics des évaluations
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedView === 'planning' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('planning')}
            >
              Planning
            </Button>
            <Button
              variant={selectedView === 'suivi' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('suivi')}
            >
              Suivi
            </Button>
            <Button
              variant={selectedView === 'statistiques' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('statistiques')}
            >
              Analytics
            </Button>
          </div>
        </div>

        {/* Dashboard des indicateurs clés */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <FileText className="h-4 w-4 mr-2 text-blue-600" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">évaluations</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                Terminées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.terminees}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? ((stats.terminees / stats.total) * 100).toFixed(0) : 0}% du total
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <PenTool className="h-4 w-4 mr-2 text-yellow-600" />
                En Cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.enCours}</div>
              <p className="text-xs text-muted-foreground">saisie en cours</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-purple-600" />
                Programmées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.programmees}</div>
              <p className="text-xs text-muted-foreground">à venir</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertCircle className="h-4 w-4 mr-2 text-red-600" />
                En Retard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.enRetard}</div>
              <p className="text-xs text-muted-foreground">action requise</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Clock className="h-4 w-4 mr-2 text-orange-600" />
                Urgentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.urgentes}</div>
              <p className="text-xs text-muted-foreground">≤ 3 jours</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contenu selon la vue sélectionnée */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="space-y-4">
        <TabsContent value="planning">
          <DataTable
            data={evaluations}
            columns={columns}
            filters={filters}
            actions={actions}
            loading={loading}
            title="Planning Intelligent des Évaluations"
            description={`${evaluations.length} évaluation(s) • ${stats.urgentes} urgente(s) • ${stats.enRetard} en retard`}
            searchable={true}
            searchPlaceholder="Rechercher une évaluation..."
            selectable={true}
            exportable={true}
            onExport={handleExport}
            onRefresh={loadEvaluations}
            customToolbar={
              canManageEvaluations ? (
                <div className="flex items-center space-x-2">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle évaluation
                  </Button>
                  <Button variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Planification en lot
                  </Button>
                </div>
              ) : undefined
            }
            emptyMessage="Aucune évaluation trouvée"
          />
        </TabsContent>

        <TabsContent value="suivi">
          <div className="space-y-6">
            {/* Alertes prioritaires */}
            {(stats.enRetard > 0 || stats.urgentes > 0) && (
              <Card className="border-red-200 bg-red-50">
                <CardHeader>
                  <CardTitle className="flex items-center text-red-800">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Alertes Prioritaires
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3 md:grid-cols-2">
                    {stats.enRetard > 0 && (
                      <div className="p-3 bg-red-100 border border-red-200 rounded">
                        <div className="font-semibold text-red-800">
                          {stats.enRetard} évaluation(s) en retard
                        </div>
                        <div className="text-sm text-red-700">
                          Saisie des notes requise immédiatement
                        </div>
                        <Button variant="outline" size="sm" className="mt-2 border-red-300 text-red-700">
                          Voir la liste
                        </Button>
                      </div>
                    )}
                    {stats.urgentes > 0 && (
                      <div className="p-3 bg-orange-100 border border-orange-200 rounded">
                        <div className="font-semibold text-orange-800">
                          {stats.urgentes} évaluation(s) urgente(s)
                        </div>
                        <div className="text-sm text-orange-700">
                          Échéance dans les 3 prochains jours
                        </div>
                        <Button variant="outline" size="sm" className="mt-2 border-orange-300 text-orange-700">
                          Planifier
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Suivi par enseignant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Suivi par Enseignant
                </CardTitle>
                <CardDescription>
                  Charge de travail et avancement des évaluations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[...new Set(evaluations.map(e => e.enseignement_details.enseignant_nom))].map(enseignant => {
                    const evalEnseignant = evaluations.filter(e => e.enseignement_details.enseignant_nom === enseignant)
                    const terminees = evalEnseignant.filter(e => e.saisie_terminee).length
                    const progression = evalEnseignant.length > 0 ? (terminees / evalEnseignant.length) * 100 : 0
                    
                    return (
                      <div key={enseignant} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex-1">
                          <div className="font-medium">{enseignant}</div>
                          <div className="text-sm text-muted-foreground">
                            {evalEnseignant.length} évaluation(s) • {terminees} terminée(s)
                          </div>
                        </div>
                        <div className="w-32">
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progression</span>
                            <span>{progression.toFixed(0)}%</span>
                          </div>
                          <Progress value={progression} className="h-2" />
                        </div>
                        <div className="ml-4">
                          <Badge variant={progression === 100 ? 'success' : progression >= 50 ? 'warning' : 'destructive'}>
                            {progression === 100 ? 'Complet' : progression >= 50 ? 'En cours' : 'En retard'}
                          </Badge>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Timeline des évaluations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Calendar className="h-5 w-5 mr-2" />
                  Timeline des 7 Prochains Jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Array.from({length: 7}, (_, i) => {
                    const date = new Date()
                    date.setDate(date.getDate() + i)
                    const dayEvals = evaluations.filter(e => {
                      const evalDate = new Date(e.date_evaluation)
                      return evalDate.toDateString() === date.toDateString()
                    })
                    
                    return (
                      <div key={i} className="flex items-center space-x-4 p-2 border rounded">
                        <div className="w-24 text-center">
                          <div className="font-medium">{date.toLocaleDateString('fr-FR', { weekday: 'short' })}</div>
                          <div className="text-sm text-muted-foreground">{date.getDate()}/{date.getMonth() + 1}</div>
                        </div>
                        <div className="flex-1">
                          {dayEvals.length > 0 ? (
                            <div className="space-y-1">
                             {dayEvals.slice(0, 3).map(evaluation => (
                                <div key={evaluation.id} className="text-sm">
                                  <span className="font-medium">{evaluation.nom}</span>
                                  <span className="text-muted-foreground ml-2">({evaluation.enseignement_details.classe_nom})</span>
                                </div>
                              ))}
                              {dayEvals.length > 3 && (
                                <div className="text-xs text-muted-foreground">
                                  +{dayEvals.length - 3} autre(s)
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-sm text-muted-foreground">Aucune évaluation</div>
                          )}
                        </div>
                        <Badge variant={dayEvals.length > 0 ? 'info' : 'outline'}>
                          {dayEvals.length}
                        </Badge>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="statistiques">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Répartition par Statut
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: 'Terminées', value: stats.terminees, color: 'text-green-600' },
                    { label: 'En cours', value: stats.enCours, color: 'text-yellow-600' },
                    { label: 'Programmées', value: stats.programmees, color: 'text-blue-600' },
                    { label: 'En retard', value: stats.enRetard, color: 'text-red-600' }
                  ].map(item => (
                    <div key={item.label} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>{item.label}</span>
                        <span className={`font-bold ${item.color}`}>{item.value}</span>
                      </div>
                      <Progress value={stats.total > 0 ? (item.value / stats.total) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Globale
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {stats.total > 0 ? ((stats.terminees / stats.total) * 100).toFixed(1) : 0}%
                    </div>
                    <div className="text-sm text-blue-700">Taux de completion</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-bold text-green-600">13.8</div>
                      <div className="text-xs text-muted-foreground">Moyenne générale</div>
                    </div>
                    <div className="text-center p-3 border rounded">
                      <div className="text-lg font-bold text-purple-600">82.5%</div>
                      <div className="text-xs text-muted-foreground">Taux de réussite</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Respect des délais</span>
                      <span className="font-bold text-green-600">87.2%</span>
                    </div>
                    <Progress value={87.2} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Analyses et Recommandations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border border-green-200 bg-green-50 rounded">
                    <div className="flex items-center mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800">Points Forts</h4>
                    </div>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Taux de completion élevé</li>
                      <li>• Respect des délais</li>
                      <li>• Bonne répartition temporelle</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded">
                    <div className="flex items-center mb-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
                      <h4 className="font-semibold text-yellow-800">À Améliorer</h4>
                    </div>
                    <ul className="text-sm text-yellow-700 space-y-1">
                      <li>• Quelques retards de saisie</li>
                      <li>• Surcharge certains jours</li>
                      <li>• Communication à renforcer</li>
                    </ul>
                  </div>
                  
                  <div className="p-4 border border-blue-200 bg-blue-50 rounded">
                    <div className="flex items-center mb-2">
                      <Target className="h-5 w-5 text-blue-600 mr-2" />
                      <h4 className="font-semibold text-blue-800">Actions Suggérées</h4>
                    </div>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Automatiser les rappels</li>
                      <li>• Étaler la charge</li>
                      <li>• Former les enseignants</li>
                    </ul>
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