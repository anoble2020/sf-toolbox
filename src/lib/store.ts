import { create } from 'zustand'

interface ApiLimits {
  used: number
  total: number
  lastUpdated?: Date
}

interface ApiLimitsStore {
  limits: ApiLimits
  updateLimits: (used: number, total: number) => void
}

export const useApiLimits = create<ApiLimitsStore>((set) => ({
  limits: {
    used: 0,
    total: 0,
  },
  updateLimits: (used: number, total: number) => 
    set({ limits: { used, total, lastUpdated: new Date() } }),
})) 