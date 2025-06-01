// src/hooks/useApi.ts - Hook corrigé pour les appels API
import { useState } from 'react'
import { ApiError } from '../lib/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiResult<T> extends UseApiState<T> {
  execute: (apiCall: () => Promise<T>) => Promise<T | null>
  refetch: () => Promise<void>
}

export function useApi<T>(): UseApiResult<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })

  const [lastApiCall, setLastApiCall] = useState<(() => Promise<T>) | null>(null)

  const execute = async (apiCall: () => Promise<T>): Promise<T | null> => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    setLastApiCall(() => apiCall)
    
    try {
      console.log('Exécution de l\'appel API...') // Debug
      const data = await apiCall()
      console.log('Appel API réussi:', data) // Debug
      setState({ data, loading: false, error: null })
      return data
    } catch (error) {
      console.error('Erreur dans useApi:', error) // Debug
      let errorMessage = 'Une erreur est survenue'
      
      if (error instanceof ApiError) {
        errorMessage = error.message
        
        // Redirection automatique si token expiré
        if (error.status === 401) {
          // Le contexte Auth gérera la redirection
          window.location.href = '/login'
        }
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setState({ data: null, loading: false, error: errorMessage })
      return null
    }
  }

  const refetch = async () => {
    if (lastApiCall) {
      await execute(lastApiCall)
    }
  }

  return {
    ...state,
    execute,
    refetch
  }
}

// Version alternative pour les appels avec dépendances (ancien comportement)
export function useApiWithDeps<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> & { refetch: () => Promise<void> } {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null
  })

  const fetchData = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }))
    
    try {
      const data = await apiCall()
      setState({ data, loading: false, error: null })
    } catch (error) {
      let errorMessage = 'Une erreur est survenue'
      
      if (error instanceof ApiError) {
        errorMessage = error.message
      } else if (error instanceof Error) {
        errorMessage = error.message
      }
      
      setState({ data: null, loading: false, error: errorMessage })
    }
  }

  React.useEffect(() => {
    fetchData()
  }, dependencies)

  return {
    ...state,
    refetch: fetchData
  }
}