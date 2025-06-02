// src/pages/ExportsPage.tsx - Module d'Exportation Avancé
import React, { useState } from 'react'
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileImage, // Changed from FilePdf to FileImage (or you could use File)
  Calendar, 
  Filter, 
  Settings,
  Users,
  BarChart3,
  Award,
  Target,
  Clock,
  CheckCircle,
  Plus // Added Plus import that was missing
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Progress } from '@/components/ui/progress'
import { useNotifications } from '@/components/ui/notification-system'
import { usePermissions } from '../hooks/usePermissions'

export const ExportsPage: React.FC = () => {
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['pdf'])
  const [selectedSession, setSelectedSession] = useState<string>('current')
  const [selectedClasse, setSelectedClasse] = useState<string>('all')
  const [exportProgress, setExportProgress] = useState<{ [key: string]: number }>({})
  const { notifySuccess, notifyError } = useNotifications()
  const { canViewAllNotes, isEtudiant } = usePermissions()

  const exportTypes = [
    {
      id: 'releves_semestriels',
      title: 'Relevés Semestriels',
      description: 'Relevés de notes par semestre avec détail des UE et EC',
      icon: FileText,
      formats: ['PDF', 'Excel'],
      scope: 'individual',
      estimated_time: '2-5 min',
      available_for: ['etudiant', 'admin', 'scolarite']
    },
    {
      id: 'releves_annuels',
      title: 'Relevés Annuels Consolidés',
      description: 'Bilan complet de l\'année académique avec moyennes et crédits',
      icon: Award,
      formats: ['PDF', 'Excel', 'XML'],
      scope: 'individual',
      estimated_time: '3-7 min',
      available_for: ['etudiant', 'admin', 'scolarite']
    },
    {
      id: 'proces_verbaux',
      title: 'Procès-Verbaux de Jury',
      description: 'Documents officiels de délibération avec signatures',
      icon: FileImage, // Changed from FilePdf
      formats: ['PDF'],
      scope: 'class',
      estimated_time: '5-10 min',
      available_for: ['admin', 'scolarite', 'direction']
    },
    {
      id: 'tableaux_notes',
      title: 'Tableaux de Notes Classes',
      description: 'Vue complète des notes par classe et matière',
      icon: FileSpreadsheet,
      formats: ['Excel', 'CSV'],
      scope: 'class',
      estimated_time: '3-8 min',
      available_for: ['admin', 'scolarite', 'enseignant']
    },
    {
      id: 'statistiques_pedagogiques',
      title: 'Rapports Statistiques',
      description: 'Analyses de performance et indicateurs pédagogiques',
      icon: BarChart3,
      formats: ['PDF', 'Excel'],
      scope: 'institutional',
      estimated_time: '5-15 min',
      available_for: ['admin', 'scolarite', 'direction']
    },
    {
      id: 'listes_deliberation',
      title: 'Listes de Délibération',
      description: 'Listes des candidats avec toutes les données pour jury',
      icon: Users,
      formats: ['PDF', 'Excel'],
      scope: 'class',
      estimated_time: '2-5 min',
      available_for: ['admin', 'scolarite', 'direction']
    }
  ]

  const handleExport = async (exportType: any) => {
    try {
      setExportProgress(prev => ({ ...prev, [exportType.id]: 0 }))
      
      // Simulation de progression
      const interval = setInterval(() => {
        setExportProgress(prev => {
          const current = prev[exportType.id] || 0
          if (current >= 100) {
            clearInterval(interval)
            return prev
          }
          return { ...prev, [exportType.id]: current + 10 }
        })
      }, 300)

      // Simulation d'export
      setTimeout(() => {
        clearInterval(interval)
        setExportProgress(prev => ({ ...prev, [exportType.id]: 100 }))
        notifySuccess(
          'Export terminé',
          `${exportType.title} généré avec succès`
        )
        
        // Reset après 2 secondes
        setTimeout(() => {
          setExportProgress(prev => {
            const newState = { ...prev }
            delete newState[exportType.id]
            return newState
          })
        }, 2000)
      }, 3000)
      
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible de générer le document')
    }
  }

  const getFormatIcon = (format: string) => {
    switch (format.toLowerCase()) {
      case 'pdf': return FileImage // Changed from FilePdf
      case 'excel': return FileSpreadsheet
      case 'csv': return FileSpreadsheet
      case 'xml': return FileText
      default: return FileText
    }
  }

  const getScopeLabel = (scope: string) => {
    switch (scope) {
      case 'individual': return 'Individuel'
      case 'class': return 'Classe'
      case 'institutional': return 'Institutionnel'
      default: return scope
    }
  }

  const getScopeBadgeVariant = (scope: string) => {
    switch (scope) {
      case 'individual': return 'default' // Changed from 'success' as it might not exist
      case 'class': return 'secondary'    // Changed from 'warning'
      case 'institutional': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Centre d'Exportation</h2>
          <p className="text-muted-foreground">
            Générez vos relevés, rapports et documents officiels
          </p>
        </div>

        {/* Filtres globaux */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtres :</span>
          </div>
          
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Session courante</SelectItem>
              <SelectItem value="session1">Session 1</SelectItem>
              <SelectItem value="session2">Session 2</SelectItem>
            </SelectContent>
          </Select>

          {!isEtudiant && (
            <Select value={selectedClasse} onValueChange={setSelectedClasse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Classe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les classes</SelectItem>
                <SelectItem value="l1-info">L1 Informatique</SelectItem>
                <SelectItem value="l2-info">L2 Informatique</SelectItem>
                <SelectItem value="l3-info">L3 Informatique</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs defaultValue="documents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
          <TabsTrigger value="planifies">Exports planifiés</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {exportTypes.map((exportType) => {
              const isInProgress = exportProgress[exportType.id] !== undefined
              const progress = exportProgress[exportType.id] || 0
              const isCompleted = progress === 100
              const IconComponent = exportType.icon

              return (
                <Card key={exportType.id} className="relative">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{exportType.title}</CardTitle>
                          <CardDescription>{exportType.description}</CardDescription>
                        </div>
                      </div>
                      <Badge variant={getScopeBadgeVariant(exportType.scope)}>
                        {getScopeLabel(exportType.scope)}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Formats disponibles */}
                    <div>
                      <h5 className="text-sm font-medium mb-2">Formats disponibles</h5>
                      <div className="flex flex-wrap gap-2">
                        {exportType.formats.map((format) => {
                          const FormatIcon = getFormatIcon(format)
                          return (
                            <div key={format} className="flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs">
                              <FormatIcon className="h-3 w-3" />
                              <span>{format}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>

                    {/* Informations */}
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Clock className="h-4 w-4" />
                        <span>Temps estimé: {exportType.estimated_time}</span>
                      </div>
                    </div>

                    {/* Progression si en cours */}
                    {isInProgress && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Génération en cours...</span>
                          <span>{progress}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <Button 
                        onClick={() => handleExport(exportType)}
                        disabled={isInProgress}
                        className="flex-1"
                      >
                        {isInProgress ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                            Génération...
                          </>
                        ) : isCompleted ? (
                          <>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Terminé
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Générer
                          </>
                        )}
                      </Button>
                      
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Exports</CardTitle>
              <CardDescription>
                Derniers documents générés et téléchargés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    document: 'Relevé Semestriel S1 2024',
                    format: 'PDF',
                    date: '2024-01-15',
                    size: '2.3 MB',
                    status: 'Téléchargé'
                  },
                  {
                    document: 'Tableau Notes L3 Info',
                    format: 'Excel',
                    date: '2024-01-12',
                    size: '1.8 MB',
                    status: 'Généré'
                  },
                  {
                    document: 'Rapport Statistiques',
                    format: 'PDF',
                    date: '2024-01-10',
                    size: '5.2 MB',
                    status: 'Téléchargé'
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
                        <FileText className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <div className="font-medium">{item.document}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.format} • {item.size} • {new Date(item.date).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={item.status === 'Téléchargé' ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="planifies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Exports Automatiques</CardTitle>
              <CardDescription>
                Configurez des exports récurrents et planifiés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Relevés Semestriels Automatiques</h4>
                      <p className="text-sm text-muted-foreground">
                        Génération automatique en fin de semestre
                      </p>
                    </div>
                    <Badge variant="default">Actif</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Prochaine exécution: 31 janvier 2024 à 23:00
                  </div>
                </div>

                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="font-medium">Rapports Statistiques Mensuels</h4>
                      <p className="text-sm text-muted-foreground">
                        Statistiques pédagogiques pour la direction
                      </p>
                    </div>
                    <Badge variant="secondary">Suspendu</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Dernière exécution: 1er janvier 2024
                  </div>
                </div>

                <Button className="w-full">
                  <Plus className="mr-2 h-4 w-4" />
                  Configurer nouvel export automatique
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}