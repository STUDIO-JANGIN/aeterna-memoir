"use server"

import "server-only"

import { buildLocalRemembranceVariants } from "@/lib/remembranceEnhanceLocal"

export type EnhanceRemembranceResult =
  | { ok: true; options: [string, string, string] }
  | { ok: false; reason: "empty" | "too_long" }

const MAX_IN = 4000

function buildUserPrompt(text: string, deceasedName?: string | null): string {
  const n = deceasedName?.trim()
  return `The following is a draft remembrance message${n ? ` for ${n}` : ""} for a memorial invitation and public memorial page.

Draft:
"""
${text}
"""

Return a JSON object with exactly this shape: {"options":["...","...","..."]}
Each value is one complete alternative version of the remembrance (not bullet points). Offer three genuinely different tones: (1) warm and intimate, (2) dignified and timeless, (3) concise and invitation-appropriate. Preserve facts and names from the draft. Each option must be at most 900 characters. Use plain text only (no markdown).`
}

async function fetchOpenAiOptions(text: string, deceasedName?: string | null): Promise<[string, string, string] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.65,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You help families polish remembrance text for memorial invitations. Reply with valid JSON only, no other text.",
        },
        {
          role: "user",
          content: buildUserPrompt(text, deceasedName),
        },
      ],
    }),
  })

  if (!res.ok) return null

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string | null } }>
  }
  const raw = data.choices?.[0]?.message?.content
  if (!raw) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return null
  }

  const obj = parsed as { options?: unknown }
  if (!Array.isArray(obj.options) || obj.options.length < 3) return null

  const out = obj.options.slice(0, 3).map((x) => (typeof x === "string" ? x.trim() : ""))
  if (out.some((s) => !s)) return null

  return [out[0]!, out[1]!, out[2]!]
}

export async function enhanceRemembranceTextAction(
  text: string,
  deceasedName?: string | null,
): Promise<EnhanceRemembranceResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, reason: "empty" }
  }
  if (trimmed.length > MAX_IN) {
    return { ok: false, reason: "too_long" }
  }

  try {
    const ai = await fetchOpenAiOptions(trimmed, deceasedName)
    if (ai) {
      return { ok: true, options: ai }
    }
  } catch {
    // fall through to local variants
  }

  return { ok: true, options: buildLocalRemembranceVariants(trimmed, deceasedName) }
}
