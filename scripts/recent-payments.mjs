#!/usr/bin/env node
/**
 * Lists the most recent payment rows (for reconciling missed Slack alerts).
 * Usage: node scripts/recent-payments.mjs [limit]
 *
 * Uses select("*") first so unknown/missing columns in older schemas do not break the query.
 * If that fails, retries with a minimal column list (no purpose).
 */

import { createClient } from "@supabase/supabase-js"
import { readFileSync, existsSync } from "fs"
import { fileURLToPath } from "url"
import { dirname, join } from "path"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, "..")

function loadEnvLocal() {
  const path = join(root, ".env.local")
  if (!existsSync(path)) return
  const content = readFileSync(path, "utf8")
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (m) {
      const key = m[1]
      const value = m[2].replace(/^["']|["']$/g, "").trim()
      if (!process.env[key]) process.env[key] = value
    }
  }
}

loadEnvLocal()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY (.env.local).")
  process.exit(1)
}

const limit = Math.min(20, Math.max(1, parseInt(process.argv[2] || "5", 10) || 5))

const supabase = createClient(supabaseUrl, serviceRoleKey)

const MINIMAL_COLUMNS =
  "id, event_id, stripe_session_id, status, amount_cents, currency, user_email, updated_at, created_at"

async function fetchRecent() {
  const star = await supabase
    .from("payments")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (!star.error) {
    return { data: star.data, mode: "all_columns" }
  }

  const msg = star.error.message || ""
  const likelyMissingColumn =
    /column|does not exist|schema cache/i.test(msg) && /purpose|amount_cents|currency/i.test(msg)

  if (likelyMissingColumn) {
    console.warn("[recent-payments] Full select failed, retrying without optional columns:", msg)
  } else {
    console.warn("[recent-payments] select(*) failed, retrying minimal columns:", msg)
  }

  const minimal = await supabase
    .from("payments")
    .select(MINIMAL_COLUMNS)
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (!minimal.error) {
    return { data: minimal.data, mode: "minimal_columns" }
  }

  const legacy = await supabase
    .from("payments")
    .select("id, event_id, stripe_session_id, status, user_email, created_at, updated_at")
    .order("updated_at", { ascending: false })
    .limit(limit)

  if (!legacy.error) {
    return { data: legacy.data, mode: "legacy_columns" }
  }

  return { error: legacy.error || minimal.error || star.error }
}

const result = await fetchRecent()

if (result.error) {
  console.error("Query failed:", result.error.message)
  process.exit(1)
}

if (result.mode && result.mode !== "all_columns") {
  console.warn(`[recent-payments] Note: returned mode "${result.mode}" — run supabase-sync-payments-purpose.sql if purpose/amounts are missing.`)
}

const rows = result.data ?? []
for (const row of rows) {
  if (row && typeof row === "object" && !("purpose" in row)) {
    row.purpose = null
  }
}

console.log(JSON.stringify(rows, null, 2))
