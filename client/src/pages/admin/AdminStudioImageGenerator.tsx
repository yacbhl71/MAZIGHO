import { useState } from "react";
import { ArrowLeft, Download, ImagePlus, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { useLocation } from "wouter";
import DashboardLayout from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const SESSION_STORAGE_KEY = "mazigho-studio-image-generation-session-count";
const SESSION_LIMIT = 20;

type ImageFormat = "hero" | "story" | "square";
type ImageStyle = "editorial" | "soft" | "bold";

function readSessionCount() {
  if (typeof window === "undefined") return 0;
  const value = Number.parseInt(window.sessionStorage.getItem(SESSION_STORAGE_KEY) || "0", 10);
  return Number.isFinite(value) ? Math.max(0, Math.min(SESSION_LIMIT, value)) : 0;
}

export default function AdminStudioImageGenerator() {
  const [, setLocation] = useLocation();
  const [subject, setSubject] = useState("");
  const [format, setFormat] = useState<ImageFormat>("hero");
  const [style, setStyle] = useState<ImageStyle>("editorial");
  const [sessionCount, setSessionCount] = useState(readSessionCount);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const usage = trpc.admin.studio.assistant.getImageGenerationUsage.useQuery(undefined, { refetchOnWindowFocus: false, retry: false });
  const generate = trpc.admin.studio.assistant.generateStorefrontImage.useMutation({
    onSuccess: async result => {
      setGeneratedImage(result.url);
      setSessionCount(current => {
        const next = Math.min(SESSION_LIMIT, current + 1);
        window.sessionStorage.setItem(SESSION_STORAGE_KEY, String(next));
        return next;
      });
      await usage.refetch();
      toast.success("Visuel généré. Il n’est rattaché à aucune boutique tant que vous ne l’importez pas explicitement.");
    },
    onError: error => toast.error(error.message || "La génération a échoué."),
  });

  const canGenerate = subject.trim().length >= 12 && sessionCount < SESSION_LIMIT && !generate.isPending;
  const sessionRemaining = Math.max(0, SESSION_LIMIT - sessionCount);

  return <DashboardLayout><main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-8 md:py-8" data-testid="studio-image-generator">
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex flex-wrap items-center gap-2"><Badge className="border-0 bg-slate-950 text-white hover:bg-slate-950">MAZIGHO Studio</Badge><Badge variant="outline" className="border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900">Création visuelle contrôlée</Badge></div>
        <h1 className="mt-3 flex items-center gap-2 text-3xl font-bold tracking-tight text-slate-950"><ImagePlus className="h-7 w-7 text-fuchsia-700" /> Atelier d’images</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">Préparez un visuel original pour une future vitrine. Téléchargez-le, puis choisissez vous-même et plus tard si vous souhaitez l’importer dans une boutique.</p>
      </div>
      <Button type="button" variant="outline" className="min-h-11 w-fit" onClick={() => setLocation("/admin/studio")}><ArrowLeft className="mr-2 h-4 w-4" /> Retour à Studio</Button>
    </header>

    <Card className="border-fuchsia-200 bg-gradient-to-br from-fuchsia-50 via-white to-violet-50 shadow-sm">
      <CardHeader><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-fuchsia-950"><Sparkles className="h-5 w-5 text-fuchsia-700" /> Décrire le prochain visuel</CardTitle><CardDescription className="mt-2 max-w-3xl leading-6">Le résultat est une image de travail autonome. Aucun texte n’est rendu dans l’image ; aucune donnée de boutique, de client ou de catalogue n’est transmise.</CardDescription></div><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-violet-200 bg-white text-violet-900">Session : {sessionCount}/{SESSION_LIMIT}</Badge>{usage.data && <Badge variant="outline" className="border-slate-200 bg-white text-slate-700">Aujourd’hui : {usage.data.used}/{usage.data.limit}</Badge>}</div></div></CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2"><Label htmlFor="studio-image-subject">Sujet et ambiance</Label><Textarea id="studio-image-subject" value={subject} onChange={event => setSubject(event.target.value)} maxLength={420} rows={4} placeholder="Ex. Une table d’atelier lumineuse avec carnets, pinceaux, tissus et créations colorées, ambiance douce et artisanale." data-testid="studio-image-subject" /><p className="text-xs leading-5 text-slate-500">Décrivez le sujet, les matières, l’ambiance et les couleurs souhaitées. 12 à 420 caractères.</p></div>
        <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="studio-image-format">Format</Label><select id="studio-image-format" value={format} onChange={event => setFormat(event.target.value as ImageFormat)} className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm" data-testid="studio-image-format"><option value="hero">Hero large — bannière horizontale</option><option value="story">Histoire — carte verticale</option><option value="square">Collection — carré</option></select></div><div className="space-y-2"><Label htmlFor="studio-image-style">Direction artistique</Label><select id="studio-image-style" value={style} onChange={event => setStyle(event.target.value as ImageStyle)} className="flex h-11 w-full rounded-md border border-input bg-white px-3 text-sm" data-testid="studio-image-style"><option value="editorial">Éditoriale — raffinée et naturelle</option><option value="soft">Douce — chaleureuse et lumineuse</option><option value="bold">Affirmée — contraste contemporain</option></select></div></div>
        <div className="flex flex-col gap-3 rounded-xl border border-violet-200 bg-white/85 p-4 text-sm leading-6 text-violet-950 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" /><p><strong>Contrôle conservé.</strong> Cette action génère uniquement un fichier. Elle ne publie rien, ne modifie aucun texte, produit, domaine ou thème, et ne rattache pas le visuel à une boutique.</p></div><Button type="button" className="min-h-11 shrink-0 bg-fuchsia-700 hover:bg-fuchsia-800" disabled={!canGenerate} onClick={() => generate.mutate({ subject: subject.trim(), format, style })} data-testid="studio-image-generate">{generate.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Génération…</> : <><Sparkles className="mr-2 h-4 w-4" /> Générer</>}</Button></div>
        {!generate.isPending && sessionCount >= SESSION_LIMIT && <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">Le plafond de {SESSION_LIMIT} générations pour cette session est atteint. Vous pouvez télécharger vos résultats et reprendre une autre session plus tard.</p>}
        {!generate.isPending && sessionCount < SESSION_LIMIT && <p className="text-xs text-slate-500">{sessionRemaining} génération{sessionRemaining > 1 ? "s" : ""} restante{sessionRemaining > 1 ? "s" : ""} dans cette session.</p>}
      </CardContent>
    </Card>

    {generate.isPending && <Card className="border-fuchsia-200"><CardContent className="flex items-center gap-3 p-6 text-sm text-fuchsia-950"><Loader2 className="h-5 w-5 animate-spin" /> Le visuel est en cours de génération. Cette étape peut prendre quelques secondes.</CardContent></Card>}

    {generatedImage && <Card className="overflow-hidden border-emerald-200 bg-emerald-50/40" data-testid="studio-image-result"><CardHeader><CardTitle className="text-emerald-950">Visuel prêt à récupérer</CardTitle><CardDescription className="mt-1">Aucun rattachement n’a été effectué. Importez cette image manuellement depuis la page de contenu de la boutique lorsque vous aurez choisi sa destination.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="overflow-hidden rounded-xl border border-emerald-100 bg-white"><img src={generatedImage} alt="Visuel généré par MAZIGHO Studio" className="max-h-[680px] w-full object-contain" /></div><div className="flex flex-wrap gap-3"><Button asChild className="min-h-11 bg-emerald-700 hover:bg-emerald-800"><a href={generatedImage} target="_blank" rel="noreferrer" data-testid="studio-image-download"><Download className="mr-2 h-4 w-4" /> Ouvrir / télécharger le visuel</a></Button><Button type="button" variant="outline" className="min-h-11 border-emerald-300 text-emerald-900 hover:bg-emerald-50" onClick={() => setGeneratedImage(null)}>Préparer une autre image</Button></div></CardContent></Card>}

    <Card className="border-dashed border-slate-300"><CardContent className="p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-900">Limites de l’atelier</p><p className="mt-2">Utilisez uniquement des sujets dont vous avez le droit de créer ou d’utiliser les visuels. Évitez les logos, personnages sous licence, produits identifiables ou images de personnes réelles sans autorisation. Les actions de publication et d’import restent séparées et humaines.</p></CardContent></Card>
  </main></DashboardLayout>;
}
