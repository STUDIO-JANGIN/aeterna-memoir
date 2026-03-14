"use client"

import { use, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import { getEventBySlugAction, type AdminEvent } from "@/app/actions/setStorySelected"
import { updateEventBySlugAction } from "@/app/actions/updateEventBySlug"
import { startAiFilmAction } from "@/app/actions/startAiFilm"
import { generateInvitePdfAction } from "@/app/actions/generateInvitePdf"

function buildTributeSuggestionsForEvent(event: AdminEvent): string[] {
  const name = event.name?.trim() || "이 분"
  const location = event.location?.trim() || ""
  const birthYear = event.birth_date && event.birth_date.length >= 4 ? event.birth_date.slice(0, 4) : null
  const deathYear = event.death_date && event.death_date.length >= 4 ? event.death_date.slice(0, 4) : null

  const lifeRange =
    birthYear && deathYear
      ? `${birthYear}–${deathYear}`
      : birthYear
        ? `${birthYear}년생`
        : null

  const line1 = `${name}님은 우리 곁에 머무는 동안, 조용하지만 깊은 온기를 주변 사람들에게 나누어 주셨습니다.`

  const line2 = lifeRange
    ? `${lifeRange} 동안 ${location || "이 세상"} 곳곳에 남겨진 웃음과 마음 씀씀이가, 지금 이 앨범 속에서 천천히 되살아나고 있습니다.`
    : `${location || "이곳"}에서 함께 나눈 소소한 일상들이, 이제는 우리를 지켜 보는 별빛이 되었습니다.`

  const line3 = `${name}님을 떠올릴 때마다 가슴은 여전히 시리지만, 동시에 감사와 사랑이 더 크게 피어오릅니다. 오늘 이 앨범에 그 마음을 조심스레 담아 둡니다.`

  return [line1, line2, line3]
}

type PageProps = {
  params: Promise<{ slug: string }>
}

export default function AdminSettingsPage({ params }: PageProps) {
  const resolvedParams = use(params)
  const slug = typeof resolvedParams?.slug === "string" ? resolvedParams.slug.trim() : ""
  const router = useRouter()

  const [event, setEvent] = useState<AdminEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [aiFilmLoading, setAiFilmLoading] = useState(false)
  const [aiFilmMessage, setAiFilmMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null)
  const [tributeLoading, setTributeLoading] = useState(false)
  const [tributeError, setTributeError] = useState<string | null>(null)
  const [tributeSuggestions, setTributeSuggestions] = useState<string[]>([])
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState<string | null>(null)

  useEffect(() => {
    if (!slug) {
      setError("Invalid URL: missing slug.")
      setLoading(false)
      return
    }
    let cancelled = false
    getEventBySlugAction(slug).then((e) => {
      if (!cancelled) {
        setEvent(e ?? null)
        if (!e) setError("Event not found.")
        setLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [slug])

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!event || !slug) return
    setSavingProfile(true)
    setProfileError(null)
    const form = e.currentTarget
    const formData = new FormData(form)
    const name = (formData.get("name") as string)?.trim() ?? event.name ?? ""
    const birth_date = (formData.get("birth_date") as string)?.trim() ?? ""
    const death_date = (formData.get("death_date") as string)?.trim() ?? ""
    const location = (formData.get("location") as string)?.trim() ?? ""
    const ceremony_time = (formData.get("ceremony_time") as string)?.trim() ?? ""
    const flower_link = (formData.get("flower_link") as string)?.trim() || null
    const bank_info = (formData.get("bank_info") as string)?.trim() || null
    const file = formData.get("profile_image") as File | null
    let profile_image: string | null = event.profile_image ?? null
    if (file && file.size > 0) {
      const path = `profiles/${event.id}/${Date.now()}_${file.name}`
      const { data: up, error: upErr } = await supabase.storage.from("photos").upload(path, file)
      if (!upErr && up) {
        const { data: url } = supabase.storage.from("photos").getPublicUrl(path)
        profile_image = url.publicUrl
      }
    }
    const result = await updateEventBySlugAction(slug, {
      name,
      birth_date: birth_date || undefined,
      death_date: death_date || undefined,
      location: location || undefined,
      ceremony_time: ceremony_time || undefined,
      flower_link,
      bank_info,
      profile_image,
    })
    setSavingProfile(false)
    if (result.ok) {
      setEvent((prev) =>
        prev
          ? {
              ...prev,
              name,
              birth_date: birth_date || null,
              death_date: death_date || null,
              location: location || null,
              ceremony_time: ceremony_time || null,
              flower_link,
              bank_info,
              profile_image,
            }
          : null
      )
      router.refresh()
    } else {
      setProfileError(result.error ?? "Failed to save.")
    }
  }

  const handleStartAiFilm = async () => {
    if (!slug) return
    setAiFilmMessage(null)
    setAiFilmLoading(true)
    const result = await startAiFilmAction(slug)
    setAiFilmLoading(false)
    if (result.ok) {
      setAiFilmMessage({ type: "ok", text: result.message })
    } else {
      setAiFilmMessage({ type: "err", text: result.error })
    }
  }

  const handleGenerateInvite = async () => {
    if (!slug) return
    setInviteLoading(true)
    setInviteError(null)
    try {
      const result = await generateInvitePdfAction(slug)
      if (result.ok) {
        if (typeof window !== "undefined") {
          window.open(result.url, "_blank")
        }
      } else {
        setInviteError(result.error)
      }
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to generate invitation PDF.")
    } finally {
      setInviteLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--aeterna-charcoal)] font-sans text-sm text-[var(--aeterna-gold-muted)] tracking-[0.1em] uppercase">
        Loading…
      </div>
    )
  }

  if (!event || error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--aeterna-charcoal)] font-sans px-6 text-center text-white">
        <p className="text-[var(--aeterna-gold-muted)] mb-4">
          {error ?? "Memorial not found."}
        </p>
        <Link
          href={slug ? `/p/${slug}/admin` : "/"}
          className="text-sm text-[var(--aeterna-gold)] hover:underline"
        >
          ← Back to admin
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--aeterna-charcoal)] text-white font-sans">
      <header className="sticky top-0 z-10 border-b border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal)]/95 backdrop-blur">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link
            href={`/p/${slug}/admin`}
            className="text-xs uppercase tracking-widest text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] inline-flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to admin
          </Link>
          <h1 className="text-lg font-medium text-[var(--aeterna-headline)] tracking-[0.02em]">
            Event settings
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {/* Event info form */}
        <section aria-labelledby="event-form-heading">
          <h2 id="event-form-heading" className="text-sm font-medium text-[var(--aeterna-gold)] uppercase tracking-widest mb-6">
            Edit event info
          </h2>
          <form onSubmit={handleProfileSubmit} className="space-y-5">
            {event.profile_image && (
              <div className="flex justify-center">
                <img
                  src={event.profile_image}
                  alt=""
                  className="w-24 h-24 rounded-full object-cover border-2 border-[var(--border-gold-subtle)]"
                />
              </div>
            )}
            <div>
              <label htmlFor="name" className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5">
                Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                defaultValue={event.name ?? ""}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                placeholder="Loved one's name"
              />
            </div>
            <div>
              <label htmlFor="profile_image" className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5">
                Profile image
              </label>
              <input
                id="profile_image"
                name="profile_image"
                type="file"
                accept="image/*"
                className="w-full text-sm text-[var(--aeterna-body)] file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-[var(--aeterna-gold-pale)] file:text-[var(--aeterna-charcoal)]"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="birth_date" className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5">
                  Birth date
                </label>
                <input
                  id="birth_date"
                  name="birth_date"
                  type="text"
                  defaultValue={event.birth_date ?? ""}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                  placeholder="e.g. 1950-01-15"
                />
              </div>
              <div>
                <label htmlFor="death_date" className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5">
                  Death date
                </label>
                <input
                  id="death_date"
                  name="death_date"
                  type="text"
                  defaultValue={event.death_date ?? ""}
                  className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                  placeholder="e.g. 2024-03-01"
                />
              </div>
            </div>
            <div>
              <label htmlFor="location" className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5">
                Location
              </label>
              <input
                id="location"
                name="location"
                type="text"
                defaultValue={event.location ?? ""}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                placeholder="City, venue, etc."
              />
            </div>
            <div>
              <label htmlFor="ceremony_time" className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5">
                Ceremony time
              </label>
              <input
                id="ceremony_time"
                name="ceremony_time"
                type="text"
                defaultValue={event.ceremony_time ?? ""}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                placeholder="e.g. March 15, 2024 at 2pm"
              />
            </div>
            <div>
              <label htmlFor="flower_link" className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5">
                Flower / tribute link
              </label>
              <input
                id="flower_link"
                name="flower_link"
                type="url"
                defaultValue={event.flower_link ?? ""}
                className="w-full min-h-[44px] px-4 rounded-xl bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)]"
                placeholder="https://..."
              />
            </div>
            <div>
              <label htmlFor="bank_info" className="block text-xs text-[var(--aeterna-gold-muted)] uppercase tracking-wider mb-1.5">
                조의금 계좌 정보 (bank_info)
              </label>
              <textarea
                id="bank_info"
                name="bank_info"
                rows={4}
                defaultValue={event.bank_info ?? ""}
                className="w-full px-4 py-3 rounded-xl bg-[var(--aeterna-charcoal-soft)] border border-[var(--border-gold-subtle)] text-[var(--aeterna-headline)] placeholder:text-[var(--aeterna-body)] focus:outline-none focus:ring-2 focus:ring-[var(--aeterna-gold)] resize-none"
                placeholder="은행명, 계좌번호, 예금주 등 (후원 후 방문자에게 공개)"
              />
            </div>
            {profileError && (
              <p className="text-sm text-red-400" role="alert">
                {profileError}
              </p>
            )}
            <button
              type="submit"
              disabled={savingProfile}
              className="w-full min-h-[48px] rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm tracking-[0.04em] hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors"
            >
              {savingProfile ? "Saving…" : "Save profile"}
            </button>
          </form>
        </section>

        {/* AI 헌정사 어시스턴트 */}
        <section
          aria-labelledby="tribute-ai-heading"
          className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)] p-6"
        >
          <h2
            id="tribute-ai-heading"
            className="text-sm font-medium text-[var(--aeterna-gold)] uppercase tracking-widest mb-3"
          >
            AI 헌정사 어시스턴트
          </h2>
          <p className="text-sm text-[var(--aeterna-body)] mb-4">
            고인 이름, 생년월일, 장소 정보를 바탕으로, AI가 대신 써주는 짧고 아름다운 추모 문구 3가지를 제안해 드립니다.
            마음에 드는 문장을 복사해 카드, 메시지, 앨범 소개글 등에 활용하실 수 있습니다.
          </p>
          <button
            type="button"
            disabled={tributeLoading || !event}
            onClick={() => {
              if (!event) return
              setTributeLoading(true)
              setTributeError(null)
              try {
                const lines = buildTributeSuggestionsForEvent(event)
                setTributeSuggestions(lines)
              } catch (err) {
                setTributeError(
                  err instanceof Error ? err.message : "헬퍼 문구 생성 중 오류가 발생했습니다."
                )
              } finally {
                setTributeLoading(false)
              }
            }}
            className="min-h-[40px] px-5 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] text-sm font-medium hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors"
          >
            {tributeLoading ? "생성 중…" : "AI가 대신 써주는 따뜻한 추모사 보기"}
          </button>
          {tributeError && (
            <p className="mt-2 text-sm text-red-400" role="alert">
              {tributeError}
            </p>
          )}
          {tributeSuggestions.length > 0 && (
            <ol className="mt-4 space-y-3 text-sm text-[var(--aeterna-body)]">
              {tributeSuggestions.map((line, idx) => (
                <li
                  key={idx}
                  className="rounded-xl bg-[var(--aeterna-charcoal)]/80 border border-[var(--border-gold-subtle)] px-4 py-3 leading-relaxed"
                >
                  <span className="block text-[10px] uppercase tracking-[0.22em] text-[var(--aeterna-gold-muted)] mb-1">
                    제안 {idx + 1}
                  </span>
                  <p>{line}</p>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* Funeral invitation PDF */}
        <section
          aria-labelledby="invite-pdf-heading"
          className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)] p-6"
        >
          <h2
            id="invite-pdf-heading"
            className="text-sm font-medium text-[var(--aeterna-gold)] uppercase tracking-widest mb-3"
          >
            QR 초청장 (PDF)
          </h2>
          <p className="text-sm text-[var(--aeterna-body)] mb-3">
            행사 이름, 장소, 일시를 바탕으로 아름다운 장례 초청 PDF를 생성합니다. 초대장을 받은 분들이 바로 추모 앨범으로
            들어올 수 있도록, 하단에는 QR 코드가 자동으로 삽입됩니다.
          </p>
          <p className="text-xs text-[var(--aeterna-gold-muted)] mb-4">
            생성된 PDF는 &quot;invites&quot; 폴더에 저장되며, 링크를 카카오톡이나 이메일로 그대로 공유하실 수 있습니다.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleGenerateInvite}
              disabled={inviteLoading}
              className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors"
            >
              {inviteLoading ? "Generating…" : "QR 초청장 생성"}
            </button>
            {event.invite_pdf_url && (
              <a
                href={event.invite_pdf_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-[var(--aeterna-gold-muted)] hover:text-[var(--aeterna-gold)] underline-offset-2 hover:underline mt-2 sm:mt-0"
              >
                이미 생성된 초청장 열기
              </a>
            )}
          </div>
          {inviteError && (
            <p className="mt-2 text-sm text-red-400" role="alert">
              {inviteError}
            </p>
          )}
        </section>

        {/* AI film */}
        <section aria-labelledby="ai-film-heading" className="rounded-2xl border border-[var(--border-gold-subtle)] bg-[var(--aeterna-charcoal-soft)] p-6">
          <h2 id="ai-film-heading" className="text-sm font-medium text-[var(--aeterna-gold)] uppercase tracking-widest mb-3">
            AI film
          </h2>
          <p className="text-sm text-[var(--aeterna-body)] mb-4">
            On the main admin page, open the <strong>Approved</strong> tab and select exactly 20 photos for the film. Then return here and click the button below to start the AI film.
          </p>
          <button
            type="button"
            onClick={handleStartAiFilm}
            disabled={aiFilmLoading}
            className="min-h-[44px] px-6 rounded-xl bg-[var(--aeterna-gold)] text-[var(--aeterna-charcoal)] font-medium text-sm hover:bg-[var(--aeterna-gold-light)] disabled:opacity-60 transition-colors"
          >
            {aiFilmLoading ? "Starting…" : "Start AI film (20 selected)"}
          </button>
          {aiFilmMessage && (
            <p
              className={`mt-3 text-sm ${aiFilmMessage.type === "ok" ? "text-[var(--aeterna-gold)]" : "text-red-400"}`}
              role="alert"
            >
              {aiFilmMessage.text}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
