import React from 'react'
import * as THREE from 'three'
import FishBowl from './FishBowl.jsx'
import FishSchoolBowl from './FishSchoolBowl.jsx'
import { ContactShadows } from '@react-three/drei'

/**
 * Minimal stylized room with table + fishbowl.
 * FishSchoolBowl receives holders from App and swims inside the bowl.
 */
export default function RoomScene({ holders, onFishClick, showLabels = true }){
  // room sizes
  const floorY = 0
  const tableY = 1
  const tableTopH = 0.4
  const tableTopSize = [16, tableTopH, 10] // [w, h, d]
  const bowlRadius = 3.1
  const waterRadius = 3.0
  const bowlCenter = [0, tableY + tableTopH/2 + bowlRadius, 0] // on top of table

  return (
    <group>
      {/* Lights */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[8,16,10]} intensity={1.2} castShadow shadow-mapSize={[2048,2048]} />

      {/* Floor */}
      <mesh position={[0, floorY-0.001, 0]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#20262e" roughness={0.95} metalness={0.02} />
      </mesh>

      {/* Walls */}
      <mesh position={[0, 10, -30]} receiveShadow>
        <planeGeometry args={[80, 30]} />
        <meshStandardMaterial color="#0f1720" roughness={0.95} metalness={0.02} />
      </mesh>
      <mesh position={[-40, 10, 0]} rotation={[0, Math.PI/2, 0]} receiveShadow>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color="#0e141b" roughness={0.96} metalness={0.02} />
      </mesh>
      <mesh position={[40, 10, 0]} rotation={[0, -Math.PI/2, 0]} receiveShadow>
        <planeGeometry args={[60, 30]} />
        <meshStandardMaterial color="#0e141b" roughness={0.96} metalness={0.02} />
      </mesh>

      {/* Framed coin logo on back wall */}
      <mesh position={[0, 18, -29.9]}>
        <planeGeometry args={[18, 18]} />
        <meshBasicMaterial map={new THREE.TextureLoader().load('/assets/coin-logo.png')} transparent opacity={0.35} depthWrite={false} />
      </mesh>

      {/* Table */}
      <group position={[0, tableY, 0]}>
        {/* top */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={tableTopSize} />
          <meshStandardMaterial color="#2b343f" roughness={0.7} metalness={0.05} />
        </mesh>
        {/* legs */}
        {[
          [-tableTopSize[0]/2 + 0.6, -tableTopH/2, -tableTopSize[2]/2 + 0.6],
          [ tableTopSize[0]/2 - 0.6, -tableTopH/2, -tableTopSize[2]/2 + 0.6],
          [-tableTopSize[0]/2 + 0.6, -tableTopH/2,  tableTopSize[2]/2 - 0.6],
          [ tableTopSize[0]/2 - 0.6, -tableTopH/2,  tableTopSize[2]/2 - 0.6],
        ].map((p,i)=>(
          <mesh key={i} position={[p[0], p[1]-2.0, p[2]]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 4.0, 12]} />
            <meshStandardMaterial color="#242b34" roughness={0.7} metalness={0.05} />
          </mesh>
        ))}
      </group>

      {/* Fishbowl + water */}
      <FishBowl center={bowlCenter} bowlRadius={bowlRadius} waterRadius={waterRadius} />

      {/* Fish inside the bowl */}
      <FishSchoolBowl
        holders={holders}
        onFishClick={onFishClick}
        showLabels={showLabels}
        center={new THREE.Vector3(...bowlCenter)}
        radius={waterRadius}
      />

      {/* Soft contact shadows on the table */}
      <ContactShadows position={[0, tableY-0.02, 0]} opacity={0.45} blur={2.2} far={20} />
    </group>
  )
}
