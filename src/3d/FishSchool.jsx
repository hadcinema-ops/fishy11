import React, { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Html, useGLTF } from '@react-three/drei'

const MODELS = ['/assets/models/clownfish.glb','/assets/models/blue_tang.glb','/assets/models/goldfish.glb']

function hash32(s){
  let h = 2166136261>>>0
  for (let i=0;i<s.length;i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619)>>>0 }
  return h>>>0
}
function shortAddr(a){ if (!a) return ''; return a.slice(0,4)+'****'+a.slice(-4) }

function FishGLB({ holder, onClick, showLabel=true }){
  const seed = hash32(holder.address)
  const modelIdx = seed % MODELS.length
  const gltf = useGLTF(MODELS[modelIdx])
  const group = useRef()
  const scale = 0.9 + (seed % 1000)/1000 * 0.9

  // Random-ish start
  const init = useMemo(() => ({
    p: new THREE.Vector3((Math.random()-0.5)*10, -1.0 + Math.random()*4.0, (Math.random()-0.5)*6.5),
    v: new THREE.Vector3((Math.random()-0.5)*0.6, (Math.random()-0.5)*0.25, (Math.random()-0.5)*0.6),
    wobble: Math.random()*Math.PI*2,
  }), [])

  useFrame((_, dt) => {
    const g = group.current; if (!g) return
    const p = g.position
    p.addScaledVector(init.v, dt*1.0)
    const bounds = { x: 11, yUp: 2.6, yDn: -1.9, z: 6.5 }
    if (p.x > bounds.x || p.x < -bounds.x) init.v.x *= -1
    if (p.y > bounds.yUp || p.y < bounds.yDn) init.v.y *= -1
    if (p.z > bounds.z || p.z < -bounds.z) init.v.z *= -1
    // center attraction
    init.v.x += (-p.x)*0.0008 + Math.sin((p.z + seed*0.001)*0.5)*0.006
    init.v.z += (-p.z)*0.0008 + Math.cos((p.x + seed*0.001)*0.5)*0.006
    init.v.y += (-p.y)*0.0005 + Math.sin((p.x+p.z+seed*0.001)*0.2)*0.0025
    init.v.clampLength(0.2, 1.0)

    // Orient forward in velocity (+Z forward)
    const dir = init.v.clone().normalize()
    const targetQuat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir)
    g.quaternion.slerp(targetQuat, Math.min(1, dt*3.0))

    // Subtle swim wobble
    init.wobble += dt*7.0
    const s = 1.0 + Math.sin(init.wobble)*0.02
    g.scale.setScalar(scale*s)

    // Tail/fins pseudo flap: small y rotation on mesh
    if (g.children[0]){
      g.children[0].rotation.y = Math.sin(init.wobble*2.2)*0.15
    }
  })

  return (
    <group ref={group} position={init.p} onClick={(e)=>{ e.stopPropagation(); onClick?.(holder) }}>
      <primitive object={gltf.scene} />
      {showLabel && (
        <Html center position={[0, 0.7, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ font: '600 12px ui-sans-serif,system-ui', padding: '3px 6px', borderRadius: '8px',
                        background: 'rgba(0,0,0,0.5)', color: '#dff4ff', border: '1px solid rgba(255,255,255,0.15)'}}>
            {shortAddr(holder.address)}
          </div>
        </Html>
      )}
    </group>
  )
}
useGLTF.preload(MODELS[0]); useGLTF.preload(MODELS[1]); useGLTF.preload(MODELS[2]);

export default function FishSchool({ holders, onFishClick, showLabels=true }){
  return <group>{holders.map((h,i)=>(<FishGLB key={h.address+i} holder={h} onClick={onFishClick} showLabel={showLabels} />))}</group>
}
