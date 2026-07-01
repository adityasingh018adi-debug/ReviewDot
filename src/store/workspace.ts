import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const DEFAULT_WIDGET_ORDER = ['trend', 'sentiment', 'activity', 'insights', 'platforms', 'heatmap']

interface WorkspaceState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  widgetOrder: string[]
  setWidgetOrder: (order: string[]) => void
  onboardingDone: boolean
  completeOnboarding: () => void
  assistantOpen: boolean
  setAssistantOpen: (open: boolean) => void
  paletteOpen: boolean
  setPaletteOpen: (open: boolean) => void
}

export const useWorkspace = create<WorkspaceState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      widgetOrder: DEFAULT_WIDGET_ORDER,
      setWidgetOrder: (widgetOrder) => set({ widgetOrder }),
      onboardingDone: false,
      completeOnboarding: () => set({ onboardingDone: true }),
      assistantOpen: false,
      setAssistantOpen: (assistantOpen) => set({ assistantOpen }),
      paletteOpen: false,
      setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
    }),
    {
      name: 'reviewdot-workspace',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        widgetOrder: s.widgetOrder,
        onboardingDone: s.onboardingDone,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<WorkspaceState>
        const order =
          Array.isArray(p.widgetOrder) &&
          p.widgetOrder.length === DEFAULT_WIDGET_ORDER.length &&
          DEFAULT_WIDGET_ORDER.every((id) => p.widgetOrder!.includes(id))
            ? p.widgetOrder
            : DEFAULT_WIDGET_ORDER
        return { ...current, ...p, widgetOrder: order }
      },
    },
  ),
)

interface Toast {
  id: number
  title: string
  body?: string
  tone: 'success' | 'error' | 'info'
}

interface ToastState {
  toasts: Toast[]
  push: (t: Omit<Toast, 'id'>) => void
  dismiss: (id: number) => void
}

let toastId = 0

export const useToasts = create<ToastState>((set) => ({
  toasts: [],
  push: (t) => {
    const id = ++toastId
    set((s) => ({ toasts: [...s.toasts, { ...t, id }].slice(-4) }))
    setTimeout(() => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })), 4200)
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((x) => x.id !== id) })),
}))
