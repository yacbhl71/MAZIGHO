import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Sparkles, Users } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { getPublicCopy } from "@/lib/publicCopy";
import { useStoreSystemPages } from "@/hooks/useStoreSystemPages";

export default function About() {
  const { locale } = useLocale();
  const copy = getPublicCopy(locale);
  const { pages } = useStoreSystemPages();
  const storeAbout = pages?.about ?? null;

  // Once a boutique writes its own page, no MAZIGHO editorial block is
  // appended underneath it. The owner controls the entire public page.
  if (storeAbout) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <Header />
        <main className="flex-1">
          <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-16 md:py-20">
            <div className="container mx-auto max-w-4xl px-4 text-center">
              <h1 className="text-4xl font-bold text-foreground md:text-5xl">
                {storeAbout.title || "À propos"}
              </h1>
            </div>
          </section>
          <section className="py-16 md:py-24">
            <div className="container mx-auto max-w-4xl px-4">
              <div className="whitespace-pre-line text-lg leading-relaxed text-muted-foreground">
                {storeAbout.body}
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-16 md:py-20">
          <div className="container mx-auto text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">{copy.story.eyebrow}</p>
            <h1 className="mb-6 text-4xl font-bold text-foreground md:text-5xl">{copy.footer.about}</h1>
            <p className="mx-auto max-w-3xl text-lg leading-relaxed text-muted-foreground">{copy.story.text}</p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto"><div className="mx-auto max-w-4xl space-y-8">
            <div>
              <h2 className="mb-6 text-3xl font-bold text-foreground md:text-4xl">{copy.story.title}</h2>
              <div className="space-y-4 text-lg leading-relaxed text-muted-foreground">
                <p>{copy.story.text}</p>
                <p>{copy.story.followup}</p>
              </div>
            </div>
          </div></div>
        </section>

        <section className="bg-secondary/20 py-16 md:py-24">
          <div className="container mx-auto">
            <div className="mb-12 text-center"><h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{copy.discovery.title}</h2><p className="mx-auto max-w-2xl text-muted-foreground">{copy.discovery.text}</p></div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {[Sparkles, Heart, Users].map((Icon, index) => <Card key={copy.reassurance[index].title} className="text-center"><CardContent className="space-y-4 p-8"><div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10"><Icon className="h-8 w-8 text-primary" /></div><h3 className="text-xl font-semibold text-foreground">{copy.reassurance[index].title}</h3><p className="text-muted-foreground">{copy.reassurance[index].text}</p></CardContent></Card>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
