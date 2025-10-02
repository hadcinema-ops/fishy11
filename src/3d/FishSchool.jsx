import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

function fishSeed(addr){
  let h = 2166136261
  for (let i=0;i<addr.length;i++){ h ^= addr.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24) }
  return Math.abs(h >>> 0) / 4294967295
}

function colorFromSeed(s){
  const h = (s*360) % 360
  const c1 = new THREE.Color().setHSL(h/360, 0.65, 0.55)       // body
  const c2 = new THREE.Color().setHSL(((h+40)%360)/360, 0.7, 0.6) // tail
  const c3 = new THREE.Color().setHSL(((h+310)%360)/360, 0.5, 0.5) // fins
  return [c1, c2, c3]
}

function makeFishParts(seed){
  const bodyLen = 1.0 + seed*0.8
  const bodyRad = 0.22 + seed*0.18
  const body = new THREE.CapsuleGeometry(bodyRad, bodyLen, 8, 16)
  // Tail (slightly wider for silhouette)
  const tail = new THREE.ConeGeometry(0.26+seed*0.16, 0.38+seed*0.2, 10)
  tail.translate(0,0,-(bodyLen/2 + 0.23))
  // Dorsal fin
  const dorsal = new THREE.ConeGeometry(0.13+seed*0.07, 0.22+seed*0.1, 8)
  dorsal.rotateX(Math.PI/2); dorsal.translate(0, (bodyRad*0.95), 0.1)
  // Pectoral fins (two small cones rotated outwards)
  const pectoral = new THREE.ConeGeometry(0.09+seed*0.05, 0.18+seed*0.08, 8)
  const eye = new THREE.SphereGeometry(0.05, 12, 12)
  return { body, tail, dorsal, pectoral, eye, len: bodyLen, rad: bodyRad }
}

function shortAddr(a){ if (!a) return ''; return a.slice(0,4)+'****'+a.slice(-4) }

function Fish({ holder, onClick, showLabel=true }){
  const seed = fishSeed(holder.address)
  const [cBody,cTail,cFin] = useMemo(()=>colorFromSeed(seed), [seed])
  const parts = useMemo(()=>makeFishParts(seed), [seed])
  const group = React.useRef()
  const leftFin = React.useRef()
  const rightFin = React.useRef()

  const init = useMemo(() => ({
    p: new THREE.Vector3((Math.random()-0.5)*10, -1.1 + Math.random()*4.4, (Math.random()-0.5)*6),
    v: new THREE.Vector3((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.25, (Math.random()-0.5)*0.6),
    wobble: Math.random()*Math.PI*2,
    scale: 0.9 + seed*0.9
  }), [seed])

  useFrame((_, dt) => {
    const g = group.current; if (!g) return
    const p = g.position
    p.addScaledVector(init.v, dt*1.0)
    const bounds = { x: 14.5, yUp: 3.2, yDn: -2.2, z: 7.5 }
    if (p.x > bounds.x || p.x < -bounds.x) init.v.x *= -1
    if (p.y > bounds.yUp || p.y < bounds.yDn) init.v.y *= -1
    if (p.z > bounds.z || p.z < -bounds.z) init.v.z *= -1
    init.v.x += (Math.sin((p.z + seed*5.0)*0.5))*0.006
    init.v.z += (Math.cos((p.x + seed*3.0)*0.5))*0.006
    init.v.y += Math.sin((p.x+p.z+seed*6.0)*0.2)*0.0025
    init.v.clampLength(0.2, 1.0)
    const dir = init.v.clone().normalize()
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir)
    g.quaternion.slerp(targetQuat, Math.min(1, dt*3.0))
    init.wobble += dt*7.0
    const s = 1.0 + Math.sin(init.wobble)*0.03
    g.scale.setScalar(init.scale*s)
    // gentle fin flap
    const flap = Math.sin(init.wobble*1.8)*0.6
    if (leftFin.current) leftFin.current.rotation.z = 0.6 + flap*0.25
    if (rightFin.current) rightFin.current.rotation.z = -0.6 - flap*0.25
  })

  return (
    <group ref={group} position={init.p} onClick={(e)=>{ e.stopPropagation(); onClick?.(holder) }}>
      {/* Body */}
      <mesh geometry={parts.body} castShadow>
        <meshStandardMaterial color={cBody} roughness={0.45} metalness={0.15} />
      </mesh>
      {/* Tail */}
      <mesh geometry={parts.tail} castShadow position={[0,0,-0.02]}>
        <meshStandardMaterial color={cTail} roughness={0.4} metalness={0.15} />
      </mesh>
      {/* Dorsal fin */}
      <mesh geometry={parts.dorsal} castShadow>
        <meshStandardMaterial color={cFin} roughness={0.5} metalness={0.2} />
      </mesh>
      {/* Pectoral fins */}
      <group position={[0.18, 0.02, 0.1]} rotation={[0,0,Math.PI/2]} ref={leftFin}>
        <mesh geometry={parts.pectoral}><meshStandardMaterial color={cFin} roughness={0.5} metalness={0.2} /></mesh>
      </group>
      <group position={[-0.18, 0.02, 0.1]} rotation={[0,0,-Math.PI/2]} ref={rightFin}>
        <mesh geometry={parts.pectoral}><meshStandardMaterial color={cFin} roughness={0.5} metalness={0.2} /></mesh>
      </group>
      {/* Eyes */}
      <mesh geometry={parts.eye} position={[0.12, 0.08, parts.len/2 - 0.25]}>
        <meshStandardMaterial color={'#0d1b2a'} metalness={0.0} roughness={1}/>
      </mesh>
      <mesh geometry={parts.eye} position={[-0.12, 0.08, parts.len/2 - 0.25]}>
        <meshStandardMaterial color={'#0d1b2a'} metalness={0.0} roughness={1}/>
      </mesh>
      {/* Label */}
      {showLabel && (
        <Html center position={[0, 0.6, 0]} style={{ pointerEvents: 'none' }}>
          <div style="font:600 12px ui-sans-serif,system-ui; padding:3px 6px; border-radius:8px; background:rgba(0,0,0,0.45); color:#dff4ff; border:1px solid rgba(255,255,255,0.15)">
            {shortAddr(holder.address)}
          </div>
        </Html>
      )}
    </group>
  )
}

export default function FishSchool({ holders, onFishClick, showLabels=true }){
  return <group>{holders.map((h,i)=>(<Fish key={h.address+i} holder={h} onClick={onFishClick} showLabel={showLabels} />))}</group>
}
