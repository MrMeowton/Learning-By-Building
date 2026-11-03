import { useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { STATUS } from '../data/parts'

// =========================================
// <Part> — pembungkus interaktif untuk satu komponen mesin
// -----------------------------------------
// Tanggung jawabnya:
// 1. Hover  → komponen menyala (emissive) + kursor jadi pointer
// 2. Klik   → memilih komponen (onSelect)
// 3. Fokus  → saat ada komponen lain terpilih, komponen ini memudar
// 4. Explode→ bergeser ke arah `explode` sesuai slider (dianimasikan halus)
// 5. Label  → tag status melayang (drei <Html>) di atas komponen
//
// Bentuk 3D-nya diberikan lewat `children` sebagai fungsi:
//   <Part ...>{(mat) => <mesh material={mat.body} ... />}</Part>
// sehingga semua mesh di dalamnya memakai material yang sama
// dan efek hover/fokus berlaku serempak.
// =========================================

const tmp = new THREE.Vector3()

export default function Part({
  part,
  status,
  color = '#94a3b8',
  accent = '#475569',
  labelPos = [0, 1, 0], // posisi label relatif terhadap komponen
  bodyOpacity = 1, // < 1 untuk bagian tembus pandang (mis. dinding tangki)
  selectedId,
  explode,
  showLabels,
  onSelect,
  labelPortal,
  groupRef,
  children,
}) {
  const localRef = useRef()
  const ref = groupRef ?? localRef
  const [hovered, setHovered] = useState(false)

  const isSelected = selectedId === part.id
  const isDimmed = selectedId !== null && !isSelected

  // Material dibuat sekali per komponen lalu dimutasi tiap frame
  const mat = useMemo(
    () => ({
      body: new THREE.MeshStandardMaterial({
        color,
        metalness: 0.55,
        roughness: 0.38,
        transparent: true,
        side: bodyOpacity < 1 ? THREE.DoubleSide : THREE.FrontSide,
      }),
      accent: new THREE.MeshStandardMaterial({ color: accent, metalness: 0.7, roughness: 0.3, transparent: true }),
    }),
    [color, accent, bodyOpacity],
  )

  const statusColor = STATUS[status].color
  const glow = useMemo(() => new THREE.Color(), [])

  useFrame((_, dt) => {
    const g = ref.current
    if (!g) return
    const k = 1 - Math.exp(-dt * 8) // faktor lerp yang tidak bergantung FPS

    // Posisi = posisi dasar + arah explode × nilai slider
    tmp.set(
      part.position[0] + part.explode[0] * explode,
      part.position[1] + part.explode[1] * explode,
      part.position[2] + part.explode[2] * explode,
    )
    g.position.lerp(tmp, k)

    // Opacity: pudar jika komponen lain sedang difokuskan
    const targetOpacity = isDimmed ? 0.18 : 1
    // Emissive: menyala saat hover / terpilih, warna mengikuti status
    glow.set(isSelected || hovered ? statusColor : '#000000')
    const targetGlow = isSelected ? 0.35 : hovered ? 0.22 : 0

    for (const m of [mat.body, mat.accent]) {
      const t = m === mat.body ? Math.min(targetOpacity, bodyOpacity) : targetOpacity
      m.opacity = THREE.MathUtils.lerp(m.opacity, t, k)
      m.depthWrite = m.opacity > 0.6
      m.emissive.lerp(glow, k)
      m.emissiveIntensity = THREE.MathUtils.lerp(m.emissiveIntensity, targetGlow, k)
    }
  })

  return (
    <group
      ref={ref}
      position={part.position}
      onPointerOver={(e) => {
        e.stopPropagation()
        setHovered(true)
        document.body.style.cursor = 'pointer'
      }}
      onPointerOut={() => {
        setHovered(false)
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(isSelected ? null : part.id)
      }}
    >
      {children(mat)}

      {/* Html selalu di-render lalu disembunyikan via CSS —
          mount/unmount berulang pada <Html> bisa memicu error DOM */}
      <Html position={labelPos} center zIndexRange={[10, 0]} portal={labelPortal}>
        <button
          className={`tag ${isSelected ? 'tag--active' : ''}`}
          style={{ display: (showLabels || hovered || isSelected) && !isDimmed ? 'flex' : 'none' }}
          onClick={() => onSelect(isSelected ? null : part.id)}
        >
          <span className="tag__dot" style={{ background: statusColor }} />
          <span className="tag__code">{part.code}</span>
          <span className="tag__name">{part.name}</span>
        </button>
      </Html>
    </group>
  )
}
