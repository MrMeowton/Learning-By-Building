# 02 · Asset 3D View

Satu fitur: **tampilan 3D interaktif sebuah aset/mesin** (unit pompa) yang terhubung dengan data sensor.
Dibangun dengan [`@react-three/fiber`](https://github.com/pmndrs/react-three-fiber) dan
[`@react-three/drei`](https://github.com/pmndrs/drei) di atas React + Vite.

## Menjalankan

```bash
cd 02-3d-asset-viewer
npm install
npm run dev      # buka http://localhost:5173
```

## Apa yang bisa dilakukan

| Interaksi | Hasil |
| --- | --- |
| Drag / scroll / klik kanan | Putar, zoom, geser kamera |
| Hover komponen | Komponen menyala sesuai warna statusnya |
| Klik komponen (di 3D, label, atau daftar) | Kamera terbang ke komponen, komponen lain memudar, panel menampilkan sensor + grafik mini |
| Klik area kosong / `Esc` | Kembali ke tampilan semua komponen |
| Tombol Isometrik / Depan / Atas / Samping | Preset sudut kamera |
| Slider **Explode** | Memisahkan komponen untuk melihat susunannya |
| Tombol **Label** | Tampilkan/sembunyikan label status |
| Tombol **Run / Stop** | Poros & kopling berputar, data sensor mengalir/berhenti |

Level fluida di tangki adalah contoh **visual 3D yang digerakkan data**: tingginya mengikuti sensor `level`.

## Struktur

```
src/
├── App.jsx                     state bersama + toolbar
├── data/
│   ├── parts.js                daftar komponen, sensor, ambang batas  ← ganti dengan data asli
│   └── cameraViews.js          preset kamera
├── hooks/
│   └── useSimulatedReadings.js data sensor dummy + riwayat              ← ganti dengan fetch/WebSocket
└── components/
    ├── Viewer.jsx              <Canvas>, cahaya, lantai, CameraControls
    ├── Machine.jsx             bentuk mesin dari primitif three.js
    ├── Part.jsx                pembungkus interaktif (hover, klik, fokus, explode, label)
    └── InfoPanel.jsx           panel samping (ringkasan, detail, sparkline)
```

## Cara mengadaptasi untuk kasus lain

1. **Ganti data** — edit `src/data/parts.js` (id, nama, posisi, sensor, ambang batas).
2. **Ganti sumber data** — ubah isi `useSimulatedReadings` menjadi `fetch()` ke API; bentuk return `{ readings, history }` dipertahankan.
3. **Ganti bentuk 3D** — tiap `<Part>` menerima fungsi `children(mat)`. Bisa diisi primitif seperti sekarang,
   atau model asli `.glb`:
   ```jsx
   const { nodes } = useGLTF('/models/pump.glb')
   <Part part={byId.pump} ...>{(m) => <mesh geometry={nodes.Pump.geometry} material={m.body} />}</Part>
   ```

## Catatan teknis

- Pencahayaan reflektif dibuat dari `<Lightformer>` (bukan file HDR), jadi tetap jalan tanpa internet.
- Label `<Html>` dirender ke satu layer DOM khusus (`portal`) dan disembunyikan via CSS, bukan di-unmount —
  ini menghindari label yang hilang/error DOM pada React 19.
- Animasi memakai `useFrame` + lerp `1 - exp(-dt·k)` supaya kecepatannya sama di semua FPS.
