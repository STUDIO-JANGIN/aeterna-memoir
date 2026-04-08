"use client"

import { use, useEffect, useRef, useState, Suspense } from "react"
import confetti from "canvas-confetti"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { getPaymentSuccessAction } from "@/app/actions/getPaymentSuccess"
import { getInvitationCardDataAction, type InvitationCardData } from "@/app/actions/getInvitationCardData"
import { MemorialInvitationCard } from "@/components/MemorialInvitationCard"
import { MemorialShareActions } from "@/components/MemorialShareActions"
import { getAppBaseUrl } from "@/lib/appUrl"
import { supabase } from "@/lib/supabase/browser"
import { isMemorialOwner } from "@/lib/memorialOwnership"
import { clearCreateDraft, clearPendingCheckout } from "@/lib/createFlowStorage"

type PageProps = {
  params: Promise<{ slug: string }>
}

function SuccessContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [eventName, setEventName] = useState<string | null>(null)
  const [tier, setTier] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isOwner, setIsOwner] = useState(false)
  const [inviteMeta, setInviteMeta] = useState<InvitationCardData | null>(null)
  const confettiFired = useRef(false)

  useEffect(() => {
    let cancelled = false
    const loadOwner = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      const u = session?.user
      if (!u) {
        if (!cancelled) setIsOwner(false)
        return
      }
      const { data: row } = await supabase
        .from("events")
        .select("creator_user_id, creator_email")
        .eq("slug", slug)
        .maybeSingle()
      if (cancelled || !row) {
        if (!cancelled) setIsOwner(false)
        return
      }
      setIsOwner(
        isMemorialOwner(
          { id: u.id, email: u.email ?? null },
          {
            creator_user_id: row.creator_user_id ?? null,
            creator_email: row.creator_email ?? null,
          },
        ),
      )
    }
    loadOwner()
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      loadOwner()
    })
    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [slug])

  useEffect(() => {
    if (!sessionId?.trim()) {
      setStatus("error")
      setErrorMessage("We couldn’t find a valid payment session. If you completed checkout, use the link from your email or return to your memorial.")
      return
    }

    let cancelled = false
    const maxAttempts = 3
    const delayMs = 1500

    const attempt = (attemptNumber: number) => {
      getPaymentSuccessAction(sessionId, slug).then((result) => {
        if (cancelled) return
        if (result.ok) {
          clearPendingCheckout()
          clearCreateDraft()
          setDownloadUrl(result.downloadUrl)
          setEventName(result.eventName)
          setTier(result.tier)
          setStatus("success")
          return
        }
        const isRetryable =
          result.error?.includes("not found") ||
          result.error?.includes("not available") ||
          result.error?.includes("not completed")
        if (isRetryable && attemptNumber < maxAttempts) {
          setTimeout(() => attempt(attemptNumber + 1), delayMs)
        } else {
          setErrorMessage(result.error ?? "We couldn’t confirm your payment yet. Please wait a moment and refresh, or contact support if this continues.")
          setStatus("error")
        }
      })
    }

    attempt(1)
    return () => {
      cancelled = true
    }
  }, [sessionId, slug])

  useEffect(() => {
    if (status !== "success") return
    let cancelled = false
    getInvitationCardDataAction(slug).then((data) => {
      if (!cancelled) setInviteMeta(data)
    })
    return () => {
      cancelled = true
    }
  }, [status, slug])

  useEffect(() => {
    if (status !== "success" || confettiFired.current) return
    confettiFired.current = true
    const id = requestAnimationFrame(() => {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { x: 0.5, y: 0.42 },
        colors: ["#D4AF37", "#F5F5F7"],
        gravity: 0.35,
        ticks: 520,
        scalar: 1,
      })
    })
    return () => cancelAnimationFrame(id)
  }, [status])

  const displayName = eventName?.trim() || "your loved one"
  const inviteName = eventName?.trim() || "Your loved one"
  const baseUrl = getAppBaseUrl()
  const guestUrl = `${baseUrl}/p/${slug}`

  return (
    <div className="min-h-dvh overflow-y-auto overscroll-contain bg-[color:var(--landing-bg)] text-[#e8e4dc] font-[var(--font-sans)]">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center px-6 pb-[max(7.5rem,env(safe-area-inset-bottom))] pt-12 text-center sm:pt-16 md:pb-16">
        {status === "loading" && (
          <>
            <p className="font-[var(--font-serif)] text-lg text-[#a3a3a3] leading-relaxed">
              Thank you — we&apos;re confirming your payment.
            </p>
            <p className="mt-4 text-sm text-[#737373]">This usually takes just a few seconds.</p>
          </>
        )}

        {status === "success" && (
          <>
            <p className="text-[10px] tracking-[0.35em] uppercase text-[#737373] mb-4">Payment received</p>
            <h1 className="font-[var(--font-serif)] text-2xl md:text-3xl font-normal text-[#f4f1ea] leading-snug tracking-tight">
              Their story is safe with you.
            </h1>
            <p className="mt-6 text-sm md:text-base text-[#a3a3a3] leading-relaxed max-w-md">
              We know how tender this moment is. Your support helps keep {displayName}&apos;s memorial present for everyone who loved them — quietly, respectfully, and for as long as you choose.
            </p>

            {tier === "premium" && (
              <p className="mt-4 text-sm text-[#8a8a8a] max-w-md">
                <span className="text-[var(--aeterna-gold)]">Premium</span> includes your cinematic tribute. When the film is ready, it will appear on the memorial and in your dashboard.
              </p>
            )}
            {tier === "plus" && (
              <p className="mt-4 text-sm text-[#8a8a8a] max-w-md">
                <span className="text-[var(--aeterna-gold)]">Plus</span> preserves every photo and story permanently. You can upgrade to Premium later if you&apos;d like the AI film.
              </p>
            )}

            <div className="mt-10 flex w-full flex-col items-center border-t border-white/[0.08] pt-10">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#737373] mb-6 shrink-0">Share the memorial</p>
              <MemorialShareActions name={inviteName} guestUrl={guestUrl} className="mx-auto mb-10 shrink-0" />
              <MemorialInvitationCard
                name={inviteMeta?.name?.trim() || inviteName}
                slug={slug}
                guestUrl={guestUrl}
                className="mx-auto w-full"
                birthDate={inviteMeta?.birth_date ?? undefined}
                deathDate={inviteMeta?.death_date ?? undefined}
                location={inviteMeta?.location ?? undefined}
                ceremonyTime={inviteMeta?.ceremony_time ?? undefined}
                fundLink={inviteMeta?.flower_link ?? undefined}
                profileImageUrl={inviteMeta?.profile_image ?? undefined}
                remembranceBio={inviteMeta?.invitation_bio ?? undefined}
              />
            </div>

            <div className="mt-10 w-full text-left max-w-md mx-auto">
              <p className="text-[11px] tracking-[0.2em] uppercase text-[#737373] mb-4">Next steps</p>
              <ol className="space-y-4 text-sm text-[#a3a3a3] leading-relaxed list-decimal list-inside marker:text-[var(--aeterna-gold)]">
                <li>Save or print your memorial invitation (9:16) for a program, table card, or keepsake.</li>
                <li>Share the link with family and friends — they can contribute from any phone, no app required.</li>
                <li>Visit your dashboard to manage details and, when it&apos;s ready, your tribute film.</li>
              </ol>
            </div>

            {downloadUrl ? (
              <a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-8 inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--aeterna-gold)]/50 px-8 text-xs tracking-[0.16em] uppercase text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold)]/10 transition-colors"
              >
                Open film / download
              </a>
            ) : null}

            <div className="mt-12 hidden md:flex flex-wrap items-center justify-center gap-3">
              <Link
                href={`/p/${slug}`}
                className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#030303] px-8 text-[11px] font-medium tracking-[0.18em] uppercase text-[#f5f5f4] border border-white/10 hover:bg-[#0c0c0c] transition-colors duration-300 ease-in-out"
              >
                View memorial
              </Link>
              {isOwner && (
                <Link
                  href={`/p/${slug}/admin`}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-white/[0.15] px-8 text-[11px] tracking-[0.16em] uppercase text-[#a3a3a3] hover:bg-white/[0.04] transition-colors"
                >
                  Open dashboard
                </Link>
              )}
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="font-[var(--font-serif)] text-xl text-[#f4f1ea] mb-4">We couldn&apos;t finish confirming</h1>
            <p className="text-sm text-[#a3a3a3] leading-relaxed mb-8 max-w-md">{errorMessage}</p>
            <Link
              href={`/p/${slug}`}
              className="inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--aeterna-gold)]/50 px-8 text-xs tracking-[0.16em] uppercase text-[var(--aeterna-gold)] hover:bg-[var(--aeterna-gold)]/10 transition-colors"
            >
              Back to memorial
            </Link>
          </>
        )}
      </div>

      {/* Mobile: primary actions at bottom */}
      {status === "success" && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-white/[0.08] bg-[color:var(--landing-bg)]/95 backdrop-blur-md px-5 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <div className="flex flex-col gap-2 max-w-lg mx-auto">
            <Link
              href={`/p/${slug}`}
              className="flex w-full min-h-[52px] items-center justify-center rounded-full bg-[#030303] text-[#f5f5f4] text-[11px] font-medium tracking-[0.18em] uppercase border border-white/10 hover:bg-[#0c0c0c] transition-colors duration-300 ease-in-out"
            >
              View memorial
            </Link>
            {isOwner && (
              <Link
                href={`/p/${slug}/admin`}
                className="flex w-full min-h-[48px] items-center justify-center rounded-full text-[11px] tracking-[0.16em] uppercase text-[#a3a3a3] hover:text-[#e8e4dc] transition-colors"
              >
                Open dashboard
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function SuccessPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = resolvedParams.slug

  return (
    <Suspense
      fallback={
        <div className="min-h-dvh bg-[color:var(--landing-bg)] flex items-center justify-center">
          <p className="text-[#737373] text-sm tracking-wide">Loading…</p>
        </div>
      }
    >
      <SuccessContent slug={slug} />
    </Suspense>
  )
}
