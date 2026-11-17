import type { Metadata } from "next";
import { BRAND_NAME } from "@/lib/constants";
import { LegalDoc, LegalSection, PageHeader, TextLink } from "@/components/public/PageParts";

export const metadata: Metadata = {
  title: `Terms of Service | ${BRAND_NAME}`,
  description: `Terms of Service for the ScreenParty platform.`,
};

export default function TermsPage() {
  return (
    <div className="relative">
      <PageHeader
        crumbs={[
          { label: BRAND_NAME, href: "/" },
          { label: "Terms of Service", href: "/terms" },
        ]}
        title="Terms of Service"
        actions={<TextLink href="/privacy">Privacy Policy →</TextLink>}
      />
      <LegalDoc updated="July 2026">
        <LegalSection title="Acceptance">
          <p>
            By using ScreenParty, you agree to these Terms. If you don&apos;t agree, don&apos;t use
            the service.
          </p>
        </LegalSection>

        <LegalSection title="Who Can Use ScreenParty">
          <p>
            ScreenParty is intended for users 13 years of age and older. By creating an account you
            confirm you meet this requirement. Some game content is written for a general adult
            audience.
          </p>
        </LegalSection>

        <LegalSection title="Accounts">
          <p>
            Hosts create accounts with a valid email address. You are responsible for keeping your
            account credentials secure. Players join games anonymously and do not create accounts.
          </p>
        </LegalSection>

        <LegalSection title="Subscriptions and Billing">
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
        </LegalSection>

        <LegalSection title="Acceptable Use">
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
        </LegalSection>

        <LegalSection title="User-Submitted Content">
          <p>
            You may submit custom questions, prompts, words, and other content when configuring
            game rooms. You are responsible for ensuring your content complies with applicable laws
            and these terms. We do not pre-screen custom content.
          </p>
          <p>
            By submitting content, you grant us a limited licence to process and display that
            content for the purpose of running the game session.
          </p>
        </LegalSection>

        <LegalSection title="Virtual Host and AI">
          <p>
            The Virtual Host uses artificial intelligence. Its reactions and responses are
            generated automatically and may not always be accurate, appropriate, or timely. We make
            no guarantees about the quality or consistency of Virtual Host output.
          </p>
        </LegalSection>

        <LegalSection title="Service Availability">
          <p>
            We aim for high availability but do not guarantee uninterrupted service. We may perform
            maintenance, add features, or remove features at any time. We are not liable for
            losses resulting from service downtime.
          </p>
        </LegalSection>

        <LegalSection title="Limitation of Liability">
          <p>
            ScreenParty is provided &ldquo;as is.&rdquo; To the maximum extent permitted by law, we
            exclude all warranties and limit our liability to the amount you paid us in the three
            months before any claim.
          </p>
        </LegalSection>

        <LegalSection title="Changes to Terms">
          <p>
            We may update these terms. If we make material changes, we will notify you by email or
            through the platform. Continued use after notice constitutes acceptance of the updated
            terms.
          </p>
        </LegalSection>

        <LegalSection title="Governing Law">
          <p>
            {/* Owner decision needed: specify jurisdiction */}
            These terms are governed by applicable law. Disputes will be resolved in the
            jurisdiction of the company&apos;s place of incorporation.
          </p>
        </LegalSection>
      </LegalDoc>
    </div>
  );
}
