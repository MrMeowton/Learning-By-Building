// =========================================
// DATA KOMPONEN MESIN
// -----------------------------------------
// Semua informasi "bisnis" dipisah dari kode 3D.
// Saat hackathon, file ini yang diganti dengan data asli
// (dari API / CSV / database) — scene 3D tidak perlu diubah.
//
// - position : posisi dasar komponen di scene (x, y, z)
// - explode  : arah komponen bergerak saat mode "explode" aktif
// - sensors  : nilai sensor (base) + batas warning/critical
// =========================================

export const STATUS = {
  normal: { label: 'Normal', color: '#22c55e' },
  warning: { label: 'Warning', color: '#f59e0b' },
  critical: { label: 'Critical', color: '#ef4444' },
}

export const PARTS = [
  {
    id: 'motor',
    name: 'Motor Listrik',
    code: 'M-101',
    description: 'Motor induksi 3 fasa penggerak pompa melalui kopling.',
    position: [-1.6, 0.75, 0],
    explode: [-1.2, 0.4, 0],
    sensors: [
      { key: 'temp', label: 'Suhu belitan', unit: '°C', base: 68, warn: 80, crit: 95 },
      { key: 'current', label: 'Arus', unit: 'A', base: 42, warn: 48, crit: 55 },
    ],
  },
  {
    id: 'coupling',
    name: 'Kopling',
    code: 'C-101',
    description: 'Menyambung poros motor ke poros pompa dan meredam getaran.',
    position: [-0.35, 0.75, 0],
    explode: [0, 1.0, 0],
    sensors: [{ key: 'vib', label: 'Getaran', unit: 'mm/s', base: 5.1, warn: 4.5, crit: 7.1 }],
  },
  {
    id: 'pump',
    name: 'Pompa Sentrifugal',
    code: 'P-101',
    description: 'Memompa fluida dari tangki menuju jalur distribusi.',
    position: [0.75, 0.75, 0],
    explode: [0.6, 0.6, 0.6],
    sensors: [
      { key: 'pressure', label: 'Tekanan keluar', unit: 'bar', base: 6.2, warn: 7.5, crit: 8.5 },
      { key: 'flow', label: 'Debit', unit: 'm³/h', base: 118, warn: 140, crit: 160 },
    ],
  },
  {
    id: 'valve',
    name: 'Katup Keluaran',
    code: 'V-101',
    description: 'Gate valve untuk mengatur aliran pada pipa keluaran.',
    position: [0.75, 2.05, 0],
    explode: [0, 1.0, 0],
    sensors: [{ key: 'open', label: 'Bukaan', unit: '%', base: 75, warn: 95, crit: 100 }],
  },
  {
    id: 'tank',
    name: 'Tangki Penampung',
    code: 'T-101',
    description: 'Tangki sumber fluida yang menyuplai sisi hisap pompa.',
    position: [2.9, 1.15, 0],
    explode: [0.8, 0, 0],
    sensors: [
      { key: 'level', label: 'Level', unit: '%', base: 64, warn: 85, crit: 95 },
      { key: 'temp', label: 'Suhu fluida', unit: '°C', base: 41, warn: 60, crit: 75 },
    ],
  },
]

// Tentukan status sebuah nilai sensor berdasarkan ambang batasnya
export function sensorStatus(sensor, value) {
  if (value >= sensor.crit) return 'critical'
  if (value >= sensor.warn) return 'warning'
  return 'normal'
}

// Status komponen = status sensor terburuk di komponen tersebut
export function partStatus(part, readings) {
  const rank = { normal: 0, warning: 1, critical: 2 }
  return part.sensors.reduce((worst, s) => {
    const st = sensorStatus(s, readings[part.id]?.[s.key] ?? s.base)
    return rank[st] > rank[worst] ? st : worst
  }, 'normal')
}
