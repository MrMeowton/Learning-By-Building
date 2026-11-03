// DEMO: contoh pemakaian modul timemachine
import { useState } from 'react'
import { makeDegradationSeries, TimeMachineReplay } from './features/timemachine'

// Data historis — di project utama ini datang dari sensor / API
const ASSETS = {
  reliability: {
    tab: 'Reliability · Bearing pompa P-101',
    series: makeDegradationSeries({ days: 56 }),
    threshold: 7.1,
    unit: 'mm/s',
    events: [{ t: 20, title: 'Inspeksi rutin', text: 'tidak ada temuan' }],
  },
  energy: {
    tab: 'Energy · Suhu lilitan trafo TR-03',
    series: makeDegradationSeries({ days: 60, base: 68, noise: 1.2, onset: 25, amp: 1.1, growth: 0.1, seed: 3 }),
    threshold: 95,
    unit: '°C',
    events: [{ t: 24, title: 'Beban puncak', text: 'penambahan lini produksi' }],
  },
}

export default function App() {
  const [key, setKey] = useState('reliability')
  const a = ASSETS[key]

  return (
    <main className="page">
      <nav className="tabs">
        {Object.entries(ASSETS).map(([k, v]) => (
          <button key={k} className={k === key ? 'is-on' : ''} onClick={() => setKey(k)}>
            {v.tab}
          </button>
        ))}
      </nav>

      {/* key → reset mesin waktu saat ganti aset */}
      <TimeMachineReplay
        key={key}
        title={a.tab}
        series={a.series}
        threshold={a.threshold}
        unit={a.unit}
        events={a.events}
      />

      <p className="hint">
        Geser slider ke belakang lalu tekan ▶ · klik/drag grafik untuk lompat waktu · ← → (Shift = cepat), Spasi, Home/End
      </p>
    </main>
  )
}
