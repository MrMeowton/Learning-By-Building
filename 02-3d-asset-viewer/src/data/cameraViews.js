// Preset posisi kamera: pos = letak kamera, target = titik yang dilihat
export const CAMERA_VIEWS = {
  iso: { label: 'Isometrik', pos: [5.6, 5, 8.6], target: [0.9, 1.25, 0] },
  front: { label: 'Depan', pos: [0.6, 1.4, 8], target: [0.6, 1.1, 0] },
  top: { label: 'Atas', pos: [0.6, 9, 0.01], target: [0.6, 0, 0] },
  side: { label: 'Samping', pos: [9, 1.6, 0], target: [0.6, 1.1, 0] },
}

export function goToView(controls, key, animate = true) {
  const v = CAMERA_VIEWS[key]
  controls?.setLookAt(...v.pos, ...v.target, animate)
}
