import { PublicNav } from "@/components/public/PublicNav";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicNav />
      <main className="relative flex flex-1 flex-col">
        {children}
      </main>
      <PublicFooter />
    </>
  );
}
