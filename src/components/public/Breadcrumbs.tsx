import Link from "next/link";

type BreadcrumbItem = {
  label: string;
  href: string;
};

type BreadcrumbsProps = {
  items: BreadcrumbItem[];
};

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.label,
      item: item.href.startsWith("http") ? item.href : undefined,
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="font-score flex flex-wrap items-center gap-1 text-[11px] uppercase tracking-[0.2em]" style={{ color: "var(--muted-foreground)" }}>
          {items.map((item, index) => (
            <li key={item.href} className="flex items-center gap-1">
              {index < items.length - 1 ? (
                <>
                  <Link href={item.href} className="opacity-60 transition hover:opacity-100" style={{ color: "var(--cream)" }}>
                    {item.label}
                  </Link>
                  <span aria-hidden className="opacity-40">
                    /
                  </span>
                </>
              ) : (
                <span aria-current="page" style={{ color: "var(--mustard)" }}>
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}
