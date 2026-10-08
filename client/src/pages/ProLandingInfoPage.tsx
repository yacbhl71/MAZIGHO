import { Link } from "wouter";
import { ArrowLeft, Mail, MessageCircle, Phone, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { DEFAULT_KEY_IN_HAND_LANDING_CONTENT, DEFAULT_PRO_LANDING_CONTENT } from "@shared/keyInHandLanding";

type Surface = "pro" | "key_in_hand";
type PageKind = "contact" | "privacy" | "terms";

function Wordmark({ surface }: { surface: Surface }) {
  return <div className="flex items-center gap-2.5"><img src={APP_LOGO} alt="MAZIGHO" className="h-9 w-9 object-contain" /><div className="leading-none"><p className="font-serif text-xl font-bold tracking-[0.12em] text-slate-950">MAZIGH<span className={surface === "pro" ? "text-[#7b8a3f]" : "text-[#a6652e]"}>O</span></p><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.2em] text-slate-500">{surface === "pro" ? "Commerce indépendant" : "Boutiques clé en main"}</p></div></div>;
}

function normalizedPhone(value: string) { return value.replace(/[^\d+]/g, ""); }
function normalizedWhatsApp(value: string) { return value.replace(/\D/g, ""); }

export default function ProLandingInfoPage({ surface, kind }: { surface: Surface; kind: PageKind }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const proQuery = trpc.platformLanding.getPro.useQuery(undefined, { enabled: surface === "pro", staleTime: 60_000, refetchOnWindowFocus: false });
  const keyInHandQuery = trpc.platformLanding.getKeyInHand.useQuery(undefined, { enabled: surface === "key_in_hand", staleTime: 60_000, refetchOnWindowFocus: false });
  const content = surface === "pro" ? (proQuery.data ?? DEFAULT_PRO_LANDING_CONTENT) : (keyInHandQuery.data ?? DEFAULT_KEY_IN_HAND_LANDING_CONTENT);
  const sendMessage = trpc.contact.send.useMutation({
    onSuccess: () => { toast.success("Votre message a été envoyé."); setForm({ name: "", email: "", subject: "", message: "" }); },
    onError: error => toast.error(error.message || "Le message n’a pas pu être envoyé."),
  });
  const homeHref = surface === "pro" ? "/" : "/creation-boutique";
  const privacyHref = surface === "pro" ? "/confidentialite" : "/creation-boutique/confidentialite";
  const termsHref = surface === "pro" ? "/conditions-generales" : "/creation-boutique/conditions";
  const contactHref = surface === "pro" ? "/contact" : "/creation-boutique/contact";
  const accent = surface === "pro" ? "#5a6834" : "#8d5430";
  const isContact = kind === "contact";
  const title = kind === "privacy" ? content.privacyTitle : kind === "terms" ? content.termsTitle : content.contactTitle;
  const text = kind === "privacy" ? content.privacyText : kind === "terms" ? content.termsText : content.contactLead;
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) { toast.error("Renseignez votre nom, votre e-mail et votre message."); return; }
    sendMessage.mutate({ name: form.name.trim(), email: form.email.trim(), subject: form.subject.trim() || undefined, message: form.message.trim() });
  };

  return <div className="min-h-screen bg-[#fbfaf5] text-slate-950"><header className="border-b border-[#e9e6d9] bg-[#fbfaf5]/95 backdrop-blur"><div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6"><Link href={homeHref} aria-label="Retour à la landing"><Wordmark surface={surface} /></Link><Link href={homeHref} className="inline-flex min-h-11 items-center rounded-xl px-3 text-sm font-bold text-slate-700 hover:bg-white"><ArrowLeft className="mr-2 h-4 w-4" /> Retour</Link></div></header><main className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-16"><div className="max-w-3xl"><p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: accent }}>{isContact ? "Échange de projet" : "Informations du service"}</p><h1 className="mt-3 font-serif text-4xl font-bold tracking-[-0.035em] text-slate-950 sm:text-5xl">{title}</h1><p className="mt-5 whitespace-pre-line text-base leading-7 text-slate-600">{text}</p></div>{isContact ? <section className="mt-10 grid gap-8 lg:grid-cols-[.78fr_1.22fr]"><aside className="space-y-4"><div className="rounded-2xl border border-[#e7e4d9] bg-white p-5"><p className="text-sm font-bold text-slate-950">Contact direct</p><p className="mt-2 text-sm leading-6 text-slate-600">Choisissez le canal qui vous convient. Un formulaire est aussi disponible ci-contre.</p><div className="mt-5 space-y-3">{content.contactPhone && <a href={`tel:${normalizedPhone(content.contactPhone)}`} className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Phone className="h-4 w-4" style={{ color: accent }} /> {content.contactPhone}</a>}{content.contactEmail && <a href={`mailto:${content.contactEmail}`} className="flex items-center gap-3 break-all rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><Mail className="h-4 w-4 shrink-0" style={{ color: accent }} /> {content.contactEmail}</a>}{content.whatsappNumber && <a href={`https://wa.me/${normalizedWhatsApp(content.whatsappNumber)}`} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-xl border border-slate-200 p-3 text-sm font-semibold text-slate-800 hover:bg-slate-50"><MessageCircle className="h-4 w-4" style={{ color: accent }} /> WhatsApp</a>}{!content.contactPhone && !content.contactEmail && !content.whatsappNumber && <p className="rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">Les coordonnées directes seront ajoutées prochainement. Vous pouvez utiliser le formulaire.</p>}</div></div></aside><form onSubmit={submit} className="rounded-2xl border border-[#e7e4d9] bg-white p-5 shadow-sm sm:p-7"><div className="grid gap-5"><div className="grid gap-5 sm:grid-cols-2"><div className="grid gap-2"><Label htmlFor="pro-contact-name">Nom *</Label><Input id="pro-contact-name" value={form.name} onChange={event => setForm(current => ({ ...current, name: event.target.value }))} required /></div><div className="grid gap-2"><Label htmlFor="pro-contact-email">E-mail *</Label><Input id="pro-contact-email" type="email" value={form.email} onChange={event => setForm(current => ({ ...current, email: event.target.value }))} required /></div></div><div className="grid gap-2"><Label htmlFor="pro-contact-subject">Objet</Label><Input id="pro-contact-subject" value={form.subject} onChange={event => setForm(current => ({ ...current, subject: event.target.value }))} placeholder="Ex. Boutique de vêtements en Suisse" /></div><div className="grid gap-2"><Label htmlFor="pro-contact-message">Votre projet *</Label><Textarea id="pro-contact-message" rows={7} value={form.message} onChange={event => setForm(current => ({ ...current, message: event.target.value }))} required placeholder="Présentez votre activité, votre pays de vente et votre besoin." /></div><Button type="submit" className="min-h-11 text-white" style={{ backgroundColor: accent }} disabled={sendMessage.isPending}>{sendMessage.isPending ? "Envoi…" : <><Send className="mr-2 h-4 w-4" /> Envoyer mon message</>}</Button></div></form></section> : <section className="mt-10 max-w-3xl rounded-2xl border border-[#e7e4d9] bg-white p-6 text-sm leading-7 text-slate-700 shadow-sm sm:p-8"><div className="whitespace-pre-line">{text}</div></section>}</main><footer className="border-t border-[#e9e6d9] bg-white"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-7 text-xs font-semibold text-slate-500 sm:px-6"><Wordmark surface={surface} /><div className="flex flex-wrap gap-x-5 gap-y-2"><Link href={homeHref}>Accueil</Link><Link href={contactHref}>Contact</Link><Link href={privacyHref}>Confidentialité</Link><Link href={termsHref}>Conditions</Link></div></div></footer></div>;
}

export const ProContactPage = () => <ProLandingInfoPage surface="pro" kind="contact" />;
export const ProPrivacyPage = () => <ProLandingInfoPage surface="pro" kind="privacy" />;
export const ProTermsPage = () => <ProLandingInfoPage surface="pro" kind="terms" />;
export const KeyInHandContactPage = () => <ProLandingInfoPage surface="key_in_hand" kind="contact" />;
export const KeyInHandPrivacyPage = () => <ProLandingInfoPage surface="key_in_hand" kind="privacy" />;
export const KeyInHandTermsPage = () => <ProLandingInfoPage surface="key_in_hand" kind="terms" />;
