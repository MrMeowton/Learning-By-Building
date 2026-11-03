// Logika murni (tanpa React) — mudah dites dan diganti model AI sungguhan.
//
// series: [{ t: number, v: number }]   t = waktu (mis. hari), v = nilai sensor

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x))

/**
 * Analisis satu deret sensor:
 * - baseline (mean, sd) dari bagian awal yang dianggap sehat
 * - smooth  : EWMA, "pandangan" model yang tidak tertipu noise
 * - score   : skor anomali 0..1 (0 = sehat, 1 = sudah di batas alarm)
 * - detectIndex : titik pertama AI yakin ada anomali (beberapa titik berturut-turut)
 * - crossIndex  : titik pertama nilai mentah melewati batas (= alarm konvensional)
 */
export function analyzeSeries(series, { threshold, warmup = 0.3, alpha = 0.15, detectZ = 1.5, hold = 4 } = {}) {
  const n = series.length
  const w = clamp(Math.floor(n * warmup), 2, n)

  let mean = 0
  for (let i = 0; i < w; i++) mean += series[i].v
  mean /= w
  let sd = 0
  for (let i = 0; i < w; i++) sd += (series[i].v - mean) ** 2
  sd = Math.sqrt(sd / w) || 1e-6

  const smooth = new Array(n)
  const score = new Array(n)
  const span = threshold - mean || 1e-6
  let detectIndex = -1
  let crossIndex = -1
  let streak = 0

  for (let i = 0; i < n; i++) {
    const v = series[i].v
    smooth[i] = i === 0 ? v : alpha * v + (1 - alpha) * smooth[i - 1]
    score[i] = clamp((smooth[i] - mean) / span, 0, 1)

    if (i >= w && detectIndex < 0) {
      streak = (smooth[i] - mean) / sd > detectZ ? streak + 1 : 0
      if (streak >= hold) detectIndex = i
    }
    if (crossIndex < 0 && v >= threshold) crossIndex = i
  }

  return { mean, sd, smooth, score, detectIndex, crossIndex, threshold }
}

/**
 * Prediksi yang dibuat AI *pada saat* index — hanya memakai data sampai index.
 * Model: pertumbuhan eksponensial (regresi linear pada log(smooth − baseline))
 * di jendela terakhir, lalu diekstrapolasi sampai menyentuh batas.
 * Return null bila belum ada anomali / tren tidak naik.
 */
export function forecastAt(series, analysis, index, { window = 28, steps = 40, maxAhead = 3 } = {}) {
  const { mean, smooth, threshold, detectIndex } = analysis
  if (detectIndex < 0 || index < detectIndex) return null

  const from = Math.max(0, index - window + 1)
  const eps = analysis.sd * 0.05
  let sx = 0, sy = 0, sxx = 0, sxy = 0, k = 0
  for (let i = from; i <= index; i++) {
    const x = series[i].t
    const y = Math.log(Math.max(smooth[i] - mean, eps))
    sx += x; sy += y; sxx += x * x; sxy += x * y; k++
  }
  const den = k * sxx - sx * sx
  if (k < 3 || den === 0) return null
  const m = (k * sxy - sx * sy) / den
  const b = (sy - m * sx) / k
  if (m <= 0) return null

  const tNow = series[index].t
  const tCross = (Math.log(threshold - mean) - b) / m
  const domain = series[series.length - 1].t - series[0].t
  if (!(tCross > tNow) || tCross - tNow > domain * maxAhead) return null

  // Lengkung proyeksi, disambung mulus dari nilai smooth saat ini
  const offset = smooth[index] - (mean + Math.exp(b + m * tNow))
  const points = []
  for (let s = 0; s <= steps; s++) {
    const t = tNow + ((tCross - tNow) * s) / steps
    const fade = 1 - s / steps // offset hilang perlahan agar ujungnya tepat di batas
    points.push({ t, v: mean + Math.exp(b + m * t) + offset * fade })
  }
  return { t: tCross, remaining: tCross - tNow, points }
}

/** PRNG kecil ber-seed agar data demo selalu sama */
function mulberry32(seed) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let r = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

/**
 * Deret sintetis: sehat + noise, lalu mulai `onset` anomali tumbuh eksponensial.
 * Dipakai demo; di project utama ganti dengan data historis dari API.
 */
export function makeDegradationSeries({
  days = 60,
  perDay = 4,
  base = 2.3,
  noise = 0.25,
  onset = 28,
  amp = 0.29,
  growth = 0.12,
  seed = 7,
} = {}) {
  const rand = mulberry32(seed)
  const gauss = () => {
    const u = 1 - rand()
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand())
  }
  const out = []
  for (let i = 0; i <= days * perDay; i++) {
    const t = i / perDay
    const fault = t > onset ? amp * (Math.exp(growth * (t - onset)) - 1) : 0
    out.push({ t, v: +(base + fault + noise * gauss()).toFixed(3) })
  }
  return out
}
