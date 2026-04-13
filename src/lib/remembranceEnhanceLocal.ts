import type { LandingLocale } from "@/lib/landingTranslations"

type Persona = "poetic" | "formal" | "warm"

/** Offline fallback — order is always [poetic, formal, warm]. */
export function buildLocalRemembranceVariants(
  text: string,
  name?: string | null,
  locale: LandingLocale = "en",
): [string, string, string] {
  const raw = text.replace(/\s+/g, " ").trim()
  const core = raw.length ? raw.charAt(0).toUpperCase() + raw.slice(1) : raw
  const punctuated = /[.!?…]$/.test(core) ? core : `${core}.`
  const n = name?.trim()

  switch (locale) {
    case "ko":
      return buildKo(punctuated, n)
    case "ja":
      return buildJa(punctuated, n)
    case "zh":
    case "zh-hk":
      return buildZh(punctuated, n)
    case "fr":
      return buildFr(punctuated, n)
    case "es":
      return buildEs(punctuated, n)
    case "ar":
      return buildAr(punctuated, n)
    default:
      return buildEn(punctuated, n)
  }
}

function buildEn(punctuated: string, n?: string): [string, string, string] {
  const poetic = n
    ? `${punctuated}\n\nLike starlight that does not fall, ${n} remains in the fold of our seasons — a fragrance the years return to quietly.`
    : `${punctuated}\n\nLike light that lingers past dusk, this love does not end — it walks beside us in quiet seasons.`

  const formal = n
    ? `With profound respect we honor ${n}. Their legacy rests among us as a pillar of grace.\n\n${punctuated}`
    : `With profound respect we honor this life, preserved in dignity and memory.\n\n${punctuated}`

  const warm = n
    ? `${punctuated}\n\n${n} — your smile still warms the room we share; thank you for the ordinary days that became our treasure.`
    : `${punctuated}\n\nThank you for the warmth you gave; your light continues to guide us in the small moments.`

  return [poetic, formal, warm]
}

function buildKo(punctuated: string, n?: string): [string, string, string] {
  const poetic = n
    ? `${punctuated}\n\n계절이 바뀌어도 가시지 않는 별빛처럼, ${n} 님의 향기는 마음 깊은 곳에 머뭅니다.`
    : `${punctuated}\n\n세월 속에서도 잊히지 않는 온기로, 그 빛은 계속 이어집니다.`

  const formal = n
    ? `${n} 님을 숭고한 경의와 함께 기억합니다. 남기신 발자취는 가족의 마음속에 영원히 함께합니다.\n\n${punctuated}`
    : `경의를 담아 이 생을 기억합니다.\n\n${punctuated}`

  const warm = n
    ? `${punctuated}\n\n${n} 님, 곁에서 나누던 따뜻한 순간들이 오늘도 저희를 감싸 안습니다.`
    : `${punctuated}\n\n나눠 주신 온기에 감사드리며, 그 빛이 계속 이어지기를 바랍니다.`

  return [poetic, formal, warm]
}

function buildJa(punctuated: string, n?: string): [string, string, string] {
  const poetic = n
    ? `${punctuated}\n\n櫻のように静かに、${n} 様の絆は心に残り、季節を超えて寄り添います。`
    : `${punctuated}\n\n心に灯る想いは、時を越えてそっと寄り添い続けます。`

  const formal = n
    ? `${n} 様を謹んでお偲び申し上げます。遺された歩みは、私どもの敬愛とともに記憶に刻まれます。\n\n${punctuated}`
    : `謹んでお偲び申し上げます。\n\n${punctuated}`

  const warm = n
    ? `${punctuated}\n\n${n} 様の微笑みが、日々のなかで今も私たちを温かく包んでいます。`
    : `${punctuated}\n\n共に過ごした日々のぬくもりに、心から感謝申し上げます。`

  return [poetic, formal, warm]
}

function buildZh(punctuated: string, n?: string): [string, string, string] {
  const poetic = n
    ? `${punctuated}\n\n如星霜無聲，${n} 留下的光與馨香，仍在歲月深處與我們相依。`
    : `${punctuated}\n\n時光流轉，那份溫柔仍如微光，靜靜照見我們。`

  const formal = n
    ? `謹以崇仰之心，追念 ${n}。遺風長存，願其德澤永誌於家屬之心。\n\n${punctuated}`
    : `謹此追念，願其精神長存。\n\n${punctuated}`

  const warm = n
    ? `${punctuated}\n\n${n}，您留下的笑顏與日常，仍是我們最珍貴的依靠。`
    : `${punctuated}\n\n感念您所賜予的點滴溫暖，願此光延續。`

  return [poetic, formal, warm]
}

function buildFr(punctuated: string, n?: string): [string, string, string] {
  const poetic = n
    ? `${punctuated}\n\nComme l'écho d'une âme qui demeure, ${n} continue de nous traverser en douceur.`
    : `${punctuated}\n\nComme une lumière qui ne s'éteint pas, l'amour demeure.`

  const formal = n
    ? `Nous honorons ${n} avec une solennité profonde ; son héritage demeure parmi nous.\n\n${punctuated}`
    : `Nous honorons cette vie avec respect et dignité.\n\n${punctuated}`

  const warm = n
    ? `${punctuated}\n\n${n} — votre sourire réchauffe encore nos jours ordinaires ; merci pour ce que vous avez été.`
    : `${punctuated}\n\nMerci pour la chaleur partagée ; votre présence nous guide encore.`

  return [poetic, formal, warm]
}

function buildEs(punctuated: string, n?: string): [string, string, string] {
  const poetic = n
    ? `${punctuated}\n\nComo un eco que no se apaga, ${n} sigue habitando la memoria con honor y ternura.`
    : `${punctuated}\n\nComo luz que permanece, el amor sigue guiándonos.`

  const formal = n
    ? `Honramos a ${n} con la dignidad y el respeto que merece; su legado permanece entre nosotros.\n\n${punctuated}`
    : `Honramos esta vida con solemnidad y gratitud.\n\n${punctuated}`

  const warm = n
    ? `${punctuated}\n\n${n}: su sonrisa sigue calentando los días sencillos que compartimos.`
    : `${punctuated}\n\nGracias por la calidez dejada; su luz nos guía aún.`

  return [poetic, formal, warm]
}

function buildAr(punctuated: string, n?: string): [string, string, string] {
  const poetic = n
    ? `${punctuated}\n\nكضوءٍ لا يُطفأ، يبقى ذكر ${n} فينا كتراثٍ رقيق يتردد مع الأعوام.`
    : `${punctuated}\n\nكالنور الذي يدوم، تبقى المحبة في القلب رغم مرور الزمن.`

  const formal = n
    ? `نستذكر ${n} بوقارٍ وعظيم احترام؛ تراثُهُ يلهمنا ويبقى بيننا.\n\n${punctuated}`
    : `نستذكر هذا العمر بوقارٍ وعرفانٍ بالجميل.\n\n${punctuated}`

  const warm = n
    ? `${punctuated}\n\n${n} — بسمُك لا يزال يدفئ أيامنا البسيطة؛ شكراً لما وهبتَنا من دفء.`
    : `${punctuated}\n\nشكراً للدفء الذي تركتَه؛ نورُك ما زال يهدينا.`

  return [poetic, formal, warm]
}

export function refineLocalRemembrance(
  text: string,
  name: string | undefined,
  locale: LandingLocale,
  persona: Persona,
): string {
  const [p, f, w] = buildLocalRemembranceVariants(text, name, locale)
  return persona === "poetic" ? p : persona === "formal" ? f : w
}
