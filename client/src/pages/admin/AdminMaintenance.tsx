import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Construction, ExternalLink, Loader2 } from "lucide-react";

export default function AdminMaintenance() {
  const utils = trpc.useUtils();
  const statusQuery = trpc.admin.system.getMaintenance.useQuery();
  const [enabled, setEnabled] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (statusQuery.data) {
      setEnabled(statusQuery.data.enabled);
      setTitle(statusQuery.data.title);
      setMessage(statusQuery.data.message);
    }
  }, [statusQuery.data]);

  const save = trpc.admin.system.setMaintenance.useMutation({
    onSuccess: () => {
      toast.success("Mode maintenance mis à jour");
      utils.admin.system.getMaintenance.invalidate();
      utils.content.getMaintenance.invalidate();
    },
    onError: () => toast.error("Impossible d'enregistrer le mode maintenance"),
  });

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6" data-testid="admin-maintenance">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
            <Construction className="h-6 w-6 text-orange-500" /> Mode Maintenance
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quand il est activé, les visiteurs voient une page « Revenez bientôt ». Vous (et l'équipe connectée) continuez à voir le site normalement.
          </p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Activation</CardTitle>
            <CardDescription>Basculez le site en maintenance en un clic.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className={`flex items-center justify-between rounded-lg border px-4 py-3 ${enabled ? "border-red-200 bg-red-50" : "border-emerald-200 bg-emerald-50"}`}>
              <div className="flex items-center gap-3">
                <span className={`h-2.5 w-2.5 rounded-full ${enabled ? "bg-red-500" : "bg-emerald-500"}`} />
                <Label htmlFor="maintenance-toggle" className="cursor-pointer font-semibold">
                  {enabled ? "Maintenance ACTIVÉE — les visiteurs voient la page d'attente" : "Site EN LIGNE — accessible à tous"}
                </Label>
              </div>
              <Switch id="maintenance-toggle" checked={enabled} onCheckedChange={setEnabled} data-testid="maintenance-toggle" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenance-title">Titre de la page</Label>
              <Input id="maintenance-title" value={title} onChange={e => setTitle(e.target.value)} maxLength={160} placeholder="Revenez bientôt" data-testid="maintenance-title" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maintenance-message">Message affiché aux visiteurs</Label>
              <Textarea id="maintenance-message" value={message} onChange={e => setMessage(e.target.value)} maxLength={2000} rows={4} placeholder="Notre boutique est en cours de mise à jour…" data-testid="maintenance-message" />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <a href="/?preview_maintenance=1" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-medium text-orange-600 hover:text-orange-700">
                Aperçu de la page <ExternalLink className="h-4 w-4" />
              </a>
              <Button
                onClick={() => save.mutate({ enabled, title: title.trim(), message: message.trim() })}
                disabled={save.isPending}
                className="bg-orange-500 hover:bg-orange-600 text-white"
                data-testid="maintenance-save-btn"
              >
                {save.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Astuce : la page de connexion (<span className="font-mono">/login</span>) et l'espace d'administration restent toujours accessibles, même en maintenance.
        </p>
      </div>
    </DashboardLayout>
  );
}
