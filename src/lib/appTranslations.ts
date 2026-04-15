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
    /** Suspense / route loading — secular, peaceful memory space (not religious sanctuary). */
    peacefulMemoryLoading: string
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
    emailPlaceholder: string
    saving: string
    notifyMe: string
    shareModalTitle: string
    shareModalBody: string
    whatsApp: string
    message: string
    copyLink: string
    /** SMS / mailto share row (e.g. Japanese modal). */
    shareChannelEmail: string
    /** Korean share modal primary (system share → Instagram). */
    shareChannelInstagram: string
    filmAria: string
    videoUnsupported: string
    filmLabel: string
    redirectCheckout: string
    downloadFilm: string
    unlockMemories: string
    premium: string
    locked: string
    viewStoryAria: string
    /** Approved photo / story drawer (`StoryMemoryDrawer`) */
    storyDrawerTitle: string
    storyDrawerNoImage: string
    storyDrawerAnonymous: string
    storyDrawerGuestName: string
    storyDrawerHeartAriaRemove: string
    storyDrawerHeartAriaAdd: string
    storyDrawerHeartsLabel: string
    storyDrawerAiFilmHint: string
    storyDrawerCommentsHeading: string
    storyDrawerCommentsLoading: string
    storyDrawerNoCommentsYet: string
    storyDrawerCommentHeartAriaRemove: string
    storyDrawerCommentHeartAriaAdd: string
    storyDrawerCommentHeartTitleRemove: string
    storyDrawerCommentHeartTitleAdd: string
    storyDrawerYourNamePlaceholder: string
    storyDrawerComposerPlaceholder: string
    storyDrawerComposerLabel: string
    storyDrawerSendAria: string
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
    /** Eternal Film: alert when user tries to add a 3rd image for one 10s clip */
    eternalFilmClipPhotoLimitAlert: string
    eternalFilmUploaderChoose: string
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
    /** PDF invitation share sheet (`InvitationActionSheet`) */
    adminInvitationSheetTitle: string
    adminInvitationSheetPreparing: string
    adminInvitationShareInstagram: string
    adminInvitationShareLine: string
    adminInvitationShareWhatsApp: string
    adminInvitationNativeShare: string
    adminInvitationNativeShareHint: string
    adminInvitationDownload: string
    adminInvitationClose: string
    adminInvitationError: string
    adminInvitationCopied: string
    adminInvitationShareText: (name: string) => string
    adminBackToFeed: string
    adminCurrentPlan: string
    adminTierLabelFree: string
    adminTierLabelPlus: string
    adminTierLabelPremium: string
    adminContributionsCollected: (count: number) => string
    /** Premium (AI film) admin — one-line status; replaces plan row + contribution count */
    adminPremiumStatusLine: (count: number) => string
    adminPremiumAiTitle: string
    adminPremiumAiDescription: string
    adminPremiumFilmSelectionSummary: (selected: number, max: number) => string
    adminPremiumGenerateFilmCta: string
    /** Shown when the Generate button is disabled because no photo is selected yet */
    adminPremiumSelectMinGuide: string
    adminPremiumFooterTagline: string
    adminPremiumMaxPhotosHint: (max: number) => string
    adminPremiumFilmSelectRangeError: (min: number, max: number) => string
    adminPremiumTributeLiveBody: string
    adminPremiumPreviewOnMemorialCta: string
    adminPremiumFilmCraftingTitle: string
    adminPremiumFilmCraftingSubtitle: string
    adminPremiumFilmFailed: string
    adminPremiumApprovePhotosFirst: string
    adminPremiumRemoveFromFilmAria: string
    adminPremiumIncludeInFilmAria: string
    /** Completed tribute clips vs total (e.g. 2 / 5) */
    adminPremiumClipsCompletedStatus: (completed: number, total: number) => string
    adminPremiumCompletedClipsLabel: string
    adminPremiumClipLabel: (clipOneIndexed: number, totalClips: number) => string
    adminPremiumAllClipsComplete: string
    adminPremiumNoClipCredits: string
    /** When Luma / AI video is not configured — show waitlist popup (admin generate clip). */
    adminPremiumAiWaitlistTitle: string
    adminPremiumAiWaitlistBody: string
    adminPreserveForeverCta: string
    /** Free tier — Stripe Premium (AI tribute film) checkout */
    adminEternalFilmCta: string
    /** Plus tier — reassurance under plan CTAs */
    adminPlusPreservedBody: string
    adminProcessing: string
    adminMemoriesSectionTitle: string
    adminTabPending: (count: number) => string
    adminTabApproved: (count: number) => string
    /** `/p/[slug]/admin` — pending/approved story cards */
    adminStoryApprove: string
    adminStoryDelete: string
    adminStoryUnapprove: string
    adminStoryDeleteAria: string
    adminStoryDeletePermanentAria: string
    adminApprovedEmpty: string
    adminDeleteMemoryConfirm: string
    adminToastStoryMovedToPending: string
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
  /** `/p/[slug]/admin/settings` — profile & invitation editing */
  adminProfilePage: {
    backToAdmin: string
    pageTitle: string
    editProfileSection: string
    nameLabel: string
    namePlaceholder: string
    birthDateLabel: string
    birthDatePlaceholder: string
    dateOfPassingLabel: string
    dateOfPassingPlaceholder: string
    locationLabel: string
    locationPlaceholder: string
    ceremonyTimeLabel: string
    ceremonyTimePlaceholder: string
    invitationContactPhoneLabel: string
    invitationContactPhonePlaceholder: string
    remembranceMessageLabel: string
    remembrancePlaceholder: string
    remembranceHint: string
    condolenceAccountLabel: string
    condolencePlaceholder: string
    saveProfile: string
    saving: string
    generateQrInvitation: string
    generating: string
    loading: string
    memorialNotFound: string
    invalidSlug: string
    eventNotFound: string
    saveFailed: string
    generatePdfFailed: string
    openInvitationWithLocale: (localeUpper: string) => string
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
    memorialBackgroundTitle: string
    memorialBackgroundSubtitle: string
    memorialBackgroundChoose: string
    memorialBackgroundSkip: string
    backgroundDragHint: string
    /** Step 4: death date must not be before full birth date. */
    datePassingBeforeBirth: string
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
    serviceContactPhoneLabel: string
    serviceContactPhonePh: string
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
  /** `/p/[slug]/success` — Stripe checkout confirmation */
  paymentSuccessPage: {
    loading: string
    loadingSub: string
    kicker: string
    subtitle: string
    /** `[Name]` is replaced with the memorial name */
    descriptionTemplate: string
    descriptionNameFallback: string
    filmInfoPremium: string
    filmInfoPlus: string
    shareTitle: string
    invitationInfo: string
    saveImage: string
    printPdf: string
    nextStepsTitle: string
    step1: string
    step2: string
    step3: string
    btnViewMemorial: string
    btnDashboard: string
    btnDownloadTribute: string
    errorSession: string
    errorConfirm: string
    errorTitle: string
    backToMemorial: string
    suspenseLoading: string
    invitationPreparing: string
    invitationShareTitle: string
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
    peacefulMemoryLoading: "Preparing a peaceful space for your memories.",
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
    memoryReceivedBody:
      "Your memory has been submitted and will be displayed on the memorial once approved by the admin. Once public, others will be able to like and comment on your post.",
    emailPlaceholder: "Email",
    saving: "Saving…",
    notifyMe: "Notify me",
    shareModalTitle: "Share this memorial",
    shareModalBody:
      "Share this Memorial. Invite family and friends to visit and share memories together.",
    whatsApp: "WhatsApp",
    message: "Message",
    copyLink: "Copy link",
    shareChannelEmail: "Email",
    shareChannelInstagram: "Instagram",
    filmAria: "AI Memorial Film",
    videoUnsupported: "Your browser does not support the video tag.",
    filmLabel: "Film",
    redirectCheckout: "Redirecting to checkout…",
    downloadFilm: "Download High-Quality Film",
    unlockMemories: "Unlock all memories",
    premium: "Premium",
    locked: "Locked",
    viewStoryAria: "View story",
    storyDrawerTitle: "Memory",
    storyDrawerNoImage: "No image",
    storyDrawerAnonymous: "Anonymous",
    storyDrawerGuestName: "Guest",
    storyDrawerHeartAriaRemove: "Remove heart",
    storyDrawerHeartAriaAdd: "Heart this memory",
    storyDrawerHeartsLabel: "Hearts",
    storyDrawerAiFilmHint: "Loved photos may be featured in the film.",
    storyDrawerCommentsHeading: "Share a memory",
    storyDrawerCommentsLoading: "Loading…",
    storyDrawerNoCommentsYet: "No messages yet — you can share a memory below.",
    storyDrawerCommentHeartAriaRemove: "Remove heart from this message",
    storyDrawerCommentHeartAriaAdd: "Heart this message",
    storyDrawerCommentHeartTitleRemove: "Remove heart",
    storyDrawerCommentHeartTitleAdd: "Heart",
    storyDrawerYourNamePlaceholder: "Your name (optional)",
    storyDrawerComposerPlaceholder: "Write a few words…",
    storyDrawerComposerLabel: "Share a memory",
    storyDrawerSendAria: "Send",
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
    formStoryPremium:
      "Your photo and story may appear in the five-chapter AI tribute (five ~10s clips, moving-picture style).",
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
    eternalFilmClipPhotoLimitAlert: "For the best AI quality, please use 1 to 2 photos per clip.",
    eternalFilmUploaderChoose: "Choose photos",
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
    adminSharePdfInvitation: "PDF Invitation",
    adminPdfGenerating: "Generating…",
    adminInvitationSheetTitle: "Share & download",
    adminInvitationSheetPreparing: "Preparing your invitation…",
    adminInvitationShareInstagram: "Share via Instagram",
    adminInvitationShareLine: "Share via LINE",
    adminInvitationShareWhatsApp: "Share via WhatsApp",
    adminInvitationNativeShare: "Share with…",
    adminInvitationNativeShareHint: "Message, Mail, AirDrop, and more",
    adminInvitationDownload: "Download PDF",
    adminInvitationClose: "Close",
    adminInvitationError: "Could not prepare the PDF.",
    adminInvitationCopied: "Link copied.",
    adminInvitationShareText: (name: string) => `Memorial invitation — ${name || "our loved one"}`,
    adminBackToFeed: "Back to feed",
    adminCurrentPlan: "Current plan",
    adminTierLabelFree: "Free",
    adminTierLabelPlus: "Plus",
    adminTierLabelPremium: "Premium",
    adminContributionsCollected: (count: number) =>
      count === 1 ? "1 Heartfelt Contribution Collected" : `${count} Heartfelt Contributions Collected`,
    adminPremiumStatusLine: (count: number) =>
      `Current plan / Premium / ${
        count === 1 ? "1 heartfelt contribution collected" : `${count} heartfelt contributions collected`
      }`,
    adminPremiumAiTitle: "Premium: Eternal Film generation (5 clips)",
    adminPremiumAiDescription:
      "Each clip is about 10 seconds. Luma AI adds a gentle, magical sense of motion. For each clip, choose 1–2 photos that work best. We weave each photo’s story and visitors’ words (comments) into the prompt so the warmest moments come through.",
    adminPremiumFilmSelectionSummary: (selected: number, max: number) =>
      `Selected photos: ${selected} / ${max} (up to ${max} photos)`,
    adminPremiumGenerateFilmCta: "Generate next tribute clip (~10s)",
    adminPremiumSelectMinGuide: "Select at least one photo to continue.",
    adminPremiumFooterTagline: "Aeterna Memoir — preserving your precious memories forever.",
    adminPremiumMaxPhotosHint: (max: number) => `You can choose up to ${max} photos for the film.`,
    adminPremiumFilmSelectRangeError: (min: number, max: number) =>
      `Select between ${min} and ${max} approved photos.`,
    adminPremiumTributeLiveBody: "Your tribute is live on the memorial and ready to share.",
    adminPremiumPreviewOnMemorialCta: "Preview on memorial",
    adminPremiumFilmCraftingTitle: "Our AI is crafting your tribute… this may take 1–2 minutes.",
    adminPremiumFilmCraftingSubtitle:
      "You can leave this page — we'll update the memorial when the film is ready. This page refreshes automatically.",
    adminPremiumFilmFailed:
      "Something went wrong during rendering. Please contact support — we can restore your clip credit and help you retry.",
    adminPremiumApprovePhotosFirst:
      "Approve guest photos in the Memories section below, then return here to build your film.",
    adminPremiumRemoveFromFilmAria: "Remove from AI tribute film selection",
    adminPremiumIncludeInFilmAria: "Include in AI tribute film",
    adminPremiumClipsCompletedStatus: (completed: number, total: number) =>
      `Clips completed: ${completed} / ${total}`,
    adminPremiumCompletedClipsLabel: "Your tribute clips",
    adminPremiumClipLabel: (clipOneIndexed: number, totalClips: number) =>
      `Chapter ${clipOneIndexed} · ~10s · ${totalClips} total`,
    adminPremiumAllClipsComplete:
      "All five tribute chapters are ready. You can revisit them above or on the public memorial.",
    adminPremiumNoClipCredits: "No clip credits left. Contact support if you need help.",
    adminPremiumAiWaitlistTitle: "You’re on the waitlist",
    adminPremiumAiWaitlistBody:
      "AI tribute video generation isn’t available on the server yet. You’ve been waitlisted—we’ll reach out when it’s ready. If you have any questions, email hoon@aya.yale.edu.",
    adminPreserveForeverCta: "Preserve Forever",
    adminEternalFilmCta: "Eternal Film",
    adminPlusPreservedBody:
      "Your memorial is preserved — every story and photo remains here for as long as you need.",
    adminProcessing: "Processing…",
    adminMemoriesSectionTitle: "Memories",
    adminTabPending: (count: number) => `Pending (${count})`,
    adminTabApproved: (count: number) => `Approved (${count})`,
    adminStoryApprove: "Approve",
    adminStoryDelete: "Delete",
    adminStoryUnapprove: "Unapprove",
    adminStoryDeleteAria: "Delete memory",
    adminStoryDeletePermanentAria: "Permanently delete memory",
    adminApprovedEmpty:
      "No memories approved yet. Review pending submissions to build the shrine.",
    adminDeleteMemoryConfirm:
      "Are you sure you want to permanently delete this memory? This cannot be undone.",
    adminToastStoryMovedToPending: "Photo moved back to pending.",
    upgradePremiumCta: "Upgrade to Premium",
    upgradePremiumTail: "for five ~10s AI tribute clips on future memorials.",
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
  adminProfilePage: {
    backToAdmin: "Back to admin",
    pageTitle: "Profile settings",
    editProfileSection: "Edit profile",
    nameLabel: "Name",
    namePlaceholder: "Loved one's name",
    birthDateLabel: "Birth date",
    birthDatePlaceholder: "e.g. 1950-01-15",
    dateOfPassingLabel: "Date of passing",
    dateOfPassingPlaceholder: "e.g. 2024-03-01",
    locationLabel: "Location",
    locationPlaceholder: "City, venue, etc.",
    ceremonyTimeLabel: "Ceremony time",
    ceremonyTimePlaceholder: "e.g. March 15, 2024 at 2pm",
    invitationContactPhoneLabel: "Invitation contact phone",
    invitationContactPhonePlaceholder: "Optional — shown on printed PDF invite",
    remembranceMessageLabel: "Remembrance message",
    remembrancePlaceholder: "Short message shown on the memorial and invitation (optional)",
    remembranceHint:
      "Shown on the public memorial page and printable invite. You can edit anytime.",
    condolenceAccountLabel: "Condolence account",
    condolencePlaceholder: "Bank name, account number, account holder, etc.",
    saveProfile: "Save profile",
    saving: "Saving…",
    generateQrInvitation: "Generate QR invitation",
    generating: "Generating…",
    loading: "Loading…",
    memorialNotFound: "Memorial not found.",
    invalidSlug: "Invalid URL: missing slug.",
    eventNotFound: "Event not found.",
    saveFailed: "Failed to save.",
    generatePdfFailed: "Failed to generate invitation PDF.",
    openInvitationWithLocale: (localeUpper: string) => `Open invitation (${localeUpper})`,
  },
  createWizard: {
    stepOf: "Step {current} of {total}",
    resumeToast: "We saved your place — you can pick up here.",
    welcomeSacred: "Preparing a peaceful space for your memories.",
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
    memorialBackgroundTitle: "A gentle backdrop",
    memorialBackgroundSubtitle:
      "Optional — a wide image behind the memorial page (softly blurred). Skip to use a guest photo later — we’ll pick the most-loved memory, or the first shared.",
    memorialBackgroundChoose: "Choose background image",
    memorialBackgroundSkip: "Skip for now",
    backgroundDragHint: "Drag to choose which part of the image shows in the backdrop.",
    datePassingBeforeBirth:
      "The date of passing cannot be earlier than the date of birth. Please check the dates.",
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
    serviceContactPhoneLabel: "Contact phone (for guests)",
    serviceContactPhonePh: "Optional — shown on the printed invitation",
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
        tagline: "Five moving-picture chapters · ~10s each",
        b1: "Everything in Eternal Legacy",
        b2:
          "Five AI tribute clips (~10s each, Luma Ray 2) — like photographs that gently come alive so you can meet them again in warmth and light",
        tierSub: "5× ~10s clips · moving-picture style",
      },
    },
  },
  paymentSuccessPage: {
    loading: "Thank you — we're confirming your payment.",
    loadingSub: "This usually takes just a few seconds.",
    kicker: "Payment received",
    subtitle: "Their story is safe with you.",
    descriptionTemplate:
      "We know how tender this moment is. Your support helps keep [Name]'s memorial present for everyone who loved them — quietly, respectfully, and for as long as you choose.",
    descriptionNameFallback: "your loved one",
    filmInfoPremium:
      "Premium includes five ~10s AI tribute clips (moving-picture style). As each clip is ready, it appears on the memorial and in your dashboard.",
    filmInfoPlus:
      "Plus preserves every photo and story permanently. You can upgrade to Premium later for the five ~10s tribute clips.",
    shareTitle: "Share the memorial",
    invitationInfo: "Printable invitation · 9:16 · ink-friendly",
    saveImage: "Save image",
    printPdf: "Print PDF",
    nextStepsTitle: "Next steps",
    step1: "Save or print your memorial invitation (9:16) for a program, table card, or keepsake.",
    step2: "Share the link with family and friends — they can contribute from any phone, no app required.",
    step3: "Visit your dashboard to manage details and, when it's ready, your tribute film.",
    btnViewMemorial: "View memorial",
    btnDashboard: "Open dashboard",
    btnDownloadTribute: "Open tribute / download",
    errorSession:
      "We couldn't find a valid payment session. If you completed checkout, use the link from your email or return to your memorial.",
    errorConfirm:
      "We couldn't confirm your payment yet. Please wait a moment and refresh, or contact support if this continues.",
    errorTitle: "We couldn't finish confirming",
    backToMemorial: "Back to memorial",
    suspenseLoading: "Loading…",
    invitationPreparing: "Preparing invitation…",
    invitationShareTitle: "Memorial invitation",
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
    peacefulMemoryLoading: "당신을 위한 평온한 기억의 공간을 준비 중입니다.",
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
    memoryReceivedTitle: "소중한 추억을 받았습니다",
    memoryReceivedBody:
      "보내주신 추억은 관리자의 확인 후 기념관에 게시됩니다. 공개된 후에는 다른 분들도 함께 보고 공감(좋아요)과 댓글을 남길 수 있습니다.",
    emailPlaceholder: "이메일",
    saving: "저장 중…",
    notifyMe: "알림 받기",
    shareModalTitle: "이 기념관 공유하기",
    shareModalBody: "가족과 지인을 초대해 함께 추억을 나눠보세요.",
    whatsApp: "WhatsApp",
    message: "메시지",
    copyLink: "링크 복사",
    shareChannelEmail: "이메일",
    shareChannelInstagram: "인스타그램",
    filmAria: "AI 추모 영상",
    videoUnsupported: "브라우저가 비디오 태그를 지원하지 않습니다.",
    filmLabel: "영상",
    redirectCheckout: "결제로 이동 중…",
    downloadFilm: "고화질 영상 받기",
    unlockMemories: "모든 추억 열기",
    premium: "프리미엄",
    locked: "잠김",
    storyDrawerTitle: "추억",
    storyDrawerNoImage: "이미지 없음",
    storyDrawerAnonymous: "익명",
    storyDrawerGuestName: "게스트",
    storyDrawerHeartAriaRemove: "하트 취소",
    storyDrawerHeartAriaAdd: "이 추억에 하트 보내기",
    storyDrawerHeartsLabel: "하트",
    storyDrawerAiFilmHint: "마음에 드는 사진은 영상에 담길 수 있습니다.",
    storyDrawerCommentsHeading: "추억 나누기",
    storyDrawerCommentsLoading: "불러오는 중…",
    storyDrawerNoCommentsYet: "아직 메시지가 없습니다. 아래에서 추억을 남겨 주세요.",
    storyDrawerCommentHeartAriaRemove: "이 메시지의 하트 취소",
    storyDrawerCommentHeartAriaAdd: "이 메시지에 하트 보내기",
    storyDrawerCommentHeartTitleRemove: "하트 취소",
    storyDrawerCommentHeartTitleAdd: "하트",
    storyDrawerYourNamePlaceholder: "이름 (선택)",
    storyDrawerComposerPlaceholder: "짧은 메시지를 남겨 주세요…",
    storyDrawerComposerLabel: "추억 나누기",
    storyDrawerSendAria: "보내기",
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
    formStoryPremium:
      "이 사진과 이야기는 다섯 개의 AI 헌정 클립(각 약 10초, 움직이는 사진 스타일)에 담길 수 있습니다.",
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
    eternalFilmClipPhotoLimitAlert: "최상의 영상 품질을 위해, 한 클립당 1~2장의 사진을 권장합니다.",
    eternalFilmUploaderChoose: "사진 선택",
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
    adminInvitationSheetTitle: "공유 및 저장",
    adminInvitationSheetPreparing: "초대장을 준비하는 중…",
    adminInvitationShareInstagram: "인스타그램으로 공유",
    adminInvitationShareLine: "LINE으로 공유",
    adminInvitationShareWhatsApp: "WhatsApp으로 공유",
    adminInvitationNativeShare: "다른 앱으로 공유…",
    adminInvitationNativeShareHint: "메시지, 메일, AirDrop 등",
    adminInvitationDownload: "PDF 저장",
    adminInvitationClose: "닫기",
    adminInvitationError: "PDF를 준비할 수 없습니다.",
    adminInvitationCopied: "링크를 복사했습니다.",
    adminInvitationShareText: (name: string) => `추모 초대장 — ${name || "고인"}`,
    adminBackToFeed: "피드로 돌아가기",
    adminCurrentPlan: "현재 플랜",
    adminTierLabelFree: "무료",
    adminTierLabelPlus: "플러스",
    adminTierLabelPremium: "프리미엄",
    adminContributionsCollected: (count: number) => `${count}개의 소중한 추억이 수집됨`,
    adminPremiumStatusLine: (count: number) =>
      `현재 플랜 / 프리미엄 / ${count}개의 소중한 추억이 수집됨`,
    adminPremiumAiTitle: "프리미엄: 영원한 필름 생성 (5개 클립)",
    adminPremiumAiDescription:
      "각 클립은 약 10초 분량이며, Luma AI를 통해 마법 같은 움직임을 생성합니다.\n한 클립당 최적의 사진 1~2장을 선택하세요. 사진에 담긴 이야기와 방문자의 마음(댓글)을 프롬프트에 녹여 가장 따뜻한 찰나를 구현합니다.",
    adminPremiumFilmSelectionSummary: (selected: number, max: number) =>
      `선택된 사진: ${selected} / ${max} (최대 ${max}장)`,
    adminPremiumGenerateFilmCta: "다음 헌정 클립 생성 (~10초)",
    adminPremiumSelectMinGuide: "계속하려면 사진을 1장 이상 선택해 주세요.",
    adminPremiumFooterTagline: "Aeterna Memoir — 당신의 소중한 기억을 영원히 수호합니다.",
    adminPremiumMaxPhotosHint: (max: number) => `헌정 클립에는 최대 ${max}장까지 선택할 수 있습니다.`,
    adminPremiumFilmSelectRangeError: (min: number, max: number) =>
      `승인된 사진 ${min}~${max}장을 선택해 주세요.`,
    adminPremiumTributeLiveBody: "헌정 영상이 기념관에 공개되어 공유할 수 있습니다.",
    adminPremiumPreviewOnMemorialCta: "기념관에서 미리보기",
    adminPremiumFilmCraftingTitle: "AI가 헌정 영상을 제작 중입니다… 1~2분 정도 걸릴 수 있습니다.",
    adminPremiumFilmCraftingSubtitle:
      "이 페이지를 나가셔도 됩니다 — 영상이 준비되면 기념관에 반영되며 이 페이지도 자동으로 갱신됩니다.",
    adminPremiumFilmFailed:
      "렌더링 중 문제가 발생했습니다. 고객 지원으로 연락 주시면 클립 크레딧 복구와 재시도를 도와드립니다.",
    adminPremiumApprovePhotosFirst:
      "아래 추억 섹션에서 게스트 사진을 승인한 뒤, 다시 이곳으로 돌아와 클립을 만드세요.",
    adminPremiumRemoveFromFilmAria: "AI 헌정 클립 선택에서 제외",
    adminPremiumIncludeInFilmAria: "AI 헌정 클립에 포함",
    adminPremiumClipsCompletedStatus: (completed: number, total: number) =>
      `생성 완료된 클립: ${completed} / ${total}`,
    adminPremiumCompletedClipsLabel: "완성된 헌정 클립",
    adminPremiumClipLabel: (clipOneIndexed: number, totalClips: number) =>
      `챕터 ${clipOneIndexed} · 약 10초 · 총 ${totalClips}개`,
    adminPremiumAllClipsComplete:
      "다섯 개의 헌정 챕터가 모두 준비되었습니다. 위에서 다시 보거나 공개 기념관에서 확인하세요.",
    adminPremiumNoClipCredits: "남은 클립 크레딧이 없습니다. 지원이 필요하면 문의해 주세요.",
    adminPremiumAiWaitlistTitle: "대기 명단에 등록되었습니다",
    adminPremiumAiWaitlistBody:
      "AI 헌정 영상 생성이 아직 서버에서 준비되지 않았습니다. 대기 명단에 올려 두었으며, 준비되면 연락드리겠습니다. 문의는 hoon@aya.yale.edu 로 보내 주세요.",
    adminPreserveForeverCta: "영원히 보존하기",
    adminEternalFilmCta: "이터널 필름",
    adminPlusPreservedBody:
      "귀하의 추모 공간은 안전하게 보존됩니다. 모든 이야기와 사진은 당신이 필요로 하는 한 언제까지나 이곳에 머물 것입니다.",
    adminProcessing: "처리 중…",
    adminMemoriesSectionTitle: "추억들",
    adminTabPending: (count: number) => `대기 중 (${count})`,
    adminTabApproved: (count: number) => `승인됨 (${count})`,
    adminStoryApprove: "승인",
    adminStoryDelete: "삭제",
    adminStoryUnapprove: "승인 취소",
    adminStoryDeleteAria: "추억 삭제",
    adminStoryDeletePermanentAria: "추억 영구 삭제",
    adminApprovedEmpty:
      "아직 승인된 추억이 없습니다. 대기 중인 제출을 검토해 기념관을 채워 보세요.",
    adminDeleteMemoryConfirm:
      "이 추억을 영구적으로 삭제하시겠습니까? 되돌릴 수 없습니다.",
    adminToastStoryMovedToPending: "사진이 다시 대기 목록으로 이동했습니다.",
    upgradePremiumCta: "프리미엄으로 업그레이드",
    upgradePremiumTail: "향후 기념관에서 AI 헌정 클립(약 10초×5)을 쓰기 위해.",
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
  adminProfilePage: {
    backToAdmin: "관리자 홈으로",
    pageTitle: "프로필 설정",
    editProfileSection: "프로필 수정",
    nameLabel: "성함",
    namePlaceholder: "고인 성함",
    birthDateLabel: "생년월일",
    birthDatePlaceholder: "예: 1950-01-15",
    dateOfPassingLabel: "별세일",
    dateOfPassingPlaceholder: "예: 2024-03-01",
    locationLabel: "장소",
    locationPlaceholder: "도시, 장소 등",
    ceremonyTimeLabel: "식순 및 시간",
    ceremonyTimePlaceholder: "예: 2024년 3월 15일 오후 2시",
    invitationContactPhoneLabel: "초대장 연락처(전화)",
    invitationContactPhonePlaceholder: "선택 — 인쇄 초대장에 표시됩니다",
    remembranceMessageLabel: "추모 메시지",
    remembrancePlaceholder: "추모 페이지와 초대장에 표시할 짧은 메시지(선택)",
    remembranceHint:
      "공개 추모 페이지 및 초대장에 표시됩니다. 언제든 수정 가능합니다.",
    condolenceAccountLabel: "조의금 전달 계좌",
    condolencePlaceholder: "은행명, 계좌번호, 예금주 등",
    saveProfile: "프로필 저장",
    saving: "저장 중…",
    generateQrInvitation: "QR 초대장 생성",
    generating: "생성 중…",
    loading: "불러오는 중…",
    memorialNotFound: "기념관을 찾을 수 없습니다.",
    invalidSlug: "잘못된 주소입니다. 식별자가 없습니다.",
    eventNotFound: "이벤트를 찾을 수 없습니다.",
    saveFailed: "저장하지 못했습니다.",
    generatePdfFailed: "초대장 PDF를 만들지 못했습니다.",
    openInvitationWithLocale: (localeUpper: string) => `초대장 열기 (${localeUpper})`,
  },
  createWizard: {
    stepOf: "{current}단계 / 총 {total}단계",
    resumeToast: "이어서 진행할 수 있도록 저장했습니다.",
    welcomeSacred: "당신을 위한 평온한 기억의 공간을 준비 중입니다.",
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
    memorialBackgroundTitle: "부드러운 배경",
    memorialBackgroundSubtitle:
      "선택 사항 — 추모 페이지 뒤에 넓게 깔릴 이미지입니다. 건너뛰면 나중에 방문자 사진을 사용하며, 하트가 가장 많거나 가장 먼저 올린 사진을 고릅니다.",
    memorialBackgroundChoose: "배경 이미지 선택",
    memorialBackgroundSkip: "나중에 하기",
    backgroundDragHint: "드래그하여 배경에 보일 영역을 맞추세요.",
    datePassingBeforeBirth: "별세일은 생년월일보다 이전일 수 없습니다. 날짜를 확인해 주세요.",
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
    serviceContactPhoneLabel: "문의 연락처(방문객용)",
    serviceContactPhonePh: "선택 — 인쇄 초대장에 표시됩니다",
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
        tagline: "움직이는 사진 5개 챕터 · 각 약 10초",
        b1: "Eternal Legacy의 모든 혜택",
        b2:
          "AI 추모 클립 5개(각 약 10초, Luma Ray 2) — 소중한 사진이 살아 숨 쉬는 듯 따뜻하게 다시 만나는 경험",
        tierSub: "5×약10초 클립 · 움직이는 사진 스타일",
      },
    },
  },
  paymentSuccessPage: {
    loading: "감사합니다 — 결제를 확인하는 중입니다.",
    loadingSub: "보통 몇 초면 완료됩니다.",
    kicker: "결제가 완료되었습니다",
    subtitle: "이제 고인의 이야기는 당신과 함께 안전하게 보존됩니다.",
    descriptionTemplate:
      "이 순간이 얼마나 소중한지 잘 알고 있습니다. 당신의 후원은 [Name] 님의 기념관을 사랑하는 모든 이들을 위해—조용히, 정중하게, 그리고 당신이 원하는 만큼 오래도록—유지하는 데 큰 힘이 됩니다.",
    descriptionNameFallback: "고인",
    filmInfoPremium:
      "프리미엄 혜택인 5개의 AI 추모 영상(무빙 픽처 스타일, 각 약 10초)이 포함됩니다. 영상이 준비되는 대로 기념관과 대시보드에 자동으로 나타납니다.",
    filmInfoPlus:
      "Plus는 모든 사진과 이야기를 영구적으로 보존합니다. 나중에 프리미엄으로 업그레이드하면 약 10초 길이의 추모 클립 5개를 이용하실 수 있습니다.",
    shareTitle: "기념관 공유하기",
    invitationInfo: "출력용 초대장 · 9:16 · 잉크 절약 모드",
    saveImage: "이미지 저장",
    printPdf: "PDF 인쇄",
    nextStepsTitle: "다음 단계",
    step1: "프로그램이나 테이블 카드 등으로 활용할 수 있도록 초대장(9:16)을 저장하거나 인쇄하세요.",
    step2: "가족 및 지인들과 링크를 공유하세요. 앱 설치 없이 누구나 어디서든 추억을 남길 수 있습니다.",
    step3: "대시보드를 방문하여 상세 내용을 관리하고, 준비된 추모 영상을 확인하세요.",
    btnViewMemorial: "기념관 보기",
    btnDashboard: "대시보드 열기",
    btnDownloadTribute: "추모 영상 열기 / 다운로드",
    errorSession:
      "유효한 결제 세션을 찾을 수 없습니다. 결제를 완료하셨다면 이메일의 링크를 사용하거나 기념관으로 돌아가 주세요.",
    errorConfirm:
      "결제를 아직 확인하지 못했습니다. 잠시 후 새로고침하거나, 문제가 계속되면 고객 지원에 문의해 주세요.",
    errorTitle: "확인을 완료하지 못했습니다",
    backToMemorial: "기념관으로 돌아가기",
    suspenseLoading: "로딩 중…",
    invitationPreparing: "초대장 준비 중…",
    invitationShareTitle: "기념 초대장",
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
    peacefulMemoryLoading: "大切な想い出が集まる場所、準備しています。",
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
    memoryReceivedBody:
      "お送りいただいた思い出は、管理者の承認後に記念館に掲載されます。公開後は、他の方々も「いいね」やコメントを残すことができます。",
    notifyMe: "通知する",
    shareModalTitle: "この記念館を共有する",
    shareModalBody: "家族や知人を招待して、一緒に思い出を残しましょう。",
    message: "メッセージ",
    copyLink: "リンクをコピー",
    shareChannelEmail: "メール",
    shareChannelInstagram: "Instagram",
    videoUnsupported: "お使いのブラウザは動画タグに対応していません。",
    filmLabel: "映像",
    redirectCheckout: "決済へ移動中…",
    downloadFilm: "高画質映像をダウンロード",
    unlockMemories: "すべての思い出を解放",
    premium: "プレミアム",
    locked: "ロック",
    storyDrawerTitle: "思い出",
    storyDrawerNoImage: "画像がありません",
    storyDrawerAnonymous: "匿名",
    storyDrawerGuestName: "ゲスト",
    storyDrawerHeartAriaRemove: "ハートを取り消す",
    storyDrawerHeartAriaAdd: "この思い出にハートを送る",
    storyDrawerHeartsLabel: "ハート",
    storyDrawerAiFilmHint: "心に響いた写真が映像に使われることがあります。",
    storyDrawerCommentsHeading: "思い出を共有",
    storyDrawerCommentsLoading: "読み込み中…",
    storyDrawerNoCommentsYet: "まだメッセージがありません。下から一言添えられます。",
    storyDrawerCommentHeartAriaRemove: "このメッセージのハートを取り消す",
    storyDrawerCommentHeartAriaAdd: "このメッセージにハートを送る",
    storyDrawerCommentHeartTitleRemove: "ハートを取り消す",
    storyDrawerCommentHeartTitleAdd: "ハート",
    storyDrawerYourNamePlaceholder: "お名前（任意）",
    storyDrawerComposerPlaceholder: "短いメッセージをどうぞ…",
    storyDrawerComposerLabel: "思い出を共有",
    storyDrawerSendAria: "送信",
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
    formStoryPremium:
      "この写真とエピソードは、5本のAI追悼クリップ（各約10秒・動く写真のように）に使われることがあります。",
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
    eternalFilmClipPhotoLimitAlert: "最高の品質を保つため、1枚から2枚の写真を選択してください。",
    eternalFilmUploaderChoose: "写真を選ぶ",
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
    adminInvitationSheetTitle: "共有・ダウンロード",
    adminInvitationSheetPreparing: "招待状を準備しています…",
    adminInvitationShareInstagram: "Instagramで共有",
    adminInvitationShareLine: "LINEで共有",
    adminInvitationShareWhatsApp: "WhatsAppで共有",
    adminInvitationNativeShare: "共有…",
    adminInvitationNativeShareHint: "メッセージ、メール、AirDrop など",
    adminInvitationDownload: "PDFを保存",
    adminInvitationClose: "閉じる",
    adminInvitationError: "PDFを準備できませんでした。",
    adminInvitationCopied: "リンクをコピーしました。",
    adminInvitationShareText: (name: string) => `追悼の招待状 — ${name || "ご故人"}`,
    adminBackToFeed: "フィードに戻る",
    adminCurrentPlan: "現在のプラン",
    adminTierLabelFree: "無料",
    adminTierLabelPlus: "プラス",
    adminTierLabelPremium: "プレミアム",
    adminContributionsCollected: (count: number) => `${count}件の心のこもった寄稿`,
    adminPremiumStatusLine: (count: number) =>
      `現在のプラン / プレミアム / ${count}件の心のこもった寄稿`,
    adminPremiumAiTitle: "プレミアム：エターナルフィルム生成（5クリップ）",
    adminPremiumAiDescription:
      "各クリップは約10秒です。Luma AIが、写真に穏やかな動きを添えます。\n1クリップにつき最適な写真を1〜2枚お選びください。各写真のエピソードと訪れた方のコメントをプロンプトに織り込み、いちばん温かい瞬間を引き出します。",
    adminPremiumFilmSelectionSummary: (selected: number, max: number) =>
      `選択中の写真: ${selected} / ${max}（最大${max}枚）`,
    adminPremiumGenerateFilmCta: "次のトリビュートクリップを生成（約10秒）",
    adminPremiumSelectMinGuide: "続行するには、写真を1枚以上選択してください。",
    adminPremiumFooterTagline: "Aeterna Memoir — 大切な思い出を永遠に保存します。",
    adminPremiumMaxPhotosHint: (max: number) => `トリビュートでは最大${max}枚まで選べます。`,
    adminPremiumFilmSelectRangeError: (min: number, max: number) =>
      `承認済みの写真を${min}〜${max}枚選んでください。`,
    adminPremiumTributeLiveBody: "追悼の映像はメモリアルで公開済みです。共有の準備ができています。",
    adminPremiumPreviewOnMemorialCta: "メモリアルでプレビュー",
    adminPremiumFilmCraftingTitle: "AIが作品を制作中です…1〜2分ほどかかることがあります。",
    adminPremiumFilmCraftingSubtitle:
      "このページを離れても構いません — 準備ができたらメモリアルを更新します。このページは自動で更新されます。",
    adminPremiumFilmFailed:
      "レンダリング中に問題が発生しました。サポートへご連絡ください。クリップクレジットの復旧と再試行をお手伝いします。",
    adminPremiumApprovePhotosFirst:
      "下の「思い出」でゲストの写真を承認してから、ここに戻ってクリップを作成してください。",
    adminPremiumRemoveFromFilmAria: "AIトリビュートクリップの選択から外す",
    adminPremiumIncludeInFilmAria: "AIトリビュートクリップに含める",
    adminPremiumClipsCompletedStatus: (completed: number, total: number) =>
      `生成完了したクリップ: ${completed} / ${total}`,
    adminPremiumCompletedClipsLabel: "完成したトリビュートクリップ",
    adminPremiumClipLabel: (clipOneIndexed: number, totalClips: number) =>
      `第${clipOneIndexed}章 · 約10秒 · 全${totalClips}本`,
    adminPremiumAllClipsComplete:
      "5章すべてのトリビュートが揃いました。上で再生するか、公開メモリアルでご覧ください。",
    adminPremiumNoClipCredits: "クリップのクレジットがありません。サポートへご連絡ください。",
    adminPremiumAiWaitlistTitle: "順番待ちリストに登録されました",
    adminPremiumAiWaitlistBody:
      "AIによる追悼クリップの生成は、まだサーバー側の準備が整っていません。順番待ちリストに登録済みです。準備ができ次第ご連絡します。ご質問は hoon@aya.yale.edu までご連絡ください。",
    adminPreserveForeverCta: "永遠に保存する",
    adminEternalFilmCta: "エターナルフィルム",
    adminPlusPreservedBody:
      "あなたの想い出の場所は守られています。すべての物語と写真は、あなたが必要とする限り、いつまでもここに残り続けます。",
    adminProcessing: "処理中…",
    adminMemoriesSectionTitle: "思い出",
    adminTabPending: (count: number) => `承認待ち (${count})`,
    adminTabApproved: (count: number) => `承認済み (${count})`,
    adminStoryApprove: "承認",
    adminStoryDelete: "削除",
    adminStoryUnapprove: "承認を取り消す",
    adminStoryDeleteAria: "思い出を削除",
    adminStoryDeletePermanentAria: "思い出を完全に削除",
    adminApprovedEmpty:
      "まだ承認された思い出はありません。承認待ちを確認してメモリアルを整えましょう。",
    adminDeleteMemoryConfirm:
      "この思い出を完全に削除しますか？この操作は取り消せません。",
    adminToastStoryMovedToPending: "写真が承認待ちに戻りました。",
    upgradePremiumCta: "プレミアムにアップグレード",
    upgradePremiumTail: "将来のメモリアルでAI追悼クリップ（各約10秒×5本）を使うために。",
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
  adminProfilePage: {
    backToAdmin: "管理画面に戻る",
    pageTitle: "プロフィール設定",
    editProfileSection: "プロフィール編集",
    nameLabel: "お名前",
    namePlaceholder: "故人のお名前",
    birthDateLabel: "生年月日",
    birthDatePlaceholder: "例: 1950-01-15",
    dateOfPassingLabel: "命日（没年月日）",
    dateOfPassingPlaceholder: "例: 2024-03-01",
    locationLabel: "場所",
    locationPlaceholder: "市区町村、会場など",
    ceremonyTimeLabel: "葬儀・儀式の時間",
    ceremonyTimePlaceholder: "例: 2024年3月15日 午後2時",
    invitationContactPhoneLabel: "招待状の連絡先電話",
    invitationContactPhonePlaceholder: "任意 — 印刷用PDFに表示されます",
    remembranceMessageLabel: "追悼メッセージ",
    remembrancePlaceholder: "メモリアルと招待状に表示する短いメッセージ（任意）",
    remembranceHint:
      "公開追悼ページと招待状に表示されます。いつでも編集可能です。",
    condolenceAccountLabel: "弔問金のお振込先",
    condolencePlaceholder: "銀行名、口座番号、名義など",
    saveProfile: "プロフィールを保存",
    saving: "保存中…",
    generateQrInvitation: "QR招待状を作成",
    generating: "作成中…",
    loading: "読み込み中…",
    memorialNotFound: "メモリアルが見つかりません。",
    invalidSlug: "URLが無効です（スラッグがありません）。",
    eventNotFound: "イベントが見つかりません。",
    saveFailed: "保存できませんでした。",
    generatePdfFailed: "招待状PDFを生成できませんでした。",
    openInvitationWithLocale: (localeUpper: string) => `招待状を開く (${localeUpper})`,
  },
  createWizard: {
    stepOf: "ステップ {current} / {total}",
    resumeToast: "続きから再開できるよう保存しました。",
    welcomeSacred: "大切な想い出が集まる場所、準備しています。",
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
    memorialBackgroundTitle: "穏やかな背景",
    memorialBackgroundSubtitle:
      "任意 — 追悼ページの背後に広がる画像です（やわらかくぼかして表示）。スキップした場合は、のちにご参列の方の写真を使い、ハートが最も多いもの、または最初に共有されたものを選びます。",
    memorialBackgroundChoose: "背景画像を選ぶ",
    memorialBackgroundSkip: "今はスキップ",
    backgroundDragHint: "ドラッグして背景に表示する範囲を調整します。",
    datePassingBeforeBirth: "逝去日は生年月日より前の日付に設定できません。日付を確認してください。",
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
    serviceContactPhoneLabel: "連絡先電話（参列者向け）",
    serviceContactPhonePh: "任意 — 印刷招待状に表示されます",
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
        tagline: "動く写真5章 · 各約10秒",
        b1: "永遠の遺産プランのすべての特典",
        b2:
          "AIトリビュート映像5本（各約10秒・Luma Ray 2）— 大切な写真がそっと息づき、もう一度会えたような温かさを",
        tierSub: "5×約10秒 · 動く写真スタイル",
      },
    },
  },
  paymentSuccessPage: {
    loading: "ありがとうございます — お支払いを確認しています。",
    loadingSub: "通常、数秒で完了します。",
    kicker: "お支払いが完了しました",
    subtitle: "大切な方の物語は、あなたと共に守られます。",
    descriptionTemplate:
      "この瞬間がどれほど大切であるか、私たちは理解しています。あなたのサポートは、[Name]さんの記念館を、愛するすべての人々のために—静かに、敬意を持って、そしてあなたが望む限り長く—維持するための大きな力となります。",
    descriptionNameFallback: "ご逝去の方",
    filmInfoPremium:
      "プレミアム特典として、5つのAI追悼動画（ムービングピクチャースタイル、各約10秒）が含まれています。動画の準備ができ次第、記念館とダッシュボードに表示されます。",
    filmInfoPlus:
      "Plusプランはすべての写真と物語を永久に保存します。後からプレミアムにアップグレードすれば、約10秒の追悼動画を5本ご利用いただけます。",
    shareTitle: "記念館を共有する",
    invitationInfo: "印刷用招待状 · 9:16 · インク節約モード",
    saveImage: "画像を保存",
    printPdf: "PDFを印刷",
    nextStepsTitle: "次のステップ",
    step1: "プログラムやテーブルカードとして活用できるよう、招待状(9:16)を保存または印刷してください。",
    step2: "家族や友人とリンクを共有しましょう。アプリのインストールなしで、誰でもどこからでも思い出を投稿できます。",
    step3: "ダッシュボードにアクセスして詳細を管理し、準備が整った追悼動画を確認してください。",
    btnViewMemorial: "記念館を見る",
    btnDashboard: "ダッシュボードを開く",
    btnDownloadTribute: "トリビュートを開く / ダウンロード",
    errorSession:
      "有効な決済セッションが見つかりませんでした。お支払いが完了している場合は、メールのリンクをご利用いただくか、記念館に戻ってください。",
    errorConfirm:
      "お支払いの確認がまだ完了していません。しばらくしてから更新するか、解決しない場合はサポートにお問い合わせください。",
    errorTitle: "確認を完了できませんでした",
    backToMemorial: "記念館に戻る",
    suspenseLoading: "読み込み中…",
    invitationPreparing: "招待状を準備しています…",
    invitationShareTitle: "記念招待状",
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
    peacefulMemoryLoading: "Préparation d'un havre de paix pour vos souvenirs.",
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
  paymentSuccessPage: {
    loading: "Merci — nous confirmons votre paiement.",
    loadingSub: "Cela ne prend généralement que quelques secondes.",
    kicker: "Paiement reçu",
    subtitle: "Leur histoire est en sécurité avec vous.",
    descriptionTemplate:
      "Nous savons à quel point ce moment est délicat. Votre soutien aide à maintenir le mémorial de [Name] pour tous ceux qui l'ont aimé — calmement, respectueusement, et aussi longtemps que vous le choisirez.",
    descriptionNameFallback: "votre proche",
    filmInfoPremium:
      "Le forfait Premium inclut cinq clips hommage IA de ~10s (style photo animée). Dès qu'un clip est prêt, il apparaît sur le mémorial et dans votre tableau de bord.",
    filmInfoPlus:
      "Plus conserve chaque photo et chaque histoire pour toujours. Vous pourrez passer à Premium plus tard pour les cinq clips hommage d’environ 10 s.",
    shareTitle: "Partager le mémorial",
    invitationInfo: "Invitation imprimable · 9:16 · économe en encre",
    saveImage: "Enregistrer l'image",
    printPdf: "Imprimer le PDF",
    nextStepsTitle: "Prochaines étapes",
    step1: "Enregistrez ou imprimez votre invitation (9:16) pour un programme, un marque-place ou un souvenir.",
    step2: "Partagez le lien avec la famille et les amis — ils peuvent contribuer depuis n'importe quel téléphone, sans application.",
    step3: "Visitez votre tableau de bord pour gérer les détails et voir votre film hommage une fois prêt.",
    btnViewMemorial: "Voir le mémorial",
    btnDashboard: "Ouvrir le tableau de bord",
    btnDownloadTribute: "Ouvrir l'hommage / télécharger",
    errorSession:
      "Nous n'avons pas trouvé de session de paiement valide. Si vous avez terminé le paiement, utilisez le lien reçu par e-mail ou revenez au mémorial.",
    errorConfirm:
      "Nous n'avons pas encore pu confirmer votre paiement. Patientez un instant et actualisez, ou contactez le support si le problème persiste.",
    errorTitle: "Impossible de terminer la confirmation",
    backToMemorial: "Retour au mémorial",
    suspenseLoading: "Chargement…",
    invitationPreparing: "Préparation de l'invitation…",
    invitationShareTitle: "Invitation mémorial",
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
    peacefulMemoryLoading: "Preparando un lugar de paz para sus recuerdos.",
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
  paymentSuccessPage: {
    loading: "Gracias — estamos confirmando su pago.",
    loadingSub: "Suele tardar solo unos segundos.",
    kicker: "Pago recibido",
    subtitle: "Su historia está segura con usted.",
    descriptionTemplate:
      "Sabemos lo delicado que es este momento. Su apoyo ayuda a mantener el memorial de [Name] para todos los que le amaron — en silencio, con respeto y durante el tiempo que usted elija.",
    descriptionNameFallback: "su ser querido",
    filmInfoPremium:
      "El plan Premium incluye cinco clips de tributo IA de ~10s (estilo de imagen en movimiento). A medida que cada clip esté listo, aparecerá en el memorial y en su panel de control.",
    filmInfoPlus:
      "Plus conserva permanentemente cada foto e historia. Puede actualizar a Premium más adelante para los cinco clips de tributo de ~10 s.",
    shareTitle: "Compartir el memorial",
    invitationInfo: "Invitación imprimible · 9:16 · ahorro de tinta",
    saveImage: "Guardar imagen",
    printPdf: "Imprimir PDF",
    nextStepsTitle: "Próximos pasos",
    step1: "Guarde o imprima su invitación (9:16) para un programa, tarjeta de mesa o recuerdo.",
    step2: "Comparta el enlace con familiares y amigos; pueden contribuir desde cualquier teléfono, sin necesidad de aplicación.",
    step3: "Visite su panel de control para gestionar detalles y ver su película de tributo cuando esté lista.",
    btnViewMemorial: "Ver memorial",
    btnDashboard: "Abrir panel de control",
    btnDownloadTribute: "Abrir tributo / descargar",
    errorSession:
      "No encontramos una sesión de pago válida. Si completó el pago, use el enlace de su correo o vuelva al memorial.",
    errorConfirm:
      "Aún no pudimos confirmar su pago. Espere un momento y actualice, o contacte a soporte si continúa.",
    errorTitle: "No pudimos terminar de confirmar",
    backToMemorial: "Volver al memorial",
    suspenseLoading: "Cargando…",
    invitationPreparing: "Preparando invitación…",
    invitationShareTitle: "Invitación del memorial",
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
    peacefulMemoryLoading: "نجهز مساحة هادئة لذكراكم.",
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
  paymentSuccessPage: {
    loading: "شكرًا — نؤكد دفعتك الآن.",
    loadingSub: "يستغرق ذلك عادةً بضع ثوانٍ فقط.",
    kicker: "تم استلام الدفعة",
    subtitle: "قصتهم في أمان معك.",
    descriptionTemplate:
      "نحن نعلم مدى خصوصية هذه اللحظة. يساعد دعمك في إبقاء النصب التذكاري لـ [Name] متاحًا لكل من أحبهم — بهدوء وباحترام، وللمدة التي تختارها.",
    descriptionNameFallback: "من تحب",
    filmInfoPremium:
      "تتضمن الباقة المميزة خمسة مقاطع تكريمية بالذكاء الاصطناعي مدتها ~10 ثوانٍ (بأسلوب الصور المتحركة). وبمجرد جاهزية كل مقطع، سيظهر في النصب التذكاري وفي لوحة التحكم الخاصة بك.",
    filmInfoPlus:
      "تحافظ باقة Plus على كل الصور والذكريات بشكل دائم. يمكنك الترقية إلى Premium لاحقًا للحصول على خمسة مقاطع تكريمية مدتها ~10 ثوانٍ.",
    shareTitle: "مشاركة النصب التذكاري",
    invitationInfo: "دعوة قابلة للطباعة · 9:16 · موفرة للحبر",
    saveImage: "حفظ الصورة",
    printPdf: "طباعة PDF",
    nextStepsTitle: "الخطوات التالية",
    step1: "احفظ أو اطبع دعوة النصب التذكاري (9:16) لاستخدامها في برنامج الحفل أو كبطاقة طاولة أو ذكرى.",
    step2: "شارك الرابط مع العائلة والأصدقاء — يمكنهم المشاركة من أي هاتف، دون الحاجة إلى تطبيق.",
    step3: "قم بزيارة لوحة التحكم لإدارة التفاصيل، وعندما يكون جاهزاً، شاهد فيلم التكريم الخاص بك.",
    btnViewMemorial: "عرض النصب التذكاري",
    btnDashboard: "فتح لوحة التحكم",
    btnDownloadTribute: "فتح التكريم / تنزيل",
    errorSession:
      "تعذر العثور على جلسة دفع صالحة. إذا أكملت الدفع، استخدم الرابط من بريدك الإلكتروني أو عد إلى النصب التذكاري.",
    errorConfirm:
      "لم نتمكن من تأكيد دفعتك بعد. يرجى الانتظار لحظة وتحديث الصفحة، أو الاتصال بالدعم إذا استمرت المشكلة.",
    errorTitle: "تعذر إتمام التأكيد",
    backToMemorial: "العودة إلى النصب التذكاري",
    suspenseLoading: "جاري التحميل…",
    invitationPreparing: "جاري تجهيز الدعوة…",
    invitationShareTitle: "دعوة النصب التذكاري",
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
    peacefulMemoryLoading: "正在為您開啟永恆的記憶空間。",
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
  paymentSuccessPage: {
    loading: "感謝您 — 我們正在確認您的付款。",
    loadingSub: "通常只需幾秒鐘。",
    kicker: "付款成功",
    subtitle: "他們的故事將與您一同永恆守護。",
    descriptionTemplate:
      "我們深知這一刻的珍貴。您的支持將幫助 [Name] 的紀念館為所有愛他們的人—安靜地、莊重地、且依您所願地長久保存。",
    descriptionNameFallback: "摯愛",
    filmInfoPremium:
      "進階版包含 5 個 AI 追思影片（動態照片風格，每個約 10 秒）。影片製作完成後，將自動顯示在紀念館和您的控制面板中。",
    filmInfoPlus:
      "進階版永久保存所有照片與故事。日後可升級至 Premium 以取得五個約 10 秒的追思影片。",
    shareTitle: "分享紀念館",
    invitationInfo: "可打印邀請函 · 9:16 · 省墨模式",
    saveImage: "儲存圖片",
    printPdf: "列印 PDF",
    nextStepsTitle: "後續步驟",
    step1: "儲存或列印您的紀念館邀請函 (9:16)，可用於儀式手冊、桌卡或留念。",
    step2: "與親友分享連結——無需安裝 App，任何人都可以從手機分享回憶。",
    step3: "訪問您的控制面板來管理細節，並在影片準備就緒時進行查看。",
    btnViewMemorial: "查看紀念館",
    btnDashboard: "打開控制面板",
    btnDownloadTribute: "開啟追思影片 / 下載",
    errorSession:
      "找不到有效的付款工作階段。若您已完成付款，請使用電子郵件中的連結或返回紀念頁。",
    errorConfirm:
      "我們尚無法確認您的付款。請稍候再重新整理，若仍持續發生請聯絡客服。",
    errorTitle: "無法完成確認",
    backToMemorial: "返回紀念頁",
    suspenseLoading: "載入中…",
    invitationPreparing: "正在準備邀請函…",
    invitationShareTitle: "紀念館邀請函",
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
  "zh-hk": mergeApp(mergeApp(EN, ZH_PATCH), ZH_APP_REST),
}

export function getAppStrings(locale: LandingLocale): AppStrings {
  return APP_COPY[locale] ?? EN
}

export function getAppPricingFootnote(app: AppStrings, currency: PricingCurrencyId): string {
  return app.pricingCurrencyNote[currency]
}
