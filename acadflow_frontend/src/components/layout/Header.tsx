// src/components/layout/Header.tsx
import React from 'react'
import { Bell, Settings, User, LogOut, Menu } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { Badge } from '../ui/badge'
import { SidebarTrigger } from '../ui/sidebar'
import { NotificationHistory, useNotifications } from '../ui/notification-system'
import { useAuth } from '../../contexts/AuthContext'

export const Header: React.FC = () => {
  const { user, logout } = useAuth()
  const { notifications } = useNotifications()
  
  const unreadNotifications = notifications.filter(n => !n.read).length

  const handleLogout = async () => {
    await logout()
  }

  const getUserDisplayRole = (type: string) => {
    const roles = {
      admin: 'Administrateur',
      scolarite: 'Scolarité',
      direction: 'Direction',
      enseignant: 'Enseignant',
      etudiant: 'Étudiant'
    }
    return roles[type as keyof typeof roles] || type
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="mr-4 flex">
          <SidebarTrigger />
          <div className="ml-4 flex items-center space-x-2">
            <h1 className="text-lg font-semibold">AcadFlow</h1>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            {/* Barre de recherche - à implémenter plus tard */}
          </div>
          
          <nav className="flex items-center space-x-2">
            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                  <Bell className="h-4 w-4" />
                  {unreadNotifications > 0 && (
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 text-xs flex items-center justify-center p-0"
                    >
                      {unreadNotifications > 9 ? '9+' : unreadNotifications}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <NotificationHistory />
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Menu utilisateur */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative h-8 w-8 rounded-full">
                  <User className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.first_name} {user?.last_name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {getUserDisplayRole(user?.type_utilisateur || '')}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>Profil</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Paramètres</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Se déconnecter</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
        </div>
      </div>
    </header>
  )
}