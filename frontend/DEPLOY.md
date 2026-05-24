# Deploying the TNTSOL frontend (Cloudflare Pages)

This folder is the **static design prototype** (see `README.md`) — plain
HTML/CSS/JS with no build step. Entry point: `index.html` (a showcase linking
every screen). It deploys to Cloudflare Pages as-is.

> Note: this is the high-fidelity design prototype, not the wired-up dApp. The
> production build (Next.js 15 + React 19 per `README.md`) is a separate track.

## Why you deploy this, not the agent

This repo's environment cannot reach `api.cloudflare.com` (it's not on the web
network allowlist), so the deploy must run from your machine or the Cloudflare
dashboard.

## Option A — connect the repo (no token, auto-deploys on push)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**.
2. Pick this repo / branch.
3. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `frontend`
4. Save & Deploy. Every push redeploys.

## Option B — Wrangler from your machine (needs an API token)

```sh
npm i -g wrangler
wrangler login                       # or set CLOUDFLARE_API_TOKEN as an env var
wrangler pages deploy frontend --project-name tntsol
```

The root `wrangler.toml` already sets `pages_build_output_dir = "frontend"`, so
from the repo root `wrangler pages deploy` also works.

**Never paste API tokens into chat or commit them.** Supply
`CLOUDFLARE_API_TOKEN` via your shell env or the environment's secret config.
