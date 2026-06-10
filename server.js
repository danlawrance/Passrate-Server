const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const OANDA_BASE = 'https://api-fxpractice.oanda.com';

// ── Proxy: GET pricing
app.get('/api/pricing', async (req, res) => {
  const { apiKey, accountId, instruments } = req.query;
  if (!apiKey || !accountId || !instruments) {
    return res.status(400).json({ error: 'Missing apiKey, accountId or instruments' });
  }
  try {
    const url = `${OANDA_BASE}/v3/accounts/${accountId}/pricing?instruments=${instruments}`;
    const oandaRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    const data = await oandaRes.json();
    if (!oandaRes.ok) return res.status(oandaRes.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OANDA unreachable', detail: err.message });
  }
});

// ── Proxy: GET candles
app.get('/api/candles', async (req, res) => {
  const { apiKey, instrument, granularity, count } = req.query;
  if (!apiKey || !instrument) {
    return res.status(400).json({ error: 'Missing apiKey or instrument' });
  }
  try {
    const gran  = granularity || 'M5';
    const cnt   = count || 100;
    const url   = `${OANDA_BASE}/v3/instruments/${instrument}/candles?granularity=${gran}&count=${cnt}`;
    const oandaRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    const data = await oandaRes.json();
    if (!oandaRes.ok) return res.status(oandaRes.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OANDA unreachable', detail: err.message });
  }
});

// ── Proxy: GET account summary
app.get('/api/account', async (req, res) => {
  const { apiKey, accountId } = req.query;
  if (!apiKey || !accountId) {
    return res.status(400).json({ error: 'Missing apiKey or accountId' });
  }
  try {
    const url = `${OANDA_BASE}/v3/accounts/${accountId}/summary`;
    const oandaRes = await fetch(url, {
      headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' }
    });
    const data = await oandaRes.json();
    if (!oandaRes.ok) return res.status(oandaRes.status).json(data);
    res.json(data);
  } catch (err) {
    res.status(502).json({ error: 'OANDA unreachable', detail: err.message });
  }
});

// ── Health check
app.get('/health', (_, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// ── Serve simulator — embedded directly, no public folder needed
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
  padding: 16px 20px;
  overflow: hidden;
  position: relative;
}

canvas#priceChart { width: 100% !important; height: 100% !important; }

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
        <div class="price-display">
          <div class="current-price" id="currentPrice">—</div>
          <div class="price-change" id="priceChange"></div>
        </div>
      </div>
      <div class="chart-area">
        <canvas id="priceChart"></canvas>
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

<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.umd.min.js"></script>
<script>
// ══════════════════════════════════════════
// STATE
// ══════════════════════════════════════════
let state = {
  apiKey: '', accountId: '', firm: 'ftmo',
  accountSize: 100000, phase: 1, totalDays: 30,
  currentPair: 'EUR_USD',
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
  tradeCount: 0
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
  updateChart();
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
function initChart() {
  const ctx = document.getElementById('priceChart').getContext('2d');
  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        data: [],
        borderColor: '#1D9E75',
        borderWidth: 1.5,
        pointRadius: 0,
        tension: 0.3,
        fill: { target: 'origin', above: 'rgba(29,158,117,0.04)', below: 'rgba(226,75,74,0.04)' }
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 200 },
      interaction: { mode: 'index', intersect: false },
      plugins: { legend: { display: false }, tooltip: {
        backgroundColor: '#172118',
        borderColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        titleColor: '#6b8a7a',
        bodyColor: '#f0f4f2',
        callbacks: {
          label: ctx => {
            const dp = state.currentPair === 'USD_JPY' ? 3 : 5;
            return ctx.parsed.y.toFixed(dp);
          }
        }
      }},
      scales: {
        x: { display: false },
        y: {
          position: 'right',
          grid: { color: 'rgba(255,255,255,0.04)' },
          ticks: {
            color: '#4a6657', font: { family: "'JetBrains Mono'" , size: 11 },
            callback: v => v.toFixed(getDP(state.currentPair))
          }
        }
      }
    }
  });
}

function updateChart() {
  if (!chart) return;
  chart.data.labels = state.priceHistory.map((_, i) => i);
  chart.data.datasets[0].data = state.priceHistory;
  chart.update('none');
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
</script>
</body>
</html>
`;

app.get('*', (_, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(SIMULATOR_HTML);
});

app.listen(PORT, () => console.log(`PassRate proxy running on port ${PORT}`));
