import { useEffect, useState } from "react";
import { MailCheck, RotateCcw, Save, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type TransactionalTemplateType = "order_confirmation" | "order_shipped";
type TransactionalTemplate = { subject: string; heading: string; body: string; buttonLabel: string; enabled: boolean };

type TemplateEntry = { type: TransactionalTemplateType; template: TransactionalTemplate; default: TransactionalTemplate };

const templateMeta: Record<TransactionalTemplateType, { title: string; description: string; variables: string[] }> = {
  order_confirmation: {
    title: "Confirmation de commande",
    description: "Message transactionnel envoyé après un paiement Stripe Production confirmé.",
    variables: ["prenom", "boutique", "commande", "total", "lignes"],
  },
  order_shipped: {
    title: "Confirmation d’expédition",
    description: "Message transactionnel envoyé une seule fois lorsque vous marquez une commande Production comme expédiée.",
    variables: ["prenom", "boutique", "commande", "suivi"],
  },
};

function TemplateEditor({ entry, onSaved }: { entry: TemplateEntry; onSaved: () => void }) {
  const [template, setTemplate] = useState<TransactionalTemplate>(entry.template);
  const meta = templateMeta[entry.type];
  const save = trpc.owner.saveTransactionalEmailTemplate.useMutation({
    onSuccess: () => {
      toast.success("Modèle transactionnel enregistré pour cette boutique.");
      onSaved();
    },
    onError: error => toast.error(error.message || "Le modèle n’a pas pu être enregistré."),
  });

  useEffect(() => setTemplate(entry.template), [entry]);
  const update = <K extends keyof TransactionalTemplate>(key: K, value: TransactionalTemplate[K]) => setTemplate(current => ({ ...current, [key]: value }));

  return <Card className="border-teal-100 bg-white">
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg"><MailCheck className="h-5 w-5 text-teal-700" /> {meta.title}</CardTitle>
          <CardDescription className="mt-2 max-w-2xl leading-6">{meta.description}</CardDescription>
        </div>
        <Badge variant="outline" className={template.enabled ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-600"}>{template.enabled ? "Actif" : "Désactivé"}</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 p-4">
        <div><p className="font-semibold text-slate-950">Modèle actif</p><p className="mt-1 text-xs leading-5 text-slate-600">Désactivé, ce message ne partira pas, même lors d’une vente Production.</p></div>
        <Switch checked={template.enabled} onCheckedChange={value => update("enabled", value)} aria-label={`Activer ${meta.title}`} />
      </div>
      <div className="space-y-2"><Label>Objet de l’e-mail</Label><Input value={template.subject} maxLength={200} onChange={event => update("subject", event.target.value)} /></div>
      <div className="space-y-2"><Label>Titre affiché</Label><Input value={template.heading} maxLength={200} onChange={event => update("heading", event.target.value)} /></div>
      <div className="space-y-2"><Label>Corps du message</Label><Textarea rows={8} className="font-mono text-sm" value={template.body} maxLength={6000} onChange={event => update("body", event.target.value)} /><p className="text-xs text-slate-500">Les retours à la ligne sont conservés dans le message envoyé.</p></div>
      <div className="space-y-2"><Label>Libellé du bouton</Label><Input value={template.buttonLabel} maxLength={60} onChange={event => update("buttonLabel", event.target.value)} /></div>
      <div className="rounded-xl border border-sky-100 bg-sky-50 p-4 text-xs leading-5 text-sky-950">
        <p className="font-semibold">Variables disponibles</p>
        <p className="mt-1">Ajoutez-les dans l’objet ou le corps pour afficher une information de la commande, sans saisir de données client à la main.</p>
        <div className="mt-3 flex flex-wrap gap-2">{meta.variables.map(variable => <Button key={variable} type="button" size="sm" variant="outline" className="h-8 border-sky-200 bg-white font-mono text-xs text-sky-900 hover:bg-sky-100" onClick={() => update("body", `${template.body}${template.body.endsWith("\n") || !template.body ? "" : "\n"}{{${variable}}}`)}>{`{{${variable}}}`}</Button>)}</div>
      </div>
      <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="min-h-11" onClick={() => setTemplate(entry.default)}><RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser</Button>
        <Button type="button" className="min-h-11 bg-teal-700 hover:bg-teal-800" disabled={save.isPending || template.subject.trim().length < 2 || template.heading.trim().length < 2 || template.body.trim().length < 2} onClick={() => save.mutate({ type: entry.type, template })}>{save.isPending ? "Enregistrement…" : <><Save className="mr-2 h-4 w-4" /> Enregistrer</>}</Button>
      </div>
    </CardContent>
  </Card>;
}

export default function OwnerTransactionalEmails() {
  const templates = trpc.owner.getTransactionalEmailTemplates.useQuery();
  const entries = (templates.data || []) as TemplateEntry[];

  return <div className="space-y-5">
    <Card className="border-violet-200 bg-violet-50/60">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-violet-950"><ShieldCheck className="h-5 w-5 text-violet-700" /> E-mails transactionnels de votre boutique</CardTitle>
        <CardDescription className="mt-2 max-w-3xl leading-6 text-violet-900">Ces modèles appartiennent uniquement à votre boutique et à ses commandes. Ils ne créent aucune campagne, liste de contacts, automatisation commerciale ou envoi d’essai. Les messages partent seulement dans le parcours Stripe Production configuré.</CardDescription>
      </CardHeader>
    </Card>
    {templates.isLoading ? <div className="h-72 animate-pulse rounded-xl bg-slate-100" /> : entries.map(entry => <TemplateEditor key={entry.type} entry={entry} onSaved={() => templates.refetch()} />)}
  </div>;
}
