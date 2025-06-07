// ========================================
// FICHIER: src/components/layout/DashboardLayout.tsx - Layout principal du dashboard complet
// ========================================

import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  X, 
  Home, 
  BookOpen, 
  FileText, 
  BarChart3, 
  Settings, 
  LogOut, 
  User,
  Bell,
  ChevronDown,
  Calendar,
  GraduationCap,
  Users,
  ClipboardList,
  Award,
  HelpCircle,
  Search,
  Plus,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore, useIsEnseignant, useIsAdmin } from '@/stores/authStore';
import { useAppStore, useNotificationActions } from '@/stores/appStore';
import { cn } from '@/lib/utils';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  roles?: string[];
  children?: Omit<SidebarItem, 'children'>[];
}

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications] = useState([
    { id: 1, title: 'Nouvelle évaluation à corriger', time: '5 min', read: false },
    { id: 2, title: 'Rapport mensuel disponible', time: '1h', read: false },
    { id: 3, title: 'Mise à jour système', time: '2h', read: true }
  ]);
  
  const { user, logout, isAuthenticated } = useAuthStore();
  const { etablissement, anneeAcademique } = useAppStore();
  const { showSuccess } = useNotificationActions();
  const isEnseignant = useIsEnseignant();
  const isAdmin = useIsAdmin();

  // Redirection si pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Navigation principale selon le rôle
  const sidebarItems: SidebarItem[] = [
    {
      id: 'dashboard',
      label: 'Tableau de bord',
      icon: Home,
      path: '/dashboard'
    },
    // Section Enseignement (pour enseignants)
    ...(isEnseignant ? [
      {
        id: 'enseignements',
        label: 'Mes enseignements',
        icon: BookOpen,
        path: '/enseignements',
        roles: ['enseignant']
      },
      {
        id: 'evaluations',
        label: 'Évaluations',
        icon: FileText,
        path: '/evaluations',
        roles: ['enseignant'],
        children: [
          {
            id: 'evaluations-list',
            label: 'Mes évaluations',
            icon: FileText,
            path: '/evaluations'
          },
          {
            id: 'evaluations-create',
            label: 'Nouvelle évaluation',
            icon: Plus,
            path: '/evaluations/create'
          }
        ]
      },
      {
        id: 'notes',
        label: 'Saisie des notes',
        icon: ClipboardList,
        path: '/notes',
        roles: ['enseignant'],
        badge: '3'
      },
      {
        id: 'statistiques',
        label: 'Statistiques',
        icon: BarChart3,
        path: '/statistiques',
        roles: ['enseignant']
      }
    ] : []),
    
    // Section Administration (pour admins)
    ...(isAdmin ? [
      {
        id: 'gestion',
        label: 'Gestion',
        icon: Settings,
        path: '/admin',
        roles: ['admin', 'scolarite', 'direction'],
        children: [
          {
            id: 'users',
            label: 'Utilisateurs',
            icon: Users,
            path: '/admin/users'
          },
          {
            id: 'classes',
            label: 'Classes',
            icon: GraduationCap,
            path: '/admin/classes'
          },
          {
            id: 'curriculum',
            label: 'Programmes',
            icon: BookOpen,
            path: '/admin/curriculum'
          }
        ]
      },
      {
        id: 'rapports',
        label: 'Rapports',
        icon: Award,
        path: '/admin/rapports',
        roles: ['admin', 'direction']
      }
    ] : []),
    
    // Section Étudiant (pour étudiants)
    ...(user?.type_utilisateur === 'etudiant' ? [
      {
        id: 'notes-etudiant',
        label: 'Mes notes',
        icon: Award,
        path: '/student/notes',
        roles: ['etudiant']
      },
      {
        id: 'planning',
        label: 'Planning',
        icon: Calendar,
        path: '/student/planning',
        roles: ['etudiant']
      }
    ] : []),
    
    // Section commune
    {
      id: 'profile',
      label: 'Mon profil',
      icon: User,
      path: '/profile'
    },
    {
      id: 'help',
      label: 'Aide & Support',
      icon: HelpCircle,
      path: '/help'
    }
  ];

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  // Fermer les menus quand on clique ailleurs
  useEffect(() => {
    const handleClickOutside = () => {
      setUserMenuOpen(false);
    };

    if (userMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      return () => document.removeEventListener('click', handleClickOutside);
    }
  }, [userMenuOpen]);

  // Gestion du raccourci clavier pour la recherche
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('search-input')?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredSidebarItems = sidebarItems.filter(item => 
    !item.roles || item.roles.includes(user?.type_utilisateur || '')
  );

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out z-50 flex flex-col",
        "lg:translate-x-0 lg:static lg:z-auto",
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo et établissement */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              {etablissement?.logo ? (
                <img 
                  src={etablissement.logo} 
                  alt={etablissement.acronyme}
                  className="w-8 h-8 object-contain"
                />
              ) : (
                <GraduationCap className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="font-bold text-gray-900 truncate">
                {etablissement?.acronyme || 'AcadFlow'}
              </h2>
              <p className="text-xs text-gray-500 truncate">
                Gestion académique
              </p>
            </div>
          </div>
        </div>

        {/* Année académique actuelle */}
        {anneeAcademique && (
          <div className="px-6 py-3 bg-blue-50 border-b border-blue-100">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {anneeAcademique.libelle}
              </span>
              {anneeAcademique.active && (
                <Badge variant="success" className="text-xs">
                  Active
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Barre de recherche dans la sidebar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              id="search-input"
              type="text"
              placeholder="Rechercher... (Ctrl+K)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 text-sm"
            />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {filteredSidebarItems.map((item) => (
            <div key={item.id}>
              <SidebarItem 
                item={item} 
                isActive={isActivePath(item.path)}
                onItemClick={() => setSidebarOpen(false)}
              />
            </div>
          ))}
        </nav>

        {/* Profil utilisateur dans la sidebar */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.matricule}
              </p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              {/* Menu burger et titre */}
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="w-5 h-5" />
                </Button>

                {/* Titre de la page */}
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">
                    {getPageTitle(location.pathname)}
                  </h1>
                </div>
              </div>

              {/* Recherche desktop */}
              <div className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    type="text"
                    placeholder="Rechercher partout..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9"
                  />
                  <kbd className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>

              {/* Actions header */}
              <div className="flex items-center gap-3">
                {/* Actions rapides selon le rôle */}
                {isEnseignant && (
                  <Button 
                    size="sm" 
                    onClick={() => navigate('/evaluations/create')}
                    className="hidden sm:flex"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Évaluation
                  </Button>
                )}

                {/* Messages */}
                <Button variant="ghost" size="icon" className="relative">
                  <MessageSquare className="w-5 h-5" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                  >
                    2
                  </Badge>
                </Button>

                {/* Notifications */}
                <div className="relative">
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="w-5 h-5" />
                    {unreadNotifications > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-1 -right-1 w-5 h-5 text-xs flex items-center justify-center p-0"
                      >
                        {unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </div>

                {/* Menu utilisateur */}
                <div className="relative">
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2 px-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserMenuOpen(!userMenuOpen);
                    }}
                  >
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="hidden sm:block text-left">
                      <p className="text-sm font-medium">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {user?.type_utilisateur}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4" />
                  </Button>

                  {/* Dropdown menu utilisateur */}
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50">
                      {/* Informations utilisateur */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-sm text-gray-500">{user?.email}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {user?.type_utilisateur}
                        </Badge>
                      </div>

                      {/* Actions */}
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/profile');
                        }}
                      >
                        <User className="w-4 h-4" />
                        Mon profil
                      </button>
                      
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/settings');
                        }}
                      >
                        <Settings className="w-4 h-4" />
                        Paramètres
                      </button>

                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/help');
                        }}
                      >
                        <HelpCircle className="w-4 h-4" />
                        Aide
                      </button>

                      <hr className="my-1" />
                      
                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                      >
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Composant pour les éléments de la sidebar
interface SidebarItemProps {
  item: SidebarItem;
  isActive: boolean;
  onItemClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, onItemClick }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const handleClick = () => {
    if (item.children) {
      setExpanded(!expanded);
    } else {
      onItemClick();
      navigate(item.path);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive 
            ? "bg-blue-50 text-blue-700 border border-blue-200" 
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <item.icon className={cn(
          "w-5 h-5",
          isActive ? "text-blue-600" : "text-gray-400"
        )} />
        <span className="flex-1 text-left">{item.label}</span>
        {item.badge && (
          <Badge variant="secondary" className="text-xs">
            {item.badge}
          </Badge>
        )}
        {item.children && (
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            expanded ? "rotate-180" : ""
          )} />
        )}
      </button>

      {/* Sous-menu */}
      {item.children && expanded && (
        <div className="ml-6 mt-2 space-y-1">
          {item.children.map((child) => (
            <button
              key={child.id}
              onClick={() => {
                onItemClick();
                navigate(child.path);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive && location.pathname === child.path
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              )}
            >
              <child.icon className="w-4 h-4" />
              <span>{child.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Fonction helper pour obtenir le titre de la page
const getPageTitle = (pathname: string): string => {
  const routes: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/enseignements': 'Mes enseignements',
    '/evaluations': 'Évaluations',
    '/evaluations/create': 'Nouvelle évaluation',
    '/notes': 'Saisie des notes',
    '/statistiques': 'Statistiques',
    '/profile': 'Mon profil',
    '/admin': 'Administration',
    '/admin/users': 'Gestion des utilisateurs',
    '/admin/classes': 'Gestion des classes',
    '/admin/rapports': 'Rapports',
    '/student/notes': 'Mes notes',
    '/student/planning': 'Mon planning',
    '/help': 'Aide & Support'
  };

  // Chercher la route la plus spécifique
  const sortedRoutes = Object.keys(routes).sort((a, b) => b.length - a.length);
  const matchedRoute = sortedRoutes.find(route => pathname.startsWith(route));
  
  return matchedRoute ? routes[matchedRoute] : 'AcadFlow';
};

export default DashboardLayout;