/** Local fallback when OpenAI is unavailable — three distinct tones. */
export function buildLocalRemembranceVariants(text: string, name?: string | null): [string, string, string] {
  const raw = text.replace(/\s+/g, " ").trim()
  const core = raw.length ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw
  const punctuated = /[.!?…]$/.test(core) ? core : `${core}.`
  const n = name?.trim()

  const warm = n
    ? `${punctuated}\n\nWith gratitude for ${n} and the light they brought into our lives.`
    : `${punctuated}\n\nWith gratitude and love.`

  const dignified = n
    ? `We remember ${n} with deep respect.\n\n${punctuated}`
    : `We remember them with deep respect.\n\n${punctuated}`

  const sentences = raw
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean)
  let concise: string
  if (sentences.length <= 2) {
    concise = punctuated
  } else {
    const joined = `${sentences[0]} ${sentences[1]}`.trim()
    concise = /[.!?]$/.test(joined) ? joined : `${joined}.`
  }

  return [warm, dignified, concise]
}
