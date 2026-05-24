# Deploying the TNTSOL frontend (Vercel)

This folder is the **static design prototype** (see `README.md`) — plain
HTML/CSS/JS with no build step. Entry point: `index.html` (a showcase linking
every screen).

> Note: this is the high-fidelity design prototype, not the wired-up dApp. The
> production build (Next.js 15 + React 19 per `README.md`) is a separate track.

The repo root `vercel.json` configures Vercel to serve `frontend/` statically
(no build, no install). The Claude Code sandbox can't reach `api.vercel.com`
(network allowlist: `host_not_allowed`), so the deploy runs from Vercel's own
build infra via the Git integration.

## Option A — Vercel Git integration (recommended, no token)

1. <https://vercel.com/new> → **Import** this Git repository.
2. Leave the defaults — `vercel.json` already sets framework = Other, no build
   command, output directory = `frontend`.
3. **Deploy.** Every push to the production branch redeploys; pushes to other
   branches / PRs get preview URLs automatically.

No API token needed, and nothing secret ever touches this repo or chat.

## Option B — Vercel CLI from your machine

```sh
npm i -g vercel
vercel            # first run links/creates the project (uses vercel.json)
vercel --prod     # production deploy
```

`vercel login` (or a `VERCEL_TOKEN` env var) handles auth locally. Never commit
a token or paste it into chat.
