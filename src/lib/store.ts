import { create } from 'zustand'

interface ApiLimitsState {
    limits: {
        used: number
        total: number
        lastUpdated?: string
    }
    updateLimits: (used: number, total: number) => void
}

export const useApiLimits = create<ApiLimitsState>((set) => ({
    limits: {
        used: 0,
        total: 0,
    },
    updateLimits: (used: number, total: number) => {
        console.log('Store updateLimits called:', { used, total })
        set((state) => {
            const newState = { ...state, limits: { used, total, lastUpdated: new Date().toISOString() } }
            console.log('Setting new state:', newState)
            return newState
        }, true )
    },
}))

// Debug subscription
useApiLimits.subscribe((state) => {
    console.log('Store limits changed:', state.limits)
})

// Export actions for non-component code
export const apiLimitsActions = {
    updateLimits: (used: string | number, total: string | number) => {
        useApiLimits.setState({
            limits: {
                used: Number(used),
                total: Number(total),
                lastUpdated: new Date().toISOString(),
            },
        })
    },
}
