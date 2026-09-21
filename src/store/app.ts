import { useMemo } from 'react'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { qrCodes as baseQRCodes, business, scanEvents, entries as baseEntries } from '@/lib/data'
import type { ScanEvent } from '@/lib/data'
import type { DataSet, RangeKey, Scope } from '@/lib/metrics'
import { resolveRange } from '@/lib/metrics'
import type { Destination, Entry, FeedbackStatus, QRCodeRecord, QRStatus, QRType } from '@/lib/types'

export type Theme = 'light' | 'dark'

export type QRDraft = {
  label: string
  type: QRType
  outletId: string
  productId?: string
  location?: string
  campaign?: string
  destination: Destination
  destinationUrl: string
}

type AppState = {
  theme: Theme
  signedIn: boolean
  outletId: string | 'all'
  rangeKey: RangeKey
  customRange: { from: string; to: string }
  /** QR codes created inside the app, newest first. */
  createdQRs: QRCodeRecord[]
  /** Edits applied to any QR code — dynamic QRs never need reprinting. */
  qrPatches: Record<string, Partial<QRCodeRecord>>
  /** Entries captured by the live scan experience. */
  submissions: Entry[]
  liveScans: ScanEvent[]
  entryPatches: Record<string, { status?: FeedbackStatus; reply?: string }>
  apiKey: string

  setTheme: (theme: Theme) => void
  toggleTheme: () => void
  setSignedIn: (signedIn: boolean) => void
  setOutlet: (outletId: string | 'all') => void
  setRange: (key: RangeKey, custom?: { from: string; to: string }) => void
  createQR: (draft: QRDraft) => QRCodeRecord
  patchQR: (id: string, patch: Partial<QRCodeRecord>) => void
  setQRStatus: (id: string, status: QRStatus) => void
  recordScan: (qrId: string, outletId: string, productId?: string) => void
  submitEntry: (entry: Entry) => void
  patchEntry: (id: string, patch: { status?: FeedbackStatus; reply?: string }) => void
  setApiKey: (key: string) => void
  resetDemo: () => void
}

const shortCode = () => Math.random().toString(36).slice(2, 8)

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      theme: 'light',
      signedIn: false,
      outletId: 'all',
      rangeKey: '30d',
      customRange: { from: '', to: '' },
      createdQRs: [],
      qrPatches: {},
      submissions: [],
      liveScans: [],
      entryPatches: {},
      apiKey: '',

      setTheme: (theme) => set({ theme }),
      toggleTheme: () => set({ theme: get().theme === 'dark' ? 'light' : 'dark' }),
      setSignedIn: (signedIn) => set({ signedIn }),
      setOutlet: (outletId) => set({ outletId }),
      setRange: (rangeKey, customRange) =>
        set({ rangeKey, ...(customRange ? { customRange } : {}) }),

      createQR: (draft) => {
        const code = shortCode()
        const record: QRCodeRecord = {
          id: `qr-${code}`,
          code,
          businessId: business.id,
          status: 'active',
          createdAt: new Date().toISOString(),
          ...draft,
        }
        set({ createdQRs: [record, ...get().createdQRs] })
        return record
      },

      patchQR: (id, patch) => set({ qrPatches: { ...get().qrPatches, [id]: { ...get().qrPatches[id], ...patch } } }),
      setQRStatus: (id, status) => get().patchQR(id, { status }),

      recordScan: (qrId, outletId, productId) =>
        set({
          liveScans: [
            {
              id: `scn-live-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              createdAt: new Date().toISOString(),
              outletId,
              qrId,
              productId,
              converted: false,
            },
            ...get().liveScans,
          ],
        }),

      submitEntry: (entry) =>
        set({
          submissions: [entry, ...get().submissions],
          liveScans: [
            {
              id: `scn-live-${entry.id}`,
              createdAt: entry.createdAt,
              outletId: entry.outletId,
              qrId: entry.qrId,
              productId: entry.productId,
              converted: true,
              entryId: entry.id,
            },
            ...get().liveScans,
          ],
        }),

      patchEntry: (id, patch) =>
        set({ entryPatches: { ...get().entryPatches, [id]: { ...get().entryPatches[id], ...patch } } }),

      setApiKey: (apiKey) => set({ apiKey }),
      resetDemo: () =>
        set({ createdQRs: [], qrPatches: {}, submissions: [], liveScans: [], entryPatches: {} }),
    }),
    {
      name: 'reviewdot',
      version: 1,
      partialize: ({ theme, signedIn, outletId, rangeKey, customRange, createdQRs, qrPatches, submissions, liveScans, entryPatches, apiKey }) => ({
        theme,
        signedIn,
        outletId,
        rangeKey,
        customRange,
        createdQRs,
        qrPatches,
        submissions,
        liveScans,
        entryPatches,
        apiKey,
      }),
    },
  ),
)

/* ------------------------------------------------------------------ *
 * Derived selectors
 * ------------------------------------------------------------------ */

/** Demo QR codes plus anything created in this browser, with edits applied. */
export function useQRCodes(): QRCodeRecord[] {
  const created = useApp((s) => s.createdQRs)
  const patches = useApp((s) => s.qrPatches)
  return useMemo(
    () => [...created, ...baseQRCodes].map((qr) => ({ ...qr, ...patches[qr.id] })),
    [created, patches],
  )
}

export function useQRCode(codeOrId: string): QRCodeRecord | undefined {
  const codes = useQRCodes()
  return useMemo(
    () => codes.find((qr) => qr.code === codeOrId || qr.id === codeOrId),
    [codes, codeOrId],
  )
}

/** The dataset every chart and table reads: demo history plus live activity. */
export function useDataSet(): DataSet {
  const submissions = useApp((s) => s.submissions)
  const liveScans = useApp((s) => s.liveScans)
  const patches = useApp((s) => s.entryPatches)
  return useMemo(() => {
    const merged = [...submissions, ...baseEntries].map((entry) =>
      patches[entry.id] ? { ...entry, ...patches[entry.id] } : entry,
    )
    return { entries: merged, scans: [...liveScans, ...scanEvents] }
  }, [submissions, liveScans, patches])
}

export function useScope(productId?: string): Scope {
  const outletId = useApp((s) => s.outletId)
  const rangeKey = useApp((s) => s.rangeKey)
  const customRange = useApp((s) => s.customRange)
  return useMemo(
    () => ({ range: resolveRange(rangeKey, customRange), outletId, productId }),
    [rangeKey, customRange, outletId, productId],
  )
}
