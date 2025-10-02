import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'

function fishSeed(addr){
  let h = 2166136261
  for (let i=0;i<addr.length;i++){ h ^= addr.charCodeAt(i); h += (h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24) }
  return Math.abs(h >>> 0) / 4294967295
}

function shortAddr(a){ if (!a) return ''; return a.slice(0,4)+'****'+a.slice(-4) }

function colorFromSeed(s){
  const h = (s*360) % 360
  const body = new THREE.Color().setHSL(h/360, 0.55, 0.55)
  const fin  = new THREE.Color().setHSL(((h+35)%360)/360, 0.7, 0.6)
  const eye  = new THREE.Color(0x0b1620)
  return { body, fin, eye }
}

// Lathe profile to look like a fish body (side silhouette revolved around Z axis -> we orient later)
function makeFishGeometry(seed){
  const len = 1.2 + seed*0.8
  const rad = 0.22 + seed*0.18
  const pts = []
  // profile from nose (x=0) to tail (x=len)
  const steps = 12
  for (let i=0;i<=steps;i++){
    const t = i/steps
    // bell-shaped body; narrow nose/tail
    const r = rad * (1.0 - Math.pow(Math.abs(t-0.5)*2.0, 1.5)*0.8)
    pts.push(new THREE.Vector2(r, t*len))
  }
  const body = new THREE.LatheGeometry(pts, 24)
  // Rotate so fish forward is +Y
  body.rotateX(Math.PI/2)

  // Tail: plane geometry we can flap
  const tail = new THREE.PlaneGeometry(0.6+seed*0.3, 0.5+seed*0.25, 1, 4)
  tail.translate(0, 0, (len/2)+0.05)

  // Dorsal / pectoral fins as planes
  const fin = new THREE.PlaneGeometry(0.35, 0.22, 1, 1)
  const pectoral = new THREE.PlaneGeometry(0.28, 0.18, 1, 1)
  // Eyes
  const eye = new THREE.SphereGeometry(0.05, 12, 12)

  return { body, tail, fin, pectoral, eye, len, rad }
}

function Fish({ holder, onClick, showLabel=true }){
  const seed = fishSeed(holder.address)
  const colors = useMemo(()=>colorFromSeed(seed), [seed])
  const parts = useMemo(()=>makeFishGeometry(seed), [seed])
  const group = React.useRef()
  const tailRef = React.useRef()
  const leftFin = React.useRef()
  const rightFin = React.useRef()

  const init = useMemo(() => ({
    p: new THREE.Vector3((Math.random()-0.5)*12, -1.0 + Math.random()*4.2, (Math.random()-0.5)*7),
    v: new THREE.Vector3((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.25, (Math.random()-0.5)*0.6),
    wobble: Math.random()*Math.PI*2,
    scale: 0.9 + seed*0.9
  }), [seed])

  useFrame((_, dt) => {
    const g = group.current; if (!g) return
    const p = g.position
    p.addScaledVector(init.v, dt*1.0)
    const bounds = { x: 15, yUp: 3.2, yDn: -2.2, z: 8.5 }
    if (p.x > bounds.x || p.x < -bounds.x) init.v.x *= -1
    if (p.y > bounds.yUp || p.y < bounds.yDn) init.v.y *= -1
    if (p.z > bounds.z || p.z < -bounds.z) init.v.z *= -1

    init.v.x += Math.sin((p.z + seed*5.0)*0.5)*0.006
    init.v.z += Math.cos((p.x + seed*3.0)*0.5)*0.006
    init.v.y += Math.sin((p.x+p.z+seed*6.0)*0.2)*0.0025
    init.v.clampLength(0.2, 1.0)

    // Face movement direction (+Z forward in our model, so align there)
    const dir = init.v.clone().normalize()
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir)
    g.quaternion.slerp(targetQuat, Math.min(1, dt*3.0))

    init.wobble += dt*7.0
    const s = 1.0 + Math.sin(init.wobble)*0.03
    g.scale.setScalar(init.scale*s)

    // Tail flap & pectoral wiggle
    if (tailRef.current){
      tailRef.current.rotation.y = Math.sin(init.wobble*2.2)*0.5
    }
    if (leftFin.current){
      leftFin.current.rotation.x = Math.sin(init.wobble*1.8)*0.4
    }
    if (rightFin.current){
      rightFin.current.rotation.x = -Math.sin(init.wobble*1.8)*0.4
    }
  })

  return (
    <group ref={group} position={init.p} onClick={(e)=>{ e.stopPropagation(); onClick?.(holder) }}>
      {/* Body */}
      <mesh geometry={parts.body} castShadow>
        <meshStandardMaterial color={colors.body} roughness={0.5} metalness={0.15} />
      </mesh>
      {/* Tail */}
      <mesh geometry={parts.tail} ref={tailRef} position={[0,0,parts.len/2]}>
        <meshStandardMaterial color={colors.fin} side={THREE.DoubleSide} roughness={0.4} metalness={0.1} />
      </mesh>
      {/* Dorsal fin */}
      <mesh geometry={parts.fin} position={[0, parts.rad*1.05, -0.1]} rotation={[-Math.PI/2,0,0]}>
        <meshStandardMaterial color={colors.fin} side={THREE.DoubleSide} roughness={0.5} metalness={0.1} />
      </mesh>
      {/* Pectoral fins */}
      <mesh ref={leftFin} geometry={parts.pectoral} position={[parts.rad*0.9, 0, 0.2]} rotation={[0,Math.PI/2,0]}>
        <meshStandardMaterial color={colors.fin} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={rightFin} geometry={parts.pectoral} position={[-parts.rad*0.9, 0, 0.2]} rotation={[0,-Math.PI/2,0]}>
        <meshStandardMaterial color={colors.fin} side={THREE.DoubleSide} />
      </mesh>
      {/* Eyes */}
      <mesh geometry={parts.eye} position={[parts.rad*0.6, parts.rad*0.25, parts.len/2 - 0.25]}>
        <meshStandardMaterial color={colors.eye} />
      </mesh>
      <mesh geometry={parts.eye} position={[-parts.rad*0.6, parts.rad*0.25, parts.len/2 - 0.25]}>
        <meshStandardMaterial color={colors.eye} />
      </mesh>
      {/* Label */}
      {showLabel && (
        <Html center position={[0, parts.rad*1.6, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ font: '600 12px ui-sans-serif,system-ui', padding: '3px 6px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.5)', color: '#dff4ff', border: '1px solid rgba(255,255,255,0.15)'}}>
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
