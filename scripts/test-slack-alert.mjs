#!/usr/bin/env node
/**
 * Sends a one-off test message to Slack via the same webhook env vars as production.
 * Usage: node scripts/test-slack-alert.mjs
 * Requires SLACK_WEBHOOK_URL or SLACK_AETERNA_ALERT_WEBHOOK_URL in .env.local or environment.
 */

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

const url =
  (process.env.SLACK_WEBHOOK_URL || process.env.SLACK_AETERNA_ALERT_WEBHOOK_URL || "").trim()

if (!url) {
  console.error("Set SLACK_WEBHOOK_URL or SLACK_AETERNA_ALERT_WEBHOOK_URL in .env.local or the shell.")
  process.exit(1)
}

const text = `✅ [test] Slack webhook OK from scripts/test-slack-alert.mjs at ${new Date().toISOString()}`

const res = await fetch(url, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ text, mrkdwn: true }),
})

const body = await res.text().catch(() => "")

if (!res.ok) {
  console.error("Slack returned", res.status, res.statusText, body.slice(0, 500))
  process.exit(1)
}

console.log("Sent. Check #aeterna-alerts (or the channel bound to this webhook).")
