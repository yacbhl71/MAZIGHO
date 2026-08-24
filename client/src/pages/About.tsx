import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Heart, Sparkles, Users } from "lucide-react";
import { useLocale } from "@/contexts/LocaleContext";
import { getPublicCopy } from "@/lib/publicCopy";

export default function About() {
  const { locale } = useLocale();
  const copy = getPublicCopy(locale);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-br from-primary/10 via-accent/5 to-secondary/10 py-16 md:py-20">
          <div className="container mx-auto text-center">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.24em] text-primary">{copy.story.eyebrow}</p>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">{copy.footer.about}</h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">{copy.story.text}</p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto"><div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">{copy.story.title}</h2>
              <div className="space-y-4 text-muted-foreground leading-relaxed text-lg">
                <p>{copy.story.text}</p>
                <p>{copy.story.followup}</p>
              </div>
            </div>
          </div></div>
        </section>

        <section className="py-16 md:py-24 bg-secondary/20">
          <div className="container mx-auto">
            <div className="text-center mb-12"><h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{copy.discovery.title}</h2><p className="text-muted-foreground max-w-2xl mx-auto">{copy.discovery.text}</p></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[Sparkles, Heart, Users].map((Icon, index) => <Card key={copy.reassurance[index].title} className="text-center"><CardContent className="p-8 space-y-4"><div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto"><Icon className="h-8 w-8 text-primary" /></div><h3 className="text-xl font-semibold text-foreground">{copy.reassurance[index].title}</h3><p className="text-muted-foreground">{copy.reassurance[index].text}</p></CardContent></Card>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
