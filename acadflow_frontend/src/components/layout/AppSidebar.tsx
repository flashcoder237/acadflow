// src/components/layout/AppSidebar.tsx - Sidebar avec design moderne amélioré
import React from 'react'
import { 
  Home, 
  Users, 
  GraduationCap, 
  BookOpen, 
  ClipboardList, 
  BarChart3,
  Settings,
  Calendar,
  FileText,
  Building2,
  Route,
  Download,
  Target,
  Layers,
  Award,
  TrendingUp,
  ChevronRight,
  User,
  LogOut
} from 'lucide-react'
import { useLocation } from 'react-router-dom'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from '../ui/sidebar'
import { usePermissions } from '../../hooks/usePermissions'

const menuItems = [
  {
    title: 'Tableau de bord',
    url: '/dashboard',
    icon: Home,
    roles: ['admin', 'scolarite', 'direction', 'enseignant', 'etudiant'],
    gradient: 'from-blue-500 to-purple-600'
  },
  // Gestion institutionnelle
  {
    title: 'Domaines',
    url: '/domaines',
    icon: Building2,
    roles: ['admin', 'direction'],
    gradient: 'from-emerald-500 to-teal-600'
  },
  {
    title: 'Filières',
    url: '/filieres',
    icon: Target,
    roles: ['admin', 'scolarite', 'direction'],
    gradient: 'from-orange-500 to-red-600'
  },
  {
    title: 'Multi-niveaux',
    url: '/multiniveau',
    icon: Layers,
    roles: ['admin', 'scolarite', 'direction'],
    gradient: 'from-violet-500 to-purple-600'
  },
  // Gestion académique de base
  {
    title: 'Classes',
    url: '/classes',
    icon: Users,
    roles: ['admin', 'scolarite', 'direction', 'enseignant'],
    gradient: 'from-cyan-500 to-blue-600'
  },
  {
    title: 'Étudiants',
    url: '/etudiants',
    icon: GraduationCap,
    roles: ['admin', 'scolarite', 'direction', 'enseignant'],
    gradient: 'from-green-500 to-emerald-600'
  },
  {
    title: 'Enseignements',
    url: '/enseignements',
    icon: BookOpen,
    roles: ['admin', 'scolarite', 'direction', 'enseignant'],
    gradient: 'from-indigo-500 to-blue-600'
  },
  // Gestion pédagogique
  {
    title: 'UEs',
    url: '/ues',
    icon: Award,
    roles: ['admin', 'scolarite', 'direction', 'enseignant'],
    gradient: 'from-yellow-500 to-orange-600'
  },
  {
    title: 'Évaluations',
    url: '/evaluations',
    icon: ClipboardList,
    roles: ['admin', 'scolarite', 'direction', 'enseignant'],
    gradient: 'from-pink-500 to-rose-600'
  },
  {
    title: 'Notes',
    url: '/notes',
    icon: FileText,
    roles: ['admin', 'scolarite', 'direction', 'enseignant', 'etudiant'],
    gradient: 'from-slate-500 to-gray-600'
  },
  // Parcours personnalisés
  {
    title: 'Mon Parcours',
    url: '/parcours',
    icon: Route,
    roles: ['etudiant'],
    gradient: 'from-teal-500 to-cyan-600'
  },
  // Exports et rapports
  {
    title: 'Exports',
    url: '/exports',
    icon: Download,
    roles: ['admin', 'scolarite', 'direction', 'enseignant', 'etudiant'],
    gradient: 'from-blue-500 to-indigo-600'
  },
  {
    title: 'Rapports',
    url: '/rapports',
    icon: TrendingUp,
    roles: ['admin', 'scolarite', 'direction'],
    gradient: 'from-green-500 to-teal-600'
  },
  {
    title: 'Statistiques',
    url: '/statistiques',
    icon: BarChart3,
    roles: ['admin', 'scolarite', 'direction'],
    gradient: 'from-purple-500 to-violet-600'
  }
]

const adminItems = [
  {
    title: 'Utilisateurs',
    url: '/utilisateurs',
    icon: Users,
    roles: ['admin', 'scolarite'],
    gradient: 'from-red-500 to-pink-600'
  },
  {
    title: 'Année académique',
    url: '/annee-academique',
    icon: Calendar,
    roles: ['admin', 'scolarite'],
    gradient: 'from-amber-500 to-yellow-600'
  },
  {
    title: 'Configuration',
    url: '/configuration',
    icon: Settings,
    roles: ['admin'],
    gradient: 'from-gray-500 to-slate-600'
  }
]

const getUserTypeLabel = (type: string) => {
  const labels = {
    'admin': 'Administrateur',
    'scolarite': 'Scolarité',
    'direction': 'Direction',
    'enseignant': 'Enseignant',
    'etudiant': 'Étudiant'
  }
  return labels[type] || type
}

const getUserTypeColor = (type: string) => {
  const colors = {
    'admin': 'from-red-500 to-pink-600',
    'scolarite': 'from-blue-500 to-indigo-600',
    'direction': 'from-purple-500 to-violet-600',
    'enseignant': 'from-green-500 to-emerald-600',
    'etudiant': 'from-orange-500 to-yellow-600'
  }
  return colors[type] || 'from-gray-500 to-slate-600'
}

export const AppSidebar: React.FC = () => {
  const location = useLocation()
  const { user, isAdmin, isScolarite } = usePermissions()

  const isActive = (url: string) => {
    return location.pathname === url || location.pathname.startsWith(url + '/')
  }

  const canAccessItem = (item: any) => {
    return item.roles.includes(user?.type_utilisateur)
  }

  return (
    <Sidebar collapsible="icon" className="border-r-0 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
      <SidebarHeader className="border-b border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 px-4 py-4">
          <div className="relative">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-400 border-2 border-white dark:border-slate-800"></div>
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AcadFlow
            </span>
            <span className={`text-xs font-medium px-2 py-1 rounded-full bg-gradient-to-r ${getUserTypeColor(user?.type_utilisateur)} text-white shadow-sm`}>
              {getUserTypeLabel(user?.type_utilisateur)}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent className="bg-transparent">
        <SidebarGroup className="px-2">
          <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems
                .filter(canAccessItem)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                      className={`
                        group relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md
                        ${isActive(item.url) 
                          ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg transform scale-[1.02]' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }
                      `}
                    >
                      <a href={item.url} className="flex items-center gap-3 px-4 py-3">
                        <div className={`
                          flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200
                          ${isActive(item.url) 
                            ? 'bg-white/20 text-white' 
                            : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                          }
                        `}>
                          <item.icon className="h-4 w-4" />
                        </div>
                        <span className="font-medium">{item.title}</span>
                        {isActive(item.url) && (
                          <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                        )}
                        {isActive(item.url) && (
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
                        )}
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isScolarite) && (
          <SidebarGroup className="px-2 mt-6">
            <SidebarGroupLabel className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Administration
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminItems
                  .filter(canAccessItem)
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                        className={`
                          group relative overflow-hidden rounded-xl transition-all duration-200 hover:shadow-md
                          ${isActive(item.url) 
                            ? 'bg-gradient-to-r ' + item.gradient + ' text-white shadow-lg transform scale-[1.02]' 
                            : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }
                        `}
                      >
                        <a href={item.url} className="flex items-center gap-3 px-4 py-3">
                          <div className={`
                            flex items-center justify-center h-8 w-8 rounded-lg transition-all duration-200
                            ${isActive(item.url) 
                              ? 'bg-white/20 text-white' 
                              : 'bg-slate-100 dark:bg-slate-800 group-hover:bg-slate-200 dark:group-hover:bg-slate-700'
                            }
                          `}>
                            <item.icon className="h-4 w-4" />
                          </div>
                          <span className="font-medium">{item.title}</span>
                          {isActive(item.url) && (
                            <ChevronRight className="h-4 w-4 ml-auto opacity-70" />
                          )}
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-slate-200 dark:border-slate-700 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm">
        {/* Profil utilisateur */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer group">
            <div className="relative">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                {user?.nom?.charAt(0) || <User className="h-4 w-4" />}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-400 border-2 border-white dark:border-slate-800"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-slate-900 dark:text-slate-100 truncate">
                {user?.nom || 'Utilisateur'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {user?.email || 'email@example.com'}
              </p>
            </div>
            <LogOut className="h-4 w-4 text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
          </div>
        </div>
        
        {/* Version info */}
        <div className="px-4 pb-4">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                AcadFlow v2.0.0
              </span>
            </div>
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}