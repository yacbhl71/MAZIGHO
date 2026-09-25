import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, CheckCircle2, CircleAlert, Eye, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import type { StoreFaqItem, StoreSystemPagesCompliance } from "@shared/storeSystemPages";

/**
 * Autonomous editor for the store-scoped system pages. Mount it inside the
 * owner panel (/gestion-boutique); it talks to the ownerSystemPages router
 * and keeps every page's fallback intact via "Réinitialiser".
 */

type EditorTab = "faq" | "contact" | "returns" | "about";

const TAB_LABELS: Record<EditorTab, string> = {
  faq: "FAQ",
  contact: "Contact",
  returns: "Livraison et retours",
  about: "À propos",
};

type ContactDraft = { title: string; intro: string; email: string; phone: string; address: string; hours: string };
type TextDraft = { title: string; body: string };

const EMPTY_CONTACT: ContactDraft = { title: "", intro: "", email: "", phone: "", address: "", hours: "" };
const EMPTY_TEXT: TextDraft = { title: "", body: "" };

function ComplianceBadge({ state, emptyLabel }: { state: "ready" | "missing" | "empty"; emptyLabel?: string }) {
  if (state === "ready") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-800">
        <CheckCircle2 className="h-3.5 w-3.5" /> Personnalisée
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
      <CircleAlert className="h-3.5 w-3.5" /> {emptyLabel ?? "Texte par défaut"}
    </span>
  );
}

function newFaqItem(index: number): StoreFaqItem {
  return { id: `faq-${Date.now()}-${index}`, question: "", answer: "" };
}

export default function StoreSystemPagesEditor() {
  const utils = trpc.useUtils();
  const { data, isLoading } = trpc.ownerSystemPages.getPages.useQuery(undefined, { retry: false });

  const [tab, setTab] = useState<EditorTab>("faq");
  const [showPreview, setShowPreview] = useState(false);

  const [faqItems, setFaqItems] = useState<StoreFaqItem[]>([]);
  const [contact, setContact] = useState<ContactDraft>(EMPTY_CONTACT);
  const [returns, setReturns] = useState<TextDraft>(EMPTY_TEXT);
  const [about, setAbout] = useState<TextDraft>(EMPTY_TEXT);

  // Hydrate drafts once the store content is loaded.
  useEffect(() => {
    if (!data) return;
    setFaqItems(data.pages.faq.map(item => ({ ...item })));
    setContact(data.pages.contact ? { ...data.pages.contact } : EMPTY_CONTACT);
    setReturns(data.pages.returns ? { ...data.pages.returns } : EMPTY_TEXT);
    setAbout(data.pages.about ? { ...data.pages.about } : EMPTY_TEXT);
  }, [data]);

  const compliance: StoreSystemPagesCompliance | null = data?.compliance ?? null;

  const invalidate = () => utils.ownerSystemPages.getPages.invalidate();

  const saveFaq = trpc.ownerSystemPages.updateFaq.useMutation({
    onSuccess: () => { toast.success("FAQ enregistrée."); invalidate(); },
    onError: error => toast.error(error.message || "Enregistrement de la FAQ impossible."),
  });
  const saveContact = trpc.ownerSystemPages.updateContact.useMutation({
    onSuccess: () => { toast.success("Page contact enregistrée."); invalidate(); },
    onError: error => toast.error(error.message || "Enregistrement de la page contact impossible."),
  });
  const saveTextPage = trpc.ownerSystemPages.updateTextPage.useMutation({
    onSuccess: () => { toast.success("Page enregistrée."); invalidate(); },
    onError: error => toast.error(error.message || "Enregistrement de la page impossible."),
  });
  const resetPage = trpc.ownerSystemPages.resetPage.useMutation({
    onSuccess: () => { toast.success("Page réinitialisée : le texte par défaut s'affiche à nouveau."); invalidate(); },
    onError: error => toast.error(error.message || "Réinitialisation impossible."),
  });

  const isSaving = saveFaq.isPending || saveContact.isPending || saveTextPage.isPending || resetPage.isPending;

  /* ------------------------------ FAQ editing ---------------------------- */

  const faqCategories = useMemo(() => {
    const seen = new Set<string>();
    for (const item of faqItems) {
      const category = item.category?.trim();
      if (category) seen.add(category);
    }
    return Array.from(seen);
  }, [faqItems]);

  const updateFaqItem = (index: number, patch: Partial<StoreFaqItem>) => {
    setFaqItems(current => current.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const moveFaqItem = (index: number, direction: -1 | 1) => {
    setFaqItems(current => {
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      const [moved] = next.splice(index, 1);
      next.splice(target, 0, moved);
      return next;
    });
  };

  const removeFaqItem = (index: number) => {
    setFaqItems(current => current.filter((_, i) => i !== index));
  };

  const handleSaveFaq = () => {
    const invalid = faqItems.find(item => item.question.trim().length > 0 && item.question.trim().length < 3);
    if (invalid) {
      toast.error("Chaque question doit contenir au moins 3 caractères.");
      return;
    }
    const incomplete = faqItems.find(item => item.question.trim().length >= 3 && item.answer.trim().length === 0);
    if (incomplete) {
      toast.error("Chaque question doit avoir une réponse.");
      return;
    }
    const cleaned = faqItems.filter(item => item.question.trim().length > 0 || item.answer.trim().length > 0);
    saveFaq.mutate({ items: cleaned.map(item => ({
      id: item.id,
      question: item.question,
      answer: item.answer,
      category: item.category?.trim() ? item.category.trim() : undefined,
    })) });
  };

  const confirmReset = (pageId: EditorTab) => {
    if (window.confirm(`Réinitialiser la page « ${TAB_LABELS[pageId]} » ? Le texte par défaut de la plateforme s'affichera à nouveau sur votre vitrine.`)) {
      resetPage.mutate({ pageId });
    }
  };

  /* -------------------------------- Render ------------------------------- */

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Chargement des pages de la boutique…</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Pages de la boutique</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Personnalisez les pages publiques de votre vitrine. Tant qu'une page n'est pas personnalisée,
            le texte par défaut de la plateforme reste affiché. Variables disponibles :
            {" "}<code className="rounded bg-muted px-1">{"{{store_name}}"}</code> et
            {" "}<code className="rounded bg-muted px-1">{"{{contact_email}}"}</code>.
          </p>
        </div>
        <Button type="button" variant="outline" className="gap-2" onClick={() => setShowPreview(v => !v)}>
          <Eye className="h-4 w-4" /> {showPreview ? "Masquer l'aperçu" : "Aperçu"}
        </Button>
      </div>

      {/* Compliance checklist */}
      {compliance && (
        <div className="flex flex-wrap gap-2">
          <ComplianceBadge state={compliance.faq} emptyLabel="FAQ par défaut" />
          <ComplianceBadge state={compliance.contact} />
          <ComplianceBadge state={compliance.returns} />
          <ComplianceBadge state={compliance.about} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-border pb-2">
        {(Object.keys(TAB_LABELS) as EditorTab[]).map(key => (
          <Button
            key={key}
            type="button"
            variant={tab === key ? "default" : "outline"}
            size="sm"
            onClick={() => setTab(key)}
          >
            {TAB_LABELS[key]}
          </Button>
        ))}
      </div>

      <div className={`grid gap-6 ${showPreview ? "lg:grid-cols-2" : ""}`}>
        <div className="space-y-6">
          {tab === "faq" && (
            <Card>
              <CardContent className="space-y-6 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Questions fréquentes</h3>
                    <p className="text-sm text-muted-foreground">
                      Jusqu'à 60 questions. La catégorie est facultative : dès qu'une question en a une,
                      des filtres apparaissent sur la page publique.
                    </p>
                  </div>
                  <ComplianceBadge state={compliance?.faq ?? "empty"} emptyLabel="FAQ par défaut" />
                </div>

                <datalist id="faq-category-suggestions">
                  {faqCategories.map(category => <option key={category} value={category} />)}
                </datalist>

                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <div key={item.id} className="space-y-3 rounded-lg border border-border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          Question {index + 1}
                        </span>
                        <div className="flex items-center gap-1">
                          <Button type="button" size="sm" variant="ghost" disabled={index === 0} onClick={() => moveFaqItem(index, -1)} aria-label="Monter">
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" disabled={index === faqItems.length - 1} onClick={() => moveFaqItem(index, 1)} aria-label="Descendre">
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" className="text-destructive" onClick={() => removeFaqItem(index)} aria-label="Supprimer">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="grid gap-3 md:grid-cols-[1fr_180px]">
                        <div className="space-y-1">
                          <Label htmlFor={`faq-q-${item.id}`}>Question *</Label>
                          <Input
                            id={`faq-q-${item.id}`}
                            value={item.question}
                            maxLength={240}
                            placeholder="Ex. Livrez-vous en Suisse ?"
                            onChange={e => updateFaqItem(index, { question: e.target.value })}
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`faq-c-${item.id}`}>Catégorie</Label>
                          <Input
                            id={`faq-c-${item.id}`}
                            value={item.category ?? ""}
                            maxLength={60}
                            list="faq-category-suggestions"
                            placeholder="Ex. Livraison"
                            onChange={e => updateFaqItem(index, { category: e.target.value })}
                          />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor={`faq-a-${item.id}`}>Réponse *</Label>
                        <Textarea
                          id={`faq-a-${item.id}`}
                          value={item.answer}
                          rows={3}
                          maxLength={4000}
                          placeholder="Votre réponse…"
                          onChange={e => updateFaqItem(index, { answer: e.target.value })}
                        />
                      </div>
                    </div>
                  ))}

                  {faqItems.length === 0 && (
                    <p className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      Aucune question personnalisée. La FAQ par défaut de la plateforme s'affiche sur votre vitrine.
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="gap-2"
                    disabled={faqItems.length >= 60}
                    onClick={() => setFaqItems(current => [...current, newFaqItem(current.length)])}
                  >
                    <Plus className="h-4 w-4" /> Ajouter une question
                  </Button>
                  <div className="flex gap-2">
                    <Button type="button" variant="ghost" className="gap-2" disabled={isSaving} onClick={() => confirmReset("faq")}>
                      <RotateCcw className="h-4 w-4" /> Réinitialiser
                    </Button>
                    <Button type="button" className="gap-2" disabled={isSaving} onClick={handleSaveFaq}>
                      <Save className="h-4 w-4" /> {saveFaq.isPending ? "Enregistrement…" : "Enregistrer la FAQ"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {tab === "contact" && (
            <Card>
              <CardContent className="space-y-5 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="font-semibold text-foreground">Page contact</h3>
                    <p className="text-sm text-muted-foreground">
                      Ces coordonnées s'affichent à côté du formulaire de contact public.
                    </p>
                  </div>
                  <ComplianceBadge state={compliance?.contact ?? "missing"} />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="contact-title">Titre de la page</Label>
                    <Input id="contact-title" value={contact.title} maxLength={160} placeholder="Contactez-nous"
                      onChange={e => setContact(c => ({ ...c, title: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact-email">E-mail public</Label>
                    <Input id="contact-email" type="email" value={contact.email} maxLength={320} placeholder="hello@ma-boutique.ch"
                      onChange={e => setContact(c => ({ ...c, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact-phone">Téléphone</Label>
                    <Input id="contact-phone" value={contact.phone} maxLength={40} placeholder="+41 …"
                      onChange={e => setContact(c => ({ ...c, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact-hours">Horaires</Label>
                    <Input id="contact-hours" value={contact.hours} maxLength={500} placeholder="Lun–Ven, 9h–18h"
                      onChange={e => setContact(c => ({ ...c, hours: e.target.value }))} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contact-intro">Introduction</Label>
                  <Textarea id="contact-intro" value={contact.intro} rows={3} maxLength={2000}
                    placeholder="Une question sur votre commande, nos produits ? Écrivez-nous."
                    onChange={e => setContact(c => ({ ...c, intro: e.target.value }))} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="contact-address">Adresse postale</Label>
                  <Textarea id="contact-address" value={contact.address} rows={2} maxLength={500}
                    placeholder="Rue, numéro, NPA, ville, pays"
                    onChange={e => setContact(c => ({ ...c, address: e.target.value }))} />
                </div>

                <div className="flex justify-end gap-2">
                  <Button type="button" variant="ghost" className="gap-2" disabled={isSaving} onClick={() => confirmReset("contact")}>
                    <RotateCcw className="h-4 w-4" /> Réinitialiser
                  </Button>
                  <Button type="button" className="gap-2" disabled={isSaving}
                    onClick={() => saveContact.mutate(contact)}>
                    <Save className="h-4 w-4" /> {saveContact.isPending ? "Enregistrement…" : "Enregistrer"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {(tab === "returns" || tab === "about") && (() => {
            const draft = tab === "returns" ? returns : about;
            const setDraft = tab === "returns" ? setReturns : setAbout;
            const mutation = tab === "returns" ? "returns" : "about";
            const bodyLabel = tab === "returns" ? "Politique de livraison et de retours" : "Votre histoire";
            const bodyPlaceholder = tab === "returns"
              ? "Délais annoncés, zones servies, conditions de retour, remboursements…"
              : "Qui vous êtes, ce que vous vendez, ce qui vous différencie…";
            return (
              <Card>
                <CardContent className="space-y-5 p-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-foreground">{TAB_LABELS[tab]}</h3>
                      <p className="text-sm text-muted-foreground">
                        Ce texte remplace entièrement la page par défaut correspondante.
                      </p>
                    </div>
                    <ComplianceBadge state={compliance?.[mutation] ?? "missing"} />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor={`${mutation}-title`}>Titre</Label>
                    <Input id={`${mutation}-title`} value={draft.title} maxLength={160}
                      placeholder={TAB_LABELS[tab]}
                      onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor={`${mutation}-body`}>{bodyLabel}</Label>
                    <Textarea id={`${mutation}-body`} value={draft.body} rows={12} maxLength={20000}
                      placeholder={bodyPlaceholder}
                      onChange={e => setDraft(d => ({ ...d, body: e.target.value }))} />
                    <p className="text-xs text-muted-foreground">
                      Les sauts de ligne sont conservés. Variables : {"{{store_name}}"}, {"{{contact_email}}"}.
                    </p>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="ghost" className="gap-2" disabled={isSaving} onClick={() => confirmReset(tab)}>
                      <RotateCcw className="h-4 w-4" /> Réinitialiser
                    </Button>
                    <Button type="button" className="gap-2" disabled={isSaving}
                      onClick={() => saveTextPage.mutate({ pageId: mutation, content: draft })}>
                      <Save className="h-4 w-4" /> {saveTextPage.isPending ? "Enregistrement…" : "Enregistrer"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })()}
        </div>

        {/* Live preview of the current tab's public rendering (draft state). */}
        {showPreview && (
          <Card className="h-fit lg:sticky lg:top-4">
            <CardContent className="space-y-4 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Aperçu public — {TAB_LABELS[tab]}
              </h3>
              <div className="rounded-lg border border-border bg-background p-5">
                {tab === "faq" && (
                  faqItems.filter(i => i.question.trim()).length > 0 ? (
                    <ul className="space-y-3">
                      {faqItems.filter(i => i.question.trim()).map(item => (
                        <li key={item.id}>
                          {item.category?.trim() && (
                            <span className="mb-1 inline-block rounded-full bg-orange-100 px-2 py-0.5 text-xs font-semibold text-orange-700">
                              {item.category.trim()}
                            </span>
                          )}
                          <p className="font-semibold text-foreground">{item.question}</p>
                          <p className="mt-1 whitespace-pre-line text-sm text-muted-foreground">{item.answer}</p>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">La FAQ par défaut de la plateforme s'affichera ici.</p>
                  )
                )}
                {tab === "contact" && (
                  <div className="space-y-2">
                    <p className="text-lg font-bold text-foreground">{contact.title || "Titre de la page contact"}</p>
                    {contact.intro && <p className="whitespace-pre-line text-sm text-muted-foreground">{contact.intro}</p>}
                    {contact.email && <p className="text-sm">✉️ {contact.email}</p>}
                    {contact.phone && <p className="text-sm">📞 {contact.phone}</p>}
                    {contact.address && <p className="whitespace-pre-line text-sm">📍 {contact.address}</p>}
                    {contact.hours && <p className="text-sm">🕒 {contact.hours}</p>}
                  </div>
                )}
                {(tab === "returns" || tab === "about") && (() => {
                  const draft = tab === "returns" ? returns : about;
                  return draft.title || draft.body ? (
                    <div className="space-y-3">
                      <p className="text-lg font-bold text-foreground">{draft.title || TAB_LABELS[tab]}</p>
                      <p className="whitespace-pre-line text-sm text-muted-foreground">{draft.body}</p>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Le texte par défaut de la plateforme s'affichera ici.</p>
                  );
                })()}
              </div>
              <p className="text-xs text-muted-foreground">
                Aperçu de votre brouillon avant enregistrement. Les variables {"{{store_name}}"} et
                {" {{contact_email}}"} seront remplacées par les informations de votre boutique sur la vitrine.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
