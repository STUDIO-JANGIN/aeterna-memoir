"use client"

import { use, useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import { verifyDonationAction } from "@/app/actions/verifyDonation"

const DONATION_STORAGE_PREFIX = "aeterna_donation_"

type PageProps = {
  params: Promise<{ slug: string }>
}

function DonationSuccessContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId?.trim()) {
      setStatus("error")
      setErrorMessage("This payment session is invalid.")
      return
    }

    let cancelled = false
    verifyDonationAction(sessionId, slug).then((result) => {
      if (cancelled) return
      if (result.ok) {
        try {
          localStorage.setItem(`${DONATION_STORAGE_PREFIX}${slug}`, "1")
        } catch {
          // ignore
        }
        setStatus("success")
        // Return to memorial page right away (URL param triggers unlock + toast).
        const t = setTimeout(() => {
          router.replace(`/p/${slug}?donation=success`)
        }, 1200)
        return () => clearTimeout(t)
      } else {
        setErrorMessage(result.error ?? "We couldn’t verify the payment.")
        setStatus("error")
      }
    })
    return () => {
      cancelled = true
    }
  }, [sessionId, slug, router])

  return (
    <div className="min-h-dvh bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] font-serif flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        {status === "loading" && (
          <p className="text-[var(--aeterna-gold-muted)] tracking-[0.15em] uppercase text-sm">
            Verifying payment…
          </p>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-4">
              Thank you for your thoughtful support.
            </h1>
            <p className="text-[var(--aeterna-body)] text-sm leading-relaxed mb-6">
              You can now view the account details. Redirecting to the memorial page…
            </p>
            <Link
              href={`/p/${slug}?donation=success`}
              className="inline-flex min-h-[48px] px-6 py-3 rounded-xl border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors"
            >
              Go to memorial page
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-light text-white mb-4">
              Payment verification failed
            </h1>
            <p className="text-[var(--aeterna-body)] text-sm mb-6">
              {errorMessage}
            </p>
            <Link
              href={`/p/${slug}`}
              className="inline-flex min-h-[48px] px-6 py-3 rounded-xl border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors"
            >
              Back to memorial page
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function DonationSuccessPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug

  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[var(--aeterna-charcoal)] flex items-center justify-center">
          <p className="text-[var(--aeterna-gold-muted)] text-sm">Loading…</p>
        </div>
      }
    >
      <DonationSuccessContent slug={slug} />
    </Suspense>
  )
}
