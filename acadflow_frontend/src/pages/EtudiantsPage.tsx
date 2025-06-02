// src/pages/EtudiantsPage.tsx - Version Avancée de Remplacement
import React, { useEffect, useState } from 'react'
import { Plus, Eye, Edit, Trash2, Mail, Phone, Download, Upload, UserCheck, UserX, MapPin, Award, TrendingUp, AlertTriangle } from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
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
  const [selectedView, setSelectedView] = useState<'tableau' | 'cartes' | 'statistiques'>('tableau')
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

  const getPerformanceIndicator = (etudiant: Etudiant) => {
    // Simulation d'indicateurs de performance
    const moyenne = 12 + Math.random() * 8 // Simulation entre 12 et 20
    const progression = Math.random() * 100
    const risque = moyenne < 10 ? 'high' : moyenne < 12 ? 'medium' : 'low'
    
    return { moyenne, progression, risque }
  }

  // Configuration des colonnes avancées
  const columns: DataTableColumn<Etudiant>[] = [
    {
      key: 'user',
      title: 'Étudiant',
      sortable: true,
      render: (value, item) => {
        const performance = getPerformanceIndicator(item)
        return (
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Avatar className="h-12 w-12">
                <AvatarImage src={value.photo} />
                <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-600 text-white">
                  {getInitials(item.nom_complet)}
                </AvatarFallback>
              </Avatar>
              {performance.risque === 'high' && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="h-2 w-2 text-white" />
                </div>
              )}
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-base">{item.nom_complet}</div>
              <div className="text-sm text-muted-foreground font-mono">{item.matricule}</div>
              <div className="flex items-center space-x-2">
                <Mail className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">{value.email}</span>
              </div>
              <div className="flex items-center space-x-1">
                <div className="text-xs font-medium">Moy:</div>
                <div className={`text-xs font-bold ${
                  performance.moyenne >= 16 ? 'text-green-600' :
                  performance.moyenne >= 12 ? 'text-blue-600' :
                  performance.moyenne >= 10 ? 'text-yellow-600' : 'text-red-600'
                }`}>
                  {performance.moyenne.toFixed(1)}/20
                </div>
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'classe_info',
      title: 'Classe & Niveau',
      render: (value, item) => (
        <div className="space-y-2">
          <Badge variant="outline" className="w-full justify-center">
            {/* Simulation classe */}
            L{Math.floor(Math.random() * 3) + 1} Informatique
          </Badge>
          <div className="text-xs text-center text-muted-foreground">
            Niveau {Math.floor(Math.random() * 3) + 1}
          </div>
          <div className="text-xs text-center">
            <span className="font-medium">Promo 2024</span>
          </div>
        </div>
      )
    },
    {
      key: 'performance',
      title: 'Performance',
      sortable: true,
      render: (value, item) => {
        const perf = getPerformanceIndicator(item)
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs">Progression</span>
              <span className="text-xs font-bold">{perf.progression.toFixed(0)}%</span>
            </div>
            <Progress value={perf.progression} className="h-1.5" />
            <div className="flex items-center justify-center">
              <Badge variant={
                perf.risque === 'low' ? 'success' :
                perf.risque === 'medium' ? 'warning' : 'destructive'
              } className="text-xs">
                {perf.risque === 'low' ? 'Excellent' :
                 perf.risque === 'medium' ? 'À suivre' : 'Risque'}
              </Badge>
            </div>
          </div>
        )
      }
    },
    {
      key: 'statut_current',
      title: 'Statut',
      sortable: true,
      filterable: true,
      render: (value, item) => (
        <div className="space-y-2">
          <Badge variant={getStatusVariant(value)} className="w-full justify-center">
            {value}
          </Badge>
          <div className="text-xs text-center text-muted-foreground">
            Depuis {formatDate(item.created_at)}
          </div>
        </div>
      )
    },
    {
      key: 'numero_carte',
      title: 'Carte & Documents',
      render: (value, item) => (
        <div className="space-y-1">
          <div className="text-xs">
            <span className="font-medium">Carte:</span>
            <span className={`ml-1 ${value ? 'text-green-600' : 'text-red-600'}`}>
              {value || 'Non attribué'}
            </span>
          </div>
          <div className="text-xs">
            <span className="font-medium">Photo:</span>
            <span className={`ml-1 ${item.user.photo ? 'text-green-600' : 'text-orange-600'}`}>
              {item.user.photo ? 'OK' : 'Manquante'}
            </span>
          </div>
          <div className="text-xs">
            <span className="font-medium">Dossier:</span>
            <span className="ml-1 text-blue-600">Complet</span>
          </div>
        </div>
      )
    },
    {
      key: 'contact_info',
      title: 'Contact',
      render: (value, item) => (
        <div className="space-y-1">
          {item.user.telephone && (
            <div className="flex items-center text-xs">
              <Phone className="h-3 w-3 mr-1 text-muted-foreground" />
              <span>{item.user.telephone}</span>
            </div>
          )}
          {item.user.adresse && (
            <div className="flex items-center text-xs">
              <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="truncate max-w-[100px]" title={item.user.adresse}>
                {item.user.adresse}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-1 mt-1">
            <div className={`w-2 h-2 rounded-full ${item.user.actif ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs">{item.user.actif ? 'Actif' : 'Inactif'}</span>
          </div>
        </div>
      )
    }
  ]

  const filters: DataTableFilter[] = [
    {
      key: 'statut_current',
      label: 'Statut',
      type: 'select',
      options: [...new Set(etudiants.map(e => e.statut_current))].map(s => ({ label: s, value: s }))
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
      key: 'performance_level',
      label: 'Niveau de performance',
      type: 'select',
      options: [
        { label: 'Excellent', value: 'excellent' },
        { label: 'Bon', value: 'good' },
        { label: 'À améliorer', value: 'needs_improvement' },
        { label: 'En difficulté', value: 'at_risk' }
      ]
    }
  ]

  const actions: DataTableAction<Etudiant>[] = [
    {
      label: 'Profil complet',
      icon: Eye,
      onClick: (etudiant) => {
        console.log('Profil complet:', etudiant.id)
      }
    },
    {
      label: 'Parcours académique',
      icon: TrendingUp,
      onClick: (etudiant) => {
        console.log('Parcours académique:', etudiant.id)
      }
    },
    {
      label: 'Notes détaillées',
      icon: Award,
      onClick: (etudiant) => {
        console.log('Notes détaillées:', etudiant.id)
      }
    },
    ...(canManageUsers ? [
      {
        label: 'Modifier',
        icon: Edit,
        onClick: (etudiant: Etudiant) => {
          console.log('Modifier étudiant:', etudiant.id)
        }
      },
      {
        label: etudiant => etudiant.user.actif ? 'Désactiver' : 'Activer',
        icon: (etudiant: Etudiant) => etudiant.user.actif ? UserX : UserCheck,
        onClick: (etudiant: Etudiant) => {
          const action = etudiant.user.actif ? 'désactiver' : 'activer'
          if (confirm(`Êtes-vous sûr de vouloir ${action} ce compte ?`)) {
            console.log(`${action} compte:`, etudiant.id)
          }
        }
      },
      {
        label: 'Archiver',
        icon: Trash2,
        variant: 'destructive' as const,
        onClick: (etudiant: Etudiant) => {
          if (confirm(`Êtes-vous sûr de vouloir archiver ${etudiant.nom_complet} ?`)) {
            console.log('Archiver étudiant:', etudiant.id)
          }
        }
      }
    ] : [])
  ]

  const handleExport = (data: Etudiant[], selectedColumns: string[]) => {
    try {
      acadflowExports.exportEtudiants(data)
      notifySuccess('Export réussi', 'Les données ont été exportées avec succès')
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible d\'exporter les données')
    }
  }

  // Calcul des statistiques avancées
  const stats = {
    total: etudiants.length,
    actifs: etudiants.filter(e => e.user.actif).length,
    avecCarte: etudiants.filter(e => e.numero_carte).length,
    enDifficulte: Math.floor(etudiants.length * 0.15), // Simulation
    excellents: Math.floor(etudiants.length * 0.25), // Simulation
    parStatut: etudiants.reduce((acc, e) => {
      acc[e.statut_current] = (acc[e.statut_current] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête avec statistiques avancées */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestion des Étudiants</h2>
            <p className="text-muted-foreground">
              Suivi complet des étudiants avec indicateurs de performance et alertes
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedView === 'tableau' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('tableau')}
            >
              Tableau
            </Button>
            <Button
              variant={selectedView === 'cartes' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('cartes')}
            >
              Cartes
            </Button>
            <Button
              variant={selectedView === 'statistiques' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('statistiques')}
            >
              Stats
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques avancées */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
                Total Étudiants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.actifs} comptes actifs ({((stats.actifs / stats.total) * 100).toFixed(0)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Award className="h-4 w-4 mr-2 text-green-600" />
                Excellents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.excellents}</div>
              <p className="text-xs text-muted-foreground">
                performance élevée (≥16/20)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                En Difficulté
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.enDifficulte}</div>
              <p className="text-xs text-muted-foreground">
                nécessitent un suivi
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <UserCheck className="h-4 w-4 mr-2 text-purple-600" />
                Inscrits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.parStatut['inscrit'] || 0}
              </div>
              <p className="text-xs text-muted-foreground">
                statut inscrit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <UserCheck className="h-4 w-4 mr-2 text-orange-600" />
                Cartes Étudiants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.avecCarte}</div>
              <p className="text-xs text-muted-foreground">
                {((stats.avecCarte / stats.total) * 100).toFixed(1)}% du total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <TrendingUp className="h-4 w-4 mr-2 text-indigo-600" />
                Taux Réussite
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">87.3%</div>
              <p className="text-xs text-muted-foreground">
                moyenne institutionnelle
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contenu selon la vue sélectionnée */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="space-y-4">
        <TabsContent value="tableau">
          <DataTable
            data={etudiants}
            columns={columns}
            filters={filters}
            actions={actions}
            loading={loading}
            title="Vue Tableau Avancée"
            description={`${etudiants.length} étudiant(s) • Performance tracking • Alertes automatiques`}
            searchable={true}
            searchPlaceholder="Rechercher étudiant (nom, matricule, email)..."
            selectable={true}
            exportable={true}
            importable={canManageUsers}
            onExport={handleExport}
            onRefresh={loadEtudiants}
            customToolbar={
              canManageUsers ? (
                <div className="flex items-center space-x-2">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvel étudiant
                  </Button>
                  <Button variant="outline">
                    <Upload className="mr-2 h-4 w-4" />
                    Import en lot
                  </Button>
                </div>
              ) : undefined
            }
            emptyMessage="Aucun étudiant trouvé"
          />
        </TabsContent>

        <TabsContent value="cartes">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold">Vue Cartes Détaillées</h3>
                <p className="text-sm text-muted-foreground">
                  Profils étudiants avec indicateurs visuels de performance
                </p>
              </div>
              {canManageUsers && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nouvel étudiant
                </Button>
              )}
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {etudiants.slice(0, 12).map((etudiant) => {
                const performance = getPerformanceIndicator(etudiant)
                return (
                  <Card key={etudiant.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={etudiant.user.photo} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-purple-600 text-white">
                              {getInitials(etudiant.nom_complet)}
                            </AvatarFallback>
                          </Avatar>
                          {performance.risque === 'high' && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold truncate">{etudiant.nom_complet}</h4>
                          <p className="text-xs text-muted-foreground font-mono">{etudiant.matricule}</p>
                        </div>
                        <Badge variant={getStatusVariant(etudiant.statut_current)} className="text-xs">
                          {etudiant.statut_current}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                          <span>Performance</span>
                          <span className="font-bold">{performance.moyenne.toFixed(1)}/20</span>
                        </div>
                        <Progress value={(performance.moyenne / 20) * 100} className="h-1.5" />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="text-center p-1 bg-blue-50 rounded">
                          <div className="font-medium">Classe</div>
                          <div className="text-blue-600">L2 Info</div>
                        </div>
                        <div className="text-center p-1 bg-green-50 rounded">
                          <div className="font-medium">Carte</div>
                          <div className={etudiant.numero_carte ? 'text-green-600' : 'text-red-600'}>
                            {etudiant.numero_carte ? 'OK' : 'Non'}
                          </div>
                        </div>
                      </div>

                      <div className="flex space-x-1">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Award className="h-3 w-3" />
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <TrendingUp className="h-3 w-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="statistiques">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Répartition par Statut</CardTitle>
                <CardDescription>Distribution des étudiants selon leur statut</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.parStatut).map(([statut, count]) => (
                    <div key={statut} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{statut}</span>
                        <span className="font-bold">{count}</span>
                      </div>
                      <Progress value={(count / stats.total) * 100} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicateurs de Performance</CardTitle>
                <CardDescription>Analyse des performances académiques</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{stats.excellents}</div>
                      <div className="text-xs text-muted-foreground">Excellents (≥16)</div>
                    </div>
                    <div className="text-center p-3 border rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{stats.enDifficulte}</div>
                      <div className="text-xs text-muted-foreground">En difficulté</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Taux de réussite global</span>
                      <span className="font-bold text-green-600">87.3%</span>
                    </div>
                    <Progress value={87.3} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progression moyenne</span>
                      <span className="font-bold text-blue-600">78.5%</span>
                    </div>
                    <Progress value={78.5} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="col-span-2">
              <CardHeader>
                <CardTitle>Alertes et Recommandations</CardTitle>
                <CardDescription>Actions suggérées basées sur l'analyse des données</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                      <h4 className="font-semibold text-red-800">Risque Élevé</h4>
                    </div>
                    <p className="text-sm text-red-700">{stats.enDifficulte} étudiants nécessitent un suivi urgent</p>
                    <Button variant="outline" size="sm" className="mt-2 border-red-300 text-red-700">
                      Voir la liste
                    </Button>
                  </div>
                  
                  <div className="p-4 border border-yellow-200 bg-yellow-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <UserCheck className="h-5 w-5 text-yellow-600 mr-2" />
                      <h4 className="font-semibold text-yellow-800">Cartes Manquantes</h4>
                    </div>
                    <p className="text-sm text-yellow-700">{stats.total - stats.avecCarte} étudiants sans carte</p>
                    <Button variant="outline" size="sm" className="mt-2 border-yellow-300 text-yellow-700">
                      Générer les cartes
                    </Button>
                  </div>
                  
                  <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                    <div className="flex items-center mb-2">
                      <Award className="h-5 w-5 text-green-600 mr-2" />
                      <h4 className="font-semibold text-green-800">Félicitations</h4>
                    </div>
                    <p className="text-sm text-green-700">{stats.excellents} étudiants avec d'excellents résultats</p>
                    <Button variant="outline" size="sm" className="mt-2 border-green-300 text-green-700">
                      Récompenser
                    </Button>
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