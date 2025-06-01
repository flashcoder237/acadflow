import React, { useEffect, useState } from 'react'
import { 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  TrendingUp,
  Calendar
} from 'lucide-react'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentActivity } from '@/components/dashboard/RecentActivity'
import { QuickActions } from '@/components/dashboard/QuickActions'
import { useAuth } from '../contexts/AuthContext'
import { usePermissions } from '../hooks/usePermissions'
import { useApi } from '../hooks/useApi'
import { academicsApi } from '../lib/api'

export const DashboardPage: React.FC = () => {
  const { user } = useAuth()
  const { canViewStatistics } = usePermissions()
  const [stats, setStats] = useState({
    totalClasses: 0,
    totalEtudiants: 0,
    totalEvaluations: 0,
    totalEnseignements: 0
  })

  const { execute: fetchStats, loading } = useApi()

  useEffect(() => {
    const loadStats = async () => {
      if (canViewStatistics) {
        // Ici on chargerait les vraies statistiques depuis l'API
        // Pour l'instant, on utilise des données mockées
        setStats({
          totalClasses: 12,
          totalEtudiants: 345,
          totalEvaluations: 28,
          totalEnseignements: 56
        })
      }
    }

    loadStats()
  }, [canViewStatistics])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  }

  const getUserSpecificStats = () => {
    switch (user?.type_utilisateur) {
      case 'etudiant':
        return [
          {
            title: 'Ma classe',
            value: user.classe_actuelle?.nom || 'Non assigné',
            description: user.classe_actuelle?.niveau || '',
            icon: Users
          },
          {
            title: 'Prochaine évaluation',
            value: '3 jours',
            description: 'Partiel de Mathématiques',
            icon: Calendar
          },
          {
            title: 'Moyenne générale',
            value: '14.5/20',
            description: 'Semestre en cours',
            icon: TrendingUp
          }
        ]
      
      case 'enseignant':
        return [
          {
            title: 'Mes enseignements',
            value: user.nombre_enseignements || 0,
            description: 'Enseignements actifs',
            icon: BookOpen
          },
          {
            title: 'Évaluations en attente',
            value: '5',
            description: 'Notes à saisir',
            icon: ClipboardList
          },
          {
            title: 'Prochains cours',
            value: '3',
            description: 'Cette semaine',
            icon: Calendar
          }
        ]
      
      default:
        return [
          {
            title: 'Classes actives',
            value: stats.totalClasses,
            description: 'Classes en cours',
            icon: Users
          },
          {
            title: 'Étudiants inscrits',
            value: stats.totalEtudiants,
            description: 'Total des inscriptions',
            icon: GraduationCap
          },
          {
            title: 'Évaluations',
            value: stats.totalEvaluations,
            description: 'Ce mois-ci',
            icon: ClipboardList
          }
        ]
    }
  }

  return (
    <div className="flex-1 space-y-4 p-4 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">
          {getGreeting()}, {user?.first_name}!
        </h2>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {getUserSpecificStats().map((stat, index) => (
          <StatsCard
            key={index}
            title={stat.title}
            value={stat.value}
            description={stat.description}
            icon={stat.icon}
          />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <div className="col-span-4">
          <RecentActivity />
        </div>
        <div className="col-span-3">
          <QuickActions />
        </div>
      </div>
    </div>
  )
}