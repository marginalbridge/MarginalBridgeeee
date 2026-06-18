import { getDatabaseUrl, isPostgresEnabled } from "@/lib/db/config";
import { neon } from "@neondatabase/serverless";

let schemaReady: Promise<void> | null = null;

export function getSql() {
  if (!isPostgresEnabled()) {
    throw new Error("Postgres etkin değil.");
  }

  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("Postgres bağlantı adresi bulunamadı.");
  }

  return neon(url);
}

export async function ensureSchema(): Promise<void> {
  if (!isPostgresEnabled()) return;

  if (!schemaReady) {
    schemaReady = initSchema().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }

  await schemaReady;
}

async function initSchema(): Promise<void> {
  const sql = getSql();

  await sql`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT,
      name TEXT NOT NULL,
      company TEXT NOT NULL DEFAULT '',
      role TEXT NOT NULL DEFAULT 'user',
      status TEXT NOT NULL DEFAULT 'pending',
      discount_percent INTEGER NOT NULL DEFAULT 0,
      free_trial_start TIMESTAMPTZ,
      free_trial_end TIMESTAMPTZ,
      auth_provider TEXT NOT NULL DEFAULT 'email',
      auth_provider_id TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS preferences JSONB NOT NULL DEFAULT '{}'::jsonb
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS connected_stores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      platform TEXT NOT NULL,
      store_name TEXT NOT NULL,
      seller_id TEXT NOT NULL,
      api_key TEXT NOT NULL,
      api_secret TEXT NOT NULL,
      status TEXT NOT NULL,
      product_count INTEGER NOT NULL DEFAULT 0,
      order_count INTEGER NOT NULL DEFAULT 0,
      last_sync_at TIMESTAMPTZ,
      auto_sync BOOLEAN NOT NULL DEFAULT true,
      auto_reprice BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, platform)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS catalog_products (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      price_tl NUMERIC NOT NULL,
      stock INTEGER NOT NULL,
      category TEXT NOT NULL,
      channels JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, sku)
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS user_trendyol_products (
      user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      products JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS marketplace_orders (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      store_id TEXT REFERENCES connected_stores(id) ON DELETE CASCADE,
      order_number TEXT NOT NULL,
      marketplace TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_cost_usd NUMERIC NOT NULL,
      weight_desi NUMERIC NOT NULL,
      category TEXT NOT NULL,
      status TEXT NOT NULL,
      final_price_tl NUMERIC NOT NULL,
      competitor_price_tl NUMERIC NOT NULL,
      ordered_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS bot_activity_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      store_id TEXT REFERENCES connected_stores(id) ON DELETE SET NULL,
      log_type TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      logged_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_marketplace_orders_user
    ON marketplace_orders (user_id, ordered_at DESC)
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS idx_bot_activity_logs_user
    ON bot_activity_logs (user_id, logged_at DESC)
  `;

  // Eski demo siparişleri (MB-2026-*) bir kez temizle
  await sql`
    DELETE FROM marketplace_orders
    WHERE order_number LIKE 'MB-2026-%'
  `;
  await sql`
    DELETE FROM bot_activity_logs
    WHERE message LIKE '%MB-2026-%'
  `;

  const adminEmail = "admin@marginalbridge.com";
  const existing = await sql`SELECT id FROM users WHERE email = ${adminEmail} LIMIT 1`;

  if (existing.length === 0) {
    const bcrypt = await import("bcryptjs");
    const passwordHash = await bcrypt.hash("Admin123!", 10);
    await sql`
      INSERT INTO users (
        id, email, password_hash, name, company, role, status,
        discount_percent, auth_provider, auth_provider_id
      ) VALUES (
        'admin-001',
        ${adminEmail},
        ${passwordHash},
        'Sistem Yöneticisi',
        'MarginalBridge',
        'admin',
        'active',
        0,
        'email',
        NULL
      )
    `;
  }
}
