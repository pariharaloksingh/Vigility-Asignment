# Vigility — Interactive Product Analytics Dashboard

A full-stack analytics dashboard that visualizes its own usage. Every filter change or chart interaction is tracked as an event and fed back into the visualizations in real time.

**Live Demo:** [https://vigility-asignment.vercel.app](https://vigility-asignment.vercel.app)  
**Frontend:** [https://vigility-asignment.vercel.app](https://vigility-asignment.vercel.app)  
**Backend API:** [https://vigility-asignment.onrender.com](https://vigility-asignment.onrender.com)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Recharts, Axios, React Router v6 |
| Backend | Node.js, Express 5, Sequelize ORM |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Hosting | Render (backend + DB), Render Static (frontend) |

---

## Project Structure

```
vigility/
├── backend/
│   ├── config/         # Sequelize DB connection
│   ├── controllers/    # Route logic (auth, track, analytics)
│   ├── middleware/     # JWT auth middleware
│   ├── models/         # User, FeatureClick Sequelize models
│   ├── routes/         # Express routers
│   ├── seed/           # Database seeding script
│   ├── app.js          # Express app setup
│   └── index.js        # Cluster process manager
└── frontend/clicks-tracking-panel/
    ├── src/
    │   ├── api/        # Axios client with JWT interceptor
    │   ├── components/ # DateRangePicker, charts, FilterBar, Navbar
    │   ├── hooks/      # useAuth, useFilters
    │   └── pages/      # DashboardPage, LoginPage, RegisterPage
    └── public/
        └── _redirects  # Render SPA routing
```

---

## Running Locally

### Prerequisites
- Node.js >= 18
- PostgreSQL running locally

### Backend

```bash
cd backend
cp .env.example .env
# Fill in your local DB credentials in .env
npm install
npm start
# Server runs on http://localhost:3000
```

### Frontend

```bash
cd frontend/clicks-tracking-panel
npm install
npm run dev
# App runs on http://localhost:5173
```

### Seed the Database

After the backend is running and tables are created:

```bash
cd backend
npm run seed
```

This creates **120 users** and **1200 feature click events** spread across the last 30 days, so the dashboard is never empty on first load.

> Default login for any seeded user: `username: user1` (through `user120`), `password: 123456`

---

## API Reference

### Auth

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/auth/register` | `{ username, password, age?, gender? }` | Register a new user |
| POST | `/auth/login` | `{ username, password }` | Returns JWT token |

### Tracking

| Method | Endpoint | Auth | Body | Description |
|--------|----------|------|------|-------------|
| POST | `/track` | Required | `{ featureName }` | Log a feature interaction |

Valid `featureName` values: `date_filter`, `age_filter`, `gender_filter`, `bar_chart_click`, `line_chart_view`, `apply_filters`, `refresh_button`, `page_view`

### Analytics

| Method | Endpoint | Auth | Query Params | Description |
|--------|----------|------|------|-------------|
| GET | `/analytics` | — | `start_date`, `end_date`, `age_min`, `age_max`, `gender`, `featureName` | Aggregated chart data |

**Response shape:**
```json
{
  "barChart": [{ "featureName": "date_filter", "count": 142 }],
  "lineChart": [{ "date": "2026-04-01", "count": 23 }]
}
```

---

## Data Models

**User**
```
id (PK) | username | password (hashed) | age | gender | createdAt | updatedAt
```

**FeatureClick**
```
id (PK) | userId (FK) | featureName | timestamp | createdAt | updatedAt
```

---

## Features

- **JWT Authentication** — register, login, protected routes
- **Cookie Persistence** — filters (date range, age, gender) are saved in cookies and restored on page refresh
- **Bar Chart** — total clicks per feature, click a bar to drill into the line chart
- **Line Chart** — daily click trend for the selected feature
- **Filters** — date range picker, age group dropdown (`<18`, `18-40`, `>40`), gender dropdown
- **Click Tracking** — every filter change and chart interaction fires `POST /track` silently in the background
- **Cluster Mode** — backend spawns one worker per CPU core and auto-restarts crashed workers

---

## Architectural Choices

**Cluster mode over a single process:** Node.js is single-threaded. Using `cluster` in `index.js` forks one worker per CPU core, letting the backend utilize all available cores without an external process manager.

**Sequelize ORM with PostgreSQL:** Sequelize provides model-level validation (age range, gender enum) and makes JOIN queries between `Users` and `FeatureClicks` readable. PostgreSQL's `DATE_TRUNC` is used server-side for time-series aggregation, keeping the response payload small.

**JWT in Authorization header (not cookies):** Avoids CSRF complexity in a cross-origin setup where the frontend and backend are on different domains. The Axios interceptor attaches the token automatically to every request.

**`.env.production` baked at build time:** Vite replaces `import.meta.env.VITE_*` at build time, so no runtime env injection is needed for the static frontend.

---

## Scaling to 1 Million Write-Events Per Minute

The current architecture writes every `POST /track` directly to PostgreSQL synchronously. At 1M events/min (~16,667 req/s), this would saturate the DB connection pool immediately. Here is how to evolve the architecture:

### Phase 1 — Message Queue (RabbitMQ / Kafka)
Instead of writing to Postgres on every request, the `/track` endpoint publishes the event to a **RabbitMQ** or **Apache Kafka** topic and returns `202 Accepted` instantly. A separate pool of **consumer workers** reads from the queue and batch-inserts into the DB in chunks (e.g., 500 rows per INSERT). This decouples write throughput from DB capacity and absorbs traffic spikes without dropping events.

### Phase 2 — Horizontal Scaling + Load Balancer
Deploy multiple backend instances behind an **Nginx** or cloud load balancer. Since the app is stateless (JWT, no server-side sessions), any instance can handle any request. Kubernetes `HorizontalPodAutoscaler` can scale worker replicas up/down based on queue depth.

### Phase 3 — Redis for Hot Aggregations
Real-time dashboard queries (`GET /analytics`) hit PostgreSQL on every request. With high write volume, those aggregation queries become slow. Move the **computed aggregates into Redis** — consumer workers update Redis counters (`INCR`, `ZINCRBY`) as they process events. The analytics endpoint reads from Redis (sub-millisecond) instead of running `GROUP BY` on millions of rows. A background job periodically reconciles Redis counters back to Postgres for durability.

### Phase 4 — Time-Series Optimized Storage
For long-term trend queries, migrate `FeatureClicks` into **TimescaleDB** (a PostgreSQL extension for time-series) or **ClickHouse**. These are optimized for append-heavy workloads and column-oriented aggregations, reducing query time from seconds to milliseconds at scale.

### Summary Architecture at Scale

```
Client
  │
  ▼
Load Balancer (Nginx / AWS ALB)
  │
  ├──▶ API Servers (Node.js, horizontally scaled)
  │         │  POST /track → publish event
  │         ▼
  │     RabbitMQ / Kafka  ──▶  Consumer Workers  ──▶  PostgreSQL / TimescaleDB
  │
  └──▶  GET /analytics  ──▶  Redis (hot aggregates)
                                   │
                              Background Sync
                                   │
                              PostgreSQL (durable store)
```

This keeps write latency under 5ms for producers, handles burst traffic without data loss, and serves read queries from an in-memory cache.

---

## Environment Variables

### Backend (`.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | Full PostgreSQL connection string (Render provides this) |
| `JWT_SECRET` | Secret key for signing JWT tokens |
| `PORT` | Server port (Render sets this automatically) |
| `CLIENT_URL` | Frontend origin for CORS |

### Frontend (`.env.production`)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Backend API base URL |

---

## Deployment

Both services are deployed on **Render** using [`render.yaml`](./render.yaml) at the repo root.

| Service | Type | URL |
|---------|------|-----|
| vigility-backend | Web Service (Node) | https://vigility-asignment.onrender.com |
| vigility-frontend | Vercel Static | https://vigility-asignment.vercel.app |
| my-app-db | PostgreSQL 18 | Internal to Render (Oregon, US West) |

### Render PostgreSQL Details

| Field | Value |
|-------|-------|
| Instance Name | my-app-db |
| PostgreSQL Version | 18 |
| Region | Oregon (US West) |
| Instance Type | Free (256 MB RAM, 0.1 CPU, 1 GB Storage) |
| Internal Hostname | `dpg-d7i84c0sfn5c738ga1tg-a` |
| Port | `5432` |
| Database | `my_app_db_az2v` |
| Username | `alok` |
| Expires | May 19, 2026 (upgrade to paid to keep alive) |

> **Note:** The free Render PostgreSQL instance expires on **May 19, 2026** and will be deleted unless upgraded. The `DATABASE_URL` env var on the backend web service is set to the Internal Database URL (only accessible within Render's network).
