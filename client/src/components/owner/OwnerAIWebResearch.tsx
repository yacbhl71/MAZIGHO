import { useState } from "react";
import { ExternalLink, Globe2, Loader2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type WebResult = { answer: string; citation: { title: string; url: string }; historySaved: boolean };

export default function OwnerAIWebResearch() {
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("Résume cette source et relève les informations utiles pour ma boutique.");
  const [result, setResult] = useState<WebResult | null>(null);
  const research = trpc.owner.assistant.webResearch.analyzeUrl.useMutation({
    onSuccess: response => {
      setResult(response);
      toast.success(response.historySaved ? "Analyse terminée et archivée dans le Workspace." : "Analyse terminée. Le Workspace est plein : l’historique n’a pas été enregistré.");
    },
    onError: error => toast.error(error.message || "La source web n’a pas pu être analysée."),
  });

  return <Card className="border-cyan-200 bg-cyan-50/40"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-cyan-950"><Globe2 className="h-5 w-5 text-cyan-700" /> Recherche web sourcée</CardTitle><CardDescription className="mt-2 max-w-3xl leading-6">Collez une page HTTPS publique à étudier. La consultation n’est lancée qu’après votre clic ; aucune recherche silencieuse, aucun contact externe et aucune modification de boutique.</CardDescription></div><Badge variant="outline" className="border-cyan-200 bg-white text-cyan-900"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Action explicite</Badge></div></CardHeader><CardContent className="space-y-3"><Input value={url} onChange={event => setUrl(event.target.value)} inputMode="url" placeholder="https://exemple.com/article" /><Textarea value={instruction} onChange={event => setInstruction(event.target.value)} rows={3} maxLength={1200} placeholder="Quelle question voulez-vous poser à cette source ?" /><div className="flex flex-wrap items-center gap-3"><Button type="button" className="min-h-11 bg-cyan-700 hover:bg-cyan-800" disabled={!/^https:\/\//i.test(url.trim()) || instruction.trim().length < 3 || research.isPending} onClick={() => { setResult(null); research.mutate({ url: url.trim(), instruction: instruction.trim() }); }}>{research.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse…</> : <><Globe2 className="mr-2 h-4 w-4" /> Analyser cette source</>}</Button><span className="text-xs text-cyan-950">Les analyses comptent dans le quota IA mensuel.</span></div>{result && <div className="rounded-xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-900"><p className="font-semibold text-cyan-950">Synthèse avec source</p><p className="mt-2 whitespace-pre-wrap">{result.answer}</p><a href={result.citation.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 font-semibold text-cyan-800 underline underline-offset-4"><ExternalLink className="h-4 w-4" /> {result.citation.title}</a><p className="mt-2 text-xs text-slate-500">{result.historySaved ? "Copie archivée dans MAZIGHO Workspace : vous pouvez l’ouvrir, l’exporter ou la supprimer." : "Copie non archivée : libérez une place dans le Workspace pour conserver la prochaine recherche."}</p></div>}</CardContent></Card>;
}
