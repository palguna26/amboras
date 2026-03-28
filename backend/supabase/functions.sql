-- ============================================================
-- Amboras Analytics — Supabase RPC Functions
-- Run this in Supabase SQL Editor AFTER migrations.sql
-- ============================================================

-- Returns event counts grouped by event_type for a given store
CREATE OR REPLACE FUNCTION get_event_counts(p_store_id UUID)
RETURNS TABLE(event_type TEXT, count BIGINT) AS $$
  SELECT event_type, COUNT(*) as count
  FROM events
  WHERE store_id = p_store_id
  GROUP BY event_type;
$$ LANGUAGE sql;

-- Returns top 10 products by revenue for a given store since a date
CREATE OR REPLACE FUNCTION get_top_products(p_store_id UUID, p_from DATE)
RETURNS TABLE(product_id TEXT, total_revenue NUMERIC, order_count BIGINT) AS $$
  SELECT product_id, SUM(amount) as total_revenue, COUNT(*) as order_count
  FROM events
  WHERE store_id = p_store_id
    AND event_type = 'purchase'
    AND timestamp >= p_from
  GROUP BY product_id
  ORDER BY total_revenue DESC
  LIMIT 10;
$$ LANGUAGE sql;
