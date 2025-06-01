// src/lib/utils.ts
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