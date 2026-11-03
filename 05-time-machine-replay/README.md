# 05 · Time-Machine Replay

Satu fitur saja: **time-machine replay**. Halaman dibuka di "sekarang" (aset sudah alarm).
Geser slider **ke belakang** → masa depan menjadi kosong ("belum terjadi") dan anomali
mengecil. Tekan **▶** → anomali **tumbuh pelan-pelan**, dan penonton melihat sendiri:

1. **AI mendeteksi** tren naik saat dashboard konvensional masih `NORMAL`,
2. garis putus-putus **prediksi AI** menunjuk tanggal kapan batas akan dilewati (dan
   makin tepat seiring waktu),
3. **alarm konvensional** baru berbunyi belakangan → muncul braket _"AI 14 hari lebih awal"_.

Jadi nilai AI dibuktikan **dengan cerita**, bukan klaim. Cocok untuk demo Reliability
(getaran bearing) maupun Energy (suhu trafo) — demo menyertakan keduanya.

Hanya `react` — grafiknya SVG murni, tanpa library chart. Dikemas sebagai **modul
mandiri** (`src/features/timemachine`) yang tinggal disalin ke project hackathon.

## Menjalankan demo

```bash
cd 05-time-machine-replay
npm install
npm run dev      # buka http://localhost:5173
```

| Interaksi | Hasil |
| --- | --- |
| Geser slider / klik-drag grafik | Lompat ke titik waktu tersebut |
| **▶ / ❚❚** atau `Spasi` | Putar maju / jeda (di ujung → mulai dari awal) |
| `1× 2× 4×` | Kecepatan putar |
| `←` `→` (`Shift` = lompat jauh), `Home` / `End` | Navigasi keyboard (fokuskan panel dulu) |
| **Sekarang ⏭** | Kembali ke titik terakhir |

## Struktur

```
src/
├── App.jsx                     DEMO: 2 aset (Reliability & Energy)
└── features/timemachine/       ← MODUL MANDIRI — salin folder ini
    ├── index.js                pintu masuk (impor HANYA dari sini)
    ├── TimeMachineReplay.jsx   siap pakai: header + grafik + kontrol + panel cerita
    ├── ReplayChart.jsx         grafik SVG (batas, garis AI, proyeksi, penanda, jalur skor)
    ├── useReplay.js            hook state waktu + pemutar (requestAnimationFrame)
    ├── analysis.js             logika murni: baseline, skor, deteksi, prediksi, data demo
    ├── color.js                warna skor hijau → merah
    └── timemachine.css         gaya ber-prefix tm-
```

## Integrasi ke project utama

```bash
cp -r 05-time-machine-replay/src/features/timemachine  <project-utama>/src/features/
# tidak ada dependensi tambahan selain react
```

### Cara 1 — pakai komponen jadi

```jsx
import { TimeMachineReplay } from './features/timemachine'

<TimeMachineReplay
  title="Bearing pompa P-101"
  series={history}            // [{ t: hari, v: nilai }] — dari API / sensor
  threshold={7.1}
  unit="mm/s"
  events={[{ t: 20, title: 'Inspeksi rutin', text: 'tidak ada temuan' }]}
/>
```

| Prop | Keterangan |
| --- | --- |
| `series` | `[{ t, v }]` urut waktu. `t` bebas satuannya (hari, jam, …) |
| `threshold`, `unit` | batas alarm konvensional & satuannya |
| `events` | `[{ t, title, text? }]` penanda (◆) yang muncul setelah "terjadi" |
| `start` | `'end'` (default), `'start'`, atau index awal |
| `formatTime(t)`, `formatDuration(d)` | default `Hari 12` / `5 hari` — ganti bila `t` dalam jam, dll. |
| `pointsPerSecond` | kecepatan putar 1× (default 24 titik/detik) |
| `height` | tinggi grafik (px) |
| `analysisOptions` | `{ warmup, alpha, detectZ, hold }` — kepekaan deteksi |
| `forecastOptions` | `{ window, steps, maxAhead }` — jendela regresi proyeksi |
| `onIndexChange(i, point)` | sinkronkan dengan komponen lain (mis. digital twin 3D) |

Tip: gabungkan dengan project 04 — panggil `onIndexChange` lalu nyalakan `FaultPulse`
saat skor anomali di titik itu melewati ambang tertentu, jadi bearing 3D ikut "memanas"
saat slider diputar.

### Cara 2 — rakit sendiri

```jsx
import { analyzeSeries, forecastAt, useReplay, ReplayChart } from './features/timemachine'

const analysis = analyzeSeries(series, { threshold: 7.1 })
const { index, setIndex, toggle } = useReplay(series.length)
const forecast = forecastAt(series, analysis, index)
```

`analysis.js` tidak bergantung pada React — kalau backend sudah punya model AI sendiri,
cukup ganti `analyzeSeries` / `forecastAt` dengan hasil dari API (bentuk keluarannya sama).

## Cara kerjanya

- **Waktu = index.** Seluruh tampilan diturunkan dari satu angka `index`. Grafik hanya
  menggambar titik `0..index`, sumbu x/y tetap untuk seluruh rentang → masa depan tampak
  kosong (diarsir "belum terjadi") dan axis tidak melompat saat slider digeser.
- **Pandangan AI** (`analyzeSeries`): baseline (mean, sd) dari 30% data awal; nilai
  dihaluskan dengan EWMA; skor = posisi tren antara baseline (0) dan batas (1).
  **Deteksi** = tren > baseline + 1.5·sd selama 4 titik berturut-turut. **Alarm
  konvensional** = nilai mentah pertama ≥ batas.
- **Prediksi jujur** (`forecastAt`): hanya memakai data **sampai index** (tidak mengintip
  masa depan). Regresi linear pada `log(tren − baseline)` di 28 titik terakhir = model
  pertumbuhan eksponensial, lalu diekstrapolasi sampai menyentuh batas. Karena itu
  tanggal prediksi bergeser dan makin akurat saat diputar — itulah "cerita"-nya.
- **Pemutar** (`useReplay`): `requestAnimationFrame` + akumulator pecahan, jadi kecepatan
  tetap konsisten di layar 60 Hz maupun 120 Hz; berhenti otomatis di ujung.

Pada data demo bearing: AI mendeteksi di Hari 37, alarm konvensional di Hari 51
(**14 hari lebih awal**); prediksi terakhir sebelum alarm meleset ±1,4 hari.
