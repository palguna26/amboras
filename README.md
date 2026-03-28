# Amboras Store Analytics Dashboard

Amboras Analytics is a premium, high-performance store analytics dashboard designed for modern e-commerce. It provides real-time insights into store events, revenue, and product performance through a sophisticated full-stack architecture.

## 🏗️ Architecture & Tech Stack

The project is built as a modular monorepo, separating concerns between a robust data-processing backend and a high-performance frontend.

### Backend: NestJS & Supabase
- **Core:** [NestJS](https://nestjs.com/) (TypeScript) for a structured, scalable API layer.
- **Database:** [PostgreSQL](https://www.postgresql.org/) managed via [Supabase](https://supabase.com/).
- **Data Access:** Secure server-side interaction using `@supabase/supabase-js` with the Service Role key for elevated permissions.
- **Performance:** Complex aggregations (like revenue by product and event counts) are offloaded to PostgreSQL using **SQL RPC Functions** for sub-second query execution.
- **Indexing:** Optimized with composite B-Tree indexes on `(store_id, event_type, timestamp DESC)` to handle millions of events efficiently.

### Frontend: Next.js 15 & Modern UI
- **Framework:** [Next.js 15](https://nextjs.org/) with the App Router and Turbopack for optimal development and production performance.
- **Styling:** [Tailwind CSS 4](https://tailwindcss.com/) with a custom design system for a premium, high-contrast look.
- **UI Components:** [Shadcn/UI](https://ui.shadcn.com/) and [Lucide React](https://lucide.dev/) for consistent, accessible interface elements.
- **Visualization:** [Recharts](https://recharts.org/) for interactive, responsive data visualization.
- **State & Fetching:** [SWR](https://swr.vercel.app/) for lightweight, reactive data fetching and automatic caching/polling.

---

## 🚀 Getting Started

Follow these steps to set up the project locally.

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18 or later)
- [npm](https://www.npmjs.com/)
- A [Supabase](https://supabase.com/) project (Free tier works perfectly)

### 2. Dependency Installation
Install dependencies for both the backend and frontend:
```bash
# From the root directory
cd backend && npm install
cd ../frontend && npm install
```

### 3. Environment Configuration
Copy the root `.env.example` into a new `.env` file and fill in your Supabase credentials:
```bash
cp .env.example .env
```
*Note: Ensure the `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are correctly provided.*

### 4. Database Setup (Supabase)
Apply the database schema and functions in your Supabase SQL Editor:
1. Run the contents of `backend/supabase/migrations.sql`.
2. Run the contents of `backend/supabase/functions.sql`.

### 5. Seeding Data
Generate realistic dashboard data for testing:
```bash
cd backend
npm run seed
```
### 6.Copy the Store ID
Copy the store ID from the database and paste it in frontend\src\app\dashboard\page.tsx

### 7. Start the Application
Run both the backend and frontend in development mode:

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

The frontend will be available at [http://localhost:3000](http://localhost:3000) and the backend API documentation/health checks at [http://localhost:3001](http://localhost:3001).

---

## 📂 Project Structure

```text
amboras-analytics/
├── backend/                # NestJS Backend
│   ├── src/
│   │   ├── analytics/      # Analytics logic, controllers, and services
│   │   ├── supabase/       # Supabase client and connection management
│   │   ├── common/         # Shared decorators, filters, and interceptors
│   │   ├── seed.ts         # Data seeding script
│   │   └── main.ts         # Application entry point
│   ├── supabase/           # SQL migrations and RPC functions
│   └── test/               # E2E and Unit tests
├── frontend/               # Next.js 15 Frontend
│   ├── src/
│   │   ├── app/            # Next.js App Router (pages and layouts)
│   │   ├── components/     # UI components (dashboard, charts, shared)
│   │   ├── hooks/          # Custom React hooks (data fetching, state)
│   │   ├── lib/            # Utility functions and shared constants
│   │   └── styles/         # Global styles and tailwind config
│   ├── public/             # Static assets (images, icons)
│   └── next.config.ts      # Next.js configuration
└── .env.example            # Shared environment template
```
