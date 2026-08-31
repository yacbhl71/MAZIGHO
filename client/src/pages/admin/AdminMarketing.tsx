import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ShoppingCart, Mail, RefreshCw, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

function money(cents: number) {
  return `${(Number(cents || 0) / 100).toFixed(2)} CHF`;
}

function timeAgo(value: Date | string | null) {
  if (!value) return "—";
  const diffMs = Date.now() - new Date(value).getTime();
  const hours = Math.floor(diffMs / 3_600_000);
  if (hours < 1) return "il y a moins d'1 h";
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days} j`;
}

export default function AdminMarketing() {
  const [hours, setHours] = useState("4");
  const query = trpc.admin.marketing.abandonedCarts.useQuery({ olderThanHours: Number(hours) });
  const sendReminder = trpc.admin.marketing.sendCartReminder.useMutation({
    onSuccess: async () => { toast.success("Relance envoyée"); await query.refetch(); },
    onError: error => toast.error(error.message),
  });

  const carts = query.data?.carts ?? [];
  const emailConfigured = query.data?.emailConfigured ?? false;
  const totalValue = carts.reduce((sum, cart) => sum + cart.total, 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8" data-testid="admin-marketing-page">
        <section className="overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-r from-orange-50 via-white to-amber-50">
          <div className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
            <div>
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-orange-700"><ShoppingCart className="h-4 w-4" /> Récupération des ventes</p>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Paniers abandonnés</h1>
              <p className="mt-2 max-w-2xl text-slate-600">Repérez les paniers laissés en plan et envoyez une relance e-mail personnalisée en un clic.</p>
            </div>
            <Button onClick={() => query.refetch()} disabled={query.isFetching} variant="outline" className="border-orange-200 bg-white text-orange-700 hover:bg-orange-100" data-testid="marketing-refresh">
              <RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} /> Actualiser
            </Button>
          </div>
        </section>

        {!emailConfigured && (
          <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" data-testid="marketing-email-warning">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <p>Le service e-mail n'est pas encore configuré. Ajoutez <code className="rounded bg-amber-100 px-1">RESEND_API_KEY</code> et <code className="rounded bg-amber-100 px-1">MAZIGHO_EMAIL_FROM</code> sur Vercel pour activer l'envoi des relances.</p>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Paniers concernés</p><p className="mt-1 text-2xl font-bold text-orange-700">{carts.length}</p></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Valeur potentielle</p><p className="mt-1 text-2xl font-bold text-emerald-700">{money(totalValue)}</p></div>
          <div className="rounded-xl border bg-white p-4 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Seuil d'inactivité</p><div className="mt-1"><Select value={hours} onValueChange={setHours}><SelectTrigger className="h-9" data-testid="marketing-hours-select"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">+ 1 heure</SelectItem><SelectItem value="4">+ 4 heures</SelectItem><SelectItem value="24">+ 24 heures</SelectItem><SelectItem value="72">+ 3 jours</SelectItem><SelectItem value="168">+ 7 jours</SelectItem></SelectContent></Select></div></div>
        </section>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 pb-5">
            <CardTitle className="flex items-center gap-2 text-xl text-slate-900"><Clock className="h-5 w-5 text-orange-600" /> Paniers inactifs</CardTitle>
            <CardDescription>Paniers non convertis depuis le seuil choisi.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {query.isLoading ? (
              <div className="space-y-3 p-5">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}</div>
            ) : carts.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center px-6 text-center" data-testid="marketing-empty">
                <div className="rounded-full bg-emerald-50 p-4 text-emerald-600"><CheckCircle2 className="h-7 w-7" /></div>
                <p className="mt-4 font-semibold text-slate-800">Aucun panier abandonné</p>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">Tous les paniers récents ont été convertis ou sont encore actifs.</p>
              </div>
            ) : (
              <div className="divide-y divide-border/70">
                {carts.map(cart => (
                  <div key={cart.cartId} className="flex flex-wrap items-center gap-4 px-5 py-4" data-testid={`abandoned-cart-${cart.cartId}`}>
                    <div className="min-w-48 flex-1">
                      <p className="font-semibold text-slate-900">{cart.userName || cart.userEmail || "Client MAZIGHO"}</p>
                      <p className="text-xs text-muted-foreground">{cart.userEmail || "e-mail manquant"} · {cart.itemCount} article(s) · inactif {timeAgo(cart.updatedAt)}</p>
                      <p className="mt-1 truncate text-xs text-slate-500">{cart.items.map(item => `${item.name || "Article"} ×${item.quantity}`).join(", ")}</p>
                    </div>
                    <p className="font-semibold text-emerald-700">{money(cart.total)}</p>
                    {cart.reminderSentAt ? <Badge className="border-0 bg-slate-100 text-slate-600">Relancé {timeAgo(cart.reminderSentAt)}</Badge> : <Badge className="border-0 bg-amber-100 text-amber-800">Jamais relancé</Badge>}
                    <Button size="sm" className="bg-orange-500 hover:bg-orange-600" disabled={!cart.userEmail || (sendReminder.isPending && sendReminder.variables?.cartId === cart.cartId)} onClick={() => sendReminder.mutate({ cartId: cart.cartId })} data-testid={`send-reminder-${cart.cartId}`}>
                      <Mail className="mr-2 h-4 w-4" /> Relancer
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
