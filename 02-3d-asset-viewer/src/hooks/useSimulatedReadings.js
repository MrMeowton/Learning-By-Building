import { useEffect, useState } from 'react'
import { PARTS } from '../data/parts'

// =========================================
// SIMULASI DATA SENSOR "LIVE"
// -----------------------------------------
// Tiap `intervalMs`, semua nilai sensor bergeser sedikit (±jitter)
// dari nilai base-nya. Saat hackathon, ganti isi hook ini dengan
// fetch() ke API / WebSocket — komponen lain tidak perlu diubah.
// =========================================

function initialReadings() {
  const r = {}
  for (const p of PARTS) {
    r[p.id] = {}
    for (const s of p.sensors) r[p.id][s.key] = s.base
  }
  return r
}

// Riwayat dibatasi `historyLen` titik terakhir (untuk sparkline)
export function useSimulatedReadings({ running = true, intervalMs = 1200, jitter = 0.04, historyLen = 40 } = {}) {
  const [state, setState] = useState(() => ({ readings: initialReadings(), history: {} }))

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setState((prev) => {
        const readings = {}
        const history = {}
        for (const p of PARTS) {
          readings[p.id] = {}
          history[p.id] = {}
          for (const s of p.sensors) {
            const noise = (Math.random() * 2 - 1) * jitter * s.base
            const v = Math.max(0, +(s.base + noise).toFixed(1))
            readings[p.id][s.key] = v
            history[p.id][s.key] = [...(prev.history[p.id]?.[s.key] ?? []), v].slice(-historyLen)
          }
        }
        return { readings, history }
      })
    }, intervalMs)
    return () => clearInterval(id)
  }, [running, intervalMs, jitter, historyLen])

  return state
}
