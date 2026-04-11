"use client"

import { useState, type ReactNode } from "react"
import { Sparkles } from "lucide-react"
import { enhanceRemembranceTextAction } from "@/app/actions/enhanceRemembranceText"

export type EnhanceRemembranceLabels = {
  enhanceWithAi: string
  enhanceGenerating: string
  enhanceChooseVersion: string
  enhanceUseThis: string
  enhanceWriteFirst: string
  enhanceTooLong: string
  enhanceErrorGeneric: string
}

const defaultLabels: EnhanceRemembranceLabels = {
  enhanceWithAi: "Enhance with AI",
  enhanceGenerating: "Enhancing…",
  enhanceChooseVersion: "Choose a version",
  enhanceUseThis: "Use this",
  enhanceWriteFirst: "Write something first, then try enhancing.",
  enhanceTooLong: "Text is too long. Shorten it and try again.",
  enhanceErrorGeneric: "Something went wrong. Try again.",
}

type Variant = "settings" | "create"

export function EnhanceRemembranceWithAi({
  label,
  text,
  onApply,
  deceasedName,
  labels: labelsProp,
  variant = "settings",
  children,
}: {
  label: ReactNode
  text: string
  onApply: (next: string) => void
  deceasedName?: string | null
  labels?: Partial<EnhanceRemembranceLabels>
  variant?: Variant
  children: ReactNode
}) {
  const labels = { ...defaultLabels, ...labelsProp }
  const [loading, setLoading] = useState(false)
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

  const handleClick = async () => {
    setError(null)
    setLoading(true)
    try {
      const result = await enhanceRemembranceTextAction(text, deceasedName ?? null)
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

  return (
    <div className="space-y-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">{label}</div>
        <button
          type="button"
          onClick={() => void handleClick()}
          disabled={loading}
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
        <div className="space-y-3 pt-1">
          <p className="text-[10px] uppercase tracking-[0.22em] text-[var(--aeterna-gold-muted)]">
            {labels.enhanceChooseVersion}
          </p>
          <ul className="grid gap-3 sm:grid-cols-3">
            {options.map((body, idx) => (
              <li key={idx} className={cardClass}>
                <span className="mb-2 block text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--aeterna-gold-muted)]">
                  {idx + 1}
                </span>
                <p className="mb-3 whitespace-pre-wrap text-sm leading-relaxed text-[var(--landing-text-body)]">
                  {body}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onApply(body)
                    setOptions(null)
                  }}
                  className={
                    variant === "create"
                      ? "w-full rounded-full border border-[var(--aeterna-gold)]/40 bg-[var(--aeterna-gold)]/12 py-2 text-xs font-medium text-[#f4f1ea] transition-colors hover:bg-[var(--aeterna-gold)]/20"
                      : "w-full rounded-lg border border-[var(--aeterna-gold)]/30 bg-[var(--aeterna-gold)]/10 py-2 text-xs font-medium text-[var(--aeterna-gold)] transition-colors hover:bg-[var(--aeterna-gold)]/18"
                  }
                >
                  {labels.enhanceUseThis}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
