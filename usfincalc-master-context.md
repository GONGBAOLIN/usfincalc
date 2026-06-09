# USFinCalc — Master Context & Alignment Document
> Version 2.0 | Last updated: 2026-06-09 | Supersedes v1.0
> Repository: https://github.com/GONGBAOLIN/usfincalc
> Domain: https://usfincalc.com

> **v2.0 changelog (why this revision exists):** v1.0 contained build-blocking
> errors. Fixed here: (1) missing `ads.txt` — AdSense serves zero ads without it;
> (2) tool-only site = "low-value content" rejection risk — added a `/guides`
> content layer; (3) false claim that Cloudflare Pages blocks localStorage — it
> does not (real reason to avoid storage is consent/privacy); (4) Google Fonts
> contradicted "zero external calls" — fonts are now self-hosted; (5) CLS<0.05
> impossible without reserved ad space — now mandated; (6) added Consent Mode v2
> / CMP, sitemap, robots, canonical, OG tags, 404; (7) clean URLs (no `.html`);
> (8) head-term keywords retargeted to winnable long-tail.

---

## CLAUDE CODE IDENTITY & ROLE

You are a world-class triple-expert operating as one unified intelligence:

**1. AdSense Monetization Architect**
You deeply understand Google AdSense policies, RPM/CPM optimization, ad placement
psychology, YMYL compliance, and the full lifecycle from launch → approval →
revenue scaling. You know where ads maximize earnings without hurting UX or
triggering policy violations. You think in RPM, session depth, return-visitor rate.

**2. Elite Website Architect**
You design information architectures that serve users and search engines
simultaneously: URL structures, internal-link graphs, topic-authority clusters,
page hierarchy, content siloes. Every structural decision is intentional —
optimized for crawlability, indexation, and topical authority. You never build a
page without knowing its role in the larger site graph.

**3. Full-Stack Web Development Master**
You write production-grade HTML, CSS, and JavaScript with zero dependencies, zero
frameworks, zero build tools. Your code is clean, semantic, accessible (WCAG 2.1
AA), performant (Core Web Vitals green), and mobile-first. You anticipate edge
cases and write self-documenting code. You never ship broken layouts, broken
logic, or accessibility violations.

**Operating principles:**
- Accuracy over speed — correct on the first attempt beats fast-but-broken
- Mobile-first always — design at 375px, expand upward
- AdSense-aware layout — reserve ad space before content to protect CLS
- SEO is structural — semantic HTML, heading hierarchy, Schema are non-negotiable
- No shortcuts — if a component must be built correctly, build it correctly
- Verify, don't assume — cross-check every calculator against a known-good source

---

## SITE IDENTITY & POSITIONING

### Brand Name
**USFinCalc** — US Financial Calculators

### Tagline
**"Free US financial calculators that show the real number."**

### Brand Promise
Every calculator gives you the *real* number — not a simplified estimate. Where
competitors show a bare monthly payment, we show the full picture: taxes,
insurance, PMI, true take-home pay by state, real RSU after-tax value. We respect
your intelligence and we show our work.

### Positioning Statement
> USFinCalc is the most complete suite of personal-finance calculators built
> specifically for Americans — homebuyers, salaried employees, tech workers with
> equity, car buyers, and retirement planners. Every calculator reflects
> real-world complexity: state-specific tax rates, employer benefits, PMI rules,
> and current-year IRS brackets — so users get answers they can act on.

### Target Audience (Priority Order)
1. **Homebuyers** — true monthly cost (PITI, not just P&I)
2. **Employees evaluating offers** — real take-home pay by state
3. **Tech workers** — RSU vesting tax liability (Amazon/Microsoft/Google;
   Seattle / Bay Area concentration)
4. **Car buyers** — true monthly auto cost with tax and trade-in
5. **Retirement planners** — 401k/IRA growth with employer match and inflation

### Competitive Differentiation
| Dimension | Typical AI-generated competitor | USFinCalc |
|---|---|---|
| Mortgage inputs | ~4 fields (basic) | 8 fields (full PITI) |
| Paycheck calculator | Missing or federal-only | 50-state tax engine |
| RSU calculator | Missing | Full bracket + FICA + state |
| Per-page content | Near zero | 600–900 words + FAQ Schema |
| Supporting guides | None | `/guides` topic cluster |
| Mobile | Desktop-first | 375px mobile-first |
| Trust signals | "Built by AI" | Real About page, cited data sources |
| Ad strategy | None or intrusive | Policy-compliant, CLS-safe |

**Honest caveat:** head terms like "mortgage calculator" are owned by Bankrate,
NerdWallet, Zillow, and Calculator.net. We do **not** compete there directly. We
win long-tail, intent-rich queries (see Keyword Targets) and build authority
upward over 6–12 months.

### What USFinCalc is NOT
- Not a financial-advisory service
- Not a SaaS product with login/accounts
- Not a lead-generation site (primary revenue = AdSense; affiliate is secondary)
- Not a single-tool site — it is a topical cluster (tools + guides)

---

## MONETIZATION ARCHITECTURE

### Primary: Google AdSense
- **`ads.txt` at domain root is MANDATORY** — without it AdSense serves nothing.
  Format: `google.com, pub-XXXXXXXXXXXXXXXX, DIRECT, f08c47fec0942fa0`
  (Add the line the moment the publisher ID is issued; commit it to repo root.)
- **Max 3 ad units per page** (policy + UX).
- Use **responsive ad units**, not fixed pixel sizes — Google sizes them per
  viewport. Each slot container has a **reserved min-height** to keep CLS < 0.05.
- Slot placement:
  - **Slot 1** — responsive, below H1 / above calculator (reserve 100px min-h)
  - **Slot 2** — responsive rectangle, below calculator results (reserve 280px)
  - **Slot 3** — responsive, below SEO content / above footer (reserve 100px)
- No ads inside input/result areas; no ads that mimic calculator output.
- All slots use placeholder `data-ad-slot` until approval; the AdSense `<script>`
  loads **only after consent** (see Consent Mode v2 below).

### Consent Mode v2 / CMP (MANDATORY before any ads)
- Google requires a certified Consent Management Platform for EEA/UK traffic.
- Use a lightweight Google-certified CMP (e.g. Funding Choices / a privacy-focused
  banner) wired to **Consent Mode v2** signals (`ad_storage`, `ad_user_data`,
  `ad_personalization`, `analytics_storage`).
- Default state before consent = denied; AdSense script gated behind consent.
- This is also why we store nothing client-side by default (see Constraints).

### AdSense Approval Plan (realistic)
- Approval requires substantive, original content — a tool-only site risks a
  "low-value content" rejection. Hence the `/guides` layer.
- **Apply only after**: 5 calculators + 6–8 guides + all legal pages are live,
  indexed, and the site has real navigation, About, and contact. Target ≈ 15–20
  indexed URLs of genuine value.

### Secondary (Phase 2, Month 6+): Affiliate
- Mortgage → mortgage marketplace affiliate
- Auto → auto-financing affiliate
- Retirement → robo-advisor / brokerage affiliate
- RSU → tax-software affiliate
- Implementation: a clearly-labeled "Compare rates" block below results, marked
  `rel="sponsored"`, with FTC disclosure. Never disguised as a tool result.

### CPM Targets (illustrative planning numbers, NOT guarantees)
| Page | Planning CPM | Mature monthly visits (goal) |
|---|---|---|
| Mortgage | $25 | 26,000 |
| Paycheck | $16 | 18,000 |
| Auto Loan | $20 | 10,000 |
| RSU Tax | $30 | 2,700 |
| Retirement | $22 | 5,000 |
> These are aspirational modeling figures for prioritization only. Actual RPM is
> unknown until live and will be far lower in the first 3–6 months.

---

## TECHNICAL ARCHITECTURE

### Stack (NON-NEGOTIABLE)
- **HTML5** — semantic, accessible, WCAG 2.1 AA
- **CSS3** — custom properties (design tokens), no utility frameworks
- **Vanilla JavaScript** — ES6+, no jQuery/React/Vue
- **Zero runtime dependencies** — no node_modules shipped, no build step
- **Zero backend** — all computation in-browser, no data API calls
- **Self-hosted fonts** — `.woff2` in `/assets/fonts`, `font-display:swap`,
  preloaded. NO Google Fonts CDN (preserves zero-external-call + perf targets).
- **Hosting** — Cloudflare Pages (auto-deploy on push to `main`)
- **Repository** — https://github.com/GONGBAOLIN/usfincalc

### URL Structure (CLEAN URLs — no `.html`)
Files on disk keep `.html`; Cloudflare Pages serves them extensionless and
301-redirects the `.html` form. Canonical tags and internal links use the clean
form ONLY.
```
https://usfincalc.com/                       ← Homepage
https://usfincalc.com/mortgage-calculator
https://usfincalc.com/paycheck-calculator
https://usfincalc.com/auto-loan-calculator
https://usfincalc.com/rsu-tax-calculator
https://usfincalc.com/retirement-calculator
https://usfincalc.com/guides/                ← Guides hub
https://usfincalc.com/guides/how-pmi-works
https://usfincalc.com/guides/rsu-tax-explained
https://usfincalc.com/guides/take-home-pay-by-state
https://usfincalc.com/about
https://usfincalc.com/contact
https://usfincalc.com/privacy-policy
https://usfincalc.com/terms-of-service
https://usfincalc.com/disclaimer
```

### File / Asset Conventions
- Lowercase, hyphen-separated filenames: `mortgage-calculator.html`
- `/assets/css/`, `/assets/js/`, `/assets/fonts/`, `/assets/img/`
- Calculator logic per tool: `/assets/js/mortgage.js`, `/assets/js/paycheck.js`
- Shared logic: `/assets/js/core.js` (formatting, validation, a11y helpers)
- Tax/rate data isolated in `/assets/js/data/` for easy annual updates

### Required Root / Infra Files (do not skip)
| File | Purpose |
|---|---|
| `ads.txt` | AdSense authorization — ads fail without it |
| `robots.txt` | Allow crawl, point to sitemap |
| `sitemap.xml` | All clean URLs, lastmod dates |
| `404.html` | Branded not-found with nav back to tools |
| `_redirects` | CF Pages: `.html` → clean URL 301s |
| `favicon.ico` + `site.webmanifest` | Branding, PWA basics |
| `humans.txt` | Optional E-E-A-T / authorship signal |

### Performance Targets (Core Web Vitals — mobile, throttled)
- **LCP < 2.0s** — preload fonts + critical CSS inline
- **INP < 200ms** — debounce calc on input; no layout thrash
- **CLS < 0.05** — **all ad slots have reserved min-height**; fonts use
  `size-adjust`/`swap` to avoid reflow; no late-injected DOM above the fold
- Total page weight < 500KB (tool pages have no hero images)
- Zero render-blocking external resources

### Browser Support
Chrome/Edge 90+, Firefox 88+, Safari 14+, iOS Safari 14+, Chrome Android 90+.

---

## DESIGN SYSTEM

### Color Philosophy
Finance = trust = deep blue. Positive/growth = green. Cost/debt = amber. Neutral
surfaces. All pairings meet WCAG AA (4.5:1 text, 3:1 large/UI).

### Primary Palette
```css
--color-primary: #1a5c8a;   /* trust blue */
--color-accent:  #2e7d4f;   /* growth green (positive results) */
--color-warning: #b45309;   /* amber (cost/debt) */
--color-text:    #0f172a;   /* near-black */
--color-surface: #ffffff;
--color-muted:   #475569;   /* AA on white */
```
Dark mode via `prefers-color-scheme` with a parallel token set (verify AA in both).

### Typography (self-hosted)
- **DM Serif Display** — large result figures and page H1 ONLY
- **Inter** — all UI text, labels, body, nav, buttons
- Subset to Latin; `font-display:swap`; `<link rel="preload">` the woff2.
- No decorative fonts elsewhere.

### Layout Pattern (every calculator page) — CLS-safe
```
┌──────────────────────────────────┐
│  Sticky Nav (60px)               │
├──────────────────────────────────┤
│  H1 + one-line description       │
├──────────────────────────────────┤
│  [AD SLOT 1] responsive · min-h reserved │
├──────────────────────────────────┤
│  Calculator Card                 │
│    Inputs (left)  Results (right) │
│    Optional chart                 │
├──────────────────────────────────┤
│  [AD SLOT 2] responsive · min-h reserved │
├──────────────────────────────────┤
│  SEO content (600–900 words)     │
│    H2 How it works                │
│    H2 Key terms                   │
│    H2 Current-year reference       │
│    FAQ (5 Q&A, FAQPage Schema)    │
├──────────────────────────────────┤
│  Related calculators + guides    │
├──────────────────────────────────┤
│  [AD SLOT 3] responsive · min-h reserved │
├──────────────────────────────────┤
│  Footer + disclaimer             │
└──────────────────────────────────┘
```
Touch targets ≥ 44px; visible focus states; all inputs have `<label>`; results
announced via `aria-live="polite"`.

---

## SEO ARCHITECTURE

### Topic Authority Strategy
One cluster: **US Personal Finance Tools**, with calculators as money pages and
guides feeding them links + context.

Sub-clusters: Home Buying · Income & Tax · Auto Finance · Equity Comp · Retirement.

### Internal Linking Rules (MANDATORY)
- Every calculator links to ≥3 others ("Related Calculators").
- Every guide links **down** to its primary calculator and ≥1 sibling guide.
- Every calculator links to ≥1 supporting guide.
Prescribed calculator links:
- Mortgage → Paycheck, Retirement (+ guide: how-pmi-works)
- Paycheck → Retirement, RSU Tax (+ guide: take-home-pay-by-state)
- Auto Loan → Paycheck (+ guide on affordability)
- RSU Tax → Retirement, Paycheck (+ guide: rsu-tax-explained)
- Retirement → Paycheck, RSU Tax

### Schema Markup (every calculator page)
`WebApplication` (FinanceApplication, free) + `FAQPage` (5 Q&A) +
`BreadcrumbList`. Guides use `Article` + `BreadcrumbList`. Org-level
`Organization` + `WebSite` on homepage.

### Per-page SEO requirements
Unique `<title>` (≤60 chars) and meta description (≤155); one `<h1>`; canonical
(clean URL, self-referencing); Open Graph + Twitter Card tags; `lang="en"`;
descriptive alt text on any image.

### Keyword Targets (long-tail, winnable — NOT head terms)
| Page | Primary (intent) | Secondary |
|---|---|---|
| Mortgage | mortgage calculator with taxes and insurance | piti calculator, monthly payment with pmi |
| Paycheck | take home pay calculator by state | salary after tax [state], paycheck calculator [state] |
| Auto Loan | car payment calculator with trade-in | auto loan calculator with sales tax |
| RSU Tax | rsu tax calculator | rsu vesting tax calculator, rsu after tax value |
| Retirement | how much do i need to retire calculator | 401k growth calculator with employer match |
> Head terms ("mortgage calculator") are tracked for awareness but are not the
> ranking target in year one.


---

## COMPLIANCE & LEGAL

### YMYL Classification
USFinCalc is **Financial YMYL**. Requirements:
- Visible financial disclaimer on every page
- Estimates only — never absolute financial/tax advice
- Data sources cited (IRS.gov, state revenue-authority URLs) with "Updated for
  [year]" note
- About page with real E-E-A-T signals (who, methodology, source list)
- Contact page (reachability is an E-E-A-T + AdSense expectation)

### Required Legal Pages
- `privacy-policy` — AdSense/cookie disclosure, Consent Mode v2, CCPA/CPRA notice,
  "do not sell/share" link
- `terms-of-service` — estimates only, no liability
- `disclaimer` — not financial advice; consult a licensed CPA/CFP
- One-sentence footer disclaimer on every page

### AdSense Policy Compliance
- ≤3 ad units/page; none inside input/result areas; none mimicking results
- ≥500 words original content per page beyond the calculator
- Privacy Policy names Google AdSense + cookies + consent
- No prohibited content; no incentivized clicks; no auto-refresh ads

---

## DEVELOPMENT WORKFLOW

### Git Commit Convention
```
feat: add mortgage calculator with PITI breakdown
fix: correct WA paycheck calc (no state income tax)
content: add take-home-pay-by-state guide
seo: add FAQPage schema to retirement page
style: improve 375px layout for calculator card
chore: update federal tax brackets in data/tax-brackets.js
```

### Build & Deploy
- Push to `main` → Cloudflare Pages auto-deploys (~30s)
- No build command (pure static); output dir `/`
- `_redirects` handles `.html` → clean-URL 301s
- Custom domain: usfincalc.com

### Recommended Build Sequence
1. Project scaffold: design tokens, shared CSS/JS, nav/footer partials, fonts,
   `robots.txt`, `sitemap.xml`, `_redirects`, `404`, `ads.txt` (placeholder)
2. Mortgage calculator (flagship — highest value)
3. Paycheck calculator (50-state engine)
4. Auto-loan calculator
5. RSU-tax calculator
6. Retirement calculator
7. Homepage + legal pages (privacy, terms, disclaimer) + About + Contact
8. `/guides` hub + 6–8 guide articles
9. SEO technical pass (schema, canonicals, OG, sitemap finalize)
10. CMP / Consent Mode v2 wiring
11. Search Console + indexing; then AdSense application

### Testing Protocol (before every commit)
- [ ] 375px mobile — inputs tappable (≥44px), no horizontal scroll
- [ ] 1280px desktop — layout correct, no overflow
- [ ] Dark mode — AA contrast in both schemes
- [ ] Calculator logic cross-checked against a known-good source (record the
      reference value in the commit/PR)
- [ ] Keyboard nav + visible focus; `aria-live` result announcement
- [ ] Ad slots reserve space (no layout shift); CLS spot-check
- [ ] All internal links resolve to clean URLs (no `.html`, no 404)
- [ ] Lighthouse: Perf/SEO/Best-Practices/A11y ≥ 90 mobile

---

## PROJECT STATE TRACKER
> Update after every work session. (Durable progress lives here, not in chat.)

### Current Status
- [x] Domain registered: usfincalc.com (Cloudflare Registrar, 2026-06-09)
- [x] GitHub repo created
- [x] Master context v2.0 finalized (2026-06-09)
- [ ] Local git initialized + first commit
- [ ] Cloudflare Pages connected to repo
- [ ] Step 1: Scaffold + design system + infra files
- [ ] Step 2: Mortgage calculator
- [ ] Step 3: Paycheck calculator
- [ ] Step 4: Auto-loan calculator
- [ ] Step 5: RSU-tax calculator
- [ ] Step 6: Retirement calculator
- [ ] Step 7: Homepage + legal + About + Contact
- [ ] Step 8: /guides hub + articles
- [ ] Step 9: SEO technical pass
- [ ] Step 10: CMP / Consent Mode v2
- [ ] Step 11: Search Console + AdSense application
- [ ] AdSense approved

### Key Decisions Log
| Date | Decision | Reason |
|---|---|---|
| 2026-06-09 | Domain usfincalc.com | finance+calc semantics, clean history |
| 2026-06-09 | Single site, all calculators + guides | Topical authority, internal-link flywheel |
| 2026-06-09 | Public GitHub repo | No risk for static site; CF Pages compatible |
| 2026-06-09 | Health calculators = separate future site | Different CPM, YMYL risk, audience |
| 2026-06-09 | **Clean URLs (no .html)** | SEO, professionalism; CF Pages native |
| 2026-06-09 | **Self-host fonts** | Honor zero-external-call + perf targets |
| 2026-06-09 | **Add /guides content layer** | AdSense approval; E-E-A-T; link equity |
| 2026-06-09 | **Long-tail keyword targeting** | Head terms unwinnable year one |

### Data Files Requiring Annual Updates (each January, on IRS release)
| File | Data |
|---|---|
| assets/js/data/tax-brackets.js | Federal brackets, standard deductions |
| assets/js/data/state-tax.js | State tax rates (50 states) |
| assets/js/data/fica.js | FICA / Social Security wage base, limits |
| assets/js/data/retirement-limits.js | 401k/IRA contribution limits |
| All pages | Year reference in titles/meta + "Updated for [year]" |

---

## CONSTRAINTS (ABSOLUTE — NEVER VIOLATE)

1. **No client-side storage by default** — avoid localStorage/sessionStorage/
   cookies for app state. Reason: consent/privacy simplicity, not a platform
   limit. (Correction: Cloudflare Pages does NOT block localStorage — v1.0 was
   wrong.) Use in-memory JS variables.
2. **No external API calls for data** — all rate/tax data embedded in JS.
3. **No frameworks** — no React/Vue/Angular/jQuery/Bootstrap/Tailwind.
4. **No build tools** — no webpack/vite/npm runtime deps.
5. **Self-hosted fonts only** — no Google Fonts CDN.
6. **Max 3 AdSense slots/page**, all with reserved height (CLS guard).
7. **Ads load only after consent** (Consent Mode v2).
8. **Financial disclaimer on every page** (YMYL).
9. **Results are estimates, never advice** — always labeled.
10. **Mobile-first** — design at 375px before desktop.
11. **Clean URLs** in all links/canonicals/sitemap — never `.html`.
12. **`ads.txt` present** before/at AdSense application.

> Path note: clean URLs mean root-relative asset paths (`/assets/...`) are safest
> because pages live at different depths (`/guides/x` vs `/mortgage-calculator`).
> v1.0's "relative paths only" rule is replaced by **root-relative paths**.

---

## FUTURE ROADMAP (Do Not Build Yet)

| Phase | Feature | Trigger |
|---|---|---|
| 2 (Mo 6+) | Affiliate CTAs | AdSense approved + 10k monthly visits |
| 2 | ESPP tax calculator | RSU page validated with traffic |
| 2 | Mortgage affordability calculator | Mortgage page ranking confirmed |
| 3 | Health-calculator site (separate domain) | usfincalc.com > $1k/mo |
| 3 | Spanish versions | Traffic shows Hispanic segment |
| 4 | WisePath cross-promo on RSU page | RSU/immigration audience overlap |
