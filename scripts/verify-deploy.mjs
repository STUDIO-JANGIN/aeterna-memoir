#!/usr/bin/env node
/**
 * 배포 준비 점검: events 컬럼 확인, Storage previews/ 업로드 가능 여부 확인.
 * 사용: node scripts/verify-deploy.mjs
 * .env.local 또는 환경변수에 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 필요.
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
  console.error("❌ NEXT_PUBLIC_SUPABASE_URL 또는 SUPABASE_SERVICE_ROLE_KEY가 없습니다. .env.local을 확인하세요.")
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
      if (rpcCheck) return { ok: false, message: "RPC exec_sql 없음. Supabase Dashboard > SQL Editor에서 수동 실행 필요." }
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
    console.warn("⚠️ 테스트 파일 삭제 실패 (무시 가능):", deleteError.message)
  }
  return { ok: true }
}

async function main() {
  console.log("=== 배포 준비 점검 ===\n")

  let dbOk = false
  const colCheck = await checkEventsColumns()
  if (colCheck.ok) {
    console.log("✅ events 테이블: preview_film_url, full_film_requested_at 컬럼 존재")
    dbOk = true
  } else {
    console.log("❌ events 테이블에 컬럼 없음:", colCheck.error || colCheck.reason)
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
    const sqlPath = join(root, "supabase-add-preview-and-full-film.sql")
    if (dbUrl) {
      const { spawnSync } = await import("child_process")
      console.log("\n마이그레이션 실행 시도 (psql)...")
      const r = spawnSync("psql", [dbUrl, "-f", sqlPath], { stdio: "inherit", shell: false })
      if (r.status === 0) {
        console.log("✅ 마이그레이션 SQL 실행 완료. 컬럼 재확인 중...")
        const recheck = await checkEventsColumns()
        if (recheck.ok) {
          console.log("✅ events 테이블: preview_film_url, full_film_requested_at 컬럼 확인됨")
          dbOk = true
        }
      } else {
        console.log("⚠️ psql 실행 실패. 아래 SQL을 Supabase Dashboard > SQL Editor에서 수동 실행하세요.\n")
        console.log(readFileSync(sqlPath, "utf8"))
      }
    } else {
      console.log("\n마이그레이션 실행: Supabase Dashboard > SQL Editor에서 아래 파일 내용을 붙여넣어 실행하세요.")
      console.log("  파일: supabase-add-preview-and-full-film.sql")
      console.log("  (또는 .env.local에 DATABASE_URL 추가 후 이 스크립트 재실행 시 psql로 자동 실행)\n")
      console.log(readFileSync(sqlPath, "utf8"))
      console.log("--- 위 SQL 실행 후 이 스크립트를 다시 실행하세요. ---\n")
    }
  }

  const storageCheck = await checkStoragePreviewsUpload()
  if (storageCheck.ok) {
    console.log("✅ Storage(photos 버킷): previews/ 경로 업로드 가능 (service role)")
  } else {
    console.log("❌ Storage(photos) previews/ 업로드 실패:", storageCheck.error)
    console.log("\nSupabase Dashboard > Storage > photos 버킷 > Policies에서")
    console.log("  - Service role은 기본적으로 모든 작업 허용. 버킷이 존재하는지 확인.")
    console.log("  - 또는 'previews' 폴더에 대한 INSERT 정책이 필요할 수 있습니다.\n")
  }

  if (dbOk && storageCheck.ok) {
    console.log("\n🎉 배포 준비 완료\n")
    process.exit(0)
  } else {
    process.exit(1)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
