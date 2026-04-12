/**
 * App-wide UI copy (beyond the marketing landing). Same locales as the landing page.
 */

import type { PricingCurrencyId } from "@/lib/landingPricing"
import type { LandingLocale } from "@/lib/landingTranslations"
import { splitMsToDHMS } from "@/lib/memorialCountdownParts"
import { AR_APP_REST } from "@/lib/locales/arAppPartial"
import { ES_APP_REST } from "@/lib/locales/esAppPartial"
import { FR_APP_REST } from "@/lib/locales/frAppPartial"
import { ZH_APP_REST } from "@/lib/locales/zhAppPartial"

/** Simple `{name}` / `{current}` style interpolation */
export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined ? String(vars[k]) : ""))
}

export type AppStrings = {
  common: {
    loading: string
    backToHome: string
    returnHome: string
    cancel: string
    close: string
    save: string
    ok: string
    tryAgain: string
    signingOut: string
    signOut: string
    language: string
    open: string
    back: string
    continueStory: string
    creating: string
    redirecting: string
    deleting: string
    memorialFallbackName: string
  }
  signIn: {
    loading: string
    kicker: string
    title: string
    body: string
    continueGoogle: string
    redirecting: string
    signInFailed: string
  }
  find: {
    kicker: string
    title: string
    body: string
    placeholder: string
    open: string
    badLink: string
  }
  myMemorial: {
    kicker: string
    loadingTitle: string
    loadingBody: string
    emptyTitle: string
    emptyBody: string
    createCta: string
    listTitle: string
    listBody: string
    deleteMemorialAria: (name: string) => string
    deleteTitle: string
    deleteBody: (name: string) => string
    typeDelete: string
    /** Follows the monospace \"delete\" word, e.g. \"to confirm\" */
    afterTypeWord: string
    deletePlaceholder: string
    deleteCta: string
    errorTitle: string
    errorFallback: string
    somethingWrong: string
  }
  createNew: {
    preparing: string
    kicker: string
    title: string
    body: string
    errName: string
    errCeremony: string
    errCreate: string
    labelName: string
    phName: string
    labelBirth: string
    labelDeath: string
    dateFormatHint: string
    labelPortrait: string
    addSpark: string
    portraitHint: string
    selectedFile: string
    labelLocation: string
    phLocation: string
    searchingPlaces: string
    locationMockError: string
    labelServiceTime: string
    month: string
    date: string
    selectTime: string
    serviceTimeNote: string
    labelContribution: string
    phContribution: string
    contributionHint: string
    labelMusic: string
    phMusic: string
    musicHint: string
    footerNote: string
    submit: string
    submitting: string
  }
  pricingCurrencyNote: {
    usd: string
    krw: string
    jpy: string
    sar: string
  }
  memorial: {
    loadSyncing: string
    loadLoading: string
    syncHint: string
    notFound: string
    addMemory: string
    share: string
    admin: string
    photoWindow: string
    linkCopied: string
    premiumRestoreTitle: string
    premiumRestoreBody: string
    paymentsSoonTitle: string
    paymentsSoonBody: string
    adminForbidden: string
    donationThankYou: string
    memoryReceivedTitle: string
    memoryReceivedBody: string
    emailWhenLive: string
    emailPlaceholder: string
    saving: string
    notifyMe: string
    afterUploadDone: string
    shareModalTitle: string
    shareModalBody: string
    whatsApp: string
    message: string
    copyLink: string
    filmAria: string
    videoUnsupported: string
    filmLabel: string
    redirectCheckout: string
    downloadFilm: string
    unlockMemories: string
    premium: string
    locked: string
    viewStoryAria: string
    donationSupportCta: string
    donationStatus: string
    donationSoFar: (count: number) => string
    shareMemoryTitle: string
    stepCounter: (n: number) => string
    formNameTitle: string
    formNamePh: string
    formPhotoTitle: string
    changePhoto: string
    tapAddMemory: string
    dragHere: string
    formStoryTitle: string
    formStoryPh: string
    formStoryPremium: string
    formStoryFree: string
    sending: string
    shareThisMemory: string
    continueTheStoryBtn: string
    restorePremium: string
    collectionClosed: string
    filmCraftedTitle: string
    filmCraftedSubtitle: string
    /** When collection closed but not premium tier */
    collectionClosedGalleryNote: string
    notifyPlaceholder: string
    notifyFilmTitle: string
    notifyFilmThanks: string
    noMemoriesYet: string
    /** Free-tier preservation banner */
    preserveLegacyHeader: string
    trialGatheringTimerLabel: string
    trialCountdownFromMs: (ms: number) => string
    trialUpgradePart1: string
    trialUpgradeLinkLabel: string
    trialUpgradePart2: string
    /** Shown above the checkout CTA at `#memorial-preserve-upgrade` (trial banner link target). */
    memorialUpgradeAnchorIntro: string
    /** `/p/[slug]/admin` and related loading / access states */
    adminLoadingTitle: string
    adminLoadingSubtitle: string
    adminAccessRestrictedTitle: string
    adminAccessRestrictedBody: string
    adminBackToHome: string
    adminNotFoundTitle: string
    adminNotFoundBody: string
    adminDashboardKicker: string
    adminDashboardWelcome: string
    adminEdit: string
    adminSharePdfInvitation: string
    adminPdfGenerating: string
    adminBackToFeed: string
    adminCurrentPlan: string
    adminTierLabelFree: string
    adminTierLabelPlus: string
    adminTierLabelPremium: string
    adminContributionsCollected: (count: number) => string
    adminPreserveForeverCta: string
    adminProcessing: string
    adminMemoriesSectionTitle: string
    adminTabPending: (count: number) => string
    adminTabApproved: (count: number) => string
    upgradePremiumCta: string
    upgradePremiumTail: string
    recentSupportAria: string
    donationStatusAria: string
    close: string
    returnHome: string
    errors: {
      nameRequired: string
      photoRequired: string
      storyRequired: string
      emailRequired: string
      subscribeFailed: string
      submitFailed: string
      memorialNotFound: string
      loadFailed: string
      checkoutFailed: string
      donationCheckoutFailed: string
    }
  }
  createWizard: {
    stepOf: string
    resumeToast: string
    welcomeSacred: string
    paymentPending: string
    paymentPendingBold: string
    dismiss: string
    whoHonoringTitle: string
    whoHonoringSubtitle: string
    honorPerson: string
    honorPet: string
    step1Title: string
    step1Subtitle: string
    step1Ph: string
    step2Title: string
    step2HintPhoto: string
    step2HintNoPhoto: string
    chooseDifferentPhoto: string
    addSparkAria: string
    addSparkLabel: string
    step3Title: string
    step3Subtitle: string
    born: string
    atRest: string
    step4Title: string
    step4Body: string
    remembranceLabel: string
    remembrancePh: string
    enhanceWithAi: string
    enhanceGenerating: string
    enhanceChooseVersion: string
    enhanceUseThis: string
    enhanceWriteFirst: string
    enhanceTooLong: string
    enhanceErrorGeneric: string
    /** AI remembrance personas — cards: Poetic / Formal / Warm */
    enhanceOptionPoetic: string
    enhanceOptionFormal: string
    enhanceOptionWarm: string
    enhanceRefine: string
    enhanceRefining: string
    step5Title: string
    step5Body: string
    yes: string
    no: string
    step6Title: string
    step6Body: string
    location: string
    date: string
    time: string
    phLocation: string
    hour: string
    min: string
    amPm: string
    step7Title: string
    step7Body: string
    support: string
    phFund: string
    step8Title: string
    step8Body: string
    signedIn: string
    checkingAccount: string
    nextChoosePlan: string
    continueWithGoogle: string
    almostThereTitle: string
    almostThereBody: string
    yourSelectedPlan: string
    comingSoonTag: string
    changePlanPrompt: string
    backToSummary: string
    keepTheirLightTitle: string
    keepTheirLightBodyLocked: string
    keepTheirLightBodyOpen: string
    invitationReadyKicker: string
    invitationTitle: (name: string) => string
    invitationBody: string
    viewMemorial: string
    creating: string
    checkingAccountBtn: string
    plans: {
      free: { title: string; tagline: string; b1: string; b2: string; tierSub: string }
      plus: { title: string; tagline: string; b1: string; b2: string; tierSub: string }
      premium: { title: string; tagline: string; b1: string; b2: string; tierSub: string }
    }
  }
}

export type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? DeepPartial<T[K]> : T[K] }

function mergeApp(base: AppStrings, patch: DeepPartial<AppStrings>): AppStrings {
  function deepMerge(a: unknown, b: unknown): unknown {
    if (b === undefined) return a
    if (typeof b === "function") return b
    if (b === null || typeof b !== "object" || Array.isArray(b)) return b
    if (a === null || typeof a !== "object" || Array.isArray(a)) return deepMerge({}, b)
    const ao = a as Record<string, unknown>
    const bo = b as Record<string, unknown>
    const result: Record<string, unknown> = { ...ao }
    for (const k of Object.keys(bo)) {
      result[k] = deepMerge(ao[k], bo[k])
    }
    return result
  }
  return deepMerge(base, patch) as AppStrings
}

const EN: AppStrings = {
  common: {
    loading: "Loading…",
    backToHome: "Back to home",
    returnHome: "Return home",
    cancel: "Cancel",
    close: "Close",
    save: "Save",
    ok: "OK",
    tryAgain: "Try again",
    signingOut: "Signing out…",
    signOut: "Sign out",
    language: "Language",
    open: "Open",
    back: "Back",
    continueStory: "Continue the Story",
    creating: "Creating…",
    redirecting: "Redirecting…",
    deleting: "Deleting…",
    memorialFallbackName: "Memorial",
  },
  signIn: {
    loading: "Loading…",
    kicker: "Sign in",
    title: "Welcome back",
    body: "Use the same Google account you used when you created your memorial.",
    continueGoogle: "Continue with Google",
    redirecting: "Redirecting…",
    signInFailed: "Sign-in could not start.",
  },
  find: {
    kicker: "Find a Loved One",
    title: "Locate a memorial page.",
    body: "Paste the memorial link or enter the code the family shared with you. We'll take you straight there.",
    placeholder: "e.g. https://aeterna.app/event/abc123 or just abc123",
    open: "Open",
    badLink: "We couldn't recognise that link or code. Please check and try again.",
  },
  myMemorial: {
    kicker: "My memorial",
    loadingTitle: "Loading",
    loadingBody: "Checking your account…",
    emptyTitle: "No memorial yet",
    emptyBody: "We couldn't find a memorial linked to this account. Create one to get started.",
    createCta: "Create a memorial",
    listTitle: "Your memorials",
    listBody: "Open a dashboard to manage stories and settings, or delete a memorial permanently.",
    deleteMemorialAria: (name: string) => `Delete memorial ${name}`,
    deleteTitle: "Delete this memorial?",
    deleteBody: (name: string) =>
      `This permanently removes ${name} and its stories. This cannot be undone.`,
    typeDelete: "Type",
    afterTypeWord: "to confirm",
    deletePlaceholder: "delete",
    deleteCta: "Delete memorial",
    errorTitle: "Something went wrong",
    errorFallback: "Please try again.",
    somethingWrong: "Something went wrong",
  },
  createNew: {
    preparing: "Preparing your memorial…",
    kicker: "Create new memorial",
    title: "Tell us a few details about your loved one",
    body: "This helps us set up the memorial and service information. You can always change these details later from the family dashboard.",
    errName: "Please enter your loved one's name.",
    errCeremony: "Please choose the service month, date, and time.",
    errCreate: "There was a problem creating this memorial. Please try again.",
    labelName: "Name",
    phName: "Full name of your loved one",
    labelBirth: "Date of birth",
    labelDeath: "Date of passing",
    dateFormatHint: "Format: mm/dd/yyyy",
    labelPortrait: "Portrait photograph",
    addSpark: "Add a Spark of Memory",
    portraitHint: "Shown on the memorial and in presentation — a clear portrait helps everyone recognize them.",
    selectedFile: "Selected:",
    labelLocation: "Service location",
    phLocation: "Venue, chapel or service location",
    searchingPlaces: "Searching nearby places…",
    locationMockError: "Suggestions unavailable - please enter manually",
    labelServiceTime: "Service time",
    month: "Month",
    date: "Date",
    selectTime: "Select time",
    serviceTimeNote: "Guests will see this exactly as written on the memorial page.",
    labelContribution: "Contribution link (optional)",
    phContribution: "e.g. GoFundMe, PayPal, or bank transfer page",
    contributionHint:
      'Optional. Paste any fundraising page; it will appear as "Support the Family" on the memorial.',
    labelMusic: "Background music (optional)",
    phMusic: "Paste a YouTube link or audio URL",
    musicHint: "Optional. Many families simply paste a single YouTube link to a favourite song or recording.",
    footerNote:
      "After you create this memorial, we'll open the family dashboard where you can review tributes and share the link with guests.",
    submit: "Continue the Story",
    submitting: "Creating…",
  },
  pricingCurrencyNote: {
    usd: "All prices in US dollars (USD).",
    krw: "Charged in Korean won (KRW).",
    jpy: "Charged in Japanese yen (JPY).",
    sar: "Charged in Saudi riyals (SAR).",
  },
  memorial: {
    loadSyncing: "Syncing memorial…",
    loadLoading: "Loading memorial…",
    syncHint: "Confirming your memorial on our servers. This usually takes a moment after checkout.",
    notFound: "Memorial not found.",
    addMemory: "Add a memory",
    share: "Share",
    admin: "Admin",
    photoWindow: "Photo gathering window ·",
    linkCopied: "Link copied.",
    premiumRestoreTitle: "Restore with Premium",
    premiumRestoreBody:
      "The photo collection window has closed, so memories are now protected. Upgrade to Premium to restore access.",
    paymentsSoonTitle: "Payments are almost ready",
    paymentsSoonBody: "Secure checkout will be available soon to unlock all memories.",
    adminForbidden: "You do not have permission to access the admin settings.",
    donationThankYou: "Thank you for your thoughtful support.",
    memoryReceivedTitle: "Memory Received",
    memoryReceivedBody: "It will appear on the shrine once approved. We can email you when it goes live.",
    emailWhenLive: "Email me when it's live",
    emailPlaceholder: "Email",
    saving: "Saving…",
    notifyMe: "Notify me",
    afterUploadDone: "You're set — we'll email you when this memory is visible on the page.",
    shareModalTitle: "Share this memorial",
    shareModalBody: "Invite family and friends to visit and contribute.",
    whatsApp: "WhatsApp",
    message: "Message",
    copyLink: "Copy link",
    filmAria: "AI Memorial Film",
    videoUnsupported: "Your browser does not support the video tag.",
    filmLabel: "Film",
    redirectCheckout: "Redirecting to checkout…",
    downloadFilm: "Download High-Quality Film",
    unlockMemories: "Unlock all memories",
    premium: "Premium",
    locked: "Locked",
    viewStoryAria: "View story",
    donationSupportCta: "support · view account details",
    donationStatus: "Donation status",
    donationSoFar: (count: number) =>
      `So far, ${count} people have shared support for the family.`,
    shareMemoryTitle: "Share a memory",
    stepCounter: (n: number) => `${n} / 3`,
    formNameTitle: "What is your name?",
    formNamePh: "Your name",
    formPhotoTitle: "Add a memory.",
    changePhoto: "Change photo",
    tapAddMemory: "Tap to add a memory",
    dragHere: "or drag one here",
    formStoryTitle: "Tell us the story behind this photo.",
    formStoryPh: "A favorite trip, a quiet everyday moment, or a smile you'll always remember…",
    formStoryPremium: "Your photo might be featured in the 1-minute AI tribute film.",
    formStoryFree: "Thank you for sharing your precious memory.",
    sending: "Sending…",
    shareThisMemory: "Share this memory",
    continueTheStoryBtn: "Continue the Story",
    restorePremium: "Restore with Premium",
    collectionClosed: "Photo submission has closed",
    filmCraftedTitle: "The AI Memorial Film is being crafted",
    filmCraftedSubtitle: "Your memories are being woven into a lasting tribute",
    collectionClosedGalleryNote:
      "Thank you for the memories shared here — family and friends can still view the gallery below.",
    notifyPlaceholder: "Your email",
    notifyFilmTitle: "Notify me when the film is released",
    notifyFilmThanks: "Thank you. We'll notify you when it's ready.",
    noMemoriesYet: "No memories have been shared yet.",
    preserveLegacyHeader: "Preserve this legacy",
    trialGatheringTimerLabel: "Time remaining in this gathering window",
    trialCountdownFromMs: (ms: number) => {
      const { d, h, m, s } = splitMsToDHMS(ms)
      const p = (n: number) => String(n).padStart(2, "0")
      return `${p(d)}d : ${p(h)}h : ${p(m)}m : ${p(s)}s`
    },
    trialUpgradePart1: "To keep these memories alive forever, please ",
    trialUpgradeLinkLabel: "upgrade",
    trialUpgradePart2:
      " within 7 days. After this window, the shrine will gently close to protect the privacy of the data.",
    memorialUpgradeAnchorIntro: "Complete secure checkout below to preserve this memorial and keep every shared memory available.",
    adminLoadingTitle: "Loading",
    adminLoadingSubtitle: "Preparing your memorial dashboard…",
    adminAccessRestrictedTitle: "Access restricted",
    adminAccessRestrictedBody: "You don't have access to this dashboard.",
    adminBackToHome: "Back to home",
    adminNotFoundTitle: "Not found",
    adminNotFoundBody: "This memorial could not be loaded.",
    adminDashboardKicker: "Dashboard",
    adminDashboardWelcome:
      "Curate memories, protect the legacy, and share this sanctuary. Manage profile and media anytime in Settings.",
    adminEdit: "Edit",
    adminSharePdfInvitation: "Share PDF invitation",
    adminPdfGenerating: "Generating…",
    adminBackToFeed: "Back to feed",
    adminCurrentPlan: "Current plan",
    adminTierLabelFree: "Free",
    adminTierLabelPlus: "Plus",
    adminTierLabelPremium: "Premium",
    adminContributionsCollected: (count: number) =>
      count === 1 ? "1 Heartfelt Contribution Collected" : `${count} Heartfelt Contributions Collected`,
    adminPreserveForeverCta: "Preserve Forever — $19.99",
    adminProcessing: "Processing…",
    adminMemoriesSectionTitle: "Memories",
    adminTabPending: (count: number) => `Pending (${count})`,
    adminTabApproved: (count: number) => `Approved (${count})`,
    upgradePremiumCta: "Upgrade to Premium",
    upgradePremiumTail: "for an AI tribute film on future memorials.",
    recentSupportAria: "Recent Support",
    donationStatusAria: "Donation status",
    close: "Close",
    returnHome: "Return home",
    errors: {
      nameRequired: "Please share your name.",
      photoRequired: "Please choose a photo.",
      storyRequired: "Please add your name and the story behind your photo.",
      emailRequired: "Please enter your email.",
      subscribeFailed: "We couldn't subscribe you just now. Please try again in a moment.",
      submitFailed: "Failed to submit.",
      memorialNotFound: "Memorial not found.",
      loadFailed: "Something went wrong while loading.",
      checkoutFailed: "Unable to start checkout.",
      donationCheckoutFailed: "We couldn’t start checkout. Please try again.",
    },
  },
  createWizard: {
    stepOf: "Step {current} of {total}",
    resumeToast: "We saved your place — you can pick up here.",
    welcomeSacred: "Welcome to your sacred space.",
    paymentPending: "Payment didn't finish.",
    paymentPendingBold: "Continue the Story",
    dismiss: "Dismiss",
    whoHonoringTitle: "Who are we honoring?",
    whoHonoringSubtitle: "A calm place to remember someone you love.",
    honorPerson: "Someone dear",
    honorPet: "A companion",
    step1Title: "Their name",
    step1Subtitle: "What name should we use?",
    step1Ph: "Their name",
    step2Title: "A face to remember",
    step2HintPhoto: "Drag on the photo to adjust how it sits in the circle.",
    step2HintNoPhoto: "A photo helps people recognize them. Tap the circle to add one.",
    chooseDifferentPhoto: "Choose a different photo",
    addSparkAria: "Add a Spark of Memory",
    addSparkLabel: "Add a Spark of Memory",
    step3Title: "Honoring Their Journey",
    step3Subtitle: "Exact dates are lovely; a year alone is fine if that's what you have.",
    born: "Born",
    atRest: "At Rest",
    step4Title: "A few words about them",
    step4Body:
      "Share a short tribute, a memory, or what made them special. This can appear on the printed invitation below their dates — you can edit it later from settings.",
    remembranceLabel: "Remembrance",
    remembrancePh: "Optional — a sentence or two, or a longer remembrance.",
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
    step5Title: "Will you host a memorial service?",
    step5Body:
      "If yes, you can add location, date, and time next. If not, we'll move on — you can always add details later from the memorial page.",
    yes: "Yes",
    no: "No",
    step6Title: "Memorial Service",
    step6Body: "Please input service details. You can skip and add later.",
    location: "Location",
    date: "Date",
    time: "Time",
    phLocation: "Venue, address, or city",
    hour: "Hour",
    min: "Min",
    amPm: "AM / PM",
    step7Title: "Support Family",
    step7Body: "Please add a support link. You can skip and add later.",
    support: "Support",
    phFund: "Fund or charity link",
    step8Title: "Claim your memorial",
    step8Body: "Sign in so you can keep this memorial safe and change it anytime.",
    signedIn: "Signed in",
    checkingAccount: "Checking your account…",
    nextChoosePlan: "Next, choose how you'd like to keep their page.",
    continueWithGoogle: "Continue the story",
    almostThereTitle: "You're almost there",
    almostThereBody: "When you're ready, we'll open their page — or go on to pay if you chose a paid plan.",
    yourSelectedPlan: "Your selected plan",
    comingSoonTag: "Coming Soon",
    changePlanPrompt: "Want to change your plan?",
    backToSummary: "← Back to plan summary",
    keepTheirLightTitle: "Keep their light",
    keepTheirLightBodyLocked: "Choose the plan that fits — you can always adjust later where your account allows.",
    keepTheirLightBodyOpen: "One calm choice. Change later if you need.",
    invitationReadyKicker: "Invitation ready",
    invitationTitle: (name: string) => `Memorial for ${name} is ready`,
    invitationBody: "Share a thoughtful invitation — family and friends can add photos and stories from any device.",
    viewMemorial: "View memorial",
    creating: "Creating…",
    checkingAccountBtn: "Checking account…",
    plans: {
      free: {
        title: "Sacred Window",
        tagline: "7 days to gather memories. A gentle, peaceful start.",
        b1: "Seven days for family and friends to add photos and stories",
        b2: "Upgrade anytime to preserve the shrine forever",
        tierSub: "7 days to gather. Gentle start.",
      },
      plus: {
        title: "Eternal Legacy",
        tagline: "Keep every photo and story preserved forever. No expiration.",
        b1: "Every photo and story preserved for good",
        b2: "A permanent, shareable memorial home",
        tierSub: "Preserved forever. No expiration.",
      },
      premium: {
        title: "The Eternal Film",
        tagline: "Eternal Legacy + AI Film Pre-Order",
        b1: "Everything in Eternal Legacy",
        b2: "Priority access to your AI tribute film when V2 launches — pre-order today",
        tierSub: "Eternal Legacy + AI Film Pre-Order",
      },
    },
  },
}

const KO_PATCH: DeepPartial<AppStrings> = {
  common: {
    loading: "로딩 중…",
    backToHome: "홈으로",
    returnHome: "홈으로 돌아가기",
    cancel: "취소",
    close: "닫기",
    save: "저장",
    ok: "확인",
    tryAgain: "다시 시도",
    signingOut: "로그아웃 중…",
    signOut: "로그아웃",
    language: "언어",
    open: "열기",
    back: "뒤로",
    continueStory: "이야기 이어가기",
    creating: "만드는 중…",
    redirecting: "이동 중…",
    deleting: "삭제 중…",
    memorialFallbackName: "기념관",
  },
  signIn: {
    loading: "로딩 중…",
    kicker: "로그인",
    title: "다시 오신 것을 환영합니다",
    body: "기념관을 만들 때 사용한 동일한 Google 계정으로 로그인하세요.",
    continueGoogle: "Google로 계속",
    redirecting: "이동 중…",
    signInFailed: "로그인을 시작할 수 없습니다.",
  },
  find: {
    kicker: "소중한 분 찾기",
    title: "기념 페이지로 이동합니다.",
    body: "가족이 공유한 기념 링크를 붙여 넣거나 코드를 입력하세요. 바로 연결해 드립니다.",
    placeholder: "예: https://aeterna.app/event/abc123 또는 abc123",
    open: "열기",
    badLink: "링크나 코드를 인식하지 못했습니다. 확인 후 다시 시도해 주세요.",
  },
  myMemorial: {
    kicker: "내 기념관",
    loadingTitle: "로딩 중",
    loadingBody: "계정을 확인하는 중…",
    emptyTitle: "아직 기념관이 없습니다",
    emptyBody: "이 계정에 연결된 기념관을 찾지 못했습니다. 새로 만들어 보세요.",
    createCta: "기념관 만들기",
    listTitle: "내 기념관",
    listBody: "대시보드에서 이야기와 설정을 관리하거나 기념관을 영구 삭제할 수 있습니다.",
    deleteMemorialAria: (name: string) => `${name} 기념관 삭제`,
    deleteTitle: "이 기념관을 삭제할까요?",
    deleteBody: (name: string) => `${name}과(와) 모든 이야기가 영구 삭제됩니다. 되돌릴 수 없습니다.`,
    typeDelete: "확인을 위해",
    afterTypeWord: "를 입력하세요",
    deletePlaceholder: "delete",
    deleteCta: "기념관 삭제",
    errorTitle: "문제가 발생했습니다",
    errorFallback: "다시 시도해 주세요.",
    somethingWrong: "문제가 발생했습니다",
  },
  createNew: {
    preparing: "기념관을 준비하는 중…",
    kicker: "새 기념관 만들기",
    title: "소중한 분에 대해 알려주세요",
    body: "장례·추모 정보 설정에 도움이 됩니다. 가족 대시보드에서 언제든 수정할 수 있습니다.",
    errName: "이름을 입력해 주십시오.",
    errCeremony: "예배(추모) 월·일·시간을 선택해 주십시오.",
    errCreate: "기념관을 만들 수 없었습니다. 다시 시도해 주십시오.",
    labelName: "이름",
    phName: "고인(반려동물)의 전체 이름",
    labelBirth: "생년월일",
    labelDeath: "별세일",
    dateFormatHint: "형식: mm/dd/yyyy",
    labelPortrait: "초상 사진",
    addSpark: "추억 한 장 올리기",
    portraitHint: "기념 페이지와 프레젠테이션에 표시됩니다. 잘 보이는 초상이면 모두가 알아볼 수 있습니다.",
    selectedFile: "선택됨:",
    labelLocation: "장소",
    phLocation: "예배장, 예배당 또는 장소",
    searchingPlaces: "주변 장소 검색 중…",
    locationMockError: "제안을 불러올 수 없습니다 — 직접 입력해 주세요",
    labelServiceTime: "예배 시간",
    month: "월",
    date: "일",
    selectTime: "시간 선택",
    serviceTimeNote: "방문객에게 기념 페이지에 그대로 표시됩니다.",
    labelContribution: "후원 링크(선택)",
    phContribution: "예: 고펀미, 페이팔, 계좌 안내 페이지",
    contributionHint: '선택 사항. 모금 페이지 URL을 넣으면 기념관에 "가족 돕기"로 표시됩니다.',
    labelMusic: "배경 음악(선택)",
    phMusic: "유튜브 또는 오디오 URL",
    musicHint: "선택 사항. 많은 가족이 좋아하는 곡 유튜브 링크 하나만 붙여 넣습니다.",
    footerNote: "만들면 가족 대시보드가 열리고 추모를 검토하고 게스트에게 링크를 공유할 수 있습니다.",
    submit: "이야기 이어가기",
    submitting: "만드는 중…",
  },
  pricingCurrencyNote: {
    usd: "모든 가격은 USD 기준입니다.",
    krw: "한국 원(KRW)으로 청구됩니다.",
    jpy: "일본 엔(JPY)으로 청구됩니다.",
    sar: "사우디 리얄(SAR)로 청구됩니다.",
  },
  memorial: {
    loadSyncing: "동기화 중…",
    loadLoading: "기념관을 불러오는 중…",
    syncHint: "서버에서 기념관을 확인하는 중입니다. 결제 직후 잠시 걸릴 수 있습니다.",
    notFound: "기념관을 찾을 수 없습니다.",
    addMemory: "추억 더하기",
    share: "공유하기",
    admin: "관리자",
    photoWindow: "사진 수집 기간 ·",
    linkCopied: "링크를 복사했습니다.",
    premiumRestoreTitle: "프리미엄으로 복원",
    premiumRestoreBody: "사진 수집 기간이 끝나 추억이 보호됩니다. 프리미엄으로 업그레이드하면 다시 볼 수 있습니다.",
    paymentsSoonTitle: "결제가 곧 준비됩니다",
    paymentsSoonBody: "안전한 결제로 모든 추억을 열 수 있게 곧 제공됩니다.",
    adminForbidden: "관리 설정에 접근할 권한이 없습니다.",
    donationThankYou: "따뜻한 마음에 감사드립니다.",
    memoryReceivedTitle: "추억을 받았습니다",
    memoryReceivedBody: "승인되면 기념관에 올라갑니다. 공개 시 이메일로 알려드릴 수 있습니다.",
    emailWhenLive: "공개되면 이메일로 알려주세요",
    emailPlaceholder: "이메일",
    saving: "저장 중…",
    notifyMe: "알림 받기",
    afterUploadDone: "완료되었습니다. 이 추억이 페이지에 보이면 이메일로 알려드립니다.",
    shareModalTitle: "이 기념관 공유하기",
    shareModalBody: "가족과 지인을 초대해 방문하고 함께 남겨 주세요.",
    whatsApp: "WhatsApp",
    message: "메시지",
    copyLink: "링크 복사",
    filmAria: "AI 추모 영상",
    videoUnsupported: "브라우저가 비디오 태그를 지원하지 않습니다.",
    filmLabel: "영상",
    redirectCheckout: "결제로 이동 중…",
    downloadFilm: "고화질 영상 받기",
    unlockMemories: "모든 추억 열기",
    premium: "프리미엄",
    locked: "잠김",
    donationSupportCta: "후원 · 계좌 보기",
    donationStatus: "후원 현황",
    donationSoFar: (count: number) => `지금까지 ${count}분이 가족을 위해 마음을 나누었습니다.`,
    shareMemoryTitle: "추억 나누기",
    stepCounter: (n: number) => `${n} / 3`,
    formNameTitle: "이름을 알려주세요",
    formNamePh: "이름",
    formPhotoTitle: "추억 사진을 올려주세요.",
    changePhoto: "사진 바꾸기",
    tapAddMemory: "탭하여 추억 추가",
    dragHere: "또는 여기로 끌어 놓기",
    formStoryTitle: "이 사진 뒤의 이야기를 들려주세요.",
    formStoryPh: "여행, 일상의 한 순간, 잊지 못할 미소…",
    formStoryPremium: "이 사진이 1분 AI 추모 영상에 담길 수 있습니다.",
    formStoryFree: "소중한 추억을 나눠 주셔서 감사합니다.",
    sending: "보내는 중…",
    shareThisMemory: "이 추억 공유하기",
    continueTheStoryBtn: "이야기 이어가기",
    restorePremium: "프리미엄으로 복원",
    collectionClosed: "사진 제출이 마감되었습니다",
    filmCraftedTitle: "AI 추모 영상을 준비하고 있습니다",
    filmCraftedSubtitle: "추억들이 오래 남을 헌사로 엮이고 있습니다",
    collectionClosedGalleryNote:
      "이곳에 나눠 주신 추억에 감사드립니다 — 가족과 지인은 아래 갤러리를 계속 둘러보실 수 있습니다.",
    notifyPlaceholder: "이메일",
    notifyFilmTitle: "영상이 공개되면 이메일로 알려 주세요",
    notifyFilmThanks: "감사합니다. 준비되면 알려 드리겠습니다.",
    noMemoriesYet: "아직 공유된 추억이 없습니다.",
    preserveLegacyHeader: "이 유산을 보존하세요",
    trialGatheringTimerLabel: "추억 수집 종료까지 남은 시간",
    trialCountdownFromMs: (ms: number) => {
      const { d, h, m, s } = splitMsToDHMS(ms)
      const p = (n: number) => String(n).padStart(2, "0")
      return `${p(d)}일 : ${p(h)}시 : ${p(m)}분 : ${p(s)}초`
    },
    trialUpgradePart1: "이 추억들을 영원히 간직하시려면 7일 이내에 ",
    trialUpgradeLinkLabel: "업그레이드",
    trialUpgradePart2:
      "해 주세요. 이 기간이 지나면 데이터 보호를 위해 추모관이 고요히 닫히게 됩니다.",
    memorialUpgradeAnchorIntro: "아래에서 안전하게 결제를 완료하면 이 추모관을 영구적으로 보존하고, 나눠 주신 추억을 계속 둘러보실 수 있습니다.",
    adminLoadingTitle: "로딩 중",
    adminLoadingSubtitle: "추모 대시보드를 준비하고 있습니다…",
    adminAccessRestrictedTitle: "접근 제한",
    adminAccessRestrictedBody: "이 대시보드에 접근할 권한이 없습니다.",
    adminBackToHome: "홈으로",
    adminNotFoundTitle: "찾을 수 없음",
    adminNotFoundBody: "이 추모관을 불러올 수 없습니다.",
    adminDashboardKicker: "대시보드",
    adminDashboardWelcome:
      "추억을 큐레이션하고, 유산을 보호하며, 이 성소를 공유하세요. 프로필과 미디어는 설정에서 언제든 관리할 수 있습니다.",
    adminEdit: "편집",
    adminSharePdfInvitation: "PDF 초대장",
    adminPdfGenerating: "생성 중…",
    adminBackToFeed: "피드로 돌아가기",
    adminCurrentPlan: "현재 플랜",
    adminTierLabelFree: "무료",
    adminTierLabelPlus: "플러스",
    adminTierLabelPremium: "프리미엄",
    adminContributionsCollected: (count: number) => `${count}개의 소중한 추억이 수집됨`,
    adminPreserveForeverCta: "영원히 보존하기 — $19.99",
    adminProcessing: "처리 중…",
    adminMemoriesSectionTitle: "추억들",
    adminTabPending: (count: number) => `대기 중 (${count})`,
    adminTabApproved: (count: number) => `승인됨 (${count})`,
    upgradePremiumCta: "프리미엄으로 업그레이드",
    upgradePremiumTail: "향후 기념관의 AI 헌사 영상을 위해.",
    recentSupportAria: "최근 후원",
    donationStatusAria: "후원 현황",
    close: "닫기",
    returnHome: "홈으로",
    errors: {
      nameRequired: "이름을 입력해 주십시오.",
      photoRequired: "사진을 선택해 주십시오.",
      storyRequired: "이름과 사진 뒤의 이야기를 입력해 주십시오.",
      emailRequired: "이메일을 입력해 주십시오.",
      subscribeFailed: "지금은 구독을 처리할 수 없습니다. 잠시 후 다시 시도해 주십시오.",
      submitFailed: "제출에 실패했습니다.",
      memorialNotFound: "기념관을 찾을 수 없습니다.",
      loadFailed: "불러오는 중 문제가 발생했습니다.",
      checkoutFailed: "결제를 시작할 수 없습니다.",
      donationCheckoutFailed: "결제를 시작할 수 없습니다. 다시 시도해 주세요.",
    },
  },
  createWizard: {
    stepOf: "{current}단계 / 총 {total}단계",
    resumeToast: "이어서 진행할 수 있도록 저장했습니다.",
    welcomeSacred: "당신의 성소에 오신 것을 환영합니다.",
    paymentPending: "결제가 완료되지 않았습니다.",
    paymentPendingBold: "이야기 이어가기",
    dismiss: "닫기",
    whoHonoringTitle: "누구를 기리고 싶으신가요?",
    whoHonoringSubtitle: "소중한 이를 위한 고요한 추억의 공간. 우리 마음속에 깊은 발자취를 남긴 이들을 위하여.",
    honorPerson: "소중한 사람",
    honorPet: "함께한 반려동물",
    step1Title: "고인의 성함",
    step1Subtitle: "어떤 이름을 사용할까요?",
    step1Ph: "이름",
    step2Title: "기억하고 싶은 얼굴",
    step2HintPhoto: "원 안에서 사진 위치를 드래그해 조정하세요.",
    step2HintNoPhoto:
      "사진은 지인들이 고인을 더 잘 기억하게 돕습니다. 원을 눌러 사진을 추가해 주세요.",
    chooseDifferentPhoto: "다른 사진 선택",
    addSparkAria: "추억의 조각 추가하기",
    addSparkLabel: "추억의 조각 추가하기",
    step3Title: "그들이 걸어온 길",
    step3Subtitle: "정확한 날짜도 좋고, 연도만 입력하셔도 무방합니다.",
    born: "생년월일",
    atRest: "별세일",
    step4Title: "고인을 위한 짧은 헌사",
    step4Body:
      "짧은 추모글이나 특별했던 순간을 들려주세요. 인쇄용 초대장에도 표시되며, 나중에 설정에서 수정 가능합니다.",
    remembranceLabel: "추모의 글",
    remembrancePh: "선택 — 한두 문장 또는 더 긴 글",
    enhanceWithAi: "AI로 다듬기",
    enhanceGenerating: "다듬는 중…",
    enhanceChooseVersion: "버전 선택",
    enhanceUseThis: "이 버전 사용",
    enhanceWriteFirst: "먼저 글을 적은 뒤 다시 시도해 주세요.",
    enhanceTooLong: "글이 너무 깁니다. 줄인 뒤 다시 시도해 주세요.",
    enhanceErrorGeneric: "문제가 발생했습니다. 다시 시도해 주세요.",
    enhanceOptionPoetic: "서정",
    enhanceOptionFormal: "정중",
    enhanceOptionWarm: "온기",
    enhanceRefine: "다듬기",
    enhanceRefining: "다듬는 중…",
    step5Title: "추모식을 진행하시나요?",
    step5Body: "'예'를 선택하시면 장소와 일시를 추가할 수 있습니다.",
    yes: "예",
    no: "아니요",
    step6Title: "추모식 상세 안내",
    step6Body: "세부 정보를 입력하세요. 건너뛰고 나중에 추가할 수 있습니다.",
    location: "장소",
    date: "날짜",
    time: "시간",
    phLocation: "예배장, 주소 또는 도시",
    hour: "시",
    min: "분",
    amPm: "오전 / 오후",
    step7Title: "가족 지원",
    step7Body: "마음을 전할 수 있는 링크(부의금 등)를 추가해 주세요.",
    support: "지원 링크",
    phFund: "모금 또는 자선 링크",
    step8Title: "추모관 소유하기",
    step8Body: "이 추모관을 안전하게 보관하고 언제든 수정할 수 있도록 로그인해 주세요.",
    signedIn: "로그인됨",
    checkingAccount: "계정 확인 중…",
    nextChoosePlan: "다음 단계: 페이지 보존 방식 선택",
    continueWithGoogle: "이야기 이어가기",
    almostThereTitle: "거의 다 왔습니다",
    almostThereBody: "준비가 되면 페이지를 열거나 유료 플랜을 선택해 결제로 진행합니다.",
    yourSelectedPlan: "선택한 플랜",
    comingSoonTag: "곧 제공",
    changePlanPrompt: "플랜을 바꾸시겠어요?",
    backToSummary: "← 플랜 요약으로",
    keepTheirLightTitle: "영원한 빛으로 남기기",
    keepTheirLightBodyLocked: "맞는 플랜을 고르세요 — 계정에서 허용되는 경우 나중에 조정할 수 있습니다.",
    keepTheirLightBodyOpen: "단 하나의 선택. 나중에 변경 가능합니다.",
    invitationReadyKicker: "초대장 준비 완료",
    invitationTitle: (name: string) => `${name} 님을 위한 추모관이 건립되었습니다`,
    invitationBody:
      "정성이 담긴 초대장을 공유하세요. 가족과 지인들이 앱 없이도 사진과 이야기를 보탤 수 있습니다.",
    viewMemorial: "추모관 보기",
    creating: "만드는 중…",
    checkingAccountBtn: "계정 확인 중…",
    plans: {
      free: {
        title: "기억의 창",
        tagline: "추억을 모으기 위한 7일간의 여정. 평온하고 부드러운 시작.",
        b1: "7일간 가족과 친지가 사진과 이야기를 남깁니다",
        b2: "언제든 업그레이드해 기념관을 영구 보존하세요",
        tierSub: "7일간의 여정. 평온한 시작.",
      },
      plus: {
        title: "영원한 유산",
        tagline: "모든 사진과 기록을 유효기간 없이 영구히 보존합니다.",
        b1: "모든 사진과 이야기가 영구 보존됩니다",
        b2: "영구적으로 공유 가능한 기념의 집",
        tierSub: "영구 보존. 만료 없음.",
      },
      premium: {
        title: "영원한 필름",
        tagline: "Legacy의 모든 혜택과 더불어, AI가 제작하는 1분 추모 필름 우선 이용권을 제공합니다.",
        b1: "Eternal Legacy의 모든 혜택",
        b2: "V2 출시 시 AI 추모 영상 우선 이용 — 지금 사전 예약",
        tierSub: "Legacy + AI 추모 필름 우선 이용",
      },
    },
  },
}

// Japanese
const JA_PATCH: DeepPartial<AppStrings> = {
  common: {
    loading: "読み込み中…",
    backToHome: "ホームへ",
    returnHome: "ホームに戻る",
    cancel: "キャンセル",
    close: "閉じる",
    save: "保存",
    ok: "OK",
    tryAgain: "再試行",
    signingOut: "サインアウト中…",
    signOut: "サインアウト",
    language: "言語",
    open: "開く",
    back: "戻る",
    continueStory: "物語を続ける",
    creating: "作成中…",
    redirecting: "移動中…",
    deleting: "削除中…",
    memorialFallbackName: "メモリアル",
  },
  signIn: {
    kicker: "サインイン",
    title: "おかえりなさい",
    body: "メモリアルを作成したときと同じ Google アカウントをお使いください。",
    continueGoogle: "Google で続行",
    signInFailed: "サインインを開始できませんでした。",
  },
  find: {
    kicker: "大切な方を探す",
    title: "メモリアルページへ移動します。",
    body: "ご家族から共有されたリンクを貼り付けるか、コードを入力してください。",
    placeholder: "例: https://aeterna.app/event/abc123 または abc123",
    badLink: "リンクまたはコードを認識できませんでした。確認して再度お試しください。",
  },
  myMemorial: {
    kicker: "マイ メモリアル",
    loadingTitle: "読み込み中",
    loadingBody: "アカウントを確認しています…",
    emptyTitle: "まだメモリアルがありません",
    emptyBody: "このアカウントに紐づくメモリアルが見つかりませんでした。",
    createCta: "メモリアルを作成",
    listTitle: "あなたのメモリアル",
    listBody: "ダッシュボードでストーリーや設定を管理するか、メモリアルを完全に削除できます。",
    deleteMemorialAria: (name: string) => `${name} のメモリアルを削除`,
    deleteTitle: "このメモリアルを削除しますか？",
    deleteBody: (name: string) => `${name} とすべてのストーリーが完全に削除されます。元に戻せません。`,
    typeDelete: "確認のため",
    afterTypeWord: "と入力してください",
    deletePlaceholder: "delete",
    deleteCta: "メモリアルを削除",
    errorTitle: "問題が発生しました",
    errorFallback: "もう一度お試しください。",
    somethingWrong: "問題が発生しました",
  },
  createNew: {
    preparing: "メモリアルを準備しています…",
    kicker: "新しいメモリアル",
    title: "大切な方について教えてください",
    body: "式やご案内の設定に役立ちます。家族ダッシュボードからいつでも変更できます。",
    errName: "お名前を入力してください。",
    errCeremony: "式の月・日・時間を選んでください。",
    errCreate: "メモリアルを作成できませんでした。もう一度お試しください。",
    labelName: "お名前",
    phName: "故人（ペット）のフルネーム",
    labelBirth: "生年月日",
    labelDeath: "逝去日",
    labelPortrait: "肖像写真",
    addSpark: "思い出の一枚を追加",
    portraitHint: "メモリアルとスライドに表示されます。はっきりした肖像がおすすめです。",
    selectedFile: "選択:",
    labelLocation: "式の場所",
    phLocation: "会場、礼拝堂、住所など",
    searchingPlaces: "近くの場所を検索中…",
    locationMockError: "候補を取得できません — 手入力してください",
    labelServiceTime: "式の時間",
    month: "月",
    date: "日",
    selectTime: "時間を選択",
    serviceTimeNote: "メモリアルページにそのまま表示されます。",
    labelContribution: "寄付リンク（任意）",
    phContribution: "例: GoFundMe、PayPal、振込案内ページ",
    contributionHint: "任意。募金ページのURLを貼ると「家族を支援」として表示されます。",
    labelMusic: "BGM（任意）",
    phMusic: "YouTube または音声 URL",
    musicHint: "任意。お好きな曲の YouTube リンクを貼る方が多いです。",
    footerNote: "作成後は家族ダッシュボードが開き、追悼の確認やリンク共有ができます。",
    submit: "物語を続ける",
    submitting: "作成中…",
  },
  pricingCurrencyNote: {
    usd: "米ドル（USD）表示です。",
    krw: "韓国ウォン（KRW）で請求されます。",
    jpy: "表示価格は日本円（JPY）です。",
    sar: "サウジアラビア リヤル（SAR）で請求されます。",
  },
  memorial: {
    loadSyncing: "同期中…",
    loadLoading: "読み込み中…",
    syncHint: "サーバーでメモリアルを確認しています。決済直後は少し時間がかかることがあります。",
    notFound: "メモリアルが見つかりません。",
    addMemory: "思い出を綴る",
    share: "共有する",
    admin: "管理",
    photoWindow: "写真の受付期間 ·",
    linkCopied: "リンクをコピーしました。",
    premiumRestoreTitle: "プレミアムで復元",
    premiumRestoreBody: "写真の募集期間が終了し、思い出は保護されています。プレミアムで再びご覧いただけます。",
    paymentsSoonTitle: "お支払いはまもなく",
    paymentsSoonBody: "安全なチェックアウトですべての思い出を解放できるよう準備中です。",
    adminForbidden: "管理設定にアクセスする権限がありません。",
    donationThankYou: "温かいご支援ありがとうございます。",
    memoryReceivedTitle: "思い出を受け取りました",
    memoryReceivedBody: "承認されるとページに表示されます。公開時にメールでお知らせできます。",
    emailWhenLive: "公開されたらメールで知らせる",
    notifyMe: "通知する",
    afterUploadDone: "設定しました — ページに表示されたらメールでお知らせします。",
    shareModalTitle: "このメモリアルを共有",
    shareModalBody: "写真と思い出を分かち合ってください",
    message: "メッセージ",
    copyLink: "リンクをコピー",
    videoUnsupported: "お使いのブラウザは動画タグに対応していません。",
    filmLabel: "映像",
    redirectCheckout: "決済へ移動中…",
    downloadFilm: "高画質映像をダウンロード",
    unlockMemories: "すべての思い出を解放",
    premium: "プレミアム",
    locked: "ロック",
    donationSupportCta: "支援 · 口座を見る",
    donationStatus: "寄付の状況",
    donationSoFar: (count: number) => `これまでに ${count} 名がご家族を支援されています。`,
    shareMemoryTitle: "思い出を共有",
    formNameTitle: "お名前を教えてください",
    formNamePh: "お名前",
    formPhotoTitle: "思い出の写真を追加してください。",
    changePhoto: "写真を変更",
    tapAddMemory: "タップして追加",
    dragHere: "またはここにドラッグ",
    formStoryTitle: "この写真の背景にある物語を聞かせてください。",
    formStoryPh: "旅の思い出、静かな日常、忘れられない笑顔…",
    formStoryPremium: "この写真は1分のAI追悼映像に使われることがあります。",
    formStoryFree: "大切な思い出を共有いただきありがとうございます。",
    sending: "送信中…",
    shareThisMemory: "この思い出を共有",
    continueTheStoryBtn: "物語を続ける",
    collectionClosed: "写真の投稿は締め切られました",
    filmCraftedTitle: "AI追悼映像を制作中です",
    filmCraftedSubtitle: "思い出が長く残る賛辞へと紡がれています",
    notifyPlaceholder: "メールアドレス",
    returnHome: "ホームへ",
    noMemoriesYet: "まだ思い出が共有されていません。",
    preserveLegacyHeader: "この遺産を保存する",
    trialGatheringTimerLabel: "思い出を綴る期限",
    trialCountdownFromMs: (ms: number) => {
      const { d, h, m, s } = splitMsToDHMS(ms)
      const p = (n: number) => String(n).padStart(2, "0")
      return `${p(d)}日 : ${p(h)}時 : ${p(m)}分 : ${p(s)}秒`
    },
    trialUpgradePart1: "これらの思い出を永遠に残すために、7日以内に",
    trialUpgradeLinkLabel: "アップグレード",
    trialUpgradePart2:
      "をお願いいたします。期限を過ぎると、データ保護のため、追悼空間は静かに閉じられます。",
    memorialUpgradeAnchorIntro:
      "下の安全な決済で、このメモリアルを保存し、共有された思い出をいつでもご覧いただけます。",
    adminLoadingTitle: "読み込み中",
    adminLoadingSubtitle: "メモリアルダッシュボードを準備しています…",
    adminAccessRestrictedTitle: "アクセスが制限されています",
    adminAccessRestrictedBody: "このダッシュボードにアクセスする権限がありません。",
    adminBackToHome: "ホームへ",
    adminNotFoundTitle: "見つかりません",
    adminNotFoundBody: "このメモリアルを読み込めませんでした。",
    adminDashboardKicker: "ダッシュボード",
    adminDashboardWelcome:
      "想い出を整え、遺産を守り、この聖所を共有しましょう。プロフィールやメディアは設定からいつでも管理できます。",
    adminEdit: "編集",
    adminSharePdfInvitation: "PDF招待状",
    adminPdfGenerating: "生成中…",
    adminBackToFeed: "フィードに戻る",
    adminCurrentPlan: "現在のプラン",
    adminTierLabelFree: "無料",
    adminTierLabelPlus: "プラス",
    adminTierLabelPremium: "プレミアム",
    adminContributionsCollected: (count: number) => `${count}件の心のこもった寄稿`,
    adminPreserveForeverCta: "永遠に保存する — $19.99",
    adminProcessing: "処理中…",
    adminMemoriesSectionTitle: "思い出",
    adminTabPending: (count: number) => `承認待ち (${count})`,
    adminTabApproved: (count: number) => `承認済み (${count})`,
    errors: {
      nameRequired: "お名前を入力してください。",
      photoRequired: "写真を選んでください。",
      storyRequired: "お名前と写真の背景のお話を入力してください。",
      emailRequired: "メールアドレスを入力してください。",
      subscribeFailed: "今は登録できませんでした。しばらくして再度お試しください。",
      submitFailed: "送信に失敗しました。",
      memorialNotFound: "メモリアルが見つかりません。",
      loadFailed: "読み込み中に問題が発生しました。",
    },
  },
  createWizard: {
    stepOf: "ステップ {current} / {total}",
    resumeToast: "続きから再開できるよう保存しました。",
    welcomeSacred: "あなたの聖所へようこそ。",
    paymentPending: "お支払いが完了していません。",
    paymentPendingBold: "物語を続ける",
    dismiss: "閉じる",
    whoHonoringTitle: "どなたを偲びますか？",
    whoHonoringSubtitle: "あなたが愛する人のための、静かな安らぎの空間。",
    honorPerson: "大切な方",
    honorPet: "共に歩んだ伴侶 (ペット)",
    step1Title: "お名前",
    step1Subtitle: "どのようなお名前を表示しますか？",
    step1Ph: "お名前",
    step2Title: "記憶に刻まれたお顔",
    step2HintPhoto: "円の中で写真の位置をドラッグして調整します。",
    step2HintNoPhoto:
      "写真は、訪れる方が故人を偲ぶ助けとなります。円をタップして追加してください。",
    chooseDifferentPhoto: "別の写真を選ぶ",
    addSparkAria: "思い出の輝きを添える",
    addSparkLabel: "思い出の輝きを添える",
    step3Title: "歩んできた道のり",
    step3Subtitle: "正確な日付でも、年だけでも構いません。",
    born: "生年月日",
    atRest: "没年月日",
    step4Title: "故人へ贈る言葉",
    step4Body: "短い献辞や、特別な思い出を綴ってください。",
    remembranceLabel: "追悼の言葉",
    remembrancePh: "任意 — 一文か、もっと長く",
    enhanceWithAi: "AIで整える",
    enhanceGenerating: "整えています…",
    enhanceChooseVersion: "候補を選ぶ",
    enhanceUseThis: "これを使う",
    enhanceWriteFirst: "先に文章を入力してからお試しください。",
    enhanceTooLong: "長すぎます。短くしてからお試しください。",
    enhanceErrorGeneric: "問題が発生しました。もう一度お試しください。",
    enhanceOptionPoetic: "詩情",
    enhanceOptionFormal: "荘厳",
    enhanceOptionWarm: "親しみ",
    enhanceRefine: "整える",
    enhanceRefining: "整えています…",
    step5Title: "追悼式（葬儀）を行われますか？",
    step5Body: "「はい」を選択すると、場所や日時を追加できます。",
    yes: "はい",
    no: "いいえ",
    step6Title: "追悼式の詳細",
    step6Body: "詳細を入力してください。スキップして後から追加できます。",
    location: "会場",
    date: "日付",
    time: "時刻",
    phLocation: "会場、住所、都市",
    hour: "時",
    min: "分",
    amPm: "午前 / 午後",
    step7Title: "ご家族への支援",
    step7Body: "支援用のリンクを追加してください。",
    support: "支援リンク",
    phFund: "募金・慈善リンク",
    step8Title: "追悼空間を登録する",
    step8Body:
      "この空間を安全に保護し、いつでも編集できるようにログインしてください。",
    signedIn: "ログイン済み",
    checkingAccount: "アカウントを確認中…",
    nextChoosePlan: "次のステップ：保存プランの選択",
    continueWithGoogle: "物語を続ける",
    almostThereTitle: "もう少しです",
    almostThereBody: "準備ができたらページを開くか、有料プランならお支払いへ進みます。",
    yourSelectedPlan: "選択したプラン",
    comingSoonTag: "近日公開",
    changePlanPrompt: "プランを変更しますか？",
    backToSummary: "← プラン概要に戻る",
    keepTheirLightTitle: "永遠の光を灯す",
    keepTheirLightBodyLocked: "合うプランを選んでください — アカウントで許可されていれば後から調整できます。",
    keepTheirLightBodyOpen: "真心込めた選択を。",
    invitationReadyKicker: "招待状が整いました",
    invitationTitle: (name: string) => `${name} 様の追悼空間が完成しました`,
    invitationBody: "心のこもった招待状を共有しましょう。",
    viewMemorial: "追悼空間を見る",
    creating: "作成中…",
    checkingAccountBtn: "確認中…",
    plans: {
      free: {
        title: "記憶の窓",
        tagline: "想い出を紡ぎ始めるための7日間。穏やかで優しい始まりの時。",
        b1: "7日間、家族が写真とストーリーを追加できます",
        b2: "いつでもアップグレードして永続保存",
        tierSub: "7日間の無料期間。穏やかな始まり。",
      },
      plus: {
        title: "永遠の遺産",
        tagline: "すべての写真と物語を、期限なく永久に保存いたします。",
        b1: "すべての写真とストーリーが永久保存されます",
        b2: "永続的に共有できるメモリアルの家",
        tierSub: "永久保存。期限なし。",
      },
      premium: {
        title: "永遠のフィルム",
        tagline: "永遠の遺産プランの全特典に加え、AIが制作する1分間の追悼フィルムへの優先アクセスをご提供します。",
        b1: "永遠の遺産プランのすべての特典",
        b2: "V2公開時のAI追悼フィルムを先行 — 今すぐ予約",
        tierSub: "永遠の遺産 ＋ AI追悼フィルム先行",
      },
    },
  },
}

const FR_PATCH: DeepPartial<AppStrings> = {
  common: {
    loading: "Chargement…",
    backToHome: "Retour à l’accueil",
    returnHome: "Retour à l’accueil",
    cancel: "Annuler",
    close: "Fermer",
    save: "Enregistrer",
    ok: "OK",
    tryAgain: "Réessayer",
    signingOut: "Déconnexion…",
    signOut: "Se déconnecter",
    language: "Langue",
    open: "Ouvrir",
    back: "Retour",
    continueStory: "Poursuivre l’histoire",
    creating: "Création…",
    redirecting: "Redirection…",
    deleting: "Suppression…",
    memorialFallbackName: "Mémorial",
  },
  signIn: {
    kicker: "Connexion",
    title: "Bon retour",
    body: "Utilisez le même compte Google que lors de la création du mémorial.",
    continueGoogle: "Continuer avec Google",
    signInFailed: "Impossible de démarrer la connexion.",
  },
  find: {
    kicker: "Trouver un proche",
    title: "Accéder à une page mémorial.",
    body: "Collez le lien ou le code partagé par la famille. Nous vous y emmènerons.",
    placeholder: "ex. https://aeterna.app/event/abc123 ou abc123",
    badLink: "Lien ou code non reconnu. Vérifiez et réessayez.",
  },
  myMemorial: {
    kicker: "Mes sanctuaires",
    loadingTitle: "Chargement",
    loadingBody: "Vérification du compte…",
    emptyTitle: "Pas encore de sanctuaire",
    emptyBody: "Aucun sanctuaire lié à ce compte. Créez-en un pour commencer.",
    createCta: "Créer un sanctuaire maintenant",
    listTitle: "Vos sanctuaires",
    listBody:
      "Ouvrez le tableau de bord pour gérer les souvenirs et les paramètres, ou supprimez définitivement un sanctuaire.",
    deleteMemorialAria: (name: string) => `Supprimer le sanctuaire ${name}`,
    deleteTitle: "Supprimer ce sanctuaire ?",
    deleteBody: (name: string) => `Cela supprime définitivement ${name} et toutes les histoires. Irréversible.`,
    typeDelete: "Tapez",
    afterTypeWord: "pour confirmer",
    deleteCta: "Supprimer le sanctuaire",
    errorTitle: "Une erreur s’est produite",
    errorFallback: "Veuillez réessayer.",
    somethingWrong: "Une erreur s’est produite",
  },
}

const ES_PATCH: DeepPartial<AppStrings> = {
  common: {
    loading: "Cargando…",
    backToHome: "Volver al inicio",
    returnHome: "Volver al inicio",
    cancel: "Cancelar",
    close: "Cerrar",
    save: "Guardar",
    ok: "OK",
    tryAgain: "Reintentar",
    signingOut: "Cerrando sesión…",
    signOut: "Cerrar sesión",
    language: "Idioma",
    open: "Abrir",
    back: "Atrás",
    continueStory: "Continuar la historia",
    creating: "Creando…",
    redirecting: "Redirigiendo…",
    deleting: "Eliminando…",
    memorialFallbackName: "Memorial",
  },
  signIn: {
    kicker: "Iniciar sesión",
    title: "Bienvenido de nuevo",
    body: "Use la misma cuenta de Google con la que creó el memorial.",
    continueGoogle: "Continuar con Google",
    signInFailed: "No se pudo iniciar el inicio de sesión.",
  },
  find: {
    kicker: "Encontrar a un ser querido",
    title: "Ir a una página conmemorativa.",
    body: "Pegue el enlace o el código que compartió la familia. Le llevamos allí.",
    placeholder: "ej. https://aeterna.app/event/abc123 o abc123",
    badLink: "No reconocimos ese enlace o código. Revíselo e inténtelo de nuevo.",
  },
  myMemorial: {
    kicker: "Mi memorial",
    loadingTitle: "Cargando",
    loadingBody: "Comprobando su cuenta…",
    emptyTitle: "Aún no hay memorial",
    emptyBody: "No encontramos un memorial vinculado a esta cuenta. Cree uno para empezar.",
    createCta: "Crear un memorial",
    listTitle: "Sus memoriales",
    listBody: "Abra el panel para gestionar historias y ajustes, o elimine un memorial para siempre.",
    deleteMemorialAria: (name: string) => `Eliminar memorial ${name}`,
    deleteTitle: "¿Eliminar este memorial?",
    deleteBody: (name: string) => `Esto elimina para siempre a ${name} y sus historias. No se puede deshacer.`,
    typeDelete: "Escribe",
    deleteCta: "Eliminar memorial",
    errorTitle: "Algo salió mal",
    errorFallback: "Inténtalo de nuevo.",
    somethingWrong: "Algo salió mal",
  },
}

const AR_PATCH: DeepPartial<AppStrings> = {
  common: {
    loading: "جاري التحميل…",
    backToHome: "العودة إلى الرئيسية",
    returnHome: "العودة إلى الرئيسية",
    cancel: "إلغاء",
    close: "إغلاق",
    save: "حفظ",
    ok: "حسناً",
    tryAgain: "حاول مجدداً",
    signingOut: "جاري تسجيل الخروج…",
    signOut: "تسجيل الخروج",
    language: "اللغة",
    open: "فتح",
    back: "رجوع",
    continueStory: "واصل الحكاية",
    creating: "جاري الإنشاء…",
    redirecting: "جاري إعادة التوجيه…",
    deleting: "جاري الحذف…",
    memorialFallbackName: "صفحة تذكارية",
  },
  signIn: {
    kicker: "تسجيل الدخول",
    title: "مرحباً بعودتك",
    body: "استخدم نفس حساب Google الذي أنشأت به الصفحة التذكارية.",
    continueGoogle: "المتابعة باستخدام Google",
    signInFailed: "تعذر بدء تسجيل الدخول.",
  },
  find: {
    kicker: "البحث عن شخص عزيز",
    title: "الانتقال إلى صفحة تذكارية.",
    body: "الصق الرابط أو أدخل الرمز الذي شاركته العائلة.",
    placeholder: "مثال: https://aeterna.app/event/abc123 أو abc123",
    badLink: "تعذر التعرف على الرابط أو الرمز. تحقق وحاول مرة أخرى.",
  },
  myMemorial: {
    kicker: "صفحتي التذكارية",
    loadingTitle: "جاري التحميل",
    loadingBody: "جاري التحقق من حسابك…",
    emptyTitle: "لا توجد صفحة بعد",
    emptyBody: "لم نعثر على صفحة مرتبطة بهذا الحساب. أنشئ واحدة للبدء.",
    createCta: "إنشاء صفحة تذكارية",
    listTitle: "صفحاتك التذكارية",
    listBody: "افتح لوحة التحكم لإدارة الذكريات والإعدادات أو حذف الصفحة نهائياً.",
    deleteMemorialAria: (name: string) => `حذف الصفحة ${name}`,
    deleteTitle: "حذف هذه الصفحة؟",
    deleteBody: (name: string) => `سيُحذف ${name} وجميع الذكريات نهائياً. لا يمكن التراجع.`,
    typeDelete: "اكتب",
    afterTypeWord: "للتأكيد",
    deleteCta: "حذف الصفحة",
    errorTitle: "حدث خطأ",
    errorFallback: "حاول مرة أخرى.",
    somethingWrong: "حدث خطأ",
  },
}

const ZH_PATCH: DeepPartial<AppStrings> = {
  common: {
    loading: "載入中…",
    backToHome: "返回首頁",
    returnHome: "返回首頁",
    cancel: "取消",
    close: "關閉",
    save: "儲存",
    ok: "確定",
    tryAgain: "重試",
    signingOut: "正在登出…",
    signOut: "登出",
    language: "語言選擇",
    open: "開啟",
    back: "返回",
    continueStory: "延續生命故事",
    creating: "建立中…",
    redirecting: "跳轉中…",
    deleting: "刪除中…",
    memorialFallbackName: "紀念頁",
  },
  signIn: {
    kicker: "登入",
    title: "歡迎回來",
    body: "請使用建立紀念頁時所選的 Google 帳戶。",
    continueGoogle: "使用 Google 繼續",
    signInFailed: "無法開始登入。",
  },
  find: {
    kicker: "尋覓摯友",
    title: "前往紀念頁面。",
    body: "貼上家屬分享的連結，或輸入邀請碼，我們將引您直達。",
    placeholder: "例如：https://aeterna.app/event/abc123 或 abc123",
    badLink: "無法辨識該連結或代碼，請檢查後再試。",
  },
  myMemorial: {
    kicker: "我的紀念頁",
    loadingTitle: "載入中",
    loadingBody: "正在驗證帳戶…",
    emptyTitle: "尚無紀念頁",
    emptyBody: "未找到與此帳戶連結的紀念頁，請先建立。",
    createCta: "建立紀念頁",
    listTitle: "您的紀念頁",
    listBody: "開啟管理面板以管理故事與設定，或永久刪除紀念頁。",
    deleteMemorialAria: (name: string) => `刪除紀念頁 ${name}`,
    deleteTitle: "刪除此紀念頁？",
    deleteBody: (name: string) => `將永久刪除 ${name} 及其所有故事，無法復原。`,
    typeDelete: "請輸入",
    afterTypeWord: "以確認",
    deleteCta: "刪除紀念頁",
    errorTitle: "發生錯誤",
    errorFallback: "請再試一次。",
    somethingWrong: "發生錯誤",
  },
}

export const APP_COPY: Record<LandingLocale, AppStrings> = {
  en: EN,
  ko: mergeApp(EN, KO_PATCH),
  ja: mergeApp(EN, JA_PATCH),
  fr: mergeApp(mergeApp(EN, FR_PATCH), FR_APP_REST),
  es: mergeApp(mergeApp(EN, ES_PATCH), ES_APP_REST),
  ar: mergeApp(mergeApp(EN, AR_PATCH), AR_APP_REST),
  zh: mergeApp(mergeApp(EN, ZH_PATCH), ZH_APP_REST),
}

export function getAppStrings(locale: LandingLocale): AppStrings {
  return APP_COPY[locale] ?? EN
}

export function getAppPricingFootnote(app: AppStrings, currency: PricingCurrencyId): string {
  return app.pricingCurrencyNote[currency]
}
