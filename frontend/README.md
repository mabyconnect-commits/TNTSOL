# Handoff: TNTSOL — Devnet Trading Platform

## Overview

**TNTSOL** is a permissionless trading platform on Solana **devnet** where users launch and trade memecoins on a bonding curve, with a unique twist: every devSOL position carries a "fuse" — a one-time **1% activation fee** that converts test devSOL into real, redeemable mainnet SOL.

The product surface includes:
- A marketing landing page
- A dApp with 5 core screens (discovery floor, token detail, portfolio, launch, redeem)
- A treasury/operator admin console
- Transaction state modals (sign / broadcast / settle / fail variants)
- A graduation animation (the "blast" moment)
- Mobile (iOS) screens for the same core flows
- Brand identity (logo, color, type, voice, iconography)
- Social/merch surfaces (OG cards, Twitter banner, stickers, apparel)

Reference spec: `SPEC-f039710b.md` (included in this folder) — the original technical spec describing the bucket system, fee structure, graduation flow, and reserve mechanics.

---

## About the Design Files

**The HTML/CSS/JS files in this bundle are design references**, not production code. They are static prototypes built to communicate the visual design, layout, microcopy, and intended behavior of TNTSOL.

The implementation task is to **recreate these designs in the target codebase's environment**. If no codebase exists yet, the recommended starting stack is:

- **Frontend**: Next.js 15 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 with the design tokens in this README pulled into `tailwind.config`
- **Solana**: `@solana/web3.js` + `@solana/wallet-adapter-react` + Anchor for program calls
- **State**: Zustand for client state; SWR or TanStack Query for chain data
- **Charts**: TradingView Lightweight Charts (price/curve) or Recharts (simpler)
- **Mobile**: React Native + Expo (matches the desktop component model)

Use the bundled HTML as the visual source of truth — match colors, typography, spacing, microcopy, and interaction details from these files exactly.

---

## Fidelity

**High-fidelity.** All screens are pixel-targeted at their listed viewport widths. Colors, type, spacing, radii, and shadows are final. Microcopy is final. Layout decisions are intentional.

What's *not* shippable from these files:
- The HTML uses `<script>` tags to render template strings into the DOM — replace with real React components in your stack.
- Data is mocked. All token names, balances, transactions, and addresses are placeholders.
- No real wallet, RPC, or program calls are wired up — only the UI states.

---

## Design Tokens

All tokens live in `tokens.css` as CSS custom properties. Reproduce these in your design system (e.g. `tailwind.config.ts` `theme.extend`).

### Brand colors

| Token | Hex | Role |
|---|---|---|
| `--tnt-red` | `#FF2D1F` | **Primary brand.** CTAs, alerts, accents, logo body |
| `--tnt-red-hot` | `#FF5436` | Hover state for primary |
| `--tnt-red-deep` | `#B81A0F` | Primary border, pressed state |
| `--fuse-amber` | `#FFB627` | **Secondary brand.** Fuse, spark, blacklist bucket, warnings |
| `--fuse-amber-soft` | `#FFD27A` | Fuse hover/glow |
| `--spark-cream` | `#FFF6E8` | **Accent.** Highlights, light text on red |

### Solana semantic colors

| Token | Hex | Role |
|---|---|---|
| `--sol-green` / `--whitelist` | `#14F195` | Whitelist bucket, success, "redeemable", PnL up |
| `--sol-green-deep` / `--whitelist-soft` | `#0B8F58` | Border for whitelist surfaces |
| `--sol-purple` / `--info` | `#9945FF` | Solana DNA accent, info/secondary links |
| `--whitelist-bg` | `#08201A` | Tinted background for whitelist badges/banners |
| `--blacklist` | `#FFB627` | Blacklist bucket (= fuse-amber) |
| `--blacklist-bg` | `#1F1808` | Tinted background for blacklist surfaces |
| `--danger` | `#FF2D1F` | (= tnt-red) destructive |

### Neutrals (dark surfaces)

| Token | Hex | Role |
|---|---|---|
| `--carbon` | `#0A0908` | Canvas / page background |
| `--soot` | `#121110` | Card surface |
| `--smoke` | `#1A1817` | Hover row, secondary surface |
| `--ash` | `#25221F` | Border (subtle) |
| `--gravel` | `#3A3531` | Border (strong), disabled text |
| `--concrete` | `#5C544D` | Secondary text, labels |
| `--bone` | `#E8E2D5` | Primary text on dark |
| `--paper` | `#F5EFE3` | Light-mode page bg |
| `--paper-tint` | `#FBF6EC` | Light-mode card bg, text on red |

### Typography

```
--font-display: 'Space Grotesk', system-ui, sans-serif;   // headings, body
--font-body:    'Space Grotesk', system-ui, sans-serif;   // body
--font-mono:    'JetBrains Mono', ui-monospace, monospace; // numerics, labels, code
```

Both fonts via Google Fonts. Weight axes used: Space Grotesk 400/500/600/700, JetBrains Mono 400/500/700.

### Type scale (display)

| Token | Px | Letter-spacing | Line-height | Use |
|---|---|---|---|---|
| Display XL | 96 / 120 | -0.045em / -0.05em | 0.9-0.94 | Hero h1 |
| Display L | 64 | -0.035em | 0.95 | Page h1, section hero |
| Heading M | 32 | -0.02em | 1.1 | Section h2, card h3 |
| Heading S | 22-24 | -0.02em | 1.15 | Card titles |
| Body L | 22 | 0 | 1.45 | Lede paragraphs |
| Body M | 15-16 | 0 | 1.55 | Body copy |
| Eyebrow (mono) | 11-13 | 0.14-0.2em UPPER | 1 | Section eyebrows, tags |
| Numeric (mono) | 12-56 | -0.02em | 1 | All prices, percents, balances, addresses |
| Caption (mono) | 10-12 | 0.04-0.12em | 1.5 | Meta, labels, tx hashes |

**Important rules:**
- All numbers (prices, balances, PnL, percentages, tx hashes, addresses) use `JetBrains Mono` with `font-variant-numeric: tabular-nums`.
- Eyebrows and tags are always in mono, UPPERCASE, with wide letter-spacing.
- Headings use Space Grotesk with tight negative letter-spacing (-0.02 to -0.05em).

### Spacing & radii

- 8px grid (`--grid: 8px`)
- Radii: `--r-xs:4px`, `--r-sm:6px`, `--r-md:10px`, `--r-lg:14px`, `--r-xl:20px`

### Shadows

- Card: `0 16px 40px -16px rgba(0,0,0,0.6)` + `0 1px 0 rgba(255,255,255,0.04) inset`
- Red glow (primary CTA): `0 20px 50px -16px rgba(255,45,31,0.5)`
- Green glow (redeem CTA): `0 20px 50px -16px rgba(20,241,149,0.5)`
- Amber spark: `0 0 14px var(--fuse-amber)` (inline on dots, sparks)

---

## The Bucket System (core concept — implement carefully)

This is TNTSOL's central innovation. Every devSOL balance the user holds has a **bucket** label:

- **WHITELIST** (`--whitelist`, green) — already activated, redeemable for real SOL at any time
- **BLACKLIST** (`--blacklist`, amber) — locked, must be activated by paying a one-time **1% fee** on the next trade

Implementation requirements:

1. **Every balance must carry its bucket.** Every place balances appear (portfolio, token detail, holder list, trade modal, mobile cards), the bucket badge appears beside it.
2. **Bucket badges** are `--whitelist-bg` or `--blacklist-bg` background, glowing dot + text label in their respective semantic colors. See `.bucket` class in `app.css`.
3. **The activation moment is a hero event.** When a user trades blacklist devSOL, surface the 1% fee explicitly in the trade receipt; show the resulting whitelist balance in green; trigger a success toast/modal that explicitly says "fuse lit · activated".
4. **Portfolio donut split** is the signature visual. See `Portfolio.html` — net worth is split into WL/BL slices on a donut, with a "% redeemable" center label.
5. **Activation banner** appears on the Portfolio screen whenever blacklist > 0; one click leads to a confirm modal previewing the fee.

---

## Screens

For each screen below, see the corresponding HTML file in this bundle.

### 1. Landing page — `product/Landing.html`

**Purpose:** Marketing site explaining what TNTSOL is and converting visitors to launch the app.

**Layout (1280px max width):**
- Top nav with brand, nav links (Floor / Launch / Redeem / Docs / Treasury), and "Connect wallet" + "Open app" CTAs
- Hero section with radial red+amber glow, eyebrow pill, 120px display headline, lede, two CTAs, and 4-stat meta row
- 4-cell stat strip (Activation fee 1%, Redemption 0.8%, Graduation 85, Treasury split 80/20)
- "How it works" 3-card grid: Acquire → Activate → Redeem (each with mini receipt visual)
- Feature rows alternating left/right — "The Floor" + a mock token list, "Buckets" + the donut visual
- CTA bar (red-glow card)
- 4-column footer with brand block + Product/Resources/Community columns

**Key components:**
- `.hero-btn` (primary red CTA, 16px font, 16/22 padding, red glow shadow)
- `.hero-btn.ghost` (transparent, ash border)
- `.how-card` (32px padding, mini receipt in `--carbon`)
- All numeric stats in mono, all headings in Space Grotesk display

### 2. The Floor (discovery) — `product/screens/Floor.html`

**Purpose:** Live pump.fun-style discovery feed for all tokens on the platform.

**Layout:**
- 3-column: 220px left sidebar + flexible main + 320px right rail (`grid-template-columns: 220px 1fr 320px`)
- Top nav with brand, devnet pill, tabs (Floor active), search box, "Light a fuse" CTA, wallet pill

**Left sidebar:**
- "DISCOVER" group: Live floor, Sparks (1h), Climbing, Graduating, Dust
- "YOUR BAGS" group: Holdings, Watchlist, Launched
- "SOCIAL" group: Crew picks, Whale flow
- Active item has `--ash` background + 3px `--tnt-red` left rail
- Floor stats card pinned to bottom (TVL, vol, launches, activations)

**Main feed:**
- H1 "The Floor" with red pulse dot + "LIVE · 1,284 tokens" subtext
- Pill filter row: All / Sparks / Climbing / Graduating + sort dropdown
- 3-card hero strip: "GRADUATING NOW" (red glow primary), "FRESH SPARK" (amber accent), "CLIMBING" (green accent) — each shows price, percent, mcap, grad meter
- Feed table: rank | token (avatar+name+bucket+holders) | price | 5m | 1h | mcap | curve | buy button
- Spark rows (rank 1) get a red-tinted background gradient

**Right rail:**
- "GRADUATION IMMINENT" pulsing card with a "Detonate buy →" CTA
- "● LIVE TRADES" feed of buy/sell tx-lines (border-left colored)
- "FRESH SPARKS" mini list with avatars + age + percent

### 3. Token detail — `product/screens/Token.html`

**Purpose:** Trade view for a single token. Combines chart, curve graduation meter, holder list, and trade panel.

**Layout:**
- 2-column: flexible main + 380px right trade panel

**Main:**
- Breadcrumb (Floor / Whitelist / token name)
- Token header: 64px gradient avatar, big name with ticker + bucket badge, mint/launched/holder meta, Watch + Share buttons
- 4-cell price hero (Price, Market cap, Volume 24h, Holders) with change deltas
- Chart card: tab strip (Price / Curve / Holders / Volume) + range strip (1m → All) + area chart with graduation reference line
- Graduation card: large percent ("96.9%"), red-amber gradient meter with glowing thumb, copy explaining "next 2.6 devSOL"
- Tabs: Holders / Trades / Crew / Comments
- Holder list table

**Trade panel (right):**
- "YOUR POSITION" card at top (balance, avg entry, PnL, bucket)
- Buy/Sell tab toggle (green/red)
- Amount input with currency dropdown (devSOL/PEPED), MAX button, preset row (0.1 / 0.5 / 1 / MAX)
- Activation notice card if user is trading blacklist devSOL (amber accent)
- Receipt: pay / activation fee / platform fee / price impact / slippage → divider → "You receive" in green
- Big green "Light the fuse → Buy" CTA with glow
- Footer with curve info + tx slot

### 4. Portfolio — `product/screens/Portfolio.html`

**Purpose:** User's bag view showing the WL/BL bucket split and all holdings.

**Layout:** Single 1440px max-width column, no sidebar.

- Page header: H1 "Portfolio" + wallet/sync sub + Export/Deposit/Redeem actions
- **Bucket hero card** (the signature visual):
  - 2-column: left = "NET WORTH · DEVNET" + 52px total + PnL + lede explaining buckets + two `.bl-card` legends (WHITELIST green-left-border, BLACKLIST amber-left-border)
  - Right = `.bucket-donut` — 220×220 SVG with WL/BL arcs, center label "REDEEMABLE 73% · 10.81 / 14.82 devSOL"
- 4-cell stats strip (positions, 24h PnL, all-time PnL, available to redeem)
- **Activation banner** (amber) — only shows if blacklist > 0; "Activate 4.01 devSOL" + fee preview + "Activate now" CTA
- Section: "Holdings" with tabs (All / Whitelist / Blacklist / Watchlist / Launched)
- Holdings table: token | balance | avg entry | value | PnL | bucket | trade button
- Bottom 2-column: "📈 Graduation watch" list (tokens user holds that are nearing graduation) + "🏦 Redemption" card with the redeem flow summary

### 5. Launch a token — `product/screens/Launch.html`

**Purpose:** Create + deploy a new token on the bonding curve.

**Layout:**
- 2-column max-1160px: 1.4fr form + 1fr sticky preview card

**Form:**
- Eyebrow "● NEW LAUNCH · BONDING CURVE"
- H1 "Light the fuse." with red "fuse." accent
- Lede explaining the curve
- 3 sections divided by "01 · IDENTITY", "02 · SOCIALS", "03 · CURVE PARAMETERS" mini-eyebrows
- Identity: 80px avatar drop with edit button + token name + ticker (with `$` prefix) + description textarea
- Socials: 3 inline input pills (𝕏, web, Telegram)
- Curve: starting price + graduation (locked at 85), initial buy + supply (locked at 1B)

**Live preview (right, sticky):**
- "● LIVE PREVIEW" eyebrow
- Replica of the public token card with avatar/name/bio/grad-meter
- Cost breakdown (network fee, curve init, initial buy, activation fee, total)
- Red-glow "Ready to light it?" mini-banner
- Big red "⚡ Light the fuse" CTA with red glow
- Footer with wallet signer + "Tx will appear in 'Portfolio → Launched'"

### 6. Redeem — `product/screens/Redeem.html`

**Purpose:** Convert whitelist devSOL → mainnet SOL.

**Layout:** Single 1080px max-width column, centered.

- Centered header: green pulsing eyebrow "REDEMPTION · DEVNET → MAINNET", H1 "Cash out your whitelist.", lede
- 4-step indicator: Activated ✓ / Pick amount (active) / Confirm / Settled
- **Redeem card** (2-column): left = YOU REDEEM amount input + presets (25/50/75/MAX) + down arrow + YOU RECEIVE green-tinted card showing SOL output. Right = receipt with whitelist amount, rate, gross, fee, network fee, total settles in green, confirm button
- 4-cell treasury strip: Treasury / Activated devSOL / Reserve ratio / Redemptions 24h
- "Recent redemptions" table

### 7. Mobile (5 screens) — `product/Mobile.html`

**Purpose:** Mobile iOS app surfaces. Each screen sits inside an iOS device frame component (`product/ios-frame.jsx`).

Screens included:
1. **Floor** — top brand bar, "GRADUATING NOW" hero, filter chips, token list, 5-tab bottom bar with center FAB
2. **Token detail** — token header, 4-cell stats grid, mini chart, graduation card, position card, fixed bottom Buy/Sell bar
3. **Portfolio** — Net worth card with WL/BL bucket bar + 2-card legend, activation banner, holdings list
4. **Wallet connect** — full-screen onboarding with brand mark, 4 wallet options (Phantom, Backpack, Solflare, WalletConnect)
5. **Activate modal** — fullscreen scrim over the floor with a centered confirmation card

**Mobile design rules:**
- 390px design width (iPhone 14 Pro)
- Top app bar has **60px top padding** to clear the iOS notch (status bar)
- Bottom tab bar is 88px tall (24px home-indicator clearance)
- Center FAB is 56×56 circle in `--tnt-red`, translateY(-12px) to sit above the bar
- Cards use 14-18px radii (slightly larger than desktop)
- Min hit targets ≥44px

### 8. Transaction states — `product/TxStates.html`

12 modal patterns grouped into 5 sections:

1. **Buy trade flow:** Signing → Broadcasting → Settled (with step indicator)
2. **Activation:** Confirm activation → Activated success → Bucket changed toast
3. **Redemption:** Confirm redeem → Redeemed (settled mainnet) → Queued for treasury top-up
4. **Failures:** Slippage exceeded → Wallet rejected → Insufficient SOL for gas
5. **Graduation moment:** Big "graduated" hero card + buy-prompt + "Graduation imminent" modal

**Modal pattern:**
- Card: 320-360px wide, ~1:1.1 aspect, `--soot` bg, 18px radius
- Radial glow at top tinted by state (amber pending / green success / red fail / red graduation)
- Icon circle (80×80, 22px radius) — spinner ring for pending states
- Step pip row (`.steps`) for multi-step flows
- Title (`.m-title`) with em-colored accent word
- Subtitle (1.5 line-height, opacity 0.78)
- Receipt block (mono, k/v rows + divider before total)
- Action row (1 or 2 buttons)
- Optional `.tx-foot` with tx hash / slot info

### 9. Treasury / Operator — `product/Admin.html`

**Purpose:** Operator console for protocol stewards (multisig holders, ops team).

**Layout:**
- Top nav with brand + OPERATOR red pill + admin pill + alert count
- Operator tabs: Overview / Treasury / Redemptions / Launches / Fees · config / Audit log

**Sections:**
- Alert banner (when reserve ratio drifts below threshold)
- 4-cell top stats (treasury reserve, ratio, activated devSOL, redemptions 24h) with mini sparklines
- 2-col main: big reserve-vs-activated chart (24h default) + reserve ratio half-gauge
- 2-col below: redemption queue table + recent launches table
- 2-col below: fee config card (5 editable rows, multisig-gated) + live audit log

### 10. The Blast — graduation animation — `product/Graduation.html`

**Purpose:** Hero animation for the moment a token graduates. Loops on a 6-second timeline.

Scene timing:
- 0.0 – 1.5s: Curve at 96.9%. Last-fuse-buy panel pulses, faint heartbeat shake builds.
- 1.5 – 2.2s: Curve fills to 100%. Spark on the curve thumb intensifies. Panel begins to enlarge and shake.
- 2.2 – 3.5s: **Detonation.** White-amber flash, 32 particles burst radially, 3 concentric expanding rings.
- 3.5 – 6.0s: "$PEPED just graduated." headline reveals (192px display), with eyebrow "LP OPENED · CURVE CLOSED · GRADUATED" and a 4-cell stat strip below.

Stage size: 1920×1080. Built on the included `animations.jsx` engine (Stage + Sprite + useTime + interpolate + Easing). Scrubbable.

### 11. Brand identity — `brand/Brand Identity.html`

Long-form brand sheet. Sections:
1. **Logo system** — primary lockup (dynamite + fuse + spark mark with TNT label + TNTSOL wordmark with red accent), knockout, light, monochrome, app icon (gradient red box), favicon, social avatar, wordmark only, construction grid + clearspace + minimum sizes
2. **Color system** — 5 brand swatches + 8-cell neutrals ramp + 3 semantic state cards (whitelist live / blacklist locked / danger detonating) + usage proportion bar (60/24/10/4/2)
3. **Typography** — Space Grotesk + JetBrains Mono specimens, full type scale rows
4. **Iconography** — 16-icon set (fuse, dynamite, activation, swap, curve, whitelisted, blacklisted, graduate, wallet, bridge, menu, search, trend, portfolio, network, arrow) + Solana lockup/badge/wallet chip
5. **Voice & tone** — 3 pillars (Lit not loud / Crew not retail / Accountable), DO/DON'T examples, vocabulary table (Light the fuse, Graduate, Detonate, Bucket, Activation, Spark, Floor, Crew)
6. **Applied** — links to landing/product/index

### 12. Social & merch — `product/Social.html`

Sections:
1. OG / social cards (1200×630): "Light the fuse" hero variant + "Just activated" data-card variant
2. 𝕏 Twitter banner (1500×500): hero + big lit mark
3. Avatars: 𝕏 square, iOS rounded square, Discord circle, monogram, sticker variant, hazard variant
4. Notifications: 3-column with SUCCESS / WARNING / FAIL toast variants
5. Merch: sticker pack (4-up), t-shirt mock with chest print, hoodie/oversized chest print mock
6. Email/newsletter header (600×200 transactional/marketing)

All OG cards use **CSS Container Queries** with `cqw` units so typography scales correctly at any preview size.

---

## Voice & Microcopy Rules

- **Be specific.** "85 devSOL until graduation" beats "moon soon".
- **Use the metaphor.** Light the fuse / detonate / blast / spark / graduate are the verbs.
- **Never hide fees.** The 1% activation fee is always shown explicitly and called by name.
- **No emojis** in body copy except `⚡`, `🧨`, `🎓`, `●`. They are part of the visual rhythm, not decoration.
- **Mono for numbers, display for words.** Don't mix.
- **Tag bucket state on every balance.** Always show WL or BL.

---

## Implementation Checklist

When implementing this design:

1. **Set up the design system first.**
   - Port `tokens.css` into your framework's theme system
   - Import Space Grotesk + JetBrains Mono
   - Build shared primitives: Button (primary / secondary / ghost / success / danger), Bucket badge, Wallet pill, Topnav, Card

2. **Implement the bucket model in your data layer.**
   - Every balance returned from chain reads must carry its bucket (WL/BL)
   - The activation fee calc lives at the protocol level — surface it in receipts

3. **Build screens in this order** (low-to-high coupling):
   - Landing → Floor → Token detail → Portfolio → Launch → Redeem → Mobile parity → Admin → Tx modals (extract from the existing flows)

4. **Add the live data layer:**
   - WebSocket subscription to a "floor firehose" (new launches, large trades, graduations) — feeds the right-rail live trade list
   - Per-token subscriptions when on token detail
   - Wallet balance + bucket map subscriptions
   - Curve state derived from program account

5. **Wire wallet adapter** — Phantom + Backpack + Solflare + WalletConnect (the four shown in the mobile wallet-connect screen).

6. **Implement the graduation animation** as a one-shot React component triggered when curve crosses 85 devSOL. The included `graduation.jsx` is a literal reference for the timeline + easing values.

7. **Operator dashboard** can ship later — it's an internal tool. But the reserve-ratio gauge is the most important widget.

---

## Files in This Bundle

```
design_handoff_tntsol/
├── README.md                           ← you are here
├── SPEC-f039710b.md                    ← original technical spec
├── tokens.css                          ← design tokens (CSS custom properties)
├── index.html                          ← navigation hub
│
├── brand/
│   ├── Brand Identity.html             ← full brand sheet
│   ├── brand.css
│   └── sections/                       ← logo, color, type, icon, voice partials
│
└── product/
    ├── Landing.html                    ← marketing site
    │
    ├── app.css                         ← shared app shell (topnav, brand, buttons, buckets)
    │
    ├── screens/
    │   ├── Floor.html + floor.css + floor.js
    │   ├── Token.html + token.css + token.js
    │   ├── Portfolio.html + portfolio.css + portfolio-render.js
    │   ├── Launch.html + launch.css + launch-render.js
    │   └── Redeem.html + redeem.css + redeem-render.js
    │
    ├── Mobile.html + mobile.jsx + ios-frame.jsx     ← 5 iOS screens
    ├── TxStates.html                                ← 12 transaction modals
    ├── Admin.html                                   ← operator console
    ├── Graduation.html + graduation.jsx + animations.jsx   ← the blast animation
    └── Social.html                                  ← OG cards, banner, merch, notifications
```

The `.html` files are entry points. CSS and JS files are siblings to their HTMLs.

---

## Open Questions for the Developer

These weren't fully specified by the design — your call:

- **Empty states.** What does The Floor look like with 0 tokens? What does Portfolio look like with 0 holdings? Match the visual language but write the copy.
- **Loading skeletons.** The design assumes data is hot. Add tasteful skeleton states using `--ash` shimmer.
- **Onboarding tutorial.** First-time users will be confused by the bucket system. Consider a 3-step coachmark walkthrough explaining Acquire → Activate → Redeem (matches the landing copy).
- **Pagination on the Floor.** Show ~30 tokens at a time, infinite scroll, with the right-rail live trades unbounded.
- **Notifications layer.** The Social.html file shows the toast vocabulary — wire them up to relevant chain events.

If anything's ambiguous, open the relevant HTML file in a browser and pixel-pick the value.
