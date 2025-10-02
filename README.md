# Fish Tank – Stream-Ready (React + Three.js)

High-quality 3D aquarium that turns token holders into animated fish.
- Fullscreen, cinematic look with OrbitControls (drag + zoom).
- Winner picker with cinematic zoom + overlay.
- Demo mode by default; live mode with Helius + Birdeye keys.
- Auto-refresh every 30s; graceful fallback to demo on error.
- Default Min Tokens threshold hardcoded to **100,000**.

## Quick Start (Local)
```bash
npm install
npm run dev
```

## Build for Netlify Drop
```bash
npm run build
# zip the ./dist folder or the whole repo for Netlify Drop
```

## Env (optional for live data)
Create a `.env` (or `.env.production`) with:
```
VITE_MINT=YOUR_PUMPFUN_MINT
VITE_HELIUS_KEY=YOUR_HELIUS_API_KEY
VITE_BIRDEYE_KEY=YOUR_BIRDEYE_API_KEY
VITE_MIN_TOKENS=100000
```

> If env is missing, the app runs Demo Mode (spawns ~60 sample fish).

## Files
- `src/App.jsx` — glue: scene, overlays, data loop
- `src/3d/Tank.jsx` — aquarium, glass, lights, bubbles, caustics shader
- `src/3d/FishSchool.jsx` — procedural fish, movement, click handling
- `src/ui/LoadingOverlay.jsx` — branded-free loading
- `src/ui/InfoPanel.jsx` — fish details on click
- `src/ui/WinnerPanel.jsx` — winner overlay
- `src/api/data.js` — data fetch (Helius+Birdeye) + demo generator

## Notes
- Client-side fetch of Helius/Birdeye may require CORS allowance. If you hit CORS, either:
  - Use Netlify functions as a small proxy, or
  - Enable allowed origins in respective dashboards.
- The fish AI is optimized for smooth streaming at 60 FPS on modern GPUs.


## Live holders fallbacks
1) Helius → 2) Birdeye → 3) Solscan public (rate-limited). If all fail, app shows DEMO and an error badge.
