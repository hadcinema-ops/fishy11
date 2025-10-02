/**
 * Serverless holders fetcher (Vercel): /api/holders?mint=...&min=100000
 * Env:
 *   HELIUS_API_KEY  (required)
 */
export default async function handler(req, res) {
  try {
    const { mint, min } = req.query;
    const minTokens = Number(min || 100000);
    if (!mint) return res.status(400).json({ error: 'Missing mint' });
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'Missing HELIUS_API_KEY env' });

    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    const body = {
      jsonrpc: "2.0",
      id: 1,
      method: "getProgramAccounts",
      params: [
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        {
          encoding: "jsonParsed",
          filters: [
            { dataSize: 165 },
            { memcmp: { offset: 0, bytes: mint } }
          ]
        }
      ]
    };

    const r = await fetch(rpcUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: "RPC error", details: t.slice(0,200) });
    }
    const j = await r.json();
    if (!Array.isArray(j.result)) {
      return res.status(502).json({ error: "Unexpected RPC result", details: j });
    }
    const holders = j.result.map((it) => {
      const info = it?.account?.data?.parsed?.info;
      const owner = info?.owner || "Unknown";
      const amt = info?.tokenAmount?.amount ? Number(info.tokenAmount.amount) : 0;
      return { address: owner, balanceTokens: amt, spentSOL: 0 };
    }).filter(h => h.balanceTokens >= minTokens);

    return res.status(200).json({ holders });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
