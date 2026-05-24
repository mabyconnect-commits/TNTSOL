# TNTSOL frontend

The TNTSOL web app — a responsive prototype of the devnet token-trading
platform (pump.fun-style bonding curves + the whitelist/blacklist redemption
model). Built with **Next.js 15 (App Router) + React 19 + TypeScript**.

Design source of truth lives in [`../design/`](../design) (static mockups +
`SPEC-*.md`); this app ports that design system into a real, interactive UI.

## Screens

| Route | Screen | Interactive |
| --- | --- | --- |
| `/` | **Floor** — discover board: live feed, hero strip, sparks rail | links through to tokens |
| `/token/[id]` | **Trade** — chart, graduation meter, holders, buy/sell panel | ✅ buy/sell, presets, live curve pricing (x·y=k), activation-fee preview |
| `/launch` | **Light the fuse** — create a token | ✅ live preview + cost updates as you type |
| `/portfolio` | **Portfolio** — bucket donut, holdings, graduation watch | — |
| `/redeem` | **Redeem** — devSOL → mainnet SOL | ✅ amount → payout calculator, presets |

Responsive: desktop uses the multi-column shell + top nav; on ≤860px it
collapses to a single column with a fixed bottom tab bar.

The wallet is **mocked** (`components/WalletProvider.tsx`) — connect/disconnect
toggles the UI. No chain calls; all figures are illustrative prototype data
(`lib/data.ts`). Wiring up `@solana/wallet-adapter` + the on-chain program is the
next step.

## Develop

```sh
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also typechecks)
```

## Deploy (Vercel)

This app lives in the `frontend/` subdirectory of the monorepo, so set the
Vercel project's **Root Directory** to `frontend`:

1. <https://vercel.com/new> → import the repo.
2. **Root Directory:** `frontend` (Vercel auto-detects Next.js — leave build
   command / output dir at the Next.js defaults).
3. Deploy. Pushes to the production branch redeploy; PRs get preview URLs.

No secrets or tokens required — Vercel's Git integration handles auth.
