import type { LandingLocale } from "@/lib/landingTranslations"

/** Decorative iPhone frames on the landing “How it works” section — localized where provided. */
export type LandingMockupStrings = {
  createTitle: string
  createSubtitle: string
  createPerson: string
  createPet: string
  createCategoryNote: string
  createContinue: string
  memorialInLoving: string
  memorialSharePrompt: string
  scanToContribute: string
  scanNoApp: string
  copyLink: string
  connectGridTitle: string
  connectHeartMoments: string
  connectCommunityFooter: string
}

const EN_FALLBACK: LandingMockupStrings = {
  createTitle: "Who are we honoring?",
  createSubtitle: "A quiet space for someone you love.",
  createPerson: "Someone dear",
  createPet: "A companion",
  createCategoryNote: "For those who left footprints on our hearts (People & Pets)",
  createContinue: "Continue the Story",
  memorialInLoving: "In loving memory",
  memorialSharePrompt: "Share photos & stories",
  scanToContribute: "Scan to contribute",
  scanNoApp: "Scan or share link · no app",
  copyLink: "Copy link",
  connectGridTitle: "Memories",
  connectHeartMoments: "Heart the moments that matter",
  connectCommunityFooter: "Community favorites rise to the top",
}

const FR: LandingMockupStrings = {
  createTitle: "À qui rendons-nous hommage ?",
  createSubtitle: "Un espace paisible pour un être aimé.",
  createPerson: "Un être cher",
  createPet: "Un fidèle compagnon (Animal)",
  createCategoryNote: "Pour ceux qui ont laissé une empreinte indélébile dans nos cœurs.",
  createContinue: "Poursuivre l'histoire",
  memorialInLoving: "En mémoire de…",
  memorialSharePrompt: "Partager photos et souvenirs",
  scanToContribute: "Scannez pour contribuer",
  scanNoApp: "Scannez ou partagez le lien · Sans application",
  copyLink: "Copier le lien",
  connectGridTitle: "Souvenirs",
  connectHeartMoments: "Rendez hommage aux moments précieux",
  connectCommunityFooter: "Les souvenirs les plus aimés restent à la une",
}

const ES: LandingMockupStrings = {
  createTitle: "¿A quién estamos honrando?",
  createSubtitle: "Un espacio tranquilo para quien usted ama.",
  createPerson: "Alguien querido",
  createPet: "Un compañero fiel (Mascotas)",
  createCategoryNote: "Para quienes dejaron huella en nuestros corazones (Personas y Mascotas).",
  createContinue: "Continuar la historia",
  memorialInLoving: "En memoria amorosa",
  memorialSharePrompt: "Compartir fotos y recuerdos",
  scanToContribute: "Escanee para contribuir",
  scanNoApp: "Escanee o comparta el enlace · Sin app",
  copyLink: "Copiar enlace",
  connectGridTitle: "Recuerdos",
  connectHeartMoments: "Brinde un corazón a los momentos importantes",
  connectCommunityFooter: "Los favoritos de la comunidad destacan arriba",
}

const ZH: LandingMockupStrings = {
  createTitle: "您想為誰留下紀念？",
  createSubtitle: "為您深愛的人，建立一個寧靜的空間。",
  createPerson: "親愛的至親",
  createPet: "摯愛的伴侶（寵物）",
  createCategoryNote: "獻給那些在我們心中留下深遠足跡的生命（人與寵物）。",
  createContinue: "延續生命故事",
  memorialInLoving: "獻給永遠被懷念的你",
  memorialSharePrompt: "分享珍貴的照片與故事",
  scanToContribute: "掃描以分享回憶",
  scanNoApp: "掃描或分享連結 · 無需下載程式",
  copyLink: "複製連結",
  connectGridTitle: "回憶",
  connectHeartMoments: "為珍貴瞬間留下心意",
  connectCommunityFooter: "最動人的回憶將呈現於頂端",
}

const AR: LandingMockupStrings = {
  createTitle: "من الذي نُكرم ذكراه؟",
  createSubtitle: "مساحة هادئة لمن تحب.",
  createPerson: "شخص عزيز",
  createPet: "رفيق وفيّ (حيوان أليف)",
  createCategoryNote: "لمن تركوا بصماتهم في قلوبنا (بشر وحيوانات أليفة).",
  createContinue: "واصل الحكاية",
  memorialInLoving: "في ذكرى محبة خالدة",
  memorialSharePrompt: "شارك الصور والقصص",
  scanToContribute: "امسح الرمز للمشاركة",
  scanNoApp: "امسح الرمز أو شارك الرابط · بدون تطبيقات",
  copyLink: "نسخ الرابط",
  connectGridTitle: "الذكريات",
  connectHeartMoments: "تفاعل مع اللحظات الغالية",
  connectCommunityFooter: "الذكريات الأغلى تتصدر المشهد",
}

const JA: LandingMockupStrings = {
  createTitle: "どなたを偲びますか？",
  createSubtitle: "あなたが愛する人のための、静かな安らぎの空間。",
  createPerson: "大切な方",
  createPet: "共に歩んだ伴侶 (ペット)",
  createCategoryNote: "私たちの心に深い足跡を残した方々のために。（ご家族とペット）",
  createContinue: "物語を続ける",
  memorialInLoving: "永遠に記憶されるあなたへ",
  memorialSharePrompt: "写真と思い出を分かち合ってください",
  scanToContribute: "スキャンして思い出を添える",
  scanNoApp: "スキャンまたはリンクを共有 · アプリ不要",
  copyLink: "リンクをコピー",
  connectGridTitle: "思い出",
  connectHeartMoments: "大切な瞬間に想いを寄せる",
  connectCommunityFooter: "多くの愛を受けた記憶が上位に留まります",
}

export function getLandingMockupStrings(locale: LandingLocale): LandingMockupStrings {
  if (locale === "ja") return JA
  if (locale === "ar") return AR
  if (locale === "zh") return ZH
  if (locale === "es") return ES
  if (locale === "fr") return FR
  return EN_FALLBACK
}
