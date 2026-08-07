// Build a static dashboard from all 34 central-bank npm SDKs.
// Requires ALLRATES_API_KEY in the environment — get one at https://allratestoday.com/register
import { mkdir, writeFile } from 'node:fs/promises';
import { BANKS } from './banks.mjs';

const apiKey = process.env.ALLRATES_API_KEY;
if (!apiKey) {
  console.error('Missing ALLRATES_API_KEY environment variable.');
  console.error('Get a free key at https://allratestoday.com/register and run:');
  console.error('  ALLRATES_API_KEY=art_live_... npm run build');
  process.exit(1);
}

const CONCURRENCY = 6;

async function fetchBank(bank) {
  // Each bank has its own npm package; the import IS the demo.
  const sdk = await import(bank.npm);
  try {
    const table = await sdk.getLatestRates({ apiKey });
    return { bank, table };
  } catch (err) {
    console.error(`  ${bank.npm}: ${err.message}`);
    return { bank, error: err.message };
  }
}

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

console.log(`Fetching latest tables from ${BANKS.length} central banks…`);
const results = await mapLimit(BANKS, CONCURRENCY, fetchBank);
const ok = results.filter((r) => r.table);
console.log(`Fetched ${ok.length}/${BANKS.length} banks.`);
if (ok.length === 0) {
  console.error('Every fetch failed — refusing to build an empty page.');
  process.exit(1);
}

const PREFERRED_QUOTES = ['USD', 'EUR', 'GBP', 'JPY', 'CNY', 'INR', 'AUD', 'CHF'];

function pickRates(bank, rates) {
  const [exBase, exQuote] = bank.example;
  const key = (r) => `${r.base}/${r.quote}`;
  const picked = [];
  const seen = new Set();
  const add = (r) => {
    if (r && !seen.has(key(r)) && picked.length < 6) {
      seen.add(key(r));
      picked.push(r);
    }
  };
  add(rates.find((r) => r.base === exBase && r.quote === exQuote));
  add(rates.find((r) => r.base === exQuote && r.quote === exBase));
  for (const q of PREFERRED_QUOTES) {
    add(rates.find((r) => r.quote === q));
    add(rates.find((r) => r.base === q));
  }
  for (const r of rates) add(r);
  return picked;
}

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmt = (v) =>
  Number(v).toLocaleString('en-US', { maximumSignificantDigits: 6 });

function bankCard({ bank, table, error }) {
  const spoke = `https://allratestoday.com/central-bank-rates-api/${bank.code}/`;
  const npmUrl = `https://www.npmjs.com/package/${bank.npm}`;
  const body = error
    ? `<p class="error">Fetch failed during this build: ${esc(error)}</p>`
    : `
      <p class="meta"><span class="date">📅 ${esc(table.rate_date)}</span> · ${table.rates.length} published pairs</p>
      <table>
        <thead><tr><th>Pair</th><th>Rate</th><th>Type</th></tr></thead>
        <tbody>
          ${pickRates(bank, table.rates)
            .map(
              (r) =>
                `<tr><td>${esc(r.base)}/${esc(r.quote)}</td><td class="num">${fmt(r.value)}</td><td class="type">${esc(r.type || 'reference')}</td></tr>`
            )
            .join('\n          ')}
        </tbody>
      </table>`;
  const snippet = `import { getLatestRates, getRate } from '${bank.npm}';

const table = await getLatestRates({ apiKey: process.env.ALLRATES_API_KEY });
console.log(table.rate_date, table.rates.length);

const pair = await getRate('${bank.example[0]}', '${bank.example[1]}', { apiKey: process.env.ALLRATES_API_KEY });
console.log(pair);`;
  return `
  <article class="card" data-search="${esc(`${bank.name} ${bank.country} ${bank.homeCcy} ${bank.npm}`.toLowerCase())}">
    <header>
      <h2>${bank.flag} ${esc(bank.name)}</h2>
      <p class="sub">${esc(bank.country)} · ${esc(bank.homeCcy)}</p>
    </header>
    ${body}
    <details>
      <summary>Use this SDK</summary>
      <pre><code>npm install ${bank.npm}</code></pre>
      <pre><code>${esc(snippet)}</code></pre>
    </details>
    <footer>
      <a href="${npmUrl}">npm</a> ·
      <a href="https://github.com/AllRates-Today/${bank.npm}">GitHub</a> ·
      <a href="${spoke}">API docs</a>
    </footer>
  </article>`;
}

const generatedAt = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
const totalPairs = ok.reduce((n, r) => n + r.table.rates.length, 0);

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Central Bank Exchange Rates — 34 npm SDKs, one dashboard</title>
<meta name="description" content="Live demo: official exchange rates fetched from ${BANKS.length} central banks using the AllRatesToday per-bank npm SDKs.">
<style>
:root{
  --bg:#f6f7f9;--card:#ffffff;--text:#1a202c;--muted:#64748b;--border:#e2e8f0;
  --accent:#2563eb;--code-bg:#0f172a;--code-text:#e2e8f0;--error:#b91c1c;
}
@media (prefers-color-scheme: dark){
  :root{--bg:#0b1220;--card:#151e31;--text:#e5eaf2;--muted:#8fa0b8;--border:#263349;
  --accent:#7aa5ff;--code-bg:#0a0f1c;--code-text:#cbd5e1;--error:#f87171;}
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--text);font:16px/1.55 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.wrap{max-width:1180px;margin:0 auto;padding:2rem 1.25rem 4rem}
h1{font-size:1.7rem;margin:0 0 .3rem}
.lede{color:var(--muted);max-width:62ch;margin:0 0 1rem}
.lede a{color:var(--accent)}
.stats{display:flex;gap:2rem;flex-wrap:wrap;margin:1.25rem 0}
.stat b{display:block;font-size:1.5rem}
.stat span{color:var(--muted);font-size:.85rem}
#filter{width:100%;max-width:26rem;padding:.6rem .9rem;font-size:1rem;border:1px solid var(--border);
  border-radius:.6rem;background:var(--card);color:var(--text);margin-bottom:1.5rem}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(330px,1fr));gap:1.1rem}
.card{background:var(--card);border:1px solid var(--border);border-radius:.9rem;padding:1.1rem 1.2rem;display:flex;flex-direction:column;gap:.6rem}
.card h2{font-size:1.05rem;margin:0}
.card .sub{margin:.1rem 0 0;color:var(--muted);font-size:.85rem}
.card .meta{margin:0;font-size:.85rem;color:var(--muted)}
.card table{width:100%;border-collapse:collapse;font-size:.87rem}
.card th{text-align:left;color:var(--muted);font-weight:600;padding:.2rem 0;border-bottom:1px solid var(--border)}
.card td{padding:.28rem 0;border-bottom:1px solid var(--border)}
.card td.num{text-align:right;font-variant-numeric:tabular-nums}
.card td.type{color:var(--muted);font-size:.78rem;text-align:right}
.card details{font-size:.85rem}
.card summary{cursor:pointer;color:var(--accent)}
.card pre{background:var(--code-bg);color:var(--code-text);padding:.7rem .8rem;border-radius:.5rem;overflow-x:auto;font-size:.78rem;line-height:1.5}
.card footer{margin-top:auto;font-size:.82rem;color:var(--muted)}
.card footer a{color:var(--accent);text-decoration:none}
.error{color:var(--error);font-size:.85rem}
.pagefoot{margin-top:2.5rem;color:var(--muted);font-size:.85rem}
.pagefoot a{color:var(--accent)}
</style>
</head>
<body>
<div class="wrap">
  <h1>🏦 Central Bank Exchange Rates</h1>
  <p class="lede">Official published rates from <b>${BANKS.length} central banks</b>, fetched at build time
  using one tiny npm package per bank (<code>ecb-exchange-rate</code>, <code>fed-exchange-rate</code>, …),
  all powered by the <a href="https://allratestoday.com/central-bank-rates-api/">AllRatesToday Central Bank Rates API</a>.
  These are the bank-published reference rates used for tax, customs, audit, and compliant invoicing — not market ticks.</p>
  <div class="stats">
    <div class="stat"><b>${ok.length}</b><span>banks fetched</span></div>
    <div class="stat"><b>${totalPairs.toLocaleString('en-US')}</b><span>published pairs</span></div>
    <div class="stat"><b>${BANKS.length}</b><span>npm SDKs used</span></div>
    <div class="stat"><b>${generatedAt}</b><span>built (UTC, daily)</span></div>
  </div>
  <input id="filter" type="search" placeholder="Filter banks — try “japan”, “EUR”, or “nbp”…" aria-label="Filter banks">
  <div class="grid">
${results.map(bankCard).join('\n')}
  </div>
  <p class="pagefoot">Source on <a href="https://github.com/AllRates-Today/central-bank-rates-demo">GitHub</a> —
  rebuilds daily via GitHub Actions. Get your own free API key (300 req/month) at
  <a href="https://allratestoday.com/register">allratestoday.com/register</a>.</p>
</div>
<script>
const input=document.getElementById('filter');
input.addEventListener('input',()=>{
  const q=input.value.trim().toLowerCase();
  for(const card of document.querySelectorAll('.card'))
    card.style.display=!q||card.dataset.search.includes(q)?'':'none';
});
</script>
</body>
</html>
`;

await mkdir('dist', { recursive: true });
await writeFile('dist/index.html', html);
console.log(`Wrote dist/index.html (${ok.length} banks, ${totalPairs} pairs).`);
