export const handler = async (event) => {
  try {
    const params = event.queryStringParameters || {};
    const mint = params.mint;
    const minTokens = Number(params.min || 100000);
    if (!mint) return resp(400, { error: 'Missing mint' });
    const apiKey = process.env.HELIUS_API_KEY;
    if (!apiKey) return resp(500, { error: 'Missing HELIUS_API_KEY env' });

    const rpcUrl = `https://mainnet.helius-rpc.com/?api-key=${apiKey}`;
    const body = {
      jsonrpc: "2.0", id: 1, method: "getProgramAccounts",
      params: [
        "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
        { encoding: "jsonParsed", filters: [{ dataSize: 165 }, { memcmp: { offset: 0, bytes: mint } }] }
      ]
    };

    const r = await fetch(rpcUrl, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) return resp(502, { error: "RPC error", details: await r.text() });
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

    return resp(200, { holders });
  } catch (e) {
    return resp(500, { error: String(e?.message || e) });
  }
};

const resp = (statusCode, body) => ({
  statusCode,
  headers: { "content-type": "application/json", "access-control-allow-origin": "*" },
  body: JSON.stringify(body)
});
