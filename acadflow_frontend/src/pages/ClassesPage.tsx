// src/pages/ClassesPage.tsx - Version améliorée
import React, { useEffect, useState } from 'react'
import { Plus, Users, Eye, Edit, Trash2, BookOpen, BarChart3 } from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '@/components/ui/notification-system'
import { academicsApi } from '../lib/api'
import { Classe } from '../types/api'
import { acadflowExports } from '../lib/export-import'
import { formatDate } from '../lib/utils'

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Classe[]>([])
  const { canManageClasses } = usePermissions()
  const { notifySuccess, notifyError } = useNotifications()
  const { execute: fetchClasses, loading } = useApi<{ results: Classe[] }>()

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    try {
      const result = await fetchClasses(() => academicsApi.getClasses())
      if (result?.results) {
        setClasses(result.results)
      }
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les classes')
    }
  }

  // Configuration des colonnes
  const columns: DataTableColumn<Classe>[] = [
    {
      key: 'nom',
      title: 'Classe',
      sortable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">{item.code}</div>
        </div>
      )
    },
    {
      key: 'filiere_nom',
      title: 'Filière',
      sortable: true,
      filterable: true
    },
    {
      key: 'niveau_nom',
      title: 'Niveau',
      sortable: true,
      filterable: true
    },
    {
      key: 'annee_academique_libelle',
      title: 'Année académique',
      sortable: true,
      filterable: true
    },
    {
      key: 'effectif_actuel',
      title: 'Effectif',
      sortable: true,
      render: (value, item) => {
        const ratio = value / item.effectif_max
        const color = ratio >= 0.9 ? 'text-red-600' : ratio >= 0.7 ? 'text-yellow-600' : 'text-green-600'
        return (
          <div className={color}>
            <span className="font-semibold">{value}</span>
            <span className="text-muted-foreground">/{item.effectif_max}</span>
          </div>
        )
      }
    },
    {
      key: 'active',
      title: 'Statut',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      title: 'Date création',
      sortable: true,
      render: (value) => formatDate(value),
      exportable: false
    }
  ]

  // Configuration des filtres
  const filters: DataTableFilter[] = [
    {
      key: 'filiere_nom',
      label: 'Filière',
      type: 'select',
      options: [
        ...new Set(classes.map(c => c.filiere_nom))
      ].map(filiere => ({ label: filiere, value: filiere }))
    },
    {
      key: 'niveau_nom',
      label: 'Niveau',
      type: 'select',
      options: [
        ...new Set(classes.map(c => c.niveau_nom))
      ].map(niveau => ({ label: niveau, value: niveau }))
    },
    {
      key: 'annee_academique_libelle',
      label: 'Année académique',
      type: 'select',
      options: [
        ...new Set(classes.map(c => c.annee_academique_libelle))
      ].map(annee => ({ label: annee, value: annee }))
    },
    {
      key: 'active',
      label: 'Statut',
      type: 'select',
      options: [
        { label: 'Active', value: true },
        { label: 'Inactive', value: false }
      ]
    },
    {
      key: 'effectif_min',
      label: 'Effectif minimum',
      type: 'number',
      placeholder: 'Min'
    },
    {
      key: 'effectif_max',
      label: 'Effectif maximum',
      type: 'number',
      placeholder: 'Max'
    }
  ]

  // Actions sur les lignes
  const actions: DataTableAction<Classe>[] = [
    {
      label: 'Voir détails',
      icon: Eye,
      onClick: (classe) => {
        // Navigation vers les détails
        console.log('Voir détails classe:', classe.id)
      }
    },
    {
      label: 'Voir étudiants',
      icon: Users,
      onClick: (classe) => {
        // Navigation vers la liste des étudiants
        console.log('Voir étudiants classe:', classe.id)
      }
    },
    {
      label: 'Programme pédagogique',
      icon: BookOpen,
      onClick: (classe) => {
        // Navigation vers le programme
        console.log('Programme classe:', classe.id)
      }
    },
    {
      label: 'Statistiques',
      icon: BarChart3,
      onClick: (classe) => {
        // Navigation vers les statistiques
        console.log('Statistiques classe:', classe.id)
      }
    },
    ...(canManageClasses ? [
      {
        label: 'Modifier',
        icon: Edit,
        onClick: (classe: Classe) => {
          // Ouvrir le formulaire de modification
          console.log('Modifier classe:', classe.id)
        }
      },
      {
        label: 'Supprimer',
        icon: Trash2,
        variant: 'destructive' as const,
        onClick: (classe: Classe) => {
          // Confirmation et suppression
          if (confirm(`Êtes-vous sûr de vouloir supprimer la classe ${classe.nom} ?`)) {
            console.log('Supprimer classe:', classe.id)
          }
        },
        disabled: (classe) => classe.effectif_actuel > 0
      }
    ] : [])
  ]

  // Gestion de l'export
  const handleExport = (data: Classe[], selectedColumns: string[]) => {
    try {
      acadflowExports.exportClasses(data)
      notifySuccess('Export réussi', 'Les données ont été exportées avec succès')
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible d\'exporter les données')
    }
  }

  // Barre d'outils personnalisée
  const customToolbar = (
    <div className="flex items-center space-x-2">
      {canManageClasses && (
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle classe
        </Button>
      )}
    </div>
  )

  // Calcul des statistiques
  const stats = {
    total: classes.length,
    actives: classes.filter(c => c.active).length,
    effectifTotal: classes.reduce((sum, c) => sum + c.effectif_actuel, 0),
    tauxOccupation: classes.length > 0 
      ? (classes.reduce((sum, c) => sum + (c.effectif_actuel / c.effectif_max), 0) / classes.length * 100).toFixed(1)
      : 0
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête avec statistiques */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Classes</h2>
          <p className="text-muted-foreground">
            Gérez les classes, effectifs et organisations pédagogiques
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total classes</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.actives} actives
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Effectif total</h3>
              <Users className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.effectifTotal}</div>
            <p className="text-xs text-muted-foreground">
              étudiants inscrits
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Taux d'occupation</h3>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.tauxOccupation}%</div>
            <p className="text-xs text-muted-foreground">
              occupation moyenne
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Filières</h3>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {new Set(classes.map(c => c.filiere_nom)).size}
            </div>
            <p className="text-xs text-muted-foreground">
              filières actives
            </p>
          </div>
        </div>
      </div>

      {/* Tableau des données */}
      <DataTable
        data={classes}
        columns={columns}
        filters={filters}
        actions={actions}
        loading={loading}
        title="Liste des classes"
        description={`${classes.length} classe(s) au total`}
        searchable={true}
        searchPlaceholder="Rechercher une classe..."
        selectable={true}
        exportable={true}
        importable={canManageClasses}
        onExport={handleExport}
        onRefresh={loadClasses}
        customToolbar={customToolbar}
        emptyMessage="Aucune classe trouvée"
        className="w-full"
      />
    </div>
  )
}