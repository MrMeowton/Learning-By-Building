import { PARTS, STATUS, partStatus, sensorStatus } from '../data/parts'

// =========================================
// <InfoPanel> — panel samping
// -----------------------------------------
// Tanpa pilihan : daftar semua komponen + ringkasan status
// Ada pilihan   : detail komponen + nilai sensor + grafik mini (sparkline)
// =========================================

function Sparkline({ values, sensor }) {
  if (values.length < 2) return <div className="spark spark--empty" />
  const w = 120
  const h = 32
  const min = Math.min(...values, sensor.warn * 0.85)
  const max = Math.max(...values, sensor.warn * 1.05)
  const x = (i) => (i / (values.length - 1)) * w
  const y = (v) => h - ((v - min) / (max - min || 1)) * h
  const pts = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const color = STATUS[sensorStatus(sensor, values.at(-1))].color
  return (
    <svg className="spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
      {/* garis ambang warning */}
      <line x1="0" x2={w} y1={y(sensor.warn)} y2={y(sensor.warn)} className="spark__warn" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.8" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

export default function InfoPanel({ readings, history, selectedId, onSelect }) {
  const part = PARTS.find((p) => p.id === selectedId)

  const counts = PARTS.reduce((acc, p) => {
    const s = partStatus(p, readings)
    acc[s] = (acc[s] ?? 0) + 1
    return acc
  }, {})

  return (
    <aside className="panel">
      <header className="panel__header">
        <p className="eyebrow">Unit Pompa · Line A</p>
        <h1>Asset 3D View</h1>
        <div className="summary">
          {Object.entries(STATUS).map(([key, s]) => (
            <div key={key} className="summary__item">
              <span className="dot" style={{ background: s.color }} />
              <strong>{counts[key] ?? 0}</strong>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </header>

      {!part && (
        <section className="panel__body">
          <p className="hint">Klik komponen di model 3D atau pilih dari daftar.</p>
          <ul className="part-list">
            {PARTS.map((p) => {
              const s = partStatus(p, readings)
              return (
                <li key={p.id}>
                  <button className="part-row" onClick={() => onSelect(p.id)}>
                    <span className="dot" style={{ background: STATUS[s].color }} />
                    <span className="part-row__name">{p.name}</span>
                    <span className="part-row__code">{p.code}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {part && (
        <section className="panel__body">
          <button className="back" onClick={() => onSelect(null)}>
            ← Semua komponen
          </button>

          <div className="detail__head">
            <div>
              <p className="eyebrow">{part.code}</p>
              <h2>{part.name}</h2>
            </div>
            <span className={`badge badge--${partStatus(part, readings)}`}>
              {STATUS[partStatus(part, readings)].label}
            </span>
          </div>
          <p className="detail__desc">{part.description}</p>

          <div className="sensors">
            {part.sensors.map((s) => {
              const v = readings[part.id][s.key]
              const st = sensorStatus(s, v)
              return (
                <div key={s.key} className="sensor">
                  <div className="sensor__top">
                    <span className="sensor__label">{s.label}</span>
                    <span className="sensor__value" style={{ color: STATUS[st].color }}>
                      {v}
                      <small>{s.unit}</small>
                    </span>
                  </div>
                  <Sparkline values={history[part.id]?.[s.key] ?? []} sensor={s} />
                  <div className="sensor__limits">
                    <span>Warning ≥ {s.warn}</span>
                    <span>Critical ≥ {s.crit}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </aside>
  )
}
