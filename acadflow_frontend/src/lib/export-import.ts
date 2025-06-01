// src/lib/export-import.ts
import * as XLSX from 'xlsx'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export interface ExportOptions {
  filename?: string
  format?: 'csv' | 'excel' | 'pdf'
  includeHeaders?: boolean
  dateFormat?: string
  customHeaders?: Record<string, string>
}

export interface ImportResult<T> {
  data: T[]
  errors: string[]
  warnings: string[]
  summary: {
    totalRows: number
    validRows: number
    errorRows: number
  }
}

class ExportImportService {
  // Export vers CSV
  exportToCSV<T extends Record<string, any>>(
    data: T[],
    columns: string[],
    options: ExportOptions = {}
  ): void {
    const {
      filename = `export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`,
      includeHeaders = true,
      customHeaders = {}
    } = options

    if (data.length === 0) {
      throw new Error('Aucune donnée à exporter')
    }

    let csvContent = ''

    // Headers
    if (includeHeaders) {
      const headers = columns.map(col => customHeaders[col] || col)
      csvContent += headers.map(h => this.escapeCsvValue(h)).join(',') + '\n'
    }

    // Data rows
    data.forEach(row => {
      const values = columns.map(col => {
        const value = row[col]
        return this.formatCellValue(value)
      })
      csvContent += values.map(v => this.escapeCsvValue(v)).join(',') + '\n'
    })

    this.downloadFile(csvContent, filename, 'text/csv')
  }

  // Export vers Excel
  exportToExcel<T extends Record<string, any>>(
    data: T[],
    columns: string[],
    options: ExportOptions = {}
  ): void {
    const {
      filename = `export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`,
      includeHeaders = true,
      customHeaders = {}
    } = options

    if (data.length === 0) {
      throw new Error('Aucune donnée à exporter')
    }

    // Préparer les données
    const exportData: any[][] = []

    // Headers
    if (includeHeaders) {
      const headers = columns.map(col => customHeaders[col] || col)
      exportData.push(headers)
    }

    // Data rows
    data.forEach(row => {
      const values = columns.map(col => {
        const value = row[col]
        return this.formatCellValue(value)
      })
      exportData.push(values)
    })

    // Créer le workbook
    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.aoa_to_sheet(exportData)

    // Styles pour les headers
    if (includeHeaders && exportData.length > 0) {
      const headerRange = XLSX.utils.encode_range({
        s: { c: 0, r: 0 },
        e: { c: columns.length - 1, r: 0 }
      })
      ws['!ref'] = headerRange
    }

    // Ajuster la largeur des colonnes
    const colWidths = columns.map(col => ({ wch: 15 }))
    ws['!cols'] = colWidths

    XLSX.utils.book_append_sheet(wb, ws, 'Export')

    // Télécharger
    XLSX.writeFile(wb, filename)
  }

  // Import depuis CSV
  async importFromCSV<T>(
    file: File,
    columnMapping: Record<string, keyof T>,
    validator?: (row: Partial<T>) => string[]
  ): Promise<ImportResult<T>> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const text = e.target?.result as string
        const result = this.parseCSV<T>(text, columnMapping, validator)
        resolve(result)
      }
      
      reader.readAsText(file)
    })
  }

  // Import depuis Excel
  async importFromExcel<T>(
    file: File,
    columnMapping: Record<string, keyof T>,
    validator?: (row: Partial<T>) => string[]
  ): Promise<ImportResult<T>> {
    return new Promise((resolve) => {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        
        // Prendre la première feuille
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        
        // Convertir en JSON
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][]
        
        const result = this.parseArrayData<T>(jsonData, columnMapping, validator)
        resolve(result)
      }
      
      reader.readAsArrayBuffer(file)
    })
  }

  // Parser CSV
  private parseCSV<T>(
    csvText: string,
    columnMapping: Record<string, keyof T>,
    validator?: (row: Partial<T>) => string[]
  ): ImportResult<T> {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length === 0) {
      return this.createEmptyResult()
    }

    // Parse headers
    const headers = this.parseCSVLine(lines[0])
    const dataLines = lines.slice(1)

    return this.processImportData(dataLines.map(line => this.parseCSVLine(line)), headers, columnMapping, validator)
  }

  // Parser pour les données en tableau
  private parseArrayData<T>(
    arrayData: any[][],
    columnMapping: Record<string, keyof T>,
    validator?: (row: Partial<T>) => string[]
  ): ImportResult<T> {
    if (arrayData.length === 0) {
      return this.createEmptyResult()
    }

    const headers = arrayData[0].map(h => String(h || ''))
    const dataRows = arrayData.slice(1)

    return this.processImportData(dataRows, headers, columnMapping, validator)
  }

  // Traitement des données d'import
  private processImportData<T>(
    dataRows: any[][],
    headers: string[],
    columnMapping: Record<string, keyof T>,
    validator?: (row: Partial<T>) => string[]
  ): ImportResult<T> {
    const result: ImportResult<T> = {
      data: [],
      errors: [],
      warnings: [],
      summary: {
        totalRows: dataRows.length,
        validRows: 0,
        errorRows: 0
      }
    }

    // Vérifier que les colonnes requises existent
    const requiredColumns = Object.keys(columnMapping)
    const missingColumns = requiredColumns.filter(col => !headers.includes(col))
    
    if (missingColumns.length > 0) {
      result.errors.push(`Colonnes manquantes: ${missingColumns.join(', ')}`)
      return result
    }

    // Traiter chaque ligne
    dataRows.forEach((row, index) => {
      const lineNumber = index + 2 // +2 car on compte la ligne d'en-tête et l'index commence à 0

      try {
        const item: Partial<T> = {}
        let hasData = false

        // Mapper les colonnes
        Object.entries(columnMapping).forEach(([csvColumn, objProperty]) => {
          const columnIndex = headers.indexOf(csvColumn)
          if (columnIndex !== -1 && row[columnIndex] !== undefined) {
            const value = this.parseValue(row[columnIndex])
            if (value !== null && value !== '') {
              item[objProperty] = value
              hasData = true
            }
          }
        })

        // Ignorer les lignes vides
        if (!hasData) {
          result.warnings.push(`Ligne ${lineNumber}: Ligne vide ignorée`)
          return
        }

        // Validation personnalisée
        if (validator) {
          const validationErrors = validator(item)
          if (validationErrors.length > 0) {
            result.errors.push(`Ligne ${lineNumber}: ${validationErrors.join(', ')}`)
            result.summary.errorRows++
            return
          }
        }

        result.data.push(item as T)
        result.summary.validRows++

      } catch (error) {
        result.errors.push(`Ligne ${lineNumber}: Erreur de traitement - ${error}`)
        result.summary.errorRows++
      }
    })

    return result
  }

  // Utilitaires privées
  private escapeCsvValue(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  private formatCellValue(value: any): string {
    if (value === null || value === undefined) {
      return ''
    }
    
    if (value instanceof Date) {
      return format(value, 'dd/MM/yyyy', { locale: fr })
    }
    
    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non'
    }
    
    return String(value)
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++ // Skip next quote
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
    
    result.push(current.trim())
    return result
  }

  private parseValue(value: any): any {
    if (value === null || value === undefined || value === '') {
      return null
    }

    const stringValue = String(value).trim()
    
    // Boolean
    if (stringValue.toLowerCase() === 'oui' || stringValue.toLowerCase() === 'true' || stringValue === '1') {
      return true
    }
    if (stringValue.toLowerCase() === 'non' || stringValue.toLowerCase() === 'false' || stringValue === '0') {
      return false
    }

    // Number
    const numberValue = Number(stringValue)
    if (!isNaN(numberValue) && stringValue.match(/^-?\d+\.?\d*$/)) {
      return numberValue
    }

    // Date
    const datePatterns = [
      /^\d{2}\/\d{2}\/\d{4}$/, // DD/MM/YYYY
      /^\d{4}-\d{2}-\d{2}$/, // YYYY-MM-DD
      /^\d{2}-\d{2}-\d{4}$/, // DD-MM-YYYY
    ]
    
    if (datePatterns.some(pattern => pattern.test(stringValue))) {
      const date = new Date(stringValue)
      if (!isNaN(date.getTime())) {
        return date
      }
    }

    return stringValue
  }

  private downloadFile(content: string, filename: string, mimeType: string): void {
    const blob = new Blob([content], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    window.URL.revokeObjectURL(url)
  }

  private createEmptyResult<T>(): ImportResult<T> {
    return {
      data: [],
      errors: [],
      warnings: [],
      summary: {
        totalRows: 0,
        validRows: 0,
        errorRows: 0
      }
    }
  }
}

export const exportImportService = new ExportImportService()

// Fonctions utilitaires spécifiques pour AcadFlow
export const acadflowExports = {
  // Export des étudiants
  exportEtudiants: (etudiants: any[], options: ExportOptions = {}) => {
    const columns = ['matricule', 'nom_complet', 'email', 'telephone', 'statut_current', 'numero_carte']
    const customHeaders = {
      matricule: 'Matricule',
      nom_complet: 'Nom complet',
      email: 'Email',
      telephone: 'Téléphone',
      statut_current: 'Statut',
      numero_carte: 'N° Carte étudiant'
    }

    return exportImportService.exportToExcel(etudiants, columns, {
      ...options,
      filename: options.filename || `etudiants_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      customHeaders
    })
  },

  // Export des notes
  exportNotes: (notes: any[], options: ExportOptions = {}) => {
    const columns = ['etudiant_matricule', 'etudiant_nom', 'evaluation_nom', 'note_obtenue', 'note_sur_20', 'absent', 'justifie']
    const customHeaders = {
      etudiant_matricule: 'Matricule',
      etudiant_nom: 'Nom étudiant',
      evaluation_nom: 'Évaluation',
      note_obtenue: 'Note obtenue',
      note_sur_20: 'Note /20',
      absent: 'Absent',
      justifie: 'Justifié'
    }

    return exportImportService.exportToExcel(notes, columns, {
      ...options,
      filename: options.filename || `notes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      customHeaders
    })
  },

  // Export des classes
  exportClasses: (classes: any[], options: ExportOptions = {}) => {
    const columns = ['nom', 'code', 'filiere_nom', 'niveau_nom', 'effectif_actuel', 'effectif_max', 'active']
    const customHeaders = {
      nom: 'Nom de la classe',
      code: 'Code',
      filiere_nom: 'Filière',
      niveau_nom: 'Niveau',
      effectif_actuel: 'Effectif actuel',
      effectif_max: 'Effectif maximum',
      active: 'Active'
    }

    return exportImportService.exportToExcel(classes, columns, {
      ...options,
      filename: options.filename || `classes_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      customHeaders
    })
  },

  // Export des évaluations
  exportEvaluations: (evaluations: any[], options: ExportOptions = {}) => {
    const columns = ['nom', 'type_evaluation_nom', 'date_evaluation', 'session_nom', 'coefficient', 'nombre_notes', 'saisie_terminee']
    const customHeaders = {
      nom: 'Nom évaluation',
      type_evaluation_nom: 'Type',
      date_evaluation: 'Date',
      session_nom: 'Session',
      coefficient: 'Coefficient',
      nombre_notes: 'Nb notes',
      saisie_terminee: 'Terminée'
    }

    return exportImportService.exportToExcel(evaluations, columns, {
      ...options,
      filename: options.filename || `evaluations_${format(new Date(), 'yyyy-MM-dd')}.xlsx`,
      customHeaders
    })
  }
}

// Fonctions d'import spécifiques
export const acadflowImports = {
  // Import des étudiants
  importEtudiants: async (file: File) => {
    const columnMapping = {
      'Matricule': 'matricule',
      'Prénom': 'first_name',
      'Nom': 'last_name',
      'Email': 'email',
      'Téléphone': 'telephone',
      'Date de naissance': 'date_naissance',
      'Lieu de naissance': 'lieu_naissance',
      'Adresse': 'adresse'
    }

    const validator = (row: any) => {
      const errors: string[] = []
      
      if (!row.matricule) {
        errors.push('Matricule requis')
      }
      if (!row.first_name) {
        errors.push('Prénom requis')
      }
      if (!row.last_name) {
        errors.push('Nom requis')
      }
      if (row.email && !row.email.includes('@')) {
        errors.push('Email invalide')
      }
      
      return errors
    }

    if (file.name.endsWith('.csv')) {
      return exportImportService.importFromCSV(file, columnMapping, validator)
    } else {
      return exportImportService.importFromExcel(file, columnMapping, validator)
    }
  },

  // Import des notes
  importNotes: async (file: File) => {
    const columnMapping = {
      'Matricule': 'etudiant_matricule',
      'Note': 'note_obtenue',
      'Absent': 'absent',
      'Justifié': 'justifie',
      'Commentaire': 'commentaire'
    }

    const validator = (row: any) => {
      const errors: string[] = []
      
      if (!row.etudiant_matricule) {
        errors.push('Matricule étudiant requis')
      }
      if (row.note_obtenue !== null && (isNaN(row.note_obtenue) || row.note_obtenue < 0 || row.note_obtenue > 20)) {
        errors.push('Note doit être entre 0 et 20')
      }
      
      return errors
    }

    if (file.name.endsWith('.csv')) {
      return exportImportService.importFromCSV(file, columnMapping, validator)
    } else {
      return exportImportService.importFromExcel(file, columnMapping, validator)
    }
  }
}