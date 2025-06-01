// src/contexts/AuthContext.tsx - Version corrigée
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { authApi, apiClient } from '@/lib/api'
import { useNotifications } from '@/components/ui/notification-system'

// Import des types corrects
import { User, AuthResponse } from '@/types/auth'

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
      console.log('Token trouvé:', !!token) // Debug
      
      if (token) {
        apiClient.setToken(token)
        try {
          // Valider le token avec l'API (optionnel)
          const userData = localStorage.getItem('user_data')
          if (userData) {
            const parsedUser = JSON.parse(userData)
            console.log('Données utilisateur chargées:', parsedUser) // Debug
            setUser(parsedUser)
          }
        } catch (error) {
          console.error('Erreur lors du parsing des données utilisateur:', error)
          // Token ou données invalides, on nettoie
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
      console.log('Tentative de connexion pour:', username) // Debug
      
      const response: AuthResponse = await authApi.login({ username, password })
      console.log('Réponse de connexion:', response) // Debug
      
      // Stocker le token et les données utilisateur
      localStorage.setItem('auth_token', response.token)
      localStorage.setItem('user_data', JSON.stringify(response.user))
      apiClient.setToken(response.token)
      
      setUser(response.user)
      
      notifySuccess(
        'Connexion réussie',
        `Bienvenue ${response.user.first_name} ${response.user.last_name}!`
      )
    } catch (error: any) {
      console.error('Erreur de connexion:', error) // Debug
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
      setIsLoading(true)
      await authApi.logout()
    } catch (error) {
      // Continuer même si la déconnexion côté serveur échoue
      console.warn('Erreur lors de la déconnexion côté serveur:', error)
    } finally {
      // Nettoyer les données locales
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user_data')
      apiClient.clearToken()
      setUser(null)
      setIsLoading(false)
      
      notifySuccess('Déconnexion', 'Vous avez été déconnecté avec succès')
    }
  }

  const refreshUser = async () => {
    // Implémentation pour rafraîchir les données utilisateur
    const userData = localStorage.getItem('user_data')
    if (userData) {
      try {
        setUser(JSON.parse(userData))
      } catch (error) {
        console.error('Erreur lors du refresh user:', error)
      }
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