import type { LandingLocale } from "@/lib/landingTranslations"

/**
 * “Connect & Relive” phone mockup: six memory tiles per locale — varied settings (portrait, outdoor,
 * pets, archive, bond, gathering). EN/FR/ES: North American / Western-inclusive contexts. AR: Gulf–Levant
 * family contexts. KO/JA/ZH: East Asian set.
 */
export type LandingConnectMoment = {
  id: string
  src: string
  position: string
  hearts: number
  alt: string
  caption: string
  imgClassName?: string
}

/** English + French + Spanish landing: diverse Western / inclusive North American–style moments + pets. */
const ENGLISH_CONNECT_MOMENTS: LandingConnectMoment[] = [
  {
    id: "en-portrait-anchor",
    src: "/landing-hero-blasian-patriarch.png",
    position: "center 22%",
    hearts: 48,
    alt: "Warm studio portrait of an elder, calm and present — the kind of image families choose as the main tribute photo.",
    caption: "The portrait · Heart of the story",
  },
  {
    id: "en-outdoor",
    src: "/landing-connect-en-outdoor.png",
    position: "center 34%",
    hearts: 22,
    alt: "An elder outdoors in a sunny yard or garden: seasons, hobbies, and everyday joy remembered.",
    caption: "Outdoors · Sun & seasons",
  },
  {
    id: "en-pets",
    src: "/landing-hero-pets.png",
    position: "center 40%",
    hearts: 36,
    alt: "Dogs and cats together — companions who shared a home alongside family memories.",
    caption: "The pets · Who walked with them",
  },
  {
    id: "en-archive",
    src: "/landing-connect-en-vintage.png",
    position: "center 32%",
    hearts: 11,
    alt: "A faded photograph from decades past: another chapter from the family archive.",
    caption: "The years · From the archive",
    imgClassName: "grayscale contrast-[1.08] sepia-[0.42] brightness-[0.98]",
  },
  {
    id: "en-bond",
    src: "/landing-connect-en-bond.png",
    position: "center 30%",
    hearts: 29,
    alt: "A candid moment with a dog at home — people and pets woven into one story.",
    caption: "The bond · People & pets",
  },
  {
    id: "en-gathering",
    src: "/landing-connect-en-gathering.png",
    position: "center 36%",
    hearts: 52,
    alt: "Family and friends around a table: laughter and warmth across generations.",
    caption: "The gathering · Laughter & light",
    imgClassName: "scale-105 brightness-[1.04] saturate-[1.08] blur-[0.4px]",
  },
]

/** Arabic landing: Gulf–Levant family life — hijab portrait anchor, varied indoor/outdoor, pets, archive. */
const ARABIC_CONNECT_MOMENTS: LandingConnectMoment[] = [
  {
    id: "ar-portrait-anchor",
    src: "/landing-hero-saudi-grandmother-hijab.png",
    position: "center 28%",
    hearts: 48,
    alt: "Warm portrait of an elder woman in hijab (hair covered, face visible), looking toward the viewer with kindness.",
    caption: "The portrait · Heart of the story",
  },
  {
    id: "ar-outdoor",
    src: "/landing-connect-ar-outdoor.png",
    position: "center 34%",
    hearts: 22,
    alt: "An elder in a sunlit courtyard or garden: quiet pride, seasons, and home remembered.",
    caption: "Outdoors · Light & place",
  },
  {
    id: "ar-pets",
    src: "/landing-hero-pets.png",
    position: "center 40%",
    hearts: 36,
    alt: "Cats and dogs together — companions who shared the home with the family.",
    caption: "The pets · Who walked with them",
  },
  {
    id: "ar-archive",
    src: "/landing-connect-ar-vintage.png",
    position: "center 32%",
    hearts: 11,
    alt: "A nostalgic family-era photograph from the album: another chapter brought forward with love.",
    caption: "The years · From the archive",
    imgClassName: "grayscale contrast-[1.08] sepia-[0.42] brightness-[0.98]",
  },
  {
    id: "ar-bond",
    src: "/landing-connect-ar-bond.png",
    position: "center 30%",
    hearts: 29,
    alt: "A quiet moment at home with a pet — warmth and companionship in everyday life.",
    caption: "The bond · People & pets",
  },
  {
    id: "ar-gathering",
    src: "/landing-connect-ar-gathering.png",
    position: "center 36%",
    hearts: 52,
    alt: "Generations gathered for tea or a meal: hospitality, laughter, and shared memory.",
    caption: "The gathering · Togetherness",
    imgClassName: "scale-105 brightness-[1.04] saturate-[1.08] blur-[0.4px]",
  },
]

const EAST_ASIA_CONNECT_MOMENTS: LandingConnectMoment[] = [
  {
    id: "ea-portrait-anchor",
    src: "/landing-hero-east-asian-grandmother.png",
    position: "center 28%",
    hearts: 48,
    alt: "Warm studio-style portrait of an East Asian elder looking toward the viewer, calm and present.",
    caption: "The portrait · Heart of the story",
  },
  {
    id: "ea-outdoor-light",
    src: "/landing-connect-east-outdoor.png",
    position: "center 35%",
    hearts: 22,
    alt: "An elder outdoors in soft daylight, garden or park: seasons and simple joys remembered.",
    caption: "Outdoors · Air & seasons",
  },
  {
    id: "ea-pets-family",
    src: "/landing-hero-pets.png",
    position: "center 40%",
    hearts: 36,
    alt: "Dogs and cats together, companions who shared a home alongside family memories.",
    caption: "The pets · Who walked with them",
  },
  {
    id: "ea-archive-years",
    src: "/landing-connect-east-vintage.png",
    position: "center 32%",
    hearts: 11,
    alt: "A faded family-era photograph: another chapter from the archive, brought forward with love.",
    caption: "The years · From the archive",
    imgClassName: "grayscale contrast-[1.08] sepia-[0.42] brightness-[0.98]",
  },
  {
    id: "ea-bond-companion",
    src: "/landing-connect-east-bond.png",
    position: "center 30%",
    hearts: 29,
    alt: "A candid moment with a dog at home: people and pets woven into one story.",
    caption: "The bond · People & pets",
  },
  {
    id: "ea-gathering-joy",
    src: "/landing-connect-east-gathering.png",
    position: "center 36%",
    hearts: 52,
    alt: "Family gathered around a table: laughter and warmth across generations.",
    caption: "The gathering · Laughter & light",
    imgClassName: "scale-105 brightness-[1.04] saturate-[1.1] blur-[0.4px]",
  },
]

export function getLandingConnectMoments(locale: LandingLocale): LandingConnectMoment[] {
  switch (locale) {
    case "ko":
    case "ja":
    case "zh":
      return EAST_ASIA_CONNECT_MOMENTS
    case "ar":
      return ARABIC_CONNECT_MOMENTS
    case "en":
    case "fr":
    case "es":
      return ENGLISH_CONNECT_MOMENTS
    default:
      return ENGLISH_CONNECT_MOMENTS
  }
}
