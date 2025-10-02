import React from 'react'

export default function LoadingOverlay({ tokenName = 'Token' }){
  return (
    <div className="loading-wrap">
      <div className="glass loading-card">
        <div className="ripples" />
        <div style={{font: '700 18px/1.3 ui-sans-serif, system-ui', marginBottom: 4}}>Spawning Fish…</div>
        <div style={{font: '13px/1.5 ui-sans-serif, system-ui', opacity: 0.85}}>
          Preparing the aquarium for <b>{tokenName}</b>
        </div>
      </div>
    </div>
  )
}
