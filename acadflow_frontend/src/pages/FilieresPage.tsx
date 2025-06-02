// src/pages/FilieresPage.tsx - Gestion des Filières avec Options
import React, { useEffect, useState } from 'react'
import { Plus, BookOpen, Users, Settings, Target, Eye, Edit, ArrowRight } from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '@/components/ui/notification-system'
import { coreApi } from '../lib/api'
import { Filiere, Option, StatistiquesFiliere } from '../types/api'

export const FilieresPage: React.FC = () => {
  const [filieres, setFilieres] = useState<Filiere[]>([])
  const [selectedDomaine, setSelectedDomaine] = useState<string>('all')
  const [domaines, setDomaines] = useState<any[]>([])
  const { canManageUsers } = usePermissions()
  const { notifySuccess, notifyError } = useNotifications()
  const { execute: fetchFilieres, loading } = useApi<{ results: Filiere[] }>()

  useEffect(() => {
    loadData()
  }, [selectedDomaine])

  const loadData = async () => {
    try {
      const params = selectedDomaine !== 'all' ? { domaine: selectedDomaine } : {}
      const result = await fetchFilieres(() => coreApi.getFilieres(params))
      if (result?.results) setFilieres(result.results)
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les filières')
    }
  }

  const columns: DataTableColumn<Filiere>[] = [
    {
      key: 'nom',
      title: 'Filière',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{item.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'domaine_nom',
      title: 'Domaine',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant="outline">{value}</Badge>
      )
    },
    {
      key: 'type_formation_nom',
      title: 'Type Formation',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant="secondary">{value}</Badge>
      )
    },
    {
      key: 'nombre_options',
      title: 'Options',
      render: (value, item) => (
        <div className="text-center">
          <div className="text-lg font-bold text-purple-600">
            {/* Simulé - à remplacer par vraie donnée */}
            {Math.floor(Math.random() * 5) + 1}
          </div>
          <div className="text-xs text-muted-foreground">spécialisations</div>
        </div>
      )
    },
    {
      key: 'nombre_etudiants',
      title: 'Effectifs',
      render: (value, item) => (
        <div className="space-y-1">
          <div className="text-lg font-bold text-green-600">
            {/* Simulé - à remplacer par vraie donnée */}
            {Math.floor(Math.random() * 200) + 50}
          </div>
          <Progress value={Math.random() * 100} className="h-1" />
          <div className="text-xs text-muted-foreground">étudiants</div>
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

  const actions: DataTableAction<Filiere>[] = [
    {
      label: 'Voir options',
      icon: Target,
      onClick: (filiere) => {
        console.log('Voir options de la filière:', filiere.id)
      }
    },
    {
      label: 'Classes par niveau',
      icon: Users,
      onClick: (filiere) => {
        console.log('Classes par niveau:', filiere.id)
      }
    },
    {
      label: 'Statistiques',
      icon: BarChart3,
      onClick: (filiere) => {
        console.log('Statistiques filière:', filiere.id)
      }
    },
    ...(canManageUsers ? [
      {
        label: 'Modifier',
        icon: Edit,
        onClick: (filiere: Filiere) => {
          console.log('Modifier filière:', filiere.id)
        }
      },
      {
        label: 'Gérer options',
        icon: Settings,
        onClick: (filiere: Filiere) => {
          console.log('Gérer options:', filiere.id)
        }
      }
    ] : [])
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestion des Filières</h2>
            <p className="text-muted-foreground">
              Organisez les filières, spécialisations et parcours académiques
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Select value={selectedDomaine} onValueChange={setSelectedDomaine}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrer par domaine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les domaines</SelectItem>
                <SelectItem value="informatique">Informatique</SelectItem>
                <SelectItem value="mathematiques">Mathématiques</SelectItem>
                <SelectItem value="physique">Physique</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Filières actives</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filieres.filter(f => f.actif).length}</div>
              <p className="text-xs text-muted-foreground">
                sur {filieres.length} total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Spécialisations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {filieres.length * 2 + Math.floor(Math.random() * 10)}
              </div>
              <p className="text-xs text-muted-foreground">
                options disponibles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Étudiants inscrits</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Math.floor(Math.random() * 1000) + 500}
              </div>
              <p className="text-xs text-muted-foreground">
                toutes filières
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Taux d'occupation</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(Math.random() * 30) + 70}%
              </div>
              <p className="text-xs text-muted-foreground">
                capacité utilisée
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <DataTable
        data={filieres}
        columns={columns}
        actions={actions}
        loading={loading}
        title="Liste des filières"
        description={`${filieres.length} filière(s) configurée(s)`}
        searchable={true}
        searchPlaceholder="Rechercher une filière..."
        selectable={canManageUsers}
        exportable={true}
        onRefresh={loadData}
        customToolbar={
          canManageUsers ? (
            <div className="flex items-center space-x-2">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle filière
              </Button>
              <Button variant="outline">
                <Target className="mr-2 h-4 w-4" />
                Gérer options
              </Button>
            </div>
          ) : undefined
        }
        emptyMessage="Aucune filière trouvée"
      />
    </div>
  )
}