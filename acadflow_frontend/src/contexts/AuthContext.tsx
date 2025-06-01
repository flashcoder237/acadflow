// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

import { authApi, apiClient } from '@/lib/api'
import { useNotifications } from '@/components/ui/notification-system'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { notifySuccess, notifyError } = useNotifications()

  const isAuthenticated = !!user

  // Vérifier le token au chargement
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token')
      if (token) {
        apiClient.setToken(token)
        try {
          // Ici, on pourrait appeler un endpoint pour valider le token
          // Pour l'instant, on fait confiance au token stocké
          const userData = localStorage.getItem('user_data')
          if (userData) {
            setUser(JSON.parse(userData))
          }
        } catch (error) {
          // Token invalide, on nettoie
          localStorage.removeItem('auth_token')
          localStorage.removeItem('user_data')
          apiClient.clearToken()
        }
      }
      setIsLoading(false)
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    try {
      setIsLoading(true)
      const response = await authApi.login({ username, password })
      
      // Stocker le token et les données utilisateur
      apiClient.setToken(response.token)
      localStorage.setItem('user_data', JSON.stringify(response.user))
      
      setUser(response.user)
      
      notifySuccess(
        'Connexion réussie',
        `Bienvenue ${response.user.first_name} ${response.user.last_name}!`
      )
    } catch (error: any) {
      notifyError(
        'Erreur de connexion',
        error.message || 'Identifiants incorrects'
      )
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authApi.logout()
    } catch (error) {
      // Continuer même si la déconnexion côté serveur échoue
      console.warn('Erreur lors de la déconnexion côté serveur:', error)
    } finally {
      // Nettoyer les données locales
      apiClient.clearToken()
      localStorage.removeItem('user_data')
      setUser(null)
      
      notifySuccess('Déconnexion', 'Vous avez été déconnecté avec succès')
    }
  }

  const refreshUser = async () => {
    // Implémentation pour rafraîchir les données utilisateur
    const userData = localStorage.getItem('user_data')
    if (userData) {
      setUser(JSON.parse(userData))
    }
  }

  const value: AuthContextType = {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    refreshUser
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}