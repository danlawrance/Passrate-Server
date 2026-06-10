# PassRate — Server

OANDA proxy server + simulator. Deploy once to Render — users just visit your URL.

---

## Deploy to Render (free, ~10 minutes)

### Step 1 — Put this on GitHub

1. Go to **github.com** and sign in (or create a free account)
2. Click the **+** icon → **New repository**
3. Name it `passrate-server`, keep it **Private**, click **Create repository**
4. On the next screen click **uploading an existing file**
5. Unzip the passrate-server folder you downloaded
6. Drag **all the files and folders** into the GitHub upload area — including the `public` folder
7. Click **Commit changes**

Your repo should look like this:
```
passrate-server/
├── server.js
├── package.json
├── render.yaml
├── railway.json
├── .gitignore
├── README.md
└── public/
    └── index.html
```

---

### Step 2 — Deploy on Render

1. Go to **render.com** and sign up (use your GitHub account — easiest)
2. Click **New +** → **Web Service**
3. Click **Connect a repository** → select `passrate-server`
4. Render reads the `render.yaml` file and fills everything in automatically:
   - **Environment**: Node
   - **Build command**: `npm install`
   - **Start command**: `node server.js`
   - **Plan**: Free
5. Click **Create Web Service**
6. Wait ~2 minutes for the build to finish (you'll see logs)
7. Your URL appears at the top — something like:
   `https://passrate-server.onrender.com`

---

### Step 3 — Point your domain at it (optional)

If you have `passrate.io`:
1. In Render → your service → **Settings** → **Custom Domains**
2. Add `app.passrate.io`
3. In your domain registrar (Namecheap etc.) add a CNAME record:
   - Name: `app`
   - Value: `passrate-server.onrender.com`
4. Takes ~10 minutes to go live

---

### Step 4 — Share with waitlist users

Send them the URL. That's it. They open it in any browser, enter their OANDA API key and account ID, and the simulator connects to live prices with no setup on their end.

---

## Important: Render free tier spin-down

Render's free tier spins the server down after 15 minutes of inactivity. The first person to visit after a quiet period will see a ~30 second delay while it wakes up.

**To fix this for free**: use **UptimeRobot** (free at uptimerobot.com) to ping your `/health` endpoint every 10 minutes. This keeps the server awake 24/7.

1. Sign up at uptimerobot.com
2. **Add New Monitor** → HTTP(s)
3. URL: `https://passrate-server.onrender.com/health`
4. Monitoring interval: **5 minutes**
5. Done — server stays awake permanently

---

## How to find your OANDA Account ID

1. Log in at **fxpractice.oanda.com**
2. Look at the top-left account selector — your account number is shown there
3. It looks like: **101-004-12345678-001**
4. Generate your API token: **My Account → Manage API Access → Generate**

---

## Running locally

```bash
npm install
node server.js
# Open http://localhost:3000
```

---

## Proxy endpoints

| Endpoint | What it does |
|---|---|
| `GET /api/pricing` | Live bid/ask for any instrument |
| `GET /api/candles` | Historical OHLC candle data |
| `GET /api/account` | OANDA account summary |
| `GET /health` | Health check (used by UptimeRobot) |

