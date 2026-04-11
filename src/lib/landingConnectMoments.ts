import type { LandingLocale } from "@/lib/landingTranslations"

/**
 * “Connect & Relive” phone mockup: six memory tiles. Default uses inclusive global campaign art.
 * KO/JA/ZH: East Asian–led scenes + pets tile, varied settings (portrait, outdoor, archive, bond, gathering).
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

const DEFAULT_CONNECT_MOMENTS: LandingConnectMoment[] = [
  {
    id: "portrait-anchor",
    src: "/landing-hero-blasian-patriarch.png",
    position: "center 22%",
    hearts: 48,
    alt: "Warm studio portrait of an elder, calm and present: the kind of image families choose as the main tribute photo.",
    caption: "The portrait · Center of the story",
  },
  {
    id: "garden-light",
    src: "/landing-connect-grandma-02.png",
    position: "center 30%",
    hearts: 22,
    alt: "A loved one outdoors in a straw hat with bright flowers, sun on their face, hobbies and seasons remembered.",
    caption: "The garden · Sun & seasons",
  },
  {
    id: "pets-family",
    src: "/landing-hero-pets.png",
    position: "center 40%",
    hearts: 36,
    alt: "Dogs and cats together, the companions who shared a home: pet memories beside human ones on the same wall.",
    caption: "The pets · Who walked with them",
  },
  {
    id: "archive-years",
    src: "/landing-connect-grandma-04.png",
    position: "center 32%",
    hearts: 11,
    alt: "Faded color photo from decades past: early adulthood, a different chapter brought forward by family.",
    caption: "The years · From the archive",
    imgClassName: "grayscale contrast-[1.08] sepia-[0.42] brightness-[0.98]",
  },
  {
    id: "bond-companion",
    src: "/landing-connect-grandma-03.png",
    position: "center 28%",
    hearts: 29,
    alt: "A candid hug with a golden retriever: friends, neighbors, and animals woven into one story.",
    caption: "The bond · People & pets",
  },
  {
    id: "gathering-joy",
    src: "/landing-hero-grandmother.png",
    position: "center 34%",
    hearts: 52,
    alt: "A playful celebration snapshot: laughter at a table, the side of a life guests remember best.",
    caption: "The gathering · Laughter & light",
    imgClassName: "scale-105 brightness-[1.06] saturate-[1.12] blur-[0.5px]",
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
  if (locale === "ko" || locale === "ja" || locale === "zh") {
    return EAST_ASIA_CONNECT_MOMENTS
  }
  return DEFAULT_CONNECT_MOMENTS
}
