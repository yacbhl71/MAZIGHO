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
import { Mail, Save, RotateCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

type TemplateType = "order_confirmation" | "order_shipped" | "abandoned_cart";
type Template = { subject: string; heading: string; body: string; buttonLabel: string; enabled: boolean };

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
        <div className="mt-2 flex flex-wrap gap-1.5">{meta.variables.map(v => <button key={v} type="button" onClick={() => update("body", `${form.body}{{${v}}}`)} className="rounded bg-white px-2 py-1 font-mono hover:bg-sky-100">{`{{${v}}}`}</button>)}</div>
      </div>
      <div className="flex justify-between">
        <Button type="button" variant="outline" onClick={() => setForm(fallback)} data-testid={`email-reset-${type}`}><RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser</Button>
        <Button className="bg-orange-500 hover:bg-orange-600" disabled={save.isPending} onClick={() => save.mutate({ type, ...form })} data-testid={`email-save-${type}`}><Save className="mr-2 h-4 w-4" /> Enregistrer</Button>
      </div>
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
            <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">E-mails transactionnels</h1>
            <p className="mt-2 max-w-2xl text-slate-600">Personnalisez l'objet et le contenu des e-mails envoyés à vos clients, avec des variables dynamiques.</p>
          </div>
        </section>

        {!emailConfigured && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" data-testid="emails-warning">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Vos modèles sont enregistrés, mais l'envoi réel nécessite <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> et <code className="rounded bg-amber-100 px-1">MAZIGHO_EMAIL_FROM</code> sur Vercel.</p>
          </div>
        )}

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-5">
            <CardTitle className="text-xl text-slate-900">Modèles</CardTitle>
            <CardDescription>Choisissez un modèle à personnaliser.</CardDescription>
          </CardHeader>
          <CardContent className="p-5">
            {query.isLoading ? <Skeleton className="h-96 w-full" /> : (
              <Tabs defaultValue="order_confirmation">
                <TabsList className="mb-5">
                  {ORDER.map(type => {
                    const entry = templates.find(t => t.type === type);
                    return <TabsTrigger key={type} value={type} data-testid={`email-tab-${type}`}>{TEMPLATE_META[type].label}{entry && !entry.template.enabled ? <Badge className="ml-2 border-0 bg-slate-200 text-[10px] text-slate-600">off</Badge> : null}</TabsTrigger>;
                  })}
                </TabsList>
                {ORDER.map(type => {
                  const entry = templates.find(t => t.type === type);
                  if (!entry) return null;
                  return (
                    <TabsContent key={type} value={type}>
                      <p className="mb-4 text-sm text-muted-foreground">{TEMPLATE_META[type].description}</p>
                      <TemplateEditor type={type} initial={entry.template} fallback={entry.default} onSaved={() => query.refetch()} />
                    </TabsContent>
                  );
                })}
              </Tabs>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
