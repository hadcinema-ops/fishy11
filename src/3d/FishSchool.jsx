import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Procedural fish geometry + material per wallet
function fishSeed(addr){
  // simple hash -> number
  let h = 2166136261
  for (let i=0;i<addr.length;i++){
    h ^= addr.charCodeAt(i); h += (h<<1) + (h<<4) + (h<<7) + (h<<8) + (h<<24)
  }
  return Math.abs(h >>> 0) / 4294967295
}

function colorFromSeed(s){
  // generate harmonious palette
  const h = (s*360) % 360
  const c1 = new THREE.Color().setHSL(h/360, 0.65, 0.55)
  const c2 = new THREE.Color().setHSL(((h+50)%360)/360, 0.7, 0.6)
  const c3 = new THREE.Color().setHSL(((h+310)%360)/360, 0.5, 0.5)
  return [c1, c2, c3]
}

function makeFishGeometry(seed){
  const bodyLen = 0.8 + seed*0.9
  const bodyRad = 0.22 + seed*0.18
  const geom = new THREE.CapsuleGeometry(bodyRad, bodyLen, 6, 12)
  // fins
  const tail = new THREE.ConeGeometry(0.22+seed*0.15, 0.35+seed*0.2, 8)
  tail.translate(0,0,-(bodyLen/2 + 0.25))
  const dorsal = new THREE.ConeGeometry(0.12+seed*0.08, 0.22+seed*0.1, 8)
  dorsal.rotateX(Math.PI/2); dorsal.translate(0, (bodyRad*0.9), 0.1)
  const merged = THREE.BufferGeometryUtils ? null : null
  // We'll merge manually via simple approach
  const g = new THREE.BufferGeometry()
  // Use groups instead of actual merge for simplicity in demo
  // We will return parts and position in group.
  return { body: geom, tail, dorsal, len: bodyLen, rad: bodyRad }
}

function Fish({ holder, onClick }){
  const seed = fishSeed(holder.address)
  const [c1,c2,c3] = useMemo(()=>colorFromSeed(seed), [seed])
  const parts = useMemo(()=>makeFishGeometry(seed), [seed])
  const group = React.useRef()

  // initial pos + velocity
  const init = useMemo(() => ({
    p: new THREE.Vector3((Math.random()-0.5)*6, -1.2 + Math.random()*4, (Math.random()-0.5)*4),
    v: new THREE.Vector3((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.2, (Math.random()-0.5)*0.6),
    wobble: Math.random()*Math.PI*2,
    scale: 0.8 + seed*0.8
  }), [seed])

  useFrame((_, dt) => {
    const g = group.current; if (!g) return
    // Boids-ish bounds + wander
    const p = g.position
    p.addScaledVector(init.v, dt*1.0)
    // bounce within tank (-8..8, -2..3.5, -5..5)
    if (p.x > 7.5 || p.x < -7.5) init.v.x *= -1
    if (p.y > 3.0 || p.y < -2.0) init.v.y *= -1
    if (p.z > 5.0 || p.z < -5.0) init.v.z *= -1
    // gentle steering
    init.v.x += (Math.sin((p.z + seed*5.0)*0.5))*0.005
    init.v.z += (Math.cos((p.x + seed*3.0)*0.5))*0.005
    init.v.y += Math.sin((p.x+p.z+seed*6.0)*0.2)*0.002
    init.v.clampLength(0.2, 1.0)
    // face movement direction
    const dir = init.v.clone().normalize()
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir)
    g.quaternion.slerp(targetQuat, Math.min(1, dt*2.5))
    // swim wobble
    init.wobble += dt*6.0
    const s = 1.0 + Math.sin(init.wobble)*0.035
    g.scale.setScalar(init.scale*s)
  })

  return (
    <group ref={group} position={init.p} onClick={(e)=>{ e.stopPropagation(); onClick?.(holder) }}>
      <mesh geometry={parts.body} castShadow>
        <meshStandardMaterial color={c1} roughness={0.5} metalness={0.1} />
      </mesh>
      <mesh geometry={parts.tail} castShadow>
        <meshStandardMaterial color={c2} roughness={0.45} metalness={0.15} />
      </mesh>
      <mesh geometry={parts.dorsal} castShadow>
        <meshStandardMaterial color={c3} roughness={0.5} metalness={0.2} />
      </mesh>
    </group>
  )
}

export default function FishSchool({ holders, onFishClick }){
  return (
    <group>
      {holders.map((h, i) => (
        <Fish key={h.address + i} holder={h} onClick={onFishClick} />
      ))}
    </group>
  )
}
