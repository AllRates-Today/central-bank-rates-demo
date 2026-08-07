# Central Bank Rates Demo

Sample website that pulls **official exchange rates from 34 central banks** — one npm
package per bank — and renders them as a static dashboard.

**Live site:** https://allrates-today.github.io/central-bank-rates-demo/

Every card on the page comes from its own SDK: [`ecb-exchange-rate`](https://www.npmjs.com/package/ecb-exchange-rate),
[`fed-exchange-rate`](https://www.npmjs.com/package/fed-exchange-rate),
[`boe-exchange-rate`](https://www.npmjs.com/package/boe-exchange-rate),
[`boj-exchange-rate`](https://www.npmjs.com/package/boj-exchange-rate),
[`nbp-exchange-rate`](https://www.npmjs.com/package/nbp-exchange-rate) … all 34 are listed in
[`banks.mjs`](banks.mjs) and installed from [`package.json`](package.json). Each one is a
zero-dependency wrapper around the
[AllRatesToday Central Bank Rates API](https://allratestoday.com/central-bank-rates-api/).

## How it works

1. [`build.mjs`](build.mjs) dynamically imports each bank's package and calls
   `getLatestRates({ apiKey })` — the bank's full published table for its latest date.
2. It renders everything into a single self-contained `dist/index.html`.
3. A [GitHub Actions workflow](.github/workflows/deploy.yml) rebuilds and redeploys to
   GitHub Pages on every push **and daily at 06:30 UTC**, so the page tracks each bank's
   most recent published table. The API key lives in an Actions secret
   (`ALLRATES_API_KEY`) — it is never in the repo or in the shipped HTML.

Central banks publish once per business day, so building statically once a day costs just
34 API calls — a pattern worth copying: cache the daily table instead of calling the API
per page view.

## Run it yourself

```bash
git clone https://github.com/AllRates-Today/central-bank-rates-demo
cd central-bank-rates-demo
npm install
ALLRATES_API_KEY=art_live_your_key npm run build
open dist/index.html
```

Get a free API key (300 requests/month, no credit card) at
[allratestoday.com/register](https://allratestoday.com/register).

## Use one SDK in your own project

```bash
npm install ecb-exchange-rate
```

```js
import { getRate } from 'ecb-exchange-rate';
const pair = await getRate('USD', 'EUR', { apiKey: process.env.ALLRATES_API_KEY });
console.log(pair.rate, pair.rate_date);
```

Historical dates and time series (`getRatesForDate`, `getHistory`) are available on
[paid plans](https://allratestoday.com/pricing/).

## License

MIT
