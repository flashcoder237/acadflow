// src/pages/DomainesPage.tsx - Gestion Multi-Institutionnelle
import React, { useEffect, useState } from 'react'
import { Plus, Building2, Users, BookOpen, BarChart3, Settings, Eye, Edit, Trash2 } from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '@/components/ui/notification-system'
import { coreApi } from '../lib/api'
import { Domaine, StatistiquesDomaine } from '../types/api'

export const DomainesPage: React.FC = () => {
  const [domaines, setDomaines] = useState<Domaine[]>([])
  const [stats, setStats] = useState<StatistiquesDomaine[]>([])
  const { canManageUsers } = usePermissions()
  const { notifySuccess, notifyError } = useNotifications()
  const { execute: fetchDomaines, loading } = useApi<{ results: Domaine[] }>()
  const { execute: fetchStats } = useApi<StatistiquesDomaine[]>()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [domainesResult, statsResult] = await Promise.all([
        fetchDomaines(() => coreApi.getDomaines()),
        fetchStats(() => coreApi.getDomainesStatistiques())
      ])
      
      if (domainesResult?.results) setDomaines(domainesResult.results)
      if (statsResult) setStats(statsResult)
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les données')
    }
  }

  const columns: DataTableColumn<Domaine>[] = [
    {
      key: 'nom',
      title: 'Domaine',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
            <Building2 className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{item.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'description',
      title: 'Description',
      render: (value) => (
        <div className="max-w-xs truncate">
          {value || '-'}
        </div>
      )
    },
    {
      key: 'nombre_filieres',
      title: 'Filières',
      sortable: true,
      render: (value, item) => {
        const stat = stats.find(s => s.id === item.id)
        return (
          <div className="text-center">
            <div className="text-xl font-bold text-blue-600">
              {stat?.nombre_filieres || 0}
            </div>
            <div className="text-xs text-muted-foreground">filières</div>
          </div>
        )
      }
    },
    {
      key: 'nombre_etudiants',
      title: 'Étudiants',
      sortable: true,
      render: (value, item) => {
        const stat = stats.find(s => s.id === item.id)
        return (
          <div className="text-center">
            <div className="text-xl font-bold text-green-600">
              {stat?.nombre_etudiants || 0}
            </div>
            <div className="text-xs text-muted-foreground">étudiants</div>
          </div>
        )
      }
    },
    {
      key: 'actif',
      title: 'Statut',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Actif' : 'Inactif'}
        </Badge>
      )
    }
  ]

  const actions: DataTableAction<Domaine>[] = [
    {
      label: 'Voir filières',
      icon: BookOpen,
      onClick: (domaine) => {
        console.log('Voir filières du domaine:', domaine.id)
      }
    },
    {
      label: 'Statistiques',
      icon: BarChart3,
      onClick: (domaine) => {
        console.log('Statistiques du domaine:', domaine.id)
      }
    },
    ...(canManageUsers ? [
      {
        label: 'Modifier',
        icon: Edit,
        onClick: (domaine: Domaine) => {
          console.log('Modifier domaine:', domaine.id)
        }
      },
      {
        label: 'Configuration',
        icon: Settings,
        onClick: (domaine: Domaine) => {
          console.log('Configuration domaine:', domaine.id)
        }
      }
    ] : [])
  ]

  const globalStats = {
    totalDomaines: domaines.length,
    domainesActifs: domaines.filter(d => d.actif).length,
    totalFilieres: stats.reduce((sum, s) => sum + s.nombre_filieres, 0),
    totalEtudiants: stats.reduce((sum, s) => sum + s.nombre_etudiants, 0)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Domaines</h2>
          <p className="text-muted-foreground">
            Gérez les domaines institutionnels et leurs filières associées
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total domaines</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalDomaines}</div>
              <p className="text-xs text-muted-foreground">
                {globalStats.domainesActifs} actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filières totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{globalStats.totalFilieres}</div>
              <p className="text-xs text-muted-foreground">
                toutes filières confondues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Étudiants inscrits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{globalStats.totalEtudiants}</div>
              <p className="text-xs text-muted-foreground">
                tous domaines confondus
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taux d'activité</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {globalStats.totalDomaines > 0 ? ((globalStats.domainesActifs / globalStats.totalDomaines) * 100).toFixed(0) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                domaines actifs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DataTable
        data={domaines}
        columns={columns}
        actions={actions}
        loading={loading}
        title="Liste des domaines"
        description={`${domaines.length} domaine(s) configuré(s)`}
        searchable={true}
        searchPlaceholder="Rechercher un domaine..."
        selectable={canManageUsers}
        exportable={true}
        onRefresh={loadData}
        customToolbar={
          canManageUsers ? (
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nouveau domaine
            </Button>
          ) : undefined
        }
        emptyMessage="Aucun domaine configuré"
      />
    </div>
  )
}