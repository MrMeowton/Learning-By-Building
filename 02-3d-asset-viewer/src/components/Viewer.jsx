import { useEffect, useMemo, useRef, createRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraControls, ContactShadows, Environment, Grid, Lightformer } from '@react-three/drei'
import * as THREE from 'three'
import Machine from './Machine'
import { PARTS } from '../data/parts'
import { CAMERA_VIEWS, goToView } from '../data/cameraViews'

// =========================================
// <Viewer> — kanvas 3D
// -----------------------------------------
// - <Canvas>          : root react-three-fiber (membuat renderer, scene, kamera)
// - <CameraControls>  : orbit/zoom/pan + animasi kamera (drei)
// - <Environment>     : pencahayaan reflektif. Dibuat dari <Lightformer>
//                       supaya tidak perlu unduh file HDR (aman offline)
// - <ContactShadows>  : bayangan lembut di lantai
// - <Grid>            : lantai bergrid ala software CAD
// =========================================

export default function Viewer({ controlsRef, selectedId, onSelect, ...machineProps }) {
  // Satu ref per komponen — dipakai kamera untuk "terbang" ke komponen terpilih
  const partRefs = useMemo(() => Object.fromEntries(PARTS.map((p) => [p.id, createRef()])), [])
  // Layer DOM khusus untuk semua label <Html>, supaya tidak bergantung
  // pada kapan container kanvas siap
  const labelLayer = useRef(null)

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const obj = selectedId && partRefs[selectedId].current
    if (obj) {
      // Terbang ke komponen sambil mempertahankan arah pandang saat ini,
      // dengan jarak minimum supaya komponen kecil tidak terlalu dekat
      const sphere = new THREE.Box3().setFromObject(obj).getBoundingSphere(new THREE.Sphere())
      const dir = controls.camera.position.clone().sub(controls.getTarget(new THREE.Vector3())).normalize()
      const dist = Math.max(sphere.radius * 3.8, 3.8)
      const pos = sphere.center.clone().addScaledVector(dir, dist)
      controls.setLookAt(pos.x, pos.y, pos.z, sphere.center.x, sphere.center.y, sphere.center.z, true)
    } else {
      goToView(controls, 'iso')
    }
  }, [selectedId, partRefs, controlsRef])

  return (
    <div className="viewer">
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: CAMERA_VIEWS.iso.pos, fov: 40, near: 0.1, far: 100 }}
        onPointerMissed={() => onSelect(null)} // klik area kosong = batal pilih
      >
        <color attach="background" args={['#0b1120']} />
        <fog attach="fog" args={['#0b1120', 14, 30]} />

        <ambientLight intensity={0.35} />
        <directionalLight
          position={[5, 8, 4]}
          intensity={1.6}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-6}
          shadow-camera-right={6}
          shadow-camera-top={6}
          shadow-camera-bottom={-6}
        />

        <Environment resolution={256}>
          <Lightformer form="rect" intensity={2} position={[0, 5, -6]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={1} position={[-6, 2, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="ring" intensity={1.5} color="#60a5fa" position={[6, 3, 4]} scale={3} />
        </Environment>

        <Machine
          selectedId={selectedId}
          onSelect={onSelect}
          partRefs={partRefs}
          labelPortal={labelLayer}
          {...machineProps}
        />

        <ContactShadows position={[0, 0.001, 0]} opacity={0.6} scale={16} blur={2.4} far={4} />
        <Grid
          position={[0, -0.001, 0]}
          args={[30, 30]}
          cellSize={0.5}
          cellThickness={0.6}
          cellColor="#1e293b"
          sectionSize={2.5}
          sectionThickness={1}
          sectionColor="#334155"
          fadeDistance={22}
          infiniteGrid
        />

        <CameraControls
          ref={controlsRef}
          makeDefault
          minDistance={2}
          maxDistance={18}
          maxPolarAngle={Math.PI / 2 - 0.05}
        />
      </Canvas>
      <div ref={labelLayer} className="label-layer" />
    </div>
  )
}
