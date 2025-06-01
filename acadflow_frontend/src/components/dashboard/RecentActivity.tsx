// src/components/dashboard/RecentActivity.tsx
import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { formatDateTime } from '../../lib/utils'

interface Activity {
  id: string
  type: 'evaluation' | 'note' | 'inscription' | 'modification'
  title: string
  description: string
  timestamp: Date
  status?: 'success' | 'warning' | 'error'
}

const mockActivities: Activity[] = [
  {
    id: '1',
    type: 'evaluation',
    title: 'Nouvelle évaluation créée',
    description: 'Partiel de Mathématiques - L1 Info',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    status: 'success'
  },
  {
    id: '2',
    type: 'note',
    title: 'Notes saisies',
    description: '25 notes ajoutées pour l\'évaluation de Physique',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    status: 'success'
  },
  {
    id: '3',
    type: 'inscription',
    title: 'Nouvelle inscription',
    description: 'Étudiant inscrit en M1 Informatique',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    status: 'success'
  }
]

export const RecentActivity: React.FC = () => {
  const getActivityBadgeVariant = (type: Activity['type']) => {
    switch (type) {
      case 'evaluation': return 'default'
      case 'note': return 'success'
      case 'inscription': return 'info'
      case 'modification': return 'warning'
      default: return 'default'
    }
  }

  const getActivityTypeLabel = (type: Activity['type']) => {
    switch (type) {
      case 'evaluation': return 'Évaluation'
      case 'note': return 'Note'
      case 'inscription': return 'Inscription'
      case 'modification': return 'Modification'
      default: return type
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activité récente</CardTitle>
        <CardDescription>
          Les dernières actions effectuées dans le système
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3 text-sm">
              <Badge variant={getActivityBadgeVariant(activity.type)}>
                {getActivityTypeLabel(activity.type)}
              </Badge>
              <div className="flex-1 space-y-1">
                <p className="font-medium">{activity.title}</p>
                <p className="text-muted-foreground">{activity.description}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateTime(activity.timestamp)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}