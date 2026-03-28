/**
 * Seed script — creates 2 stores, ~50k events, and populates daily_stats.
 * Run: npm run seed
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ---------- Helpers ----------

function randomBetween(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ---------- Config ----------

const EVENT_TYPES = [
  { type: 'page_view', weight: 0.60 },
  { type: 'add_to_cart', weight: 0.20 },
  { type: 'remove_from_cart', weight: 0.05 },
  { type: 'checkout_started', weight: 0.08 },
  { type: 'purchase', weight: 0.07 },
] as const;

const PRODUCTS = Array.from({ length: 10 }, (_, i) =>
  `prod_${String(i + 1).padStart(3, '0')}`,
);

const STORES = [
  { id: uuid(), name: 'Amboras US Store', owner_id: uuid() },
  { id: uuid(), name: 'Amboras EU Store', owner_id: uuid() },
];

const TOTAL_EVENTS = 50_000;
const BATCH_SIZE = 500;
const DAYS = 30;

// ---------- Weighted random event type ----------

function pickEventType(): string {
  const r = Math.random();
  let cumulative = 0;
  for (const et of EVENT_TYPES) {
    cumulative += et.weight;
    if (r <= cumulative) return et.type;
  }
  return 'page_view';
}

// ---------- Generate events ----------

interface EventRow {
  event_id: string;
  store_id: string;
  event_type: string;
  timestamp: string;
  product_id: string;
  amount: number | null;
  currency: string | null;
}

function generateEvents(): EventRow[] {
  const events: EventRow[] = [];
  const now = Date.now();

  for (let i = 0; i < TOTAL_EVENTS; i++) {
    const store = randomChoice(STORES);
    const eventType = pickEventType();
    const daysAgo = Math.random() * DAYS;
    const timestamp = new Date(now - daysAgo * 86_400_000);

    const isPurchase = eventType === 'purchase';

    events.push({
      event_id: `evt_${uuid()}`,
      store_id: store.id,
      event_type: eventType,
      timestamp: timestamp.toISOString(),
      product_id: randomChoice(PRODUCTS),
      amount: isPurchase
        ? Math.round(randomBetween(9.99, 299.99) * 100) / 100
        : null,
      currency: isPurchase ? 'USD' : null,
    });
  }

  return events;
}

// ---------- Aggregate daily_stats ----------

interface DailyStatsRow {
  store_id: string;
  date: string;
  total_revenue: number;
  page_views: number;
  purchases: number;
  add_to_carts: number;
  checkouts_started: number;
}

function aggregateDailyStats(events: EventRow[]): DailyStatsRow[] {
  const key = (storeId: string, date: string) => `${storeId}::${date}`;
  const map = new Map<string, DailyStatsRow>();

  for (const e of events) {
    const date = e.timestamp.slice(0, 10); // YYYY-MM-DD
    const k = key(e.store_id, date);

    if (!map.has(k)) {
      map.set(k, {
        store_id: e.store_id,
        date,
        total_revenue: 0,
        page_views: 0,
        purchases: 0,
        add_to_carts: 0,
        checkouts_started: 0,
      });
    }

    const stats = map.get(k)!;
    switch (e.event_type) {
      case 'page_view':
        stats.page_views++;
        break;
      case 'add_to_cart':
        stats.add_to_carts++;
        break;
      case 'checkout_started':
        stats.checkouts_started++;
        break;
      case 'purchase':
        stats.purchases++;
        stats.total_revenue += e.amount ?? 0;
        break;
    }
  }

  return Array.from(map.values()).map((s) => ({
    ...s,
    total_revenue: Math.round(s.total_revenue * 100) / 100,
  }));
}

// ---------- Insert in batches ----------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertBatch(
  table: string,
  rows: Record<string, any>[],
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).insert(batch);
    if (error) {
      console.error(`❌ Insert error on ${table} (batch ${i / BATCH_SIZE}): ${error.message}`);
      throw error;
    }
    process.stdout.write(
      `\r  ${table}: ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`,
    );
  }
  console.log(); // newline after progress
}

// ---------- Main ----------

async function main() {
  console.log('🌱 Seeding Amboras Analytics…\n');

  // 1. Insert stores
  console.log('Creating stores…');
  const { error: storeErr } = await supabase.from('stores').insert(STORES);
  if (storeErr) {
    console.error(`❌ Store insert failed: ${storeErr.message}`);
    process.exit(1);
  }
  console.log(`  ✅ ${STORES.length} stores created`);
  console.log(`     Store 1: ${STORES[0].id} (${STORES[0].name})`);
  console.log(`     Store 2: ${STORES[1].id} (${STORES[1].name})\n`);

  // 2. Generate + insert events
  console.log(`Generating ${TOTAL_EVENTS.toLocaleString()} events…`);
  const events = generateEvents();
  console.log('Inserting events…');
  await insertBatch('events', events);
  console.log(`  ✅ ${events.length.toLocaleString()} events inserted\n`);

  // 3. Aggregate + insert daily_stats
  console.log('Aggregating daily stats…');
  const dailyStats = aggregateDailyStats(events);
  console.log(`Inserting ${dailyStats.length} daily_stats rows…`);
  await insertBatch('daily_stats', dailyStats);
  console.log(`  ✅ ${dailyStats.length} daily_stats rows inserted\n`);

  console.log('✨ Seeding complete!');
  console.log(`\n📋 Use this store_id in your frontend:\n   ${STORES[0].id}`);
}

main().catch((err) => {
  console.error('Fatal error during seeding:', err);
  process.exit(1);
});
