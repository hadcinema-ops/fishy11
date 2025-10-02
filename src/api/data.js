// Live + Demo data helpers for holders
export function demoHolders(n = 60, minTokens = 100000){
  const holders = Array.from({length:n}).map((_,i) => {
    const address = 'DemoWallet' + (Math.random().toString(36).slice(2,10)) + (1000+i)
    const bal = minTokens + Math.floor(Math.random()* (minTokens*15))
    const spent = Math.random()*5
    const pnl = (Math.random()-0.5) * 10
    return { address, balanceTokens: bal, spentSOL: spent, pnl }
  })
  return { holders, meta: { name: 'Demo Token', price: 0, decimals: 0 } }
}

export async function fetchHoldersAndEnrich(mint, heliusKey, birdeyeKey, minTokens){
  const meta = await fetchBirdeyeMeta(mint, birdeyeKey) // get price + decimals first
  const decimals = Number(meta?.decimals || 0)
  let holders = []
  let lastErr = null

  try { holders = await fetchLocalFunction(mint, minTokens) } catch(e){ lastErr = e }
  if (!holders.length){
    try { holders = await fetchHeliusHolders(mint, heliusKey, minTokens, decimals) } catch(e){ lastErr = e }
  }
  if (!holders.length){
    try { holders = await fetchBirdeyeHolders(mint, birdeyeKey, minTokens) } catch(e){ lastErr = e }
  }
  if (!holders.length){
    try { holders = await fetchSolscanHolders(mint, minTokens, decimals) } catch(e){ lastErr = e }
  }

  if (!holders.length) throw new Error(lastErr ? String(lastErr.message || lastErr) : 'No holders found')
  const price = meta?.price || 0
  holders.forEach(h => { h.pnl = (h.balanceTokens) * (price || 0) * (Math.random()*0.4-0.2) / 1e6 }) // naive estimate
  return { holders, meta }
}

async function fetchLocalFunction(mint, minTokens){
  let r = await fetch(`/api/holders?mint=${encodeURIComponent(mint)}&min=${minTokens}`)
  if (r.ok){ const j = await r.json(); if (Array.isArray(j.holders) && j.holders.length) return j.holders }
  r = await fetch(`/.netlify/functions/holders?mint=${encodeURIComponent(mint)}&min=${minTokens}`)
  if (r.ok){ const j = await r.json(); if (Array.isArray(j.holders) && j.holders.length) return j.holders }
  throw new Error('Local function holders fetch failed')
}

// Helius REST holders fallback
async function fetchHeliusHolders(mint, apiKey, minTokens, decimals=0){
  if (!apiKey) throw new Error('Missing Helius API key')
  const url = `https://api.helius.xyz/v0/tokens/holders?api-key=${apiKey}&mint=${mint}`
  const r = await fetch(url)
  if (!r.ok){ throw new Error('Helius holders fetch failed: ' + (await r.text()).slice(0,200)) }
  const raw = await r.json()
  const arr = Array.isArray(raw) ? raw : (raw?.holders || [])
  const map = new Map()
  for (const it of arr){
    const owner = it?.address || it?.owner || it?.wallet
    if (!owner) continue
    const amountRaw = Number(it?.amount || it?.balance || 0)
    const ui = decimals ? (amountRaw / (10**decimals)) : (it?.uiAmount != null ? Number(it.uiAmount) : amountRaw)
    map.set(owner, (map.get(owner) || 0) + (isFinite(ui) ? ui : 0))
  }
  return Array.from(map, ([address, ui]) => ({ address, balanceTokens: ui, spentSOL: 0 })).filter(h => h.balanceTokens >= minTokens)
}

// Birdeye holders fallback (already provides ui_amount)
async function fetchBirdeyeHolders(mint, apiKey, minTokens){
  if (!apiKey) throw new Error('Missing Birdeye API key')
  const url = `https://public-api.birdeye.so/defi/token_holders?address=${mint}&sort_by=balance&sort_type=desc&offset=0&limit=500`
  const r = await fetch(url, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' } })
  if (!r.ok){ throw new Error('Birdeye holders fetch failed: ' + (await r.text()).slice(0,200)) }
  const j = await r.json()
  const arr = j?.data?.items || []
  const map = new Map()
  for (const it of arr){
    const owner = it?.owner || it?.address
    if (!owner) continue
    const ui = Number(it?.ui_amount ?? it?.uiAmount ?? 0)
    map.set(owner, (map.get(owner) || 0) + (isFinite(ui) ? ui : 0))
  }
  return Array.from(map, ([address, ui]) => ({ address, balanceTokens: ui, spentSOL: 0 })).filter(h => h.balanceTokens >= minTokens)
}

// Solscan public fallback (amount is raw; scale via decimals)
async function fetchSolscanHolders(mint, minTokens, decimals=0){
  const url = `https://public-api.solscan.io/token/holders?tokenAddress=${mint}&limit=100&offset=0`
  const r = await fetch(url, { headers: { 'accept': 'application/json' } })
  if (!r.ok){ throw new Error('Solscan holders fetch failed: ' + (await r.text()).slice(0,200)) }
  const j = await r.json()
  const arr = j?.data || []
  const map = new Map()
  for (const it of arr){
    const owner = it?.owner || it?.address || it?.addressId
    if (!owner) continue
    const amountRaw = Number(it?.amount || it?.balance || it?.uiAmount || 0)
    const ui = decimals ? (amountRaw / (10**decimals)) : amountRaw
    map.set(owner, (map.get(owner) || 0) + (isFinite(ui) ? ui : 0))
  }
  return Array.from(map, ([address, ui]) => ({ address, balanceTokens: ui, spentSOL: 0 })).filter(h => h.balanceTokens >= minTokens)
}

// Birdeye meta (price + decimals)
export async function fetchBirdeyeMeta(mint, apiKey){
  if (!apiKey) return { name: 'Token', price: 0, decimals: 0 }
  const r = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${mint}`, {
    headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' }
  })
  if (!r.ok){ return { name: 'Token', price: 0, decimals: 0 } }
  const j = await r.json()
  const d = j?.data || {}
  return { name: d?.name || 'Token', price: Number(d?.price || 0), decimals: Number(d?.decimals || 0) }
}
