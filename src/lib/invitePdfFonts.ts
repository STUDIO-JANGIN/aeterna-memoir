import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs"
import path from "path"
import fontkit from "@pdf-lib/fontkit"
import type { PDFDocument } from "pdf-lib"
import type { PDFFont } from "pdf-lib"
import type { LandingLocale } from "@/lib/landingTranslations"

const CJK_OTF: Record<"kr" | "jp" | "tc", { url: string; file: string }> = {
  kr: {
    url: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/Korean/NotoSansCJKkr-Regular.otf",
    file: "NotoSansCJKkr-Regular.otf",
  },
  jp: {
    url: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/Japanese/NotoSansCJKjp-Regular.otf",
    file: "NotoSansCJKjp-Regular.otf",
  },
  tc: {
    url: "https://raw.githubusercontent.com/googlefonts/noto-cjk/main/Sans/OTF/TraditionalChinese/NotoSansCJKtc-Regular.otf",
    file: "NotoSansCJKtc-Regular.otf",
  },
}

function cacheDir(): string {
  const dir = path.join(process.cwd(), ".cache", "fonts")
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })
  return dir
}

async function ensureCachedOtf(url: string, filename: string): Promise<Uint8Array> {
  const p = path.join(cacheDir(), filename)
  if (existsSync(p)) {
    return new Uint8Array(readFileSync(p))
  }
  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Invitation PDF: could not download font (${res.status})`)
  }
  const buf = Buffer.from(await res.arrayBuffer())
  writeFileSync(p, buf)
  return new Uint8Array(buf)
}

function readNodeModuleFont(relativePath: string): Uint8Array {
  const p = path.join(process.cwd(), "node_modules", relativePath)
  return new Uint8Array(readFileSync(p))
}

/**
 * Embed a Unicode-capable font for the invitation locale. Call {@link PDFDocument.registerFontkit} before embed.
 */
export async function embedInvitePdfFont(
  pdfDoc: PDFDocument,
  locale: LandingLocale
): Promise<PDFFont> {
  let bytes: Uint8Array

  switch (locale) {
    case "ko":
      bytes = await ensureCachedOtf(CJK_OTF.kr.url, CJK_OTF.kr.file)
      break
    case "ja":
      bytes = await ensureCachedOtf(CJK_OTF.jp.url, CJK_OTF.jp.file)
      break
    case "zh":
      bytes = await ensureCachedOtf(CJK_OTF.tc.url, CJK_OTF.tc.file)
      break
    case "ar":
      bytes = readNodeModuleFont("@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff")
      break
    case "en":
    case "fr":
    case "es":
    default:
      bytes = readNodeModuleFont("@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff")
      break
  }

  return pdfDoc.embedFont(bytes, { subset: true })
}

export { fontkit }
