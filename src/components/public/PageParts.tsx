import Link from "next/link";
import { SpotRays } from "@/components/cartoon/Doodles";
import { Breadcrumbs } from "@/components/public/Breadcrumbs";
import { RevealItem, RevealList } from "@/components/public/Reveal";

type Crumb = { label: string; href: string };

// Inner-page hero: spotlight rays that fade out before the section edge,
// breadcrumbs, the page's one display headline, and an optional prop on the right.
export function PageHeader({
  crumbs,
  title,
  sub,
  actions,
  aside,
}: {
  crumbs: Crumb[];
  title: React.ReactNode;
  sub?: React.ReactNode;
  actions?: React.ReactNode;
  aside?: React.ReactNode;
}) {
  const fade = "[mask-image:linear-gradient(to_bottom,black_40%,transparent_95%)]";
  return (
    <section className="relative overflow-hidden px-6 pb-16 pt-8 md:pb-20 md:pt-10">
      <SpotRays className={`pointer-events-none absolute left-0 top-0 h-full w-[50vw] opacity-30 ${fade}`} />
      <SpotRays flip className={`pointer-events-none absolute right-0 top-0 h-full w-[50vw] opacity-30 ${fade}`} />
      <div className="relative z-10 mx-auto w-full max-w-5xl">
        <Breadcrumbs items={crumbs} />
        <div className={aside ? "grid items-center gap-12 md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]" : ""}>
          <div className="flex flex-col items-start gap-5">
            <h1
              className="font-display text-balance text-[clamp(2.25rem,6vw,3.75rem)] uppercase leading-[0.95]"
              style={{ color: "var(--cream)" }}
            >
              {title}
            </h1>
            {sub && (
              <p className="font-hand max-w-[52ch] text-pretty text-xl leading-snug" style={{ color: "var(--cream-muted)" }}>
                {sub}
              </p>
            )}
            {actions && <div className="mt-1 flex flex-wrap items-center gap-x-6 gap-y-4">{actions}</div>}
          </div>
          {aside}
        </div>
      </div>
    </section>
  );
}

export function SectionHeading({
  id,
  sub,
  children,
  align = "center",
}: {
  id: string;
  sub?: React.ReactNode;
  children: React.ReactNode;
  align?: "center" | "left";
}) {
  const center = align === "center";
  return (
    <div className={`mb-10 flex flex-col gap-3 ${center ? "items-center text-center" : "items-start"}`}>
      <h2 id={id} className="font-display text-balance text-3xl uppercase leading-[1.05] md:text-4xl" style={{ color: "var(--cream)" }}>
        {children}
      </h2>
      {sub && (
        <p className="font-hand max-w-xl text-balance text-xl leading-snug" style={{ color: "var(--muted-foreground)" }}>
          {sub}
        </p>
      )}
    </div>
  );
}

/** Oswald text link, the quiet partner to a page's one mustard button. */
export function TextLink({ href, children, onPaper = false }: { href: string; children: React.ReactNode; onPaper?: boolean }) {
  return (
    <Link href={href} className="link-label" style={{ color: onPaper ? "var(--ink)" : "var(--cream)" }}>
      {children}
    </Link>
  );
}

// Closing panel, same prop as the landing page's "Ready to play?".
export function ClosingCta({
  title,
  body,
  cta,
  link,
}: {
  title: string;
  body: React.ReactNode;
  cta: { href: string; label: string };
  link?: { href: string; label: string };
}) {
  return (
    <section className="mx-auto w-full max-w-2xl px-6 pb-24 pt-8 text-center">
      <RevealList>
        <RevealItem className="panel panel-grain flex flex-col items-center gap-5 p-8 md:p-12">
          <h2 className="font-display text-balance text-3xl uppercase md:text-4xl" style={{ color: "var(--ink)" }}>
            {title}
          </h2>
          <p className="font-hand max-w-[40ch] text-xl leading-snug" style={{ color: "var(--ink-body)" }}>
            {body}
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:gap-6">
            <Link href={cta.href} className="btn-rough px-8 py-3 text-xl">
              {cta.label}
            </Link>
            {link && (
              <TextLink href={link.href} onPaper>
                {link.label}
              </TextLink>
            )}
          </div>
        </RevealItem>
      </RevealList>
    </section>
  );
}

// Legal and other long reads: one paper document, sections split by dashed rules.
export function LegalDoc({ updated, children }: { updated: string; children: React.ReactNode }) {
  return (
    <section className="mx-auto w-full max-w-3xl px-6 pb-16 md:pb-24">
      <article className="panel panel-grain flex flex-col px-6 py-4 md:px-10 md:py-6">
        <p className="font-score pb-2 pt-4 text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ink-label)" }}>
          Last updated {updated}
        </p>
        {children}
      </article>
    </section>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border-dashed py-6 [&:not(:nth-child(2))]:border-t-[3px]" style={{ borderColor: "rgba(34,31,48,0.25)" }}>
      <h2 className="font-display mb-3 text-xl uppercase" style={{ color: "var(--ink)" }}>
        {title}
      </h2>
      <div
        className="font-hand flex max-w-[65ch] flex-col gap-2 text-lg leading-snug [&_h3]:mt-3 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_strong]:font-display [&_strong]:font-normal [&_strong]:text-[var(--ink)]"
        style={{ color: "var(--ink-body)" }}
      >
        {children}
      </div>
    </section>
  );
}
