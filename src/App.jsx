import React, { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import Tank from './3d/Tank.jsx'
import FishSchool from './3d/FishSchool.jsx'
import LoadingOverlay from './ui/LoadingOverlay.jsx'
import InfoPanel from './ui/InfoPanel.jsx'
import WinnerPanel from './ui/WinnerPanel.jsx'
import SetupPanel from './ui/SetupPanel.jsx'
import StatusBadge from './ui/StatusBadge.jsx'
import { fetchHoldersAndEnrich, demoHolders } from './api/data.js'

const DEFAULT_MIN_TOKENS = 100000
const AUTO_REFRESH_MS = 30000
const LS_KEY = 'fish_cfg_v1'

export default function App(){
  const [holders, setHolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [winner, setWinner] = useState(null)
  const [tokenMeta, setTokenMeta] = useState({ name: 'Demo Token', price: 0 })

  const [cfg, setCfg] = useState(()=>{
    // prefer saved localStorage config first
    try {
      const saved = localStorage.getItem(LS_KEY)
      if (saved){
        const j = JSON.parse(saved)
        return {
          mint: j.mint || '',
          helius: j.helius || '',
          birdeye: j.birdeye || '',
          minTokens: Number(j.minTokens || DEFAULT_MIN_TOKENS),
        }
      }
    } catch {}
    return {
      mint: import.meta.env.VITE_MINT || '',
      helius: import.meta.env.VITE_HELIUS_KEY || '',
      birdeye: import.meta.env.VITE_BIRDEYE_KEY || '',
      minTokens: Number(import.meta.env.VITE_MIN_TOKENS || DEFAULT_MIN_TOKENS),
    }
  })

  const useDemo = !cfg.mint || !cfg.helius || !cfg.birdeye

  const load = async () => {
    setLoading(true); setError(null)
    try {
      if (useDemo){
        const { holders: demo, meta } = demoHolders(60, cfg.minTokens)
        setHolders(demo); setTokenMeta(meta)
      } else {
        const { holders: live, meta } = await fetchHoldersAndEnrich(cfg.mint, cfg.helius, cfg.birdeye, cfg.minTokens)
        if (!live || !live.length) throw new Error('No qualifying holders found (or fetch failed).')
        setHolders(live); setTokenMeta(meta)
      }
    } catch (e){
      console.error(e)
      setError(String(e.message || e))
      const { holders: demo, meta } = demoHolders(60, cfg.minTokens)
      setHolders(demo); setTokenMeta(meta)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, AUTO_REFRESH_MS)
    return () => clearInterval(t)
  }, [cfg.mint, cfg.helius, cfg.birdeye, cfg.minTokens])

  const onPickWinner = () => {
    if (!holders.length) return
    const w = holders[Math.floor(Math.random() * holders.length)]
    setWinner({ ...w, price: tokenMeta.price })
    // do NOT auto-close; user will close via X now
  }

  return (
    <>
      <Canvas shadows camera={{ position: [35, 12, 46], fov: 55 }}>
        <color attach="background" args={['#031018']} />
        <Tank />
        <FishSchool holders={holders} onFishClick={setSelected} showLabels />
        <OrbitControls enablePan={false} minDistance={12} maxDistance={100} />
      </Canvas>

      {loading && <LoadingOverlay tokenName={tokenMeta?.name} />}

      <SetupPanel
        cfg={cfg}
        onApply={(next)=>{ setCfg(next) }}
        onRefresh={load}
      />

      <div className="ui">
        <div className="corner glass" style={{display:'flex',gap:8}}>
          <div className="btn" onClick={load}>⟳ Refresh Holders</div>
          <div className="btn" onClick={onPickWinner}>🎉 Pick Winner</div>
        </div>
      </div>

      <StatusBadge live={!useDemo && !error} error={useDemo ? null : error} />

      {selected && <InfoPanel fish={selected} onClose={() => setSelected(null)} />}
      {winner && <WinnerPanel fish={winner} onClose={() => setWinner(null)} />}
    </>
  )
}
