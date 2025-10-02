/**
 * Netlify Function: /.netlify/functions/holders?mint=...&min=100000
 * Env:
 *   HELIUS_API_KEY  (required)
 */
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
      return resp(502, { error: "RPC error", details: t.slice(0,200) });
    }
    const j = await r.json();
    if (!Array.isArray(j.result)) {
      return resp(502, { error: "Unexpected RPC result", details: j });
    }
    const holders = j.result.map((it) => {
      const info = it?.account?.data?.parsed?.info;
      const owner = info?.owner || "Unknown";
      const amt = info?.tokenAmount?.amount ? Number(info.tokenAmount.amount) : 0;
      return { address: owner, balanceTokens: amt, spentSOL: 0 };
    }).filter(h => h.balanceTokens >= minTokens);

    return resp(200, { holders });
  } catch (e) {
    return resp(500, { error: String(e?.message || e) });
  }
}

const resp = (statusCode, body) => ({
  statusCode,
  headers: {
    "content-type": "application/json",
    "access-control-allow-origin": "*"
  },
  body: JSON.stringify(body)
})
