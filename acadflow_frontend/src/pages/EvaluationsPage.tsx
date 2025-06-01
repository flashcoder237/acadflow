// src/pages/EvaluationsPage.tsx - Version améliorée
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
  Download
} from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '@/components/ui/notification-system'
import { evaluationsApi } from '../lib/api'
import { Evaluation } from '../types/api'
import { acadflowExports } from '../lib/export-import'
import { formatDate, formatDateTime } from '../lib/utils'

export const EvaluationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
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
        description: 'Saisie des notes terminée'
      }
    }
    
    if (evalDate > today) {
      const daysUntil = Math.ceil((evalDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return {
        label: 'Programmée',
        variant: 'info' as const,
        icon: Calendar,
        description: daysUntil === 1 ? 'Demain' : `Dans ${daysUntil} jours`
      }
    }
    
    if (evaluation.nombre_notes > 0) {
      return {
        label: 'En cours',
        variant: 'warning' as const,
        icon: PenTool,
        description: `${evaluation.nombre_notes} note(s) saisie(s)`
      }
    }
    
    const daysOverdue = Math.ceil((today.getTime() - evalDate.getTime()) / (1000 * 60 * 60 * 24))
    return {
      label: 'En retard',
      variant: 'destructive' as const,
      icon: AlertCircle,
      description: `${daysOverdue} jour(s) de retard`
    }
  }

  const calculateProgress = (evaluation: Evaluation) => {
    // Estimation du nombre d'étudiants (à remplacer par la vraie donnée)
    const estimatedStudents = 30 // Cette valeur devrait venir de l'API
    return evaluation.nombre_notes > 0 ? (evaluation.nombre_notes / estimatedStudents) * 100 : 0
  }

  // Configuration des colonnes
  const columns: DataTableColumn<Evaluation>[] = [
    {
      key: 'nom',
      title: 'Évaluation',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">
            {item.enseignement_details.ec_nom} • {item.enseignement_details.classe_nom}
          </div>
        </div>
      )
    },
    {
      key: 'type_evaluation_nom',
      title: 'Type',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'enseignement_details.enseignant_nom',
      title: 'Enseignant',
      sortable: true,
      filterable: true
    },
    {
      key: 'date_evaluation',
      title: 'Date',
      sortable: true,
      render: (value, item) => {
        const date = new Date(value)
        const today = new Date()
        const isToday = date.toDateString() === today.toDateString()
        const isPast = date < today
        
        return (
          <div className="flex items-center space-x-2">
            <Calendar className={`h-4 w-4 ${isToday ? 'text-blue-600' : isPast ? 'text-red-600' : 'text-muted-foreground'}`} />
            <div>
              <div className={`text-sm ${isToday ? 'font-semibold text-blue-600' : ''}`}>
                {formatDate(value)}
              </div>
              {isToday && <div className="text-xs text-blue-600">Aujourd'hui</div>}
            </div>
          </div>
        )
      }
    },
    {
      key: 'session_nom',
      title: 'Session',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant="secondary">{value}</Badge>
      )
    },
    {
      key: 'coefficient',
      title: 'Coefficient',
      sortable: true,
      render: (value) => (
        <span className="font-mono">{value}</span>
      )
    },
    {
      key: 'nombre_notes',
      title: 'Progression',
      sortable: true,
      render: (value, item) => {
        const progress = calculateProgress(item)
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{value} notes</span>
            </div>
            <Progress value={progress} className="h-1.5" />
          </div>
        )
      }
    },
    {
      key: 'saisie_terminee',
      title: 'Statut',
      sortable: true,
      filterable: true,
      render: (value, item) => {
        const status = getStatusInfo(item)
        return (
          <div className="flex items-center space-x-2">
            <status.icon className={`h-4 w-4 ${
              status.variant === 'success' ? 'text-green-600' :
              status.variant === 'warning' ? 'text-yellow-600' :
              status.variant === 'destructive' ? 'text-red-600' :
              'text-blue-600'
            }`} />
            <div>
              <Badge variant={status.variant}>{status.label}</Badge>
              <div className="text-xs text-muted-foreground mt-1">
                {status.description}
              </div>
            </div>
          </div>
        )
      }
    }
  ]

  // Configuration des filtres
  const filters: DataTableFilter[] = [
    {
      key: 'type_evaluation_nom',
      label: 'Type d\'évaluation',
      type: 'select',
      options: [
        ...new Set(evaluations.map(e => e.type_evaluation_nom))
      ].map(type => ({ label: type, value: type }))
    },
    {
      key: 'session_nom',
      label: 'Session',
      type: 'select',
      options: [
        ...new Set(evaluations.map(e => e.session_nom))
      ].map(session => ({ label: session, value: session }))
    },
    {
      key: 'enseignement_details.enseignant_nom',
      label: 'Enseignant',
      type: 'select',
      options: [
        ...new Set(evaluations.map(e => e.enseignement_details.enseignant_nom))
      ].map(enseignant => ({ label: enseignant, value: enseignant }))
    },
    {
      key: 'saisie_terminee',
      label: 'État de saisie',
      type: 'select',
      options: [
        { label: 'Terminée', value: true },
        { label: 'En cours', value: false }
      ]
    },
    {
      key: 'date_evaluation',
      label: 'Date (depuis)',
      type: 'date'
    },
    {
      key: 'coefficient_min',
      label: 'Coefficient min',
      type: 'number'
    }
  ]

  // Actions sur les lignes
  const actions: DataTableAction<Evaluation>[] = [
    {
      label: 'Voir détails',
      icon: Eye,
      onClick: (evaluation) => {
        console.log('Voir détails évaluation:', evaluation.id)
        // Navigation vers les détails
      }
    },
    {
      label: 'Feuille de notes',
      icon: FileText,
      onClick: (evaluation) => {
        console.log('Feuille de notes:', evaluation.id)
        // Navigation vers la feuille de notes
      }
    },
    {
      label: 'Statistiques',
      icon: BarChart3,
      onClick: (evaluation) => {
        console.log('Statistiques évaluation:', evaluation.id)
        // Navigation vers les statistiques
      }
    },
    ...(canManageEvaluations || isEnseignant ? [
      {
        label: 'Saisir notes',
        icon: PenTool,
        onClick: (evaluation: Evaluation) => {
          console.log('Saisir notes:', evaluation.id)
          // Navigation vers la saisie de notes
        },
        disabled: (evaluation) => evaluation.saisie_terminee
      },
      {
        label: 'Modifier',
        icon: Edit,
        onClick: (evaluation: Evaluation) => {
          console.log('Modifier évaluation:', evaluation.id)
          // Ouvrir le formulaire de modification
        },
        disabled: (evaluation) => evaluation.saisie_terminee
      }
    ] : []),
    ...(canManageEvaluations ? [
      {
        label: 'Supprimer',
        icon: Trash2,
        variant: 'destructive' as const,
        onClick: (evaluation: Evaluation) => {
          if (confirm(`Êtes-vous sûr de vouloir supprimer l'évaluation "${evaluation.nom}" ?`)) {
            console.log('Supprimer évaluation:', evaluation.id)
            // API call pour supprimer
          }
        },
        disabled: (evaluation) => evaluation.nombre_notes > 0
      }
    ] : [])
  ]

  // Gestion de l'export
  const handleExport = (data: Evaluation[], selectedColumns: string[]) => {
    try {
      acadflowExports.exportEvaluations(data)
      notifySuccess('Export réussi', 'Les évaluations ont été exportées avec succès')
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible d\'exporter les données')
    }
  }

  // Barre d'outils personnalisée
  const customToolbar = (
    <div className="flex items-center space-x-2">
      {canManageEvaluations && (
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle évaluation
        </Button>
      )}
    </div>
  )

  // Calcul des statistiques
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
    }).length
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête avec statistiques */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Évaluations</h2>
          <p className="text-muted-foreground">
            Planifiez, gérez et suivez les évaluations et la saisie des notes
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total</h3>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">évaluations</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Terminées</h3>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.terminees}</div>
            <p className="text-xs text-muted-foreground">
              {stats.total > 0 ? ((stats.terminees / stats.total) * 100).toFixed(0) : 0}% du total
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">En cours</h3>
              <PenTool className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.enCours}</div>
            <p className="text-xs text-muted-foreground">saisie en cours</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Programmées</h3>
              <Calendar className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.programmees}</div>
            <p className="text-xs text-muted-foreground">à venir</p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">En retard</h3>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.enRetard}</div>
            <p className="text-xs text-muted-foreground">notes manquantes</p>
          </div>
        </div>
      </div>

      {/* Tableau des données */}
      <DataTable
        data={evaluations}
        columns={columns}
        filters={filters}
        actions={actions}
        loading={loading}
        title="Liste des évaluations"
        description={`${evaluations.length} évaluation(s) au total`}
        searchable={true}
        searchPlaceholder="Rechercher une évaluation..."
        selectable={true}
        exportable={true}
        onExport={handleExport}
        onRefresh={loadEvaluations}
        customToolbar={customToolbar}
        emptyMessage="Aucune évaluation trouvée"
        className="w-full"
      />
    </div>
  )
}