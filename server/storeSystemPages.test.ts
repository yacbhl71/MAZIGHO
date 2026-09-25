import { describe, expect, it } from "vitest";
import {
  MAX_FAQ_ITEMS,
  buildFaqPageJsonLd,
  getFaqCategories,
  getSystemPagesCompliance,
  normalizeContactPageContent,
  normalizeFaqItems,
  normalizeTextPageContent,
  parseFaqItems,
  parseTextPageContent,
  renderStorePageTemplate,
} from "../shared/storeSystemPages";

describe("normalizeFaqItems", () => {
  it("keeps valid entries and assigns stable ids", () => {
    expect(normalizeFaqItems([
      { question: "  Livrez-vous en Suisse ?  ", answer: " Oui, sous 3 à 5 jours. " },
    ])).toEqual([
      { id: "faq-1", question: "Livrez-vous en Suisse ?", answer: "Oui, sous 3 à 5 jours." },
    ]);
  });

  it("drops malformed entries instead of failing the whole list", () => {
    expect(normalizeFaqItems([
      { question: "ok ?", answer: "Réponse valide" },
      { question: "no", answer: "trop courte" },
      "not-an-object",
      { answer: "sans question" },
      { question: "Sans réponse" },
    ])).toEqual([
      { id: "faq-1", question: "ok ?", answer: "Réponse valide" },
    ]);
  });

  it("deduplicates ids and caps the list length", () => {
    const input = Array.from({ length: MAX_FAQ_ITEMS + 10 }, (_, i) => ({
      id: i % 2 === 0 ? "same" : `q-${i}`,
      question: `Question ${i} ?`,
      answer: `Réponse ${i}`,
    }));
    const result = normalizeFaqItems(input);
    expect(result.length).toBeLessThanOrEqual(MAX_FAQ_ITEMS);
    expect(new Set(result.map(item => item.id)).size).toBe(result.length);
  });

  it("keeps a trimmed optional category and drops empty ones", () => {
    expect(normalizeFaqItems([
      { question: "Livrez-vous ?", answer: "Oui.", category: " Livraison " },
      { question: "Puis-je payer en plusieurs fois ?", answer: "Non.", category: "   " },
    ])).toEqual([
      { id: "faq-1", question: "Livrez-vous ?", answer: "Oui.", category: "Livraison" },
      { id: "faq-2", question: "Puis-je payer en plusieurs fois ?", answer: "Non." },
    ]);
  });

  it("caps the category label length", () => {
    const long = "x".repeat(200);
    const [item] = normalizeFaqItems([{ question: "Q valide ?", answer: "R", category: long }]);
    expect(item.category).toHaveLength(60);
  });

  it("returns an empty list for non-array input so the storefront falls back", () => {
    expect(normalizeFaqItems(null)).toEqual([]);
    expect(normalizeFaqItems({ question: "x" })).toEqual([]);
    expect(parseFaqItems("not-json")).toEqual([]);
    expect(parseFaqItems(null)).toEqual([]);
  });
});

describe("getFaqCategories", () => {
  it("lists distinct categories in first-appearance order, case-insensitively", () => {
    expect(getFaqCategories([
      { id: "a", question: "Q1 ?", answer: "R", category: "Livraison" },
      { id: "b", question: "Q2 ?", answer: "R" },
      { id: "c", question: "Q3 ?", answer: "R", category: "livraison" },
      { id: "d", question: "Q4 ?", answer: "R", category: "Commandes" },
    ])).toEqual(["Livraison", "Commandes"]);
  });

  it("returns an empty list when no item is categorized", () => {
    expect(getFaqCategories([{ id: "a", question: "Q ?", answer: "R" }])).toEqual([]);
  });
});

describe("buildFaqPageJsonLd", () => {
  it("builds a schema.org FAQPage payload", () => {
    expect(buildFaqPageJsonLd([
      { id: "faq-1", question: "Livrez-vous ?", answer: "Oui, sous 3 à 5 jours." },
    ])).toEqual({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Livrez-vous ?",
          acceptedAnswer: { "@type": "Answer", text: "Oui, sous 3 à 5 jours." },
        },
      ],
    });
  });

  it("returns null for an empty FAQ so no block is published", () => {
    expect(buildFaqPageJsonLd([])).toBeNull();
  });
});

describe("normalizeContactPageContent", () => {
  it("trims fields and keeps a usable contact page", () => {
    expect(normalizeContactPageContent({
      title: " Contact ",
      intro: "Une question ?",
      email: " hello@boutique.test ",
      phone: "",
      address: " Rue de la Paix 1, Genève ",
      hours: " Lun-Ven 9h-18h ",
    })).toEqual({
      title: "Contact",
      intro: "Une question ?",
      email: "hello@boutique.test",
      phone: "",
      address: "Rue de la Paix 1, Genève",
      hours: "Lun-Ven 9h-18h",
    });
  });

  it("treats a fully empty page as absent so the default copy applies", () => {
    expect(normalizeContactPageContent({})).toBeNull();
    expect(normalizeContactPageContent({ title: " ", intro: "", email: "", address: "" })).toBeNull();
    expect(normalizeContactPageContent("nope")).toBeNull();
  });
});

describe("normalizeTextPageContent", () => {
  it("accepts a returns or about page with title and body", () => {
    expect(normalizeTextPageContent({ title: " Retours ", body: " 30 jours pour changer d'avis. " })).toEqual({
      title: "Retours",
      body: "30 jours pour changer d'avis.",
    });
  });

  it("rejects empty pages and malformed JSON", () => {
    expect(normalizeTextPageContent({ title: "", body: "" })).toBeNull();
    expect(parseTextPageContent("{invalid")).toBeNull();
    expect(parseTextPageContent(undefined)).toBeNull();
  });
});

describe("renderStorePageTemplate", () => {
  const ctx = { storeName: "Pattes & Compagnie", contactEmail: "hello@pattes.test" };

  it("replaces supported variables", () => {
    expect(renderStorePageTemplate("Bienvenue chez {{store_name}} ! Écrivez à {{ contact_email }}.", ctx))
      .toBe("Bienvenue chez Pattes & Compagnie ! Écrivez à hello@pattes.test.");
  });

  it("leaves unknown variables untouched", () => {
    expect(renderStorePageTemplate("Code : {{unknown_var}}", ctx)).toBe("Code : {{unknown_var}}");
  });
});

describe("getSystemPagesCompliance", () => {
  it("flags missing pages for the owner checklist", () => {
    expect(getSystemPagesCompliance({ faq: [], contact: null, returns: null, about: null })).toEqual({
      faq: "empty",
      contact: "missing",
      returns: "missing",
      about: "missing",
    });
  });

  it("reports ready pages", () => {
    expect(getSystemPagesCompliance({
      faq: [{ id: "faq-1", question: "Q ?", answer: "R" }],
      contact: { title: "", intro: "", email: "a@b.test", phone: "", address: "", hours: "" },
      returns: { title: "Retours", body: "30 jours" },
      about: { title: "À propos", body: "Notre histoire" },
    })).toEqual({ faq: "ready", contact: "ready", returns: "ready", about: "ready" });
  });
});
