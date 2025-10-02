import LogoBackdrop from './LogoBackdrop.jsx'
import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

const CausticsMaterial = () => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: false,
    uniforms: { uTime: { value: 0 }, uTint: { value: new THREE.Color('#0e6ba8') } },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv; uniform float uTime; uniform vec3 uTint;
      float waves(vec2 p){
        float t=uTime*0.4, v=0.0;
        v+=sin((p.x*12.0)+t)*0.5+0.5;
        v+=sin((p.y*14.0)-t*1.2)*0.5+0.5;
        v+=sin((p.x*8.0+p.y*6.0)+t*0.8)*0.5+0.5;
        return v/3.0;
      }
      void main(){
        float w=waves(vUv*2.0);
        vec3 col=mix(vec3(0.02,0.06,0.1), uTint*0.35, w);
        float veins=smoothstep(0.7,1.0,w); col+=veins*vec3(0.45,0.6,0.7);
        gl_FragColor=vec4(col,1.0);
      }
    `
  }), [])
  useFrame((_,dt)=>{ mat.uniforms.uTime.value+=dt })
  return <primitive object={mat} attach="material" />
}

export default function Tank(){
  return (
    <group>
      {/* Bigger, brighter scene */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[18,24,16]} intensity={1.2} castShadow shadow-mapSize={[2048,2048]} />

      {/* HUGE floor */}
      <mesh position={[0,-3.0,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[120, 80, 1, 1]} />
        <CausticsMaterial />
      </mesh>

      {/* Far back panel for depth */}
      <mesh position={[0,6,-42]} receiveShadow>
        <planeGeometry args={[140, 50, 1, 1]} />
        <meshStandardMaterial color="#051922" roughness={0.9} metalness={0.05} />
      </mesh>

      {/* Coin logo on the back wall */}
<LogoBackdrop url="/assets/coin-logo.png" size={60} opacity={0.22} y={1} z={-41.9} />

      <Bubbles />
    </group>
  )
}

function Bubbles({ count = 220 }){
  const geo = useMemo(() => new THREE.SphereGeometry(0.06, 12, 12), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a8d7ff', roughness: 0.35, metalness: 0.0 }), [])
  const seeds = useMemo(() => new Array(count).fill(0).map((_,i)=> ({
    x: (Math.random()-0.5)*90,
    z: (Math.random()-0.5)*60,
    y: -2.8 - Math.random()*2.4,
    s: 0.6 + Math.random()*0.9,
    speed: 0.35 + Math.random()*0.55
  })), [count])
  const ref = React.useRef()

  useFrame((_, dt) => {
    const m = ref.current; if (!m) return
    for (let i=0;i<count;i++){
      const o = seeds[i]; o.y += dt*o.speed
      if (o.y > 6.5) o.y = -3.2 - Math.random()*2.2
      const px = o.x + Math.sin((o.y+i)*1.5)*0.18
      const pz = o.z + Math.cos((o.y+i)*1.1)*0.18
      const s = 0.08 * o.s
      m.setMatrixAt(i, new THREE.Matrix4().compose(
        new THREE.Vector3(px, o.y, pz),
        new THREE.Quaternion(),
        new THREE.Vector3(s,s,s)
      ))
    }
    m.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geo, mat, count]} />
}
