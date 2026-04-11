"use server"

import "server-only"

import {
  REMEMBRANCE_SANCTUARY_RULES,
  buildBatchUserContent,
  buildRefineUserContent,
} from "@/lib/remembranceAiPrompts"
import { buildLocalRemembranceVariants, refineLocalRemembrance } from "@/lib/remembranceEnhanceLocal"
import { type LandingLocale, isLandingLocale } from "@/lib/landingTranslations"

export type EnhanceRemembranceResult =
  | { ok: true; options: [string, string, string] }
  | { ok: false; reason: "empty" | "too_long" }

export type RefineRemembranceResult =
  | { ok: true; text: string }
  | { ok: false; reason: "empty" | "too_long" }

export type RemembrancePersona = "poetic" | "formal" | "warm"

const MAX_IN = 4000

function normalizeLocale(localeRaw: string | null | undefined): LandingLocale {
  if (localeRaw && isLandingLocale(localeRaw)) return localeRaw
  return "en"
}

function parseThreeOptions(parsed: unknown): [string, string, string] | null {
  if (!parsed || typeof parsed !== "object") return null
  const obj = parsed as { options?: unknown }
  if (!Array.isArray(obj.options) || obj.options.length < 3) return null

  const first = obj.options[0]
  // New shape: [{ id, text }, ...]
  if (first && typeof first === "object" && "text" in (first as object)) {
    const texts = obj.options.slice(0, 3).map((item) => {
      if (!item || typeof item !== "object") return ""
      const t = (item as { text?: unknown }).text
      return typeof t === "string" ? t.trim() : ""
    })
    if (texts.some((s) => !s)) return null
    // Reorder by id if present
    const withIds = obj.options.slice(0, 3).map((item) => {
      if (!item || typeof item !== "object") return { id: "", text: "" }
      const id = (item as { id?: unknown }).id
      const text = (item as { text?: unknown }).text
      return {
        id: typeof id === "string" ? id : "",
        text: typeof text === "string" ? text.trim() : "",
      }
    })
    const byId = (want: RemembrancePersona) => withIds.find((x) => x.id === want)?.text ?? ""
    const p = byId("poetic")
    const f = byId("formal")
    const w = byId("warm")
    if (p && f && w) return [p, f, w]
    if (texts[0] && texts[1] && texts[2]) return [texts[0]!, texts[1]!, texts[2]!]
    return null
  }

  // Legacy: options: ["","",""]
  const strs = obj.options.slice(0, 3).map((x) => (typeof x === "string" ? x.trim() : ""))
  if (strs.some((s) => !s)) return null
  return [strs[0]!, strs[1]!, strs[2]!]
}

async function fetchOpenAiBatch(
  text: string,
  deceasedName: string | undefined,
  locale: LandingLocale,
): Promise<[string, string, string] | null> {
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
      temperature: 0.72,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${REMEMBRANCE_SANCTUARY_RULES}\n\nReply with valid JSON only.`,
        },
        {
          role: "user",
          content: buildBatchUserContent(text, deceasedName, locale),
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

  return parseThreeOptions(parsed)
}

async function fetchOpenAiRefine(
  text: string,
  deceasedName: string | undefined,
  locale: LandingLocale,
  persona: RemembrancePersona,
): Promise<string | null> {
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
      temperature: 0.55,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: `${REMEMBRANCE_SANCTUARY_RULES}\n\nReply with valid JSON only.`,
        },
        {
          role: "user",
          content: buildRefineUserContent(text, deceasedName, locale, persona),
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

  const obj = parsed as { text?: unknown }
  if (typeof obj.text !== "string" || !obj.text.trim()) return null
  return obj.text.trim()
}

export async function enhanceRemembranceTextAction(
  text: string,
  deceasedName?: string | null,
  localeRaw?: string | null,
): Promise<EnhanceRemembranceResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, reason: "empty" }
  }
  if (trimmed.length > MAX_IN) {
    return { ok: false, reason: "too_long" }
  }

  const locale = normalizeLocale(localeRaw)
  const name = deceasedName?.trim() || undefined

  try {
    const ai = await fetchOpenAiBatch(trimmed, name, locale)
    if (ai) {
      return { ok: true, options: ai }
    }
  } catch {
    /* local fallback */
  }

  return { ok: true, options: buildLocalRemembranceVariants(trimmed, name, locale) }
}

export async function refineRemembranceTextAction(
  text: string,
  deceasedName: string | null | undefined,
  localeRaw: string | null | undefined,
  persona: RemembrancePersona,
): Promise<RefineRemembranceResult> {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, reason: "empty" }
  }
  if (trimmed.length > MAX_IN) {
    return { ok: false, reason: "too_long" }
  }

  const locale = normalizeLocale(localeRaw)
  const name = deceasedName?.trim() || undefined

  try {
    const ai = await fetchOpenAiRefine(trimmed, name, locale, persona)
    if (ai) {
      return { ok: true, text: ai }
    }
  } catch {
    /* local fallback */
  }

  return { ok: true, text: refineLocalRemembrance(trimmed, name, locale, persona) }
}
