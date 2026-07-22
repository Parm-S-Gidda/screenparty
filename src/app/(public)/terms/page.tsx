import type { Metadata } from "next";
import Link from "next/link";
import { BRAND_NAME } from "@/lib/constants";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { TapedLabel } from "@/components/cartoon/Panel";

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND_NAME}`,
  description: `Terms of Service for the ScreenParty platform.`,
};

const INK = "#221f30";

export default function TermsPage() {
  return (
    <div className="relative z-10 mx-auto w-full max-w-3xl px-6 pt-12 pb-20">
      <Breadcrumbs
        items={[
          { label: BRAND_NAME, href: "/" },
          { label: "Terms of Service", href: "/terms" },
        ]}
      />

      <TapedLabel tilt={-1} color="var(--paper)">
        <span className="font-score text-[11px] uppercase tracking-[0.35em]" style={{ color: INK }}>
          legal
        </span>
      </TapedLabel>
      <h1
        className="font-display mt-3 text-4xl uppercase tracking-wide"
        style={{ color: "var(--cream)" }}
      >
        Terms of Service
      </h1>
      <p className="font-hand mt-2 text-lg" style={{ color: "var(--muted-foreground)" }}>
        Last updated: July 2026
      </p>

      <div className="mt-8 flex flex-col gap-6">
        <TermsSection title="Acceptance">
          <p>
            By using ScreenParty, you agree to these Terms. If you don&apos;t agree, don&apos;t use
            the service.
          </p>
        </TermsSection>

        <TermsSection title="Who Can Use ScreenParty">
          <p>
            ScreenParty is intended for users 13 years of age and older. By creating an account you
            confirm you meet this requirement. Some game content is written for a general adult
            audience.
          </p>
        </TermsSection>

        <TermsSection title="Accounts">
          <p>
            Hosts create accounts with a valid email address. You are responsible for keeping your
            account credentials secure. Players join games anonymously and do not create accounts.
          </p>
        </TermsSection>

        <TermsSection title="Subscriptions and Billing">
          <p>
            Paid plans (Party+ and Pro Host) are billed monthly. The Party Pass is a one-time
            purchase. Prices are shown in USD and may be subject to applicable taxes. Subscriptions
            renew automatically until cancelled. You can cancel at any time from your account page.
            Refunds are not provided for unused subscription time.
          </p>
          <p>
            Billing is handled by Stripe. By purchasing a plan, you agree to Stripe&apos;s terms of
            service in addition to these terms.
          </p>
        </TermsSection>

        <TermsSection title="Acceptable Use">
          <p>You agree not to:</p>
          <ul>
            <li>Submit content that is illegal, harassing, or discriminatory</li>
            <li>Attempt to reverse-engineer, scrape, or abuse the service</li>
            <li>Use ScreenParty to distribute malware or phishing content</li>
            <li>Impersonate other users or entities</li>
            <li>Circumvent plan limits or abuse free-plan provisions</li>
          </ul>
          <p>
            We reserve the right to suspend or terminate accounts that violate these terms.
          </p>
        </TermsSection>

        <TermsSection title="User-Submitted Content">
          <p>
            You may submit custom questions, prompts, words, and other content when configuring
            game rooms. You are responsible for ensuring your content complies with applicable laws
            and these terms. We do not pre-screen custom content.
          </p>
          <p>
            By submitting content, you grant us a limited licence to process and display that
            content for the purpose of running the game session.
          </p>
        </TermsSection>

        <TermsSection title="Virtual Host and AI">
          <p>
            The Virtual Host uses artificial intelligence. Its reactions and responses are
            generated automatically and may not always be accurate, appropriate, or timely. We make
            no guarantees about the quality or consistency of Virtual Host output.
          </p>
        </TermsSection>

        <TermsSection title="Service Availability">
          <p>
            We aim for high availability but do not guarantee uninterrupted service. We may perform
            maintenance, add features, or remove features at any time. We are not liable for
            losses resulting from service downtime.
          </p>
        </TermsSection>

        <TermsSection title="Limitation of Liability">
          <p>
            ScreenParty is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, we
            exclude all warranties and limit our liability to the amount you paid us in the three
            months before any claim.
          </p>
        </TermsSection>

        <TermsSection title="Changes to Terms">
          <p>
            We may update these terms. If we make material changes, we will notify you by email or
            through the platform. Continued use after notice constitutes acceptance of the updated
            terms.
          </p>
        </TermsSection>

        <TermsSection title="Governing Law">
          <p>
            {/* Owner decision needed: specify jurisdiction */}
            These terms are governed by applicable law. Disputes will be resolved in the
            jurisdiction of the company&apos;s place of incorporation.
          </p>
        </TermsSection>
      </div>

      <div className="mt-8">
        <Link href="/privacy" className="font-score text-[10px] uppercase tracking-[0.25em] underline" style={{ color: "var(--cream)" }}>
          Privacy Policy →
        </Link>
      </div>
    </div>
  );
}

function TermsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const INK = "#221f30";
  return (
    <div className="panel-paper panel-grain p-6" style={{ background: "var(--cream)" }}>
      <h2 className="font-display mb-3 text-xl uppercase tracking-wide" style={{ color: INK }}>
        {title}
      </h2>
      <div
        className="font-hand flex flex-col gap-2 text-lg leading-snug [&_li]:ml-4 [&_li]:list-disc [&_p]:leading-snug"
        style={{ color: "#4a4460" }}
      >
        {children}
      </div>
    </div>
  );
}
