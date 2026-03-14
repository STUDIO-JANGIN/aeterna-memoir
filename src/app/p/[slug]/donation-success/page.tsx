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
      setErrorMessage("유효하지 않은 결제 정보입니다.")
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
        // 즉시 추모 페이지로 복귀 (URL 파라미터로 블러 해제 + 토스트 트리거)
        const t = setTimeout(() => {
          router.replace(`/p/${slug}?donation=success`)
        }, 1200)
        return () => clearTimeout(t)
      } else {
        setErrorMessage(result.error ?? "결제 확인에 실패했습니다.")
        setStatus("error")
      }
    })
    return () => {
      cancelled = true
    }
  }, [sessionId, slug, router])

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] font-serif flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        {status === "loading" && (
          <p className="text-[var(--aeterna-gold-muted)] tracking-[0.15em] uppercase text-sm">
            결제를 확인하고 있습니다…
          </p>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-4">
              따뜻한 후원 감사합니다.
            </h1>
            <p className="text-[var(--aeterna-body)] text-sm leading-relaxed mb-6">
              계좌 정보를 확인하실 수 있습니다. 잠시 후 추모 페이지로 이동합니다.
            </p>
            <Link
              href={`/p/${slug}?donation=success`}
              className="inline-flex min-h-[48px] px-6 py-3 rounded-xl border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors"
            >
              추모 페이지로 이동
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-light text-white mb-4">
              결제 확인에 실패했습니다
            </h1>
            <p className="text-[var(--aeterna-body)] text-sm mb-6">
              {errorMessage}
            </p>
            <Link
              href={`/p/${slug}`}
              className="inline-flex min-h-[48px] px-6 py-3 rounded-xl border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors"
            >
              추모 페이지로 돌아가기
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
        <div className="min-h-screen bg-[var(--aeterna-charcoal)] flex items-center justify-center">
          <p className="text-[var(--aeterna-gold-muted)] text-sm">로딩 중…</p>
        </div>
      }
    >
      <DonationSuccessContent slug={slug} />
    </Suspense>
  )
}

export { DONATION_STORAGE_PREFIX }
