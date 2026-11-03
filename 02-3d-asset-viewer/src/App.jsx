import { useEffect, useRef, useState } from 'react'
import Viewer from './components/Viewer'
import { CAMERA_VIEWS, goToView } from './data/cameraViews'
import InfoPanel from './components/InfoPanel'
import { useSimulatedReadings } from './hooks/useSimulatedReadings'
import { STATUS } from './data/parts'

// =========================================
// <App> — menyatukan state & layout
// -----------------------------------------
// State yang dibagi antara panel (HTML) dan kanvas (3D):
// - selectedId : komponen yang sedang difokuskan
// - explode    : 0..1, seberapa jauh komponen dipisah
// - showLabels : tampilkan label semua komponen
// - running    : mesin berputar & data sensor mengalir
// =========================================

export default function App() {
  const controlsRef = useRef(null)
  const [selectedId, setSelectedId] = useState(null)
  const [explode, setExplode] = useState(0)
  const [showLabels, setShowLabels] = useState(true)
  const [running, setRunning] = useState(true)

  // Data sensor + riwayatnya (untuk grafik mini di panel)
  const { readings, history } = useSimulatedReadings({ running })

  // Tombol Esc = batal pilih
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && setSelectedId(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="layout">
      <InfoPanel readings={readings} history={history} selectedId={selectedId} onSelect={setSelectedId} />

      <main className="stage">
        <Viewer
          controlsRef={controlsRef}
          readings={readings}
          selectedId={selectedId}
          onSelect={setSelectedId}
          explode={explode}
          showLabels={showLabels}
          running={running}
        />

        {/* ---------- Toolbar melayang di atas kanvas ---------- */}
        <div className="toolbar">
          <div className="toolbar__group">
            {Object.entries(CAMERA_VIEWS).map(([key, v]) => (
              <button
                key={key}
                className="chip"
                onClick={() => {
                  setSelectedId(null)
                  goToView(controlsRef.current, key)
                }}
              >
                {v.label}
              </button>
            ))}
          </div>

          <label className="toolbar__group slider">
            <span>Explode</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={explode}
              onChange={(e) => setExplode(+e.target.value)}
            />
          </label>

          <div className="toolbar__group">
            <button className={`chip ${showLabels ? 'chip--on' : ''}`} onClick={() => setShowLabels((v) => !v)}>
              Label
            </button>
            <button className={`chip ${running ? 'chip--on' : ''}`} onClick={() => setRunning((v) => !v)}>
              {running ? '❚❚ Stop' : '▶ Run'}
            </button>
          </div>
        </div>

        {/* ---------- Legenda & petunjuk ---------- */}
        <div className="legend">
          {Object.values(STATUS).map((s) => (
            <span key={s.label}>
              <i className="dot" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
          <span className="legend__hint">Drag putar · Scroll zoom · Klik kanan geser · Esc batal</span>
        </div>

        <div className={`live ${running ? 'live--on' : ''}`}>{running ? 'LIVE' : 'PAUSED'}</div>
      </main>
    </div>
  )
}
