import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF, Clone } from '@react-three/drei'

const MODELS = ['/assets/models/clownfish.glb','/assets/models/blue_tang.glb','/assets/models/goldfish.glb']

function hash32(s){
  let h = 2166136261>>>0
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619)>>>0 }
  return h>>>0
}
function short(a){ return a ? a.slice(0,4)+'****'+a.slice(-4) : '' }

export default function FishSchoolBowl({
  holders,
  onFishClick,
  showLabels = true,
  center = new THREE.Vector3(0, 4.3, 0),
  radius = 3.0        // fish swim inside this sphere
}){
  // Per-fish sim refs for global separation
  const simsRef = useRef([]) // entries: { group, state }
  simsRef.current.length = holders.length

  // Separation params tuned for ~300 fish in r≈3
  const SEP_R = 0.34
  const SEP_R2 = SEP_R * SEP_R
  const SEP_FORCE = 0.02

  useFrame(() => {
    const sims = simsRef.current
    const n = sims.length
    for (let i=0;i<n;i++){
      const A = sims[i]; if (!A?.group?.current) continue
      const pa = A.group.current.position
      for (let j=i+1;j<n;j++){
        const B = sims[j]; if (!B?.group?.current) continue
        const pb = B.group.current.position
        const dx = pa.x - pb.x, dy = pa.y - pb.y, dz = pa.z - pb.z
        const d2 = dx*dx + dy*dy + dz*dz
        if (d2 < SEP_R2 && d2 > 1e-5){
          const d = Math.sqrt(d2)
          const s = SEP_FORCE * (1.0 - d/SEP_R) / d
          const fx = dx * s, fy = dy * s, fz = dz * s
          A.state.v.x += fx; A.state.v.y += fy; A.state.v.z += fz
          B.state.v.x -= fx; B.state.v.y -= fy; B.state.v.z -= fz
        }
      }
    }
  })

  return (
    <group>
      {holders.map((h, i) => (
        <Fish
          key={h.address + i}
          holder={h}
          onClick={onFishClick}
          showLabel={showLabels}
          center={center}
          radius={radius}
          onRegister={s => { simsRef.current[i] = s }}
        />
      ))}
    </group>
  )
}

function Fish({ holder, onClick, showLabel, center, radius, onRegister }){
  const seed = hash32(holder.address)
  const modelIdx = seed % MODELS.length
  const gltf = useGLTF(MODELS[modelIdx])
  const group = useRef()
  const modelRef = useRef()
  const scale = 0.85 + (seed % 1000)/1000 * 0.9

  // random point inside sphere
  const randInSphere = useMemo(() => {
    const v = new THREE.Vector3()
    v.setFromSphericalCoords(
      Math.cbrt(Math.random()) * radius * 0.95,
      Math.acos(2*Math.random()-1),
      Math.random() * Math.PI * 2
    )
    return v.add(center.clone())
  }, [radius, center])

  const state = useMemo(() => ({
    p: randInSphere.clone(),
    v: new THREE.Vector3((Math.random()-0.5)*0.8, (Math.random()-0.5)*0.4, (Math.random()-0.5)*0.8),
    wobble: Math.random()*Math.PI*2
  }), [randInSphere])

  useEffect(()=>{ onRegister && onRegister({ group, state }) }, [])

  useFrame((_, dt) => {
    const g = group.current; if (!g) return
    const p = state.p

    // integrate
    p.addScaledVector(state.v, dt*1.0)

    // reflect off spherical boundary
    const toCenter = p.clone().sub(center) // vector from center to p
    const dist = toCenter.length()
    const R = radius * 0.995
    if (dist > R){
      const n = toCenter.normalize()
      // push back onto surface & reflect velocity
      state.p.copy(n.multiplyScalar(R).add(center))
      state.v.reflect(n)
      state.v.multiplyScalar(0.95) // slight damping on bounce
    }

    // attraction to center for cohesion + gentle wander
    const n = toCenter.normalize()
    state.v.addScaledVector(n.multiplyScalar(-1), 0.02 * dt) // pull inward
    state.v.x += Math.sin((p.z + seed*0.001)*0.6)*0.006
    state.v.z += Math.cos((p.x + seed*0.001)*0.6)*0.006
    state.v.y += Math.sin((p.x+p.z+seed*0.001)*0.25)*0.003
    state.v.clampLength(0.2, 1.1)

    // write transforms
    g.position.copy(p)
    const dir = state.v.clone().normalize()
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir)
    g.quaternion.slerp(targetQuat, Math.min(1, dt*3.0))

    state.wobble += dt*7.0
    const s = 1.0 + Math.sin(state.wobble)*0.02
    g.scale.setScalar(scale*s)
    if (modelRef.current) modelRef.current.rotation.y = Math.sin(state.wobble*2.2)*0.15
  })

  return (
    <group ref={group} position={state.p} onClick={(e)=>{ e.stopPropagation(); onClick?.(holder) }}>
      {/* Deep clone so every fish actually renders */}
      <Clone object={gltf.scene} ref={modelRef} />
      {showLabel && (
        <Html center position={[0, 0.9, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ font: '600 12px ui-sans-serif,system-ui', padding: '3px 6px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.45)', color: '#dff4ff', border: '1px solid rgba(255,255,255,0.15)'}}>
            {short(holder.address)}
          </div>
        </Html>
      )}
    </group>
  )
}
useGLTF.preload(MODELS[0]); useGLTF.preload(MODELS[1]); useGLTF.preload(MODELS[2]);
