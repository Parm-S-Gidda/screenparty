type FAQItem = {
  q: string;
  a: string;
};

type PublicFAQProps = {
  items: FAQItem[];
  withSchema?: boolean;
};

const INK = "#221f30";

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
              className="font-display cursor-pointer list-none text-lg leading-snug"
              style={{ color: INK }}
            >
              {q}
            </summary>
            <p className="font-hand mt-3 text-lg leading-snug" style={{ color: "#4a4460" }}>
              {a}
            </p>
          </details>
        ))}
      </div>
    </>
  );
}
