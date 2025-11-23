import { create } from "zustand"
import { api } from "../services/api"

export interface UserPreferences {
  id: string
  userId: string
  language: string
  autoRefreshEnabled: boolean
  autoRefreshInterval: number | null
  autoCheckinEnabled?: boolean
  autoCheckinWindowStart?: string | null
  autoCheckinWindowEnd?: string | null
  newApiUrl?: string | null
  newApiToken?: string | null
  newApiUserId?: string | null
  newApiModelSyncEnabled?: boolean
  newApiModelSyncInterval?: number | null
  webdavUrl?: string | null
  webdavUsername?: string | null
  webdavPassword?: string | null
  webdavAutoSyncEnabled?: boolean
  webdavAutoSyncInterval?: number | null
  webdavSyncStrategy?: string | null
  createdAt: string
  updatedAt: string
}

interface PreferencesState {
  preferences: UserPreferences | null
  isLoading: boolean
  loadPreferences: () => Promise<void>
  updatePreferences: (data: Partial<UserPreferences>) => Promise<void>
}

export const usePreferencesStore = create<PreferencesState>((set) => ({
  preferences: null,
  isLoading: false,

  loadPreferences: async () => {
    set({ isLoading: true })
    try {
      const response = await api.getPreferences()
      set({
        preferences: response.data.data,
        isLoading: false
      })
    } catch (error) {
      console.error("Failed to load preferences:", error)
      set({ isLoading: false })
    }
  },

  updatePreferences: async (data: Partial<UserPreferences>) => {
    try {
      const response = await api.updatePreferences(data)
      set({ preferences: response.data.data })
    } catch (error) {
      console.error("Failed to update preferences:", error)
      throw error
    }
  }
}))

