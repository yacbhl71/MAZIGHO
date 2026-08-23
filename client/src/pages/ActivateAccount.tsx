import { useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Eye, EyeOff, ShieldCheck, UserRoundCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { trpc } from "@/lib/trpc";

export default function ActivateAccount() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const token = useMemo(() => new URLSearchParams(window.location.search).get("token") || "", []);
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const acceptInvitation = trpc.auth.acceptInvitation.useMutation({
    onSuccess: async result => {
      await utils.auth.me.invalidate();
      toast.success("Votre compte MAZIGHO est activé.");
      setLocation(result.user.role === "admin" ? "/admin" : "/mon-compte");
    },
    onError: error => toast.error(error.message || "Cette invitation ne peut plus être utilisée."),
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!token) {
      toast.error("Le lien d’activation est invalide.");
      return;
    }
    if (password !== confirmation) {
      toast.error("Les deux mots de passe ne correspondent pas.");
      return;
    }
    acceptInvitation.mutate({ token, password });
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Header />
      <main className="flex-1 bg-gradient-to-r from-orange-50 to-teal-50 py-12 md:py-20">
        <div className="container mx-auto max-w-md px-4">
          <Card>
            <CardContent className="p-7 md:p-8">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                <UserRoundCheck className="h-7 w-7" />
              </div>
              <h1 className="text-center text-2xl font-semibold text-gray-800">Activez votre compte MAZIGHO</h1>
              <p className="mt-2 text-center text-sm text-gray-600">Choisissez votre mot de passe personnel pour terminer l’activation du compte.</p>

              <form className="mt-7 space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="activation-password">Mot de passe</Label>
                  <div className="relative">
                    <Input id="activation-password" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={event => setPassword(event.target.value)} minLength={8} required className="pr-11" />
                    <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-gray-500 hover:text-gray-800" aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="activation-confirmation">Confirmer le mot de passe</Label>
                  <Input id="activation-confirmation" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmation} onChange={event => setConfirmation(event.target.value)} minLength={8} required />
                </div>
                <Button type="submit" disabled={acceptInvitation.isPending || !token} className="w-full bg-orange-500 text-white hover:bg-orange-600">
                  {acceptInvitation.isPending ? "Activation…" : "Activer mon compte"}
                </Button>
              </form>
              {!token && <p className="mt-4 text-center text-sm text-destructive">Le lien est incomplet ou invalide. Demandez une nouvelle invitation à un administrateur.</p>}
            </CardContent>
          </Card>
          <div className="mt-7 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-900">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-green-700" />
            <p>Votre mot de passe est choisi par vous et transformé en hash sécurisé côté serveur. Le lien d’invitation est personnel et utilisable une seule fois.</p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
