/**
 * Slack Incoming Webhook notifications for #aeterna-alerts (or equivalent).
 * Uses SLACK_WEBHOOK_URL or SLACK_AETERNA_ALERT_WEBHOOK_URL (read at send time so deploy env changes apply).
 */

type AdminPayload = {
  [key: string]: unknown
}

function resolveSlackWebhookUrl(): string {
  const u = process.env.SLACK_WEBHOOK_URL || process.env.SLACK_AETERNA_ALERT_WEBHOOK_URL
  return typeof u === "string" ? u.trim() : ""
}

/** For health checks / admin diagnostics */
export function isSlackWebhookConfigured(): boolean {
  return resolveSlackWebhookUrl().length > 0
}

let missingSlackWebhookLogged = false

/**
 * Notify admins about important errors/events.
 * - Never throws: failures are logged so payment and webhooks are not blocked.
 * - If no webhook URL is set, logs an error every time (low volume: payments / alerts) so production logs show the gap.
 * - If Slack returns a non-OK status, logs status and body.
 */
export async function notifyAdmin(message: string, extra?: AdminPayload): Promise<void> {
  const SLACK_WEBHOOK_URL = resolveSlackWebhookUrl()

  if (!SLACK_WEBHOOK_URL) {
    if (!missingSlackWebhookLogged) {
      missingSlackWebhookLogged = true
      console.error(
        "[notifyAdmin] SLACK_WEBHOOK_URL (or SLACK_AETERNA_ALERT_WEBHOOK_URL) is not set — Slack alerts are disabled until configured in the deployment environment.",
      )
    }
    const preview = message.length > 200 ? `${message.slice(0, 200)}…` : message
    console.error(`[notifyAdmin] Slack not configured; alert dropped: ${preview}`)
    return
  }

  try {
    const payload: Record<string, unknown> = {
      text: message,
      mrkdwn: true,
    }

    if (extra && Object.keys(extra).length > 0) {
      payload.attachments = [
        {
          color: "#FBBF24",
          mrkdwn_in: ["text"],
          text: "```" + JSON.stringify(extra, null, 2) + "```",
        },
      ]
    }

    const res = await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    const bodyText = await res.text().catch(() => "")

    if (!res.ok) {
      console.error(
        `[notifyAdmin] Slack webhook returned ${res.status} ${res.statusText}:`,
        bodyText.slice(0, 800),
      )
    }
  } catch (err) {
    console.error("[notifyAdmin] Failed to send admin notification:", err)
  }
}
