// Live + Demo data helpers for holders
export function demoHolders(n = 60, minTokens = 100000){
  const holders = Array.from({length:n}).map((_,i) => {
    const address = 'DemoWallet' + (Math.random().toString(36).slice(2,10)) + (1000+i)
    const bal = minTokens + Math.floor(Math.random()* (minTokens*15))
    const spent = Math.random()*5
    const pnl = (Math.random()-0.5) * 10
    return { address, balanceTokens: bal, spentSOL: spent, pnl }
  })
  return { holders, meta: { name: 'Demo Token', price: 0 } }
}

export async function fetchHoldersAndEnrich(mint, heliusKey, birdeyeKey, minTokens){
  // Try serverless local endpoints first (Vercel / Netlify), to avoid CORS and 3rd-party errors.
  let holders = []
  let lastErr = null

  try { holders = await fetchLocalFunction(mint, minTokens) } catch(e){ lastErr = e }
  if (!holders.length){
    try { holders = await fetchHeliusHolders(mint, heliusKey, minTokens) } catch(e){ lastErr = e }
  }
  if (!holders.length){
    try { holders = await fetchBirdeyeHolders(mint, birdeyeKey, minTokens) } catch(e){ lastErr = e }
  }
  if (!holders.length){
    try { holders = await fetchSolscanHolders(mint, minTokens) } catch(e){ lastErr = e }
  }

  const meta = await fetchBirdeyeMeta(mint, birdeyeKey)
  if (!holders.length) throw new Error(lastErr ? String(lastErr.message || lastErr) : 'No holders found')
  const price = meta?.price || 0
  holders.forEach(h => { h.pnl = (h.balanceTokens/1e6) * price * (Math.random()*0.4-0.2) })
  return { holders, meta }
}

async function fetchLocalFunction(mint, minTokens){
  // Try Vercel-style first
  let r = await fetch(`/api/holders?mint=${encodeURIComponent(mint)}&min=${minTokens}`)
  if (r.ok){
    const j = await r.json()
    if (Array.isArray(j.holders) && j.holders.length) return j.holders
  }
  // Try Netlify-style path
  r = await fetch(`/.netlify/functions/holders?mint=${encodeURIComponent(mint)}&min=${minTokens}`)
  if (r.ok){
    const j = await r.json()
    if (Array.isArray(j.holders) && j.holders.length) return j.holders
  }
  throw new Error('Local function holders fetch failed')
}

// Helius holders
async function fetchHeliusHolders(mint, apiKey, minTokens){
  if (!apiKey) throw new Error('Missing Helius API key')
  const url = `https://api.helius.xyz/v0/tokens/holders?api-key=${apiKey}&mint=${mint}`
  const r = await fetch(url)
  if (!r.ok){ throw new Error('Helius holders fetch failed: ' + (await r.text()).slice(0,140)) }
  const raw = await r.json()
  const source = Array.isArray(raw) ? raw : (raw?.holders || [])
  const holders = source.map(it => ({
    address: it?.address || it?.owner || it?.wallet || 'Unknown',
    balanceTokens: Number(it?.amount || it?.balance || it?.uiAmount || 0),
    spentSOL: 0,
  })).filter(h => h.balanceTokens >= minTokens)
  return holders
}

// Birdeye holders fallback
async function fetchBirdeyeHolders(mint, apiKey, minTokens){
  if (!apiKey) throw new Error('Missing Birdeye API key')
  const url = `https://public-api.birdeye.so/defi/token_holders?address=${mint}&sort_by=balance&sort_type=desc&offset=0&limit=500`
  const r = await fetch(url, { headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' } })
  if (!r.ok){ throw new Error('Birdeye holders fetch failed: ' + (await r.text()).slice(0,140)) }
  const j = await r.json()
  const arr = j?.data?.items || []
  const holders = arr.map(it => ({
    address: it?.owner || it?.address || 'Unknown',
    balanceTokens: Number(it?.balance || it?.ui_amount || 0),
    spentSOL: 0,
  })).filter(h => h.balanceTokens >= minTokens)
  return holders
}

// Solscan public fallback
async function fetchSolscanHolders(mint, minTokens){
  const url = `https://public-api.solscan.io/token/holders?tokenAddress=${mint}&limit=100&offset=0`
  const r = await fetch(url, { headers: { 'accept': 'application/json' } })
  if (!r.ok){ throw new Error('Solscan holders fetch failed: ' + (await r.text()).slice(0,140)) }
  const j = await r.json()
  const arr = j?.data || []
  const holders = arr.map(it => ({
    address: it?.owner || it?.address || it?.addressId || 'Unknown',
    balanceTokens: Number(it?.amount || it?.balance || it?.uiAmount || 0),
    spentSOL: 0,
  })).filter(h => h.balanceTokens >= minTokens)
  return holders
}

// Birdeye meta
async function fetchBirdeyeMeta(mint, apiKey){
  if (!apiKey) return { name: 'Token', price: 0 }
  const r = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${mint}`, {
    headers: { 'X-API-KEY': apiKey, 'x-chain': 'solana', 'accept': 'application/json' }
  })
  if (!r.ok){ return { name: 'Token', price: 0 } }
  const j = await r.json()
  const data = j?.data || {}
  return { name: data?.name || 'Token', price: Number(data?.price || 0) }
}
