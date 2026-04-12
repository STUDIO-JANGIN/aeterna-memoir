import type { Metadata } from "next"
import Link from "next/link"
import { getAppBaseUrl } from "@/lib/appUrl"

export const metadata: Metadata = {
  title: "Privacy Policy & Terms of Service | Aeterna",
  description:
    "Privacy Policy and Terms of Service for Aeterna — how we collect, use, and protect memorial data.",
  alternates: { canonical: `${getAppBaseUrl()}/privacy-terms` },
}

export default function PrivacyTermsPage() {
  return (
    <div className="min-h-dvh bg-landing px-5 py-16 md:py-24">
      <article className="mx-auto w-full max-w-[800px] font-[var(--font-sans)] text-[var(--landing-text-body)]">
        <p className="text-[10px] tracking-[0.28em] uppercase text-[#737373] mb-4">Legal</p>
        <h1 className="font-[var(--font-serif)] text-2xl md:text-3xl text-[var(--landing-text-title)] tracking-tight mb-10">
          Privacy Policy & Terms of Service
        </h1>

        <section className="space-y-4 mb-12">
          <h2 className="text-sm font-semibold tracking-wide text-[#e5e5e5]">1. Privacy Policy</h2>
          <div className="space-y-4 text-[15px] leading-[1.75] text-[#a3a3a3]">
            <p>
              <strong className="text-[#c4c4c4] font-medium">Data Collection:</strong> We collect your email,
              memorial details (name, dates), and contributed memories (photos, messages).
            </p>
            <p>
              <strong className="text-[#c4c4c4] font-medium">Usage:</strong> Data is used exclusively for
              operating the memorial, providing customer support, and processing payments via Stripe.
            </p>
            <p>
              <strong className="text-[#c4c4c4] font-medium">Protection:</strong> Your memories are encrypted
              and never sold to third parties.
            </p>
            <p>
              <strong className="text-[#c4c4c4] font-medium">Retention:</strong> Memorials without a
              &apos;Preserve Forever&apos; plan will be set to private after 7 days to protect data privacy.
              Full data deletion is available upon request.
            </p>
          </div>
        </section>

        <section className="space-y-4 mb-12">
          <h2 className="text-sm font-semibold tracking-wide text-[#e5e5e5]">2. Terms of Service</h2>
          <div className="space-y-4 text-[15px] leading-[1.75] text-[#a3a3a3]">
            <p>
              <strong className="text-[#c4c4c4] font-medium">Service Provision:</strong> Aeterna provides a
              digital sanctuary. Data retention depends on your selected plan.
            </p>
            <p>
              <strong className="text-[#c4c4c4] font-medium">User Conduct:</strong> You agree to protect the
              sanctity of this space. Inappropriate content (hate speech, nudity, etc.) is strictly prohibited
              and will be removed immediately.
            </p>
            <p>
              <strong className="text-[#c4c4c4] font-medium">Ownership:</strong> You retain rights to your
              content, but grant Aeterna a license to host it within the service.
            </p>
            <p>
              <strong className="text-[#c4c4c4] font-medium">Disclaimer:</strong> While we take artisan care
              of your data, we recommend personal backups for irreplaceable memories.
            </p>
          </div>
        </section>

        <section className="space-y-3 mb-16">
          <h2 className="text-sm font-semibold tracking-wide text-[#e5e5e5]">3. Contact</h2>
          <p className="text-[15px] leading-[1.75] text-[#a3a3a3]">
            For inquiries:{" "}
            <a
              href="mailto:hoon@aya.yale.edu"
              className="text-[var(--aeterna-gold-muted)] underline underline-offset-2 hover:text-[var(--aeterna-gold)]"
            >
              hoon@aya.yale.edu
            </a>
          </p>
        </section>

        <p className="text-center">
          <Link
            href="/"
            className="text-[12px] text-[#737373] hover:text-[var(--aeterna-gold-muted)] transition-colors"
          >
            ← Back to home
          </Link>
        </p>
      </article>
    </div>
  )
}
