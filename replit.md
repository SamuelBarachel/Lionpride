# Lionpride — Goat Management System

**by Samuel Barachel Takwirira & Aristarchus Chirefu**

Elite mobile-first PWA for managing a goat farming operation — herd tracking, buying/selling, health records, feed logs, reports, and AI-powered farming advice.

## Stack

- **Frontend**: React 18 + Vite + TailwindCSS (mobile-first PWA, bottom navigation)
- **Backend**: Node.js + Express
- **Database**: PostgreSQL (via `pg`)
- **AI**: GROQ API (Llama 3 via `groq-sdk`)
- **Auth**: JWT (30-day tokens)
- **Deployment**: Render (render.yaml included)

## Project Structure

```
lionpride/
├── client/          # React PWA frontend
│   ├── src/
│   │   ├── pages/   # Dashboard, Herd, GoatDetail, Transactions, Health, Feed, Reports, AIChat
│   │   ├── components/ # Layout, BottomNav, TopBar, GoatCard, Modal, StatCard
│   │   ├── contexts/   # AuthContext
│   │   └── lib/     # api.js (axios), utils.js
├── server/          # Express API server
│   └── src/
│       ├── routes/  # auth, goats, transactions, health, feed, ai, dashboard
│       ├── middleware/ # auth (JWT)
│       └── db.js    # PostgreSQL pool + schema init
├── render.yaml      # Render deployment config
└── package.json     # Root scripts
```

## Development

```bash
# Install all dependencies
npm run install:all

# Run both dev servers (server on :3001, client on :5173)
npm run dev
```

The Vite dev server proxies `/api/*` to `http://localhost:3001`.

## Environment Variables

Copy `.env.example` to `.env` in the `server/` directory:

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret for signing JWTs |
| `SESSION_SECRET` | Session secret |
| `GROQ_API_KEY` | Groq API key for LionAI |
| `PORT` | Server port (default 3001) |

## Deployment on Render

1. Connect GitHub repo to Render
2. Render auto-detects `render.yaml`
3. Sets up PostgreSQL database automatically
4. Add `GROQ_API_KEY` manually in Render environment settings
5. Deploy — build command: `npm run build && cd server && npm install`
6. Start command: `npm start`

## Features

- 🐐 **Herd Management** — add/edit/delete goats, filter by status/gender/breed
- 💰 **Transactions** — log buys/sells, auto-update goat status on sale
- 🏥 **Health Records** — vaccinations, deworming, treatments with reminders
- 🌾 **Feed Logs** — track feed types, quantities, costs
- 📊 **Reports** — charts, KPIs, ROI, monthly P&L
- 🤖 **LionAI** — GROQ-powered chat assistant + instant insights
- 🔐 **Auth** — JWT-based, register/login, private system

## User Preferences

- Deploy target: Render only (no Expo Go, no Replit services)
- Private project — no public registration beyond owner accounts
- Elite UI standard required at all times
- GROQ_API_KEY must be set as environment variable on Render
