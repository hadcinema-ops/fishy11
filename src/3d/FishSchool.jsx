import React, { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF, Clone } from '@react-three/drei'

const MODELS = ['/assets/models/clownfish.glb','/assets/models/blue_tang.glb','/assets/models/goldfish.glb']

// Large world half-extents (±x, ±z, y range)
const WORLD = { x: 55, z: 35, yUp: 7.0, yDn: -3.0 }

function hash32(s){
  let h = 2166136261>>>0
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619)>>>0 }
  return h>>>0
}
function shortAddr(a){ if (!a) return ''; return a.slice(0,4)+'****'+a.slice(-4) }

function makeAnchor(seed){
  // deterministic spread across the big world
  const rng = (n)=>((Math.imul(seed ^ (n*0x9e3779b1>>>0), 0x85ebca6b)>>>0)/4294967295)
  const x = (rng(1)-0.5) * WORLD.x*1.8
  const z = (rng(2)-0.5) * WORLD.z*1.8
  const y = WORLD.yDn + rng(3)*(WORLD.yUp - WORLD.yDn) * 0.9
  return new THREE.Vector3(x, y, z)
}

function FishGLB({ holder, onClick, showLabel=true, anchor, onRegister }){
  const seed = hash32(holder.address)
  const modelIdx = seed % MODELS.length
  const gltf = useGLTF(MODELS[modelIdx])
  const group = useRef()
  const modelRef = useRef()
  const scale = 0.9 + (seed % 1000)/1000 * 0.9

  const state = useMemo(() => ({
    p: new THREE.Vector3(
      anchor.x + (Math.random()-0.5)*6,
      anchor.y + (Math.random()-0.5)*2,
      anchor.z + (Math.random()-0.5)*6
    ),
    v: new THREE.Vector3((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.25, (Math.random()-0.5)*0.6),
    wobble: Math.random()*Math.PI*2,
  }), [])

  useEffect(()=>{ onRegister && onRegister({ group, state }) }, [])

  useFrame((_, dt) => {
    const g = group.current; if (!g) return
    const p = state.p
    p.addScaledVector(state.v, dt*1.0)

    // Big bounds
    if (p.x > WORLD.x || p.x < -WORLD.x) state.v.x *= -1
    if (p.y > WORLD.yUp || p.y < WORLD.yDn) state.v.y *= -1
    if (p.z > WORLD.z || p.z < -WORLD.z) state.v.z *= -1

    // Gentle pull to personal anchor (keeps sub-schools apart)
    const toAnchor = new THREE.Vector3().copy(anchor).sub(p)
    state.v.addScaledVector(toAnchor, 0.0008)

    // Wander
    state.v.x += Math.sin((p.z + seed*0.001)*0.5)*0.006
    state.v.z += Math.cos((p.x + seed*0.001)*0.5)*0.006
    state.v.y += Math.sin((p.x+p.z+seed*0.001)*0.2)*0.0025
    state.v.clampLength(0.2, 1.0)

    // Transform
    g.position.copy(p)
    const dir = state.v.clone().normalize()
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir)
    g.quaternion.slerp(targetQuat, Math.min(1, dt*3.0))

    state.wobble += dt*7.0
    const s = 1.0 + Math.sin(state.wobble)*0.02
    g.scale.setScalar(scale*s)
    if (modelRef.current){ modelRef.current.rotation.y = Math.sin(state.wobble*2.2)*0.15 }
  })

  return (
    <group ref={group} position={state.p} onClick={(e)=>{ e.stopPropagation(); onClick?.(holder) }}>
      {/* Clone = deep instance so every fish is independent */}
      <Clone object={gltf.scene} ref={modelRef} />
      {showLabel && (
        <Html center position={[0, 0.9, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ font: '600 12px ui-sans-serif,system-ui', padding: '3px 6px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.45)', color: '#dff4ff', border: '1px solid rgba(255,255,255,0.15)'}}>
            {shortAddr(holder.address)}
          </div>
        </Html>
      )}
    </group>
  )
}
useGLTF.preload(MODELS[0]); useGLTF.preload(MODELS[1]); useGLTF.preload(MODELS[2]);

export default function FishSchool({ holders, onFishClick, showLabels=true }){
  // Assign wide anchors per holder
  const anchors = useMemo(()=> holders.map(h => makeAnchor(hash32(h.address))), [holders])

  // Register fish state to apply separation globally
  const simsRef = useRef([]) // each item: { group, state }
  simsRef.current.length = anchors.length

  // Separation settings (tune if you want even looser spacing)
  const SEPARATION_RADIUS = 2.4
  const SEPARATION_RADIUS2 = SEPARATION_RADIUS * SEPARATION_RADIUS
  const SEPARATION_FORCE = 0.012

  useFrame(() => {
    const sims = simsRef.current
    const n = sims.length
    for (let i=0;i<n;i++){
      const a = sims[i]; if (!a || !a.group?.current) continue
      const pa = a.group.current.position
      for (let j=i+1;j<n;j++){
        const b = sims[j]; if (!b || !b.group?.current) continue
        const pb = b.group.current.position
        const dx = pa.x - pb.x, dy = pa.y - pb.y, dz = pa.z - pb.z
        const d2 = dx*dx + dy*dy + dz*dz
        if (d2 < SEPARATION_RADIUS2 && d2 > 1e-6){
          const d = Math.sqrt(d2)
          const strength = SEPARATION_FORCE * (1.0 - d/SEPARATION_RADIUS)
          const invd = strength / d
          const fx = dx * invd, fy = dy * invd, fz = dz * invd
          a.state.v.x += fx; a.state.v.y += fy; a.state.v.z += fz
          b.state.v.x -= fx; b.state.v.y -= fy; b.state.v.z -= fz
        }
      }
    }
  })

  return (
    <group>
      {holders.map((h, i) => (
        <FishGLB
          key={h.address + i}
          holder={h}
          onClick={onFishClick}
          showLabel={showLabels}
          anchor={anchors[i]}
          onRegister={(s)=>{ simsRef.current[i] = s }}
        />
      ))}
    </group>
  )
}
