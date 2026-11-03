import { useEffect, useMemo } from 'react'
import { analyzeSeries, forecastAt } from './analysis'
import { scoreColor } from './color'
import { ReplayChart } from './ReplayChart'
import { useReplay } from './useReplay'
import './timemachine.css'

const defaultTime = (t) => `Hari ${Math.floor(t)}`
const defaultDuration = (d) => `${Math.round(d)} hari`
const SPEEDS = [1, 2, 4]

/**
 * Komponen siap pakai: grafik + slider waktu + tombol putar + panel cerita.
 *
 * Mulai di "sekarang" (ujung kanan). Geser slider ke belakang → anomali mengecil,
 * lalu tekan Putar → anomali tumbuh pelan-pelan dan AI terlihat memperingatkan
 * jauh sebelum alarm konvensional berbunyi.
 */
export function TimeMachineReplay({
  series,
  threshold,
  title = 'Time-machine replay',
  unit = '',
  formatTime = defaultTime,
  formatDuration = defaultDuration,
  events = [],
  start = 'end',
  pointsPerSecond = 24,
  height = 340,
  analysisOptions,
  forecastOptions,
  onIndexChange,
}) {
  const analysis = useMemo(
    () => analyzeSeries(series, { threshold, ...analysisOptions }),
    [series, threshold, analysisOptions],
  )
  const last = series.length - 1
  const startIndex = start === 'end' ? last : start === 'start' ? 0 : start
  const rp = useReplay(series.length, { start: startIndex, pointsPerSecond })
  const { index, setIndex } = rp

  useEffect(() => {
    onIndexChange?.(index, series[index])
  }, [index, series, onIndexChange])

  const { detectIndex, crossIndex, score, smooth } = analysis
  const stage = crossIndex >= 0 && index >= crossIndex ? 'alarm' : detectIndex >= 0 && index >= detectIndex ? 'warning' : 'normal'
  // Proyeksi hanya relevan sebelum alarm (setelahnya kejadian sudah terbukti)
  const forecast = stage === 'warning' ? forecastAt(series, analysis, index, forecastOptions) : null
  // Prediksi terakhir yang dibuat AI sebelum alarm → untuk mengukur ketepatannya
  const lastForecast = useMemo(
    () => (crossIndex > 0 ? forecastAt(series, analysis, crossIndex - 1, forecastOptions) : null),
    [series, analysis, crossIndex, forecastOptions],
  )

  const now = series[index]
  const fmtV = (v) => `${v.toFixed(1)} ${unit}`.trim()

  const onKey = (e) => {
    const big = Math.max(1, Math.round(series.length / 40))
    const map = {
      ArrowLeft: () => setIndex((i) => i - (e.shiftKey ? big : 1)),
      ArrowRight: () => setIndex((i) => i + (e.shiftKey ? big : 1)),
      Home: () => setIndex(0),
      End: () => setIndex(last),
      ' ': rp.toggle,
    }
    if (map[e.key] && e.target.tagName !== 'BUTTON') {
      e.preventDefault()
      rp.pause()
      if (e.key === ' ') rp.toggle()
      else map[e.key]()
    }
  }

  return (
    <section className={`tm-root is-${stage}`} tabIndex={0} onKeyDown={onKey}>
      <header className="tm-head">
        <div>
          <p className="tm-title">{title}</p>
          <p className="tm-now">
            {formatTime(now.t)}
            {rp.isAtEnd && <span className="tm-tag">sekarang</span>}
          </p>
        </div>
        <div className="tm-score" style={{ '--c': scoreColor(score[index]) }}>
          <span>Skor anomali AI</span>
          <strong>{Math.round(score[index] * 100)}%</strong>
        </div>
      </header>

      <ReplayChart
        series={series}
        analysis={analysis}
        index={index}
        forecast={forecast}
        events={events}
        height={height}
        unit={unit}
        formatTime={formatTime}
        formatDuration={formatDuration}
        onSeek={(i) => {
          rp.pause()
          setIndex(i)
        }}
      />

      <div className="tm-controls">
        <button type="button" className="tm-btn tm-play" onClick={rp.toggle} aria-label={rp.playing ? 'Jeda' : 'Putar'}>
          {rp.playing ? '❚❚' : '▶'}
        </button>
        <input
          className="tm-slider"
          type="range"
          min={0}
          max={last}
          value={index}
          aria-label="Geser waktu"
          style={{ '--p': `${(index / last) * 100}%` }}
          onChange={(e) => {
            rp.pause()
            setIndex(+e.target.value)
          }}
        />
        <div className="tm-speed" role="group" aria-label="Kecepatan">
          {SPEEDS.map((s) => (
            <button key={s} type="button" className={`tm-chip ${rp.speed === s ? 'is-on' : ''}`} onClick={() => rp.setSpeed(s)}>
              {s}×
            </button>
          ))}
        </div>
        <button
          type="button"
          className="tm-btn"
          disabled={rp.isAtEnd}
          onClick={() => {
            rp.pause()
            setIndex(last)
          }}
        >
          Sekarang ⏭
        </button>
      </div>

      <div className="tm-story">
        <Status
          label="Dashboard konvensional"
          state={stage === 'alarm' ? 'alarm' : 'normal'}
          value={stage === 'alarm' ? 'ALARM' : 'NORMAL'}
          detail={`${fmtV(now.v)} ${now.v >= threshold ? '≥' : '<'} batas ${fmtV(threshold)}`}
        />
        <Status
          label="AI prediktif"
          state={stage}
          value={{ normal: 'SEHAT', warning: 'WASPADA', alarm: 'KRITIS' }[stage]}
          detail={`tren ${fmtV(smooth[index])}`}
        />
        <p className="tm-narrative">
          <Narrative
            stage={stage}
            analysis={analysis}
            series={series}
            forecast={forecast}
            lastForecast={lastForecast}
            fmtV={fmtV}
            formatTime={formatTime}
            formatDuration={formatDuration}
          />
          {(() => {
            const ev = [...events].reverse().find((e) => e.t <= now.t)
            return ev ? (
              <span className="tm-event-note">
                ◆ {formatTime(ev.t)} — <b>{ev.title}</b>
                {ev.text ? `: ${ev.text}` : ''}
              </span>
            ) : null
          })()}
        </p>
      </div>
    </section>
  )
}

function Status({ label, state, value, detail }) {
  return (
    <div className={`tm-status is-${state}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </div>
  )
}

function Narrative({ stage, analysis, series, forecast, lastForecast, fmtV, formatTime, formatDuration }) {
  const { mean, detectIndex, crossIndex } = analysis
  if (stage === 'normal') {
    return (
      <>
        Semua tampak sehat — nilai stabil di sekitar <b>{fmtV(mean)}</b>.{' '}
        {detectIndex >= 0 ? 'Tekan ▶ untuk melihat apa yang terjadi selanjutnya.' : ''}
      </>
    )
  }
  if (stage === 'warning') {
    return (
      <>
        AI menangkap tren naik yang <b>belum terlihat</b> di dashboard biasa.{' '}
        {forecast ? (
          <>
            Prediksi melewati batas pada <b>{formatTime(forecast.t)}</b> — masih ada{' '}
            <b>{formatDuration(forecast.remaining)}</b> untuk menjadwalkan perawatan.
          </>
        ) : (
          'Mengumpulkan data untuk proyeksi…'
        )}
      </>
    )
  }
  const lead = series[crossIndex].t - series[detectIndex].t
  const err = lastForecast ? Math.abs(lastForecast.t - series[crossIndex].t) : null
  return (
    <>
      Alarm konvensional baru berbunyi pada <b>{formatTime(series[crossIndex].t)}</b>.{' '}
      {detectIndex >= 0 && (
        <>
          AI sudah memperingatkan <b>{formatDuration(lead)} lebih awal</b>
          {err != null && <> dan prediksi terakhirnya hanya meleset <b>{err < 1 ? `kurang dari ${formatDuration(1)}` : formatDuration(err)}</b></>}.
        </>
      )}
    </>
  )
}
