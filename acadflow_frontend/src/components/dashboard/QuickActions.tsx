// src/components/dashboard/QuickActions.tsx
import React from 'react'
import { Plus, Upload, Download, Calendar } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { usePermissions } from '../../hooks/usePermissions'

export const QuickActions: React.FC = () => {
  const { canManageEvaluations, canManageClasses, isEnseignant, isAdmin, isScolarite } = usePermissions()

  const actions = [
    {
      title: 'Nouvelle évaluation',
      description: 'Créer une nouvelle évaluation',
      icon: Plus,
      action: () => console.log('Nouvelle évaluation'),
      show: canManageEvaluations
    },
    {
      title: 'Planifier évaluation',
      description: 'Programmer une évaluation',
      icon: Calendar,
      action: () => console.log('Planifier évaluation'),
      show: isEnseignant
    },
    {
      title: 'Importer données',
      description: 'Importer des données depuis un fichier',
      icon: Upload,
      action: () => console.log('Importer données'),
      show: isAdmin || isScolarite
    },
    {
      title: 'Exporter relevés',
      description: 'Télécharger les relevés de notes',
      icon: Download,
      action: () => console.log('Exporter relevés'),
      show: canManageClasses
    }
  ]

  const visibleActions = actions.filter(action => action.show)

  if (visibleActions.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions rapides</CardTitle>
        <CardDescription>
          Accès rapide aux fonctionnalités principales
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-3">
          {visibleActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              className="justify-start h-auto p-4"
              onClick={action.action}
            >
              <action.icon className="mr-3 h-4 w-4" />
              <div className="text-left">
                <div className="font-medium">{action.title}</div>
                <div className="text-sm text-muted-foreground">
                  {action.description}
                </div>
              </div>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}