# Central Bank Rates Demo — central-bank-rates-demo

A sample static site that pulls the official published exchange-rate tables from 34 central banks — one npm package per bank — and renders them as a single self-contained dashboard. Built for developers evaluating the [AllRatesToday Central Bank Rates API](https://allratestoday.com/central-bank-rates-api/) who want to see the per-bank SDKs actually working before writing any code.

[![Powered by AllRatesToday](https://img.shields.io/badge/Powered%20by-AllRatesToday-orange.svg)](https://allratestoday.com)
[![Live demo](https://img.shields.io/badge/demo-GitHub%20Pages-brightgreen)](https://allrates-today.github.io/central-bank-rates-demo/)
[![Build and deploy to GitHub Pages](https://github.com/AllRates-Today/central-bank-rates-demo/actions/workflows/deploy.yml/badge.svg)](https://github.com/AllRates-Today/central-bank-rates-demo/actions/workflows/deploy.yml)
[![Rebuilds daily](https://img.shields.io/badge/rebuilds-daily%2006%3A30%20UTC-blue)](.github/workflows/deploy.yml)
[![Node](https://img.shields.io/badge/node-%3E%3D18-339933)](package.json)
[![npm SDKs](https://img.shields.io/badge/npm%20SDKs-34-cb3837)](banks.mjs)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](package.json)

**Live site:** <https://allrates-today.github.io/central-bank-rates-demo/>

These are the bank-published reference rates used for tax, customs, audit and compliant invoicing — not market ticks. Each response carries the bank's own publication date (`rate_date`).

## 🚀 Features

- 🏦 **34 central banks, 34 npm packages** — every card on the page is produced by a different SDK; the import *is* the demo
- 📦 **Zero-dependency SDKs** — each `*-exchange-rate` package is a thin `fetch` wrapper over the API, no transitive deps
- 🗓️ **Daily rebuild** — a scheduled GitHub Actions workflow regenerates and redeploys the page every day at 06:30 UTC
- 🔒 **Key never shipped** — the API key is read from an Actions secret at build time and never appears in the repo or the published HTML
- 🪶 **One static file** — the build writes a single `dist/index.html` with inline CSS, dark-mode support and a client-side bank filter
- 🧯 **Fault tolerant** — a bank whose fetch fails renders an error card instead of breaking the build; the build only aborts if *every* fetch fails

## 🔑 Get your API key

The build needs an AllRatesToday API key in `ALLRATES_API_KEY`. Every per-bank endpoint requires one — there is no keyless mode.

Get a free key (300 requests/month, no credit card) at [allratestoday.com/register](https://allratestoday.com/register).

For the deployed site the key lives in a repository secret named `ALLRATES_API_KEY`, injected into the build step by [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml). Forks must add their own secret under **Settings → Secrets and variables → Actions** before the workflow will succeed.

## 📦 Installation

```bash
git clone https://github.com/AllRates-Today/central-bank-rates-demo
cd central-bank-rates-demo
npm install
```

Node.js 18 or newer (the SDKs use global `fetch`). The repo is `private: true` — it is a demo, not a published package.

## 🏁 Quick start

```bash
ALLRATES_API_KEY=art_live_your_key npm run build
open dist/index.html
```

`npm run build` runs [`build.mjs`](build.mjs), which:

1. Reads the bank list from [`banks.mjs`](banks.mjs) — npm package name, display name, country, home currency, flag and an example pair per bank.
2. Dynamically `import()`s each bank's package and calls `getLatestRates({ apiKey })` — the bank's full published table for its latest date — six banks at a time.
3. Picks up to six representative pairs per bank (the bank's example pair, then `USD`, `EUR`, `GBP`, `JPY`, `CNY`, `INR`, `AUD`, `CHF`).
4. Renders everything into one self-contained `dist/index.html`, with a per-bank "Use this SDK" snippet and links to npm, GitHub and the bank's API docs page.

Missing the key exits with code 1 and a pointer to the register page. Every fetch failing also exits 1, rather than publishing an empty dashboard.

## 🔄 How the daily rebuild works

[`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) has three triggers: push to `main`, `workflow_dispatch`, and `schedule` at cron `30 6 * * *` — daily at 06:30 UTC, after most banks publish their morning tables.

| Stage | What happens |
|---|---|
| `build` job | `npm ci`, then `npm run build` with `ALLRATES_API_KEY` from `secrets.ALLRATES_API_KEY`, then uploads `dist/` as a Pages artifact |
| `deploy` job | Publishes that artifact to the `github-pages` environment via `actions/deploy-pages` |
| Concurrency | Grouped on `pages` with `cancel-in-progress: true`, so a push during a scheduled run supersedes it |
| Permissions | `contents: read`, `pages: write`, `id-token: write` |

Central banks publish once per business day, so building statically once a day costs 34 API calls total. That is the pattern worth copying: cache the daily table, don't call the API per page view.

## 📚 SDK reference

Every `*-exchange-rate` package exposes the same four functions. `options.apiKey` is required on all of them.

| Function | Description | Plan |
|---|---|---|
| `getLatestRates(options)` | The bank's latest published table — `rate_date` plus every `rates[]` entry | All plans, including free |
| `getRate(source, target, options)` | Latest rate for one pair | All plans, including free |
| `getRatesForDate(date, options)` | Published table for a `YYYY-MM-DD` date; weekends and holidays return the most recent published date | Paid |
| `getHistory(query, options)` | Daily time series — `{ symbol }` or `{ source, target }`, optional `from`/`to` | Paid |

Errors are thrown as `Error` with `.status` and `.body` attached from the API response.

## 💡 Use one SDK in your own project

```bash
npm install ecb-exchange-rate
```

```js
import { getLatestRates, getRate } from 'ecb-exchange-rate';

const table = await getLatestRates({ apiKey: process.env.ALLRATES_API_KEY });
console.log(table.rate_date, table.rates.length);

const pair = await getRate('USD', 'EUR', { apiKey: process.env.ALLRATES_API_KEY });
console.log(pair);
```

To add or remove a bank from this demo, edit [`banks.mjs`](banks.mjs) and add the matching dependency to [`package.json`](package.json) — nothing in `build.mjs` is bank-specific.

## 🗺️ Banks covered

The 34 banks wired into this demo, from [`banks.mjs`](banks.mjs). The API itself covers more central banks (plus tax authorities) than the demo installs — see the [full coverage list](https://allratestoday.com/central-bank-rates-api/).

| Central bank | Country | Home currency | npm package | API docs |
|---|---|---|---|---|
| 🇺🇸 US Federal Reserve | United States | 🇺🇸 `USD` | [`fed-exchange-rate`](https://www.npmjs.com/package/fed-exchange-rate) | [fed](https://allratestoday.com/central-bank-rates-api/fed/) |
| 🇪🇺 European Central Bank | Eurozone | 🇪🇺 `EUR` | [`ecb-exchange-rate`](https://www.npmjs.com/package/ecb-exchange-rate) | [ecb](https://allratestoday.com/central-bank-rates-api/ecb/) |
| 🇬🇧 Bank of England | United Kingdom | 🇬🇧 `GBP` | [`boe-exchange-rate`](https://www.npmjs.com/package/boe-exchange-rate) | [boe](https://allratestoday.com/central-bank-rates-api/boe/) |
| 🇯🇵 Bank of Japan | Japan | 🇯🇵 `JPY` | [`boj-exchange-rate`](https://www.npmjs.com/package/boj-exchange-rate) | [boj](https://allratestoday.com/central-bank-rates-api/boj/) |
| 🇨🇳 People's Bank of China | China | 🇨🇳 `CNY` | [`pboc-exchange-rate`](https://www.npmjs.com/package/pboc-exchange-rate) | [pboc](https://allratestoday.com/central-bank-rates-api/pboc/) |
| 🇨🇭 Swiss National Bank | Switzerland | 🇨🇭 `CHF` | [`snb-exchange-rate`](https://www.npmjs.com/package/snb-exchange-rate) | [snb](https://allratestoday.com/central-bank-rates-api/snb/) |
| 🇨🇦 Bank of Canada | Canada | 🇨🇦 `CAD` | [`boc-exchange-rate`](https://www.npmjs.com/package/boc-exchange-rate) | [boc](https://allratestoday.com/central-bank-rates-api/boc/) |
| 🇦🇺 Reserve Bank of Australia | Australia | 🇦🇺 `AUD` | [`rba-exchange-rate`](https://www.npmjs.com/package/rba-exchange-rate) | [rba](https://allratestoday.com/central-bank-rates-api/rba/) |
| 🇳🇿 Reserve Bank of New Zealand | New Zealand | 🇳🇿 `NZD` | [`rbnz-exchange-rate`](https://www.npmjs.com/package/rbnz-exchange-rate) | [rbnz](https://allratestoday.com/central-bank-rates-api/rbnz/) |
| 🇰🇷 Bank of Korea | South Korea | 🇰🇷 `KRW` | [`bok-exchange-rate`](https://www.npmjs.com/package/bok-exchange-rate) | [bok](https://allratestoday.com/central-bank-rates-api/bok/) |
| 🇮🇳 Reserve Bank of India | India | 🇮🇳 `INR` | [`rbi-exchange-rate`](https://www.npmjs.com/package/rbi-exchange-rate) | [rbi](https://allratestoday.com/central-bank-rates-api/rbi/) |
| 🇷🇺 Bank of Russia | Russia | 🇷🇺 `RUB` | [`cbr-exchange-rate`](https://www.npmjs.com/package/cbr-exchange-rate) | [cbr](https://allratestoday.com/central-bank-rates-api/cbr/) |
| 🇹🇷 Central Bank of Türkiye | Türkiye | 🇹🇷 `TRY` | [`tcmb-exchange-rate`](https://www.npmjs.com/package/tcmb-exchange-rate) | [tcmb](https://allratestoday.com/central-bank-rates-api/tcmb/) |
| 🇧🇷 Banco Central do Brasil | Brazil | 🇧🇷 `BRL` | [`bcb-exchange-rate`](https://www.npmjs.com/package/bcb-exchange-rate) | [bcb](https://allratestoday.com/central-bank-rates-api/bcb/) |
| 🇮🇩 Bank Indonesia | Indonesia | 🇮🇩 `IDR` | [`bank-indonesia-exchange-rate`](https://www.npmjs.com/package/bank-indonesia-exchange-rate) | [bi](https://allratestoday.com/central-bank-rates-api/bi/) |
| 🇱🇰 Central Bank of Sri Lanka | Sri Lanka | 🇱🇰 `LKR` | [`cbsl-exchange-rate`](https://www.npmjs.com/package/cbsl-exchange-rate) | [cbsl](https://allratestoday.com/central-bank-rates-api/cbsl/) |
| 🇵🇱 Narodowy Bank Polski | Poland | 🇵🇱 `PLN` | [`nbp-exchange-rate`](https://www.npmjs.com/package/nbp-exchange-rate) | [nbp](https://allratestoday.com/central-bank-rates-api/nbp/) |
| 🇨🇿 Czech National Bank | Czech Republic | 🇨🇿 `CZK` | [`czech-national-bank-exchange-rate`](https://www.npmjs.com/package/czech-national-bank-exchange-rate) | [cnb](https://allratestoday.com/central-bank-rates-api/cnb/) |
| 🇲🇾 Bank Negara Malaysia | Malaysia | 🇲🇾 `MYR` | [`bnm-exchange-rate`](https://www.npmjs.com/package/bnm-exchange-rate) | [bnm](https://allratestoday.com/central-bank-rates-api/bnm/) |
| 🇳🇴 Norges Bank | Norway | 🇳🇴 `NOK` | [`norges-bank-exchange-rate`](https://www.npmjs.com/package/norges-bank-exchange-rate) | [norges](https://allratestoday.com/central-bank-rates-api/norges/) |
| 🇸🇪 Sveriges Riksbank | Sweden | 🇸🇪 `SEK` | [`riksbank-exchange-rate`](https://www.npmjs.com/package/riksbank-exchange-rate) | [riksbank](https://allratestoday.com/central-bank-rates-api/riksbank/) |
| 🇳🇬 Central Bank of Nigeria | Nigeria | 🇳🇬 `NGN` | [`cbn-exchange-rate`](https://www.npmjs.com/package/cbn-exchange-rate) | [cbn](https://allratestoday.com/central-bank-rates-api/cbn/) |
| 🇰🇼 Central Bank of Kuwait | Kuwait | 🇰🇼 `KWD` | [`cbk-exchange-rate`](https://www.npmjs.com/package/cbk-exchange-rate) | [cbk](https://allratestoday.com/central-bank-rates-api/cbk/) |
| 🇧🇭 Central Bank of Bahrain | Bahrain | 🇧🇭 `BHD` | [`cbb-exchange-rate`](https://www.npmjs.com/package/cbb-exchange-rate) | [cbb](https://allratestoday.com/central-bank-rates-api/cbb/) |
| 🇦🇿 Central Bank of Azerbaijan | Azerbaijan | 🇦🇿 `AZN` | [`cbar-exchange-rate`](https://www.npmjs.com/package/cbar-exchange-rate) | [cbar](https://allratestoday.com/central-bank-rates-api/cbar/) |
| 🇧🇦 Central Bank of Bosnia and Herzegovina | Bosnia and Herzegovina | 🇧🇦 `BAM` | [`cbbh-exchange-rate`](https://www.npmjs.com/package/cbbh-exchange-rate) | [cbbh](https://allratestoday.com/central-bank-rates-api/cbbh/) |
| 🇧🇬 Bulgarian National Bank | Bulgaria | 🇪🇺 `EUR` | [`bnb-exchange-rate`](https://www.npmjs.com/package/bnb-exchange-rate) | [bnb](https://allratestoday.com/central-bank-rates-api/bnb/) |
| 🇵🇪 Central Reserve Bank of Peru | Peru | 🇵🇪 `PEN` | [`bcrp-exchange-rate`](https://www.npmjs.com/package/bcrp-exchange-rate) | [bcrp](https://allratestoday.com/central-bank-rates-api/bcrp/) |
| 🇭🇰 Hong Kong Monetary Authority | Hong Kong | 🇭🇰 `HKD` | [`hkma-exchange-rate`](https://www.npmjs.com/package/hkma-exchange-rate) | [hkma](https://allratestoday.com/central-bank-rates-api/hkma/) |
| 🇮🇱 Bank of Israel | Israel | 🇮🇱 `ILS` | [`bank-of-israel-exchange-rate`](https://www.npmjs.com/package/bank-of-israel-exchange-rate) | [boi](https://allratestoday.com/central-bank-rates-api/boi/) |
| 🇦🇷 Central Bank of Argentina | Argentina | 🇦🇷 `ARS` | [`bcra-exchange-rate`](https://www.npmjs.com/package/bcra-exchange-rate) | [bcra](https://allratestoday.com/central-bank-rates-api/bcra/) |
| 🇿🇦 South African Reserve Bank | South Africa | 🇿🇦 `ZAR` | [`sarb-exchange-rate`](https://www.npmjs.com/package/sarb-exchange-rate) | [sarb](https://allratestoday.com/central-bank-rates-api/sarb/) |
| 🇷🇴 National Bank of Romania | Romania | 🇷🇴 `RON` | [`bnr-exchange-rate`](https://www.npmjs.com/package/bnr-exchange-rate) | [bnr](https://allratestoday.com/central-bank-rates-api/bnr/) |
| 🇺🇦 National Bank of Ukraine | Ukraine | 🇺🇦 `UAH` | [`nbu-exchange-rate`](https://www.npmjs.com/package/nbu-exchange-rate) | [nbu](https://allratestoday.com/central-bank-rates-api/nbu/) |

## 🛡️ Error handling

| Symptom | Cause | Fix |
|---|---|---|
| `Missing ALLRATES_API_KEY environment variable.` (exit 1) | No key in the environment | Export `ALLRATES_API_KEY`, or add the Actions secret for CI builds |
| One card reads *"Fetch failed during this build"* | That bank's request threw; the message is printed to the build log and rendered on the card | Check the log line for the package name and the API error |
| `Every fetch failed — refusing to build an empty page.` (exit 1) | Bad or exhausted key, or no network | Verify the key and your remaining quota |
| `An apiKey is required` thrown by an SDK | `options.apiKey` not passed | Pass `{ apiKey }` to every SDK call |

Common API statuses: `401` missing or invalid key · `429` rate limit or monthly quota exceeded. Historical dates and time series (`getRatesForDate`, `getHistory`) need a [paid plan](https://allratestoday.com/pricing/).

## 🔗 Links

- **Live demo:** [allrates-today.github.io/central-bank-rates-demo](https://allrates-today.github.io/central-bank-rates-demo/)
- **Central Bank Rates API:** [allratestoday.com/central-bank-rates-api](https://allratestoday.com/central-bank-rates-api/)
- **Website:** [allratestoday.com](https://allratestoday.com)
- **API docs:** [allratestoday.com/docs](https://allratestoday.com/docs)
- **Free API key:** [allratestoday.com/register](https://allratestoday.com/register)
- **Pricing:** [allratestoday.com/pricing](https://allratestoday.com/pricing/)
- **Status:** [allratestoday.com/status](https://allratestoday.com/status)
- **Support:** [allratestoday.com/contact](https://allratestoday.com/contact)
- **AI agents:** Claude Code plugin `/plugin marketplace add AllRates-Today/claude-code-plugin` · hosted MCP endpoint `https://allratestoday.com/api/mcp` (keyless)


## 📜 License

MIT, as declared in [`package.json`](package.json).
