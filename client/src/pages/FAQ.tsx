import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { getFAQCopy, type FAQCategoryKey } from "@/lib/faqCopy";
import { useStoreSystemPages } from "@/hooks/useStoreSystemPages";
import { buildFaqPageJsonLd, getFaqCategories } from "@shared/storeSystemPages";
import { useDesignProfile } from "@/hooks/useDesignProfile";

const categoryKeys: FAQCategoryKey[] = ["all", "delivery", "catalog", "account", "support"];

export default function FAQ() {
  const { locale } = useLocale();
  const copy = getFAQCopy(locale);
  const { palette } = useDesignProfile(locale);
  const { pages } = useStoreSystemPages();
  const [selectedCategory, setSelectedCategory] = useState<FAQCategoryKey | string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Boutique-customized FAQ wins; the legacy copy stays as the safe fallback.
  const storeItems = pages?.faq ?? [];
  const useStoreFaq = storeItems.length > 0;

  // Store FAQ keeps its own free-form categories when at least one entry is
  // categorized; otherwise the list is shown flat without filters.
  const storeCategories = useStoreFaq ? getFaqCategories(storeItems) : [];

  const filteredFAQ = useStoreFaq
    ? selectedCategory === "all"
      ? storeItems
      : storeItems.filter(item => item.category === selectedCategory)
    : selectedCategory === "all"
      ? copy.items
      : copy.items.filter(item => item.category === selectedCategory);

  const faqJsonLd = useStoreFaq ? buildFaqPageJsonLd(storeItems) : null;

  const toggleExpand = (id: string) => setExpandedId(current => current === id ? null : id);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd).replace(/</g, "\\u003c") }}
        />
      )}

      <main className="flex-1">
        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="mb-6 flex w-fit cursor-pointer items-center gap-2">
                <ArrowLeft className="h-5 w-5" style={{ color: palette.accent }} />
                <span className="font-medium" style={{ color: palette.primary }}>{copy.back}</span>
              </div>
            </Link>
            <h1 className="mb-4 text-4xl font-bold text-gray-800 md:text-5xl">{copy.title}</h1>
            <p className="max-w-2xl text-lg text-gray-600">{copy.lead}</p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            {!useStoreFaq && (
              <div className="mb-12">
                <h2 className="mb-6 text-2xl font-bold text-gray-800">{copy.categoriesTitle}</h2>
                <div className="flex flex-wrap gap-3">
                  {categoryKeys.map(category => (
                    <Button
                      key={category}
                      type="button"
                      onClick={() => { setSelectedCategory(category); setExpandedId(null); }}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={selectedCategory === category ? "text-white hover:brightness-95" : ""}
                      style={selectedCategory === category ? { backgroundColor: palette.accent } : undefined}
                    >
                      {copy.categories[category]}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {useStoreFaq && storeCategories.length > 0 && (
              <div className="mb-12">
                <div className="flex flex-wrap gap-3">
                  <Button
                    type="button"
                    onClick={() => { setSelectedCategory("all"); setExpandedId(null); }}
                    variant={selectedCategory === "all" ? "default" : "outline"}
                    className={selectedCategory === "all" ? "text-white hover:brightness-95" : ""}
                    style={selectedCategory === "all" ? { backgroundColor: palette.accent } : undefined}
                  >
                    {copy.categories.all}
                  </Button>
                  {storeCategories.map(category => (
                    <Button
                      key={category}
                      type="button"
                      onClick={() => { setSelectedCategory(category); setExpandedId(null); }}
                      variant={selectedCategory === category ? "default" : "outline"}
                      className={selectedCategory === category ? "text-white hover:brightness-95" : ""}
                      style={selectedCategory === category ? { backgroundColor: palette.accent } : undefined}
                    >
                      {category}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {filteredFAQ.length > 0 ? filteredFAQ.map(item => {
                const isExpanded = expandedId === item.id;
                const category = "category" in item ? item.category : null;
                const categoryLabel = category
                  ? useStoreFaq
                    ? category
                    : copy.categories[category as FAQCategoryKey]
                  : null;
                return (
                  <Card
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--mazigho-accent)] focus-visible:ring-offset-2"
                    onClick={() => toggleExpand(item.id)}
                    onKeyDown={event => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        toggleExpand(item.id);
                      }
                    }}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {categoryLabel && (
                            <span className="mb-2 inline-block rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: palette.soft, color: palette.primary }}>{categoryLabel}</span>
                          )}
                          <h3 className="text-lg font-semibold text-gray-800">{item.question}</h3>
                          {isExpanded && <p className="mt-4 leading-relaxed text-gray-700 whitespace-pre-line">{item.answer}</p>}
                        </div>
                        <ChevronDown className={`h-6 w-6 shrink-0 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                      </div>
                    </CardContent>
                  </Card>
                );
              }) : (
                <div className="py-12 text-center"><p className="text-gray-600">{copy.empty}</p></div>
              )}
            </div>

            <Card className="mt-12 bg-gradient-to-r from-[var(--mazigho-soft)] to-teal-50" style={{ borderColor: palette.accent }}>
              <CardContent className="p-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-800">{copy.contactTitle}</h2>
                <p className="mb-6 text-gray-700">{copy.contactText}</p>
                <Button asChild className="text-white hover:brightness-95" style={{ backgroundColor: palette.accent }}><Link href="/contact">{copy.contactCta}</Link></Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
