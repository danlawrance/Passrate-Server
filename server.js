const express = require('express');
const cors    = require('cors');
const fetch   = require('node-fetch');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

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

// ── Proxy: GET candles (historical data)
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

// ── Serve simulator for any other route
app.get('*', (_, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => console.log(`PassRate proxy running on port ${PORT}`));
