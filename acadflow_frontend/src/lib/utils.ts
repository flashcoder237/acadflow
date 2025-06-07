// ========================================
// FICHIER: src/lib/utils.ts
// ========================================

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions) {
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric'
  }
  
  return new Intl.DateTimeFormat('fr-FR', { ...defaultOptions, ...options }).format(
    new Date(date)
  )
}

export function formatDateTime(date: string | Date) {
  return formatDate(date, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

export function formatNote(note: number, noteSur: number = 20) {
  if (noteSur === 20) {
    return `${note.toFixed(2)}/20`
  }
  const noteConverted = (note * 20) / noteSur
  return `${noteConverted.toFixed(2)}/20 (${note.toFixed(2)}/${noteSur})`
}

export function getMention(moyenne: number) {
  if (moyenne >= 16) return "Très Bien"
  if (moyenne >= 14) return "Bien"  
  if (moyenne >= 12) return "Assez Bien"
  if (moyenne >= 10) return "Passable"
  return "Insuffisant"
}

export function getMentionColor(moyenne: number) {
  if (moyenne >= 16) return "text-green-600"
  if (moyenne >= 14) return "text-blue-600"
  if (moyenne >= 12) return "text-orange-600"
  if (moyenne >= 10) return "text-gray-600"
  return "text-red-600"
}

export function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function generateMatricule(prefix: string = "ETU") {
  const year = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
  return `${prefix}${year}${random}`
}