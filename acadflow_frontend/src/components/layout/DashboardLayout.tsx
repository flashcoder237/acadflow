// ========================================
// FICHIER: src/components/layout/DashboardLayout.tsx - Layout complet avec router centralisé
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
  MessageSquare,
  Edit,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAuthStore, useIsEnseignant, useIsAdmin } from '@/stores/authStore';
import { useAppStore, useNotificationActions } from '@/stores/appStore';
import { getNavigationForRole, getDefaultRouteForRole } from '@/router';
import { cn } from '@/lib/utils';

// Mapping des icônes pour la navigation
const iconMap = {
  Home,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  Users,
  GraduationCap,
  Award,
  Calendar,
  User,
  HelpCircle,
  Edit,
  ClipboardList,
  Plus
};

interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  badge?: string;
  children?: Omit<NavigationItem, 'children'>[];
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
  const { etablissement, anneeAcademique, loadInitialData } = useAppStore();
  const { showSuccess, showError } = useNotificationActions();
  const isEnseignant = useIsEnseignant();
  const isAdmin = useIsAdmin();

  // Redirection si pas authentifié
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Obtenir la navigation selon le rôle de l'utilisateur depuis le router centralisé
  const navigationItems = React.useMemo(() => {
    if (!user?.type_utilisateur) return [];
    
    const routerNavigation = getNavigationForRole(user.type_utilisateur);
    
    // Convertir la navigation du router en format attendu par le layout
    const convertNavigation = (navItems: any[]): NavigationItem[] => {
      return navItems.map(item => ({
        label: item.label,
        path: item.path,
        icon: item.icon,
        badge: item.badge,
        children: item.children ? convertNavigation(item.children) : undefined
      }));
    };
    
    return convertNavigation(routerNavigation);
  }, [user?.type_utilisateur]);

  // Ajouter les badges dynamiques selon les données réelles
  const enhancedNavigationItems = React.useMemo(() => {
    return navigationItems.map(item => {
      // Ajouter des badges dynamiques selon le contexte
      let badge = item.badge;
      
      if (isEnseignant) {
        if (item.path === '/evaluations?filter=en_attente' || item.path.includes('notes')) {
          // Badge pour les évaluations en attente (à récupérer depuis l'API)
          badge = '3'; // Exemple
        }
      }
      
      return { ...item, badge };
    });
  }, [navigationItems, isEnseignant]);

  const handleLogout = async () => {
    try {
      await logout();
      showSuccess('Déconnexion réussie');
      navigate('/login');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
      showError('Erreur', 'Problème lors de la déconnexion');
    }
  };

  const handleRefreshData = async () => {
    try {
      await loadInitialData();
      showSuccess('Données actualisées');
    } catch (error) {
      showError('Erreur', 'Impossible d\'actualiser les données');
    }
  };

  const isActivePath = (path: string) => {
    // Nettoyer le path des paramètres de requête pour la comparaison
    const cleanPath = path.split('?')[0];
    const defaultRoute = getDefaultRouteForRole(user?.type_utilisateur || '');
    
    if (cleanPath === defaultRoute) {
      return location.pathname === cleanPath;
    }
    return location.pathname.startsWith(cleanPath);
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

  // Fermer la sidebar mobile quand on change de route
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Mobile Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out flex flex-col",
        "lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
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
            {/* Bouton fermer pour mobile */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
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
                <Badge variant="default" className="text-xs bg-green-100 text-green-800">
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
          {enhancedNavigationItems.map((item) => (
            <div key={item.path}>
              <SidebarItem 
                item={item} 
                isActive={isActivePath(item.path)}
                onItemClick={() => setSidebarOpen(false)}
              />
            </div>
          ))}
        </nav>

        {/* Informations utilisateur et actions rapides */}
        <div className="p-4 border-t border-gray-200 space-y-3">
          {/* Statut de connexion */}
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <div className="w-2 h-2 bg-green-400 rounded-full"></div>
            <span>En ligne</span>
          </div>

          {/* Profil utilisateur dans la sidebar */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
            <div className="w-8 h-8 bg-gradient-to-r from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
              {user?.photo ? (
                <img 
                  src={user.photo} 
                  alt={`${user.first_name} ${user.last_name}`}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-white" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                {user?.matricule}
              </p>
              <Badge variant="outline" className="mt-1 text-xs">
                {user?.type_utilisateur}
              </Badge>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0">
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
                    {getPageTitle(location.pathname, user?.type_utilisateur)}
                  </h1>
                  {/* Breadcrumb ou sous-titre si nécessaire */}
                  {location.pathname.includes('/evaluations/') && (
                    <p className="text-sm text-gray-500">
                      Gestion des évaluations et notes
                    </p>
                  )}
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
                {/* Bouton de rafraîchissement */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleRefreshData}
                  title="Actualiser les données"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>

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

                {isAdmin && (
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => navigate('/admin/users')}
                    className="hidden sm:flex"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Gestion
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
                      {user?.photo ? (
                        <img 
                          src={user.photo} 
                          alt={`${user?.first_name} ${user?.last_name}`}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-4 h-4 text-white" />
                      )}
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
                        <p className="text-xs text-gray-400">{user?.matricule}</p>
                        <Badge variant="outline" className="mt-1 text-xs">
                          {user?.type_utilisateur}
                        </Badge>
                      </div>

                      {/* Actions du menu */}
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

                      {/* Actions spécifiques selon le rôle */}
                      {isEnseignant && (
                        <>
                          <button
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              setUserMenuOpen(false);
                              navigate('/statistiques');
                            }}
                          >
                            <BarChart3 className="w-4 h-4" />
                            Mes statistiques
                          </button>
                          <button
                            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => {
                              setUserMenuOpen(false);
                              navigate('/historique');
                            }}
                          >
                            <ClipboardList className="w-4 h-4" />
                            Historique
                          </button>
                        </>
                      )}

                      <button
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        onClick={() => {
                          setUserMenuOpen(false);
                          navigate('/help');
                        }}
                      >
                        <HelpCircle className="w-4 h-4" />
                        Aide & Support
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
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Composant pour les éléments de la sidebar
interface SidebarItemProps {
  item: NavigationItem;
  isActive: boolean;
  onItemClick: () => void;
}

const SidebarItem: React.FC<SidebarItemProps> = ({ item, isActive, onItemClick }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Obtenir l'icône depuis le mapping
  const IconComponent = iconMap[item.icon as keyof typeof iconMap] || HelpCircle;

  const handleClick = () => {
    if (item.children) {
      setExpanded(!expanded);
    } else {
      onItemClick();
      navigate(item.path);
    }
  };

  // Vérifier si un des enfants est actif
  const hasActiveChild = item.children?.some(child => 
    location.pathname.startsWith(child.path.split('?')[0])
  );

  return (
    <div>
      <button
        onClick={handleClick}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
          isActive || hasActiveChild
            ? "bg-blue-50 text-blue-700 border border-blue-200" 
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        )}
      >
        <IconComponent className={cn(
          "w-5 h-5",
          isActive || hasActiveChild ? "text-blue-600" : "text-gray-400"
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
      {item.children && (expanded || hasActiveChild) && (
        <div className="ml-6 mt-2 space-y-1">
          {item.children.map((child) => {
            const ChildIcon = iconMap[child.icon as keyof typeof iconMap] || FileText;
            const childActive = location.pathname.startsWith(child.path.split('?')[0]);
            
            return (
              <button
                key={child.path}
                onClick={() => {
                  onItemClick();
                  navigate(child.path);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                  childActive
                    ? "bg-blue-50 text-blue-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                )}
              >
                <ChildIcon className="w-4 h-4" />
                <span>{child.label}</span>
                {child.badge && (
                  <Badge variant="secondary" className="text-xs">
                    {child.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

// Fonction helper pour obtenir le titre de la page basé sur la configuration des routes
const getPageTitle = (pathname: string, userType?: string): string => {
  // Titres par défaut basés sur les routes du router
  const routeTitles: Record<string, string> = {
    '/dashboard': 'Tableau de bord',
    '/enseignements': 'Mes enseignements',
    '/evaluations': 'Évaluations',
    '/evaluations/create': 'Nouvelle évaluation',
    '/etudiants': 'Mes étudiants',
    '/statistiques': 'Statistiques',
    '/rapports': 'Rapports',
    '/historique': 'Historique',
    '/profile': 'Mon profil',
    '/help': 'Aide & Support',
    
    // Routes admin
    '/admin': 'Administration',
    '/admin/users': 'Gestion des utilisateurs',
    '/admin/classes': 'Gestion des classes',
    '/admin/curriculum': 'Gestion des programmes',
    '/admin/rapports': 'Rapports administratifs',
    
    // Routes étudiant
    '/student': 'Espace étudiant',
    '/student/notes': 'Mes notes',
    '/student/planning': 'Mon planning'
  };

  // Chercher la route la plus spécifique
  const sortedRoutes = Object.keys(routeTitles).sort((a, b) => b.length - a.length);
  const matchedRoute = sortedRoutes.find(route => pathname.startsWith(route));
  
  if (matchedRoute) {
    return routeTitles[matchedRoute];
  }

  // Extraire l'ID de la route pour les pages de détail
  const dynamicRoutePatterns = [
    { pattern: /^\/evaluations\/(\d+)\/notes$/, title: 'Saisie des notes' },
    { pattern: /^\/evaluations\/(\d+)\/validation$/, title: 'Validation des notes' },
    { pattern: /^\/evaluations\/(\d+)$/, title: 'Détails de l\'évaluation' },
    { pattern: /^\/enseignements\/(\d+)$/, title: 'Détails de l\'enseignement' }
  ];

  for (const route of dynamicRoutePatterns) {
    if (route.pattern.test(pathname)) {
      return route.title;
    }
  }

  // Titre par défaut selon le rôle
  switch (userType) {
    case 'enseignant':
      return 'Espace enseignant';
    case 'etudiant':
      return 'Espace étudiant';
    case 'admin':
    case 'scolarite':
    case 'direction':
      return 'Administration';
    default:
      return 'AcadFlow';
  }
};

export default DashboardLayout;