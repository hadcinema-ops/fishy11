export default async function handler(req, res) {
  try {
    const { mint, min } = req.query;
    const minTokens = Number(min || 100000);
    if (!mint) return res.status(400).json({ error: 'Missing mint' });
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing HELIUS_API_KEY env' });

    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    const body = {
      jsonrpc: "2.0", id: 1, method: "getProgramAccounts",
      params: [
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        { encoding: "jsonParsed", filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: mint } }] }
      ]
    };

    const r = await fetch(rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return res.status(502).json({ error: "RPC error", details: await r.text() });
    const j = await r.json();
    const map = new Map();
    for (const it of (j.result || [])){
      const info = it?.account?.data?.parsed?.info;
      const owner = info?.owner; const ta = info?.tokenAmount;
      if (!owner || !ta) continue;
      const amount = Number(ta.amount || 0);
      const decimals = Number(ta.decimals || 0);
      const ui = decimals ? amount / (10 ** decimals) : amount;
      map.set(owner, (map.get(owner) || 0) + ui);
    }
    const holders = Array.from(map.entries())
      .map(([address, ui]) => ({ address, balanceTokens: ui, spentSOL: 0 }))
      .filter(h => h.balanceTokens >= minTokens);

    return res.status(200).json({ holders });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
