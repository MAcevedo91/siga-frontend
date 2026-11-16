import { create } from 'zustand'

const STORAGE_KEY = 'siga_modo_privacidad'

export const usePrivacyStore = create((set, get) => ({
  modoPrivacidad: localStorage.getItem(STORAGE_KEY) === 'true',
  pantallaProtegida: false,
  watermarkHabilitada: true,

  toggleModoPrivacidad: () => {
    const nuevoEstado = !get().modoPrivacidad
    localStorage.setItem(STORAGE_KEY, String(nuevoEstado))
    set({ modoPrivacidad: nuevoEstado })
  },

  setModoPrivacidad: (valor) => {
    localStorage.setItem(STORAGE_KEY, String(valor))
    set({ modoPrivacidad: valor })
  },

  bloquearPantalla: () => {
    set({ pantallaProtegida: true })
  },

  desbloquearPantalla: () => {
    set({ pantallaProtegida: false })
  },

  setWatermarkHabilitada: (valor) => {
    set({ watermarkHabilitada: valor })
  },
}))
