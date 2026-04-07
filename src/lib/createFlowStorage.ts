/** localStorage keys for /create flow (draft + resume Stripe). */

export const LS_CREATE_DRAFT_KEY = "aeterna.memorial-create-draft.v1"
export const LS_PENDING_CHECKOUT_KEY = "aeterna.memorial-pending-checkout.v1"

export type MemorialType = "person" | "pet"
export type StoragePlan = "free" | "plus" | "premium"

export type CreateDraftV1 = {
  /** `2` = current flow (includes auth step 9 + plan step 10). Reads still accept legacy `1`. */
  v: 2
  memorialType: MemorialType | null
  wizardStep: number
  name: string
  birthY: string
  birthM: string
  birthD: string
  deathY: string
  deathM: string
  deathD: string
  location: string
  /** YYYY-MM-DD for service / gathering */
  ceremonyDate: string
  ceremonyHour12: number
  ceremonyM: string
  ceremonyPeriod: "AM" | "PM"
  fundLink: string
  /** Words of remembrance for printable invitation */
  invitationBio: string
  collectionPeriod: "3" | "7" | "14" | "custom"
  customExpiredAt: string
  storagePlan: StoragePlan
}

export type PendingCheckoutV1 = {
  v: 1
  eventId: string
  slug: string
  storagePlan: StoragePlan
  name: string
}

export function readPendingCheckout(): PendingCheckoutV1 | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LS_PENDING_CHECKOUT_KEY)
    if (!raw) return null
    const p = JSON.parse(raw) as Partial<PendingCheckoutV1>
    if (p?.v !== 1 || !p.eventId || !p.slug || !p.storagePlan) return null
    return p as PendingCheckoutV1
  } catch {
    return null
  }
}

export function writePendingCheckout(p: Omit<PendingCheckoutV1, "v">): void {
  const payload: PendingCheckoutV1 = { v: 1, ...p }
  localStorage.setItem(LS_PENDING_CHECKOUT_KEY, JSON.stringify(payload))
}

export function clearPendingCheckout(): void {
  localStorage.removeItem(LS_PENDING_CHECKOUT_KEY)
}

const DRAFT_MAX_STEP = 10

export function readCreateDraft(): CreateDraftV1 | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LS_CREATE_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const ver = parsed.v
    if (ver !== 1 && ver !== 2) return null
    let step = typeof parsed.wizardStep === "number" ? (parsed.wizardStep as number) : 1
    // Legacy v1: old "plan" step mapped to 10. Step 9 in the current flow is "Claim account" — keep it so Google OAuth returns to plan (10), not a false plan-without-session.
    if (ver === 1) {
      if (step === 6) {
        step = 10
      }
    }
    step = Math.min(Math.max(1, step), DRAFT_MAX_STEP)
    return { ...(parsed as unknown as Partial<CreateDraftV1>), v: 2, wizardStep: step } as CreateDraftV1
  } catch {
    return null
  }
}

export function writeCreateDraft(draft: CreateDraftV1): void {
  localStorage.setItem(LS_CREATE_DRAFT_KEY, JSON.stringify(draft))
}

export function clearCreateDraft(): void {
  localStorage.removeItem(LS_CREATE_DRAFT_KEY)
}
