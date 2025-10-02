import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Tank from './3d/Tank.jsx'
import FishSchool from './3d/FishSchool.jsx'
import LoadingOverlay from './ui/LoadingOverlay.jsx'
import InfoPanel from './ui/InfoPanel.jsx'
import WinnerPanel from './ui/WinnerPanel.jsx'
import { fetchHoldersAndEnrich, demoHolders } from './api/data.js'

const DEFAULT_MIN_TOKENS = 100000  // hardcoded default threshold
const AUTO_REFRESH_MS = 30000

export default function App(){
  const [holders, setHolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [winner, setWinner] = useState(null)
  const [tokenMeta, setTokenMeta] = useState({ name: 'Demo Token', price: 0 })

  // Read optional env keys (if provided during build/deploy). If missing -> Demo Mode.
  const cfg = useMemo(() => ({
    mint: import.meta.env.VITE_MINT || '',
    helius: import.meta.env.VITE_HELIUS_KEY || '',
    birdeye: import.meta.env.VITE_BIRDEYE_KEY || '',
    minTokens: Number(import.meta.env.VITE_MIN_TOKENS || DEFAULT_MIN_TOKENS),
  }), [])

  const useDemo = !cfg.mint || !cfg.helius || !cfg.birdeye

  const load = async () => {
    setLoading(true); setError(null)
    try {
      if (useDemo){
        const { holders: demo, meta } = demoHolders(60, cfg.minTokens)
        setHolders(demo); setTokenMeta(meta)
      } else {
        const { holders: live, meta } = await fetchHoldersAndEnrich(cfg.mint, cfg.helius, cfg.birdeye, cfg.minTokens)
        setHolders(live); setTokenMeta(meta)
      }
    } catch (e){
      console.error(e)
      setError(e.message || 'Failed to load data')
      const { holders: demo, meta } = demoHolders(60, cfg.minTokens)
      setHolders(demo); setTokenMeta(meta)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, AUTO_REFRESH_MS)
    return () => clearInterval(t)
  }, [])

  const onPickWinner = () => {
    if (!holders.length) return
    const w = holders[Math.floor(Math.random() * holders.length)]
    setWinner({ ...w, price: tokenMeta.price })
    // auto clear winner panel after 2.5s
    setTimeout(() => setWinner(null), 2500)
  }

  return (
    <>
      <Canvas shadows camera={{ position: [8, 4.5, 10], fov: 50 }} style={{ width: '100%', height: '100%' }}>
        <color attach="background" args={['#031018']} />
        <Tank />
        <FishSchool holders={holders} onFishClick={setSelected} />
        <OrbitControls enablePan={false} minDistance={5} maxDistance={18} />
      </Canvas>

      {loading && <LoadingOverlay tokenName={tokenMeta?.name} />}

      {/* Floating Pick Winner button */}
      <div className="ui">
        <div className="corner glass btn" onClick={onPickWinner}>
          🎉 Pick Winner
        </div>
      </div>

      {/* Info & Winner panels */}
      {selected && <InfoPanel fish={selected} onClose={() => setSelected(null)} />}
      {winner && <WinnerPanel fish={winner} onClose={() => setWinner(null)} />}
    </>
  )
}
