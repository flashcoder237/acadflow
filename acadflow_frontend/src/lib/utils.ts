// src/lib/utils.ts - Utilitaires corrigés et étendus
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function formatDateTime(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatDateInput(date: Date | string): string {
  const d = new Date(date)
  return d.toISOString().split('T')[0]
}

export function getMentionFromNote(note: number): string {
  if (note >= 16) return "Très Bien"
  if (note >= 14) return "Bien"
  if (note >= 12) return "Assez Bien"
  if (note >= 10) return "Passable"
  return "Insuffisant"
}

export function getMentionColor(note: number): string {
  if (note >= 16) return "text-green-600"
  if (note >= 14) return "text-blue-600"
  if (note >= 12) return "text-yellow-600"
  if (note >= 10) return "text-gray-600"
  return "text-red-600"
}

export function getMentionBadgeColor(note: number): string {
  if (note >= 16) return "bg-green-100 text-green-800"
  if (note >= 14) return "bg-blue-100 text-blue-800"
  if (note >= 12) return "bg-yellow-100 text-yellow-800"
  if (note >= 10) return "bg-gray-100 text-gray-800"
  return "bg-red-100 text-red-800"
}

export function validateNote(note: number, noteSur: number = 20): boolean {
  return note >= 0 && note <= noteSur
}

export function convertNoteToBase20(note: number, noteSur: number): number {
  if (noteSur === 20) return note
  return (note * 20) / noteSur
}

export function calculatePercentage(obtained: number, total: number): number {
  if (total === 0) return 0
  return Math.round((obtained / total) * 100)
}

export function formatMatricule(matricule: string): string {
  // Format: XX-XXXX ou XXXXXXXX
  if (matricule.length === 8 && !matricule.includes('-')) {
    return `${matricule.slice(0, 2)}-${matricule.slice(2)}`
  }
  return matricule
}

export function getTypeUtilisateurLabel(type: string): string {
  const labels: Record<string, string> = {
    etudiant: 'Étudiant',
    enseignant: 'Enseignant',
    admin: 'Administrateur',
    scolarite: 'Service Scolarité',
    direction: 'Direction'
  }
  return labels[type] || type
}

export function getGradeEnseignantLabel(grade: string): string {
  const labels: Record<string, string> = {
    assistant: 'Assistant',
    maitre_assistant: 'Maître Assistant',
    maitre_conference: 'Maître de Conférences',
    professeur: 'Professeur'
  }
  return labels[grade] || grade
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function generateMatricule(
  annee: number,
  numero: number,
  typePrefix: string = 'ET'
): string {
  const anneeStr = annee.toString().slice(-2)
  const numeroStr = numero.toString().padStart(4, '0')
  return `${typePrefix}${anneeStr}${numeroStr}`
}

export function parseApiError(error: any): string {
  if (error?.response?.data) {
    const data = error.response.data
    
    // Gestion des erreurs de validation Django
    if (data.non_field_errors) {
      return data.non_field_errors[0]
    }
    
    if (data.detail) {
      return data.detail
    }
    
    if (data.message) {
      return data.message
    }
    
    if (data.error) {
      return data.error
    }
    
    // Erreurs de champs spécifiques
    const fieldErrors = Object.entries(data)
      .filter(([key, value]) => Array.isArray(value))
      .map(([key, value]) => `${key}: ${(value as string[]).join(', ')}`)
    
    if (fieldErrors.length > 0) {
      return fieldErrors.join('; ')
    }
  }
  
  if (error?.message) {
    return error.message
  }
  
  return 'Une erreur inconnue est survenue'
}

export function sortByField<T>(
  array: T[],
  field: keyof T,
  direction: 'asc' | 'desc' = 'asc'
): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[field]
    const bVal = b[field]
    
    if (aVal === bVal) return 0
    
    if (direction === 'asc') {
      return aVal < bVal ? -1 : 1
    } else {
      return aVal > bVal ? -1 : 1
    }
  })
}

export function filterBySearch<T>(
  array: T[],
  searchTerm: string,
  searchFields: (keyof T)[]
): T[] {
  if (!searchTerm.trim()) return array
  
  const term = searchTerm.toLowerCase()
  
  return array.filter(item =>
    searchFields.some(field => {
      const value = item[field]
      if (typeof value === 'string') {
        return value.toLowerCase().includes(term)
      }
      if (typeof value === 'number') {
        return value.toString().includes(term)
      }
      return false
    })
  )
}

export function groupBy<T, K extends keyof T>(
  array: T[],
  key: K
): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const group = String(item[key])
    if (!groups[group]) {
      groups[group] = []
    }
    groups[group].push(item)
    return groups
  }, {} as Record<string, T[]>)
}

export function downloadFile(data: Blob, filename: string) {
  const url = window.URL.createObjectURL(data)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.URL.revokeObjectURL(url)
}

export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
) {
  if (data.length === 0) return
  
  const keys = Object.keys(data[0]) as (keyof T)[]
  const headerRow = headers
    ? keys.map(key => headers[key] || String(key)).join(',')
    : keys.join(',')
  
  const csvContent = [
    headerRow,
    ...data.map(row =>
      keys.map(key => {
        const value = row[key]
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`
        }
        return String(value || '')
      }).join(',')
    )
  ].join('\n')
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  downloadFile(blob, filename)
}