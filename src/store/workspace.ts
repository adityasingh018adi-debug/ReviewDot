import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { ReviewStatus } from '@/lib/data'

export const DEFAULT_WIDGET_ORDER = ['trend', 'sentiment', 'activity', 'insights', 'platforms', 'heatmap']

export type Theme = 'dark' | 'light'

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
  theme: Theme
  toggleTheme: () => void
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
      theme: 'dark',
      toggleTheme: () => set((s) => ({ theme: s.theme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'reviewdot-workspace',
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        widgetOrder: s.widgetOrder,
        onboardingDone: s.onboardingDone,
        theme: s.theme,
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

export interface ReviewOverride {
  status?: ReviewStatus
  publishedReply?: string
}

interface ReviewActionsState {
  overrides: Record<string, ReviewOverride>
  publishReply: (reviewId: string, reply: string) => void
  setStatus: (reviewId: string, status: ReviewStatus) => void
}

/** Optimistic, locally-persisted review actions — approvals and status changes survive reloads. */
export const useReviewActions = create<ReviewActionsState>()(
  persist(
    (set) => ({
      overrides: {},
      publishReply: (reviewId, reply) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [reviewId]: { ...s.overrides[reviewId], status: 'responded', publishedReply: reply },
          },
        })),
      setStatus: (reviewId, status) =>
        set((s) => ({
          overrides: { ...s.overrides, [reviewId]: { ...s.overrides[reviewId], status } },
        })),
    }),
    { name: 'reviewdot-review-actions' },
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
