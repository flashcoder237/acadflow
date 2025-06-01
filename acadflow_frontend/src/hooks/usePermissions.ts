// src/hooks/usePermissions.ts
import { useAuth } from '../contexts/AuthContext'

export function usePermissions() {
  const { user } = useAuth()

  const isAdmin = user?.type_utilisateur === 'admin'
  const isScolarite = user?.type_utilisateur === 'scolarite'
  const isDirection = user?.type_utilisateur === 'direction'
  const isEnseignant = user?.type_utilisateur === 'enseignant'
  const isEtudiant = user?.type_utilisateur === 'etudiant'

  const canManageUsers = isAdmin || isScolarite
  const canManageClasses = isAdmin || isScolarite
  const canManageEvaluations = isAdmin || isScolarite || isEnseignant
  const canViewAllStudents = isAdmin || isScolarite || isDirection
  const canViewAllNotes = isAdmin || isScolarite || isDirection
  const canModifyNotes = isAdmin || isScolarite || isEnseignant
  const canViewStatistics = isAdmin || isScolarite || isDirection

  return {
    user,
    isAdmin,
    isScolarite,
    isDirection,
    isEnseignant,
    isEtudiant,
    canManageUsers,
    canManageClasses,
    canManageEvaluations,
    canViewAllStudents,
    canViewAllNotes,
    canModifyNotes,
    canViewStatistics
  }
}
