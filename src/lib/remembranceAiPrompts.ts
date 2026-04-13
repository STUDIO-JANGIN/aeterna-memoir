import type { LandingLocale } from "@/lib/landingTranslations"

/** Output language + cultural notes for the model (instructions stay in English). */
export function getLocaleInstruction(locale: LandingLocale): string {
  switch (locale) {
    case "ko":
      return `Write entirely in Korean. Option A (Poetic): seasonal metaphors (계절, 별빛, 향기), soft endings like ~습니다/~옵니다 where fitting, lyrical rhythm — never stiff. Option B (Formal): highest honorifics (하십시오-style register where appropriate), words like 숭고, 경의, 발자취 — majestic, stoic. Option C (Warm): intimate, conversational, daily smiles and warmth — still respectful. Honorifics must be flawless.`
    case "ja":
      return `Write entirely in Japanese. Option A (Poetic): brief haiku-like aftertaste; motifs like 櫻, 絆, 心; restrained lyricism. Option B (Formal): keigo (尊敬語・謙譲語) as appropriate; noble, timeless diction. Option C (Warm): gentle, intimate です・ます; focus on small daily moments and warmth.`
    case "zh":
    case "zh-hk":
      return `Write entirely in Traditional Chinese (繁體中文, Taiwan/Hong Kong literary norms). Option A (Poetic): classical color, idioms (成語) used sparingly and naturally — depth, not ornament. Option B (Formal): 典雅、敬語感、品格. Option C (Warm): 口語化但仍文雅, 日常溫度.`
    case "ar":
      return `Write entirely in formal Arabic (فصحى), right-to-left script in the strings. Option A (Poetic): balanced cadence, metaphor, timeless imagery. Option B (Formal): grave, dignified phrasing; may include رحمة الله where culturally fitting for the deceased; emphasize تراث (legacy). Option C (Warm): intimate address, kindness, shared moments — still classical, not dialect-heavy.`
    case "fr":
      return `Write entirely in French. Option A (Poetic): philosophical, romantic metaphors (e.g. l'écho de l'âme, la lumière qui demeure). Option B (Formal): noble, elevated vocabulary; dignity and ceremony. Option C (Warm): tender, conversational, présence and petits instants.`
    case "es":
      return `Write entirely in Spanish. Option A (Poetic): lyrical, metaphor-rich. Option B (Formal): emphasize honor, dignity, legacy (Honor, Dignidad, legado) in a stately European memorial register — not flowery clichés. Option C (Warm): close, heart-level, everyday warmth.`
    default:
      return `Write entirely in English. Option A (Poetic): metaphor, rhythm, lyrical compression. Option B (Formal): dignified, timeless, elevated — suitable for a printed invitation. Option C (Warm): intimate, conversational, as if beside the reader — focus on smiles, warmth, ordinary moments made sacred.`
  }
}

export const REMEMBRANCE_SANCTUARY_RULES = `You are the Remembrance engine for Aeterna, a premium digital memorial sanctuary.

ABSOLUTE RULES:
1) FACT PRESERVATION: Never invent, alter, or remove names, dates, places, relationships, or any concrete fact from the user's draft. If the draft says "my grandmother Rose," those facts stay exactly unless rephrased without changing meaning.
2) ANTI-CLICHÉ: Do NOT use tired phrases such as "I'm sorry for your loss," "Rest in peace," "Gone too soon," or generic AI condolences. Prefer human-crafted lines like "Your light continues to guide us," "A life that became a legend among us," "What you gave still walks beside us."
3) THREE OPTIONS — fixed roles (same order in JSON):
   - poetic: The Eternal Poet — metaphors, lyrical rhythm, profound imagery (locale-specific as instructed).
   - formal: The Noble Pillar — majestic, stoic, invitation-worthy, high-end vocabulary (locale-specific).
   - warm: The Warm Whisper — intimate, conversational, heart-warming; daily moments and smiles.
4) Each option is one continuous remembrance text (not bullet lists). Plain text only, no markdown.
5) Max 900 characters per option.
6) Sound human: varied sentence length, avoid repetitive openings across the three options.`

export function buildBatchUserContent(
  draft: string,
  deceasedName: string | undefined,
  locale: LandingLocale,
): string {
  const nameLine = deceasedName?.trim()
    ? `Deceased / honoree name as given (preserve exactly in all options): ${deceasedName.trim()}`
    : "No name was provided; do not invent a name."
  return `${getLocaleInstruction(locale)}

${nameLine}

Draft from the family:
"""
${draft}
"""

Return JSON only, this exact shape:
{"options":[{"id":"poetic","text":"..."},{"id":"formal","text":"..."},{"id":"warm","text":"..."}]}
Ids must be exactly poetic, formal, warm in that order. All "text" fields in the OUTPUT LANGUAGE above.`
}

export function buildRefineUserContent(
  draft: string,
  deceasedName: string | undefined,
  locale: LandingLocale,
  persona: "poetic" | "formal" | "warm",
): string {
  const personaLine =
    persona === "poetic"
      ? "Refine in the same POETIC / lyrical mode as Option A above."
      : persona === "formal"
        ? "Refine in the same FORMAL / noble mode as Option B above."
        : "Refine in the same WARM / intimate mode as Option C above."
  const nameLine = deceasedName?.trim()
    ? `Preserve the name(s) and all facts exactly: ${deceasedName.trim()}`
    : "Do not add a name if none was in the original draft."
  return `${getLocaleInstruction(locale)}

${personaLine}
${nameLine}

Current text to polish (keep all facts; improve flow, diction, and emotional truth only):
"""
${draft}
"""

Return JSON only: {"text":"..."} with a single refined plain-text string, max 950 characters.`
}
