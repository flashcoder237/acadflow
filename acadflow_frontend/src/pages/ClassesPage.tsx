// src/pages/ClassesPage.tsx - Version Avancée de Remplacement
import React, { useEffect, useState } from 'react'
import { Plus, Users, Eye, Edit, Trash2, BookOpen, BarChart3, Settings, MapPin, Calendar, Award } from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useNotifications } from '@/components/ui/notification-system'
import { academicsApi } from '../lib/api'
import { Classe } from '../types/api'
import { acadflowExports } from '../lib/export-import'
import { formatDate } from '../lib/utils'

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Classe[]>([])
  const [selectedView, setSelectedView] = useState<'grid' | 'table'>('table')
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

  // Configuration des colonnes pour la vue tableau
  const columns: DataTableColumn<Classe>[] = [
    {
      key: 'nom',
      title: 'Classe',
      sortable: true,
      render: (value, item) => (
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
            {value.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-lg">{value}</div>
            <div className="text-sm text-muted-foreground">{item.code}</div>
            <div className="flex items-center mt-1 space-x-2">
              <Badge variant="outline" className="text-xs">
                {item.filiere_nom}
              </Badge>
              <Badge variant="secondary" className="text-xs">
                {item.niveau_nom}
              </Badge>
            </div>
          </div>
        </div>
      )
    },
    {
      key: 'effectif_actuel',
      title: 'Effectif',
      sortable: true,
      render: (value, item) => {
        const ratio = value / item.effectif_max
        const color = ratio >= 0.9 ? 'text-red-600' : ratio >= 0.7 ? 'text-yellow-600' : 'text-green-600'
        const bgColor = ratio >= 0.9 ? 'bg-red-100' : ratio >= 0.7 ? 'bg-yellow-100' : 'bg-green-100'
        
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-2xl font-bold ${color}`}>{value}</span>
              <span className="text-sm text-muted-foreground">/{item.effectif_max}</span>
            </div>
            <div className="space-y-1">
              <Progress value={(value / item.effectif_max) * 100} className="h-2" />
              <div className={`text-xs px-2 py-1 rounded-full ${bgColor} ${color} text-center`}>
                {((value / item.effectif_max) * 100).toFixed(0)}% occupé
              </div>
            </div>
          </div>
        )
      }
    },
    {
      key: 'annee_academique_libelle',
      title: 'Année académique',
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-blue-600" />
          <span className="font-medium">{value}</span>
        </div>
      )
    },
    {
      key: 'active',
      title: 'Statut',
      sortable: true,
      render: (value, item) => (
        <div className="space-y-2">
          <Badge variant={value ? 'success' : 'secondary'} className="w-full justify-center">
            {value ? 'Active' : 'Inactive'}
          </Badge>
          {value && (
            <div className="text-xs text-muted-foreground text-center">
              Depuis {formatDate(item.created_at)}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'programme_info',
      title: 'Programme',
      render: (value, item) => (
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <BookOpen className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium">8 UEs</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-green-600" />
            <span className="text-sm">180 ECTS</span>
          </div>
          <div className="text-xs text-muted-foreground">
            Semestre {item.niveau_nom.includes('1') ? '1 & 2' : item.niveau_nom.includes('2') ? '3 & 4' : '5 & 6'}
          </div>
        </div>
      )
    }
  ]

  const filters: DataTableFilter[] = [
    {
      key: 'filiere_nom',
      label: 'Filière',
      type: 'select',
      options: [...new Set(classes.map(c => c.filiere_nom))].map(f => ({ label: f, value: f }))
    },
    {
      key: 'niveau_nom',
      label: 'Niveau',
      type: 'select',
      options: [...new Set(classes.map(c => c.niveau_nom))].map(n => ({ label: n, value: n }))
    },
    {
      key: 'annee_academique_libelle',
      label: 'Année académique',
      type: 'select',
      options: [...new Set(classes.map(c => c.annee_academique_libelle))].map(a => ({ label: a, value: a }))
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

  const actions: DataTableAction<Classe>[] = [
    {
      label: 'Tableau de bord',
      icon: BarChart3,
      onClick: (classe) => {
        console.log('Tableau de bord classe:', classe.id)
      }
    },
    {
      label: 'Liste étudiants',
      icon: Users,
      onClick: (classe) => {
        console.log('Liste étudiants:', classe.id)
      }
    },
    {
      label: 'Programme pédagogique',
      icon: BookOpen,
      onClick: (classe) => {
        console.log('Programme:', classe.id)
      }
    },
    {
      label: 'Emploi du temps',
      icon: Calendar,
      onClick: (classe) => {
        console.log('Emploi du temps:', classe.id)
      }
    },
    {
      label: 'Localisation',
      icon: MapPin,
      onClick: (classe) => {
        console.log('Salles de classe:', classe.id)
      }
    },
    ...(canManageClasses ? [
      {
        label: 'Paramètres',
        icon: Settings,
        onClick: (classe: Classe) => {
          console.log('Paramètres classe:', classe.id)
        }
      },
      {
        label: 'Modifier',
        icon: Edit,
        onClick: (classe: Classe) => {
          console.log('Modifier classe:', classe.id)
        }
      },
      {
        label: 'Archiver',
        icon: Trash2,
        variant: 'destructive' as const,
        onClick: (classe: Classe) => {
          if (confirm(`Êtes-vous sûr de vouloir archiver la classe ${classe.nom} ?`)) {
            console.log('Archiver classe:', classe.id)
          }
        },
        disabled: (classe) => classe.effectif_actuel > 0
      }
    ] : [])
  ]

  const handleExport = (data: Classe[], selectedColumns: string[]) => {
    try {
      acadflowExports.exportClasses(data)
      notifySuccess('Export réussi', 'Les données ont été exportées avec succès')
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible d\'exporter les données')
    }
  }

  // Vue en grille pour les classes
  const ClassCard: React.FC<{ classe: Classe }> = ({ classe }) => (
    <Card className="hover:shadow-lg transition-shadow cursor-pointer">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
              {classe.nom.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <CardTitle className="text-lg">{classe.nom}</CardTitle>
              <p className="text-sm text-muted-foreground">{classe.code}</p>
            </div>
          </div>
          <Badge variant={classe.active ? 'success' : 'secondary'}>
            {classe.active ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Filière</p>
            <p className="font-medium">{classe.filiere_nom}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Niveau</p>
            <p className="font-medium">{classe.niveau_nom}</p>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span>Effectif</span>
            <span>{classe.effectif_actuel}/{classe.effectif_max}</span>
          </div>
          <Progress value={(classe.effectif_actuel / classe.effectif_max) * 100} className="h-2" />
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">{classe.annee_academique_libelle}</span>
          <div className="flex space-x-1">
            <Button variant="outline" size="sm">
              <Eye className="h-3 w-3" />
            </Button>
            <Button variant="outline" size="sm">
              <Users className="h-3 w-3" />
            </Button>
            {canManageClasses && (
              <Button variant="outline" size="sm">
                <Settings className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )

  // Calcul des statistiques avancées
  const stats = {
    total: classes.length,
    actives: classes.filter(c => c.active).length,
    effectifTotal: classes.reduce((sum, c) => sum + c.effectif_actuel, 0),
    effectifMax: classes.reduce((sum, c) => sum + c.effectif_max, 0),
    tauxOccupationMoyen: classes.length > 0 
      ? (classes.reduce((sum, c) => sum + (c.effectif_actuel / c.effectif_max), 0) / classes.length * 100)
      : 0,
    classesPleines: classes.filter(c => (c.effectif_actuel / c.effectif_max) >= 0.9).length,
    filieres: new Set(classes.map(c => c.filiere_nom)).size
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête avec statistiques avancées */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestion des Classes</h2>
            <p className="text-muted-foreground">
              Gérez les classes, effectifs et organisations pédagogiques avec vue d'ensemble complète
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant={selectedView === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('table')}
            >
              Vue Tableau
            </Button>
            <Button
              variant={selectedView === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('grid')}
            >
              Vue Grille
            </Button>
          </div>
        </div>

        {/* Cartes de statistiques avancées */}
        <div className="grid gap-4 md:grid-cols-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2 text-blue-600" />
                Total Classes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.actives} actives ({((stats.actives / stats.total) * 100).toFixed(0)}%)
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Users className="h-4 w-4 mr-2 text-green-600" />
                Effectif Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.effectifTotal}</div>
              <p className="text-xs text-muted-foreground">
                /{stats.effectifMax} places
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BarChart3 className="h-4 w-4 mr-2 text-purple-600" />
                Taux Occupation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.tauxOccupationMoyen.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                occupation moyenne
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Award className="h-4 w-4 mr-2 text-orange-600" />
                Classes Pleines
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{stats.classesPleines}</div>
              <p className="text-xs text-muted-foreground">
                ≥90% d'occupation
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <BookOpen className="h-4 w-4 mr-2 text-pink-600" />
                Filières
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{stats.filieres}</div>
              <p className="text-xs text-muted-foreground">
                filières actives
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                Capacité
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-indigo-600">
                {((stats.effectifTotal / stats.effectifMax) * 100).toFixed(0)}%
              </div>
              <p className="text-xs text-muted-foreground">
                utilisation globale
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Contenu principal avec vues multiples */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as 'grid' | 'table')} className="space-y-4">
        <TabsContent value="table" className="space-y-4">
          <DataTable
            data={classes}
            columns={columns}
            filters={filters}
            actions={actions}
            loading={loading}
            title="Vue Tableau Détaillée"
            description={`${classes.length} classe(s) • ${stats.effectifTotal} étudiants • ${stats.filieres} filières`}
            searchable={true}
            searchPlaceholder="Rechercher une classe (nom, code, filière)..."
            selectable={true}
            exportable={true}
            importable={canManageClasses}
            onExport={handleExport}
            onRefresh={loadClasses}
            customToolbar={
              canManageClasses ? (
                <div className="flex items-center space-x-2">
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle classe
                  </Button>
                  <Button variant="outline">
                    <Settings className="mr-2 h-4 w-4" />
                    Gestion en lot
                  </Button>
                </div>
              ) : undefined
            }
            emptyMessage="Aucune classe trouvée"
            className="w-full"
          />
        </TabsContent>

        <TabsContent value="grid" className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Vue Grille Interactive</h3>
              <p className="text-sm text-muted-foreground">
                Vue d'ensemble visuelle des classes avec actions rapides
              </p>
            </div>
            {canManageClasses && (
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nouvelle classe
              </Button>
            )}
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {classes.map((classe) => (
              <ClassCard key={classe.id} classe={classe} />
            ))}
          </div>
          
          {classes.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune classe trouvée</h3>
              <p className="text-muted-foreground mb-4">
                Commencez par créer votre première classe
              </p>
              {canManageClasses && (
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Créer une classe
                </Button>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

