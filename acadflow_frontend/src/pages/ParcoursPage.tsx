// src/pages/ParcoursPage.tsx - Gestion des Parcours Personnalisés
import React, { useEffect, useState } from 'react'
import { Plus, Route, Target, Award, TrendingUp, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useApi } from '../hooks/useApi'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '@/components/ui/notification-system'
import { usersApi } from '../lib/api'
import { ParcoursAcademique } from '../types/api'

export const ParcoursPage: React.FC = () => {
  const [parcours, setParcours] = useState<ParcoursAcademique | null>(null)
  const { user } = useAuth()
  const { notifyError } = useNotifications()
  const { execute: fetchParcours, loading } = useApi<ParcoursAcademique>()

  useEffect(() => {
    if (user?.etudiant_id) {
      loadParcours()
    }
  }, [user])

  const loadParcours = async () => {
    try {
      if (user?.etudiant_id) {
        const result = await fetchParcours(() => 
          usersApi.getEtudiantParcoursAcademique(user.etudiant_id!)
        )
        if (result) setParcours(result)
      }
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger le parcours académique')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid gap-4 md:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Mon Parcours Académique</h2>
        <p className="text-muted-foreground">
          Suivez votre progression, vos options et vos spécialisations
        </p>
      </div>

      {/* Vue d'ensemble du parcours */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <Route className="h-4 w-4 mr-2" />
              Classes fréquentées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {parcours?.statistiques.classes_frequentees || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              depuis le début des études
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <TrendingUp className="h-4 w-4 mr-2" />
              Années d'études
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {parcours?.statistiques.annees_etudes || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              durée totale du parcours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              <AlertCircle className="h-4 w-4 mr-2" />
              Redoublements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {parcours?.statistiques.nombre_redoublements || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              nombre de redoublements
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="chronologie" className="space-y-4">
        <TabsList>
          <TabsTrigger value="chronologie">Chronologie</TabsTrigger>
          <TabsTrigger value="inscriptions">Inscriptions</TabsTrigger>
          <TabsTrigger value="statuts">Historique des statuts</TabsTrigger>
          <TabsTrigger value="options">Options & Spécialisations</TabsTrigger>
        </TabsList>

        <TabsContent value="chronologie" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Progression Académique</CardTitle>
              <CardDescription>
                Chronologie de votre parcours depuis le début de vos études
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {parcours?.inscriptions.map((inscription, index) => (
                  <div key={inscription.id} className="flex items-start space-x-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${
                        inscription.active ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      {index < parcours.inscriptions.length - 1 && (
                        <div className="w-px h-12 bg-gray-200 mt-2" />
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{inscription.classe_nom}</h4>
                          <p className="text-sm text-muted-foreground">
                            Année académique {inscription.annee_academique}
                          </p>
                        </div>
                        <Badge variant={inscription.active ? 'success' : 'secondary'}>
                          {inscription.statut_nom}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Inscrit le {new Date(inscription.date_inscription).toLocaleDateString('fr-FR')}
                        {inscription.nombre_redoublements > 0 && (
                          <span className="ml-2 text-orange-600">
                            • {inscription.nombre_redoublements} redoublement(s)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inscriptions" className="space-y-4">
          <div className="grid gap-4">
            {parcours?.inscriptions.map((inscription) => (
              <Card key={inscription.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{inscription.classe_nom}</CardTitle>
                    <Badge variant={inscription.active ? 'success' : 'secondary'}>
                      {inscription.active ? 'Actuelle' : 'Terminée'}
                    </Badge>
                  </div>
                  <CardDescription>
                    Année académique {inscription.annee_academique} • 
                    Statut: {inscription.statut_nom}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h5 className="font-medium mb-2">Informations générales</h5>
                      <div className="space-y-1 text-sm">
                        <div>Date d'inscription: {new Date(inscription.date_inscription).toLocaleDateString('fr-FR')}</div>
                        <div>Redoublements: {inscription.nombre_redoublements}</div>
                        <div>Statut: {inscription.statut_nom}</div>
                      </div>
                    </div>
                    <div>
                      <h5 className="font-medium mb-2">Actions disponibles</h5>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          Voir les notes détaillées
                        </Button>
                        {inscription.active && (
                          <Button variant="outline" size="sm" className="w-full">
                            Relevé de notes actuel
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

        <TabsContent value="statuts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Changements de Statut</CardTitle>
              <CardDescription>
                Évolution de votre statut académique au fil du temps
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {parcours?.historique_statuts.map((historique, index) => (
                  <div key={historique.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        index === 0 ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div>
                        <div className="font-medium">{historique.statut_nom}</div>
                        <div className="text-sm text-muted-foreground">
                          {new Date(historique.date_changement).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        Année {historique.annee_academique}
                      </div>
                      {historique.motif && (
                        <div className="text-xs text-muted-foreground">
                          {historique.motif}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="options" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Options et Spécialisations</CardTitle>
              <CardDescription>
                Vos choix d'options et parcours de spécialisation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Options disponibles par niveau */}
                <div>
                  <h4 className="font-medium mb-3">Options disponibles</h4>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Intelligence Artificielle</h5>
                        <Badge variant="success">Choisie</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Spécialisation en IA et apprentissage automatique
                      </p>
                      <div className="space-y-1 text-xs">
                        <div>Niveau: M1-M2</div>
                        <div>Crédits: 60 ECTS</div>
                        <div>Durée: 2 semestres</div>
                      </div>
                    </div>

                    <div className="p-4 border rounded-lg opacity-60">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-medium">Cybersécurité</h5>
                        <Badge variant="outline">Disponible</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">
                        Sécurité informatique et protection des données
                      </p>
                      <div className="space-y-1 text-xs">
                        <div>Niveau: M1-M2</div>
                        <div>Crédits: 60 ECTS</div>
                        <div>Durée: 2 semestres</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Progression dans l'option choisie */}
                <div>
                  <h4 className="font-medium mb-3">Progression - Intelligence Artificielle</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Modules complétés</span>
                      <span className="text-sm">3/6</span>
                    </div>
                    <Progress value={50} className="h-2" />
                    
                    <div className="grid gap-2 md:grid-cols-3 text-sm">
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Fondements IA</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Machine Learning</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span>Deep Learning</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 border-2 border-blue-600 rounded-full" />
                        <span>Computer Vision</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                        <span>NLP</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                        <span>Projet Final</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recommandations */}
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium mb-2 flex items-center">
                    <Target className="h-4 w-4 mr-2 text-blue-600" />
                    Recommandations personnalisées
                  </h4>
                  <div className="space-y-2 text-sm text-blue-800">
                    <div>• Prioriser le module Computer Vision pour le semestre prochain</div>
                    <div>• Considérer un stage en entreprise spécialisée IA</div>
                    <div>• Participer aux concours de machine learning</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
