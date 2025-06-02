// src/pages/ConfigurationPage.tsx - Configuration Système Avancée
import React, { useState, useEffect } from 'react'
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Shield, 
  Database, 
  Mail, 
  FileText, 
  Users,
  Calendar,
  Palette,
  Globe,
  AlertTriangle
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { useNotifications } from '@/components/ui/notification-system'

export const ConfigurationPage: React.FC = () => {
  const [config, setConfig] = useState({
    institution: {
      nom: 'Université Virtuelle',
      sigle: 'UV',
      adresse: '123 Rue de l\'Education',
      telephone: '+237 XXX XXX XXX',
      email: 'contact@universite.edu',
      logo: '',
      devise: 'Excellence et Innovation'
    },
    academique: {
      annee_en_cours: '2023-2024',
      session_courante: 'Session 1',
      note_elimination: 5,
      note_passage: 10,
      note_rattrapage: 8,
      credits_semestre: 30,
      credits_annee: 60,
      moyenne_generale_requis: 10
    },
    evaluations: {
      types_autorises: ['CC', 'TD', 'TP', 'Partiel', 'Examen'],
      note_sur_defaut: 20,
      saisie_limite_jours: 7,
      modification_autorisee: true,
      validation_automatique: false
    },
    notifications: {
      email_enabled: true,
      sms_enabled: false,
      notifications_notes: true,
      notifications_absences: true,
      notifications_resultats: true,
      rappels_evaluations: true
    },
    exports: {
      formats_autorises: ['PDF', 'Excel', 'CSV'],
      watermark_enabled: true,
      signature_electronique: false,
      exports_planifies: true,
      retention_jours: 365
    },
    securite: {
      session_timeout: 30,
      tentatives_connexion_max: 5,
      mot_passe_complexite: true,
      double_authentification: false,
      audit_logs: true,
      backup_automatique: true
    }
  })

  const { notifySuccess, notifyError } = useNotifications()

  const handleSave = async (section: string) => {
    try {
      // Simulation de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 1000))
      notifySuccess('Configuration sauvegardée', `Section ${section} mise à jour avec succès`)
    } catch (error) {
      notifyError('Erreur de sauvegarde', 'Impossible de sauvegarder la configuration')
    }
  }

  const handleReset = (section: string) => {
    if (confirm(`Êtes-vous sûr de vouloir réinitialiser la section ${section} ?`)) {
      // Logique de réinitialisation
      notifySuccess('Configuration réinitialisée', `Section ${section} remise aux valeurs par défaut`)
    }
  }

  return (
    <div className="flex-1 space-y-6 p-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configuration Système</h2>
        <p className="text-muted-foreground">
          Configurez les paramètres généraux et spécifiques de votre institution
        </p>
      </div>

      <Tabs defaultValue="institution" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="institution">Institution</TabsTrigger>
          <TabsTrigger value="academique">Académique</TabsTrigger>
          <TabsTrigger value="evaluations">Évaluations</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="exports">Exports</TabsTrigger>
          <TabsTrigger value="securite">Sécurité</TabsTrigger>
        </TabsList>

        <TabsContent value="institution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                Informations Institutionnelles
              </CardTitle>
              <CardDescription>
                Paramètres généraux de votre établissement
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom de l'institution</Label>
                  <Input
                    id="nom"
                    value={config.institution.nom}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      institution: { ...prev.institution, email: e.target.value }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="devise">Devise institutionnelle</Label>
                <Input
                  id="devise"
                  value={config.institution.devise}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    institution: { ...prev.institution, devise: e.target.value }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo (URL)</Label>
                <Input
                  id="logo"
                  value={config.institution.logo}
                  placeholder="https://example.com/logo.png"
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    institution: { ...prev.institution, logo: e.target.value }
                  }))}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => handleSave('institution')}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleReset('institution')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="academique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-5 w-5 mr-2" />
                Paramètres Académiques
              </CardTitle>
              <CardDescription>
                Configuration des règles académiques et d'évaluation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="annee_cours">Année académique courante</Label>
                  <Select
                    value={config.academique.annee_en_cours}
                    onValueChange={(value) => setConfig(prev => ({
                      ...prev,
                      academique: { ...prev.academique, annee_en_cours: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="session_courante">Session courante</Label>
                  <Select
                    value={config.academique.session_courante}
                    onValueChange={(value) => setConfig(prev => ({
                      ...prev,
                      academique: { ...prev.academique, session_courante: value }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Session 1">Session 1</SelectItem>
                      <SelectItem value="Session 2">Session 2</SelectItem>
                      <SelectItem value="Session de rattrapage">Session de rattrapage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Seuils de Notes</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="note_elimination">Note d'élimination</Label>
                    <Input
                      id="note_elimination"
                      type="number"
                      min="0"
                      max="20"
                      value={config.academique.note_elimination}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        academique: { ...prev.academique, note_elimination: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note_passage">Note de passage</Label>
                    <Input
                      id="note_passage"
                      type="number"
                      min="0"
                      max="20"
                      value={config.academique.note_passage}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        academique: { ...prev.academique, note_passage: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="note_rattrapage">Seuil de rattrapage</Label>
                    <Input
                      id="note_rattrapage"
                      type="number"
                      min="0"
                      max="20"
                      value={config.academique.note_rattrapage}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        academique: { ...prev.academique, note_rattrapage: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Système de Crédits</h4>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="credits_semestre">Crédits par semestre</Label>
                    <Input
                      id="credits_semestre"
                      type="number"
                      value={config.academique.credits_semestre}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        academique: { ...prev.academique, credits_semestre: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits_annee">Crédits par année</Label>
                    <Input
                      id="credits_annee"
                      type="number"
                      value={config.academique.credits_annee}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        academique: { ...prev.academique, credits_annee: Number(e.target.value) }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="moyenne_requis">Moyenne générale requise</Label>
                    <Input
                      id="moyenne_requis"
                      type="number"
                      min="0"
                      max="20"
                      step="0.1"
                      value={config.academique.moyenne_generale_requis}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        academique: { ...prev.academique, moyenne_generale_requis: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => handleSave('academique')}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleReset('academique')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evaluations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Configuration des Évaluations
              </CardTitle>
              <CardDescription>
                Paramètres de saisie et gestion des évaluations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Types d'évaluations autorisés</h4>
                <div className="space-y-2">
                  {config.evaluations.types_autorises.map((type, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Switch checked={true} />
                      <Label>{type}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="note_sur_defaut">Note sur (par défaut)</Label>
                  <Input
                    id="note_sur_defaut"
                    type="number"
                    min="1"
                    value={config.evaluations.note_sur_defaut}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      evaluations: { ...prev.evaluations, note_sur_defaut: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="saisie_limite">Limite de saisie (jours après évaluation)</Label>
                <Input
                  id="saisie_limite"
                  type="number"
                  min="1"
                  value={config.evaluations.saisie_limite_jours}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    evaluations: { ...prev.evaluations, saisie_limite_jours: Number(e.target.value) }
                  }))}
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.evaluations.modification_autorisee}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      evaluations: { ...prev.evaluations, modification_autorisee: checked }
                    }))}
                  />
                  <Label>Autoriser la modification des notes après saisie</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.evaluations.validation_automatique}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      evaluations: { ...prev.evaluations, validation_automatique: checked }
                    }))}
                  />
                  <Label>Validation automatique des évaluations</Label>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => handleSave('evaluations')}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleReset('evaluations')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2" />
                Configuration des Notifications
              </CardTitle>
              <CardDescription>
                Paramètres d'envoi des notifications et rappels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Canaux de communication</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.notifications.email_enabled}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, email_enabled: checked }
                      }))}
                    />
                    <Label>Notifications par email</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.notifications.sms_enabled}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, sms_enabled: checked }
                      }))}
                    />
                    <Label>Notifications par SMS</Label>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-medium mb-3">Types de notifications</h4>
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.notifications.notifications_notes}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, notifications_notes: checked }
                      }))}
                    />
                    <Label>Publication des notes</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.notifications.notifications_absences}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, notifications_absences: checked }
                      }))}
                    />
                    <Label>Signalement des absences</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.notifications.notifications_resultats}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, notifications_resultats: checked }
                      }))}
                    />
                    <Label>Publication des résultats</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={config.notifications.rappels_evaluations}
                      onCheckedChange={(checked) => setConfig(prev => ({
                        ...prev,
                        notifications: { ...prev.notifications, rappels_evaluations: checked }
                      }))}
                    />
                    <Label>Rappels d'évaluations à venir</Label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => handleSave('notifications')}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleReset('notifications')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Configuration des Exports
              </CardTitle>
              <CardDescription>
                Paramètres de génération et sécurité des documents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-3">Formats d'export autorisés</h4>
                <div className="space-y-2">
                  {config.exports.formats_autorises.map((format, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Switch checked={true} />
                      <Label>{format}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.exports.watermark_enabled}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      exports: { ...prev.exports, watermark_enabled: checked }
                    }))}
                  />
                  <Label>Filigrane sur les documents</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.exports.signature_electronique}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      exports: { ...prev.exports, signature_electronique: checked }
                    }))}
                  />
                  <Label>Signature électronique</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.exports.exports_planifies}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      exports: { ...prev.exports, exports_planifies: checked }
                    }))}
                  />
                  <Label>Exports planifiés automatiques</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retention">Durée de rétention des exports (jours)</Label>
                <Input
                  id="retention"
                  type="number"
                  min="1"
                  value={config.exports.retention_jours}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    exports: { ...prev.exports, retention_jours: Number(e.target.value) }
                  }))}
                />
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => handleSave('exports')}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleReset('exports')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="securite" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Paramètres de Sécurité
              </CardTitle>
              <CardDescription>
                Configuration de la sécurité et protection des données
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="session_timeout">Timeout de session (minutes)</Label>
                  <Input
                    id="session_timeout"
                    type="number"
                    min="5"
                    value={config.securite.session_timeout}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      securite: { ...prev.securite, session_timeout: Number(e.target.value) }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="tentatives_max">Tentatives de connexion max</Label>
                  <Input
                    id="tentatives_max"
                    type="number"
                    min="1"
                    value={config.securite.tentatives_connexion_max}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      securite: { ...prev.securite, tentatives_connexion_max: Number(e.target.value) }
                    }))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.securite.mot_passe_complexite}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      securite: { ...prev.securite, mot_passe_complexite: checked }
                    }))}
                  />
                  <Label>Politique de mots de passe complexes</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.securite.double_authentification}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      securite: { ...prev.securite, double_authentification: checked }
                    }))}
                  />
                  <Label>Double authentification (2FA)</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.securite.audit_logs}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      securite: { ...prev.securite, audit_logs: checked }
                    }))}
                  />
                  <Label>Journaux d'audit</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={config.securite.backup_automatique}
                    onCheckedChange={(checked) => setConfig(prev => ({
                      ...prev,
                      securite: { ...prev.securite, backup_automatique: checked }
                    }))}
                  />
                  <Label>Sauvegarde automatique</Label>
                </div>
              </div>

              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h5 className="font-medium text-yellow-800">Attention</h5>
                    <p className="text-sm text-yellow-700">
                      Les modifications de sécurité peuvent affecter l'accès de tous les utilisateurs. 
                      Assurez-vous de tester ces paramètres avant de les appliquer en production.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button onClick={() => handleSave('securite')}>
                  <Save className="h-4 w-4 mr-2" />
                  Sauvegarder
                </Button>
                <Button variant="outline" onClick={() => handleReset('securite')}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Réinitialiser
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}