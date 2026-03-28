-- ============================================================
-- Amboras Analytics — Supabase Migrations
-- Run this in Supabase SQL Editor
-- ============================================================

-- Stores table
CREATE TABLE stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  owner_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Events table (high-volume stream)
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id VARCHAR(255) UNIQUE NOT NULL,
  store_id UUID NOT NULL REFERENCES stores(id),
  event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('page_view','add_to_cart','remove_from_cart','checkout_started','purchase')),
  timestamp TIMESTAMPTZ NOT NULL,
  product_id VARCHAR(255),
  amount DECIMAL(10,2),
  currency VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX idx_events_store_id ON events(store_id);
CREATE INDEX idx_events_store_timestamp ON events(store_id, timestamp DESC);
CREATE INDEX idx_events_store_type ON events(store_id, event_type);
CREATE INDEX idx_events_purchase_product ON events(store_id, product_id, amount) WHERE event_type = 'purchase';

-- Pre-aggregated daily stats (for fast overview queries)
CREATE TABLE daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id),
  date DATE NOT NULL,
  total_revenue DECIMAL(12,2) DEFAULT 0,
  page_views INT DEFAULT 0,
  purchases INT DEFAULT 0,
  add_to_carts INT DEFAULT 0,
  checkouts_started INT DEFAULT 0,
  UNIQUE(store_id, date)
);
CREATE INDEX idx_daily_stats_store_date ON daily_stats(store_id, date DESC);

-- Disable RLS for all tables (no auth in this demo)
ALTER TABLE stores DISABLE ROW LEVEL SECURITY;
ALTER TABLE events DISABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats DISABLE ROW LEVEL SECURITY;

-- ============================================================
-- RPC Functions (called by the analytics service)
-- ============================================================

-- Get event counts grouped by event_type for a store
CREATE OR REPLACE FUNCTION get_event_counts(p_store_id UUID)
RETURNS TABLE(event_type VARCHAR, count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT e.event_type, COUNT(*)::BIGINT AS count
    FROM events e
    WHERE e.store_id = p_store_id
    GROUP BY e.event_type;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get top 10 products by revenue for a store since a given date
CREATE OR REPLACE FUNCTION get_top_products(p_store_id UUID, p_from DATE)
RETURNS TABLE(product_id VARCHAR, total_revenue NUMERIC, order_count BIGINT) AS $$
BEGIN
  RETURN QUERY
    SELECT
      e.product_id,
      COALESCE(SUM(e.amount), 0) AS total_revenue,
      COUNT(*)::BIGINT AS order_count
    FROM events e
    WHERE e.store_id = p_store_id
      AND e.event_type = 'purchase'
      AND e.timestamp >= p_from::TIMESTAMPTZ
      AND e.product_id IS NOT NULL
    GROUP BY e.product_id
    ORDER BY total_revenue DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql STABLE;
