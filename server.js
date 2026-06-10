const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const OANDA_BASE = 'https://api-fxpractice.oanda.com';

app.get('/api/pricing', async (req, res) => {
  const { apiKey, accountId, instruments } = req.query;
  if (!apiKey || !accountId || !instruments)
    return res.status(400).json({ error: 'Missing params' });
  try {
    const r = await fetch(
      `${OANDA_BASE}/v3/accounts/${accountId}/pricing?instruments=${instruments}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json(d);
    res.json(d);
  } catch(e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/candles', async (req, res) => {
  const { apiKey, instrument, granularity, count } = req.query;
  if (!apiKey || !instrument)
    return res.status(400).json({ error: 'Missing params' });
  try {
    const r = await fetch(
      `${OANDA_BASE}/v3/instruments/${instrument}/candles?granularity=${granularity||'M5'}&count=${count||100}`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json(d);
    res.json(d);
  } catch(e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/account', async (req, res) => {
  const { apiKey, accountId } = req.query;
  if (!apiKey || !accountId)
    return res.status(400).json({ error: 'Missing params' });
  try {
    const r = await fetch(
      `${OANDA_BASE}/v3/accounts/${accountId}/summary`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    const d = await r.json();
    if (!r.ok) return res.status(r.status).json(d);
    res.json(d);
  } catch(e) { res.status(502).json({ error: e.message }); }
});

app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const SIMULATOR_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PassRate — Prop Firm Challenge Simulator</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

:root {
  --bg:        #0a0f0d;
  --bg2:       #111a16;
  --bg3:       #172118;
  --border:    rgba(255,255,255,0.08);
  --border2:   rgba(255,255,255,0.14);
  --green:     #1D9E75;
  --green-l:   #9FE1CB;
  --green-d:   #085041;
  --red:       #E24B4A;
  --red-l:     #f87171;
  --amber:     #F0A500;
  --text:      #f0f4f2;
  --muted:     #6b8a7a;
  --muted2:    #4a6657;
  --mono:      'JetBrains Mono', monospace;
  --sans:      'Inter', sans-serif;
}

body {
  font-family: var(--sans);
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  line-height: 1.5;
  min-height: 100vh;
}

/* ── SETUP SCREEN ── */
#setup-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.setup-card {
  background: var(--bg2);
  border: 1px solid var(--border2);
  border-radius: 20px;
  padding: 2.5rem;
  width: 100%;
  max-width: 520px;
}

.setup-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 2rem;
}

.logo-mark {
  width: 44px; height: 44px;
  background: var(--green-d);
  border-radius: 10px;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 800; color: white; letter-spacing: -1px;
  position: relative; overflow: hidden;
}

.logo-mark::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; bottom: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent, transparent 5px,
    rgba(159,225,203,0.08) 5px, rgba(159,225,203,0.08) 6px
  );
}

.logo-name { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; }
.logo-name span { color: var(--green); }

.setup-title { font-size: 22px; font-weight: 700; margin-bottom: 0.4rem; letter-spacing: -0.5px; }
.setup-sub { color: var(--muted); font-size: 13px; margin-bottom: 2rem; line-height: 1.6; }

.form-group { margin-bottom: 1.25rem; }
.form-label { font-size: 12px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 6px; display: block; }

.form-input, .form-select {
  width: 100%;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 10px;
  padding: 11px 14px;
  font-size: 14px;
  font-family: var(--sans);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
}
.form-input:focus, .form-select:focus { border-color: var(--green); }
.form-select option { background: var(--bg2); }

.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.api-note {
  background: rgba(29,158,117,0.08);
  border: 1px solid rgba(29,158,117,0.2);
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 12px;
  color: var(--green-l);
  margin-bottom: 1.5rem;
  line-height: 1.6;
}
.api-note a { color: var(--green); text-decoration: underline; }

.btn-start {
  width: 100%;
  padding: 14px;
  background: var(--green);
  border: none;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  font-family: var(--sans);
  transition: background 0.2s, transform 0.1s;
  letter-spacing: -0.2px;
}
.btn-start:hover { background: #1a8a65; }
.btn-start:active { transform: scale(0.99); }

/* ── SIMULATOR SCREEN ── */
#sim-screen { display: none; }

.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-bottom: 1px solid var(--border);
  background: var(--bg2);
  position: sticky; top: 0; z-index: 100;
}

.topbar-left { display: flex; align-items: center; gap: 16px; }
.topbar-logo { font-size: 17px; font-weight: 800; letter-spacing: -0.5px; }
.topbar-logo span { color: var(--green); }

.session-info {
  font-size: 12px;
  color: var(--muted);
  background: var(--bg3);
  padding: 5px 12px;
  border-radius: 20px;
  border: 1px solid var(--border);
}
.session-info strong { color: var(--text); font-weight: 600; }

.live-dot {
  display: inline-flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 600; color: var(--green);
}
.live-dot::before {
  content: '';
  width: 6px; height: 6px;
  border-radius: 50%;
  background: var(--green);
  animation: pulse 1.5s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.topbar-right { display: flex; align-items: center; gap: 12px; }

.btn-reset {
  padding: 7px 14px;
  background: none;
  border: 1px solid var(--border2);
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  font-family: var(--sans);
  transition: all 0.15s;
}
.btn-reset:hover { border-color: var(--red-l); color: var(--red-l); }

/* ── RULES BAR ── */
.rules-bar {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 1px;
  background: var(--border);
  border-bottom: 1px solid var(--border);
}

.rule-cell {
  background: var(--bg2);
  padding: 12px 20px;
}

.rule-name { font-size: 10px; font-weight: 600; color: var(--muted); text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 4px; }

.rule-val {
  font-family: var(--mono);
  font-size: 18px;
  font-weight: 600;
  line-height: 1;
  margin-bottom: 4px;
}
.rule-val.green { color: var(--green); }
.rule-val.amber { color: var(--amber); }
.rule-val.red   { color: var(--red);   }

.rule-bar-track {
  height: 3px;
  background: var(--bg3);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 3px;
}
.rule-bar-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease, background 0.3s;
}

.rule-sub { font-size: 10px; color: var(--muted2); }

/* ── MAIN LAYOUT ── */
.main { display: grid; grid-template-columns: 1fr 320px; height: calc(100vh - 113px); overflow: hidden; }

/* ── CHART PANEL ── */
.chart-panel {
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-toolbar {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 10px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  gap: 12px;
}

.pair-selector { display: flex; gap: 6px; flex-wrap: wrap; }

.tf-btn {
  padding: 4px 9px;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 700;
  cursor: pointer;
  border: 1px solid var(--border2);
  background: none;
  color: var(--muted);
  font-family: var(--mono);
  transition: all 0.15s;
  letter-spacing: 0.3px;
}
.tf-btn.active { background: var(--bg3); color: var(--green-l); border-color: var(--green); }
.tf-btn:hover:not(.active) { color: var(--text); border-color: var(--border2); }
.draw-toolbar {
  width: 38px;
  background: var(--bg2);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 0;
  gap: 2px;
  flex-shrink: 0;
  z-index: 10;
}
.draw-btn {
  width: 30px; height: 30px;
  border-radius: 6px;
  border: 1px solid transparent;
  background: none;
  color: var(--muted);
  cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.15s;
  font-size: 14px;
  position: relative;
}
.draw-btn:hover { background: var(--bg3); color: var(--text); border-color: var(--border2); }
.draw-btn.active { background: var(--green-d); color: var(--green-l); border-color: var(--green); }
.draw-btn[title]:hover::after {
  content: attr(title);
  position: absolute;
  left: 36px;
  top: 50%;
  transform: translateY(-50%);
  background: var(--bg2);
  border: 1px solid var(--border2);
  color: var(--text);
  font-size: 11px;
  font-weight: 500;
  padding: 4px 8px;
  border-radius: 6px;
  white-space: nowrap;
  z-index: 999;
  pointer-events: none;
  font-family: var(--sans);
}
.draw-divider {
  width: 20px; height: 1px;
  background: var(--border);
  margin: 4px 0;
}
.chart-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
  min-height: 0;
}

#drawCanvas {
  position: absolute;
  top: 0; left: 0;
  width: 100%; height: 100%;
  pointer-events: none;
  z-index: 20;
}
#drawCanvas.drawing { pointer-events: all; cursor: crosshair; }
.text-input-overlay {
  display: none;
  position: absolute;
  z-index: 50;
  background: var(--bg2);
  border: 1px solid var(--green);
  border-radius: 6px;
  padding: 6px 10px;
  font-size: 13px;
  font-family: var(--sans);
  color: var(--text);
  outline: none;
  min-width: 120px;
}
.pair-btn {
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border2);
  background: none;
  color: var(--muted);
  font-family: var(--sans);
  transition: all 0.15s;
}
.pair-btn.active { background: var(--green-d); color: var(--green-l); border-color: var(--green-d); }
.pair-btn:hover:not(.active) { border-color: var(--border2); color: var(--text); }

.price-display { text-align: right; }
.current-price {
  font-family: var(--mono);
  font-size: 22px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 1;
}
.price-change { font-size: 11px; font-weight: 600; margin-top: 2px; }
.price-change.up { color: var(--green); }
.price-change.down { color: var(--red); }

.chart-area {
  flex: 1;
  padding: 0;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: row;
}



/* ── TRADE PANEL ── */
.trade-panel {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg2);
}

.panel-section {
  border-bottom: 1px solid var(--border);
  padding: 16px;
  flex-shrink: 0;
}

.panel-title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--muted);
  margin-bottom: 12px;
}

.bid-ask {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  margin-bottom: 12px;
}

.ba-box {
  background: var(--bg3);
  border-radius: 8px;
  padding: 10px 12px;
  text-align: center;
  border: 1px solid var(--border);
}
.ba-label { font-size: 10px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.ba-price { font-family: var(--mono); font-size: 17px; font-weight: 600; margin-top: 3px; }
.ba-price.bid { color: var(--red-l); }
.ba-price.ask { color: var(--green-l); }

.lot-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}
.lot-label { font-size: 12px; color: var(--muted); font-weight: 500; min-width: 60px; }
.lot-input {
  flex: 1;
  background: var(--bg3);
  border: 1px solid var(--border2);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-family: var(--mono);
  color: var(--text);
  outline: none;
  transition: border-color 0.2s;
  text-align: center;
}
.lot-input:focus { border-color: var(--green); }

.trade-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }

.btn-buy {
  padding: 12px;
  background: var(--green);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  font-family: var(--sans);
  transition: background 0.15s, transform 0.1s;
}
.btn-buy:hover { background: #1a8a65; }
.btn-buy:active { transform: scale(0.97); }

.btn-sell {
  padding: 12px;
  background: var(--red);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  font-family: var(--sans);
  transition: background 0.15s, transform 0.1s;
}
.btn-sell:hover { background: #c73f3e; }
.btn-sell:active { transform: scale(0.97); }

/* open positions */
.positions-list { overflow-y: auto; flex: 1; }

.position-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border);
  font-size: 12px;
  transition: background 0.15s;
}
.position-row:hover { background: var(--bg3); }

.pos-left { display: flex; flex-direction: column; gap: 2px; }
.pos-pair { font-weight: 600; font-size: 13px; }
.pos-detail { color: var(--muted); font-size: 11px; }
.pos-detail .buy-tag  { color: var(--green-l); font-weight: 600; }
.pos-detail .sell-tag { color: var(--red-l); font-weight: 600; }

.pos-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
.pos-pnl { font-family: var(--mono); font-size: 13px; font-weight: 600; }
.pos-pnl.profit { color: var(--green); }
.pos-pnl.loss   { color: var(--red); }

.pos-close {
  font-size: 10px;
  color: var(--muted2);
  cursor: pointer;
  padding: 2px 8px;
  border: 1px solid var(--border);
  border-radius: 4px;
  background: none;
  font-family: var(--sans);
  transition: all 0.15s;
}
.pos-close:hover { border-color: var(--red-l); color: var(--red-l); }

.empty-state {
  padding: 2rem 1rem;
  text-align: center;
  color: var(--muted2);
  font-size: 12px;
  line-height: 1.8;
}

/* ── BREACH ALERT ── */
.breach-alert {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}
.breach-alert.show { display: flex; }

.breach-card {
  background: var(--bg2);
  border: 1px solid var(--red);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
}

.breach-icon { font-size: 48px; margin-bottom: 1rem; }
.breach-title { font-size: 22px; font-weight: 800; color: var(--red-l); margin-bottom: 0.5rem; letter-spacing: -0.5px; }
.breach-msg { color: var(--muted); font-size: 14px; line-height: 1.7; margin-bottom: 1.5rem; }
.breach-score { font-size: 48px; font-weight: 800; color: var(--green); font-family: var(--mono); line-height: 1; margin-bottom: 0.25rem; }
.breach-score-lbl { font-size: 12px; color: var(--muted); font-weight: 600; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1.5rem; }
.breach-rules { background: var(--bg3); border-radius: 10px; padding: 1rem; margin-bottom: 1.5rem; text-align: left; }
.breach-rule-row { display: flex; justify-content: space-between; font-size: 12px; padding: 4px 0; border-bottom: 1px solid var(--border); }
.breach-rule-row:last-child { border-bottom: none; }
.breach-rule-name { color: var(--muted); }
.breach-rule-status { font-weight: 600; }
.passed { color: var(--green); }
.failed { color: var(--red); }

.btn-retry {
  width: 100%;
  padding: 13px;
  background: var(--green);
  border: none;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  cursor: pointer;
  font-family: var(--sans);
}

/* ── PASS ALERT ── */
.pass-alert {
  display: none;
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.85);
  z-index: 1000;
  align-items: center;
  justify-content: center;
}
.pass-alert.show { display: flex; }

.pass-card {
  background: var(--bg2);
  border: 1px solid var(--green);
  border-radius: 20px;
  padding: 2.5rem;
  max-width: 420px;
  width: 90%;
  text-align: center;
}
.pass-title { font-size: 26px; font-weight: 800; color: var(--green-l); margin-bottom: 0.5rem; letter-spacing: -1px; }
.pass-sub { color: var(--muted); font-size: 14px; line-height: 1.7; margin-bottom: 1.5rem; }

/* ── CONNECTION ERROR ── */
.conn-banner {
  display: none;
  background: rgba(240,165,0,0.1);
  border-bottom: 1px solid rgba(240,165,0,0.3);
  padding: 8px 24px;
  font-size: 12px;
  color: var(--amber);
  text-align: center;
}
.conn-banner.show { display: block; }

@media (max-width: 800px) {
  .rules-bar { grid-template-columns: repeat(3, 1fr); }
  .main { grid-template-columns: 1fr; }
  .trade-panel { display: none; }
}
</style>
</head>
<body>

<!-- ══════════════════════════════════
     SETUP SCREEN
══════════════════════════════════ -->
<div id="setup-screen">
  <div class="setup-card">
    <div class="setup-logo">
      <div class="logo-mark">PR</div>
      <div class="logo-name">Pass<span>Rate</span></div>
    </div>

    <h2 class="setup-title">Start your challenge simulation</h2>
    <p class="setup-sub">Connect your OANDA practice account to trade against live market prices with real prop firm rules enforced.</p>

    <div class="api-note">
      Need an API key? <a href="https://www.oanda.com/register/#/sign-up/demo" target="_blank">Open a free OANDA practice account</a> — takes 5 minutes. Then go to My Account &rarr; Manage API Access to generate your token and find your Account ID.
    </div>

    <div class="form-group">
      <label class="form-label">OANDA API Key (practice account)</label>
      <input type="password" class="form-input" id="apiKey" placeholder="e.g. 3b2c1a0d-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
    </div>

    <div class="form-group">
      <label class="form-label">OANDA Account ID</label>
      <input type="text" class="form-input" id="accountId" placeholder="e.g. 101-004-12345678-001" />
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Prop Firm</label>
        <select class="form-select" id="firmSelect">
          <option value="ftmo">FTMO</option>
          <option value="fundingpips">Funding Pips</option>
          <option value="the5ers">The5ers</option>
          <option value="fundednext">FundedNext</option>
          <option value="myfundedfx">MyFundedFX</option>
          <option value="apextrader">Apex Trader</option>
          <option value="blueguardian">Blue Guardian</option>
          <option value="alphacapital">Alpha Capital</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Account Size</label>
        <select class="form-select" id="accountSize">
          <option value="10000">$10,000</option>
          <option value="25000">$25,000</option>
          <option value="50000">$50,000</option>
          <option value="100000" selected>$100,000</option>
          <option value="200000">$200,000</option>
        </select>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Challenge Phase</label>
        <select class="form-select" id="phaseSelect">
          <option value="1">Phase 1</option>
          <option value="2">Phase 2</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Trading Days</label>
        <select class="form-select" id="daysSelect">
          <option value="30" selected>30 days</option>
          <option value="60">60 days</option>
          <option value="unlimited">Unlimited</option>
        </select>
      </div>
    </div>

    <button class="btn-start" onclick="startSimulation()">Start simulation with live prices</button>
  </div>
</div>

<!-- ══════════════════════════════════
     SIMULATOR SCREEN
══════════════════════════════════ -->
<div id="sim-screen">

  <div class="conn-banner" id="connBanner">
    Running in simulation mode — prices are realistic but not live. To connect live data: enter your OANDA API key and account ID in settings.
  </div>

  <!-- Top bar -->
  <div class="topbar">
    <div class="topbar-left">
      <div class="topbar-logo">Pass<span>Rate</span></div>
      <div class="session-info" id="sessionInfo">FTMO &middot; $100K &middot; Phase 1</div>
      <div class="live-dot" id="liveDot">LIVE</div>
    </div>
    <div class="topbar-right">
      <div style="font-size:12px; color:var(--muted);">Day <strong id="dayCounter" style="color:var(--text);">1</strong> of <span id="totalDays">30</span></div>
      <button class="btn-reset" onclick="resetSimulation()">End session</button>
    </div>
  </div>

  <!-- Rules bar -->
  <div class="rules-bar">
    <div class="rule-cell">
      <div class="rule-name">Account P&L</div>
      <div class="rule-val green" id="rPnl">+$0.00</div>
      <div class="rule-bar-track"><div class="rule-bar-fill" id="rPnlBar" style="width:0%;background:var(--green);"></div></div>
      <div class="rule-sub" id="rPnlSub">Target: $10,000 (10%)</div>
    </div>
    <div class="rule-cell">
      <div class="rule-name">Daily loss used</div>
      <div class="rule-val green" id="rDaily">$0.00</div>
      <div class="rule-bar-track"><div class="rule-bar-fill" id="rDailyBar" style="width:0%;background:var(--green);"></div></div>
      <div class="rule-sub" id="rDailySub">Limit: $5,000 (5%)</div>
    </div>
    <div class="rule-cell">
      <div class="rule-name">Max drawdown</div>
      <div class="rule-val green" id="rDd">$0.00</div>
      <div class="rule-bar-track"><div class="rule-bar-fill" id="rDdBar" style="width:0%;background:var(--green);"></div></div>
      <div class="rule-sub" id="rDdSub">Limit: $10,000 (10%)</div>
    </div>
    <div class="rule-cell">
      <div class="rule-name">Consistency</div>
      <div class="rule-val green" id="rConsist">OK</div>
      <div class="rule-bar-track"><div class="rule-bar-fill" id="rConsistBar" style="width:0%;background:var(--green);"></div></div>
      <div class="rule-sub" id="rConsistSub">Best day &lt; 50% of target</div>
    </div>
    <div class="rule-cell">
      <div class="rule-name">PassRate score</div>
      <div class="rule-val green" id="rScore">100</div>
      <div class="rule-bar-track"><div class="rule-bar-fill" id="rScoreBar" style="width:100%;background:var(--green);"></div></div>
      <div class="rule-sub" id="rScoreSub">On track to pass</div>
    </div>
  </div>

  <!-- Main -->
  <div class="main">

    <!-- Chart panel -->
    <div class="chart-panel">
      <div class="chart-toolbar">
        <div style="display:flex;flex-direction:column;gap:6px;">
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
            <span style="font-size:10px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:0.8px;min-width:36px;">FX</span>
            <button class="pair-btn active" onclick="switchPair('EUR_USD', this)">EUR/USD</button>
            <button class="pair-btn" onclick="switchPair('GBP_USD', this)">GBP/USD</button>
            <button class="pair-btn" onclick="switchPair('USD_JPY', this)">USD/JPY</button>
            <button class="pair-btn" onclick="switchPair('AUD_USD', this)">AUD/USD</button>
            <button class="pair-btn" onclick="switchPair('USD_CAD', this)">USD/CAD</button>
            <button class="pair-btn" onclick="switchPair('EUR_GBP', this)">EUR/GBP</button>
            <button class="pair-btn" onclick="switchPair('GBP_JPY', this)">GBP/JPY</button>
            <button class="pair-btn" onclick="switchPair('EUR_JPY', this)">EUR/JPY</button>
            <button class="pair-btn" onclick="switchPair('USD_CHF', this)">USD/CHF</button>
            <button class="pair-btn" onclick="switchPair('NZD_USD', this)">NZD/USD</button>
            <button class="pair-btn" onclick="switchPair('AUD_JPY', this)">AUD/JPY</button>
            <button class="pair-btn" onclick="switchPair('EUR_AUD', this)">EUR/AUD</button>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
            <span style="font-size:10px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:0.8px;min-width:36px;">Metal</span>
            <button class="pair-btn" onclick="switchPair('XAU_USD', this)">XAU/USD</button>
            <button class="pair-btn" onclick="switchPair('XAG_USD', this)">XAG/USD</button>
          </div>
          <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap;">
            <span style="font-size:10px;font-weight:700;color:var(--muted2);text-transform:uppercase;letter-spacing:0.8px;min-width:36px;">Index</span>
            <button class="pair-btn" onclick="switchPair('SPX500_USD', this)">S&amp;P 500</button>
            <button class="pair-btn" onclick="switchPair('NAS100_USD', this)">NASDAQ</button>
            <button class="pair-btn" onclick="switchPair('UK100_GBP', this)">FTSE 100</button>
            <button class="pair-btn" onclick="switchPair('DE30_EUR', this)">DAX</button>
            <button class="pair-btn" onclick="switchPair('JP225_USD', this)">Nikkei</button>
            <button class="pair-btn" onclick="switchPair('US30_USD', this)">Dow Jones</button>
          </div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">
          <div class="price-display">
            <div class="current-price" id="currentPrice">—</div>
            <div class="price-change" id="priceChange"></div>
          </div>
          <div style="display:flex;gap:4px;">
            <button class="tf-btn active" onclick="switchTimeframe('M1',this)">M1</button>
            <button class="tf-btn" onclick="switchTimeframe('M5',this)">M5</button>
            <button class="tf-btn" onclick="switchTimeframe('M15',this)">M15</button>
            <button class="tf-btn" onclick="switchTimeframe('M30',this)">M30</button>
            <button class="tf-btn" onclick="switchTimeframe('H1',this)">H1</button>
            <button class="tf-btn" onclick="switchTimeframe('H4',this)">H4</button>
            <button class="tf-btn" onclick="switchTimeframe('D',this)">D</button>
          </div>
        </div>
      </div>
      <div class="chart-area">
        <!-- Drawing toolbar -->
        <div class="draw-toolbar" id="drawToolbar">
          <button class="draw-btn active" id="btn-cursor"  onclick="setTool('cursor')"  title="Select / Pan">&#9654;</button>
          <div class="draw-divider"></div>
          <button class="draw-btn" id="btn-trendline"   onclick="setTool('trendline')"   title="Trend line">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="14" y2="2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
          <button class="draw-btn" id="btn-hline"       onclick="setTool('hline')"       title="Horizontal line">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="1" y1="8" x2="15" y2="8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="1" y1="8" x2="4" y2="5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/><line x1="1" y1="8" x2="4" y2="11" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
          <button class="draw-btn" id="btn-vline"       onclick="setTool('vline')"       title="Vertical line">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="8" y1="1" x2="8" y2="15" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
          <button class="draw-btn" id="btn-ray"         onclick="setTool('ray')"         title="Ray (extended line)">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="2" y1="12" x2="15" y2="4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><circle cx="2" cy="12" r="1.5" fill="currentColor"/></svg>
          </button>
          <div class="draw-divider"></div>
          <button class="draw-btn" id="btn-fib"         onclick="setTool('fib')"         title="Fibonacci retracement">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="3"  x2="14" y2="3"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="2" y1="7"  x2="14" y2="7"  stroke="#1D9E75"      stroke-width="1.5" stroke-linecap="round"/>
              <line x1="2" y1="9"  x2="14" y2="9"  stroke="#1D9E75"      stroke-width="1.5" stroke-linecap="round"/>
              <line x1="2" y1="11" x2="14" y2="11" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="2" y1="13" x2="14" y2="13" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <button class="draw-btn" id="btn-fibext"      onclick="setTool('fibext')"      title="Fibonacci extension">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <line x1="2" y1="2"  x2="14" y2="2"  stroke="#9FE1CB"      stroke-width="1.5" stroke-linecap="round"/>
              <line x1="2" y1="5"  x2="14" y2="5"  stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="2" y1="9"  x2="14" y2="9"  stroke="#1D9E75"      stroke-width="1.5" stroke-linecap="round"/>
              <line x1="2" y1="12" x2="14" y2="12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
              <line x1="2" y1="14" x2="14" y2="14" stroke="#9FE1CB"      stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
          <div class="draw-divider"></div>
          <button class="draw-btn" id="btn-rect"        onclick="setTool('rect')"        title="Rectangle">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><rect x="2" y="4" width="12" height="8" rx="1" stroke="currentColor" stroke-width="1.8"/></svg>
          </button>
          <button class="draw-btn" id="btn-text"        onclick="setTool('text')"        title="Text label">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><text x="3" y="13" font-size="12" font-weight="700" fill="currentColor" font-family="serif">T</text></svg>
          </button>
          <div class="draw-divider"></div>
          <button class="draw-btn" id="btn-long"  onclick="setTool('long')"  title="Long position" style="color:#1D9E75;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="6" width="14" height="8" rx="1" fill="rgba(29,158,117,0.15)" stroke="#1D9E75" stroke-width="1.2"/>
              <line x1="1" y1="3" x2="15" y2="3" stroke="#1D9E75" stroke-width="1.5" stroke-dasharray="3,2"/>
              <polyline points="8,1 8,5" stroke="#1D9E75" stroke-width="1.5" stroke-linecap="round"/>
              <polyline points="5,3 8,0.5 11,3" stroke="#1D9E75" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <button class="draw-btn" id="btn-short" onclick="setTool('short')" title="Short position" style="color:#E24B4A;">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="14" height="8" rx="1" fill="rgba(226,75,74,0.15)" stroke="#E24B4A" stroke-width="1.2"/>
              <line x1="1" y1="13" x2="15" y2="13" stroke="#E24B4A" stroke-width="1.5" stroke-dasharray="3,2"/>
              <polyline points="8,11 8,15" stroke="#E24B4A" stroke-width="1.5" stroke-linecap="round"/>
              <polyline points="5,13 8,15.5 11,13" stroke="#E24B4A" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
          <div class="draw-divider"></div>
          <button class="draw-btn" id="btn-undo"        onclick="undoDraw()"             title="Undo last drawing" style="color:var(--amber);">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8 C3 5 6 3 9 3 C12 3 14 5 14 8 C14 11 12 13 9 13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" fill="none"/><polyline points="2,5 3,9 7,8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
          </button>
          <button class="draw-btn" id="btn-clear"       onclick="clearDrawings()"        title="Clear all drawings" style="color:var(--red-l);">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><line x1="13" y1="3" x2="3" y2="13" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- Chart + canvas overlay -->
        <div class="chart-wrap">
          <div id="priceChart" style="position:absolute;top:0;left:0;right:0;bottom:0;"></div>
          <canvas id="drawCanvas"></canvas>
          <input type="text" id="textInput" class="text-input-overlay" placeholder="Type label..." onkeydown="commitText(event)"/>
        </div>
      </div>
    </div>

    <!-- Trade panel -->
    <div class="trade-panel">

      <div class="panel-section">
        <div class="panel-title">Place trade</div>
        <div class="bid-ask">
          <div class="ba-box">
            <div class="ba-label">Bid (Sell)</div>
            <div class="ba-price bid" id="bidPrice">—</div>
          </div>
          <div class="ba-box">
            <div class="ba-label">Ask (Buy)</div>
            <div class="ba-price ask" id="askPrice">—</div>
          </div>
        </div>
        <div class="lot-row">
          <div class="lot-label">Lot size</div>
          <input type="number" class="lot-input" id="lotSize" value="0.10" step="0.01" min="0.01" max="10"/>
        </div>
        <div class="trade-btns">
          <button class="btn-buy"  onclick="placeTrade('BUY')">Buy</button>
          <button class="btn-sell" onclick="placeTrade('SELL')">Sell</button>
        </div>
      </div>

      <div class="panel-section" style="padding-bottom:8px;">
        <div class="panel-title">Open positions</div>
      </div>

      <div class="positions-list" id="positionsList">
        <div class="empty-state">No open positions.<br>Place a trade to begin.</div>
      </div>

    </div>
  </div>
</div>

<!-- Breach alert -->
<div class="breach-alert" id="breachAlert">
  <div class="breach-card">
    <div class="breach-icon">&#128683;</div>
    <div class="breach-title" id="breachTitle">Challenge Failed</div>
    <div class="breach-msg" id="breachMsg">You breached the daily loss limit. In a real challenge this would end your attempt.</div>
    <div class="breach-score" id="breachScore">42</div>
    <div class="breach-score-lbl">PassRate score</div>
    <div class="breach-rules" id="breachRules"></div>
    <button class="btn-retry" onclick="retrySimulation()">Try again</button>
  </div>
</div>

<!-- Pass alert -->
<div class="pass-alert" id="passAlert">
  <div class="pass-card">
    <div style="font-size:52px;margin-bottom:1rem;">&#127881;</div>
    <div class="pass-title">Challenge passed!</div>
    <div class="pass-sub">You hit the profit target while staying within all rules. You're ready for the real challenge.</div>
    <div class="breach-score" style="color:var(--green);" id="passScore">98</div>
    <div class="breach-score-lbl">PassRate score</div>
    <div style="margin-top:1.5rem;">
      <button class="btn-retry" onclick="retrySimulation()">Run another simulation</button>
    </div>
  </div>
</div>

<script src="https://unpkg.com/lightweight-charts@4.1.3/dist/lightweight-charts.standalone.production.js"></script>
<script>
// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let state = {
  apiKey: '', accountId: '', firm: 'ftmo',
  accountSize: 100000, phase: 1, totalDays: 30,
  currentPair: 'EUR_USD',
  timeframe: 'M5',
  balance: 100000,
  equity: 100000,
  peakEquity: 100000,
  dailyStartBalance: 100000,
  dailyPnl: 0,
  totalPnl: 0,
  bestDayPnl: 0,
  day: 1,
  positions: [],
  priceHistory: [],
  bid: 0, ask: 0,
  prices: {},
  priceIntervals: {},
  connected: false,
  rules: {},
  tradeCount: 0,
  lastCandle: null
};

// Firm rules config
const FIRMS = {
  ftmo:         { name:'FTMO',          profitTarget:0.10, dailyLoss:0.05, maxDrawdown:0.10, consistency:true,  consistencyLimit:0.50 },
  fundingpips:  { name:'Funding Pips',  profitTarget:0.08, dailyLoss:0.05, maxDrawdown:0.10, consistency:false, consistencyLimit:0 },
  the5ers:      { name:'The5ers',       profitTarget:0.08, dailyLoss:0.04, maxDrawdown:0.08, consistency:false, consistencyLimit:0 },
  fundednext:   { name:'FundedNext',    profitTarget:0.10, dailyLoss:0.05, maxDrawdown:0.10, consistency:false, consistencyLimit:0 },
  myfundedfx:   { name:'MyFundedFX',   profitTarget:0.08, dailyLoss:0.05, maxDrawdown:0.10, consistency:false, consistencyLimit:0 },
  apextrader:   { name:'Apex Trader',   profitTarget:0.09, dailyLoss:0.05, maxDrawdown:0.10, consistency:false, consistencyLimit:0 },
  blueguardian: { name:'Blue Guardian', profitTarget:0.08, dailyLoss:0.05, maxDrawdown:0.10, consistency:false, consistencyLimit:0 },
  alphacapital: { name:'Alpha Capital', profitTarget:0.10, dailyLoss:0.05, maxDrawdown:0.10, consistency:false, consistencyLimit:0 },
};

// Seed prices (fallback if OANDA fails)
function getDP(pair) {
  if (['SPX500_USD','NAS100_USD','UK100_GBP','DE30_EUR','JP225_USD','US30_USD'].includes(pair)) return 1;
  if (['XAU_USD'].includes(pair)) return 2;
  if (['XAG_USD'].includes(pair)) return 3;
  if (['USD_JPY','GBP_JPY','EUR_JPY','AUD_JPY'].includes(pair)) return 3;
  return 5;
}

function getSpread(pair) {
  const spreads = {
    EUR_USD:0.00012, GBP_USD:0.00015, USD_JPY:0.012, AUD_USD:0.00013, USD_CAD:0.00015,
    EUR_GBP:0.00012, GBP_JPY:0.018,   EUR_JPY:0.015, USD_CHF:0.00014, NZD_USD:0.00015,
    AUD_JPY:0.015,   EUR_AUD:0.00018,
    XAU_USD:0.30,    XAG_USD:0.03,
    SPX500_USD:0.4,  NAS100_USD:0.8,  UK100_GBP:0.6,
    DE30_EUR:0.8,    JP225_USD:4.0,   US30_USD:1.5
  };
  return spreads[pair] || 0.00012;
}

const SEED_PRICES = {
  EUR_USD: 1.0842, GBP_USD: 1.2731, USD_JPY: 149.54,
  AUD_USD: 0.6512, USD_CAD: 1.3621, EUR_GBP: 0.8512,
  GBP_JPY: 190.24, EUR_JPY: 162.18, USD_CHF: 0.9012,
  NZD_USD: 0.5982, AUD_JPY: 97.42,  EUR_AUD: 1.6634,
  XAU_USD: 2342.50, XAG_USD: 27.85,
  SPX500_USD: 5248.0, NAS100_USD: 18320.0, UK100_GBP: 8142.0,
  DE30_EUR: 18320.0, JP225_USD: 38540.0, US30_USD: 38920.0
};

const PIP_SIZE = {
  EUR_USD:0.0001, GBP_USD:0.0001, USD_JPY:0.01,  AUD_USD:0.0001, USD_CAD:0.0001,
  EUR_GBP:0.0001, GBP_JPY:0.01,   EUR_JPY:0.01,  USD_CHF:0.0001, NZD_USD:0.0001,
  AUD_JPY:0.01,   EUR_AUD:0.0001,
  XAU_USD:0.01,   XAG_USD:0.001,
  SPX500_USD:0.1, NAS100_USD:0.1, UK100_GBP:0.1,
  DE30_EUR:0.1,   JP225_USD:0.1,  US30_USD:0.1
};
const PIP_VALUE = {
  EUR_USD:10,  GBP_USD:10,   USD_JPY:6.68,  AUD_USD:10,   USD_CAD:7.33,
  EUR_GBP:12,  GBP_JPY:6.68, EUR_JPY:6.68,  USD_CHF:11,   NZD_USD:10,
  AUD_JPY:6.68,EUR_AUD:10,
  XAU_USD:1,   XAG_USD:5,
  SPX500_USD:1, NAS100_USD:1, UK100_GBP:1,
  DE30_EUR:1,   JP225_USD:1,  US30_USD:1
};

let chart = null;
let priceUpdateInterval = null;
let positionUpdateInterval = null;

// ══════════════════════════════════════════
// SETUP
// ══════════════════════════════════════════
function startSimulation() {
  state.apiKey    = document.getElementById('apiKey').value.trim();
  state.accountId = document.getElementById('accountId').value.trim();
  state.firm      = document.getElementById('firmSelect').value;
  state.accountSize  = parseInt(document.getElementById('accountSize').value);
  state.phase     = parseInt(document.getElementById('phaseSelect').value);
  const daysVal   = document.getElementById('daysSelect').value;
  state.totalDays = daysVal === 'unlimited' ? 9999 : parseInt(daysVal);

  state.balance   = state.accountSize;
  state.equity    = state.accountSize;
  state.peakEquity = state.accountSize;
  state.dailyStartBalance = state.accountSize;
  state.dailyPnl  = 0;
  state.totalPnl  = 0;
  state.bestDayPnl = 0;
  state.day       = 1;
  state.positions = [];
  state.priceHistory = [];
  state.tradeCount = 0;

  const firm = FIRMS[state.firm];
  const phase2 = state.phase === 2;
  state.rules = {
    profitTarget: state.accountSize * (phase2 ? firm.profitTarget * 0.5 : firm.profitTarget),
    dailyLossLimit: state.accountSize * firm.dailyLoss,
    maxDrawdownLimit: state.accountSize * firm.maxDrawdown,
    consistency: firm.consistency,
    consistencyLimit: firm.consistencyLimit
  };

  document.getElementById('setup-screen').style.display = 'none';
  document.getElementById('sim-screen').style.display = 'block';

  updateSessionInfo();
  initChart();
  initPrices();
  setTimeout(() => { initDrawing(); attachChartDrawingSync(); }, 500);
}

function updateSessionInfo() {
  const firm = FIRMS[state.firm];
  const size = state.accountSize >= 1000 ? '$' + (state.accountSize/1000) + 'K' : '$' + state.accountSize;
  document.getElementById('sessionInfo').textContent = \`\${firm.name} · \${size} · Phase \${state.phase}\`;
  document.getElementById('totalDays').textContent = state.totalDays === 9999 ? '∞' : state.totalDays;
  document.getElementById('dayCounter').textContent = state.day;
}

// ══════════════════════════════════════════
// OANDA API
// ══════════════════════════════════════════
function getProxyBase() {
  const origin = window.location.origin;
  if (!origin || origin === 'null' || origin.startsWith('file:')) return 'http://localhost:3000';
  return origin;
}

async function fetchOandaPrice(instrument) {
  if (!state.apiKey || !state.accountId) return null;
  try {
    const url = \`\${getProxyBase()}/api/pricing?apiKey=\${encodeURIComponent(state.apiKey)}&accountId=\${encodeURIComponent(state.accountId)}&instruments=\${instrument}\`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const price = data.prices?.[0];
    if (!price) return null;
    return {
      bid: parseFloat(price.bids[0].price),
      ask: parseFloat(price.asks[0].price)
    };
  } catch { return null; }
}

async function refreshPrice(instrument) {
  const live = await fetchOandaPrice(instrument);
  if (live) {
    state.connected = true;
    document.getElementById('connBanner').classList.remove('show');
    document.getElementById('liveDot').style.display = '';
    state.prices[instrument] = live;
  } else {
    if (!state.prices[instrument]) {
      const seed = SEED_PRICES[instrument];
      const spread = getSpread(instrument);
      const jitter = (Math.random() - 0.5) * PIP_SIZE[instrument] * 3;
      state.prices[instrument] = { bid: seed + jitter - spread/2, ask: seed + jitter + spread/2 };
    } else {
      const jitter = (Math.random() - 0.5) * PIP_SIZE[instrument] * 2;
      const spread = getSpread(instrument);
      const mid = (state.prices[instrument].bid + state.prices[instrument].ask) / 2 + jitter;
      state.prices[instrument] = { bid: mid - spread/2, ask: mid + spread/2 };
    }
    if (state.apiKey && !state.connected) {
      document.getElementById('connBanner').classList.add('show');
      document.getElementById('liveDot').style.display = 'none';
    }
  }
  if (instrument === state.currentPair) updatePriceDisplay();
}

async function initPrices() {
  const pairs = [
    'EUR_USD','GBP_USD','USD_JPY','AUD_USD','USD_CAD',
    'EUR_GBP','GBP_JPY','EUR_JPY','USD_CHF','NZD_USD','AUD_JPY','EUR_AUD',
    'XAU_USD','XAG_USD',
    'SPX500_USD','NAS100_USD','UK100_GBP','DE30_EUR','JP225_USD','US30_USD'
  ];
  for (const p of pairs) await refreshPrice(p);
  updatePriceDisplay();
  priceUpdateInterval = setInterval(async () => {
    await refreshPrice(state.currentPair);
    updateOpenPositionsPnl();
    updateRulesBar();
  }, state.connected ? 2000 : 1500);
}

function switchPair(pair, btn) {
  state.currentPair = pair;
  document.querySelectorAll('.pair-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  state.priceHistory = [];
  updatePriceDisplay();
  loadCandles();
}

// ══════════════════════════════════════════
// PRICE DISPLAY
// ══════════════════════════════════════════
function updatePriceDisplay() {
  const p = state.prices[state.currentPair];
  if (!p) return;
  const mid = (p.bid + p.ask) / 2;
  const dp = getDP(state.currentPair);
  document.getElementById('currentPrice').textContent = mid.toFixed(dp);
  document.getElementById('bidPrice').textContent = p.bid.toFixed(dp);
  document.getElementById('askPrice').textContent = p.ask.toFixed(dp);

  if (state.priceHistory.length === 0) {
    state.priceHistory.push(mid);
  } else {
    const prev = state.priceHistory[state.priceHistory.length - 1];
    const diff = mid - prev;
    const pips = diff / PIP_SIZE[state.currentPair];
    const el = document.getElementById('priceChange');
    const isIndex = ['SPX500_USD','NAS100_USD','UK100_GBP','DE30_EUR','JP225_USD','US30_USD'].includes(state.currentPair);
    const unitLabel = isIndex ? ' pts' : ' pips';
    el.textContent = (diff >= 0 ? '+' : '') + diff.toFixed(dp) + ' (' + (pips >= 0 ? '+' : '') + pips.toFixed(1) + unitLabel + ')';
    el.className = 'price-change ' + (diff >= 0 ? 'up' : 'down');
    state.priceHistory.push(mid);
    if (state.priceHistory.length > 120) state.priceHistory.shift();
    updateChart();
  }
}

// ══════════════════════════════════════════
// CHART
// ══════════════════════════════════════════
let candleSeries = null;
let volumeSeries = null;

function initChart() {
  const container = document.getElementById('priceChart');
  container.innerHTML = '';
  chart = LightweightCharts.createChart(container, {
    autoSize: true,
    layout: {
      background: { color: '#0a0f0d' },
      textColor:  '#4a6657',
    },
    grid: {
      vertLines: { color: 'rgba(255,255,255,0.04)' },
      horzLines: { color: 'rgba(255,255,255,0.04)' },
    },
    crosshair: {
      mode: LightweightCharts.CrosshairMode.Normal,
      vertLine: { color: '#1D9E75', labelBackgroundColor: '#085041' },
      horzLine: { color: '#1D9E75', labelBackgroundColor: '#085041' },
    },
    rightPriceScale: {
      borderColor: 'rgba(255,255,255,0.08)',
      textColor: '#4a6657',
    },
    timeScale: {
      borderColor: 'rgba(255,255,255,0.08)',
      textColor: '#4a6657',
      timeVisible: true,
      secondsVisible: false,
    },
    handleScroll: true,
    handleScale: true,
  });

  candleSeries = chart.addCandlestickSeries({
    upColor:          '#1D9E75',
    downColor:        '#E24B4A',
    borderUpColor:    '#1D9E75',
    borderDownColor:  '#E24B4A',
    wickUpColor:      '#1D9E75',
    wickDownColor:    '#E24B4A',
    priceFormat: {
      type: 'price',
      precision: getDP(state.currentPair),
      minMove: Math.pow(10, -getDP(state.currentPair)),
    },
  });

  volumeSeries = chart.addHistogramSeries({
    priceFormat: { type: 'volume' },
    priceScaleId: 'volume',
    color: '#1D9E75',
    scaleMargins: { top: 0.8, bottom: 0 },
  });
  chart.priceScale('volume').applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

  loadCandles();
}

async function loadCandles() {
  const pair = state.currentPair;
  const tf   = state.timeframe;
  const countMap = { M1:120, M5:120, M15:100, M30:100, H1:100, H4:100, D:100 };
  const count = countMap[tf] || 100;

  // Try live OANDA candles via proxy
  let candles = null;
  if (state.apiKey) {
    try {
      const url = \`\${getProxyBase()}/api/candles?apiKey=\${encodeURIComponent(state.apiKey)}&instrument=\${pair}&granularity=\${tf}&count=\${count}\`;
      const res  = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.candles && data.candles.length > 0) {
          candles = data.candles
            .filter(c => c.complete !== false || data.candles.indexOf(c) === data.candles.length - 1)
            .map(c => ({
              time:  Math.floor(new Date(c.time).getTime() / 1000),
              open:  parseFloat(c.mid.o),
              high:  parseFloat(c.mid.h),
              low:   parseFloat(c.mid.l),
              close: parseFloat(c.mid.c),
              volume: parseInt(c.volume || 100),
            }));
        }
      }
    } catch(e) {}
  }

  // Fallback: generate realistic synthetic candles
  if (!candles || candles.length === 0) {
    candles = generateSyntheticCandles(pair, tf, count);
  }

  if (candleSeries) {
    candleSeries.setData(candles);
    // Update price format for this pair
    candleSeries.applyOptions({
      priceFormat: {
        type: 'price',
        precision: getDP(pair),
        minMove: Math.pow(10, -getDP(pair)),
      }
    });
  }
  if (volumeSeries) {
    volumeSeries.setData(candles.map(c => ({
      time:  c.time,
      value: c.volume,
      color: c.close >= c.open ? 'rgba(29,158,117,0.4)' : 'rgba(226,75,74,0.3)',
    })));
  }
  if (chart) chart.timeScale().fitContent();

  // Store last candle for live tick updates
  state.lastCandle = candles[candles.length - 1];
  setTimeout(() => { redrawAll(); attachChartDrawingSync(); }, 100);
}

function generateSyntheticCandles(pair, tf, count) {
  const seed = SEED_PRICES[pair] || 1.0;
  const tfSeconds = { M1:60, M5:300, M15:900, M30:1800, H1:3600, H4:14400, D:86400 };
  const interval  = tfSeconds[tf] || 300;
  const volatility = {
    EUR_USD:0.0008, GBP_USD:0.001, USD_JPY:0.08, AUD_USD:0.0008, USD_CAD:0.0008,
    EUR_GBP:0.0006, GBP_JPY:0.12,  EUR_JPY:0.10, USD_CHF:0.0008, NZD_USD:0.0008,
    AUD_JPY:0.09,   EUR_AUD:0.001,
    XAU_USD:1.5,    XAG_USD:0.15,
    SPX500_USD:8,   NAS100_USD:30,  UK100_GBP:15,
    DE30_EUR:30,    JP225_USD:80,   US30_USD:60
  };
  const vol = volatility[pair] || 0.001;
  const now = Math.floor(Date.now() / 1000 / interval) * interval;
  let price = seed;
  const candles = [];
  for (let i = count; i >= 0; i--) {
    const t = now - i * interval;
    const open  = price;
    const move  = (Math.random() - 0.48) * vol * 2;
    const close = open + move;
    const high  = Math.max(open, close) + Math.random() * vol * 0.8;
    const low   = Math.min(open, close) - Math.random() * vol * 0.8;
    candles.push({ time: t, open, high, low, close, volume: Math.floor(Math.random() * 500 + 100) });
    price = close;
  }
  return candles;
}

function updateChart() {
  if (!candleSeries || !state.lastCandle) return;
  const p = state.prices[state.currentPair];
  if (!p) return;
  const mid = (p.bid + p.ask) / 2;
  const now = Math.floor(Date.now() / 1000);
  const tfSeconds = { M1:60, M5:300, M15:900, M30:1800, H1:3600, H4:14400, D:86400 };
  const interval  = tfSeconds[state.timeframe] || 300;
  const candleTime = Math.floor(now / interval) * interval;

  if (candleTime === state.lastCandle.time) {
    // Update current candle
    state.lastCandle.close = mid;
    state.lastCandle.high  = Math.max(state.lastCandle.high, mid);
    state.lastCandle.low   = Math.min(state.lastCandle.low,  mid);
  } else {
    // New candle
    state.lastCandle = {
      time: candleTime, open: mid, high: mid, low: mid, close: mid, volume: 1
    };
  }
  state.lastCandle.volume = (state.lastCandle.volume || 0) + 1;
  try {
    candleSeries.update(state.lastCandle);
    volumeSeries.update({
      time:  state.lastCandle.time,
      value: state.lastCandle.volume,
      color: state.lastCandle.close >= state.lastCandle.open ? 'rgba(29,158,117,0.4)' : 'rgba(226,75,74,0.3)',
    });
  } catch(e) {}
}

function switchTimeframe(tf, btn) {
  state.timeframe = tf;
  document.querySelectorAll('.tf-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadCandles();
}

// ══════════════════════════════════════════
// TRADING
// ══════════════════════════════════════════
function placeTrade(direction) {
  const p = state.prices[state.currentPair];
  if (!p) return;
  const lots = parseFloat(document.getElementById('lotSize').value) || 0.1;
  const entryPrice = direction === 'BUY' ? p.ask : p.bid;
  const dp = state.currentPair === 'USD_JPY' ? 3 : 5;

  state.tradeCount++;
  state.positions.push({
    id: state.tradeCount,
    pair: state.currentPair,
    direction,
    lots,
    entryPrice,
    openTime: new Date().toLocaleTimeString(),
    pnl: 0
  });
  renderPositions();
}

function closePosition(id) {
  const idx = state.positions.findIndex(p => p.id === id);
  if (idx === -1) return;
  const pos = state.positions[idx];
  const pnl = calcPnl(pos);

  state.balance += pnl;
  state.totalPnl += pnl;
  state.dailyPnl += pnl;

  if (pnl > state.bestDayPnl) state.bestDayPnl = pnl;
  if (state.equity > state.peakEquity) state.peakEquity = state.equity;

  state.positions.splice(idx, 1);
  renderPositions();
  updateRulesBar();
  checkRules();
}

function calcPnl(pos) {
  const p = state.prices[pos.pair];
  if (!p) return 0;
  const exitPrice = pos.direction === 'BUY' ? p.bid : p.ask;
  const priceDiff = pos.direction === 'BUY' ? exitPrice - pos.entryPrice : pos.entryPrice - exitPrice;
  const pips = priceDiff / PIP_SIZE[pos.pair];
  return pips * PIP_VALUE[pos.pair] * pos.lots * 100;
}

function updateOpenPositionsPnl() {
  let floatingPnl = 0;
  state.positions.forEach(pos => {
    pos.pnl = calcPnl(pos);
    floatingPnl += pos.pnl;
  });
  state.equity = state.balance + floatingPnl;
  if (state.equity > state.peakEquity) state.peakEquity = state.equity;
  renderPositions();
}

function renderPositions() {
  const el = document.getElementById('positionsList');
  if (state.positions.length === 0) {
    el.innerHTML = '<div class="empty-state">No open positions.<br>Place a trade to begin.</div>';
    return;
  }
  el.innerHTML = state.positions.map(pos => {
    const dp = getDP(pos.pair);
    const pnlClass = pos.pnl >= 0 ? 'profit' : 'loss';
    const pnlSign = pos.pnl >= 0 ? '+' : '';
    const dirTag = pos.direction === 'BUY'
      ? \`<span class="buy-tag">BUY</span>\`
      : \`<span class="sell-tag">SELL</span>\`;
    return \`<div class="position-row">
      <div class="pos-left">
        <div class="pos-pair">\${pos.pair.replace('_','/')}</div>
        <div class="pos-detail">\${dirTag} \${pos.lots} lots @ \${pos.entryPrice.toFixed(dp)}</div>
      </div>
      <div class="pos-right">
        <div class="pos-pnl \${pnlClass}">\${pnlSign}$\${pos.pnl.toFixed(2)}</div>
        <button class="pos-close" onclick="closePosition(\${pos.id})">Close</button>
      </div>
    </div>\`;
  }).join('');
}

// ══════════════════════════════════════════
// RULES ENGINE
// ══════════════════════════════════════════
function updateRulesBar() {
  const r = state.rules;
  const totalPnl = state.equity - state.accountSize;
  const dailyLoss = Math.max(0, state.dailyStartBalance - state.equity);
  const maxDd = state.peakEquity - state.equity;
  const pnlPct = totalPnl / state.accountSize;
  const dailyPct = dailyLoss / r.dailyLossLimit;
  const ddPct = maxDd / r.maxDrawdownLimit;
  const targetPnl = r.profitTarget;
  const progressPct = Math.max(0, Math.min(100, (pnlPct / targetPnl) * 100));

  // P&L
  const pnlEl = document.getElementById('rPnl');
  pnlEl.textContent = (totalPnl >= 0 ? '+' : '') + '$' + totalPnl.toFixed(2);
  pnlEl.className = 'rule-val ' + (totalPnl >= 0 ? 'green' : 'red');
  setBar('rPnlBar', progressPct, 'var(--green)');
  document.getElementById('rPnlSub').textContent = \`Target: $\${r.profitTarget.toFixed(0)} (\${(targetPnl/state.accountSize*100).toFixed(0)}%)\`;

  // Daily loss
  const dailyEl = document.getElementById('rDaily');
  dailyEl.textContent = '$' + dailyLoss.toFixed(2);
  const dailyColor = dailyPct > 0.8 ? 'var(--red)' : dailyPct > 0.6 ? 'var(--amber)' : 'var(--green)';
  dailyEl.className = 'rule-val ' + (dailyPct > 0.8 ? 'red' : dailyPct > 0.6 ? 'amber' : 'green');
  setBar('rDailyBar', dailyPct * 100, dailyColor);
  document.getElementById('rDailySub').textContent = \`Limit: $\${r.dailyLossLimit.toFixed(0)} (\${(r.dailyLossLimit/state.accountSize*100).toFixed(0)}%)\`;

  // Max drawdown
  const ddEl = document.getElementById('rDd');
  ddEl.textContent = '$' + maxDd.toFixed(2);
  const ddColor = ddPct > 0.8 ? 'var(--red)' : ddPct > 0.6 ? 'var(--amber)' : 'var(--green)';
  ddEl.className = 'rule-val ' + (ddPct > 0.8 ? 'red' : ddPct > 0.6 ? 'amber' : 'green');
  setBar('rDdBar', ddPct * 100, ddColor);
  document.getElementById('rDdSub').textContent = \`Limit: $\${r.maxDrawdownLimit.toFixed(0)} (\${(r.maxDrawdownLimit/state.accountSize*100).toFixed(0)}%)\`;

  // Consistency
  const consistEl = document.getElementById('rConsist');
  if (r.consistency) {
    const consistPct = r.profitTarget > 0 ? state.bestDayPnl / r.profitTarget : 0;
    const consistBreach = consistPct > r.consistencyLimit;
    consistEl.textContent = consistBreach ? 'Warning' : 'OK';
    consistEl.className = 'rule-val ' + (consistBreach ? 'amber' : 'green');
    setBar('rConsistBar', Math.min(100, consistPct * 100), consistBreach ? 'var(--amber)' : 'var(--green)');
    document.getElementById('rConsistSub').textContent = \`Best day: $\${state.bestDayPnl.toFixed(0)} of $\${(r.profitTarget*r.consistencyLimit).toFixed(0)} max\`;
  } else {
    consistEl.textContent = 'N/A';
    consistEl.className = 'rule-val green';
    setBar('rConsistBar', 0, 'var(--green)');
    document.getElementById('rConsistSub').textContent = \`No consistency rule\`;
  }

  // PassRate score
  const score = calcPassRate(dailyPct, ddPct, progressPct, r.consistency && state.bestDayPnl / r.profitTarget > r.consistencyLimit);
  const scoreEl = document.getElementById('rScore');
  scoreEl.textContent = score;
  scoreEl.className = 'rule-val ' + (score >= 70 ? 'green' : score >= 40 ? 'amber' : 'red');
  setBar('rScoreBar', score, score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)');
  document.getElementById('rScoreSub').textContent = score >= 80 ? 'On track to pass' : score >= 60 ? 'Caution — monitor rules' : 'High risk of failure';
}

function setBar(id, pct, color) {
  const el = document.getElementById(id);
  el.style.width = Math.min(100, Math.max(0, pct)) + '%';
  el.style.background = color;
}

function calcPassRate(dailyPct, ddPct, progressPct, consistWarn) {
  let score = 100;
  score -= dailyPct * 40;
  score -= ddPct * 35;
  if (consistWarn) score -= 15;
  if (progressPct < 20 && state.day > 15) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function checkRules() {
  const r = state.rules;
  const dailyLoss = Math.max(0, state.dailyStartBalance - state.equity);
  const maxDd = state.peakEquity - state.equity;
  const totalPnl = state.equity - state.accountSize;

  if (dailyLoss >= r.dailyLossLimit) {
    triggerBreach('Daily loss limit breached', \`You lost $\${dailyLoss.toFixed(2)} today, exceeding the $\${r.dailyLossLimit.toFixed(0)} daily limit. In a real challenge this ends your attempt immediately.\`, 'dailyLoss');
    return;
  }
  if (maxDd >= r.maxDrawdownLimit) {
    triggerBreach('Maximum drawdown breached', \`Your account has drawn down $\${maxDd.toFixed(2)} from its peak, exceeding the $\${r.maxDrawdownLimit.toFixed(0)} maximum drawdown limit.\`, 'maxDd');
    return;
  }
  if (totalPnl >= r.profitTarget) {
    triggerPass();
  }
}

function triggerBreach(title, msg, breachType) {
  clearInterval(priceUpdateInterval);
  const dailyPct = Math.max(0, state.dailyStartBalance - state.equity) / state.rules.dailyLossLimit;
  const ddPct = (state.peakEquity - state.equity) / state.rules.maxDrawdownLimit;
  const progressPct = Math.max(0, (state.equity - state.accountSize)) / state.rules.profitTarget * 100;
  const score = calcPassRate(dailyPct, ddPct, progressPct, false);

  document.getElementById('breachTitle').textContent = title;
  document.getElementById('breachMsg').textContent = msg;
  document.getElementById('breachScore').textContent = score;
  document.getElementById('breachRules').innerHTML = \`
    <div class="breach-rule-row"><span class="breach-rule-name">Daily loss limit</span><span class="breach-rule-status \${breachType==='dailyLoss'?'failed':'passed'}">\${breachType==='dailyLoss'?'BREACHED':'Passing'}</span></div>
    <div class="breach-rule-row"><span class="breach-rule-name">Max drawdown</span><span class="breach-rule-status \${breachType==='maxDd'?'failed':'passed'}">\${breachType==='maxDd'?'BREACHED':'Passing'}</span></div>
    <div class="breach-rule-row"><span class="breach-rule-name">Profit target</span><span class="breach-rule-status passed">Not yet reached</span></div>
    <div class="breach-rule-row"><span class="breach-rule-name">Consistency</span><span class="breach-rule-status passed">OK</span></div>
  \`;
  document.getElementById('breachAlert').classList.add('show');
}

function triggerPass() {
  clearInterval(priceUpdateInterval);
  const dailyPct = Math.max(0, state.dailyStartBalance - state.equity) / state.rules.dailyLossLimit;
  const ddPct = (state.peakEquity - state.equity) / state.rules.maxDrawdownLimit;
  const score = calcPassRate(dailyPct, ddPct, 100, false);
  document.getElementById('passScore').textContent = score;
  document.getElementById('passAlert').classList.add('show');
}

function retrySimulation() {
  document.getElementById('breachAlert').classList.remove('show');
  document.getElementById('passAlert').classList.remove('show');
  state.balance = state.accountSize;
  state.equity  = state.accountSize;
  state.peakEquity = state.accountSize;
  state.dailyStartBalance = state.accountSize;
  state.dailyPnl = 0;
  state.totalPnl = 0;
  state.bestDayPnl = 0;
  state.day = 1;
  state.positions = [];
  state.priceHistory = [];
  state.tradeCount = 0;
  updateSessionInfo();
  renderPositions();
  updateRulesBar();
  if (candleSeries) loadCandles();
  priceUpdateInterval = setInterval(async () => {
    await refreshPrice(state.currentPair);
    updateOpenPositionsPnl();
    updateRulesBar();
  }, state.connected ? 2000 : 1500);
}

function resetSimulation() {
  clearInterval(priceUpdateInterval);
  document.getElementById('sim-screen').style.display = 'none';
  document.getElementById('setup-screen').style.display = 'flex';
  document.getElementById('breachAlert').classList.remove('show');
  document.getElementById('passAlert').classList.remove('show');
}

// ════════════════════════════════════════════════════
// DRAWING ENGINE — Fibonacci, trendlines, text, shapes
// ════════════════════════════════════════════════════
const FIB_LEVELS     = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1.0];
const FIB_EXT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 1.0, 1.272, 1.414, 1.618, 2.0, 2.618];
const FIB_COLORS     = { '0':'#9FE1CB','0.236':'#5DCAA5','0.382':'#1D9E75','0.5':'#ffffff','0.618':'#1D9E75','0.786':'#5DCAA5','1':'#9FE1CB' };

let drawState = { tool:'cursor', drawings:[], drawing:false, start:null, current:null, pendingText:null };

function setTool(tool) {
  drawState.tool = tool;
  document.querySelectorAll('.draw-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('btn-' + tool);
  if (btn) btn.classList.add('active');
  const canvas = document.getElementById('drawCanvas');
  if (canvas) canvas.classList.toggle('drawing', tool !== 'cursor');
}

function getCanvas() { return document.getElementById('drawCanvas'); }
function getCtx()    { const c = getCanvas(); return c ? c.getContext('2d') : null; }

function syncCanvasSize() {
  const canvas = getCanvas();
  if (!canvas) return;
  const wrap = canvas.parentElement;
  if (!wrap) return;
  canvas.width  = wrap.clientWidth;
  canvas.height = wrap.clientHeight;
}

function pixelToChartCoord(px, py) {
  if (!chart || !candleSeries) return null;
  try {
    const price = candleSeries.coordinateToPrice(py);
    const time  = chart.timeScale().coordinateToTime(px);
    return { price, time };
  } catch(e) { return null; }
}

function refreshCoord(stored) {
  if (!stored) return null;
  if (stored.time && stored.price !== undefined && candleSeries) {
    try {
      const px = chart.timeScale().timeToCoordinate(stored.time);
      const py = candleSeries.priceToCoordinate(stored.price);
      if (px !== null && py !== null) return { px, py };
    } catch(e) {}
  }
  return { px: stored.px, py: stored.py };
}

function initDrawing() {
  const canvas = getCanvas();
  if (!canvas) return;
  syncCanvasSize();
  window.addEventListener('resize', () => { syncCanvasSize(); redrawAll(); });

  canvas.addEventListener('mousedown', e => {
    if (drawState.tool === 'cursor') return;
    const rect  = canvas.getBoundingClientRect();
    const px    = e.clientX - rect.left;
    const py    = e.clientY - rect.top;
    const coord = pixelToChartCoord(px, py);
    if (!coord) return;

    if (drawState.tool === 'text') {
      const input = document.getElementById('textInput');
      if (input) {
        input.style.display = 'block';
        input.style.left    = px + 'px';
        input.style.top     = (py - 16) + 'px';
        input.value = '';
        input.focus();
        drawState.pendingText = { px, py, price: coord.price, time: coord.time };
      }
      return;
    }
    drawState.drawing = true;
    drawState.start   = { px, py, price: coord.price, time: coord.time };
    drawState.current = { px, py, price: coord.price, time: coord.time };
  });

  canvas.addEventListener('mousemove', e => {
    if (!drawState.drawing) return;
    const rect  = canvas.getBoundingClientRect();
    const px    = e.clientX - rect.left;
    const py    = e.clientY - rect.top;
    const coord = pixelToChartCoord(px, py);
    if (!coord) return;
    drawState.current = { px, py, price: coord.price, time: coord.time };
    redrawAll();
    drawShape(getCtx(), { tool: drawState.tool, start: drawState.start, end: drawState.current, preview: true });
  });

  canvas.addEventListener('mouseup', () => {
    if (!drawState.drawing) return;
    drawState.drawing = false;
    if (!drawState.start || !drawState.current) return;
    const dx = Math.abs(drawState.current.px - drawState.start.px);
    const dy = Math.abs(drawState.current.py - drawState.start.py);
    if (dx < 3 && dy < 3) return;
    var drawing = { tool: drawState.tool, start: {...drawState.start}, end: {...drawState.current} };
    if (drawState.tool === 'long' || drawState.tool === 'short') {
      var lotEl = document.getElementById('lotSize');
      drawing.lots = lotEl ? parseFloat(lotEl.value) || 0.1 : 0.1;
      // SL = mirrored risk from entry
      var risk = Math.abs(drawing.end.price - drawing.start.price);
      drawing.sl = drawState.tool === 'long' ? drawing.start.price - risk : drawing.start.price + risk;
    }
    drawState.drawings.push(drawing);
    redrawAll();
    drawState.start   = null;
    drawState.current = null;
  });
}

function commitText(e) {
  if (e.key !== 'Enter' && e.key !== 'Escape') return;
  const input = document.getElementById('textInput');
  if (!input) return;
  if (e.key === 'Enter' && input.value.trim() && drawState.pendingText) {
    drawState.drawings.push({ tool:'text', start:{...drawState.pendingText}, end:{...drawState.pendingText}, label: input.value.trim() });
    redrawAll();
  }
  input.style.display = 'none';
  input.value = '';
  drawState.pendingText = null;
}

function undoDraw()     { drawState.drawings.pop(); redrawAll(); }
function clearDrawings(){ drawState.drawings = []; redrawAll(); }

function redrawAll() {
  const canvas = getCanvas();
  const ctx    = getCtx();
  if (!canvas || !ctx) return;
  syncCanvasSize();
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawState.drawings.forEach(d => drawShape(ctx, d));
}

function drawShape(ctx, d) {
  if (!ctx) return;
  const canvas = getCanvas();
  const s = refreshCoord(d.start);
  const e = d.end ? refreshCoord(d.end) : null;
  if (!s) return;

  ctx.save();
  ctx.lineWidth   = 1.5;
  ctx.strokeStyle = '#1D9E75';
  ctx.fillStyle   = 'rgba(29,158,117,0.08)';
  ctx.font        = '11px "JetBrains Mono", monospace';
  ctx.setLineDash([]);

  switch (d.tool) {
    case 'trendline':
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(e ? e.px : s.px, e ? e.py : s.py);
      ctx.stroke();
      break;

    case 'ray':
      if (!e) break;
      var dx = e.px - s.px, dy = e.py - s.py, len = Math.sqrt(dx*dx+dy*dy);
      if (len < 1) break;
      ctx.beginPath();
      ctx.moveTo(s.px, s.py);
      ctx.lineTo(s.px + dx/len*5000, s.py + dy/len*5000);
      ctx.stroke();
      ctx.beginPath(); ctx.arc(s.px, s.py, 3, 0, Math.PI*2);
      ctx.fillStyle = '#1D9E75'; ctx.fill();
      break;

    case 'hline':
      ctx.setLineDash([4,3]);
      ctx.strokeStyle = 'rgba(159,225,203,0.7)';
      ctx.beginPath(); ctx.moveTo(0, s.py); ctx.lineTo(canvas.width, s.py); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#085041';
      ctx.fillRect(canvas.width - 72, s.py - 9, 70, 18);
      ctx.fillStyle = '#9FE1CB'; ctx.textAlign = 'right';
      if (d.start.price !== undefined) ctx.fillText(d.start.price.toFixed(getDP(state.currentPair)), canvas.width - 4, s.py + 4);
      break;

    case 'vline':
      ctx.setLineDash([4,3]); ctx.strokeStyle = 'rgba(159,225,203,0.5)';
      ctx.beginPath(); ctx.moveTo(s.px, 0); ctx.lineTo(s.px, canvas.height); ctx.stroke();
      break;

    case 'rect':
      if (!e) break;
      var x = Math.min(s.px,e.px), y = Math.min(s.py,e.py), w = Math.abs(e.px-s.px), h = Math.abs(e.py-s.py);
      ctx.fillStyle   = e.py < s.py ? 'rgba(29,158,117,0.07)' : 'rgba(226,75,74,0.07)';
      ctx.strokeStyle = e.py < s.py ? '#1D9E75' : '#E24B4A';
      ctx.fillRect(x,y,w,h); ctx.strokeRect(x,y,w,h);
      break;

    case 'text':
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = '#f0f4f2'; ctx.textAlign = 'left';
      ctx.fillText(d.label || '', s.px, s.py);
      break;

    case 'long':
    case 'short':
      if (!e) break;
      var isLong   = d.tool === 'long';
      var entryP   = d.start.price;
      var tpP      = d.end.price;
      var riskPips = Math.abs(tpP - entryP);
      var slP      = isLong ? entryP - riskPips : entryP + riskPips;

      // override SL if stored
      if (d.sl !== undefined) slP = d.sl;

      var entryPy = candleSeries ? candleSeries.priceToCoordinate(entryP) : null;
      var tpPy    = candleSeries ? candleSeries.priceToCoordinate(tpP)    : null;
      var slPy    = candleSeries ? candleSeries.priceToCoordinate(slP)    : null;
      if (entryPy === null || tpPy === null || slPy === null) break;

      var x1 = Math.min(s.px, e.px);
      var x2 = Math.max(s.px, e.px);
      var w  = Math.max(x2 - x1, 80);

      // TP zone (profit)
      var tpTop  = Math.min(entryPy, tpPy);
      var tpBot  = Math.max(entryPy, tpPy);
      ctx.fillStyle = 'rgba(29,158,117,0.12)';
      ctx.fillRect(x1, tpTop, w, tpBot - tpTop);

      // SL zone (loss)
      var slTop = Math.min(entryPy, slPy);
      var slBot = Math.max(entryPy, slPy);
      ctx.fillStyle = 'rgba(226,75,74,0.12)';
      ctx.fillRect(x1, slTop, w, slBot - slTop);

      // Entry line
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([]);
      ctx.beginPath(); ctx.moveTo(x1, entryPy); ctx.lineTo(x1 + w, entryPy); ctx.stroke();

      // TP line
      ctx.strokeStyle = '#1D9E75';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([3,2]);
      ctx.beginPath(); ctx.moveTo(x1, tpPy); ctx.lineTo(x1 + w, tpPy); ctx.stroke();

      // SL line
      ctx.strokeStyle = '#E24B4A';
      ctx.lineWidth   = 1.5;
      ctx.setLineDash([3,2]);
      ctx.beginPath(); ctx.moveTo(x1, slPy); ctx.lineTo(x1 + w, slPy); ctx.stroke();
      ctx.setLineDash([]);

      // Direction arrow on entry line
      ctx.strokeStyle = isLong ? '#1D9E75' : '#E24B4A';
      ctx.fillStyle   = isLong ? '#1D9E75' : '#E24B4A';
      ctx.lineWidth   = 2;
      var arrowX = x1 + 12;
      var arrowDir = isLong ? -6 : 6;
      ctx.beginPath();
      ctx.moveTo(arrowX, entryPy);
      ctx.lineTo(arrowX, entryPy + arrowDir * 2.5);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(arrowX - 5, entryPy + arrowDir);
      ctx.lineTo(arrowX, entryPy + (isLong ? -1 : 1));
      ctx.lineTo(arrowX + 5, entryPy + arrowDir);
      ctx.fill();

      // Labels
      ctx.font = 'bold 11px "JetBrains Mono", monospace';
      var dp   = getDP(state.currentPair);
      var lots = d.lots || 0.1;

      // TP label
      var tpRisk  = Math.abs(tpP - entryP);
      var tpPnl   = (tpRisk / PIP_SIZE[state.currentPair]) * PIP_VALUE[state.currentPair] * lots * 100;
      ctx.fillStyle = '#1D9E75';
      ctx.textAlign = 'left';
      ctx.fillRect(x1 + w - 110, tpPy - 18, 108, 16);
      ctx.fillStyle = 'white';
      ctx.fillText('TP ' + tpP.toFixed(dp) + '  +$' + tpPnl.toFixed(0), x1 + w - 108, tpPy - 5);

      // SL label
      var slRisk  = Math.abs(slP - entryP);
      var slPnl   = (slRisk / PIP_SIZE[state.currentPair]) * PIP_VALUE[state.currentPair] * lots * 100;
      ctx.fillStyle = '#E24B4A';
      ctx.fillRect(x1 + w - 110, slPy + 2, 108, 16);
      ctx.fillStyle = 'white';
      ctx.fillText('SL ' + slP.toFixed(dp) + '  -$' + slPnl.toFixed(0), x1 + w - 108, slPy + 14);

      // Entry label
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(x1 + w - 110, entryPy - 9, 108, 16);
      ctx.fillStyle = '#f0f4f2';
      var rrRatio = tpRisk > 0 ? (tpRisk / slRisk).toFixed(1) : '—';
      ctx.fillText((isLong ? 'LONG' : 'SHORT') + ' ' + entryP.toFixed(dp) + '  RR:' + rrRatio, x1 + w - 108, entryPy + 4);
      break;

    case 'fib':
    case 'fibext':
      if (!e) break;
      var levels  = d.tool === 'fib' ? FIB_LEVELS : FIB_EXT_LEVELS;
      var highP   = d.start.price > d.end.price ? d.start.price : d.end.price;
      var lowP    = d.start.price < d.end.price ? d.start.price : d.end.price;
      var totalP  = highP - lowP;
      var x1      = Math.min(s.px, e.px);

      levels.forEach(function(lvl) {
        var price  = d.tool === 'fib' ? highP - totalP * lvl : highP + totalP * lvl;
        var py     = candleSeries ? candleSeries.priceToCoordinate(price) : null;
        if (py === null || py === undefined) return;
        var colKey = String(lvl);
        var col    = FIB_COLORS[colKey] || '#5DCAA5';
        ctx.strokeStyle = col;
        ctx.lineWidth   = (lvl === 0.618 || lvl === 0 || lvl === 1) ? 1.8 : 1;
        ctx.setLineDash(lvl === 0.5 ? [4,3] : []);
        ctx.beginPath(); ctx.moveTo(x1, py); ctx.lineTo(canvas.width, py); ctx.stroke();
        ctx.setLineDash([]);
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = col; ctx.textAlign = 'left';
        ctx.fillText((lvl*100).toFixed(1) + '%  ' + price.toFixed(getDP(state.currentPair)), x1 + 4, py - 3);
      });

      ctx.strokeStyle = 'rgba(159,225,203,0.25)';
      ctx.lineWidth = 1; ctx.setLineDash([2,4]);
      ctx.beginPath(); ctx.moveTo(x1, s.py); ctx.lineTo(x1, e.py); ctx.stroke();
      break;
  }
  ctx.restore();
}

function attachChartDrawingSync() {
  if (!chart) return;
  chart.timeScale().subscribeVisibleTimeRangeChange(function() { redrawAll(); });
}

</script>
</body>
</html>
`;

app.get('*', (_, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(SIMULATOR_HTML);
});

app.listen(PORT, () => console.log(`PassRate proxy running on port ${PORT}`));
