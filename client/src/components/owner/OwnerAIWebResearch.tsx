import { useState } from "react";
import { ExternalLink, Globe2, Loader2, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type WebResult = { answer: string; citation: { title: string; url: string } | null; historySaved: boolean };

export default function OwnerAIWebResearch() {
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("Résume cette source et relève les informations utiles pour ma boutique.");
  const [manualMode, setManualMode] = useState(false);
  const [sourceText, setSourceText] = useState("");
  const [result, setResult] = useState<WebResult | null>(null);
  const [error, setError] = useState("");
  const onSuccess = (response: WebResult) => { setError(""); setResult(response); };
  const onError = (reason: { message?: string }) => {
    setResult(null);
    setError(reason.message || "L’analyse a échoué. Vérifiez la source et réessayez.");
  };
  const analyzeUrl = trpc.owner.assistant.webResearch.analyzeUrl.useMutation({ onSuccess, onError });
  const analyzeText = trpc.owner.assistant.webResearch.analyzeText.useMutation({ onSuccess, onError });
  const pending = analyzeUrl.isPending || analyzeText.isPending;
  const run = () => {
    setError("");
    setResult(null);
    if (manualMode) analyzeText.mutate({ sourceText: sourceText.trim(), instruction: instruction.trim() });
    else analyzeUrl.mutate({ url: url.trim(), instruction: instruction.trim() });
  };

  return <Card className="border-cyan-200 bg-cyan-50/40">
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-cyan-950"><Globe2 className="h-5 w-5 text-cyan-700" /> Recherche web sourcée</CardTitle>
          <CardDescription className="mt-2 max-w-3xl leading-6">Collez une page HTTPS publique à étudier. La consultation n’est lancée qu’après votre clic ; aucune recherche silencieuse, aucun contact externe et aucune modification de boutique.</CardDescription>
        </div>
        <Badge variant="outline" className="border-cyan-200 bg-white text-cyan-900"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Action explicite</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir la source à analyser">
        <Button type="button" size="sm" variant={!manualMode ? "default" : "outline"} className="min-h-10" disabled={pending} onClick={() => { setManualMode(false); setError(""); setResult(null); }}>Lien web</Button>
        <Button type="button" size="sm" variant={manualMode ? "default" : "outline"} className="min-h-10" disabled={pending} onClick={() => { setManualMode(true); setError(""); setResult(null); }}>Coller le texte de la page</Button>
      </div>
      {!manualMode ? <Input aria-label="Adresse HTTPS de la page" value={url} onChange={event => setUrl(event.target.value)} inputMode="url" placeholder="https://exemple.com/article" /> : <>
        <p className="text-sm leading-6 text-cyan-950">Si un magasin bloque l’accès automatique ou si le lien est introuvable, copiez depuis votre navigateur le nom du produit, sa description et le prix affiché. <strong>Le texte collé ne sera pas présenté comme une page vérifiée.</strong></p>
        <Textarea aria-label="Texte de la page à analyser" value={sourceText} onChange={event => setSourceText(event.target.value)} rows={6} maxLength={12_000} placeholder="Nom du produit, description, prix et devise visibles…" />
        <p className="text-xs text-cyan-900">{sourceText.trim().length}/12 000 caractères (minimum 30). N’ajoutez pas de coordonnées ou données personnelles.</p>
      </>}
      <Textarea aria-label="Votre question" value={instruction} onChange={event => setInstruction(event.target.value)} rows={3} maxLength={1200} placeholder="Quelle question voulez-vous poser à cette source ?" />
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" className="min-h-11 bg-cyan-700 hover:bg-cyan-800" disabled={(manualMode ? sourceText.trim().length < 30 : !/^https:\/\//i.test(url.trim())) || instruction.trim().length < 3 || pending} onClick={run}>
          {pending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse en cours…</> : <><Globe2 className="mr-2 h-4 w-4" /> {manualMode ? "Analyser le texte" : "Analyser cette source"}</>}
        </Button>
        <span className="text-xs text-cyan-950">Une requête IA est comptée seulement si une source exploitable a été obtenue.</span>
      </div>
      {pending && <p role="status" className="rounded-xl border border-cyan-200 bg-white p-4 text-sm text-cyan-950">Lecture de la source et préparation d’un brouillon…</p>}
      {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm leading-6 text-rose-950"><strong>Analyse impossible :</strong> {error}<p className="mt-2">Aucun prix ne sera inventé. Vous pouvez vérifier l’adresse ou utiliser « Coller le texte de la page » ci-dessus.</p></div>}
      {result && <div role="status" className="rounded-xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-900">
        <p className="font-semibold text-cyan-950">{result.citation ? "Synthèse avec source" : "Synthèse du texte fourni"}</p>
        <p className="mt-2 whitespace-pre-wrap">{result.answer}</p>
        {result.citation ? <a href={result.citation.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 font-semibold text-cyan-800 underline underline-offset-4"><ExternalLink className="h-4 w-4" /> {result.citation.title}</a> : <p className="mt-3 font-medium text-amber-900">Texte fourni par vous ; la page web n’a pas été consultée.</p>}
        <p className="mt-2 text-xs text-slate-500">{result.historySaved ? "Copie archivée dans MAZIGHO Workspace : vous pouvez l’ouvrir, l’exporter ou la supprimer." : "Copie non archivée : libérez une place dans le Workspace pour conserver la prochaine analyse."}</p>
      </div>}
    </CardContent>
  </Card>;
}
