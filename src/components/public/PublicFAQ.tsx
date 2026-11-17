type FAQItem = {
  q: string;
  a: string;
};

type PublicFAQProps = {
  items: FAQItem[];
  withSchema?: boolean;
};

export function PublicFAQ({ items, withSchema = false }: PublicFAQProps) {
  const jsonLd = withSchema
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: items.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <div className="flex flex-col gap-3">
        {items.map(({ q, a }) => (
          <details
            key={q}
            className="panel-paper panel-grain group p-4"
            style={{ background: "var(--cream)" }}
          >
            <summary
              className="font-display flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-lg leading-snug [&::-webkit-details-marker]:hidden"
              style={{ color: "var(--ink)" }}
            >
              {q}
              <svg
                aria-hidden
                viewBox="0 0 24 24"
                className="h-6 w-6 shrink-0 transition-transform duration-200 group-open:rotate-180"
                fill="none"
                stroke="currentColor"
                strokeWidth={3}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
            </summary>
            <p className="font-hand mt-3 max-w-[65ch] text-lg leading-snug" style={{ color: "var(--ink-body)" }}>
              {a}
            </p>
          </details>
        ))}
      </div>
    </>
  );
}
