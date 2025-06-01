// src/components/ui/data-table/DataTable.tsx
import React, { useState, useMemo } from 'react'
import { 
  Search, 
  Filter, 
  Download, 
  Upload, 
  RefreshCw, 
  Settings2,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react'

import { Button } from '../button'
import { Input } from '../input'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem
} from '../dropdown-menu'
import { Badge } from '../badge'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../table'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../card'
import { LoadingSpinner } from '../LoadingSpinner'
import { Checkbox } from '../checkbox'
import { cn } from '@/lib/utils'

export interface DataTableColumn<T> {
  key: keyof T | string
  title: string
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, item: T) => React.ReactNode
  width?: string
  className?: string
  exportable?: boolean
}

export interface DataTableFilter {
  key: string
  label: string
  type: 'text' | 'select' | 'date' | 'number' | 'boolean'
  options?: { label: string; value: any }[]
  placeholder?: string
}

export interface DataTableAction<T> {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: (item: T) => void
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  disabled?: (item: T) => boolean
}

interface DataTableProps<T> {
  data: T[]
  columns: DataTableColumn<T>[]
  filters?: DataTableFilter[]
  actions?: DataTableAction<T>[]
  loading?: boolean
  title?: string
  description?: string
  searchable?: boolean
  searchPlaceholder?: string
  selectable?: boolean
  exportable?: boolean
  importable?: boolean
  onExport?: (data: T[], selectedColumns: string[]) => void
  onImport?: (file: File) => void
  onRefresh?: () => void
  pageSize?: number
  className?: string
  emptyMessage?: string
  customToolbar?: React.ReactNode
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  filters = [],
  actions = [],
  loading = false,
  title,
  description,
  searchable = true,
  searchPlaceholder = "Rechercher...",
  selectable = false,
  exportable = true,
  importable = false,
  onExport,
  onImport,
  onRefresh,
  pageSize = 10,
  className,
  emptyMessage = "Aucune donnée disponible",
  customToolbar
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilters, setActiveFilters] = useState<Record<string, any>>({})
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' } | null>(null)
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(columns.map(col => typeof col.key === 'string' ? col.key : String(col.key)))
  )

  // Filtrage et tri des données
  const filteredData = useMemo(() => {
    let filtered = [...data]

    // Recherche globale
    if (searchTerm) {
      const searchColumns = columns.filter(col => col.filterable !== false)
      filtered = filtered.filter(item =>
        searchColumns.some(col => {
          const value = item[col.key]
          return String(value || '').toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Filtres spécifiques
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        filtered = filtered.filter(item => {
          const itemValue = item[key]
          if (typeof value === 'boolean') {
            return Boolean(itemValue) === value
          }
          return String(itemValue || '').toLowerCase().includes(String(value).toLowerCase())
        })
      }
    })

    // Tri
    if (sortConfig) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key]
        const bValue = b[sortConfig.key]
        
        if (aValue === bValue) return 0
        
        const comparison = aValue < bValue ? -1 : 1
        return sortConfig.direction === 'desc' ? -comparison : comparison
      })
    }

    return filtered
  }, [data, searchTerm, activeFilters, sortConfig, columns])

  // Pagination
  const totalPages = Math.ceil(filteredData.length / pageSize)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const handleSort = (key: string) => {
    setSortConfig(current => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' }
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' }
      }
      return null
    })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRows(new Set(paginatedData.map((_, index) => index)))
    } else {
      setSelectedRows(new Set())
    }
  }

  const handleSelectRow = (index: number, checked: boolean) => {
    const newSelected = new Set(selectedRows)
    if (checked) {
      newSelected.add(index)
    } else {
      newSelected.delete(index)
    }
    setSelectedRows(newSelected)
  }

  const handleExport = () => {
    if (onExport) {
      const exportColumns = columns
        .filter(col => visibleColumns.has(String(col.key)) && col.exportable !== false)
        .map(col => String(col.key))
      onExport(filteredData, exportColumns)
    }
  }

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && onImport) {
      onImport(file)
    }
    event.target.value = ''
  }

  const getSortIcon = (columnKey: string) => {
    if (!sortConfig || sortConfig.key !== columnKey) {
      return null
    }
    return sortConfig.direction === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />
  }

  const activeFilterCount = Object.values(activeFilters).filter(v => v !== undefined && v !== '').length

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            {title && <CardTitle>{title}</CardTitle>}
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          <div className="flex items-center space-x-2">
            {customToolbar}
            {onRefresh && (
              <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            )}
          </div>
        </div>

        {/* Barre d'outils */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 flex items-center space-x-2">
            {searchable && (
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            )}

            {/* Filtres */}
            {filters.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtres
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuLabel>Filtres</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {filters.map((filter) => (
                    <div key={filter.key} className="p-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        {filter.label}
                      </label>
                      {filter.type === 'select' ? (
                        <select
                          className="w-full mt-1 text-sm border rounded px-2 py-1"
                          value={activeFilters[filter.key] || ''}
                          onChange={(e) => setActiveFilters(prev => ({
                            ...prev,
                            [filter.key]: e.target.value
                          }))}
                        >
                          <option value="">Tous</option>
                          {filter.options?.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <Input
                          type={filter.type === 'date' ? 'date' : filter.type === 'number' ? 'number' : 'text'}
                          placeholder={filter.placeholder}
                          value={activeFilters[filter.key] || ''}
                          onChange={(e) => setActiveFilters(prev => ({
                            ...prev,
                            [filter.key]: e.target.value
                          }))}
                          className="mt-1 text-sm"
                        />
                      )}
                    </div>
                  ))}
                  {activeFilterCount > 0 && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setActiveFilters({})}>
                        Effacer les filtres
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {/* Configuration des colonnes */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Colonnes visibles</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {columns.map((column) => (
                  <DropdownMenuCheckboxItem
                    key={String(column.key)}
                    checked={visibleColumns.has(String(column.key))}
                    onCheckedChange={(checked) => {
                      const newVisible = new Set(visibleColumns)
                      if (checked) {
                        newVisible.add(String(column.key))
                      } else {
                        newVisible.delete(String(column.key))
                      }
                      setVisibleColumns(newVisible)
                    }}
                  >
                    {column.title}
                  </DropdownMenuCheckboxItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Export */}
            {exportable && (
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            )}

            {/* Import */}
            {importable && (
              <label>
                <Button variant="outline" size="sm" asChild>
                  <span>
                    <Upload className="h-4 w-4 mr-2" />
                    Importer
                  </span>
                </Button>
                <input
                  type="file"
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleImport}
                />
              </label>
            )}
          </div>
        </div>

        {/* Statistiques */}
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div>
            {selectedRows.size > 0 ? (
              <span>{selectedRows.size} élément(s) sélectionné(s)</span>
            ) : (
              <span>{filteredData.length} élément(s) trouvé(s)</span>
            )}
          </div>
          {totalPages > 1 && (
            <div>
              Page {currentPage} sur {totalPages}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size={32} />
          </div>
        ) : paginatedData.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {emptyMessage}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {selectable && (
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedRows.size === paginatedData.length}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                    )}
                    {columns
                      .filter(col => visibleColumns.has(String(col.key)))
                      .map((column) => (
                        <TableHead
                          key={String(column.key)}
                          className={cn(
                            column.className,
                            column.sortable !== false && "cursor-pointer hover:bg-muted/50"
                          )}
                          style={{ width: column.width }}
                          onClick={() => column.sortable !== false && handleSort(String(column.key))}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{column.title}</span>
                            {column.sortable !== false && getSortIcon(String(column.key))}
                          </div>
                        </TableHead>
                      ))}
                    {actions.length > 0 && (
                      <TableHead className="text-right w-20">Actions</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((item, index) => (
                    <TableRow key={index}>
                      {selectable && (
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(index)}
                            onCheckedChange={(checked) => handleSelectRow(index, checked)}
                          />
                        </TableCell>
                      )}
                      {columns
                        .filter(col => visibleColumns.has(String(col.key)))
                        .map((column) => (
                          <TableCell
                            key={String(column.key)}
                            className={column.className}
                          >
                            {column.render 
                              ? column.render(item[column.key], item)
                              : String(item[column.key] || '')
                            }
                          </TableCell>
                        ))}
                      {actions.length > 0 && (
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map((action, actionIndex) => (
                                <DropdownMenuItem
                                  key={actionIndex}
                                  onClick={() => action.onClick(item)}
                                  disabled={action.disabled?.(item)}
                                >
                                  {action.icon && <action.icon className="h-4 w-4 mr-2" />}
                                  {action.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    Premier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                </div>

                <div className="flex items-center space-x-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <Button
                        key={page}
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    )
                  })}
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Dernier
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}