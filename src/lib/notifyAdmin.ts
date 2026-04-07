const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || process.env.SLACK_AETERNA_ALERT_WEBHOOK_URL || ""

type AdminPayload = {
  [key: string]: unknown
}

/**
 * Helper to notify admins about important errors/events.
 * - Runs only when SLACK_WEBHOOK_URL or SLACK_AETERNA_ALERT_WEBHOOK_URL is configured.
 * - Network errors are swallowed so they do not block the main flow.
 */
export async function notifyAdmin(message: string, extra?: AdminPayload): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
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
          color: "#FBBF24", // warm gold tone
          mrkdwn_in: ["text"],
          text: "```" + JSON.stringify(extra, null, 2) + "```",
        },
      ]
    }

    await fetch(SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })
  } catch (err) {
    console.error("[notifyAdmin] Failed to send admin notification:", err)
  }
}

