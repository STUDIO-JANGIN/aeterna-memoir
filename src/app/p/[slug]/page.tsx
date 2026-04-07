import type { Metadata } from "next"
import { Suspense } from "react"
import { getEventBySlug } from "@/app/actions/setStorySelected"
import { getAppBaseUrl } from "@/lib/appUrl"
import GuestFeedPage from "./MemorialGuestFeedClient"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const slugNorm = typeof slug === "string" ? slug.trim() : ""
  let personName = "A loved one"
  if (slugNorm) {
    try {
      const event = await getEventBySlug(slugNorm)
      if (event?.name?.trim()) personName = event.name.trim()
    } catch {
      // keep fallback name for metadata only
    }
  }

  const title = `${personName} | Aeterna Memoir`
  const description = `A tribute page dedicated to the memory of ${personName}.`
  const base = getAppBaseUrl()
  const path = `/p/${encodeURIComponent(slugNorm)}`
  const url = `${base}${path}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url,
      siteName: "Aeterna Memoir",
      type: "website",
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: url,
    },
  }
}

export default function MemorialPage(props: Props) {
  return (
    <Suspense fallback={<div className="min-h-dvh bg-[var(--once-bg)]" aria-hidden />}>
      <GuestFeedPage {...props} />
    </Suspense>
  )
}
