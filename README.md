# Store Analytics Dashboard

A full-stack analytics dashboard for Amboras, a multi-tenant eCommerce platform orchestrator. Store owners get real-time visibility into revenue, conversion rates, top products, and live event activity — all loading under 2 seconds.

---

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | NestJS (TypeScript), Supabase (PostgreSQL), `@supabase/supabase-js` |
| Frontend | Next.js 15 (App Router), Tailwind CSS 4, Recharts, SWR |
| UI | Shadcn/UI, Lucide React |

---

## Setup Instructions

### Prerequisites
- Node.js v18+
- npm
- A Supabase project (free tier works)

### 1. Install Dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Fill in your Supabase credentials in `.env`:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PORT=3001

NEXT_PUBLIC_API_URL=http://localhost:3001
```

> Use the **Service Role** key, not the anon key. This bypasses RLS for server-side queries.

### 3. Apply Database Schema

In your Supabase SQL Editor, run in order:

1. `backend/supabase/migrations.sql` — creates tables and indexes
2. `backend/supabase/functions.sql` — creates RPC functions for aggregations

### 4. Seed Data

```bash
cd backend
npm run seed
```

This inserts 2 stores and ~50,000 events spread across the last 30 days with realistic distribution across all event types.

### 5. Get Your Store ID

After seeding, copy a store ID from the `stores` table in Supabase and paste it into:

```
.env : NEXT_PUBLIC_DEFAULT_STORE_ID
```

### 6. Start the App

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard).

---

## Project Structure

```
amboras-analytics/
├── backend/
│   ├── src/
│   │   ├── analytics/          # Controllers, services, DTOs
│   │   ├── supabase/           # Supabase client module and service
│   │   ├── common/             # Global exception filter, interceptors
│   │   ├── seed.ts             # Standalone seed script
│   │   └── main.ts
│   └── supabase/
│       ├── migrations.sql      # Tables + indexes
│       └── functions.sql       # RPC functions
├── frontend/
│   ├── src/
│   │   ├── app/dashboard/      # Dashboard page
│   │   ├── components/         # Charts, cards, activity feed, skeletons
│   │   ├── hooks/              # SWR data fetching hooks
│   │   └── lib/                # Constants, utilities
│   └── next.config.ts
└── .env.example
```

---

## Architecture Decisions

### Data Aggregation Strategy

**Decision:** Hybrid approach — pre-aggregated `daily_stats` table for historical revenue + live queries for today's incomplete data + RPC functions for GROUP BY operations.

**Why:** Querying 50,000+ raw events for every dashboard load would be too slow. The `daily_stats` table gives instant revenue rollups for "this week" and "this month" since those are full, settled days. Today's data is always fetched live from the `events` table since it's still accumulating.

**Trade-offs:** The `daily_stats` table needs to be kept in sync. In this implementation the seed script populates it. In production you'd run a nightly aggregation job (cron or Supabase Edge Function). There's an acceptable ~24h lag for historical data accuracy — not a real issue for a business dashboard where yesterday's numbers don't change.

---

### Why Supabase RPC Functions for GROUP BY

**Decision:** Complex aggregations (event counts by type, top products by revenue) are handled via PostgreSQL functions called through `supabase.rpc()`.

**Why:** The Supabase JS client doesn't support `GROUP BY` directly through its query builder. Rather than pulling all rows into Node and aggregating in JavaScript (catastrophic at scale), we push the computation to Postgres where it belongs — close to the data, using indexes, and orders of magnitude faster.

**Trade-offs:** SQL functions are less visible than application code — a developer needs to know to look in `functions.sql`. We mitigate this by committing them alongside migrations so they're version-controlled and reproducible.

---

### Real-time vs. Batch Processing

**Decision:** 30-second polling via SWR `refreshInterval`, not WebSockets or Supabase Realtime.

**Why:** The assignment calls for a dashboard that "feels fast" — not a trading terminal. Polling every 30 seconds is imperceptible to a store owner checking their morning numbers. It's also dramatically simpler: no persistent connections to manage, no reconnection logic, no server-sent event infrastructure. SWR's built-in deduplication means multiple components sharing the same key don't fire duplicate requests.

**Trade-offs:** There's a maximum 30-second delay before new events appear. For a higher-urgency use case (e.g., "live visitors" widget), you'd switch that specific feed to Supabase Realtime. The rest of the dashboard doesn't need it.

---

### Frontend Data Fetching

**Decision:** Three parallel SWR hooks — one each for `overview`, `top-products`, and `recent-activity`. All fire simultaneously on mount.

**Why:** The dashboard's three data regions are independent. Fetching them in parallel cuts perceived load time to the slowest single request rather than the sum of all three. SWR also handles caching so navigating away and back doesn't re-fetch unnecessarily.

**Trade-offs:** Three concurrent requests instead of one. At this scale it's negligible. If the API were heavily rate-limited, we'd consolidate into a single `/dashboard` endpoint that returns everything.

---

### Performance Optimizations

- **Composite indexes:** `(store_id, timestamp DESC)`, `(store_id, event_type)`, and a partial index on `(store_id, product_id, amount) WHERE event_type = 'purchase'` — the query planner uses these for every hot path.
- **daily_stats table:** Revenue aggregations for week/month don't touch the raw events table at all.
- **RPC functions:** Aggregations run in Postgres, not in the application layer.
- **LIMIT on recent activity:** `ORDER BY timestamp DESC LIMIT 20` — trivially fast with the timestamp index.
- **Service Role key:** Skips RLS evaluation overhead on every query.

---

## Known Limitations

- **daily_stats is only populated by the seed script.** In production, new events don't automatically update it. You'd need a Supabase Edge Function or pg_cron job running nightly aggregations.
- **Store ID is hardcoded in the frontend** for demo purposes. A real app would derive it from the authenticated user's session.
- **No auth layer.** The store_id query param is validated to exist but not verified against any user. Any caller with a valid store_id can read that store's data.
- **Seed script is not idempotent.** Running it twice will insert duplicate events (event_id uniqueness will cause failures mid-run). Drop and recreate the tables between runs.
- **At 100M+ events,** the `daily_stats` approach alone won't be enough. You'd want columnar storage (Redshift, BigQuery, ClickHouse) or materialized views with incremental refresh for the raw event table.

---

## What I'd Improve With More Time

- **Proper auth** — Supabase Auth + RLS so store_id is derived from JWT claims, not a query param
- **Idempotent seed script** — upsert logic so it's safe to run multiple times
- **Supabase Realtime** for the recent activity feed — true live updates without polling
- **Date range filtering** — let store owners pick custom ranges instead of fixed today/week/month
- **Automated daily_stats aggregation** — pg_cron job running at midnight UTC to close out each day's stats
- **Error monitoring** — Sentry integration on both backend and frontend
- **End-to-end tests** — Playwright for the dashboard, covering loading states and data rendering

---

## Time Spent

Approximately 3.5 hours.