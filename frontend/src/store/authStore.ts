import { create } from "zustand"
import { api } from "../services/api"

interface User {
  id: string
  email: string
  username: string
}

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  login: async (username: string, password: string) => {
    try {
      const response = await api.login({ username, password })
      set({
        user: response.data.data.user,
        isAuthenticated: true
      })
    } catch (error: any) {
      throw new Error(error.response?.data?.error || "登录失败")
    }
  },

  logout: async () => {
    try {
      await api.logout()
      set({
        user: null,
        isAuthenticated: false
      })
    } catch (error) {
      console.error("Logout error:", error)
    }
  },

  checkAuth: async () => {
    try {
      const response = await api.getCurrentUser()
      set({
        user: response.data.data,
        isAuthenticated: true,
        isLoading: false
      })
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false
      })
    }
  }
}))

