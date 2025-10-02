import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'

// Simple animated 'caustics' via fragment waves
const CausticsMaterial = () => {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    transparent: false,
    uniforms: {
      uTime: { value: 0 },
      uTint: { value: new THREE.Color('#0e6ba8') },
    },
    vertexShader: /* glsl */`
      varying vec2 vUv;
      void main(){
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);
      }
    `,
    fragmentShader: /* glsl */`
      precision highp float;
      varying vec2 vUv;
      uniform float uTime;
      uniform vec3 uTint;
      float waves(vec2 p){
        float t = uTime*0.4;
        float v = 0.0;
        v += sin((p.x*12.0)+t)*0.5+0.5;
        v += sin((p.y*14.0)-t*1.2)*0.5+0.5;
        v += sin((p.x*8.0 + p.y*6.0)+t*0.8)*0.5+0.5;
        return v/3.0;
      }
      void main(){
        float w = waves(vUv*2.0);
        vec3 col = mix(vec3(0.03,0.08,0.12), uTint*0.35, w);
        // bright veins
        float veins = smoothstep(0.7, 1.0, w);
        col += veins*vec3(0.45,0.6,0.7);
        gl_FragColor = vec4(col,1.0);
      }
    `
  }), [])
  useFrame((_, dt) => { mat.uniforms.uTime.value += dt })
  return <primitive object={mat} attach="material" />
}

export default function Tank(){
  // Glass box
  const glass = useMemo(() => new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#1c6ea4').multiplyScalar(0.05),
    roughness: 0.1,
    transmission: 0.95,
    thickness: 0.25,
    transparent: true,
    ior: 1.33,
    metalness: 0.0
  }), [])

  return (
    <group position={[0,0,0]}>
      {/* Lights */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[6,8,4]} intensity={1.1} castShadow shadow-mapSize={[2048,2048]} />

      {/* Floor with animated caustics */}
      <mesh position={[0,-2.5,0]} rotation={[-Math.PI/2,0,0]} receiveShadow>
        <planeGeometry args={[18, 12, 1, 1]} />
        <CausticsMaterial />
      </mesh>

      {/* Back panel for depth */}
      <mesh position={[0,0,-6]} receiveShadow>
        <planeGeometry args={[18, 10, 1, 1]} />
        <meshStandardMaterial color="#06202f" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Glass walls */}
      <mesh position={[0,0,0]} castShadow receiveShadow>
        <boxGeometry args={[18,10,12]} />
        <primitive object={glass} attach="material" />
      </mesh>

      {/* Bubbles - simple instanced spheres rising */}
      <Bubbles />
    </group>
  )
}

function Bubbles({ count = 120 }){
  const geo = useMemo(() => new THREE.SphereGeometry(0.06, 12, 12), [])
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#a8d7ff', roughness: 0.2, metalness: 0.0, emissive: '#000000' }), [])
  const seeds = useMemo(() => new Array(count).fill(0).map((_,i)=> ({
    x: (Math.random()-0.5)*14,
    z: (Math.random()-0.5)*8,
    y: -2.3 - Math.random()*2.0,
    s: 0.6 + Math.random()*0.8,
    speed: 0.4 + Math.random()*0.6
  })), [count])
  const ref = React.useRef()

  useFrame((_, dt) => {
    const m = ref.current
    if (!m) return
    let idx = 0
    for (let i=0;i<count;i++){
      const o = seeds[i]
      o.y += dt*o.speed
      if (o.y > 3.6) o.y = -2.8 - Math.random()*2.0
      const px = o.x + Math.sin((o.y+ i)*1.5)*0.15
      const pz = o.z + Math.cos((o.y+ i)*1.3)*0.15
      const s = 0.08 * o.s
      m.setMatrixAt(i, new THREE.Matrix4().compose(
        new THREE.Vector3(px, o.y, pz),
        new THREE.Quaternion(),
        new THREE.Vector3(s,s,s)
      ))
    }
    m.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[geo, mat, count]} />
  )
}
