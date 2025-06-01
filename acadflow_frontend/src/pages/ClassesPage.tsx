// src/pages/ClassesPage.tsx
import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter, Users, Eye } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { useApi } from '../hooks/useApi'
import { usePermissions } from '../hooks/usePermissions'
import { academicsApi } from '../lib/api'
import { Classe } from '../types/api'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'

export const ClassesPage: React.FC = () => {
  const [classes, setClasses] = useState<Classe[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { canManageClasses } = usePermissions()
  const { execute: fetchClasses, loading } = useApi<{ results: Classe[] }>()

  useEffect(() => {
    loadClasses()
  }, [])

  const loadClasses = async () => {
    const result = await fetchClasses(() => academicsApi.getClasses())
    if (result?.results) {
      setClasses(result.results)
    }
  }

  const filteredClasses = classes.filter(classe =>
    classe.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classe.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    classe.filiere_nom.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getEffectifColor = (actuel: number, max: number) => {
    const ratio = actuel / max
    if (ratio >= 0.9) return 'text-red-600'
    if (ratio >= 0.7) return 'text-yellow-600'
    return 'text-green-600'
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Classes</h2>
          <p className="text-muted-foreground">
            Gestion des classes et promotions
          </p>
        </div>
        {canManageClasses && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle classe
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une classe..."
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
          <CardTitle>Liste des classes</CardTitle>
          <CardDescription>
            {filteredClasses.length} classe(s) trouvée(s)
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
                  <TableHead>Classe</TableHead>
                  <TableHead>Filière</TableHead>
                  <TableHead>Niveau</TableHead>
                  <TableHead>Année académique</TableHead>
                  <TableHead>Effectif</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((classe) => (
                  <TableRow key={classe.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div>{classe.nom}</div>
                        <div className="text-sm text-muted-foreground">
                          {classe.code}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{classe.filiere_nom}</TableCell>
                    <TableCell>{classe.niveau_nom}</TableCell>
                    <TableCell>{classe.annee_academique_libelle}</TableCell>
                    <TableCell>
                      <span className={getEffectifColor(classe.effectif_actuel, classe.effectif_max)}>
                        {classe.effectif_actuel}/{classe.effectif_max}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={classe.active ? 'success' : 'secondary'}>
                        {classe.active ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Users className="h-4 w-4" />
                        </Button>
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