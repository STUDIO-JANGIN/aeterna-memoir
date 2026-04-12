import {
  TRIBUTE_CLIP_COUNT,
} from "@/lib/tributeFilmConfig"

export type StorySnippetForFilm = {
  /** Contributor story / caption for this photo */
  storyText: string | null
  /** Short visitor comfort lines on this photo */
  visitorLines: string[]
}

/**
 * One ~10s clip: “moving photographs” — warm, intimate, like treasured family pictures that gently come alive.
 * Clip index helps vary emotional beat across the five-chapter tribute.
 */
export function buildTributeClipPrompt(
  honoreeName: string | null,
  clipIndex: number,
  snippets: StorySnippetForFilm[],
): string {
  const name = honoreeName?.trim() || "this loved one"
  const chapter = clipIndex + 1
  const beat =
    chapter === 1
      ? "Opening chapter: first gentle impressions — presence, recognition, love at a glance."
      : chapter === TRIBUTE_CLIP_COUNT
        ? "Closing chapter: quiet farewell light — gratitude, peace, enduring love."
        : `Middle chapter ${chapter}: deepening connection — shared warmth between moments.`

  const narrativeBits: string[] = []
  for (const s of snippets) {
    const parts: string[] = []
    if (s.storyText?.trim()) {
      parts.push(`A loved one wrote: "${s.storyText.trim().slice(0, 400)}"`)
    }
    if (s.visitorLines.length > 0) {
      const joined = s.visitorLines
        .map((t) => t.trim())
        .filter(Boolean)
        .slice(0, 6)
        .join(" · ")
      if (joined) parts.push(`Visitors left these words: ${joined.slice(0, 500)}`)
    }
    if (parts.length > 0) narrativeBits.push(parts.join(" "))
  }
  const storyBlock =
    narrativeBits.length > 0
      ? `Honor this emotional through-line (do not show text on screen — only mood and motion): ${narrativeBits.join(" | ")}`
      : "Let the faces and light carry the emotion — no words on screen."

  return [
    `Cinematic memorial clip (${chapter} of ${TRIBUTE_CLIP_COUNT}), ~10 seconds, ${beat}`,
    `Subject: remembering ${name}. Style: magical-realist “moving photographs” — prints in a family album that softly breathe, smile, and shimmer with life; never eerie, never uncanny.`,
    "Warm amber and candlelit ivory tones; soft vignette; gentle parallax as if the picture plane has depth; slow, reverent camera drift.",
    "Photoreal respect for the people in the reference images; subtle motion only — breathing light, a soft gaze shift, a tender smile forming.",
    storyBlock,
    "No on-screen text, logos, watermarks, or captions. No horror, gore, or shock. No random fantasy creatures.",
    "Aspect: widescreen memorial; emotionally intimate, dignified, and beautiful — the feeling of being close to someone you love again.",
  ].join(" ")
}

/** @deprecated use buildTributeClipPrompt for multi-clip flow */
export function buildMemorialTributeFilmPrompt(honoreeName: string | null): string {
  return buildTributeClipPrompt(honoreeName, 0, [])
}
