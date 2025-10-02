import React, { useMemo } from 'react'
import * as THREE from 'three'
import { useTexture } from '@react-three/drei'

export default function LogoBackdrop({
  url = '/assets/coin-logo.png',
  size = 60,          // width/height in scene units
  opacity = 0.22,     // tweak to taste
  y = 1,              // vertical placement
  z = -41.9           // just in front of your back panel at ~-42
}) {
  const tex = useTexture(url)

  // Ensure correct color space for bright, accurate colors
  useMemo(() => {
    if (!tex) return
    if ('colorSpace' in tex) tex.colorSpace = THREE.SRGBColorSpace     // three r150+
    else tex.encoding = THREE.sRGBEncoding                             // older three
    tex.anisotropy = 8
  }, [tex])

  return (
    <mesh position={[0, y, z]} renderOrder={-1}>
      <planeGeometry args={[size, size]} />
      <meshBasicMaterial
        map={tex}
        transparent
        opacity={opacity}
        depthWrite={false}   // prevents z-fighting sparkle, still stays behind fish by position
      />
    </mesh>
  )
}
