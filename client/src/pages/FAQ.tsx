import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ChevronDown } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useState } from "react";
import { useLocale } from "@/contexts/LocaleContext";
import { getFAQCopy, type FAQCategoryKey } from "@/lib/faqCopy";

const categoryKeys: FAQCategoryKey[] = ["all", "delivery", "catalog", "account", "support"];

export default function FAQ() {
  const { locale } = useLocale();
  const copy = getFAQCopy(locale);
  const [selectedCategory, setSelectedCategory] = useState<FAQCategoryKey>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQ = selectedCategory === "all"
    ? copy.items
    : copy.items.filter(item => item.category === selectedCategory);

  const toggleExpand = (id: string) => setExpandedId(current => current === id ? null : id);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />

      <main className="flex-1">
        <section className="bg-gradient-to-r from-blue-50 to-cyan-50 py-12 md:py-16">
          <div className="container mx-auto px-4">
            <Link href="/">
              <div className="mb-6 flex w-fit cursor-pointer items-center gap-2 text-orange-500 hover:text-orange-600">
                <ArrowLeft className="h-5 w-5" />
                <span className="font-medium">{copy.back}</span>
              </div>
            </Link>
            <h1 className="mb-4 text-4xl font-bold text-gray-800 md:text-5xl">{copy.title}</h1>
            <p className="max-w-2xl text-lg text-gray-600">{copy.lead}</p>
          </div>
        </section>

        <section className="py-16 md:py-24">
          <div className="container mx-auto px-4">
            <div className="mb-12">
              <h2 className="mb-6 text-2xl font-bold text-gray-800">{copy.categoriesTitle}</h2>
              <div className="flex flex-wrap gap-3">
                {categoryKeys.map(category => (
                  <Button
                    key={category}
                    type="button"
                    onClick={() => { setSelectedCategory(category); setExpandedId(null); }}
                    variant={selectedCategory === category ? "default" : "outline"}
                    className={selectedCategory === category ? "bg-orange-500 text-white hover:bg-orange-600" : ""}
                  >
                    {copy.categories[category]}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              {filteredFAQ.length > 0 ? filteredFAQ.map(item => {
                const isExpanded = expandedId === item.id;
                return (
                  <Card
                    key={item.id}
                    role="button"
                    tabIndex={0}
                    aria-expanded={isExpanded}
                    className="cursor-pointer transition-shadow hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
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
                          <span className="mb-2 inline-block rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-700">{copy.categories[item.category]}</span>
                          <h3 className="text-lg font-semibold text-gray-800">{item.question}</h3>
                          {isExpanded && <p className="mt-4 leading-relaxed text-gray-700">{item.answer}</p>}
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

            <Card className="mt-12 border-orange-200 bg-gradient-to-r from-orange-50 to-teal-50">
              <CardContent className="p-8">
                <h2 className="mb-4 text-2xl font-bold text-gray-800">{copy.contactTitle}</h2>
                <p className="mb-6 text-gray-700">{copy.contactText}</p>
                <Link href="/contact"><Button className="bg-orange-500 text-white hover:bg-orange-600">{copy.contactCta}</Button></Link>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
