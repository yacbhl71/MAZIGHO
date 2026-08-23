import { Link } from "wouter";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

type LegalLayoutProps = {
  eyebrow: string;
  title: string;
  description: string;
  updatedAt: string;
  children: React.ReactNode;
};

export default function LegalLayout({ eyebrow, title, description, updatedAt, children }: LegalLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-[#fbf7f2]">
      <Header />
      <main className="flex-1">
        <section className="border-b border-[#eadfd2] bg-white">
          <div className="container mx-auto px-4 py-12 md:py-16">
            <div className="mx-auto max-w-4xl">
              <p className="mb-3 text-xs font-bold uppercase tracking-[0.28em] text-orange-600">{eyebrow}</p>
              <h1 className="text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">{title}</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-slate-600">{description}</p>
              <p className="mt-5 text-xs text-slate-500">Dernière mise à jour : {updatedAt}</p>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-10 md:py-14">
          <article className="mx-auto max-w-4xl space-y-8 rounded-2xl border border-[#eadfd2] bg-white p-6 text-[15px] leading-7 text-slate-700 md:p-10">
            {children}
          </article>
          <nav className="mx-auto mt-8 flex max-w-4xl flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-orange-700">
            <Link href="/mentions-legales"><span className="cursor-pointer hover:text-orange-500">Mentions légales</span></Link>
            <Link href="/confidentialite"><span className="cursor-pointer hover:text-orange-500">Confidentialité</span></Link>
            <Link href="/conditions-generales"><span className="cursor-pointer hover:text-orange-500">Conditions générales</span></Link>
            <Link href="/livraison-retours"><span className="cursor-pointer hover:text-orange-500">Livraison et retours</span></Link>
          </nav>
        </section>
      </main>
      <Footer />
    </div>
  );
}
