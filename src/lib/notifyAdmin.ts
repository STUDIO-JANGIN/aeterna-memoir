const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL || process.env.SLACK_AETERNA_ALERT_WEBHOOK_URL || ""

type AdminPayload = {
  [key: string]: unknown
}

/**
 * 사장님(관리자)에게 중요한 오류/이벤트를 알리기 위한 헬퍼.
 * - SLACK_WEBHOOK_URL 또는 SLACK_AETERNA_ALERT_WEBHOOK_URL 이 설정된 경우에만 동작.
 * - 네트워크 오류는 조용히 무시하고, 본 서비스 흐름을 막지 않는다.
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

