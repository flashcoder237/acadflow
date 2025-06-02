// src/pages/MultiniveauPage.tsx - Gestion Multi-niveaux Avancée
import React, { useEffect, useState } from 'react'
import { 
  Layers, 
  ArrowRight, 
  Users, 
  BookOpen, 
  Target, 
  Award,
  TrendingUp,
  Plus,
  Eye,
  Settings
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useApi } from '../hooks/useApi'
import { useNotifications } from '@/components/ui/notification-system'
import { coreApi } from '../lib/api'

export const MultiniveauPage: React.FC = () => {
  const [selectedCycle, setSelectedCycle] = useState<string>('licence')
  const [niveaux, setNiveaux] = useState<any[]>([])
  const [cycles, setCycles] = useState<any[]>([])
  const { notifyError } = useNotifications()
  const { execute: fetchNiveaux, loading } = useApi()

  useEffect(() => {
    loadData()
  }, [selectedCycle])

  const loadData = async () => {
    try {
      // Simulation de données multi-niveaux
      setNiveaux([
        {
          id: 1,
          nom: 'L1',
          numero: 1,
          cycle: 'Licence',
          credits_requis: 60,
          effectif: 245,
          taux_reussite: 72.5,
          moyenne_generale: 12.3,
          ues_count: 8
        },
        {
          id: 2,
          nom: 'L2',
          numero: 2,
          cycle: 'Licence',
          credits_requis: 60,
          effectif: 198,
          taux_reussite: 78.9,
          moyenne_generale: 13.1,
          ues_count: 8
        },
        {
          id: 3,
          nom: 'L3',
          numero: 3,
          cycle: 'Licence',
          credits_requis: 60,
          effectif: 156,
          taux_reussite: 85.2,
          moyenne_generale: 14.2,
          ues_count: 8
        }
      ])
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les données multi-niveaux')
    }
  }

  const transitions = [
    {
      from: 'L1',
      to: 'L2',
      conditions: ['Moyenne ≥ 10/20', '60 crédits validés', 'Aucune dette'],
      taux_passage: 78.5,
      candidats: 245,
      admis: 192
    },
    {
      from: 'L2',
      to: 'L3',
      conditions: ['Moyenne ≥ 10/20', '120 crédits cumulés', 'Stage validé'],
      taux_passage: 85.2,
      candidats: 198,
      admis: 169
    },
    {
      from: 'L3',
      to: 'M1',
      conditions: ['Licence obtenue', 'Moyenne ≥ 12/20', 'Dossier accepté'],
      taux_passage: 65.8,
      candidats: 156,
      admis: 103
    }
  ]

  const passerelles = [
    {
      from: 'L2 Mathématiques',
      to: 'L2 Informatique',
      conditions: ['Modules communs validés', 'Test d\'aptitude'],
      demandes: 12,
      acceptees: 8
    },
    {
      from: 'L3 Informatique',
      to: 'L3 Mathématiques-Info',
      conditions: ['Parcours mixte', 'Accord pédagogique'],
      demandes: 5,
      acceptees: 4
    }
  ]

  return (
    <div className="flex-1 space-y-6 p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Gestion Multi-Niveaux</h2>
            <p className="text-muted-foreground">
              Suivi des progressions, transitions et passerelles entre niveaux
            </p>
          </div>

          <Select value={selectedCycle} onValueChange={setSelectedCycle}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sélectionner un cycle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="licence">Cycle Licence</SelectItem>
              <SelectItem value="master">Cycle Master</SelectItem>
              <SelectItem value="doctorat">Cycle Doctorat</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vue d'ensemble des niveaux */}
        <div className="grid gap-4 md:grid-cols-3">
          {niveaux.map((niveau) => (
            <Card key={niveau.id} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-bl-full" />
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center space-x-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">{niveau.nom}</span>
                    </div>
                    <span>Niveau {niveau.nom}</span>
                  </CardTitle>
                  <Badge variant="outline">{niveau.cycle}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-muted-foreground">Effectif</div>
                    <div className="text-lg font-bold text-green-600">{niveau.effectif}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">UEs</div>
                    <div className="text-lg font-bold text-blue-600">{niveau.ues_count}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Moyenne</div>
                    <div className="text-lg font-bold">{niveau.moyenne_generale}/20</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Réussite</div>
                    <div className="text-lg font-bold text-purple-600">{niveau.taux_reussite}%</div>
                  </div>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Progression</span>
                    <span>{niveau.taux_reussite}%</span>
                  </div>
                  <Progress value={niveau.taux_reussite} className="h-2" />
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Eye className="h-3 w-3 mr-1" />
                    Détails
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1">
                    <Users className="h-3 w-3 mr-1" />
                    Étudiants
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Tabs defaultValue="transitions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="transitions">Transitions</TabsTrigger>
          <TabsTrigger value="passerelles">Passerelles</TabsTrigger>
          <TabsTrigger value="prerequis">Prérequis</TabsTrigger>
          <TabsTrigger value="statistiques">Statistiques</TabsTrigger>
        </TabsList>

        <TabsContent value="transitions" className="space-y-4">
          <div className="space-y-4">
            {transitions.map((transition, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-2">
                      <span>Passage {transition.from}</span>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                      <span>{transition.to}</span>
                    </CardTitle>
                    <Badge 
                      variant={transition.taux_passage >= 80 ? 'success' : transition.taux_passage >= 70 ? 'warning' : 'destructive'}
                    >
                      {transition.taux_passage}% de réussite
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h5 className="font-medium mb-3">Conditions de passage</h5>
                      <div className="space-y-2">
                        {transition.conditions.map((condition, idx) => (
                          <div key={idx} className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <span>{condition}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h5 className="font-medium mb-3">Statistiques de passage</h5>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Candidats</span>
                          <span className="font-medium">{transition.candidats}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Admis</span>
                          <span className="font-medium text-green-600">{transition.admis}</span>
                        </div>
                        <div className="space-y-1">
                          <Progress value={transition.taux_passage} className="h-2" />
                          <div className="text-xs text-center text-muted-foreground">
                            Taux de passage: {transition.taux_passage}%
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="passerelles" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2" />
                Passerelles Inter-Filières
              </CardTitle>
              <CardDescription>
                Transitions entre filières et parcours personnalisés
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {passerelles.map((passerelle, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{passerelle.from}</span>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{passerelle.to}</span>
                      </div>
                      <Badge variant="outline">
                        {passerelle.acceptees}/{passerelle.demandes} acceptées
                      </Badge>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h6 className="text-sm font-medium mb-2">Conditions requises</h6>
                        <div className="space-y-1">
                          {passerelle.conditions.map((condition, idx) => (
                            <div key={idx} className="text-sm text-muted-foreground">
                              • {condition}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <h6 className="text-sm font-medium mb-2">Statistiques</h6>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Demandes reçues</span>
                            <span>{passerelle.demandes}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Taux d'acceptation</span>
                            <span className="text-green-600">
                              {((passerelle.acceptees / passerelle.demandes) * 100).toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                <Button className="w-full" variant="outline">
                  <Plus className="mr-2 h-4 w-4" />
                  Configurer nouvelle passerelle
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prerequis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Gestion des Prérequis
              </CardTitle>
              <CardDescription>
                Définition et validation des prérequis par niveau et UE
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Prérequis par niveau */}
                <div>
                  <h4 className="font-medium mb-3">Prérequis par Niveau</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Niveau L2</h5>
                        <Badge variant="success">Automatisé</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• Validation complète du niveau L1</div>
                        <div>• Minimum 60 crédits ECTS</div>
                        <div>• Moyenne générale ≥ 10/20</div>
                        <div>• Aucune dette pédagogique</div>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Niveau L3</h5>
                        <Badge variant="success">Automatisé</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• Validation des niveaux L1 et L2</div>
                        <div>• Minimum 120 crédits ECTS cumulés</div>
                        <div>• Stage de L2 validé</div>
                        <div>• Projet tutoré validé</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Prérequis par UE */}
                <div>
                  <h4 className="font-medium mb-3">Prérequis par UE</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Algorithmique Avancée (L2)</h5>
                        <Badge variant="warning">Conditionnel</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• UE "Introduction à l'Algorithmique" validée</div>
                        <div>• UE "Programmation 1" validée</div>
                        <div>• Note minimale de 12/20 en Mathématiques</div>
                      </div>
                    </div>

                    <div className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Bases de Données Avancées (L3)</h5>
                        <Badge variant="warning">Conditionnel</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div>• UE "Introduction aux BD" validée</div>
                        <div>• UE "SQL et Modélisation" validée</div>
                        <div>• Projet BD de L2 soutenu</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button className="w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurer nouveaux prérequis
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="statistiques" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Évolution des Effectifs
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {niveaux.map((niveau) => (
                    <div key={niveau.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{niveau.nom}</span>
                        <span className="font-medium">{niveau.effectif} étudiants</span>
                      </div>
                      <Progress value={(niveau.effectif / 300) * 100} className="h-2" />
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span>Total Cycle</span>
                      <span>{niveaux.reduce((sum, n) => sum + n.effectif, 0)} étudiants</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Award className="h-5 w-5 mr-2" />
                  Taux de Réussite par Niveau
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {niveaux.map((niveau) => (
                    <div key={niveau.id} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>{niveau.nom}</span>
                        <span className={`font-medium ${
                          niveau.taux_reussite >= 80 ? 'text-green-600' : 
                          niveau.taux_reussite >= 70 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {niveau.taux_reussite}%
                        </span>
                      </div>
                      <Progress value={niveau.taux_reussite} className="h-2" />
                    </div>
                  ))}
                  
                  <div className="pt-2 border-t">
                    <div className="flex justify-between font-medium">
                      <span>Moyenne Cycle</span>
                      <span className="text-green-600">
                        {(niveaux.reduce((sum, n) => sum + n.taux_reussite, 0) / niveaux.length).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Flux de Progression</CardTitle>
                <CardDescription>
                  Analyse des mouvements entre niveaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Passages normaux</span>
                    <span className="font-medium text-green-600">87.3%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Redoublements</span>
                    <span className="font-medium text-yellow-600">8.9%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Réorientations</span>
                    <span className="font-medium text-blue-600">2.1%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Abandons</span>
                    <span className="font-medium text-red-600">1.7%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Indicateurs Clés</CardTitle>
                <CardDescription>
                  Métriques importantes du cycle
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Durée moyenne des études</span>
                    <span className="font-medium">3.2 ans</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Taux de diplomation</span>
                    <span className="font-medium text-green-600">91.4%</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Satisfaction étudiante</span>
                    <span className="font-medium text-blue-600">8.3/10</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Insertion professionnelle</span>
                    <span className="font-medium text-purple-600">89.7%</span>
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