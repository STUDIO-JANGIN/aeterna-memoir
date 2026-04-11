/**
 * Notify a guest that their submitted memory is now visible on the memorial.
 * Uses Resend when RESEND_API_KEY is set; otherwise no-ops (Slack optional for ops).
 */

import { notifyAdmin } from "@/lib/notifyAdmin"

const RESEND_API_KEY = process.env.RESEND_API_KEY ?? ""
const FROM = process.env.RESEND_FROM_EMAIL ?? "Aeterna <onboarding@resend.dev>"

export async function sendStoryApprovedEmail(params: {
  to: string
  memorialName: string
  memorialUrl: string
}): Promise<void> {
  const { to, memorialName, memorialUrl } = params
  const subject = `Your memory is now on ${memorialName}’s memorial`
  const html = `
    <p style="font-family: Georgia, serif; line-height: 1.6; color: #1a1a1a;">
      Your photo and story are now visible on <strong>${escapeHtml(memorialName)}</strong>’s memorial page.
    </p>
    <p style="font-family: Georgia, serif; line-height: 1.6;">
      <a href="${escapeAttr(memorialUrl)}" style="color: #b8860b;">View the memorial</a>
    </p>
    <p style="font-size: 12px; color: #666;">You received this because you asked to be notified when your memory went live.</p>
  `.trim()

  if (!RESEND_API_KEY) {
    await notifyAdmin(`[visitor-notify] Story approved — would email ${to} (set RESEND_API_KEY to send)`, {
      memorialUrl,
    })
    return
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: [to],
        subject,
        html,
      }),
    })
    if (!res.ok) {
      const text = await res.text()
      console.error("[sendStoryApprovedEmail] Resend error:", res.status, text)
      await notifyAdmin(`[visitor-notify] Resend failed for ${to}: ${res.status}`, { body: text })
    }
  } catch (err) {
    console.error("[sendStoryApprovedEmail]", err)
    await notifyAdmin(`[visitor-notify] send failed for ${to}`, {
      error: err instanceof Error ? err.message : String(err),
    })
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function escapeAttr(s: string): string {
  return s.replace(/"/g, "&quot;")
}
