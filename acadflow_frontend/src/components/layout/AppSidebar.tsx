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
  FileText
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
    roles: ['admin', 'scolarite', 'direction', 'enseignant', 'etudiant']
  },
  {
    title: 'Classes',
    url: '/classes',
    icon: Users,
    roles: ['admin', 'scolarite', 'direction', 'enseignant']
  },
  {
    title: 'Étudiants',
    url: '/etudiants',
    icon: GraduationCap,
    roles: ['admin', 'scolarite', 'direction', 'enseignant']
  },
  {
    title: 'Enseignements',
    url: '/enseignements',
    icon: BookOpen,
    roles: ['admin', 'scolarite', 'direction', 'enseignant']
  },
  {
    title: 'Évaluations',
    url: '/evaluations',
    icon: ClipboardList,
    roles: ['admin', 'scolarite', 'direction', 'enseignant']
  },
  {
    title: 'Notes',
    url: '/notes',
    icon: FileText,
    roles: ['admin', 'scolarite', 'direction', 'enseignant', 'etudiant']
  },
  {
    title: 'Planning',
    url: '/planning',
    icon: Calendar,
    roles: ['admin', 'scolarite', 'direction', 'enseignant', 'etudiant']
  },
  {
    title: 'Statistiques',
    url: '/statistiques',
    icon: BarChart3,
    roles: ['admin', 'scolarite', 'direction']
  }
]

const adminItems = [
  {
    title: 'Gestion utilisateurs',
    url: '/admin/users',
    icon: Users,
    roles: ['admin', 'scolarite']
  },
  {
    title: 'Configuration',
    url: '/admin/config',
    icon: Settings,
    roles: ['admin']
  }
]

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
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <GraduationCap className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold">AcadFlow</span>
            <span className="text-xs text-muted-foreground">
              {user?.type_utilisateur === 'admin' && 'Administration'}
              {user?.type_utilisateur === 'scolarite' && 'Scolarité'}
              {user?.type_utilisateur === 'direction' && 'Direction'}
              {user?.type_utilisateur === 'enseignant' && 'Enseignant'}
              {user?.type_utilisateur === 'etudiant' && 'Étudiant'}
            </span>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter(canAccessItem)
                .map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      asChild 
                      isActive={isActive(item.url)}
                      tooltip={item.title}
                    >
                      <a href={item.url}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isScolarite) && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems
                  .filter(canAccessItem)
                  .map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        asChild 
                        isActive={isActive(item.url)}
                        tooltip={item.title}
                      >
                        <a href={item.url}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </a>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 py-1">
          <div className="text-xs text-muted-foreground">
            v1.0.0
          </div>
        </div>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  )
}