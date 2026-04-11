"use client"

import { useState, type ReactNode } from "react"
import { Sparkles } from "lucide-react"
import {
  enhanceRemembranceTextAction,
  refineRemembranceTextAction,
  type RemembrancePersona,
} from "@/app/actions/enhanceRemembranceText"
import type { LandingLocale } from "@/lib/landingTranslations"

const PERSONAS: RemembrancePersona[] = ["poetic", "formal", "warm"]

export type EnhanceRemembranceLabels = {
  enhanceWithAi: string
  enhanceGenerating: string
  enhanceChooseVersion: string
  enhanceUseThis: string
  enhanceWriteFirst: string
  enhanceTooLong: string
  enhanceErrorGeneric: string
  enhanceOptionPoetic: string
  enhanceOptionFormal: string
  enhanceOptionWarm: string
  enhanceRefine: string
  enhanceRefining: string
}

const defaultLabels: EnhanceRemembranceLabels = {
  enhanceWithAi: "Enhance with AI",
  enhanceGenerating: "Enhancing…",
  enhanceChooseVersion: "Choose a version",
  enhanceUseThis: "Use this",
  enhanceWriteFirst: "Write something first, then try enhancing.",
  enhanceTooLong: "Text is too long. Shorten it and try again.",
  enhanceErrorGeneric: "Something went wrong. Try again.",
  enhanceOptionPoetic: "Poetic",
  enhanceOptionFormal: "Formal",
  enhanceOptionWarm: "Warm",
  enhanceRefine: "Refine",
  enhanceRefining: "Refining…",
}

function personaLabel(labels: EnhanceRemembranceLabels, persona: RemembrancePersona): string {
  if (persona === "poetic") return labels.enhanceOptionPoetic
  if (persona === "formal") return labels.enhanceOptionFormal
  return labels.enhanceOptionWarm
}

type Variant = "settings" | "create"

export function EnhanceRemembranceWithAi({
  label,
  text,
  onApply,
  deceasedName,
  locale = "en",
  labels: labelsProp,
  variant = "settings",
  children,
}: {
  label: ReactNode
  text: string
  onApply: (next: string) => void
  deceasedName?: string | null
  /** UI + model output language for remembrance AI */
  locale?: LandingLocale
  labels?: Partial<EnhanceRemembranceLabels>
  variant?: Variant
  children: ReactNode
}) {
  const labels = { ...defaultLabels, ...labelsProp }
  const [loading, setLoading] = useState(false)
  const [refiningSlot, setRefiningSlot] = useState<number | null>(null)
  const [options, setOptions] = useState<[string, string, string] | null>(null)
  const [error, setError] = useState<string | null>(null)

  const btnBase =
    variant === "create"
      ? "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--aeterna-gold)]/30 bg-[var(--aeterna-gold)]/[0.08] px-3.5 py-2 text-xs font-medium tracking-[0.06em] text-[#e8dcc4] transition-colors hover:bg-[var(--aeterna-gold)]/[0.14] disabled:cursor-not-allowed disabled:opacity-45"
      : "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--aeterna-gold)]/35 bg-[#030303]/40 px-3.5 py-2 text-xs font-medium tracking-[0.08em] text-[var(--aeterna-gold)] transition-colors hover:bg-[var(--aeterna-gold)]/10 disabled:cursor-not-allowed disabled:opacity-45"

  const cardClass =
    variant === "create"
      ? "rounded-2xl border border-white/[0.1] bg-white/[0.04] p-4 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
      : "rounded-xl border border-white/[0.08] bg-[#030303]/25 p-4 text-left"

  const refineBtnClass =
    variant === "create"
      ? "flex-1 rounded-full border border-white/[0.12] bg-white/[0.06] py-2 text-[11px] font-medium tracking-[0.06em] text-[#e8dcc4]/90 transition-colors hover:bg-white/[0.1] disabled:cursor-not-allowed disabled:opacity-45"
      : "flex-1 rounded-lg border border-white/[0.1] bg-[#030303]/35 py-2 text-[11px] font-medium tracking-[0.06em] text-[var(--landing-text-muted)] transition-colors hover:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-45"

  const handleGenerate = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await enhanceRemembranceTextAction(text, deceasedName ?? null, locale)
      if (result.ok) {
        setOptions(result.options)
      } else {
        setOptions(null)
        setError(result.reason === "empty" ? labels.enhanceWriteFirst : labels.enhanceTooLong)
      }
    } catch {
      setOptions(null)
      setError(labels.enhanceErrorGeneric)
    } finally {
      setLoading(false)
    }
  }

  const handleRefine = async (slot: number) => {
    if (!options) return
    const persona = PERSONAS[slot]
    const source = options[slot]
    if (!source?.trim()) return
    setError(null)
    setRefiningSlot(slot)
    try {
      const result = await refineRemembranceTextAction(source, deceasedName ?? null, locale, persona)
      if (result.ok) {
        setOptions((prev) => {
          if (!prev) return prev
          const next: [string, string, string] = [...prev]
          next[slot] = result.text
          return next
        })
      } else {
        setError(result.reason === "empty" ? labels.enhanceWriteFirst : labels.enhanceTooLong)
      }
    } catch {
      setError(labels.enhanceErrorGeneric)
    } finally {
      setRefiningSlot(null)
    }
  }

  const optionsDir = locale === "ar" ? "rtl" : "ltr"
  const optionsAlign = locale === "ar" ? "text-right" : "text-left"

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">{label}</div>
        <button
          type="button"
          onClick={() => void handleGenerate()}
          disabled={loading || refiningSlot !== null}
          className={btnBase}
        >
          <Sparkles className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />
          {loading ? labels.enhanceGenerating : labels.enhanceWithAi}
        </button>
      </div>
      {children}
      {error && (
        <p className="text-[11px] text-red-400/95 sm:text-xs" role="alert">
          {error}
        </p>
      )}
      {options && (
        <div
          className="space-y-3 pt-1"
          dir={optionsDir}
          lang={locale}
        >
          <p className={`text-[10px] uppercase tracking-[0.22em] text-[var(--aeterna-gold-muted)] ${optionsAlign}`}>
            {labels.enhanceChooseVersion}
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {options.map((body, idx) => {
              const persona = PERSONAS[idx]
              return (
                <li key={persona} className={`${cardClass} ${optionsAlign}`}>
                  <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">
                    {personaLabel(labels, persona)}
                  </span>
                  <p
                    className={`mb-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--landing-text-body)] ${optionsAlign}`}
                  >
                    {body}
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRefine(idx)}
                      disabled={loading || refiningSlot !== null}
                      className={refineBtnClass}
                    >
                      {refiningSlot === idx ? labels.enhanceRefining : labels.enhanceRefine}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onApply(body)
                        setOptions(null)
                      }}
                      className={
                        variant === "create"
                          ? "flex-1 rounded-full border border-[var(--aeterna-gold)]/40 bg-[var(--aeterna-gold)]/12 py-2 text-xs font-medium text-[#f4f1ea] transition-colors hover:bg-[var(--aeterna-gold)]/20"
                          : "flex-1 rounded-lg border border-[var(--aeterna-gold)]/30 bg-[var(--aeterna-gold)]/10 py-2 text-xs font-medium text-[var(--aeterna-gold)] transition-colors hover:bg-[var(--aeterna-gold)]/18"
                      }
                    >
                      {labels.enhanceUseThis}
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
