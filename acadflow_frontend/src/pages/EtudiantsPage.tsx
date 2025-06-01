// src/pages/EtudiantsPage.tsx - Version améliorée
import React, { useEffect, useState } from 'react'
import { Plus, Eye, Edit, Trash2, Mail, Phone, Download, Upload, UserCheck, UserX } from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '@/components/ui/notification-system'
import { usersApi } from '../lib/api'
import { Etudiant } from '../types/api'
import { acadflowExports, acadflowImports } from '../lib/export-import'
import { formatDate } from '../lib/utils'

export const EtudiantsPage: React.FC = () => {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const { canManageUsers } = usePermissions()
  const { notifySuccess, notifyError } = useNotifications()
  const { execute: fetchEtudiants, loading } = useApi<{ results: Etudiant[] }>()

  useEffect(() => {
    loadEtudiants()
  }, [])

  const loadEtudiants = async () => {
    try {
      const result = await fetchEtudiants(() => usersApi.getEtudiants())
      if (result?.results) {
        setEtudiants(result.results)
      }
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les étudiants')
    }
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusVariant = (status: string) => {
    const statusMap: Record<string, any> = {
      'inscrit': 'success',
      'redoublant': 'warning',
      'suspendu': 'destructive',
      'diplômé': 'info',
      'exclu': 'destructive',
      'abandon': 'secondary'
    }
    return statusMap[status.toLowerCase()] || 'secondary'
  }

  // Configuration des colonnes
  const columns: DataTableColumn<Etudiant>[] = [
    {
      key: 'user',
      title: 'Étudiant',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={value.photo} />
            <AvatarFallback>{getInitials(item.nom_complet)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-medium">{item.nom_complet}</div>
            <div className="text-sm text-muted-foreground">{value.email}</div>
          </div>
        </div>
      )
    },
    {
      key: 'matricule',
      title: 'Matricule',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-sm">{value}</span>
      )
    },
    {
      key: 'user.telephone',
      title: 'Contact',
      render: (value, item) => (
        <div className="space-y-1">
          {item.user.email && (
            <div className="flex items-center text-sm">
              <Mail className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="truncate max-w-[200px]">{item.user.email}</span>
            </div>
          )}
          {item.user.telephone && (
            <div className="flex items-center text-sm">
              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
              {item.user.telephone}
            </div>
          )}
        </div>
      ),
      exportable: false
    },
    {
      key: 'user.date_naissance',
      title: 'Date naissance',
      sortable: true,
      render: (value) => value ? formatDate(value) : '-'
    },
    {
      key: 'statut_current',
      title: 'Statut',
      sortable: true,
      filterable: true,
      render: (value) => (
        <Badge variant={getStatusVariant(value)}>
          {value}
        </Badge>
      )
    },
    {
      key: 'numero_carte',
      title: 'Carte étudiant',
      sortable: true,
      render: (value) => (
        <span className={`font-mono text-sm ${value ? '' : 'text-muted-foreground'}`}>
          {value || 'Non attribué'}
        </span>
      )
    },
    {
      key: 'user.actif',
      title: 'Compte actif',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'success' : 'secondary'}>
          {value ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'created_at',
      title: 'Date inscription',
      sortable: true,
      render: (value) => formatDate(value)
    }
  ]

  // Configuration des filtres
  const filters: DataTableFilter[] = [
    {
      key: 'statut_current',
      label: 'Statut',
      type: 'select',
      options: [
        ...new Set(etudiants.map(e => e.statut_current))
      ].map(statut => ({ label: statut, value: statut }))
    },
    {
      key: 'user.actif',
      label: 'Compte actif',
      type: 'select',
      options: [
        { label: 'Actif', value: true },
        { label: 'Inactif', value: false }
      ]
    },
    {
      key: 'numero_carte',
      label: 'Carte étudiant',
      type: 'select',
      options: [
        { label: 'Avec carte', value: 'assigned' },
        { label: 'Sans carte', value: 'unassigned' }
      ]
    },
    {
      key: 'created_at',
      label: 'Date inscription (depuis)',
      type: 'date'
    }
  ]

  // Actions sur les lignes
  const actions: DataTableAction<Etudiant>[] = [
    {
      label: 'Voir profil',
      icon: Eye,
      onClick: (etudiant) => {
        console.log('Voir profil:', etudiant.id)
        // Navigation vers le profil détaillé
      }
    },
    {
      label: 'Voir notes',
      icon: Eye,
      onClick: (etudiant) => {
        console.log('Voir notes:', etudiant.id)
        // Navigation vers les notes de l'étudiant
      }
    },
    ...(canManageUsers ? [
      {
        label: 'Modifier',
        icon: Edit,
        onClick: (etudiant: Etudiant) => {
          console.log('Modifier étudiant:', etudiant.id)
          // Ouvrir le formulaire de modification
        }
      },
      {
        label: etudiant => etudiant.user.actif ? 'Désactiver' : 'Activer',
        icon: (etudiant: Etudiant) => etudiant.user.actif ? UserX : UserCheck,
        onClick: (etudiant: Etudiant) => {
          const action = etudiant.user.actif ? 'désactiver' : 'activer'
          if (confirm(`Êtes-vous sûr de vouloir ${action} ce compte ?`)) {
            console.log(`${action} compte:`, etudiant.id)
            // API call pour activer/désactiver
          }
        }
      },
      {
        label: 'Supprimer',
        icon: Trash2,
        variant: 'destructive' as const,
        onClick: (etudiant: Etudiant) => {
          if (confirm(`Êtes-vous sûr de vouloir supprimer l'étudiant ${etudiant.nom_complet} ?`)) {
            console.log('Supprimer étudiant:', etudiant.id)
            // API call pour supprimer
          }
        }
      }
    ] : [])
  ]

  // Gestion de l'export
  const handleExport = (data: Etudiant[], selectedColumns: string[]) => {
    try {
      acadflowExports.exportEtudiants(data)
      notifySuccess('Export réussi', 'Les données ont été exportées avec succès')
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible d\'exporter les données')
    }
  }

  // Gestion de l'import
  const handleImport = async (file: File) => {
    try {
      const result = await acadflowImports.importEtudiants(file)
      
      if (result.errors.length > 0) {
        notifyError(
          'Erreurs d\'import',
          `${result.errors.length} erreur(s) détectée(s). ${result.summary.validRows} ligne(s) valide(s).`
        )
        console.log('Erreurs d\'import:', result.errors)
      } else {
        notifySuccess(
          'Import réussi',
          `${result.summary.validRows} étudiant(s) importé(s) avec succès`
        )
        // Recharger les données
        loadEtudiants()
      }
      
      setImportDialogOpen(false)
    } catch (error) {
      notifyError('Erreur d\'import', 'Impossible d\'importer le fichier')
    }
  }

  // Barre d'outils personnalisée
  const customToolbar = (
    <div className="flex items-center space-x-2">
      {canManageUsers && (
        <>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel étudiant
          </Button>
          
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import en lot
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Importer des étudiants</DialogTitle>
                <DialogDescription>
                  Importez une liste d'étudiants depuis un fichier CSV ou Excel.
                  Le fichier doit contenir les colonnes : Matricule, Prénom, Nom, Email.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground">
                  <p className="font-medium mb-2">Format requis :</p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Matricule (obligatoire)</li>
                    <li>Prénom (obligatoire)</li>
                    <li>Nom (obligatoire)</li>
                    <li>Email (optionnel mais recommandé)</li>
                    <li>Téléphone (optionnel)</li>
                    <li>Date de naissance (format DD/MM/YYYY)</li>
                    <li>Lieu de naissance (optionnel)</li>
                    <li>Adresse (optionnel)</li>
                  </ul>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Download className="mr-2 h-4 w-4" />
                    Télécharger modèle
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </div>
  )

  // Calcul des statistiques
  const stats = {
    total: etudiants.length,
    actifs: etudiants.filter(e => e.user.actif).length,
    avecCarte: etudiants.filter(e => e.numero_carte).length,
    parStatut: etudiants.reduce((acc, e) => {
      acc[e.statut_current] = (acc[e.statut_current] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête avec statistiques */}
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Gestion des Étudiants</h2>
          <p className="text-muted-foreground">
            Gérez les profils étudiants, inscriptions et informations personnelles
          </p>
        </div>

        {/* Cartes de statistiques */}
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Total étudiants</h3>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              {stats.actifs} comptes actifs
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Inscrits</h3>
              <UserCheck className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats.parStatut['inscrit'] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              statut inscrit
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Cartes attribuées</h3>
              <UserCheck className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.avecCarte}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.avecCarte / stats.total) * 100).toFixed(1)}% du total
            </p>
          </div>

          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="text-sm font-medium">Redoublants</h3>
              <UserX className="h-4 w-4 text-yellow-600" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">
              {stats.parStatut['redoublant'] || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              statut redoublant
            </p>
          </div>
        </div>
      </div>

      {/* Tableau des données */}
      <DataTable
        data={etudiants}
        columns={columns}
        filters={filters}
        actions={actions}
        loading={loading}
        title="Liste des étudiants"
        description={`${etudiants.length} étudiant(s) au total`}
        searchable={true}
        searchPlaceholder="Rechercher un étudiant (nom, matricule, email)..."
        selectable={true}
        exportable={true}
        importable={canManageUsers}
        onExport={handleExport}
        onImport={handleImport}
        onRefresh={loadEtudiants}
        customToolbar={customToolbar}
        emptyMessage="Aucun étudiant trouvé"
        className="w-full"
      />
    </div>
  )
}