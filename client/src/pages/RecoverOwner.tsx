import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function RecoverOwner() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [code, setCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const recover = trpc.auth.repairOwnerV3.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Votre compte propriétaire est sécurisé et activé.");
      setLocation("/admin");
    },
    onError: error => toast.error(error.message || "Récupération impossible."),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (password !== confirmation) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    recover.mutate({ email, password, code: code.trim() });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 py-14 md:py-20">
        <div className="container mx-auto px-4 max-w-md">
          <Card>
            <CardContent className="p-7 md:p-8">
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <KeyRound className="h-7 w-7" />
              </div>
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-orange-600">Reprise sécurisée · version 3</p>
              <h1 className="mt-2 text-2xl font-semibold text-gray-800 text-center">Sécuriser mon compte existant</h1>
              <p className="mt-2 text-center text-sm text-gray-600">Utilisez cette page uniquement si votre adresse e-mail existait déjà avant la mise à jour de sécurité.</p>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="recover-email">Adresse e-mail du compte existant</Label>
                  <Input id="recover-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recover-password">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Input id="recover-password" type={showPassword ? "text" : "password"} value={password} onChange={event => setPassword(event.target.value)} autoComplete="new-password" minLength={10} required className="pr-11" />
                    <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recover-confirmation">Confirmer le mot de passe</Label>
                  <Input id="recover-confirmation" type={showPassword ? "text" : "password"} value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="new-password" minLength={10} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="recover-code">Code unique de récupération</Label>
                  <Input id="recover-code" value={code} onChange={event => setCode(event.target.value)} autoComplete="off" minLength={48} maxLength={48} required />
                </div>
                <Button type="submit" disabled={recover.isPending} className="w-full bg-orange-500 hover:bg-orange-600">{recover.isPending ? "Sécurisation…" : "Sécuriser et ouvrir l’administration"}</Button>
              </form>

              <div className="mt-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-left">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
                <p className="text-xs text-green-900">Le code est contrôlé par le serveur et devient inutilisable après une récupération réussie. Votre mot de passe est stocké uniquement sous forme de hash sécurisé.</p>
              </div>
              <Link href="/login" className="mt-5 inline-block text-sm font-medium text-orange-600 hover:text-orange-700">Retour à la connexion</Link>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
