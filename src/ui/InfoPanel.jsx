import React from 'react'

function short(addr){
  if (!addr) return ''
  return addr.slice(0,6) + '…' + addr.slice(-6)
}

export default function InfoPanel({ fish, onClose }){
  return (
    <div className="panel glass">
      <h3>Holder Details</h3>
      <p><b>Wallet:</b> {fish.address}</p>
      <p><b>Balance:</b> {fish.balanceTokens?.toLocaleString()} tokens</p>
      {typeof fish.spentSOL === 'number' && <p><b>Est. Spent:</b> {fish.spentSOL.toFixed(3)} SOL</p>}
      {typeof fish.pnl === 'number' && <p><b>Est. PnL:</b> {fish.pnl.toFixed(2)} SOL</p>}
      <div className="copy" onClick={()=> navigator.clipboard.writeText(fish.address)}>Copy address</div>
      <div style={{marginTop:12}}>
        <button className="btn glass" onClick={onClose}>Close</button>
      </div>
    </div>
  )
}
