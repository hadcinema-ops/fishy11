// Live + Demo data helpers for holders
// NOTE: On first load, app defaults to Demo unless you define VITE_MINT, VITE_HELIUS_KEY, VITE_BIRDEYE_KEY.

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
  // Attach PnL estimate (dummy calc using price * balance with random offset for demo purposes)
  const price = meta?.price || 0
  holders.forEach(h => { h.pnl = (h.balanceTokens/1e6) * price * (Math.random()*0.4-0.2) })
  return { holders, meta }
}

// Helius holders fetcher (simple plausible endpoint pattern; user must ensure CORS or proxy if needed)
async function fetchHeliusHolders(mint, apiKey, minTokens){
  try {
    const url = `https://api.helius.xyz/v0/tokens/holders?api-key=${apiKey}&mint=${mint}`
    const r = await fetch(url)
    if (!r.ok) throw new Error('Helius holders fetch failed')
    const raw = await r.json()
    // Map and filter
    const holders = (raw?.holders || raw || []).map(it => ({
      address: it?.address || it?.owner || it?.wallet || 'Unknown',
      balanceTokens: Number(it?.amount || it?.balance || 0),
      spentSOL: 0,
    })).filter(h => h.balanceTokens >= minTokens)
    return holders
  } catch(e){
    console.error(e)
    throw e
  }
}

// Birdeye price + name
async function fetchBirdeyeMeta(mint, apiKey){
  try {
    const r = await fetch(`https://public-api.birdeye.so/defi/token_overview?address=${mint}`, {
      headers: { 'X-API-KEY': apiKey, 'accept': 'application/json' }
    })
    if (!r.ok) throw new Error('Birdeye meta fetch failed')
    const j = await r.json()
    const data = j?.data || {}
    return { name: data?.name || 'Token', price: Number(data?.price || 0) }
  } catch(e){
    console.error(e)
    return { name: 'Token', price: 0 }
  }
}
