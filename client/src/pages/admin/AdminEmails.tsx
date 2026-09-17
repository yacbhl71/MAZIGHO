import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, FilePenLine, ListChecks, Mail, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type TemplateType = "order_confirmation" | "order_shipped" | "abandoned_cart";
type Template = { subject: string; heading: string; body: string; buttonLabel: string; enabled: boolean };
type MarketingList = { id: number; name: string; totalBlacklisted: number; totalSubscribers: number };

const TEMPLATE_META: Record<TemplateType, { label: string; description: string; variables: string[] }> = {
  order_confirmation: { label: "Confirmation de commande", description: "Envoyé automatiquement dès qu'une commande est payée.", variables: ["prenom", "commande", "total", "lignes"] },
  order_shipped: { label: "Expédition", description: "Envoyé lorsqu'une commande passe au statut expédié.", variables: ["prenom", "commande", "suivi"] },
  abandoned_cart: { label: "Panier abandonné", description: "Envoyé manuellement depuis la page Paniers abandonnés.", variables: ["prenom", "total", "panier"] },
};

const ORDER: TemplateType[] = ["order_confirmation", "order_shipped", "abandoned_cart"];

function TemplateEditor({ type, initial, fallback, onSaved }: { type: TemplateType; initial: Template; fallback: Template; onSaved: () => void }) {
  const [form, setForm] = useState<Template>(initial);
  useEffect(() => { setForm(initial); }, [initial]);
  const meta = TEMPLATE_META[type];
  const save = trpc.admin.emailTemplates.save.useMutation({
    onSuccess: () => { toast.success("Modèle enregistré"); onSaved(); },
    onError: error => toast.error(error.message),
  });
  const update = <K extends keyof Template>(key: K, value: Template[K]) => setForm(current => ({ ...current, [key]: value }));

  return (
    <div className="space-y-4" data-testid={`email-template-${type}`}>
      <div className="flex items-center justify-between rounded-md border p-3">
        <div><Label>Modèle actif</Label><p className="text-xs text-muted-foreground">Désactivé, cet e-mail ne sera pas envoyé.</p></div>
        <Switch checked={form.enabled} onCheckedChange={value => update("enabled", value)} data-testid={`email-enabled-${type}`} />
      </div>
      <div className="space-y-2"><Label>Objet</Label><Input value={form.subject} onChange={e => update("subject", e.target.value)} data-testid={`email-subject-${type}`} /></div>
      <div className="space-y-2"><Label>Titre affiché</Label><Input value={form.heading} onChange={e => update("heading", e.target.value)} /></div>
      <div className="space-y-2"><Label>Corps du message</Label><Textarea rows={9} value={form.body} onChange={e => update("body", e.target.value)} data-testid={`email-body-${type}`} className="font-mono text-sm" /></div>
      <div className="space-y-2"><Label>Libellé du bouton</Label><Input value={form.buttonLabel} onChange={e => update("buttonLabel", e.target.value)} /></div>
      <div className="rounded-lg border border-sky-100 bg-sky-50 p-3 text-xs text-sky-900">
        <p className="font-semibold">Variables disponibles :</p>
        <div className="mt-2 flex flex-wrap gap-1.5">{meta.variables.map(variable => <button key={variable} type="button" onClick={() => update("body", `${form.body}{{${variable}}}`)} className="rounded bg-white px-2 py-1 font-mono hover:bg-sky-100">{`{{${variable}}}`}</button>)}</div>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setForm(fallback)} data-testid={`email-reset-${type}`}><RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser</Button>
        <Button className="bg-orange-500 hover:bg-orange-600" disabled={save.isPending} onClick={() => save.mutate({ type, ...form })} data-testid={`email-save-${type}`}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
      </div>
    </div>
  );
}

function MarketingDraftBuilder({ configured }: { configured: boolean }) {
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [previewText, setPreviewText] = useState("");
  const [htmlContent, setHtmlContent] = useState("<p>Bonjour,</p><p>Votre contenu marketing ici.</p>");
  const [selectedListIds, setSelectedListIds] = useState<number[]>([]);
  const [createdCampaignId, setCreatedCampaignId] = useState<number | null>(null);
  const listsQuery = trpc.admin.emailTemplates.getMarketingLists.useQuery(undefined, { enabled: configured, retry: false });
  const createDraft = trpc.admin.emailTemplates.createMarketingDraft.useMutation({
    onSuccess: result => {
      setCreatedCampaignId(result.campaignId);
      toast.success(`Brouillon Brevo #${result.campaignId} créé. Aucun e-mail n’a été envoyé.`);
    },
    onError: error => toast.error(error.message || "Création du brouillon impossible."),
  });
  const lists = (listsQuery.data?.lists || []) as MarketingList[];
  const toggleList = (id: number, checked: boolean) => setSelectedListIds(current => checked ? (current.includes(id) ? current : [...current, id]) : current.filter(value => value !== id));
  const canCreate = configured && name.trim().length >= 3 && subject.trim().length >= 3 && htmlContent.trim().length >= 11 && selectedListIds.length > 0;

  if (!configured) {
    return <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Configurez Brevo dans le déploiement avant de créer un brouillon de campagne.</div>;
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <p className="flex items-center gap-2 font-semibold"><ShieldCheck className="h-4 w-4" /> Protection commerciale</p>
        <p className="mt-1">Cette action crée uniquement un <strong>brouillon</strong> dans Brevo. Aucun e-mail, SMS ou automatisation n’est envoyé depuis MAZIGHO. Sélectionnez exclusivement des listes composées de contacts ayant consenti à recevoir des communications marketing.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2"><Label htmlFor="marketing-name">Nom interne de la campagne</Label><Input id="marketing-name" value={name} onChange={event => setName(event.target.value)} placeholder="Lancement collection automne" /></div>
        <div className="space-y-2"><Label htmlFor="marketing-subject">Objet e-mail</Label><Input id="marketing-subject" value={subject} onChange={event => setSubject(event.target.value)} placeholder="Découvrez nos nouveautés" /></div>
      </div>
      <div className="space-y-2"><Label htmlFor="marketing-preview">Aperçu boîte de réception</Label><Input id="marketing-preview" value={previewText} onChange={event => setPreviewText(event.target.value)} placeholder="Texte affiché après l’objet (facultatif)" maxLength={180} /></div>
      <div className="space-y-2"><Label htmlFor="marketing-html">Contenu HTML</Label><Textarea id="marketing-html" rows={12} value={htmlContent} onChange={event => setHtmlContent(event.target.value)} className="font-mono text-sm" /><p className="text-xs text-muted-foreground">Le contenu sera importé dans un brouillon Brevo, où vous pourrez le relire avant toute diffusion.</p></div>
      <div className="space-y-3 rounded-xl border border-slate-200 p-4">
        <div><Label className="flex items-center gap-2"><ListChecks className="h-4 w-4 text-violet-700" /> Listes de destinataires consentants</Label><p className="mt-1 text-xs text-muted-foreground">Les listes viennent de Brevo. MAZIGHO ne transfère aucun contact automatiquement à cette étape.</p></div>
        {listsQuery.isLoading ? <Skeleton className="h-20 w-full" /> : listsQuery.isError ? <p className="text-sm text-destructive">Les listes Brevo n’ont pas pu être chargées.</p> : lists.length === 0 ? <p className="text-sm text-muted-foreground">Aucune liste Brevo disponible. Créez d’abord une liste de contacts consentants dans Brevo.</p> : <div className="space-y-2">{lists.map(list => <label key={list.id} className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-100 p-3 hover:bg-slate-50"><input type="checkbox" checked={selectedListIds.includes(list.id)} onChange={event => toggleList(list.id, event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-orange-600 focus:ring-orange-500" /><span className="flex-1"><span className="font-medium text-slate-900">{list.name}</span><span className="mt-0.5 block text-xs text-muted-foreground">{list.totalSubscribers} inscrit(s) · {list.totalBlacklisted} désinscription(s)</span></span></label>)}</div>}
      </div>
      {createdCampaignId && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-950"><strong>Brouillon Brevo #{createdCampaignId} créé.</strong> Ouvrez Brevo pour contrôler le contenu, la liste, le lien de désinscription et planifier ou envoyer la campagne.</div>}
      <Button type="button" className="bg-violet-700 hover:bg-violet-800" disabled={!canCreate || createDraft.isPending} onClick={() => createDraft.mutate({ name: name.trim(), subject: subject.trim(), previewText: previewText.trim() || undefined, htmlContent: htmlContent.trim(), listIds: selectedListIds })}>{createDraft.isPending ? <FilePenLine className="mr-2 h-4 w-4 animate-pulse" /> : <FilePenLine className="mr-2 h-4 w-4" />}Créer le brouillon dans Brevo</Button>
    </div>
  );
}

export default function AdminEmails() {
  const query = trpc.admin.emailTemplates.getAll.useQuery();
  const templates = query.data?.templates ?? [];
  const emailConfigured = query.data?.emailConfigured ?? false;

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8" data-testid="admin-emails-page">
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50">
          <div className="p-6 md:p-8">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-700"><Mail className="h-4 w-4" /> Communication client</p>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">E-mails & campagnes</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Personnalisez vos messages transactionnels et préparez les campagnes commerciales dans Brevo avec un contrôle humain avant tout envoi.</p>
          </div>
        </section>

        {!emailConfigured && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" data-testid="emails-warning">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Vos modèles sont enregistrés, mais l’envoi réel nécessite <code className="rounded bg-amber-100 px-1">BREVO_API_KEY</code>, <code className="rounded bg-amber-100 px-1">BREVO_SENDER_EMAIL</code> et une adresse expéditrice vérifiée dans Brevo.</p>
          </div>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-5">
            <Tabs defaultValue="transactional">
              <TabsList className="mb-5"><TabsTrigger value="transactional">Transactionnels</TabsTrigger><TabsTrigger value="marketing">Campagnes Brevo</TabsTrigger></TabsList>
              <TabsContent value="transactional">
                <CardHeader className="mb-5 border-b border-slate-100 px-0 pt-0 pb-5"><CardTitle className="text-xl text-slate-900">Modèles transactionnels</CardTitle><CardDescription>Choisissez un modèle à personnaliser.</CardDescription></CardHeader>
                {query.isLoading ? <Skeleton className="h-96 w-full" /> : <Tabs defaultValue="order_confirmation"><TabsList className="mb-5">{ORDER.map(type => { const entry = templates.find(item => item.type === type); return <TabsTrigger key={type} value={type} data-testid={`email-tab-${type}`}>{TEMPLATE_META[type].label}{entry && !entry.template.enabled ? <Badge className="ml-2 border-0 bg-slate-200 text-[10px] text-slate-600">off</Badge> : null}</TabsTrigger>; })}</TabsList>{ORDER.map(type => { const entry = templates.find(item => item.type === type); if (!entry) return null; return <TabsContent key={type} value={type}><p className="mb-4 text-sm text-muted-foreground">{TEMPLATE_META[type].description}</p><TemplateEditor type={type} initial={entry.template} fallback={entry.default} onSaved={() => query.refetch()} /></TabsContent>; })}</Tabs>}
              </TabsContent>
              <TabsContent value="marketing">
                <CardHeader className="mb-5 border-b border-slate-100 px-0 pt-0 pb-5"><CardTitle className="text-xl text-slate-900">Campagnes commerciales</CardTitle><CardDescription>Préparez une campagne dans Brevo. Son envoi reste volontairement séparé et se fait après revue dans Brevo.</CardDescription></CardHeader>
                <MarketingDraftBuilder configured={emailConfigured} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
