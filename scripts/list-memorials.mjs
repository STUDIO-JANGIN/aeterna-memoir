#!/usr/bin/env node
/**
 * Lists recent memorials (events): id, slug, name — uses service role (same as server actions).
 * Usage: node scripts/list-memorials.mjs
 *        node scripts/list-memorials.mjs john-lee   # filter slug/name (case-insensitive)
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local or env.
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

const filterArg = process.argv[2]?.trim() || ""

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

const { data, error } = await supabase
  .from("events")
  .select("id, slug, name, created_at, tier")
  .order("created_at", { ascending: false })
  .limit(80)

if (error) {
  console.error("Query failed:", error.message, error)
  process.exit(1)
}

let rows = data ?? []
if (filterArg) {
  const f = filterArg.toLowerCase()
  rows = rows.filter(
    (r) =>
      (r.slug && String(r.slug).toLowerCase().includes(f)) ||
      (r.name && String(r.name).toLowerCase().includes(f)) ||
      (r.id && String(r.id).toLowerCase().includes(f)),
  )
}

console.log(`Supabase URL: ${supabaseUrl}`)
console.log(`Rows: ${rows.length}${filterArg ? ` (filter: "${filterArg}")` : " (latest 80)"}\n`)
console.log("id\tslug\tname\tcreated_at\ttier")
for (const r of rows) {
  console.log([r.id, r.slug ?? "(null)", (r.name ?? "").slice(0, 40), r.created_at, r.tier ?? ""].join("\t"))
}

if (filterArg && rows.length === 0) {
  console.log("\nNo match in latest 80. Try without filter to browse recent slugs, or increase limit in script.")
}
