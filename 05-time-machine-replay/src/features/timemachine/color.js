/** Warna skor anomali: hijau (0) → kuning → merah (1) */
export function scoreColor(s) {
  const hue = 145 - 145 * Math.min(1, Math.max(0, s))
  return `hsl(${hue} 80% 52%)`
}
