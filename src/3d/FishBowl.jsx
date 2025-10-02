import React, { useMemo } from 'react'
import * as THREE from 'three'
import { MeshTransmissionMaterial } from '@react-three/drei'

/**
 * Glass bowl + inner water shell.
 * Place at the table center; fish swim inside the water radius.
 */
export default function FishBowl({
  center = [0, 4.3, 0],     // bowl center in world space (matches RoomScene table height)
  bowlRadius = 3.1,         // outer glass radius
  waterRadius = 3.0,        // inner water radius (fish radius should be ≤ this)
}) {
  const [x,y,z] = center

  return (
    <group>
      {/* Outer glass bowl */}
      <mesh position={[x,y,z]}>
        <sphereGeometry args={[bowlRadius, 96, 96]} />
        <MeshTransmissionMaterial
          // premium-looking glass
          ior={1.5}
          thickness={0.25}
          roughness={0.08}
          transmission={1}
          chromaticAberration={0.02}
          anisotropy={0.05}
          samples={8}
          resolution={256}
        />
      </mesh>

      {/* Water volume (slightly smaller) */}
      <mesh position={[x,y,z]}>
        <sphereGeometry args={[waterRadius, 64, 64]} />
        <meshPhysicalMaterial
          transparent
          opacity={0.22}
          roughness={0.15}
          metalness={0.0}
          clearcoat={1}
          clearcoatRoughness={0.12}
          color={'#6ec6ff'}
        />
      </mesh>
    </group>
  )
}
