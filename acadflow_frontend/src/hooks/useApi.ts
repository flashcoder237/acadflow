// src/hooks/useApi.ts
import { useState, useCallback } from 'react'
import { ApiError } from '../lib/api'
import { useNotifications } from '@/components/ui/notification-system'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

interface UseApiOptions {
  showErrorNotification?: boolean
  showSuccessNotification?: boolean
  successMessage?: string
}

export function useApi<T>() {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: false,
    error: null
  })
  
  const { notifyError, notifySuccess } = useNotifications()

  const execute = useCallback(async (
    apiCall: () => Promise<T>,
    options: UseApiOptions = {}
  ): Promise<T | null> => {
    const {
      showErrorNotification = true,
      showSuccessNotification = false,
      successMessage = 'Opération réussie'
    } = options

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await apiCall()
      setState(prev => ({ ...prev, data: result, loading: false }))
      
      if (showSuccessNotification) {
        notifySuccess('Succès', successMessage)
      }
      
      return result
    } catch (error) {
      const errorMessage = error instanceof ApiError 
        ? error.message 
        : 'Une erreur inattendue s\'est produite'
      
      setState(prev => ({ ...prev, error: errorMessage, loading: false }))
      
      if (showErrorNotification) {
        notifyError('Erreur', errorMessage)
      }
      
      return null
    }
  }, [notifyError, notifySuccess])

  const reset = useCallback(() => {
    setState({
      data: null,
      loading: false,
      error: null
    })
  }, [])

  return {
    ...state,
    execute,
    reset
  }
}