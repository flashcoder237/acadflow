// src/pages/RapportsPage.tsx - Page de Rapports Avancés
import React, { useState, useEffect } from 'react'
import { 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Users, 
  Award, 
  Clock,
  Download,
  Eye,
  RefreshCw,
  Calendar,
  Filter
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DatePickerWithRange } from '@/components/ui/date-picker'
import { Progress } from '@/components/ui/progress'
import { useNotifications } from '@/components/ui/notification-system'

export const RapportsPage: React.FC = () => {
  const [selectedPeriode, setSelectedPeriode] = useState<string>('semestre_actuel')
  const [selectedNiveau, setSelectedNiveau] = useState<string>('tous')
  const [rapportsDisponibles, setRapportsDisponibles] = useState<any[]>([])
  const { notifySuccess, notifyError } = useNotifications()

  useEffect(() => {
    loadRapports()
  }, [selectedPeriode, selectedNiveau])

  const loadRapports = async () => {
    // Simulation de chargement des rapports
    setRapportsDisponibles([
      {
        id: 1,
        titre: 'Rapport de Performance Semestriel',
        description: 'Analyse complète des performances académiques du semestre',
        type: 'performance',
        periode: 'S1 2024',
        statut: 'disponible',
        taille: '2.3 MB',
        date_generation: '2024-01-15',
        pages: 25,
        graphiques: 12
      },
      {
        id: 2,
        titre: 'Analyse des Cohortes 2020-2024',
        description: 'Suivi longitudinal des cohortes d\'étudiants',
        type: 'cohorte',
        periode: '2020-2024',
        statut: 'en_cours',
        progression: 75,
        date_generation: null,
        pages: 45,
        graphiques: 20
      },
      {
        id: 3,
        titre: 'Indicateurs Institutionnels',
        description: 'Tableau de bord des indicateurs clés de performance',
        type: 'institutionnel',
        periode: 'Année 2024',
        statut: 'disponible',
        taille: '5.8 MB',
        date_generation: '2024-01-10',
        pages: 35,
        graphiques: 25
      }
    ])
  }

  const genererRapport = async (rapportId: number) => {
    try {
      // Simulation de génération
      notifySuccess('Génération démarrée', 'Le rapport sera disponible dans quelques minutes')
    } catch (error) {
      notifyError('Erreur', 'Impossible de générer le rapport')
    }
  }

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'disponible':
        return <Badge variant="success">Disponible</Badge>
      case 'en_cours':
        return <Badge variant="warning">En cours</Badge>
      case 'erreur':
        return <Badge variant="destructive">Erreur</Badge>
      default:
        return <Badge variant="secondary">Inconnu</Badge>
    }
  }

  const rapportsParType = {
    performance: [
      {
        nom: 'Performances Académiques',
        description: 'Analyse des résultats par niveau et filière',
        metriques: ['Moyennes', 'Taux de réussite', 'Classements', 'Évolutions'],
        frequence: 'Semestriel'
      },
      {
        nom: 'Efficacité Pédagogique',
        description: 'Évaluation de l\'efficacité des enseignements',
        metriques: ['Satisfaction', 'Acquisition compétences', 'Participation', 'Innovation'],
        frequence: 'Annuel'
      }
    ],
    cohorte: [
      {
        nom: 'Suivi Longitudinal',
        description: 'Parcours des étudiants sur plusieurs années',
        metriques: ['Progression', 'Redoublements', 'Abandons', 'Diplomation'],
        frequence: 'Annuel'
      },
      {
        nom: 'Analyse Prédictive',
        description: 'Prédictions de réussite et recommandations',
        metriques: ['Probabilités', 'Facteurs risque', 'Interventions', 'Résultats'],
        frequence: 'Trimestriel'
      }
    ],
    institutionnel: [
      {
        nom: 'Tableau de Bord Directorial',
        description: 'Vue d\'ensemble pour la direction',
        metriques: ['KPIs globaux', 'Comparaisons', 'Objectifs', 'Projections'],
        frequence: 'Mensuel'
      },
      {
        nom: 'Rapport d\'Activité',
        description: 'Bilan complet des activités institutionnelles',
        metriques: ['Effectifs', 'Ressources', 'Résultats', 'Perspectives'],
        frequence: 'Annuel'
      }
    ]
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Centre de Rapports</h2>
          <p className="text-muted-foreground">
            Générez et consultez vos rapports d'analyse institutionnelle
          </p>
        </div>

        {/* Filtres */}
        <div className="flex flex-wrap items-center gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Filtres :</span>
          </div>
          
          <Select value={selectedPeriode} onValueChange={setSelectedPeriode}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Période" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="semestre_actuel">Semestre actuel</SelectItem>
              <SelectItem value="annee_academique">Année académique</SelectItem>
              <SelectItem value="derniers_3_mois">3 derniers mois</SelectItem>
              <SelectItem value="personnalise">Période personnalisée</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedNiveau} onValueChange={setSelectedNiveau}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Niveau" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les niveaux</SelectItem>
              <SelectItem value="licence">Cycle Licence</SelectItem>
              <SelectItem value="master">Cycle Master</SelectItem>
              <SelectItem value="l1">Niveau L1</SelectItem>
              <SelectItem value="l2">Niveau L2</SelectItem>
              <SelectItem value="l3">Niveau L3</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser
          </Button>
        </div>
      </div>

      <Tabs defaultValue="disponibles" className="space-y-4">
        <TabsList>
          <TabsTrigger value="disponibles">Rapports Disponibles</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
          <TabsTrigger value="planifies">Planifiés</TabsTrigger>
          <TabsTrigger value="historique">Historique</TabsTrigger>
        </TabsList>

        <TabsContent value="disponibles" className="space-y-4">
          <div className="grid gap-4">
            {rapportsDisponibles.map((rapport) => (
              <Card key={rapport.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                        <FileText className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{rapport.titre}</CardTitle>
                        <CardDescription>{rapport.description}</CardDescription>
                      </div>
                    </div>
                    {getStatutBadge(rapport.statut)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-3">Informations générales</h5>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Période :</span>
                          <span>{rapport.periode}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Pages :</span>
                          <span>{rapport.pages}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Graphiques :</span>
                          <span>{rapport.graphiques}</span>
                        </div>
                        {rapport.taille && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Taille :</span>
                            <span>{rapport.taille}</span>
                          </div>
                        )}
                        {rapport.date_generation && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Généré le :</span>
                            <span>{new Date(rapport.date_generation).toLocaleDateString('fr-FR')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h5 className="font-medium mb-3">Actions</h5>
                      <div className="space-y-2">
                        {rapport.statut === 'disponible' ? (
                          <>
                            <Button className="w-full">
                              <Download className="h-4 w-4 mr-2" />
                              Télécharger PDF
                            </Button>
                            <Button variant="outline" className="w-full">
                              <Eye className="h-4 w-4 mr-2" />
                              Aperçu en ligne
                            </Button>
                          </>
                        ) : rapport.statut === 'en_cours' ? (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Génération en cours</span>
                              <span>{rapport.progression}%</span>
                            </div>
                            <Progress value={rapport.progression} className="h-2" />
                          </div>
                        ) : (
                          <Button onClick={() => genererRapport(rapport.id)} className="w-full">
                            <RefreshCw className="h-4 w-4 mr-2" />
                            Générer le rapport
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="space-y-6">
            {Object.entries(rapportsParType).map(([type, rapports]) => (
              <div key={type}>
                <h3 className="text-lg font-semibold mb-3 capitalize">
                  Rapports {type === 'performance' ? 'de Performance' : type === 'cohorte' ? 'de Cohorte' : 'Institutionnels'}
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {rapports.map((rapport, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-base">{rapport.nom}</CardTitle>
                        <CardDescription>{rapport.description}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <h6 className="text-sm font-medium mb-2">Métriques incluses</h6>
                          <div className="flex flex-wrap gap-1">
                            {rapport.metriques.map((metrique, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {metrique}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Fréquence :</span>
                          <span>{rapport.frequence}</span>
                        </div>
                        
                        <Button className="w-full">
                          <FileText className="h-4 w-4 mr-2" />
                          Générer ce rapport
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="planifies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rapports Planifiés</CardTitle>
              <CardDescription>
                Configuration des rapports automatiques
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  {
                    nom: 'Rapport Mensuel Direction',
                    frequence: 'Mensuel',
                    prochaine: '2024-02-01',
                    actif: true
                  },
                  {
                    nom: 'Statistiques Semestrielles',
                    frequence: 'Semestriel',
                    prochaine: '2024-07-01',
                    actif: true
                  },
                  {
                    nom: 'Bilan Annuel Complet',
                    frequence: 'Annuel',
                    prochaine: '2024-12-31',
                    actif: false
                  }
                ].map((planifie, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{planifie.nom}</div>
                      <div className="text-sm text-muted-foreground">
                        {planifie.frequence} • Prochaine génération : {new Date(planifie.prochaine).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={planifie.actif ? 'success' : 'secondary'}>
                        {planifie.actif ? 'Actif' : 'Inactif'}
                      </Badge>
                      <Button variant="outline" size="sm">
                        Configurer
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Générations</CardTitle>
              <CardDescription>
                Derniers rapports générés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    rapport: 'Performances S1 2024',
                    date: '2024-01-15',
                    taille: '2.3 MB',
                    telechargements: 45
                  },
                  {
                    rapport: 'Indicateurs Décembre 2023',
                    date: '2024-01-01',
                    taille: '1.8 MB',
                    telechargements: 23
                  },
                  {
                    rapport: 'Analyse Cohorte 2020-2023',
                    date: '2023-12-20',
                    taille: '4.2 MB',
                    telechargements: 67
                  }
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium">{item.rapport}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.taille} • {item.telechargements} téléchargements
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">
                        {new Date(item.date).toLocaleDateString('fr-FR')}
                      </span>
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
      </Tabs>
    </div>
  )
}