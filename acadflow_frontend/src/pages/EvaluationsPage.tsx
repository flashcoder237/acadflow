// src/pages/EvaluationsPage.tsx
import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter, Calendar, Clock, Users, FileText } from 'lucide-react'
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
import { evaluationsApi } from '../lib/api'
import { Evaluation } from '../types/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'
import { formatDate } from '../lib/utils'

export const EvaluationsPage: React.FC = () => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { canManageEvaluations, isEnseignant } = usePermissions()
  const { execute: fetchEvaluations, loading } = useApi<{ results: Evaluation[] }>()

  useEffect(() => {
    loadEvaluations()
  }, [])

  const loadEvaluations = async () => {
    const result = await fetchEvaluations(() => evaluationsApi.getEvaluations())
    if (result?.results) {
      setEvaluations(result.results)
    }
  }

  const filteredEvaluations = evaluations.filter(evaluation =>
    evaluation.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    evaluation.type_evaluation_nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (evaluation: Evaluation) => {
    if (evaluation.saisie_terminee) {
      return <Badge variant="success">Terminée</Badge>
    }
    
    const today = new Date()
    const evalDate = new Date(evaluation.date_evaluation)
    
    if (evalDate > today) {
      return <Badge variant="info">Programmée</Badge>
    } else if (evaluation.nombre_notes > 0) {
      return <Badge variant="warning">En cours</Badge>
    } else {
      return <Badge variant="secondary">En attente</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Évaluations</h2>
          <p className="text-muted-foreground">
            Gestion des évaluations et saisie des notes
          </p>
        </div>
        {canManageEvaluations && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle évaluation
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une évaluation..."
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

      <Card>
        <CardHeader>
          <CardTitle>Liste des évaluations</CardTitle>
          <CardDescription>
            {filteredEvaluations.length} évaluation(s) trouvée(s)
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
                  <TableHead>Évaluation</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Session</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvaluations.map((evaluation) => (
                  <TableRow key={evaluation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{evaluation.nom}</div>
                        <div className="text-sm text-muted-foreground">
                          Coefficient: {evaluation.coefficient}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {evaluation.type_evaluation_nom}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(evaluation.date_evaluation)}
                      </div>
                    </TableCell>
                    <TableCell>{evaluation.session_nom}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {evaluation.nombre_notes} notes
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(evaluation)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <FileText className="h-4 w-4" />
                        </Button>
                        {(canManageEvaluations || isEnseignant) && (
                          <Button variant="ghost" size="sm">
                            <Clock className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
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