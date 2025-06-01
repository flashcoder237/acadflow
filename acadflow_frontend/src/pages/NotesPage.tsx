// src/pages/NotesPage.tsx - Version améliorée
import React, { useEffect, useState } from 'react'
import { 
  Eye, 
  Download, 
  Upload, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  AlertTriangle,
  BarChart3,
  FileText,
  Target,
  Users
} from 'lucide-react'
import { DataTable, DataTableColumn, DataTableFilter, DataTableAction } from '@/components/ui/data-table/DataTable'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '@/components/ui/notification-system'
import { evaluationsApi } from '../lib/api'
import { Note } from '../types/api'
import { acadflowExports, acadflowImports } from '../lib/export-import'
import { getMentionFromNote, getMentionColor, formatDate } from '../lib/utils'

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const { canViewAllNotes, isEtudiant, canModifyNotes } = usePermissions()
  const { user } = useAuth()
  const { notifySuccess, notifyError } = useNotifications()
  const { execute: fetchNotes, loading } = useApi<{ results: Note[] }>()

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    try {
      const params = isEtudiant ? { etudiant: user?.etudiant_id } : {}
      const result = await fetchNotes(() => evaluationsApi.getNotes(params))
      if (result?.results) {
        setNotes(result.results)
      }
    } catch (error) {
      notifyError('Erreur', 'Impossible de charger les notes')
    }
  }

  const getNoteBadgeVariant = (note: number) => {
    if (note >= 16) return 'success'
    if (note >= 14) return 'info'
    if (note >= 12) return 'warning'
    if (note >= 10) return 'secondary'
    return 'destructive'
  }

  const getProgressColor = (note: number) => {
    if (note >= 16) return 'bg-green-500'
    if (note >= 14) return 'bg-blue-500'
    if (note >= 12) return 'bg-yellow-500'
    if (note >= 10) return 'bg-orange-500'
    return 'bg-red-500'
  }

  // Configuration des colonnes
  const columns: DataTableColumn<Note>[] = [
    ...(isEtudiant ? [] : [{
      key: 'etudiant_nom' as keyof Note,
      title: 'Étudiant',
      sortable: true,
      render: (value: any, item: Note) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground font-mono">
            {item.etudiant_matricule}
          </div>
        </div>
      )
    }]),
    {
      key: 'evaluation_nom',
      title: 'Évaluation',
      sortable: true,
      filterable: true,
      render: (value, item) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-muted-foreground">
            {formatDate(item.created_at)}
          </div>
        </div>
      )
    },
    {
      key: 'note_obtenue',
      title: 'Note',
      sortable: true,
      render: (value, item) => {
        if (item.absent) {
          return (
            <div className="flex items-center space-x-2">
              <span className="text-lg font-bold text-red-600">ABS</span>
              <Badge variant={item.justifie ? 'warning' : 'destructive'}>
                {item.justifie ? 'Justifiée' : 'Non justifiée'}
              </Badge>
            </div>
          )
        }
        
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-3">
              <span className="text-2xl font-bold">{item.note_sur_20}/20</span>
              <div className="flex-1">
                <Progress 
                  value={(item.note_sur_20 / 20) * 100} 
                  className="h-2"
                />
              </div>
            </div>
            <Badge variant={getNoteBadgeVariant(item.note_sur_20)}>
              {getMentionFromNote(item.note_sur_20)}
            </Badge>
          </div>
        )
      }
    },
    {
      key: 'note_sur_20',
      title: 'Mention',
      sortable: true,
      filterable: true,
      render: (value, item) => {
        if (item.absent) return null
        
        return (
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${getProgressColor(value)}`} />
            <span className={getMentionColor(value)}>
              {getMentionFromNote(value)}
            </span>
          </div>
        )
      }
    },
    {
      key: 'commentaire',
      title: 'Commentaire',
      render: (value) => (
        <div className="max-w-xs truncate">
          {value || '-'}
        </div>
      )
    },
    {
      key: 'created_at',
      title: 'Date saisie',
      sortable: true,
      render: (value) => formatDate(value)
    }
  ]

  // Configuration des filtres
  const filters: DataTableFilter[] = [
    {
      key: 'evaluation_nom',
      label: 'Évaluation',
      type: 'select',
      options: [
        ...new Set(notes.map(n => n.evaluation_nom))
      ].map(evaluationName => ({ label: evaluationName, value: evaluationName }))
    },
    {
      key: 'mention',
      label: 'Mention',
      type: 'select',
      options: [
        { label: 'Très Bien (≥16)', value: 'tres_bien' },
        { label: 'Bien (14-15.99)', value: 'bien' },
        { label: 'Assez Bien (12-13.99)', value: 'assez_bien' },
        { label: 'Passable (10-11.99)', value: 'passable' },
        { label: 'Insuffisant (<10)', value: 'insuffisant' }
      ]
    },
    {
      key: 'absent',
      label: 'Présence',
      type: 'select',
      options: [
        { label: 'Présent', value: false },
        { label: 'Absent', value: true }
      ]
    },
    {
      key: 'justifie',
      label: 'Absence justifiée',
      type: 'select',
      options: [
        { label: 'Justifiée', value: true },
        { label: 'Non justifiée', value: false }
      ]
    },
    {
      key: 'note_min',
      label: 'Note minimum',
      type: 'number',
      placeholder: '0'
    },
    {
      key: 'note_max',
      label: 'Note maximum',
      type: 'number',
      placeholder: '20'
    }
  ]

  // Actions sur les lignes
  const actions: DataTableAction<Note>[] = [
    {
      label: 'Voir détails',
      icon: Eye,
      onClick: (note) => {
        console.log('Voir détails note:', note.id)
        // Modal avec détails complets
      }
    },
    ...(canModifyNotes ? [
      {
        label: 'Modifier',
        icon: FileText,
        onClick: (note: Note) => {
          console.log('Modifier note:', note.id)
          // Ouvrir formulaire de modification
        }
      }
    ] : [])
  ]

  // Gestion de l'export
  const handleExport = (data: Note[], selectedColumns: string[]) => {
    try {
      acadflowExports.exportNotes(data)
      notifySuccess('Export réussi', 'Les notes ont été exportées avec succès')
    } catch (error) {
      notifyError('Erreur d\'export', 'Impossible d\'exporter les données')
    }
  }

  // Gestion de l'import (pour les enseignants/admin)
  const handleImport = async (file: File) => {
    try {
      const result = await acadflowImports.importNotes(file)
      
      if (result.errors.length > 0) {
        notifyError(
          'Erreurs d\'import',
          `${result.errors.length} erreur(s) détectée(s). ${result.summary.validRows} ligne(s) valide(s).`
        )
      } else {
        notifySuccess(
          'Import réussi',
          `${result.summary.validRows} note(s) importée(s) avec succès`
        )
        loadNotes()
      }
    } catch (error) {
      notifyError('Erreur d\'import', 'Impossible d\'importer le fichier')
    }
  }

  // Calcul des statistiques
  const calculateStats = () => {
    if (notes.length === 0) return null
    
    const notesValues = notes.filter(n => !n.absent).map(n => n.note_sur_20)
    const moyenne = notesValues.length > 0 ? notesValues.reduce((sum, note) => sum + note, 0) / notesValues.length : 0
    
    const mentions = {
      'Très Bien': notesValues.filter(n => n >= 16).length,
      'Bien': notesValues.filter(n => n >= 14 && n < 16).length,
      'Assez Bien': notesValues.filter(n => n >= 12 && n < 14).length,
      'Passable': notesValues.filter(n => n >= 10 && n < 12).length,
      'Insuffisant': notesValues.filter(n => n < 10).length,
    }
    
    const absences = notes.filter(n => n.absent)
    
    return { 
      moyenne, 
      mentions, 
      total: notesValues.length,
      absences: absences.length,
      absencesJustifiees: absences.filter(a => a.justifie).length
    }
  }

  const stats = calculateStats()

  return (
    <div className="flex-1 space-y-6 p-6">
      {/* En-tête */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">
          {isEtudiant ? 'Mes Notes' : 'Gestion des Notes'}
        </h2>
        <p className="text-muted-foreground">
          {isEtudiant 
            ? 'Consultez vos résultats et suivez votre progression académique'
            : 'Consultez et gérez les notes des évaluations'
          }
        </p>
      </div>

      {/* Statistiques (surtout pour les étudiants) */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Moyenne générale</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.moyenne.toFixed(2)}/20
              </div>
              <p className={`text-xs ${getMentionColor(stats.moyenne)}`}>
                {getMentionFromNote(stats.moyenne)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Évaluations</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                notes saisies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Excellentes notes</CardTitle>
              <Award className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.mentions['Très Bien'] + stats.mentions['Bien']}
              </div>
              <p className="text-xs text-muted-foreground">
                notes ≥ 14/20
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Absences</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.absences}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.absencesJustifiees} justifiée(s)
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Répartition des mentions (pour les étudiants) */}
      {isEtudiant && stats && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <BarChart3 className="h-5 w-5" />
              <span>Répartition de mes notes</span>
            </CardTitle>
            <CardDescription>
              Distribution de vos notes par mention
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.mentions).map(([mention, count]) => (
                <div key={mention} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{mention}</span>
                  <div className="flex items-center space-x-2 flex-1 max-w-xs">
                    <Progress 
                      value={stats.total > 0 ? (count / stats.total) * 100 : 0} 
                      className="flex-1 h-2"
                    />
                    <span className="text-sm font-bold w-8">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tableau des données */}
      <DataTable
        data={notes}
        columns={columns}
        filters={filters}
        actions={actions}
        loading={loading}
        title={isEtudiant ? "Mes notes" : "Liste des notes"}
        description={`${notes.length} note(s) au total`}
        searchable={true}
        searchPlaceholder={isEtudiant ? "Rechercher une évaluation..." : "Rechercher (étudiant, évaluation)..."}
        selectable={!isEtudiant}
        exportable={true}
        importable={canModifyNotes}
        onExport={handleExport}
        onImport={handleImport}
        onRefresh={loadNotes}
        emptyMessage="Aucune note trouvée"
        className="w-full"
      />
    </div>
  )
}