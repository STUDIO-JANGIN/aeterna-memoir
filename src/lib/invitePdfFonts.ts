import { readFileSync, existsSync, mkdirSync, writeFileSync } from "fs"
import path from "path"
import fontkit from "@pdf-lib/fontkit"
import type { PDFDocument } from "pdf-lib"
import type { PDFFont } from "pdf-lib"
import type { LandingLocale } from "@/lib/landingTranslations"

/**
 * Pin to published npm versions so jsDelivr URLs stay stable.
 * Local dev can read from `node_modules`; Vercel often omits these files from the
 * serverless bundle when only accessed by string path — fetch fallback fixes ENOENT.
 */
const FONTSOURCE_NOTO_SANS_VERSION = "5.2.10"
const FONTSOURCE_NOTO_SANS_ARABIC_VERSION = "5.2.10"

const REMOTE_WOFF_NOTO_SANS_LATIN_400 = `https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@${FONTSOURCE_NOTO_SANS_VERSION}/files/noto-sans-latin-400-normal.woff`
const REMOTE_WOFF_NOTO_SANS_LATIN_700 = `https://cdn.jsdelivr.net/npm/@fontsource/noto-sans@${FONTSOURCE_NOTO_SANS_VERSION}/files/noto-sans-latin-700-normal.woff`
const REMOTE_WOFF_NOTO_SANS_ARABIC_400 = `https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@${FONTSOURCE_NOTO_SANS_ARABIC_VERSION}/files/noto-sans-arabic-arabic-400-normal.woff`
const REMOTE_WOFF_NOTO_SANS_ARABIC_700 = `https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-arabic@${FONTSOURCE_NOTO_SANS_ARABIC_VERSION}/files/noto-sans-arabic-arabic-700-normal.woff`

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
  const base =
    preferRemoteFontsOnly() && typeof process.env.TMPDIR === "string" && process.env.TMPDIR.length > 0
      ? process.env.TMPDIR
      : preferRemoteFontsOnly()
        ? "/tmp"
        : path.join(process.cwd(), ".cache", "fonts")
  const dir = preferRemoteFontsOnly() ? path.join(base, "aeterna-fonts") : base
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

function readNodeModuleFontIfPresent(relativePath: string): Uint8Array | null {
  const p = path.join(process.cwd(), "node_modules", relativePath)
  if (!existsSync(p)) return null
  try {
    return new Uint8Array(readFileSync(p))
  } catch {
    return null
  }
}

/** Vercel/AWS omit many `node_modules` assets from the serverless bundle; local paths often ENOENT at runtime. */
function preferRemoteFontsOnly(): boolean {
  return process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME)
}

async function loadWoffFontBytes(opts: {
  nodeModulesRelativePath: string
  remoteUrl: string
}): Promise<Uint8Array> {
  if (!preferRemoteFontsOnly()) {
    const local = readNodeModuleFontIfPresent(opts.nodeModulesRelativePath)
    if (local) return local
  }
  const res = await fetch(opts.remoteUrl)
  if (!res.ok) {
    throw new Error(`Invitation PDF: could not load font (${res.status})`)
  }
  return new Uint8Array(await res.arrayBuffer())
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
      bytes = await loadWoffFontBytes({
        nodeModulesRelativePath: "@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-400-normal.woff",
        remoteUrl: REMOTE_WOFF_NOTO_SANS_ARABIC_400,
      })
      break
    case "en":
    case "fr":
    case "es":
    default:
      bytes = await loadWoffFontBytes({
        nodeModulesRelativePath: "@fontsource/noto-sans/files/noto-sans-latin-400-normal.woff",
        remoteUrl: REMOTE_WOFF_NOTO_SANS_LATIN_400,
      })
      break
  }

  return pdfDoc.embedFont(bytes, { subset: true })
}

/**
 * Bold weight for labels and emphasis (Latin / Arabic). CJK locales return `null` — use faux-bold (color/size) in the caller.
 */
export async function embedInvitePdfFontBold(
  pdfDoc: PDFDocument,
  locale: LandingLocale
): Promise<PDFFont | null> {
  let bytes: Uint8Array

  switch (locale) {
    case "ko":
    case "ja":
    case "zh":
      return null
    case "ar":
      bytes = await loadWoffFontBytes({
        nodeModulesRelativePath: "@fontsource/noto-sans-arabic/files/noto-sans-arabic-arabic-700-normal.woff",
        remoteUrl: REMOTE_WOFF_NOTO_SANS_ARABIC_700,
      })
      break
    case "en":
    case "fr":
    case "es":
    default:
      bytes = await loadWoffFontBytes({
        nodeModulesRelativePath: "@fontsource/noto-sans/files/noto-sans-latin-700-normal.woff",
        remoteUrl: REMOTE_WOFF_NOTO_SANS_LATIN_700,
      })
      break
  }

  return pdfDoc.embedFont(bytes, { subset: true })
}

export { fontkit }
