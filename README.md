# Tujuan
Repository untuk project-project dalam mempelajari software development. Repository ini dibuat dengan tujuan menjadi living project dimana akan expandable untuk berbagai jenis project dalam melatih skill software development

# Daftar project
1. Personal Task Manager
2. Asset 3D View — `react-three-fiber` + `drei` (`02-3d-asset-viewer`)
3. Root Cause Graph — `@xyflow/react` (React Flow) (`03-root-cause-graph`)
4. X-Ray Asset View — klik kompresor, casing transparan, bearing rusak berdenyut merah (`04-xray-asset-view`)
5. Time-Machine Replay — geser waktu ke belakang, anomali tumbuh pelan-pelan, AI terbukti memprediksi lebih awal; modul berlapis (preset · komposabel · headless · core) + adapter API (`05-time-machine-replay`)
6. Energy Sankey — aliran fuel gas, steam, listrik → unit → produk & kerugian beranimasi, lebar aliran = GJ (`06-energy-sankey`)
7. Plant Heatmap Overlay — unit di layout pabrik diwarnai menurut intensitas energi, emisi, atau risiko; toggle antar layer (`07-plant-heatmap`)
8. Live P&ID — diagram proses dengan pipa beranimasi (laju ∝ flow), level & valve hidup, gelembung instrumen ISA dengan tag sensor live + panel kartu alarm/sparkline (`08-live-pid`)
9. Spare-Partcd Race Timeline — dua garis waktu per aset: perkiraan gagal vs part tiba (lead time); merah bila part terlambat, plus what-if expedite (`09-spare-part-race`)

## Fitur bisnis per pilar (10–18)
Setiap project = satu modul mandiri di `src/features/<modul>` (hanya `react`, logika murni + tes `node --test`), siap disalin ke project hackathon.

**Knowledge** — technical knowledge retention
10. Knowledge-at-Risk Map — matriks aset/prosedur × engineer, bus factor, simulasi "dia resign/pensiun", US$ at risk (`10-knowledge-risk-map`)
11. Repeat-Incident Cost Counter — counter US$ insiden yang terulang padahal sudah di-RCA, replay waktu, grafik kumulatif (`11-repeat-incident-cost`)
12. Onboarding Time-to-Competence — kurva Kaplan–Meier sebelum vs sesudah, hari dihemat & US$/tahun, rincian per skill (`12-onboarding-competence`)

**Reliability** — predictive maintenance, spare-part optimization
13. Risk-Based Work Prioritizer — US$ at risk = P × (margin/jam × MTTR + repair), isi kapasitas crew (knapsack optimal) vs FIFO/severity (`13-risk-work-prioritizer`)
14. Spare-Part Economics — biaya simpan vs downtime (base-stock Poisson) → stok optimal, reorder point, Δ working capital (`14-spare-part-economics`)
15. Repair vs Replace Advisor — NPV, IRR, payback, EAC, capex break-even untuk aset menua (`15-repair-vs-replace`)

**Smart Manufacturing & Energy Intelligence**
16. Energy & Carbon P&L per Unit — SEC × harga energi → US$/t, tCO₂e/t, biaya karbon, bocor vs benchmark (`16-energy-carbon-pnl`)
17. MACC — kurva biaya abatement per tCO₂e, harga karbon, anggaran capex & target (`17-macc`)
18. Production Forecast → Margin View — forecast Holt + P10/P90 × spread produk → margin at risk vs rencana (`18-production-margin`)

## CALIBER 2026 Final — Spare Part Intelligence
19. Spare-Part 3D Catalog — 60 model spare part + 17 equipment (furnace, kompresor, turbin, pompa, control valve…) dari data kasus final; tiap folder berisi `PROMPT.md` untuk AI lain + placeholder; viewer dengan X-Ray, explode & simulasi fault (`19-spare-part-3d-catalog`)
