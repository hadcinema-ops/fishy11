import React, { useEffect, useRef } from 'react'

export default function WinnerPanel({ fish, onClose }){
  const ref = useRef(null)
  useEffect(() => {
    const el = ref.current
    if (el){ el.animate([{ transform: 'scale(0.96)', opacity: 0 }, { transform: 'scale(1)', opacity: 1 }], { duration: 220, easing: 'cubic-bezier(.2,.7,.1,1)' }) }
  }, [])
  return (
    <div ref={ref} style={{position:'fixed',left:'50%',top:'10%',transform:'translateX(-50%)',pointerEvents:'auto'}}>
      <div className="glass" style={{padding:'14px 18px', color:'#e8f2ff'}}>
        <div style={{font:'800 18px/1.2 ui-sans-serif'}}>🏆 Winner Selected!</div>
        <div style={{font:'14px/1.5 ui-sans-serif',marginTop:6}}>
          <b>Wallet:</b> {fish.address}
        </div>
        {typeof fish.pnl === 'number' && <div style={{font:'14px/1.5 ui-sans-serif'}}>Est. PnL: {fish.pnl.toFixed(2)} SOL</div>}
        <div style={{marginTop:10}}>
          <button className="btn glass" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  )
}
