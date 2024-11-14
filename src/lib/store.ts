import { create } from 'zustand'

interface ApiLimitsState {
  limits: {
    used: number
    total: number
  }
  updateLimits: (used: number, total: number) => void
}

export const useApiLimits = create<ApiLimitsState>((set) => ({
  limits: {
    used: 0,
    total: 0
  },
  updateLimits: (used: number, total: number) => {
    console.log('Updating API limits:', { used, total })
    set({ limits: { used, total } })
  },
})) 