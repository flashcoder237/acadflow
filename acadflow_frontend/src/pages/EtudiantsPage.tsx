// src/pages/EtudiantsPage.tsx
import React, { useEffect, useState } from 'react'
import { Plus, Search, Filter, Eye, Edit, Mail, Phone } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { Badge } from '../components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar'
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
import { usersApi } from '../lib/api'
import { Etudiant } from '../types/api'
import { LoadingSpinner } from '../components/ui/LoadingSpinner'

export const EtudiantsPage: React.FC = () => {
  const [etudiants, setEtudiants] = useState<Etudiant[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const { canManageUsers } = usePermissions()
  const { execute: fetchEtudiants, loading } = useApi<{ results: Etudiant[] }>()

  useEffect(() => {
    loadEtudiants()
  }, [])

  const loadEtudiants = async () => {
    const result = await fetchEtudiants(() => usersApi.getEtudiants())
    if (result?.results) {
      setEtudiants(result.results)
    }
  }

  const filteredEtudiants = etudiants.filter(etudiant =>
    etudiant.nom_complet.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etudiant.matricule.toLowerCase().includes(searchTerm.toLowerCase()) ||
    etudiant.user.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'inscrit': return 'success'
      case 'redoublant': return 'warning'
      case 'suspendu': return 'destructive'
      default: return 'secondary'
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Étudiants</h2>
          <p className="text-muted-foreground">
            Gestion des étudiants et inscriptions
          </p>
        </div>
        {canManageUsers && (
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nouvel étudiant
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un étudiant..."
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
          <CardTitle>Liste des étudiants</CardTitle>
          <CardDescription>
            {filteredEtudiants.length} étudiant(s) trouvé(s)
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
                  <TableHead>Étudiant</TableHead>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Carte étudiant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEtudiants.map((etudiant) => (
                  <TableRow key={etudiant.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={etudiant.user.photo} />
                          <AvatarFallback>
                            {getInitials(etudiant.nom_complet)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{etudiant.nom_complet}</div>
                          <div className="text-sm text-muted-foreground">
                            {etudiant.user.email}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      {etudiant.matricule}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {etudiant.user.email && (
                          <div className="flex items-center text-sm">
                            <Mail className="h-3 w-3 mr-1" />
                            {etudiant.user.email}
                          </div>
                        )}
                        {etudiant.user.telephone && (
                          <div className="flex items-center text-sm">
                            <Phone className="h-3 w-3 mr-1" />
                            {etudiant.user.telephone}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusColor(etudiant.statut_current)}>
                        {etudiant.statut_current}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {etudiant.numero_carte || 'Non attribué'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        {canManageUsers && (
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
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