// src/pages/NotesPage.tsx
import React, { useEffect, useState } from 'react'
import { Search, Filter, Download, Eye, TrendingUp, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../components/ui/table'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { useAuth } from '../contexts/AuthContext'
import { evaluationsApi } from '../lib/api'
import { Note } from '../types/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { getMentionFromNote, getMentionColor } from '../lib/utils'

export const NotesPage: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { canViewAllNotes, isEtudiant } = usePermissions()
  const { user } = useAuth()
  const { execute: fetchNotes, loading } = useApi<{ results: Note[] }>()

  useEffect(() => {
    loadNotes()
  }, [])

  const loadNotes = async () => {
    const params = isEtudiant ? { etudiant: user?.etudiant_id } : {}
    const result = await fetchNotes(() => evaluationsApi.getNotes(params))
    if (result?.results) {
      setNotes(result.results)
    }
  }

  const filteredNotes = notes.filter(note =>
    note.evaluation_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.etudiant_nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.etudiant_matricule.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getNoteBadgeVariant = (note: number) => {
    if (note >= 16) return 'success'
    if (note >= 14) return 'info'
    if (note >= 12) return 'warning'
    if (note >= 10) return 'secondary'
    return 'destructive'
  }

  const calculateStats = () => {
    if (notes.length === 0) return { moyenne: 0, mentions: {}, total: 0 }
    
    const notesValues = notes.filter(n => !n.absent).map(n => n.note_sur_20)
    const moyenne = notesValues.reduce((sum, note) => sum + note, 0) / notesValues.length
    
    const mentions = {
      'Très Bien': notesValues.filter(n => n >= 16).length,
      'Bien': notesValues.filter(n => n >= 14 && n < 16).length,
      'Assez Bien': notesValues.filter(n => n >= 12 && n < 14).length,
      'Passable': notesValues.filter(n => n >= 10 && n < 12).length,
      'Insuffisant': notesValues.filter(n => n < 10).length,
    }
    
    return { moyenne, mentions, total: notesValues.length }
  }

  const stats = calculateStats()

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Notes</h2>
          <p className="text-muted-foreground">
            {isEtudiant ? 'Mes notes et résultats' : 'Consultation des notes'}
          </p>
        </div>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Exporter
        </Button>
      </div>

      {!isEtudiant && (
        <div className="flex items-center space-x-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          <Button variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Filtres
          </Button>
        </div>
      )}

      {isEtudiant && (
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
              <CardTitle className="text-sm font-medium">Total évaluations</CardTitle>
              <Eye className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                Évaluations notées
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Meilleures notes</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.mentions['Très Bien'] + stats.mentions['Bien']}
              </div>
              <p className="text-xs text-muted-foreground">
                Notes ≥ 14/20
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">À améliorer</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.mentions['Insuffisant']}
              </div>
              <p className="text-xs text-muted-foreground">
                Notes &lt; 10/20
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>
            {isEtudiant ? 'Mes notes' : 'Liste des notes'}
          </CardTitle>
          <CardDescription>
            {filteredNotes.length} note(s) trouvée(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size={32} />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {!isEtudiant && <TableHead>Étudiant</TableHead>}
                  <TableHead>Évaluation</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Mention</TableHead>
                  <TableHead>Statut</TableHead>
                  {!isEtudiant && <TableHead>Commentaire</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredNotes.map((note) => (
                  <TableRow key={note.id}>
                    {!isEtudiant && (
                      <TableCell>
                        <div>
                          <div className="font-medium">{note.etudiant_nom}</div>
                          <div className="text-sm text-muted-foreground font-mono">
                            {note.etudiant_matricule}
                          </div>
                        </div>
                      </TableCell>
                    )}
                    <TableCell>
                      <div className="font-medium">{note.evaluation_nom}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-bold text-lg">
                        {note.absent ? 'ABS' : `${note.note_sur_20}/20`}
                      </div>
                    </TableCell>
                    <TableCell>
                      {!note.absent && (
                        <Badge variant={getNoteBadgeVariant(note.note_sur_20)}>
                          {getMentionFromNote(note.note_sur_20)}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {note.absent && (
                        <Badge variant={note.justifie ? 'warning' : 'destructive'}>
                          {note.justifie ? 'Absence justifiée' : 'Absence'}
                        </Badge>
                      )}
                    </TableCell>
                    {!isEtudiant && (
                      <TableCell className="max-w-xs truncate">
                        {note.commentaire}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}