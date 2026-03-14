# SentinelBank
A real-time bank transaction simulator with live fraud detection and monitoring (desktop dashboard + mobile banking UI).

## What is SentinelBank

SentinelBank is a demo system that simulates bank transfers and runs a **rule-based fraud detection engine** on every transaction. It’s designed for showcasing real-time risk scoring: transactions are classified as **Safe (green)**, **Suspicious (orange)**, or **Fraud (red)**, and the UI updates instantly as new events arrive.

At a high level, a FastAPI backend stores transactions in a SQLite database, applies fraud rules (including a **NetworkX graph-based** circular-transaction check), and broadcasts events to connected clients over WebSockets. A background “engine” can continuously generate transactions, and a fraud injector can push hard-coded scenarios to test detection behavior.

There are two user interfaces:
- **Desktop Dashboard (`/`)**: used by a monitoring operator to view live transactions, fraud alerts, system stats, engine state, and to inject demo fraud scenarios.
- **Mobile Bank App (`/mobile`)**: used by “account holders” to select one of the seeded demo accounts and send transfers, while receiving real-time incoming-payment notifications.

---

## Project Structure

```text
SentinelBank/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── app/
│       ├── api/
│       ├── core/
│       ├── db/
│       ├── schemas/
│       └── websocket/
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── api/
        ├── components/
        ├── hooks/
        ├── pages/
        └── store/
```

**Folder responsibilities (one line each):**
- `backend/`: FastAPI server, dependencies, and app entrypoint.
- `backend/app/api/`: REST endpoints (accounts, transactions, stats, engine control, injector).
- `backend/app/core/`: transaction engine, fraud detection rules, and fraud injector logic.
- `backend/app/db/`: SQLAlchemy models, SQLite session setup, and account seeding.
- `backend/app/schemas/`: Pydantic response/request schemas.
- `backend/app/websocket/`: WebSocket connection manager + broadcast helper.
- `frontend/`: React + Vite app for dashboard and mobile UI.
- `frontend/src/api/`: Axios API client wrappers for backend calls.
- `frontend/src/components/`: Dashboard and mobile UI components.
- `frontend/src/hooks/`: WebSocket hook for real-time updates.
- `frontend/src/pages/`: Route-level pages (`/` dashboard, `/mobile` mobile banking).
- `frontend/src/store/`: Zustand global store (transactions, alerts, stats, engine status, accounts).

---

## Tech Stack

### Backend (Python / FastAPI)

Dependencies are from `backend/requirements.txt`:

- **fastapi** — API server and WebSocket endpoint.
- **uvicorn[standard]** — ASGI server to run FastAPI.
- **sqlalchemy** — ORM for SQLite persistence.
- **networkx** — graph analysis for circular-transaction detection.
- **faker** — generates seeded account holder names (A–T).
- **numpy**, **scikit-learn** — installed dependencies (not referenced in the core backend code paths shown here).
- **pytest**, **pytest-asyncio**, **httpx** — testing dependencies (no `backend/tests/` directory found in this repo snapshot).
- **websockets** — installed dependency (FastAPI uses its own WebSocket handling; this may be unused directly).

### Frontend (React / Vite)

Dependencies are from `frontend/package.json`:

- **react**, **react-dom** — UI rendering.
- **react-router-dom** — routing for `/` and `/mobile`.
- **axios** — HTTP client for backend endpoints.
- **zustand** — global state store (transactions, alerts, stats, engine status, accounts).
- **lucide-react** — icons.

Dev dependencies:
- **vite** + **@vitejs/plugin-react** — dev server and build tooling.
- **tailwindcss**, **postcss**, **autoprefixer** — styling pipeline.

---

## Fraud Detection Rules

Fraud scoring is implemented in `backend/app/core/fraud.py` via `detect_fraud(sender_id, receiver_id, amount, db)`.

> Note: The implementation currently contains **more than three** rules (HIGH_VALUE, HIGH_FREQUENCY_BURST, ROUND_AMOUNT, CIRCULAR_TRANSACTION). The section below describes the fraud rules that are actually present in `fraud.py`.

### Rule: HIGH_VALUE_TRANSFER
- **Trigger:** `amount > 80000`
- **Score:** `0.75`
- **Color:** `red` (because score ≥ 0.7)
- **Reason string:** `"HIGH_VALUE_TRANSFER"`

### Rule: CIRCULAR_TRANSACTION
- **Trigger:** A directed path exists from `receiver_id` back to `sender_id` in a graph built from **all transactions in the last 60 seconds**, and the **shortest path length ≤ 3**.
- **Score:** `0.90`
- **Color:** `red`
- **Reason string:** `"CIRCULAR_TRANSACTION"`
- **Graph detail:** Uses `networkx.DiGraph()` and `nx.has_path()` / `nx.shortest_path_length()` over recent edges.

### CHAIN_LAYERING (not implemented in `fraud.py`)
The repository contains an injector scenario named **"LAYERING"** (`backend/app/core/injector.py` scenario 3), but there is **no corresponding CHAIN_LAYERING rule** implemented in `backend/app/core/fraud.py`. For accuracy, this README does not claim a CHAIN_LAYERING rule exists in the rule engine.

### Scoring → Color mapping

This mapping is implemented at the end of `detect_fraud()`:

| Score Range | Color  | Label      |
|------------|--------|------------|
| 0.00 – 0.39 | Green  | Safe       |
| 0.40 – 0.69 | Orange | Suspicious |
| 0.70 – 1.00 | Red    | Fraud      |

The engine uses the **maximum** score of all triggered rules as the final risk score.

---

## Architecture

```text
Mobile App (phone browser)
     │ POST /transaction
     ▼
FastAPI Backend
     │
     ├── Fraud Detection Engine (backend/app/core/fraud.py)
     │        │
     │        └── NetworkX graph analysis (circular path check)
     │
     ├── SQLite DB (SQLAlchemy models: Account, Transaction, FraudAlert)
     │
     └── WebSocket Broadcaster (/ws)
              │
              ├── Desktop Dashboard (live transactions + fraud alerts)
              └── Mobile App (incoming payment notification)
```

---

## API Endpoints

The backend exposes these routes (see `backend/app/api/*.py` and `backend/main.py`):

| Method | Endpoint            | Description |
|--------|---------------------|-------------|
| GET    | `/accounts`         | Get all seeded accounts (A–T). |
| GET    | `/transactions`     | Get last 100 transactions (newest first). |
| GET    | `/fraud-alerts`     | Get last 50 fraud alerts (newest first). |
| GET    | `/stats`            | Aggregated stats across all stored transactions. |
| POST   | `/transaction`      | Submit a new transaction (runs fraud detection + broadcasts). |
| POST   | `/engine/start`     | Start the background transaction engine (thread). |
| POST   | `/engine/stop`      | Stop the transaction engine. |
| POST   | `/engine/pause`     | Pause the transaction engine. |
| POST   | `/engine/resume`    | Resume engine (starts thread if needed). |
| GET    | `/engine/status`    | Get engine status (`running/paused/stopped`, rate, count). |
| POST   | `/inject/{n}`       | Inject scenario `n` (1–5) via background thread. |
| WS     | `/ws`               | WebSocket connection for live events. |

### Transaction POST body

`POST /transaction` expects:

```json
{
  "sender_id": "A",
  "receiver_id": "B",
  "amount": 5000
}
```

---

## WebSocket Events

WebSocket messages are JSON with shape:

```json
{ "type": "<message_type>", "data": { /* payload */ } }
```

The frontend WebSocket handler (`frontend/src/hooks/useWebSocket.js`) recognizes:

### 1) `transaction`

```json
{
  "type": "transaction",
  "data": {
    "transaction_id": "a1b2c3d4",
    "sender_id": "A",
    "receiver_id": "B",
    "amount": 5000,
    "timestamp": "2026-03-14T12:34:56.789012+00:00",
    "is_fraud": 0,
    "risk_score": 0.0,
    "color": "green",
    "fraud_reason": null
  }
}
```

### 2) `fraud_alert`

```json
{
  "type": "fraud_alert",
  "data": {
    "alert_id": "e5f6g7h8",
    "transaction_id": "a1b2c3d4",
    "reason": "HIGH_VALUE_TRANSFER",
    "risk_score": 0.75,
    "pattern_type": "HIGH_VALUE_TRANSFER",
    "timestamp": "2026-03-14T12:34:56.789012+00:00"
  }
}
```

### 3) `engine_status`

```json
{
  "type": "engine_status",
  "data": {
    "status": "running",
    "rate": 60,
    "count": 42
  }
}
```

---

## Getting Started

### Prerequisites
- **Python 3.11+**
- **Node.js 18+**
- **Git**

### Installation & Run

#### Step 1 — Clone

```bash
git clone https://github.com/sangsaist/SentinelBank.git
cd SentinelBank
git checkout dev
```

#### Step 2 — Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Backend notes:
- Database file: `backend/fraud_demo.db` (SQLite)
- CORS is configured as `allow_origins=["*"]` in `backend/main.py`.

#### Step 3 — Frontend

```bash
cd frontend
npm install
npm run dev
```

`npm run dev` uses `vite --host`, which allows other devices on the same network to reach the dev server.

#### Step 4 — Find local IP and set frontend env

This repo does not include `.env.example`, but the frontend code expects these variables:

- `VITE_API_URL` (HTTP base URL, e.g. `http://YOUR_IP:8000`)
- `VITE_WS_URL` (WebSocket URL, e.g. `ws://YOUR_IP:8000/ws`)

Find your LAN IP:

```bash
# macOS / Linux
ifconfig | grep inet

# Windows
ipconfig
```

Create `frontend/.env`:

```env
VITE_API_URL=http://YOUR_IP:8000
VITE_WS_URL=ws://YOUR_IP:8000/ws
```

> For mobile testing, `YOUR_IP` must be your laptop/desktop LAN IP (not `localhost`).

### Access

- **Desktop Dashboard:** `http://localhost:5173`
- **Mobile Bank App:** `http://YOUR_IP:5173/mobile`

---

## Demo Script

1. Open the dashboard on your laptop at `http://localhost:5173`
2. Have all team members open `http://YOUR_IP:5173/mobile` on phones (same Wi‑Fi)
3. Each member selects a demo account (for example A, B, C, D)
4. Start the engine on the dashboard (▶️) to generate live traffic
5. On mobile (Account **A**), send **₹95,000** to **B**  
   → Dashboard shows a **RED** alert (reason: `HIGH_VALUE_TRANSFER`)  
   → A sees **Blocked** on the result screen
6. On mobile (Account **A**), send **₹500** to **B**  
   → Dashboard shows **GREEN** (safe)  
   → B receives a **💰 Money Received** notification banner
7. Demonstrate a circular pattern using the injector (dashboard Fraud Queue Builder or `POST /inject/4`)  
   → Circular transaction(s) may be flagged **RED** as `CIRCULAR_TRANSACTION`

---

## Fraud Injection Scenarios

Hard-coded injector scenarios are defined in `backend/app/core/injector.py`:

| # | Name (as coded)        | Pattern | Example Accounts / Amounts | Expected behavior (based on `fraud.py`) |
|---|-------------------------|---------|-----------------------------|------------------------------------------|
| 1 | `HIGH_VALUE_TRANSFER`   | Single large txn | A→B ₹95,000 | **RED** (`HIGH_VALUE_TRANSFER`) |
| 2 | `SMURFING`              | Multiple small txns | C→D/E/F/G/H/I/J ~₹8.6k–₹9.3k | Not a dedicated rule in `fraud.py` (may remain green unless another rule triggers) |
| 3 | `LAYERING`              | Chain transfer | K→L→M→N→O ₹50,000 each | No dedicated layering rule in `fraud.py` |
| 4 | `CIRCULAR`              | A→B→C→A | A→B ₹30,000, B→C ₹30,000, C→A ₹30,000 | May trigger **RED** (`CIRCULAR_TRANSACTION`) depending on recent graph edges |
| 5 | `RAPID_BURST`            | 10 fast txns from D | D→E..N ₹5,000 | **ORANGE/RED** possible via `HIGH_FREQUENCY_BURST` (threshold is >4 in 15 seconds with amount >1000) |

---

## Running Tests

`pytest` is included in `backend/requirements.txt`, but no `backend/tests/` directory was found in this repository snapshot.

If you add tests later, you can run:

```bash
cd backend
pytest -v
```

---

## Environment Variables

Frontend (Vite):
- `VITE_API_URL` — backend HTTP base URL (required; used by `frontend/src/api/api.js`)
- `VITE_WS_URL` — backend WebSocket URL (required; used by `frontend/src/hooks/useWebSocket.js`)

Backend:
- No environment variables are required by the backend code as currently written.
- SQLite path is hard-coded: `sqlite:///./fraud_demo.db` in `backend/app/db/database.py`.

---

## Known Limitations

- Uses **SQLite** with a local file DB (demo only).
- No authentication/authorization on endpoints.
- Account balances are seeded, and the mobile UI refreshes account data after transfers, but **the backend does not update balances** when transactions are created (transactions are recorded, not applied to balances).
- Fraud detection rules are strictly rule-based (no ML inference in the core path).
- WebSocket clients reconnect automatically (every 3 seconds on close), but the reconnect timer is a simple implementation.

---

## Team

Built for a hackathon-style demo. SentinelBank is a real-time fraud detection simulation with a monitoring dashboard and a mobile banking interface.