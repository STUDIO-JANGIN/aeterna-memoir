#!/usr/bin/env node
/**
 * Deployment readiness check: verifies events columns and Storage previews/ upload capability.
 * Usage: node scripts/verify-deploy.mjs
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local or environment variables.
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
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing. Check .env.local.")
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

async function checkEventsColumns() {
  const { data, error } = await supabase
    .from("events")
    .select("id, preview_film_url, full_film_requested_at")
    .limit(1)

  if (error) {
    if (error.message && /preview_film_url|full_film_requested_at|column.*does not exist/i.test(error.message)) {
      return { ok: false, reason: "columns_missing", error: error.message }
    }
    return { ok: false, reason: "query_error", error: error.message }
  }
  return { ok: true }
}

async function runMigration() {
  const { readFileSync } = await import("fs")
  const sqlPath = join(root, "supabase-add-preview-and-full-film.sql")
  const sql = readFileSync(sqlPath, "utf8")
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith("--"))

  for (const stmt of statements) {
    const { error } = await supabase.rpc("exec_sql", { sql_query: stmt + ";" })
    if (error) {
      const { data: rpcCheck } = await supabase.from("events").select("id").limit(1)
      if (rpcCheck) return { ok: false, message: "RPC exec_sql is unavailable. Run migration manually in Supabase Dashboard > SQL Editor." }
      return { ok: false, message: error.message }
    }
  }
  return { ok: true }
}

async function checkStoragePreviewsUpload() {
  const testPath = `previews/__deploy_check_${Date.now()}.txt`
  const { error: uploadError } = await supabase.storage
    .from("photos")
    .upload(testPath, "ok", { cacheControl: "0", upsert: false })

  if (uploadError) {
    return { ok: false, error: uploadError.message }
  }

  const { error: deleteError } = await supabase.storage.from("photos").remove([testPath])
  if (deleteError) {
    console.warn("⚠️ Failed to delete test file (safe to ignore):", deleteError.message)
  }
  return { ok: true }
}

async function main() {
  console.log("=== Deployment Readiness Check ===\n")

  let dbOk = false
  const colCheck = await checkEventsColumns()
  if (colCheck.ok) {
    console.log("✅ events table: preview_film_url and full_film_requested_at columns exist")
    dbOk = true
  } else {
    console.log("❌ Missing columns in events table:", colCheck.error || colCheck.reason)
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
    const sqlPath = join(root, "supabase-add-preview-and-full-film.sql")
    if (dbUrl) {
      const { spawnSync } = await import("child_process")
      console.log("\nAttempting migration with psql...")
      const r = spawnSync("psql", [dbUrl, "-f", sqlPath], { stdio: "inherit", shell: false })
      if (r.status === 0) {
        console.log("✅ Migration SQL completed. Re-checking columns...")
        const recheck = await checkEventsColumns()
        if (recheck.ok) {
          console.log("✅ events table: preview_film_url and full_film_requested_at confirmed")
          dbOk = true
        }
      } else {
        console.log("⚠️ psql execution failed. Run the SQL below manually in Supabase Dashboard > SQL Editor.\n")
        console.log(readFileSync(sqlPath, "utf8"))
      }
    } else {
      console.log("\nRun migration: paste and run the file below in Supabase Dashboard > SQL Editor.")
      console.log("  File: supabase-add-preview-and-full-film.sql")
      console.log("  (Or add DATABASE_URL to .env.local and re-run this script for automatic psql execution.)\n")
      console.log(readFileSync(sqlPath, "utf8"))
      console.log("--- After running the SQL above, re-run this script. ---\n")
    }
  }

  const storageCheck = await checkStoragePreviewsUpload()
  if (storageCheck.ok) {
    console.log("✅ Storage (photos bucket): previews/ upload path is available (service role)")
  } else {
    console.log("❌ Storage (photos) previews/ upload failed:", storageCheck.error)
    console.log("\nIn Supabase Dashboard > Storage > photos bucket > Policies:")
    console.log("  - Service role is usually allowed for all operations; verify the bucket exists.")
    console.log("  - Or add an INSERT policy for the 'previews' folder if needed.\n")
  }

  if (dbOk && storageCheck.ok) {
    console.log("\n🎉 Deployment ready\n")
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
