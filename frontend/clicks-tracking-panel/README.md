# Vigility Analytics Dashboard — Frontend

A self-referential product analytics dashboard. Every filter change, chart click, and interaction is tracked and fed back into the visualizations.

---

## Tech Stack

- **React 18** + **Vite** (fast dev server, optimized builds)
- **React Router v6** (client-side routing, protected routes)
- **Recharts** (Bar + Line charts)
- **Axios** (API client with JWT interceptor)
- **js-cookie** (filter persistence across refreshes)
- **react-datepicker** (date range picker)
- **date-fns** (date formatting)
- **lucide-react** (icons)

---

## Local Setup

### 1. Install dependencies
```bash
cd analytics-dashboard
npm install
```

### 2. Configure the backend URL
```bash
cp .env.example .env
```

Edit `.env`:
```env
VITE_API_BASE_URL=http://localhost:3000   # Change to your backend port
```

### 3. Start the dev server
```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### 4. Build for production
```bash
npm run build
npm run preview   # Preview the build locally
```

---

## Features

### Authentication
- **Login / Register** pages with form validation
- JWT stored in `localStorage`, auto-attached to every API request via Axios interceptor
- Protected routes — unauthenticated users are redirected to `/login`

### Filter Persistence (Cookies)
- Date range, age, and gender filter selections are stored in a `vigility_filters` cookie (30-day expiry)
- On page refresh, filters are restored automatically from the cookie

### Dashboard
- **Stat Cards** — total clicks, top feature, tracked features count, trend period total
- **Filter Bar** — date range picker with quick-select buttons (Today / 7d / 30d / 90d), age dropdown, gender dropdown
- **Feature Bar Chart** — horizontal bar chart of total clicks per feature; click any bar to select it
- **Time Trend Line Chart** — daily click trend for the selected feature, with average reference line

### Self-Referential Tracking
Every user interaction fires a `POST /track` request:

| Interaction | Feature Name Logged |
|---|---|
| Change date filter | `date_filter` |
| Change age dropdown | `age_filter` |
| Change gender dropdown | `gender_filter` |
| Click a bar on the chart | `bar_chart_zoom` |

Tracking is **fire-and-forget** — failures are silently caught and never block the UI.

---

## API Contract Expected

The frontend calls these endpoints:

| Method | Path | Body / Params |
|---|---|---|
| `POST` | `/register` | `{ username, password, age, gender }` |
| `POST` | `/login` | `{ username, password }` → `{ token, user? }` |
| `POST` | `/track` | `{ featureName }` (requires `Authorization: Bearer <token>`) |
| `GET` | `/analytics` | Query params: `start_date`, `end_date`, `age`, `gender`, `featureName` |

### Expected `/analytics` response shape:
```json
{
  "feature_usage": [
    { "featureName": "date_filter", "total_clicks": 145 }
  ],
  "time_trend": [
    { "date": "2024-03-01", "featureName": "date_filter", "click_count": 12 }
  ]
}
```

---

## Deployment (Netlify / Vercel)

### Netlify
```bash
npm run build
# Deploy the `dist/` folder
```

Add `_redirects` file in `public/`:
```
/*  /index.html  200
```

Set environment variable `VITE_API_BASE_URL` in the Netlify dashboard.

### Vercel
```bash
npm run build
vercel --prod
```

Set `VITE_API_BASE_URL` in Vercel project settings → Environment Variables.

---

## Architectural Notes

The frontend is intentionally **stateless** — all data lives in the backend. The only client-side state is:
- JWT token in `localStorage`
- Filter preferences in a cookie
- In-memory chart/UI state (React `useState`)

---

## High-Scale Essay (1M writes/minute)

If this dashboard needed to handle **1 million write-events per minute** (~16,700 req/sec), the current synchronous PostgreSQL insert approach would immediately become the bottleneck. The architecture change I'd make:

1. **Decouple writes from the HTTP response** — Instead of writing directly to PostgreSQL on `POST /track`, push events onto a message queue (Kafka or AWS SQS). The API responds `202 Accepted` instantly, keeping p99 latency under 10ms.

2. **Stream consumers** — A pool of worker processes (or Lambda functions) consume from the queue and batch-insert into a write-optimized store. For raw event storage I'd use **ClickHouse** (columnar, purpose-built for analytics at this scale) instead of PostgreSQL.

3. **Pre-aggregated materialized views** — `GET /analytics` should never scan raw events. Use scheduled or streaming aggregation (Kafka Streams, dbt, or ClickHouse materialized views) to maintain pre-computed totals by feature/day/demographic.

4. **Caching** — Put Redis in front of `/analytics` with a short TTL (30–60s). Most product managers viewing a dashboard can tolerate near-real-time data.

5. **Horizontal scaling** — The stateless API tier can scale horizontally behind a load balancer without any code changes.

This gives linear scalability at the cost of eventual consistency — the dashboard shows data that's seconds (not milliseconds) behind real-time, which is an acceptable trade-off for an analytics product.
