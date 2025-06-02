// src/pages/UEsPage.tsx - Gestion des Unités d'Enseignement
import React, { useEffect, useState } from 'react'
import { Plus, BookOpen, Users, Settings, Target, Eye, Edit, Trash2, Award } from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '@/components/ui/notification-system'
import { academicsApi } from '../lib/api'
import { UE } from '../types/api'

export const UEsPage: React.FC = () => {
  const [ues, setUes] = useState<UE[]>([])
  const { canManageClasses } = usePermissions()
  const { notifySuccess, notifyError } = useNotifications()
  const { execute: fetchUEs, loading } = useApi<{ results: UE[] }>()

  useEffect(() => {
    loadUEs()
  }, [])

  const loadUEs = async () => {
    try {
      const result = await fetchUEs(() => academicsApi.getUEs())
      if (result?.results) {
        setUes(result.results)
      }
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les UEs')
    }
  }

  const getTypeUEVariant = (type: string) => {
    return type === 'obligatoire' ? 'default' : 'secondary'
  }

  const columns: DataTableColumn<UE>[] = [
    {
      key: 'nom',
      title: 'Unité d\'Enseignement',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-100 to-blue-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{item.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'niveau_nom',
      title: 'Niveau',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'semestre_nom',
      title: 'Semestre',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant="secondary">{value}</Badge>
      )
    },
    {
      key: 'credits',
      title: 'Crédits ECTS',
      sortable: true,
      render: (value) => (
        <div className="text-center">
          <div className="text-lg font-bold text-blue-600">{value}</div>
          <div className="text-xs text-muted-foreground">ECTS</div>
        </div>
      )
    },
    
    {
      key: 'type_ue',
      title: 'Type',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant={getTypeUEVariant(value)}>
          {value === 'obligatoire' ? 'Obligatoire' : 'Optionnelle'}
        </Badge>
      )
    },
    {
      key: 'nombre_ec',
      title: 'Éléments Constitutifs',
      sortable: true,
      render: (value) => (
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">{value}</div>
          <div className="text-xs text-muted-foreground">EC(s)</div>
        </div>
      )
    },
    {
      key: 'actif',
      title: 'Statut',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    }
  ]

  const filters: DataTableFilter[] = [
    {
      key: 'niveau_nom',
      label: 'Niveau',
      type: 'select',
      options: [
        ...new Set(ues.map(ue => ue.niveau_nom))
      ].map(niveau => ({ label: niveau, value: niveau }))
    },
    {
      key: 'semestre_nom',
      label: 'Semestre',
      type: 'select',
      options: [
        ...new Set(ues.map(ue => ue.semestre_nom))
      ].map(semestre => ({ label: semestre, value: semestre }))
    },
    {
      key: 'type_ue',
      label: 'Type d\'UE',
      type: 'select',
      options: [
        { label: 'Obligatoire', value: 'obligatoire' },
        { label: 'Optionnelle', value: 'optionnelle' }
      ]
    },
    {
      key: 'actif',
      label: 'Statut',
      type: 'select',
      options: [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false }
      ]
    },
    {
      key: 'credits_min',
      label: 'Crédits minimum',
      type: 'number'
    }
  ]

  const actions: DataTableAction<UE>[] = [
    {
      label: 'Voir ECs',
      icon: BookOpen,
      onClick: (ue) => {
        console.log('Voir ECs de l\'UE:', ue.id)
      }
    },
    {
      label: 'Configuration évaluations',
      icon: Settings,
      onClick: (ue) => {
        console.log('Configuration évaluations UE:', ue.id)
      }
    },
    {
      label: 'Prérequis',
      icon: Target,
      onClick: (ue) => {
        console.log('Prérequis UE:', ue.id)
      }
    },
    ...(canManageClasses ? [
      {
        label: 'Modifier',
        icon: Edit,
        onClick: (ue: UE) => {
          console.log('Modifier UE:', ue.id)
        }
      },
      {
        label: 'Supprimer',
        icon: Trash2,
        variant: 'destructive' as const,
        onClick: (ue: UE) => {
          if (confirm(`Êtes-vous sûr de vouloir supprimer l'UE "${ue.nom}" ?`)) {
            console.log('Supprimer UE:', ue.id)
          }
        },
        disabled: (ue) => ue.nombre_ec > 0
      }
    ] : [])
  ]

  const stats = {
    total: ues.length,
    obligatoires: ues.filter(ue => ue.type_ue === 'obligatoire').length,
    optionnelles: ues.filter(ue => ue.type_ue === 'optionnelle').length,
    creditsTotal: ues.reduce((sum, ue) => sum + ue.credits, 0),
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des UEs</h2>
          <p className="text-muted-foreground">
            Organisez les Unités d'Enseignement et leurs éléments constitutifs
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total UEs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                unités d'enseignement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Obligatoires</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.obligatoires}</div>
              <p className="text-xs text-muted-foreground">
                UEs obligatoires
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Optionnelles</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.optionnelles}</div>
              <p className="text-xs text-muted-foreground">
                UEs optionnelles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Crédits ECTS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.creditsTotal}</div>
              <p className="text-xs text-muted-foreground">
                total crédits
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DataTable
        data={ues}
        columns={columns}
        filters={filters}
        actions={actions}
        loading={loading}
        title="Liste des UEs"
        description={`${ues.length} unité(s) d'enseignement configurée(s)`}
        searchable={true}
        searchPlaceholder="Rechercher une UE..."
        selectable={canManageClasses}
        exportable={true}
        onRefresh={loadUEs}
        customToolbar={
          canManageClasses ? (
            <div className="flex items-center space-x-2">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle UE
              </Button>
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configuration globale
              </Button>
            </div>
          ) : undefined
        }
        emptyMessage="Aucune UE trouvée"
      />
    </div>
  )
}
