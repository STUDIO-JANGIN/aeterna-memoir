// arabic-persian-reshaper ships without TypeScript types
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { convertArabic } = require("arabic-persian-reshaper/ArabicShaper") as {
  convertArabic: (s: string) => string
}

/** Presentation forms + visual order for LTR PDF drawing (Amiri). */
export function shapeArabicLineForPdf(line: string): string {
  const trimmed = line.replace(/\r\n|\r|\n/g, " ").trim()
  if (!trimmed) return ""
  const shaped = convertArabic(trimmed)
  return Array.from(shaped).reverse().join("")
}
