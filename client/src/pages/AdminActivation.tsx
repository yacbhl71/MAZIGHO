import { useState } from "react";
import { Link, useLocation } from "wouter";
import { KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";

export default function AdminActivation() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const { user, loading } = useAuth();
  const [code, setCode] = useState("");

  const activate = trpc.auth.claimInitialAdmin.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Accès administrateur activé.");
      setLocation("/admin");
    },
    onError: error => toast.error(error.message || "Activation impossible."),
  });

  if (loading) return <div className="min-h-screen bg-white" />;

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardContent className="p-7 md:p-8 text-center">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <KeyRound className="h-7 w-7" />
              </div>
              <h1 className="text-2xl font-semibold text-gray-800">Activation administrateur</h1>
              {!user ? (
                <>
                  <p className="mt-3 text-sm text-gray-600">Connectez-vous d’abord à votre compte MAZIGHO pour poursuivre.</p>
                  <Button className="mt-6 w-full bg-orange-500 hover:bg-orange-600" onClick={() => setLocation("/login")}>Se connecter</Button>
                </>
              ) : user.role === "admin" ? (
                <>
                  <p className="mt-3 text-sm text-gray-600">Ce compte dispose déjà des droits administrateur.</p>
                  <Button className="mt-6 w-full bg-orange-500 hover:bg-orange-600" onClick={() => setLocation("/admin")}>Ouvrir l’administration</Button>
                </>
              ) : (
                <form
                  className="mt-6 space-y-5 text-left"
                  onSubmit={event => {
                    event.preventDefault();
                    activate.mutate({ code: code.trim() });
                  }}
                >
                  <p className="text-sm text-gray-600 text-center">Saisissez le code d’activation unique communiqué par le propriétaire du site.</p>
                  <div className="space-y-2">
                    <Label htmlFor="admin-activation-code">Code d’activation</Label>
                    <Input id="admin-activation-code" value={code} onChange={event => setCode(event.target.value)} autoComplete="off" inputMode="text" minLength={48} maxLength={48} required />
                  </div>
                  <Button type="submit" disabled={activate.isPending} className="w-full bg-orange-500 hover:bg-orange-600">
                    {activate.isPending ? "Activation…" : "Activer mon accès"}
                  </Button>
                </form>
              )}
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                <p className="text-xs text-green-900">Le code est contrôlé côté serveur, ne donne aucun rôle au navigateur et devient inutilisable après son premier emploi.</p>
              </div>
              <Link href="/mon-compte" className="mt-5 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">Retour à mon compte</Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
