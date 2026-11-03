import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import * as THREE from 'three'
import Part from './Part'
import { PARTS, partStatus } from '../data/parts'

// =========================================
// <Machine> — unit pompa (motor → kopling → pompa → katup, + tangki)
// -----------------------------------------
// Semua bentuk dibuat dari primitif three.js (box, cylinder, torus),
// jadi TIDAK butuh file model .glb. Kalau nanti punya model asli,
// cukup ganti isi tiap <Part> dengan <primitive object={gltf.nodes.X} />
// dari useGLTF() milik drei.
// =========================================

const byId = Object.fromEntries(PARTS.map((p) => [p.id, p]))

// Pipa lurus dari titik a ke b (silinder yang diorientasikan)
function Pipe({ a, b, r = 0.08, material }) {
  const { pos, len, quat } = useMemo(() => {
    const va = new THREE.Vector3(...a)
    const vb = new THREE.Vector3(...b)
    const dir = vb.clone().sub(va)
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
    return { pos: va.add(vb).multiplyScalar(0.5), len: dir.length(), quat: q }
  }, [a, b])
  return (
    <mesh position={pos} quaternion={quat} material={material} castShadow>
      <cylinderGeometry args={[r, r, len, 20]} />
    </mesh>
  )
}

function Elbow({ p, r = 0.1, material }) {
  return (
    <mesh position={p} material={material} castShadow>
      <sphereGeometry args={[r, 20, 20]} />
    </mesh>
  )
}

export default function Machine({
  readings,
  selectedId,
  onSelect,
  explode,
  showLabels,
  running,
  partRefs,
  labelPortal,
}) {
  const shared = { selectedId, onSelect, explode, showLabels, labelPortal }
  const st = (id) => partStatus(byId[id], readings)

  // Bagian yang berputar (poros, kopling, kipas motor)
  const spinners = useRef([])
  const speed = useRef(0)
  useFrame((_, dt) => {
    // percepatan/perlambatan halus saat tombol Run/Stop ditekan
    speed.current = THREE.MathUtils.lerp(speed.current, running ? 14 : 0, 1 - Math.exp(-dt * 1.5))
    for (const s of spinners.current) if (s) s.rotation.x += speed.current * dt
  })
  const spin = (i) => (el) => (spinners.current[i] = el)

  // Material pipa & rangka (statis, ikut memudar saat explode)
  const pipeMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#7c8a9e', metalness: 0.75, roughness: 0.3, transparent: true }),
    [],
  )
  const frameMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#334155', metalness: 0.4, roughness: 0.6 }),
    [],
  )
  useFrame(() => {
    pipeMat.opacity = THREE.MathUtils.lerp(pipeMat.opacity, selectedId ? 0.15 : 1 - explode * 0.85, 0.15)
    pipeMat.depthWrite = pipeMat.opacity > 0.6
  })

  const level = (readings.tank?.level ?? 60) / 100
  const tankH = 2.0

  return (
    <group>
      {/* ---------- Rangka / skid (statis) ---------- */}
      <RoundedBox
        args={[4.4, 0.2, 1.7]}
        radius={0.04}
        position={[-0.4, 0.1, 0]}
        material={frameMat}
        receiveShadow
        castShadow
      />
      <RoundedBox
        args={[1.7, 0.15, 1.7]}
        radius={0.04}
        position={[2.9, 0.075, 0]}
        material={frameMat}
        receiveShadow
        castShadow
      />

      {/* ---------- Pipa (statis) ---------- */}
      {/* Sisi hisap: tangki → pompa */}
      <Pipe a={[1.2, 0.6, 0]} b={[2.35, 0.6, 0]} material={pipeMat} />
      {/* Sisi tekan: pompa → katup → kembali ke tangki */}
      <Pipe a={[0.75, 1.2, 0]} b={[0.75, 1.82, 0]} material={pipeMat} />
      <Pipe a={[0.75, 2.28, 0]} b={[0.75, 2.75, 0]} material={pipeMat} />
      <Pipe a={[0.75, 2.75, 0]} b={[2.9, 2.75, 0]} material={pipeMat} />
      <Pipe a={[2.9, 2.75, 0]} b={[2.9, 2.15, 0]} material={pipeMat} />
      <Elbow p={[0.75, 2.75, 0]} material={pipeMat} />
      <Elbow p={[2.9, 2.75, 0]} material={pipeMat} />

      {/* ---------- MOTOR ---------- */}
      <Part
        part={byId.motor}
        status={st('motor')}
        color="#2563eb"
        accent="#1e3a8a"
        labelPos={[-0.2, 0.95, 0]}
        groupRef={partRefs.motor}
        {...shared}
      >
        {(m) => (
          <>
            {/* badan motor */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={m.body} castShadow>
              <cylinderGeometry args={[0.42, 0.42, 1.2, 40]} />
            </mesh>
            {/* sirip pendingin */}
            {Array.from({ length: 9 }).map((_, i) => (
              <mesh
                key={i}
                position={[-0.5 + i * 0.125, 0, 0]}
                rotation={[0, Math.PI / 2, 0]}
                material={m.accent}
                castShadow
              >
                <torusGeometry args={[0.43, 0.025, 8, 40]} />
              </mesh>
            ))}
            {/* tutup kipas belakang */}
            <mesh position={[-0.68, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.accent} castShadow>
              <cylinderGeometry args={[0.4, 0.44, 0.16, 40]} />
            </mesh>
            {/* kotak terminal */}
            <RoundedBox args={[0.34, 0.2, 0.3]} radius={0.03} position={[0.1, 0.5, 0]} material={m.accent} castShadow />
            {/* kaki */}
            <mesh position={[0, -0.47, 0]} material={m.accent} castShadow>
              <boxGeometry args={[0.95, 0.15, 0.75]} />
            </mesh>
            {/* poros keluar (berputar) */}
            <mesh ref={spin(0)} position={[0.72, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.accent}>
              <cylinderGeometry args={[0.06, 0.06, 0.3, 16]} />
            </mesh>
          </>
        )}
      </Part>

      {/* ---------- KOPLING ---------- */}
      <Part
        part={byId.coupling}
        status={st('coupling')}
        color="#e2e8f0"
        accent="#64748b"
        labelPos={[-0.15, -0.35, 0.95]}
        groupRef={partRefs.coupling}
        {...shared}
      >
        {(m) => (
          <group ref={spin(1)}>
            {[-0.09, 0.09].map((x) => (
              <mesh key={x} position={[x, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.body} castShadow>
                <cylinderGeometry args={[0.24, 0.24, 0.14, 32]} />
              </mesh>
            ))}
            {/* baut — membuat putaran terlihat */}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i / 6) * Math.PI * 2
              return (
                <mesh
                  key={i}
                  position={[0, Math.cos(a) * 0.17, Math.sin(a) * 0.17]}
                  rotation={[0, 0, Math.PI / 2]}
                  material={m.accent}
                >
                  <cylinderGeometry args={[0.025, 0.025, 0.34, 8]} />
                </mesh>
              )
            })}
          </group>
        )}
      </Part>

      {/* ---------- POMPA ---------- */}
      <Part
        part={byId.pump}
        status={st('pump')}
        color="#dc6b19"
        accent="#7c2d12"
        labelPos={[0.35, 0.15, 0.75]}
        groupRef={partRefs.pump}
        {...shared}
      >
        {(m) => (
          <>
            {/* rumah keong (volute) */}
            <mesh rotation={[0, 0, Math.PI / 2]} material={m.body} castShadow>
              <cylinderGeometry args={[0.5, 0.5, 0.42, 48]} />
            </mesh>
            <mesh position={[-0.32, 0, 0]} rotation={[0, 0, Math.PI / 2]} material={m.accent} castShadow>
              <cylinderGeometry args={[0.22, 0.3, 0.25, 32]} />
            </mesh>
            {/* nosel hisap (ke kanan) */}
            <mesh position={[0.35, -0.15, 0]} rotation={[0, 0, Math.PI / 2]} material={m.body} castShadow>
              <cylinderGeometry args={[0.15, 0.15, 0.3, 24]} />
            </mesh>
            <mesh position={[0.5, -0.15, 0]} rotation={[0, 0, Math.PI / 2]} material={m.accent}>
              <cylinderGeometry args={[0.2, 0.2, 0.05, 24]} />
            </mesh>
            {/* nosel tekan (ke atas) */}
            <mesh position={[0, 0.5, 0]} material={m.body} castShadow>
              <cylinderGeometry args={[0.13, 0.15, 0.25, 24]} />
            </mesh>
            {/* dudukan */}
            <mesh position={[-0.05, -0.47, 0]} material={m.accent} castShadow>
              <boxGeometry args={[0.7, 0.15, 0.7]} />
            </mesh>
          </>
        )}
      </Part>

      {/* ---------- KATUP ---------- */}
      <Part
        part={byId.valve}
        status={st('valve')}
        color="#0d9488"
        accent="#134e4a"
        labelPos={[-0.75, 0.25, 0]}
        groupRef={partRefs.valve}
        {...shared}
      >
        {(m) => (
          <>
            <mesh material={m.body} castShadow>
              <sphereGeometry args={[0.2, 24, 24]} />
            </mesh>
            {[-0.2, 0.2].map((y) => (
              <mesh key={y} position={[0, y, 0]} material={m.accent} castShadow>
                <cylinderGeometry args={[0.17, 0.17, 0.05, 24]} />
              </mesh>
            ))}
            {/* batang & roda tangan */}
            <mesh position={[0, 0.18, 0.28]} rotation={[Math.PI / 2, 0, 0]} material={m.accent}>
              <cylinderGeometry args={[0.03, 0.03, 0.4, 8]} />
            </mesh>
            <mesh position={[0, 0.18, 0.48]} material={m.body} castShadow>
              <torusGeometry args={[0.14, 0.025, 10, 32]} />
            </mesh>
          </>
        )}
      </Part>

      {/* ---------- TANGKI (level fluida mengikuti sensor) ---------- */}
      <Part
        part={byId.tank}
        status={st('tank')}
        color="#cbd5e1"
        accent="#475569"
        labelPos={[0, 1.45, 0]}
        bodyOpacity={0.28}
        groupRef={partRefs.tank}
        {...shared}
      >
        {(m) => (
          <>
            {/* dinding tangki — dibuat semi-transparan agar level terlihat */}
            <mesh material={m.body} castShadow>
              <cylinderGeometry args={[0.62, 0.62, tankH, 48, 1, true]} />
            </mesh>
            {[-tankH / 2, tankH / 2].map((y) => (
              <mesh key={y} position={[0, y, 0]} material={m.accent} castShadow>
                <cylinderGeometry args={[0.64, 0.64, 0.06, 48]} />
              </mesh>
            ))}
            {/* fluida */}
            <FluidLevel level={level} height={tankH} />
          </>
        )}
      </Part>
    </group>
  )
}

// Kolom fluida di dalam tangki — tingginya dianimasikan mengikuti sensor level
function FluidLevel({ level, height }) {
  const ref = useRef()
  useFrame((_, dt) => {
    if (!ref.current) return
    const s = THREE.MathUtils.lerp(ref.current.scale.y, Math.max(level, 0.01), 1 - Math.exp(-dt * 3))
    ref.current.scale.y = s
    ref.current.position.y = -height / 2 + (height * s) / 2
  })
  return (
    <mesh ref={ref} scale={[1, level, 1]}>
      <cylinderGeometry args={[0.58, 0.58, height, 48]} />
      <meshStandardMaterial
        color="#38bdf8"
        transparent
        opacity={0.55}
        roughness={0.1}
        emissive="#0ea5e9"
        emissiveIntensity={0.25}
      />
    </mesh>
  )
}
