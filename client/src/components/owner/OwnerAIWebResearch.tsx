import { useState } from "react";
import { ExternalLink, Globe2, Loader2, Search, ShieldCheck } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Streamdown } from "streamdown";

type WebResult = { answer: string; citation: { title: string; url: string } | null; historySaved: boolean };
type SearchResult = { title: string; url: string; excerpt: string };
type SourceMode = "search" | "url" | "text";

function hostnameFromUrl(value: string) {
  try { return new URL(value).hostname.replace(/^www\./, ""); } catch { return value; }
}

export default function OwnerAIWebResearch() {
  const [sourceMode, setSourceMode] = useState<SourceMode>("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [url, setUrl] = useState("");
  const [instruction, setInstruction] = useState("Résume cette source et relève les informations utiles pour ma boutique.");
  const [sourceText, setSourceText] = useState("");
  const [result, setResult] = useState<WebResult | null>(null);
  const [error, setError] = useState("");
  const onSuccess = (response: WebResult) => { setError(""); setResult(response); };
  const onError = (reason: { message?: string }) => {
    setResult(null);
    setError(reason.message || "L’analyse a échoué. Vérifiez la source et réessayez.");
  };
  const search = trpc.owner.assistant.webResearch.search.useMutation({
    onSuccess: response => {
      setError("");
      setResult(null);
      setHasSearched(true);
      setSearchResults(response.results);
    },
    onError: onError,
  });
  const analyzeUrl = trpc.owner.assistant.webResearch.analyzeUrl.useMutation({ onSuccess, onError });
  const analyzeText = trpc.owner.assistant.webResearch.analyzeText.useMutation({ onSuccess, onError });
  const pending = search.isPending || analyzeUrl.isPending || analyzeText.isPending;
  const selectMode = (mode: SourceMode) => {
    setSourceMode(mode);
    setError("");
    setResult(null);
  };
  const runSearch = () => {
    setError("");
    setResult(null);
    setHasSearched(false);
    setSearchResults([]);
    search.mutate({ query: searchQuery.trim() });
  };
  const runAnalysis = () => {
    setError("");
    setResult(null);
    if (sourceMode === "text") analyzeText.mutate({ sourceText: sourceText.trim(), instruction: instruction.trim() });
    else analyzeUrl.mutate({ url: url.trim(), instruction: instruction.trim() });
  };
  const selectResult = (selected: SearchResult) => {
    setUrl(selected.url);
    setSourceMode("url");
    setResult(null);
    setError("");
  };

  return <Card className="border-cyan-200 bg-cyan-50/40">
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-cyan-950"><Globe2 className="h-5 w-5 text-cyan-700" /> Recherche web sourcée</CardTitle>
          <CardDescription className="mt-2 max-w-3xl leading-6">Cherchez une source publique par mots-clés, puis choisissez la page que l’assistant doit lire. Chaque étape reste explicite : aucune navigation silencieuse, aucun contact externe et aucune modification de boutique.</CardDescription>
        </div>
        <Badge variant="outline" className="border-cyan-200 bg-white text-cyan-900"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Action explicite</Badge>
      </div>
    </CardHeader>
    <CardContent className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Choisir la source à analyser">
        <Button type="button" size="sm" variant={sourceMode === "search" ? "default" : "outline"} className="min-h-10" disabled={pending} onClick={() => selectMode("search")}><Search className="mr-1.5 h-3.5 w-3.5" /> Chercher sur le web</Button>
        <Button type="button" size="sm" variant={sourceMode === "url" ? "default" : "outline"} className="min-h-10" disabled={pending} onClick={() => selectMode("url")}>Lien web</Button>
        <Button type="button" size="sm" variant={sourceMode === "text" ? "default" : "outline"} className="min-h-10" disabled={pending} onClick={() => selectMode("text")}>Coller le texte de la page</Button>
      </div>

      {sourceMode === "search" && <div className="space-y-3 rounded-xl border border-cyan-200 bg-white/80 p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="space-y-2"><label htmlFor="owner-web-search" className="text-sm font-semibold text-cyan-950">Rechercher une source publique</label><Input id="owner-web-search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)} maxLength={160} placeholder="Ex. fournisseur de thé en Algérie" /></div>
          <Button type="button" className="min-h-11 bg-cyan-700 hover:bg-cyan-800" disabled={searchQuery.trim().length < 2 || pending} onClick={runSearch}>{search.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Recherche…</> : <><Search className="mr-2 h-4 w-4" /> Chercher</>}</Button>
        </div>
        <p className="text-xs leading-5 text-cyan-900">La recherche utilise un index public pour proposer des liens. L’assistant ne lit aucune page tant que vous n’en avez pas choisi une ci-dessous.</p>
        {hasSearched && !searchResults.length && !search.isPending && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">Aucune source publique exploitable n’a été trouvée. Essayez des mots-clés plus précis ou analysez directement une URL HTTPS.</p>}
        {searchResults.length > 0 && <div className="space-y-2"><p className="text-sm font-semibold text-cyan-950">Choisissez une source à étudier</p>{searchResults.map((source, index) => <div key={`${source.url}-${index}`} className="rounded-lg border border-cyan-100 bg-white p-3"><div className="flex flex-wrap items-start justify-between gap-2"><button type="button" onClick={() => selectResult(source)} className="min-h-9 text-left text-sm font-semibold text-cyan-900 underline decoration-cyan-300 underline-offset-4 hover:text-cyan-700">{source.title}</button><a href={source.url} target="_blank" rel="noreferrer" className="inline-flex min-h-9 items-center gap-1 text-xs font-medium text-cyan-800 hover:underline"><ExternalLink className="h-3.5 w-3.5" /> Ouvrir</a></div><p className="mt-1 text-xs font-medium text-slate-500">{hostnameFromUrl(source.url)}</p>{source.excerpt && <p className="mt-2 text-sm leading-5 text-slate-700">{source.excerpt}</p>}</div>)}</div>}
      </div>}

      {sourceMode === "url" && <div className="space-y-2"><label htmlFor="owner-web-url" className="text-sm font-semibold text-cyan-950">Adresse HTTPS de la page choisie</label><Input id="owner-web-url" value={url} onChange={event => setUrl(event.target.value)} inputMode="url" placeholder="https://exemple.com/article" /><p className="text-xs text-cyan-900">Cette page est consultée uniquement après votre clic sur « Analyser cette source ».</p></div>}
      {sourceMode === "text" && <><p className="text-sm leading-6 text-cyan-950">Si un magasin bloque l’accès automatique ou si le lien est introuvable, copiez depuis votre navigateur le nom du produit, sa description et le prix affiché. <strong>Le texte collé ne sera pas présenté comme une page vérifiée.</strong></p><Textarea aria-label="Texte de la page à analyser" value={sourceText} onChange={event => setSourceText(event.target.value)} rows={6} maxLength={12_000} placeholder="Nom du produit, description, prix et devise visibles…" /><p className="text-xs text-cyan-900">{sourceText.trim().length}/12 000 caractères (minimum 30). N’ajoutez pas de coordonnées ou données personnelles.</p></>}

      {sourceMode !== "search" && <><Textarea aria-label="Votre question" value={instruction} onChange={event => setInstruction(event.target.value)} rows={3} maxLength={1200} placeholder="Quelle question voulez-vous poser à cette source ?" /><div className="flex flex-wrap items-center gap-3"><Button type="button" className="min-h-11 bg-cyan-700 hover:bg-cyan-800" disabled={(sourceMode === "text" ? sourceText.trim().length < 30 : !/^https:\/\//i.test(url.trim())) || instruction.trim().length < 3 || pending} onClick={runAnalysis}>{(analyzeUrl.isPending || analyzeText.isPending) ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Analyse en cours…</> : <><Globe2 className="mr-2 h-4 w-4" /> {sourceMode === "text" ? "Analyser le texte" : "Analyser cette source"}</>}</Button><span className="text-xs text-cyan-950">Une requête IA est comptée seulement si une source exploitable a été obtenue.</span></div></>}
      {(analyzeUrl.isPending || analyzeText.isPending) && <p role="status" className="rounded-xl border border-cyan-200 bg-white p-4 text-sm text-cyan-950">Lecture de la source et préparation d’un brouillon…</p>}
      {error && <div role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm leading-6 text-rose-950"><strong>Recherche ou analyse impossible :</strong> {error}<p className="mt-2">Aucun prix ne sera inventé. Vous pouvez vérifier l’adresse ou utiliser « Coller le texte de la page ».</p></div>}
      {result && <div role="status" className="rounded-xl border border-cyan-200 bg-white p-4 text-sm leading-6 text-slate-900"><p className="font-semibold text-cyan-950">{result.citation ? "Synthèse avec source" : "Synthèse du texte fourni"}</p><div className="mt-2 [&_h1]:text-lg [&_h1]:font-bold [&_h2]:mt-4 [&_h2]:font-semibold [&_li]:my-1 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5"><Streamdown>{result.answer}</Streamdown></div>{result.citation ? <a href={result.citation.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-2 font-semibold text-cyan-800 underline underline-offset-4"><ExternalLink className="h-4 w-4" /> {result.citation.title}</a> : <p className="mt-3 font-medium text-amber-900">Texte fourni par vous ; la page web n’a pas été consultée.</p>}<p className="mt-2 text-xs text-slate-500">{result.historySaved ? "Copie archivée dans MAZIGHO Workspace : vous pouvez l’ouvrir, l’exporter ou la supprimer." : "Copie non archivée : libérez une place dans le Workspace pour conserver la prochaine analyse."}</p></div>}
    </CardContent>
  </Card>;
}
