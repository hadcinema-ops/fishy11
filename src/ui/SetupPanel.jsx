import React, { useEffect, useState } from 'react'

const LS_KEY = 'fish_cfg_v1'

export default function SetupPanel({ cfg, onApply, onRefresh }){
  const [mint, setMint] = useState(cfg.mint || '')
  const [helius, setHelius] = useState(cfg.helius || '')
  const [birdeye, setBirdeye] = useState(cfg.birdeye || '')
  const [minTokens, setMinTokens] = useState(cfg.minTokens || 100000)
  const [open, setOpen] = useState(false)

  useEffect(()=>{
    const saved = localStorage.getItem(LS_KEY)
    if (saved){
      try{
        const j = JSON.parse(saved)
        setMint(j.mint||''); setHelius(j.helius||''); setBirdeye(j.birdeye||''); setMinTokens(j.minTokens||100000)
      }catch{}
    }
  }, [])

  const apply = () => {
    const next = { mint: mint.trim(), helius: helius.trim(), birdeye: birdeye.trim(), minTokens: Number(minTokens||100000) }
    localStorage.setItem(LS_KEY, JSON.stringify(next))
    onApply(next)
  }

  return (
    <div style={{position:'fixed', left: 16, top: 16, zIndex: 10}}>
      {/* Toggle handle */}
      <div className="glass btn" onClick={()=> setOpen(!open)}>{open ? 'Close' : '⚙️ Setup'}</div>
      {open && (
        <div className="glass" style={{marginTop: 10, padding: 14, width: 320, color:'#e9f3ff'}}>
          <div style={{font:'700 14px ui-sans-serif'}}>Live Data Setup</div>
          <div style={{marginTop:10, font:'13px ui-sans-serif'}}>
            <div>Mint Address</div>
            <input value={mint} onChange={e=>setMint(e.target.value)} placeholder="Pump.fun mint" style={inp}/>
            <div style={{marginTop:8}}>Helius API Key</div>
            <input value={helius} onChange={e=>setHelius(e.target.value)} placeholder="helius..." style={inp}/>
            <div style={{marginTop:8}}>Birdeye API Key</div>
            <input value={birdeye} onChange={e=>setBirdeye(e.target.value)} placeholder="birdeye..." style={inp}/>
            <div style={{marginTop:8}}>Min Tokens (default 100,000)</div>
            <input value={minTokens} onChange={e=>setMinTokens(e.target.value)} type="number" style={inp}/>
          </div>
          <div style={{display:'flex', gap:8, marginTop:12}}>
            <button className="btn glass" onClick={apply}>Set</button>
            <button className="btn glass" onClick={onRefresh}>Refresh Holders</button>
            <button className="btn glass" onClick={()=>{ localStorage.removeItem(LS_KEY); setMint(''); setHelius(''); setBirdeye(''); setMinTokens(100000); }}>Reset</button>
          </div>
          <div style={{font:'12px ui-sans-serif', opacity:0.8, marginTop:6}}>Tip: values are saved locally so you don’t retype them.</div>
        </div>
      )}
    </div>
  )
}

const inp = {
  width:'100%', padding:'8px 10px', marginTop:'4px',
  background:'rgba(255,255,255,0.06)', color:'#e9f3ff',
  border:'1px solid rgba(255,255,255,0.18)', borderRadius:8, outline:'none'
}
