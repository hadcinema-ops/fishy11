import React from 'react'

export default function StatusBadge({ live, error }){
  return (
    <div style={{position:'fixed', left:16, bottom:16, zIndex:15}}>
      <div className="glass" style={{padding:'6px 10px', color: live ? '#c8f5d0' : '#ffd6ae', border:'1px solid rgba(255,255,255,0.15)'}}>
        <span style={{font:'700 12px ui-sans-serif'}}>{live ? 'LIVE' : 'DEMO'}</span>
        {error && <span style={{marginLeft:8, font:'12px ui-sans-serif', color:'#ffb4b4'}}>· {error}</span>}
      </div>
    </div>
  )
}
