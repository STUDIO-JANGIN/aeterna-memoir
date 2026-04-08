/** localStorage keys for /create flow (draft + resume Stripe). */

export const LS_CREATE_DRAFT_KEY = "aeterna.memorial-create-draft.v1"
export const LS_PENDING_CHECKOUT_KEY = "aeterna.memorial-pending-checkout.v1"

export type MemorialType = "person" | "pet"
export type StoragePlan = "free" | "plus" | "premium"

export type CreateDraftV1 = {
  /** `5` = 8-step flow (hosting? → service → support → …). Older drafts migrated on read. */
  v: 3 | 4 | 5
  memorialType: MemorialType | null
  wizardStep: number
  /** Step 4: if false, Memorial Service + Support Family are skipped. */
  willHostMemorialService?: boolean | null
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
  /** @deprecated Removed from UI; always 7-day gathering server-side */
  collectionPeriod?: "3" | "7" | "14" | "custom"
  customExpiredAt?: string
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

/** Create wizard: 8 steps — hosting 4; service 5; support 6; account 7; plan 8. */
const DRAFT_MAX_STEP = 8
const LEGACY_V3_MAX_STEP = 6

/** Map drafts from older 10-step wizard into the current flow. */
function migrateV1WizardStep(rawStep: number): number {
  let step = rawStep
  if (step === 6) step = 10
  if (step <= 3) return step
  if (step === 4) return 4
  if (step >= 5 && step <= 9) return 4
  if (step === 10) return 6
  return Math.min(Math.max(1, step), LEGACY_V3_MAX_STEP)
}

/** 5-step drafts (v2): account was 4 → plan 5. Shift +1 for new service step. */
function migrateV2WizardStepToV3(rawStep: number): number {
  if (rawStep <= 3) return rawStep
  if (rawStep === 4) return 5
  if (rawStep === 5) return 6
  return Math.min(Math.max(1, rawStep), LEGACY_V3_MAX_STEP)
}

export function readCreateDraft(): CreateDraftV1 | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(LS_CREATE_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Record<string, unknown>
    const ver = parsed.v
    if (ver !== 1 && ver !== 2 && ver !== 3 && ver !== 4 && ver !== 5) return null
    const rawStep = typeof parsed.wizardStep === "number" ? (parsed.wizardStep as number) : 1
    let step: number
    if (ver === 1) step = migrateV1WizardStep(rawStep)
    else if (ver === 2) step = migrateV2WizardStepToV3(rawStep)
    else if (ver === 3) step = Math.min(Math.max(1, rawStep), LEGACY_V3_MAX_STEP)
    else step = Math.min(Math.max(1, rawStep), DRAFT_MAX_STEP)

    /** Legacy 6-step drafts: account was 5, plan was 6 → shift to 6 and 7. */
    if (ver <= 3 && step >= 5) step += 1
    step = Math.min(step, DRAFT_MAX_STEP)

    let willHost = parsed.willHostMemorialService as boolean | null | undefined
    /** v:4 → v:5: insert “hosting?” step 4; drafts on old step ≥4 were in service+ flow. */
    if (ver === 4 && willHost === undefined) {
      if (step >= 4) {
        step += 1
        willHost = true
      } else {
        willHost = null
      }
      step = Math.min(step, DRAFT_MAX_STEP)
    }
    return {
      ...(parsed as unknown as Partial<CreateDraftV1>),
      v: 5,
      wizardStep: step,
      willHostMemorialService: willHost ?? null,
    } as CreateDraftV1
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
