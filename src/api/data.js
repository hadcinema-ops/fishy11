// Live + Demo data helpers for holders
export function demoHolders(n = 60, minTokens = 100000){
  const holders = Array.from({length:n}).map((_,i) => {
    const address = 'DemoWallet' + (Math.random().toString(36).slice(2,10)) + (1000+i)
    const bal = minTokens + Math.floor(Math.random()* (minTokens*15))
    const spent = Math.random()*5
    const pnl = (Math.random()-0.5) * 10
    return { address, balanceTokens: bal, spentSOL: spent, pnl }
  })
  return {
    holders,
    meta: { name: 'Demo Token', price: 0 }
  }
}

export async function fetchHoldersAndEnrich(mint, heliusKey, birdeyeKey, minTokens){
  const [holders, meta] = await Promise.all([
    fetchHeliusHolders(mint, heliusKey, minTokens),
    fetchBirdeyeMeta(mint, birdeyeKey),
  ])
  const price = meta?.price || 0
  holders.forEach(h => { h.pnl = (h.balanceTokens/1e6) * price * (Math.random()*0.4-0.2) })
  return { holders, meta }
}

// NOTE: Helius endpoints and shapes can change; this version expects a 'holders' array with address/amount.
// If this fails due to CORS or shape changes, the app falls back to Demo Mode.
async function fetchHeliusHolders(mint, apiKey, minTokens){
  const url = `https://api.helius.xyz/v0/tokens/holders?api-key=${apiKey}&mint=${mint}`
  const r = await fetch(url)
  if (!r.ok){
    const txt = await r.text()
    throw new Error('Helius holders fetch failed: ' + txt.slice(0,140))
  }
  const raw = await r.json()
  const source = Array.isArray(raw) ? raw : (raw?.holders || [])
  const holders = source.map(it => ({
    address: it?.address || it?.owner || it?.wallet || 'Unknown',
    balanceTokens: Number(it?.amount || it?.balance || it?.uiAmount || 0),
    spentSOL: 0,
  })).filter(h => h.balanceTokens >= minTokens)
  return holders
}

async function fetchBirdeyeMeta(mint, apiKey){
  const r = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${mint}`, {
    headers: {
      'X-API-KEY': apiKey,
      'x-chain': 'solana',
      'accept': 'application/json'
    }
  })
  if (!r.ok){
    const t = await r.text()
    console.warn('Birdeye meta fetch failed:', t)
    return { name: 'Token', price: 0 }
  }
  const j = await r.json()
  const data = j?.data || {}
  return { name: data?.name || 'Token', price: Number(data?.price || 0) }
}
