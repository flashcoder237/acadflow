// ========================================
// FICHIER: src/pages/TeacherExportPage.tsx - Gestion des exports pour enseignants
// ========================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Download, 
  FileText, 
  FileSpreadsheet,
  Image,
  Calendar,
  Users,
  BarChart3,
  Settings,
  Filter,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Eye,
  Trash2,
  Share2,
  Archive
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loading } from '@/components/ui/loading';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/authStore';
import { useSessions, useNotificationActions } from '@/stores/appStore';
import { teacherApi } from '@/lib/teacherApi';
import { apiClient } from '@/lib/api';
import { formatDate, formatDateTime, cn } from '@/lib/utils';
import { ExportOptions } from '@/types/teacher';

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'notes' | 'statistiques' | 'feuille_presence' | 'releve_notes';
  format: 'xlsx' | 'csv' | 'pdf';
  icon: React.ElementType;
  color: string;
  includes: string[];
}

interface ExportHistory {
  id: string;
  name: string;
  type: string;
  format: string;
  size: string;
  date_creation: string;
  status: 'success' | 'processing' | 'error';
  download_count: number;
}

const TeacherExportPage: React.FC = () => {
  const { user } = useAuthStore();
  const sessions = useSessions();
  const { showSuccess, showError } = useNotificationActions();

  // États locaux
  const [activeTab, setActiveTab] = useState('quick');
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<ExportTemplate | null>(null);
  const [exportOptions, setExportOptions] = useState<Partial<ExportOptions>>({
    format: 'xlsx',
    type: 'notes'
  });
  const [exporting, setExporting] = useState(false);
  const [filters, setFilters] = useState({
    session: 'all',
    semestre: 'all',
    enseignement: 'all',
    format: 'all'
  });

  // Templates prédéfinis
  const exportTemplates: ExportTemplate[] = [
    {
      id: 'notes_complete',
      name: 'Notes complètes',
      description: 'Export de toutes les notes avec statistiques',
      type: 'notes',
      format: 'xlsx',
      icon: FileSpreadsheet,
      color: 'green',
      includes: ['Notes par étudiant', 'Moyennes', 'Statistiques', 'Graphiques']
    },
    {
      id: 'feuille_presence',
      name: 'Feuille de présence',
      description: 'Liste d\'émargement pour évaluations',
      type: 'feuille_presence',
      format: 'pdf',
      icon: Users,
      color: 'blue',
      includes: ['Liste étudiants', 'Signatures', 'Date/Heure']
    },
    {
      id: 'releve_notes',
      name: 'Relevé de notes',
      description: 'Relevé officiel par étudiant',
      type: 'releve_notes',
      format: 'pdf',
      icon: FileText,
      color: 'purple',
      includes: ['Notes détaillées', 'Moyennes', 'Mentions', 'Signatures']
    },
    {
      id: 'statistiques',
      name: 'Statistiques',
      description: 'Analyses et graphiques des performances',
      type: 'statistiques',
      format: 'xlsx',
      icon: BarChart3,
      color: 'orange',
      includes: ['Moyennes', 'Répartitions', 'Tendances', 'Comparaisons']
    }
  ];

  // Query pour charger les enseignements
  const { data: enseignements } = useQuery({
    queryKey: ['enseignements-export'],
    queryFn: () => apiClient.getEnseignements({ page_size: 100 }),
    enabled: !!user?.enseignant_id
  });

  // Historique des exports (simulé)
  const exportHistory: ExportHistory[] = [
    {
      id: '1',
      name: 'Notes_MATH101_S1_2024.xlsx',
      type: 'Notes complètes',
      format: 'XLSX',
      size: '245 KB',
      date_creation: '2024-03-15T10:30:00Z',
      status: 'success',
      download_count: 3
    },
    {
      id: '2',
      name: 'Presence_INFO102_CC1.pdf',
      type: 'Feuille de présence',
      format: 'PDF',
      size: '89 KB',
      date_creation: '2024-03-14T14:20:00Z',
      status: 'success',
      download_count: 1
    },
    {
      id: '3',
      name: 'Statistiques_S1_2024.xlsx',
      type: 'Statistiques',
      format: 'XLSX',
      size: '567 KB',
      date_creation: '2024-03-10T09:15:00Z',
      status: 'processing',
      download_count: 0
    }
  ];

  // Handlers
  const handleQuickExport = async (template: ExportTemplate) => {
    setExporting(true);
    try {
      const options: ExportOptions = {
        format: template.format,
        type: template.type,
        session_id: filters.session !== 'all' ? parseInt(filters.session) : undefined,
        enseignement_id: filters.enseignement !== 'all' ? parseInt(filters.enseignement) : undefined
      };

      const blob = await teacherApi.exporterDonnees(options);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${template.name}_${new Date().toISOString().split('T')[0]}.${template.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Export réussi', `${template.name} exporté avec succès`);
    } catch (error) {
      showError('Erreur d\'export', 'Impossible d\'exporter les données');
    } finally {
      setExporting(false);
    }
  };

  const handleCustomExport = async () => {
    if (!selectedTemplate) return;
    
    setExporting(true);
    try {
      const blob = await teacherApi.exporterDonnees(exportOptions as ExportOptions);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export_personnalise_${new Date().toISOString().split('T')[0]}.${exportOptions.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Export personnalisé réussi', 'Votre export a été téléchargé');
      setShowCustomDialog(false);
    } catch (error) {
      showError('Erreur d\'export', 'Impossible d\'exporter les données');
    } finally {
      setExporting(false);
    }
  };

  const handleDownloadHistory = (item: ExportHistory) => {
    showSuccess('Téléchargement', `Téléchargement de ${item.name}`);
    // Ici on téléchargerait le fichier depuis l'historique
  };

  const getTemplateIcon = (template: ExportTemplate) => {
    const Icon = template.icon;
    const colorClasses = {
      green: 'text-green-600 bg-green-50 border-green-200',
      blue: 'text-blue-600 bg-blue-50 border-blue-200',
      purple: 'text-purple-600 bg-purple-50 border-purple-200',
      orange: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    
    return (
      <div className={cn('p-3 rounded-lg border', colorClasses[template.color as keyof typeof colorClasses])}>
        <Icon className="w-6 h-6" />
      </div>
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exports et téléchargements</h1>
          <p className="text-gray-600">
            Exportez vos données d'enseignement dans différents formats
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => setShowCustomDialog(true)}
            variant="outline"
          >
            <Settings className="w-4 h-4 mr-2" />
            Export personnalisé
          </Button>
        </div>
      </div>

      {/* Filtres globaux */}
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-sm font-medium">Session</Label>
              <Select value={filters.session} onValueChange={(value) => setFilters({...filters, session: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sessions</SelectItem>
                  {sessions.map(session => (
                    <SelectItem key={session.id} value={session.id.toString()}>
                      {session.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Enseignement</Label>
              <Select value={filters.enseignement} onValueChange={(value) => setFilters({...filters, enseignement: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les enseignements</SelectItem>
                  {enseignements?.results.map(enseignement => (
                    <SelectItem key={enseignement.id} value={enseignement.id.toString()}>
                      {enseignement.ec_code} - {enseignement.classe_nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Période</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Période actuelle</SelectItem>
                  <SelectItem value="semester">Ce semestre</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                  <SelectItem value="custom">Personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium">Format</Label>
              <Select value={filters.format} onValueChange={(value) => setFilters({...filters, format: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les formats</SelectItem>
                  <SelectItem value="xlsx">Excel (.xlsx)</SelectItem>
                  <SelectItem value="csv">CSV (.csv)</SelectItem>
                  <SelectItem value="pdf">PDF (.pdf)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="quick">Export rapide</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="templates">Modèles</TabsTrigger>
        </TabsList>

        {/* Tab: Export rapide */}
        <TabsContent value="quick" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exportTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-lg transition-all duration-200">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTemplateIcon(template)}
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {template.format.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Inclut :</p>
                    <div className="flex flex-wrap gap-1">
                      {template.includes.map((item, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button 
                      onClick={() => handleQuickExport(template)}
                      disabled={exporting}
                      className="flex-1"
                    >
                      {exporting ? (
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Exporter
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedTemplate(template);
                        setExportOptions({
                          format: template.format,
                          type: template.type
                        });
                        setShowCustomDialog(true);
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Tab: Historique */}
        <TabsContent value="history" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Historique des exports</h3>
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualiser
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="divide-y">
                {exportHistory.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(item.status)}
                          <div>
                            <h4 className="font-medium text-gray-900">{item.name}</h4>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <span>{item.type}</span>
                              <span>•</span>
                              <span>{item.format}</span>
                              <span>•</span>
                              <span>{item.size}</span>
                              <span>•</span>
                              <span>{formatDateTime(item.date_creation)}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {item.download_count > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            {item.download_count} téléchargement(s)
                          </Badge>
                        )}
                        
                        {item.status === 'success' && (
                          <Button
                            onClick={() => handleDownloadHistory(item)}
                            variant="outline"
                            size="sm"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Télécharger
                          </Button>
                        )}
                        
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        <Button variant="ghost" size="sm" className="text-red-600">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Modèles */}
        <TabsContent value="templates" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Modèles d'export</h3>
            <Button variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau modèle
            </Button>
          </div>

          <Card>
            <CardContent className="p-12 text-center">
              <Archive className="w-16 h-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Modèles personnalisés
              </h3>
              <p className="text-gray-600 mb-4">
                Créez et sauvegardez vos propres modèles d'export pour gagner du temps
              </p>
              <Button variant="outline">
                Créer mon premier modèle
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog d'export personnalisé */}
      <Dialog open={showCustomDialog} onOpenChange={setShowCustomDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Export personnalisé</DialogTitle>
            <DialogDescription>
              Configurez votre export selon vos besoins spécifiques
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Type d'export */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Type d'export</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'notes', label: 'Notes et moyennes', icon: FileText },
                  { value: 'statistiques', label: 'Statistiques', icon: BarChart3 },
                  { value: 'feuille_presence', label: 'Feuille de présence', icon: Users },
                  { value: 'releve_notes', label: 'Relevé de notes', icon: FileSpreadsheet }
                ].map(({ value, label, icon: Icon }) => (
                  <Button
                    key={value}
                    variant={exportOptions.type === value ? "default" : "outline"}
                    onClick={() => setExportOptions({...exportOptions, type: value as any})}
                    className="h-auto p-4 flex-col"
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-sm">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Format de fichier</Label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'xlsx', label: 'Excel', icon: FileSpreadsheet, color: 'green' },
                  { value: 'csv', label: 'CSV', icon: FileText, color: 'blue' },
                  { value: 'pdf', label: 'PDF', icon: Image, color: 'red' }
                ].map(({ value, label, icon: Icon, color }) => (
                  <Button
                    key={value}
                    variant={exportOptions.format === value ? "default" : "outline"}
                    onClick={() => setExportOptions({...exportOptions, format: value as any})}
                    className="h-auto p-4 flex-col"
                  >
                    <Icon className="w-6 h-6 mb-2" />
                    <span className="text-sm">{label}</span>
                  </Button>
                ))}
              </div>
            </div>

            {/* Options avancées */}
            <div>
              <Label className="text-sm font-medium mb-3 block">Options d'export</Label>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox id="include_stats" />
                  <Label htmlFor="include_stats" className="text-sm">
                    Inclure les statistiques détaillées
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include_comments" />
                  <Label htmlFor="include_comments" className="text-sm">
                    Inclure les commentaires
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="include_absences" />
                  <Label htmlFor="include_absences" className="text-sm">
                    Inclure les informations d'absence
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="anonymize" />
                  <Label htmlFor="anonymize" className="text-sm">
                    Anonymiser les données étudiants
                  </Label>
                </div>
              </div>
            </div>

            {/* Période */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Date de début</Label>
                <Input type="date" />
              </div>
              <div>
                <Label className="text-sm font-medium">Date de fin</Label>
                <Input type="date" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCustomExport} disabled={exporting}>
              {exporting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Export en cours...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeacherExportPage;