// ========================================
// FICHIER: src/router/index.ts - Configuration centralisée des routes
// ========================================

import { RouteConfig } from '@/types';

// Pages enseignant
import TeacherDashboard from '@/pages/TeacherDashboard';
import TeacherStudentsPage from '@/pages/TeacherStudentsPage';
import TeacherValidationPage from '@/pages/TeacherValidationPage';
import EnseignementsPage from '@/pages/EnseignementsPage';
import EvaluationsPage from '@/pages/EvaluationsPage';
import CreateEvaluationPage from '@/pages/CreateEvaluationPage';
import NotesPage from '@/pages/NotesPage';
import StatistiquesPage from '@/pages/StatistiquesPage';

// Pages communes
import ProfilePage from '@/pages/ProfilePage';
import LoginPage from '@/pages/LoginPage';

// Configuration des routes par rôle
export const teacherRoutes: RouteConfig[] = [
  {
    path: '/dashboard',
    element: TeacherDashboard,
    requiredRole: ['enseignant'],
    requireAuth: true
  },
  {
    path: '/enseignements',
    element: EnseignementsPage,
    requiredRole: ['enseignant'],
    requireAuth: true,
    children: [
      {
        path: '/enseignements/:id',
        element: () => <div>Détails enseignement</div>,
        requiredRole: ['enseignant'],
        requireAuth: true
      }
    ]
  },
  {
    path: '/evaluations',
    element: EvaluationsPage,
    requiredRole: ['enseignant'],
    requireAuth: true,
    children: [
      {
        path: '/evaluations/create',
        element: CreateEvaluationPage,
        requiredRole: ['enseignant'],
        requireAuth: true
      },
      {
        path: '/evaluations/:id',
        element: () => <div>Détails évaluation</div>,
        requiredRole: ['enseignant'],
        requireAuth: true
      },
      {
        path: '/evaluations/:id/notes',
        element: NotesPage,
        requiredRole: ['enseignant'],
        requireAuth: true
      },
      {
        path: '/evaluations/:id/validation',
        element: TeacherValidationPage,
        requiredRole: ['enseignant'],
        requireAuth: true
      }
    ]
  },
  {
    path: '/etudiants',
    element: TeacherStudentsPage,
    requiredRole: ['enseignant'],
    requireAuth: true
  },
  {
    path: '/statistiques',
    element: StatistiquesPage,
    requiredRole: ['enseignant'],
    requireAuth: true
  },
  {
    path: '/rapports',
    element: () => <div>Rapports enseignant</div>,
    requiredRole: ['enseignant'],
    requireAuth: true
  },
  {
    path: '/historique',
    element: () => <div>Historique modifications</div>,
    requiredRole: ['enseignant'],
    requireAuth: true
  }
];

export const adminRoutes: RouteConfig[] = [
  {
    path: '/admin',
    element: () => <div>Dashboard Admin</div>,
    requiredRole: ['admin', 'scolarite', 'direction'],
    requireAuth: true,
    children: [
      {
        path: '/admin/users',
        element: () => <div>Gestion utilisateurs</div>,
        requiredRole: ['admin', 'scolarite'],
        requireAuth: true
      },
      {
        path: '/admin/classes',
        element: () => <div>Gestion classes</div>,
        requiredRole: ['admin', 'scolarite'],
        requireAuth: true
      },
      {
        path: '/admin/curriculum',
        element: () => <div>Gestion programmes</div>,
        requiredRole: ['admin'],
        requireAuth: true
      },
      {
        path: '/admin/rapports',
        element: () => <div>Rapports</div>,
        requiredRole: ['admin', 'direction'],
        requireAuth: true
      }
    ]
  }
];

export const studentRoutes: RouteConfig[] = [
  {
    path: '/student',
    element: () => <div>Dashboard Étudiant</div>,
    requiredRole: ['etudiant'],
    requireAuth: true,
    children: [
      {
        path: '/student/notes',
        element: () => <div>Mes notes</div>,
        requiredRole: ['etudiant'],
        requireAuth: true
      },
      {
        path: '/student/planning',
        element: () => <div>Mon planning</div>,
        requiredRole: ['etudiant'],
        requireAuth: true
      }
    ]
  }
];

export const commonRoutes: RouteConfig[] = [
  {
    path: '/login',
    element: LoginPage,
    requireAuth: false
  },
  {
    path: '/profile',
    element: ProfilePage,
    requiredRole: ['enseignant', 'admin', 'scolarite', 'direction', 'etudiant'],
    requireAuth: true
  },
  {
    path: '/help',
    element: () => <div>Aide & Support</div>,
    requiredRole: ['enseignant', 'admin', 'scolarite', 'direction', 'etudiant'],
    requireAuth: true
  }
];

// Routes par défaut selon le rôle
export const getDefaultRouteForRole = (userType: string): string => {
  switch (userType) {
    case 'enseignant':
      return '/dashboard';
    case 'etudiant':
      return '/student';
    case 'admin':
    case 'scolarite':
    case 'direction':
      return '/admin';
    default:
      return '/login';
  }
};

// Navigation selon le rôle
export const getNavigationForRole = (userType: string) => {
  const baseNavigation = [
    {
      label: 'Tableau de bord',
      path: getDefaultRouteForRole(userType),
      icon: 'Home'
    },
    {
      label: 'Mon profil',
      path: '/profile',
      icon: 'User'
    },
    {
      label: 'Aide',
      path: '/help',
      icon: 'HelpCircle'
    }
  ];

  switch (userType) {
    case 'enseignant':
      return [
        ...baseNavigation.slice(0, 1), // Dashboard
        {
          label: 'Mes enseignements',
          path: '/enseignements',
          icon: 'BookOpen'
        },
        {
          label: 'Évaluations',
          path: '/evaluations',
          icon: 'FileText',
          children: [
            {
              label: 'Mes évaluations',
              path: '/evaluations'
            },
            {
              label: 'Nouvelle évaluation',
              path: '/evaluations/create'
            }
          ]
        },
        {
          label: 'Saisie des notes',
          path: '/evaluations?filter=en_attente',
          icon: 'Edit'
        },
        {
          label: 'Mes étudiants',
          path: '/etudiants',
          icon: 'Users'
        },
        {
          label: 'Statistiques',
          path: '/statistiques',
          icon: 'BarChart3'
        },
        {
          label: 'Rapports',
          path: '/rapports',
          icon: 'FileText'
        },
        ...baseNavigation.slice(1) // Profile et Help
      ];

    case 'admin':
    case 'scolarite':
    case 'direction':
      return [
        ...baseNavigation.slice(0, 1), // Dashboard
        {
          label: 'Gestion',
          path: '/admin',
          icon: 'Settings',
          children: [
            {
              label: 'Utilisateurs',
              path: '/admin/users'
            },
            {
              label: 'Classes',
              path: '/admin/classes'
            },
            {
              label: 'Programmes',
              path: '/admin/curriculum'
            }
          ]
        },
        {
          label: 'Rapports',
          path: '/admin/rapports',
          icon: 'BarChart3'
        },
        ...baseNavigation.slice(1) // Profile et Help
      ];

    case 'etudiant':
      return [
        ...baseNavigation.slice(0, 1), // Dashboard
        {
          label: 'Mes notes',
          path: '/student/notes',
          icon: 'Award'
        },
        {
          label: 'Planning',
          path: '/student/planning',
          icon: 'Calendar'
        },
        ...baseNavigation.slice(1) // Profile et Help
      ];

    default:
      return baseNavigation;
  }
};

export default {
  teacherRoutes,
  adminRoutes,
  studentRoutes,
  commonRoutes,
  getDefaultRouteForRole,
  getNavigationForRole
};