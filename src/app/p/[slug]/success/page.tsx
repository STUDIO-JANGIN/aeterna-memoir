"use client"

import { use, useEffect, useState, Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { getPaymentSuccessAction } from "@/app/actions/getPaymentSuccess"

type PageProps = {
  params: Promise<{ slug: string }>
}

function SuccessContent({ slug }: { slug: string }) {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [eventName, setEventName] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!sessionId?.trim()) {
      setStatus("error")
      setErrorMessage("결제 세션이 유효하지 않습니다.")
      return
    }

    let cancelled = false
    getPaymentSuccessAction(sessionId, slug).then((result) => {
      if (cancelled) return
      if (result.ok) {
        setDownloadUrl(result.downloadUrl)
        setEventName(result.eventName)
        setStatus("success")
      } else {
        setErrorMessage(result.error ?? "결제 확인에 실패했습니다.")
        setStatus("error")
      }
    })
    return () => {
      cancelled = true
    }
  }, [sessionId, slug])

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal)] text-[var(--aeterna-headline)] font-serif flex flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg w-full text-center">
        {status === "loading" && (
          <p className="text-[var(--aeterna-gold-muted)] tracking-[0.15em] uppercase text-sm">
            결제 정보를 확인 중입니다...
          </p>
        )}

        {status === "success" && (
          <>
            <h1 className="text-2xl md:text-3xl font-light tracking-wide text-white mb-3">
              결제가 완료되었습니다
            </h1>
            <p className="text-[var(--aeterna-body)] text-sm leading-relaxed mb-6">
              이제 이 추억들은 <span className="text-[var(--aeterna-gold)]">영구 보관</span>됩니다.
              시간과 기기가 바뀌어도, 언제든 다시 방문하셔도 기록이 사라지지 않습니다.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-8">
              <Link
                href={`/p/${slug}`}
                className="inline-flex min-h-[48px] px-6 py-3 rounded-xl border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors"
              >
                지인 추모 페이지로 돌아가기
              </Link>
              <Link
                href={`/p/${slug}/admin`}
                className="inline-flex min-h-[48px] px-6 py-3 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] text-sm hover:bg-[var(--aeterna-gold-light)] transition-colors"
              >
                관리자 대시보드 열기
              </Link>
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="text-xl font-light text-white mb-4">
              결제 확인에 문제가 발생했습니다
            </h1>
            <p className="text-[var(--aeterna-body)] text-sm mb-6">
              {errorMessage}
            </p>
            <Link
              href={`/p/${slug}`}
              className="inline-flex min-h-[48px] px-6 py-3 rounded-xl border border-[var(--aeterna-gold)] text-[var(--aeterna-gold)] text-sm hover:bg-[var(--aeterna-gold-pale)] transition-colors"
            >
              홈으로 돌아가기
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

export default function SuccessPage({ params }: PageProps) {
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
      <SuccessContent slug={slug} />
    </Suspense>
  )
}