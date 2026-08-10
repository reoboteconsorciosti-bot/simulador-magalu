'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Simulation } from './types'

interface SharedSimulationState {
  clientName: string
  creditValue: number | null
  months: number | null
  contemplationMonth: number | null
  incc: number | null
  lanceEmbutido: number | null
  taxaTotal: number | null
  tipoReducao: string
  isLoading: boolean
  setSharedField: <K extends keyof SharedSimulationState>(key: K, value: SharedSimulationState[K]) => void
  clearSharedFields: () => void
}

// Usuários padrão inicializados com dados padrão
const initialUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Administrador',
    email: '',
    password: '',
    role: 'ADMIN',
    office: 'Matriz',
    phone: '(11) 99999-9999',
    socialMedia: '@reobote',
    active: true,
  },
  {
    id: '2',
    name: 'Vendedor',
    email: '',
    password: '',
    role: 'VENDEDOR',
    office: 'Filial SP',
    phone: '(11) 98888-8888',
    socialMedia: '@vendedor.reobote',
    active: true,
  },
]

interface AuthState {
  user: User | null
  users: (User & { password: string })[]
  setUser: (user: User | null) => void
  logout: () => void
  addUser: (user: Omit<User, 'id'> & { password: string }) => void
  updateUser: (id: string, data: Partial<User>) => void
  toggleUserActive: (id: string) => void
}

interface SimulationState {
  simulations: Simulation[]
  addSimulation: (simulation: Omit<Simulation, 'id' | 'createdAt'>) => string
  updateSimulationStatus: (id: string, status: Simulation['status']) => void
  deleteSimulation: (id: string) => void
  getSimulationsByUser: (userId: string) => Simulation[]
  getAllSimulations: () => Simulation[]
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      users: initialUsers,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null }),
      addUser: (userData) => {
        const newUser = {
          ...userData,
          id: Date.now().toString(),
        }
        set((state) => ({ users: [...state.users, newUser] }))
      },
      updateUser: (id, data) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, ...data } : u
          ),
        }))
      },
      toggleUserActive: (id) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === id ? { ...u, active: !u.active } : u
          ),
        }))
      },
    }),
    {
      name: 'reobote-auth',
    }
  )
)

export const useSimulationStore = create<SimulationState>()(
  persist(
    (set, get) => ({
      simulations: [],
      addSimulation: (simulation) => {
        const id = Date.now().toString()
        const newSimulation: Simulation = {
          ...simulation,
          id,
          createdAt: new Date(),
        }
        set((state) => ({
          simulations: [newSimulation, ...state.simulations],
        }))
        return id
      },
      updateSimulationStatus: (id, status) => {
        set((state) => ({
          simulations: state.simulations.map((s) =>
            s.id === id ? { ...s, status } : s
          ),
        }))
      },
      deleteSimulation: (id) => {
        set((state) => ({
          simulations: state.simulations.filter((s) => s.id !== id),
        }))
      },
      getSimulationsByUser: (userId) => {
        return get().simulations.filter((s) => s.userId === userId)
      },
      getAllSimulations: () => get().simulations,
    }),
    {
      name: 'reobote-simulations',
    }
  )
)

export const useSharedSimulationStore = create<SharedSimulationState>()(
  (set) => ({
    clientName: '',
    creditValue: 110000,
    months: 220,
    contemplationMonth: 49,
    incc: 5,
    lanceEmbutido: 0,
    taxaTotal: 27,
    tipoReducao: 'meia-parcela',
    isLoading: false,
    setSharedField: (key, value) => {
      console.log(`[STORE setSharedField] key=${key}, raw value=`, value)
      const VALID_DEFAULTS: Record<string, number | string> = {
        creditValue: 110000,
        months: 220,
        contemplationMonth: 49,
        incc: 5,
        lanceEmbutido: 0,
        taxaTotal: 27,
      }
      let safeValue: number | string = value as number | string
      if (key in VALID_DEFAULTS) {
        const num = Number(value)
        if (value === null || value === undefined || value === '' || isNaN(num)) {
          safeValue = VALID_DEFAULTS[key]
          console.log(`[STORE setSharedField] CORRIGINDO null/empty: key=${key} usando default=`, safeValue)
        } else {
          safeValue = num
          if ((key === 'months' || key === 'contemplationMonth') && num <= 0) {
            safeValue = VALID_DEFAULTS[key]
            console.log(`[STORE setSharedField] CORRIGINDO <= 0: key=${key} usando default=`, safeValue)
          }
        }
      }
      console.log(`[STORE setSharedField] key=${key}, gravando safeValue=`, safeValue)
      set({ [key]: safeValue })
    },
    clearSharedFields: () => {
      console.log('🧹 Limpando todos os campos na store...')
      set({
        clientName: '',
        creditValue: 110000,
        months: 220,
        contemplationMonth: 49,
        incc: 5,
        lanceEmbutido: 0,
        taxaTotal: 27,
        tipoReducao: 'meia-parcela',
        isLoading: false,
      })
    },
  })
)
