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

The app is a **static export** (`output: "export"` → `frontend/out`), and the
repo-root [`vercel.json`](../vercel.json) tells Vercel how to build it from the
monorepo. So a plain import with all defaults works — no project settings:

1. <https://vercel.com/new> → import the repo.
2. Leave everything at defaults and **Deploy**. The root `vercel.json` runs the
   build in `frontend/` and serves `frontend/out`.

Pushes to the production branch redeploy; PRs get preview URLs. No secrets or
tokens required.

> Alternatively (without the root `vercel.json`): set the project's **Root
> Directory** to `frontend` and Vercel auto-detects Next.js. Either path works.

Because it's a static export there are no server routes/SSR — fine for this
prototype. Wiring real wallet/chain calls later may want SSR; drop the
`output: "export"` line in `next.config.mjs` and deploy with Root Directory =
`frontend` at that point.
