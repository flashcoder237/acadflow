
// src/lib/api.ts - Version corrigée
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

class ApiClient {
  private baseURL: string
  private token: string | null = null

  constructor(baseURL: string) {
    this.baseURL = baseURL
    this.token = localStorage.getItem('auth_token')
  }

  setToken(token: string) {
    this.token = token
    localStorage.setItem('auth_token', token)
  }

  clearToken() {
    this.token = null
    localStorage.removeItem('auth_token')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    if (this.token) {
      defaultHeaders.Authorization = `Token ${this.token}`
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new ApiError(
          errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          errorData
        )
      }

      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return await response.json()
      }
      
      return {} as T
    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }
      throw new ApiError(`Erreur réseau: ${error}`, 0)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    let url = endpoint
    if (params) {
      const searchParams = new URLSearchParams()
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value))
        }
      })
      if (searchParams.toString()) {
        url += `?${searchParams.toString()}`
      }
    }
    
    return this.request<T>(url, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

export const apiClient = new ApiClient(API_BASE_URL)

// Services d'API spécialisés
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    apiClient.post<AuthResponse>('/auth/login/', credentials),
  
  logout: () =>
    apiClient.post('/auth/logout/'),
}

export const academicsApi = {
  getAnneeActive: () =>
    apiClient.get<AnneeAcademique>('/academics/annees-academiques/active/'),
  
  getClasses: (params?: any) =>
    apiClient.get<ApiResponse<Classe>>('/academics/classes/', params),
  
  getClasse: (id: number) =>
    apiClient.get<Classe>(`/academics/classes/${id}/`),
  
  getClasseEtudiants: (id: number) =>
    apiClient.get<Etudiant[]>(`/academics/classes/${id}/etudiants/`),
  
  getClasseProgramme: (id: number) =>
    apiClient.get(`/academics/classes/${id}/programme_pedagogique/`),
  
  getUEs: (params?: any) =>
    apiClient.get<ApiResponse<UE>>('/academics/ues/', params),
  
  getUE: (id: number) =>
    apiClient.get<UE>(`/academics/ues/${id}/`),
  
  getECs: (params?: any) =>
    apiClient.get<ApiResponse<EC>>('/academics/ecs/', params),
}

export const evaluationsApi = {
  getEvaluations: (params?: any) =>
    apiClient.get<ApiResponse<Evaluation>>('/evaluations/evaluations/', params),
  
  getEvaluation: (id: number) =>
    apiClient.get<Evaluation>(`/evaluations/evaluations/${id}/`),
  
  getFeuilleNotes: (id: number) =>
    apiClient.get(`/evaluations/evaluations/${id}/feuille_notes/`),
  
  saisirNotes: (id: number, notes: any[]) =>
    apiClient.post(`/evaluations/evaluations/${id}/saisir_notes/`, { notes }),
  
  getNotes: (params?: any) =>
    apiClient.get<ApiResponse<Note>>('/evaluations/notes/', params),
}

export const usersApi = {
  getEtudiants: (params?: any) =>
    apiClient.get<ApiResponse<Etudiant>>('/users/etudiants/', params),
  
  getEtudiant: (id: number) =>
    apiClient.get<Etudiant>(`/users/etudiants/${id}/`),
  
  getEnseignants: (params?: any) =>
    apiClient.get<ApiResponse<Enseignant>>('/users/enseignants/', params),
}