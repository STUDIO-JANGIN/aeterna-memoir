"use client"

import { use, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  getStoriesForAdminAction,
  setStorySelectedAction,
  type AdminEvent,
  type AdminStory,
} from "@/app/actions/setStorySelected"
import { approveStoryAction } from "@/app/actions/approveStory"
import { extendDeadlineAction, closeDeadlineNowAction } from "@/app/actions/updateEventDeadline"
import { deleteStoryAction } from "@/app/actions/deleteStory"
import { createCheckoutSessionAction } from "@/app/actions/createCheckoutSession"
import { createPremiumCheckoutSessionAction } from "@/app/actions/createPremiumCheckoutSession"
import { createPremiumUsdCheckoutSessionAction } from "@/app/actions/createPremiumUsdCheckoutSession"
import { createFinalWarningCheckoutSessionAction } from "@/app/actions/createFinalWarningCheckoutSession"
import { createPlusCheckoutSessionAction } from "@/app/actions/createPlusCheckoutSession"
import { createPremiumTierCheckoutSessionAction } from "@/app/actions/createPremiumTierCheckoutSession"
import { autoSelectTop20ByLikesAction } from "@/app/actions/autoSelectTop20ByLikes"
import { savePreviewFilmAction } from "@/app/actions/savePreviewFilm"
import { requestFullFilmAction } from "@/app/actions/requestFullFilm"
import { updateEventBySlugAction } from "@/app/actions/updateEventBySlug"
import { generatePreviewVideo } from "@/lib/generatePreviewVideo"
import { getMemorialFundTotalBySlugAction } from "@/app/actions/getMemorialFundTotal"
import { supabase } from "@/lib/supabase"

const MAX_SELECTED = 15
const PAYMENT_ENABLED = process.env.NEXT_PUBLIC_PAYMENT_ENABLED === "true"

type PageProps = {
  params: Promise<{ slug: string }>
}

export default function AdminPhotoSelectPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug.trim() : ""
  const router = useRouter()

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [stories, setStories] = useState<AdminStory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<"pending" | "approved">("pending")
  const [approvingId, setApprovingId] = useState<string | null>(null)
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [deadlineUpdating, setDeadlineUpdating] = useState<"extend" | "close" | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [checkoutError, setCheckoutError] = useState<string | null>(null)
  const [premiumCheckoutLoading, setPremiumCheckoutLoading] = useState(false)
  const [premiumCheckoutError, setPremiumCheckoutError] = useState<string | null>(null)
  const [premiumUsdCheckoutLoading, setPremiumUsdCheckoutLoading] = useState(false)
  const [premiumUsdCheckoutError, setPremiumUsdCheckoutError] = useState<string | null>(null)
  const [showPaymentComingSoon, setShowPaymentComingSoon] = useState(false)
  const [countdownNow, setCountdownNow] = useState(() => Date.now())
  const [approvedSort, setApprovedSort] = useState<"likes" | "recent">("likes")
  const [autoSelectDone, setAutoSelectDone] = useState(false)
  const [previewGenerating, setPreviewGenerating] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const [fullFilmRequesting, setFullFilmRequesting] = useState(false)
  const [fullFilmMessage, setFullFilmMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [testPreviewGenerating, setTestPreviewGenerating] = useState(false)
  const [testPreviewBlobUrl, setTestPreviewBlobUrl] = useState<string | null>(null)
  const [testPreviewError, setTestPreviewError] = useState<string | null>(null)
  const [bankInfoDraft, setBankInfoDraft] = useState("")
  const [bankInfoSaving, setBankInfoSaving] = useState(false)
  const [bankInfoMessage, setBankInfoMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [showMaxSelectedMessage, setShowMaxSelectedMessage] = useState(false)
  const [showCongratsPopup, setShowCongratsPopup] = useState(false)
  const hasShown12Congrats = useRef(false)
  const [showRipeMemoriesPopup, setShowRipeMemoriesPopup] = useState(false)
  const hasShown10Ripe = useRef(false)
  const [finalWarningCheckoutLoading, setFinalWarningCheckoutLoading] = useState(false)
  const [finalWarningCheckoutError, setFinalWarningCheckoutError] = useState<string | null>(null)
  const [finalWarningDismissed, setFinalWarningDismissed] = useState(false)
  const [plusCheckoutLoading, setPlusCheckoutLoading] = useState(false)
  const [plusCheckoutError, setPlusCheckoutError] = useState<string | null>(null)
  const [aiMood, setAiMood] = useState<"grand" | "warm" | "calm">("warm")
  const [aiPreviewIndex, setAiPreviewIndex] = useState(0)
  const [aiLabError, setAiLabError] = useState<string | null>(null)
  const [fundTotalCents, setFundTotalCents] = useState<number | null>(null)
  const [fundCurrency, setFundCurrency] = useState<string | null>(null)
  const [showMoreThemesNudge, setShowMoreThemesNudge] = useState(false)
  const hasShownMoreThemesNudge = useRef(false)
  const [showFilmArrivedLayer, setShowFilmArrivedLayer] = useState(false)
  const hasShownFilmArrived = useRef(false)

  const pending = stories.filter((s) => !s.is_approved)
  const approvedRaw = stories.filter((s) => s.is_approved)
  const approved =
    approvedSort === "recent"
      ? [...approvedRaw].sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime()
        )
      : approvedRaw
  const selectedCount = approved.filter((s) => s.is_selected === true).length
  const selectedForVideo = approved.filter((s) => s.is_selected === true)
  const currentTier = (event?.tier ?? "free") as "free" | "plus" | "premium"
  const isPlusOrPremium = currentTier === "plus" || currentTier === "premium"

  const loadData = async () => {
    if (!slug) {
      setError("Invalid URL: missing slug.")
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { event: e, stories: list, error: err } = await getStoriesForAdminAction(slug)
    setEvent(e ?? null)
    setStories(list)
    if (err) setError(err)
    setLoading(false)
  }

  const deadlineAt = event?.expired_at ?? event?.collection_end_at
  const nowMs = countdownNow

  useEffect(() => {
    if (slug) loadData()
  }, [slug])

  // 결제 관련 'as any' 처리로 타입 에러 원천 봉쇄
  const handlePlusCheckout = async () => {
    if (!event || !slug) return
    setPlusCheckoutLoading(true)
    setPlusCheckoutError(null)
    const result: any = await createPlusCheckoutSessionAction(event.id, slug)
    setPlusCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setPlusCheckoutError(result.error || "결제 시작에 실패했습니다.")
    }
  }

  const handlePremiumUpgrade = async () => {
    if (!event || !slug) return
    setPremiumUsdCheckoutLoading(true)
    setPremiumUsdCheckoutError(null)
    const result: any = await createPremiumTierCheckoutSessionAction(event.id, slug)
    setPremiumUsdCheckoutLoading(false)
    if (result.ok && result.url) {
      window.location.href = result.url
    } else {
      setPremiumUsdCheckoutError(result.error || "결제 시작에 실패했습니다.")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#111] text-gold text-xs uppercase tracking-widest">Loading...</div>
  if (!event) return <div className="min-h-screen flex items-center justify-center bg-[#111] text-white">Event not found.</div>

  return (
    <div className="min-h-screen bg-[#111] text-white font-sans p-6">
      <div className="max-w-4xl mx-auto">
        <header className="mb-10 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-serif text-[#d4af37] mb-2">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Manage memories and album settings for {event.name}</p>
          </div>
          <Link href={`/p/${slug}`} className="text-xs text-[#d4af37] hover:underline uppercase tracking-widest border border-[#d4af37]/30 px-4 py-2 rounded-full">
            Back to Feed
          </Link>
        </header>

        <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl p-6 mb-8">
          <div className="flex justify-between items-center mb-6">
            <span className="text-xs text-gray-400 uppercase tracking-widest">Current Status</span>
            <span className="px-3 py-1 bg-[#d4af37] text-black text-[10px] font-bold rounded-full uppercase">{currentTier} Tier</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm text-gray-300">소중한 기억이 <strong>{stories.length}개</strong> 모였습니다.</p>
              {currentTier === "free" && (
                <button 
                  onClick={handlePlusCheckout}
                  disabled={plusCheckoutLoading}
                  className="w-full py-3 bg-[#d4af37] text-black font-bold rounded-xl hover:bg-[#c4a02d] transition-all disabled:opacity-50"
                >
                  {plusCheckoutLoading ? "Processing..." : "평생 소장용으로 업그레이드 ($19.99)"}
                </button>
              )}
            </div>
            <div className="space-y-4">
               {currentTier !== "premium" && (
                <button 
                  onClick={handlePremiumUpgrade}
                  disabled={premiumUsdCheckoutLoading}
                  className="w-full py-3 border border-[#d4af37] text-[#d4af37] font-bold rounded-xl hover:bg-[#d4af37]/10 transition-all disabled:opacity-50"
                >
                  {premiumUsdCheckoutLoading ? "Processing..." : "AI 마법 영상 제작하기 ($39.99)"}
                </button>
               )}
            </div>
          </div>
          {(plusCheckoutError || premiumUsdCheckoutError) && (
            <p className="mt-4 text-xs text-red-400">{plusCheckoutError || premiumUsdCheckoutError}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-10">
          <button onClick={() => setTab("pending")} className={`py-4 text-xs uppercase tracking-widest font-bold border-b-2 transition-all ${tab === "pending" ? "border-[#d4af37] text-[#d4af37]" : "border-transparent text-gray-500"}`}>
            Pending ({pending.length})
          </button>
          <button onClick={() => setTab("approved")} className={`py-4 text-xs uppercase tracking-widest font-bold border-b-2 transition-all ${tab === "approved" ? "border-[#d4af37] text-[#d4af37]" : "border-transparent text-gray-500"}`}>
            Approved ({approved.length})
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {(tab === "pending" ? pending : approved).map((story) => (
            <div key={story.id} className="relative aspect-square bg-[#222] rounded-lg overflow-hidden group">
              
              <img src={story.image_url || ""} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                {tab === "pending" ? (
                  <button onClick={() => approveStoryAction(story.id).then(() => loadData())} className="bg-white text-black px-4 py-2 rounded-full text-[10px] font-bold uppercase">Approve</button>
                ) : (
                  <button onClick={() => setStorySelectedAction(story.id, !story.is_selected).then(() => loadData())} className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase ${story.is_selected ? "bg-[#d4af37] text-black" : "bg-white/20 text-white"}`}>
                    {story.is_selected ? "Selected" : "Select"}
                  </button>
                )}
                <button onClick={() => deleteStoryAction(story.id).then(() => loadData())} className="bg-red-600 text-white p-2 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}