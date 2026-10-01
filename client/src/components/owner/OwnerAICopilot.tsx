import { ChangeEvent, useState } from "react";
import { FileText, ImagePlus, Link2, NotebookPen, RotateCcw, Sparkles, ShieldCheck, Trash2, Upload } from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type OwnerAICopilotProps = { storeName: string };

const initialMessages: Message[] = [{ role: "system", content: "Vous êtes le copilote de la boutique courante." }];
const documentMimeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture impossible"));
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

function documentMime(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "";
  return documentMimeByExtension[extension] || file.type;
}

function sourceIcon(kind: "url" | "document" | "note") {
  if (kind === "url") return <Link2 className="h-4 w-4 text-sky-700" />;
  if (kind === "document") return <FileText className="h-4 w-4 text-amber-700" />;
  return <NotebookPen className="h-4 w-4 text-violet-700" />;
}

function sourceKindLabel(kind: "url" | "document" | "note") {
  return kind === "url" ? "Page web" : kind === "document" ? "Document" : "Note";
}

export default function OwnerAICopilot({ storeName }: OwnerAICopilotProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [imageUrl, setImageUrl] = useState("");
  const [imageInstruction, setImageInstruction] = useState("Analyse ce visuel et prépare un brouillon de fiche produit.");
  const [imageAnswer, setImageAnswer] = useState("");
  const [imageError, setImageError] = useState("");
  const [knowledgeUrl, setKnowledgeUrl] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [noteContent, setNoteContent] = useState("");
  const sourcesQuery = trpc.owner.assistant.getKnowledgeSources.useQuery();
  const savedDraftsQuery = trpc.owner.assistant.getSavedDrafts.useQuery();
  const chat = trpc.owner.assistant.chat.useMutation({
    onSuccess: response => setMessages(current => [...current, { role: "assistant", content: response.answer }]),
    onError: error => toast.error(error.message || "Le copilote IA est momentanément indisponible."),
  });
  const uploadImage = trpc.owner.uploadImage.useMutation({
    onSuccess: result => { setImageUrl(result.url); toast.success("Image téléversée. Elle est prête à être analysée."); },
    onError: error => toast.error(error.message || "Le téléversement a échoué."),
  });
  const analyzeImage = trpc.owner.assistant.analyzeImage.useMutation({
    onSuccess: response => { setImageAnswer(response.answer); setImageError(""); setMessages(current => [...current, { role: "assistant", content: `Analyse du visuel\n\n${response.answer}` }]); toast.success("Analyse terminée."); },
    onError: error => { setImageError(error.message || "L’analyse de l’image a échoué."); toast.error(error.message || "L’analyse de l’image a échoué."); },
  });
  const importKnowledgeUrl = trpc.owner.assistant.importKnowledgeUrl.useMutation({
    onSuccess: async result => { setKnowledgeUrl(""); await sourcesQuery.refetch(); toast.success(`Source « ${result.source.title} » ajoutée au copilote.`); },
    onError: error => toast.error(error.message || "La page n’a pas pu être ajoutée."),
  });
  const importKnowledgeDocument = trpc.owner.assistant.importKnowledgeDocument.useMutation({
    onSuccess: async result => { await sourcesQuery.refetch(); toast.success(`Document « ${result.source.title} » ajouté au copilote.`); },
    onError: error => toast.error(error.message || "Le document n’a pas pu être ajouté."),
  });
  const addKnowledgeNote = trpc.owner.assistant.addKnowledgeNote.useMutation({
    onSuccess: async result => { setNoteTitle(""); setNoteContent(""); await sourcesQuery.refetch(); toast.success(`Note « ${result.source.title} » ajoutée au copilote.`); },
    onError: error => toast.error(error.message || "La note n’a pas pu être ajoutée."),
  });
  const removeKnowledgeSource = trpc.owner.assistant.removeKnowledgeSource.useMutation({
    onSuccess: async () => { await sourcesQuery.refetch(); toast.success("Source retirée du copilote."); },
    onError: error => toast.error(error.message || "La source n’a pas pu être retirée."),
  });
  const saveDraft = trpc.owner.assistant.saveDraft.useMutation({
    onSuccess: async result => { await savedDraftsQuery.refetch(); toast.success(`Brouillon « ${result.draft.title} » enregistré.`); },
    onError: error => toast.error(error.message || "Le brouillon n’a pas pu être enregistré."),
  });
  const removeSavedDraft = trpc.owner.assistant.removeSavedDraft.useMutation({
    onSuccess: async () => { await savedDraftsQuery.refetch(); toast.success("Brouillon retiré de votre bibliothèque."); },
    onError: error => toast.error(error.message || "Le brouillon n’a pas pu être retiré."),
  });

  const sendMessage = (content: string) => {
    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    chat.mutate({ messages: nextMessages.filter((message): message is Message & { role: "user" | "assistant" } => message.role !== "system").map(message => ({ role: message.role, content: message.content })) });
  };
  const copyDraft = async (content: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(content);
      else { const area = document.createElement("textarea"); area.value = content; area.style.position = "fixed"; area.style.opacity = "0"; document.body.appendChild(area); area.focus(); area.select(); document.execCommand("copy"); area.remove(); }
      toast.success("Brouillon copié.");
    } catch { toast.error("La copie n’a pas pu être effectuée sur cet appareil. Sélectionnez le texte et utilisez Copier."); }
  };
  const saveAssistantDraft = (content: string) => {
    const clean = content.trim();
    if (!clean) return;
    const firstLine = clean.split("\n").map(line => line.replace(/^#+\s*/, "").trim()).find(line => line.length >= 3) || "Brouillon IA";
    saveDraft.mutate({ title: firstLine.slice(0, 160), content: clean });
  };
  const downloadStoredDraft = (content: string, title: string) => {
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "mazigho-brouillon"}.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };
  const onImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!/^image\/(png|jpe?g|webp)$/i.test(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choisissez une image PNG, JPEG ou WebP de 5 Mo maximum."); return;
    }
    try { uploadImage.mutate({ dataUrl: await fileToDataUrl(file), fileName: file.name }); }
    catch { toast.error("La lecture de l’image a échoué."); }
  };
  const onKnowledgeDocumentUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const mime = documentMime(file);
    if (!Object.values(documentMimeByExtension).includes(mime) || file.size > 5 * 1024 * 1024) {
      toast.error("Choisissez un PDF, Word (.docx) ou texte (.txt) de 5 Mo maximum."); return;
    }
    try {
      const normalizedFile = file.type === mime ? file : new File([file], file.name, { type: mime });
      importKnowledgeDocument.mutate({ dataUrl: await fileToDataUrl(normalizedFile), fileName: file.name });
    } catch { toast.error("La lecture du document a échoué."); }
  };
  const isSourceBusy = importKnowledgeUrl.isPending || importKnowledgeDocument.isPending || addKnowledgeNote.isPending || removeKnowledgeSource.isPending;
  const sources = sourcesQuery.data ?? [];
  const savedDrafts = savedDraftsQuery.data ?? [];

  return <div className="space-y-5">
    <Card className="overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div>
        <CardTitle className="flex items-center gap-2 text-violet-950"><Sparkles className="h-5 w-5 text-violet-700" /> Assistant IA de votre boutique</CardTitle>
        <CardDescription className="mt-2 max-w-3xl leading-6">Rédaction, SEO, traductions, sources de travail et analyse de visuels pour « {storeName} ». Chaque résultat reste un brouillon à relire.</CardDescription>
      </div><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Brouillon contrôlé</Badge>
      <button type="button" onClick={() => setMessages(initialMessages)} disabled={chat.isPending || messages.length <= 1} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-800 disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" /> Nouvelle conversation</button>
      </div></CardHeader>
      <CardContent><AIChatBox messages={messages} onSendMessage={sendMessage} onCopyAssistantMessage={copyDraft} onSaveAssistantMessage={saveAssistantDraft} isLoading={chat.isPending} placeholder="Demandez une idée, une fiche produit ou une amélioration…" height="min(620px, 68vh)" emptyStateMessage="Que souhaitez-vous préparer aujourd’hui ?" suggestedPrompts={["Rédige une fiche produit professionnelle pour mon meilleur produit.", "À partir de mes sources, propose une fiche produit fidèle et claire.", "Propose trois textes de hero pour une boutique chaleureuse et moderne.", "Donne-moi une FAQ courte pour rassurer mes clients avant l’achat."]} /></CardContent>
    </Card>

    <Card className="border-violet-200 bg-violet-50/40"><CardHeader><CardTitle className="flex items-center gap-2 text-violet-950"><FileText className="h-5 w-5 text-violet-700" /> Mes brouillons enregistrés</CardTitle><CardDescription>Conservez les réponses utiles de l’IA comme documents de travail privés. Ils ne sont pas publiés et restent isolés dans « {storeName} ».</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">Bibliothèque ({savedDrafts.length}/30)</p><Button type="button" size="sm" variant="ghost" className="min-h-10 text-violet-800" onClick={() => void savedDraftsQuery.refetch()} disabled={savedDraftsQuery.isFetching}>Actualiser</Button></div>{savedDraftsQuery.isLoading ? <div className="h-24 animate-pulse rounded-xl bg-violet-100" /> : savedDrafts.length === 0 ? <div className="rounded-xl border border-dashed border-violet-200 bg-white p-4 text-sm text-slate-600">Enregistrez une réponse de l’assistant pour la retrouver ici. Vous pouvez aussi la copier ou la télécharger immédiatement.</div> : <div className="space-y-2">{savedDrafts.map(draft => <article key={draft.id} className="rounded-xl border border-violet-100 bg-white p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><p className="truncate font-semibold text-slate-900">{draft.title}</p><p className="mt-1 text-xs text-slate-500">Enregistré le {new Date(draft.createdAt).toLocaleString("fr-CH", { dateStyle: "medium", timeStyle: "short" })}</p></div><div className="flex flex-wrap gap-2"><Button type="button" size="sm" variant="outline" className="min-h-10 border-violet-200 text-violet-900 hover:bg-violet-50" onClick={() => copyDraft(draft.content)}>Copier</Button><Button type="button" size="sm" variant="outline" className="min-h-10 border-slate-200 text-slate-700" onClick={() => downloadStoredDraft(draft.content, draft.title)}>Télécharger</Button><Button type="button" size="sm" variant="outline" className="min-h-10 border-rose-200 text-rose-700 hover:bg-rose-50" disabled={removeSavedDraft.isPending} onClick={() => removeSavedDraft.mutate({ draftId: draft.id })}><Trash2 className="h-3.5 w-3.5" /><span className="sr-only">Retirer</span></Button></div></div><details className="mt-3 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2"><summary className="cursor-pointer text-sm font-medium text-violet-900">Lire le brouillon</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-700">{draft.content}</p></details></article>)}</div>}</CardContent></Card>

    <Card className="border-sky-200 bg-sky-50/40"><CardHeader><CardTitle className="flex items-center gap-2 text-sky-950"><NotebookPen className="h-5 w-5 text-sky-700" /> Sources de connaissances</CardTitle><CardDescription>Ajoutez une page web publique, un PDF, un document Word ou une note. Le copilote mémorise seulement un extrait de travail privé à cette boutique — jamais une publication automatique.</CardDescription></CardHeader><CardContent className="space-y-5">
      <div className="grid gap-3 rounded-xl border border-sky-100 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_auto]"><div><label className="text-sm font-semibold text-slate-900">Page web publique</label><Input value={knowledgeUrl} onChange={event => setKnowledgeUrl(event.target.value)} placeholder="https://… page fournisseur, guide ou article" inputMode="url" className="mt-2" /></div><Button type="button" variant="outline" className="min-h-11 self-end border-sky-200 text-sky-900 hover:bg-sky-50" disabled={!/^https:\/\//i.test(knowledgeUrl.trim()) || isSourceBusy} onClick={() => importKnowledgeUrl.mutate({ url: knowledgeUrl.trim() })}><Link2 className="mr-2 h-4 w-4" /> {importKnowledgeUrl.isPending ? "Lecture…" : "Ajouter la page"}</Button></div>
      <div className="grid gap-3 rounded-xl border border-sky-100 bg-white p-4 lg:grid-cols-[minmax(0,1fr)_auto]"><div><p className="text-sm font-semibold text-slate-900">Document de travail</p><p className="mt-1 text-xs leading-5 text-slate-600">PDF, Word (.docx) ou texte (.txt), jusqu’à 5 Mo. Les fichiers bruts ne sont pas conservés par le copilote.</p></div><label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 self-end rounded-md border border-sky-200 bg-white px-3 text-sm font-semibold text-sky-900 hover:bg-sky-50"><Upload className="h-4 w-4" /> {importKnowledgeDocument.isPending ? "Lecture…" : "Téléverser"}<input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,.pdf,.docx,.txt" className="sr-only" onChange={onKnowledgeDocumentUpload} disabled={isSourceBusy} /></label></div>
      <div className="rounded-xl border border-sky-100 bg-white p-4"><p className="text-sm font-semibold text-slate-900">Note de marque ou consigne</p><div className="mt-3 grid gap-3"><Input value={noteTitle} onChange={event => setNoteTitle(event.target.value)} placeholder="Ex. Ton de voix et promesse de marque" maxLength={160} /><Textarea value={noteContent} onChange={event => setNoteContent(event.target.value)} rows={4} placeholder="Écrivez une information durable que le copilote doit utiliser dans ses brouillons…" maxLength={12_000} /><div><Button type="button" variant="outline" className="min-h-11 border-sky-200 text-sky-900 hover:bg-sky-50" disabled={noteContent.trim().length < 20 || isSourceBusy} onClick={() => addKnowledgeNote.mutate({ title: noteTitle.trim() || "Note boutique", content: noteContent.trim() })}><NotebookPen className="mr-2 h-4 w-4" /> {addKnowledgeNote.isPending ? "Ajout…" : "Ajouter la note"}</Button></div></div></div>
      <div className="space-y-2"><div className="flex items-center justify-between gap-3"><p className="text-sm font-semibold text-slate-900">Sources actives ({sources.length}/8)</p><Button type="button" size="sm" variant="ghost" className="min-h-10 text-sky-800" onClick={() => void sourcesQuery.refetch()} disabled={sourcesQuery.isFetching}>Actualiser</Button></div>{sourcesQuery.isLoading ? <div className="h-24 animate-pulse rounded-xl bg-slate-100" /> : sources.length === 0 ? <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">Aucune source ajoutée. Le copilote s’appuie déjà sur votre catalogue et votre vitrine.</div> : <div className="space-y-2">{sources.map(source => <article key={source.id} className="rounded-xl border border-slate-200 bg-white p-3"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2">{sourceIcon(source.kind)}<p className="truncate font-semibold text-slate-900">{source.title}</p><Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">{sourceKindLabel(source.kind)}</Badge></div><p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{source.summary}</p><p className="mt-1 truncate text-[11px] text-slate-500">{source.origin}</p></div><Button type="button" size="sm" variant="outline" className="min-h-10 shrink-0 border-rose-200 text-rose-700 hover:bg-rose-50" disabled={isSourceBusy} onClick={() => removeKnowledgeSource.mutate({ sourceId: source.id })}><Trash2 className="mr-1 h-3.5 w-3.5" /> Retirer</Button></div></article>)}</div>}</div>
    </CardContent></Card>

    <Card className="border-fuchsia-200 bg-fuchsia-50/40"><CardHeader><CardTitle className="flex items-center gap-2 text-fuchsia-950"><ImagePlus className="h-5 w-5 text-fuchsia-700" /> Analyser un visuel</CardTitle><CardDescription>Collez une URL HTTPS d’image ou téléversez un fichier. L’IA prépare un brouillon avec texte alternatif, titre, description et catégories possibles.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row"><Input value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="https://… image publique" inputMode="url" /><label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-fuchsia-200 bg-white px-3 text-sm font-semibold text-fuchsia-900"><Upload className="h-4 w-4" /> Téléverser<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onImageUpload} /></label></div>
      <Textarea value={imageInstruction} onChange={event => setImageInstruction(event.target.value)} rows={3} placeholder="Que voulez-vous obtenir de cette image ?" />
      <div className="flex flex-wrap items-center gap-3"><Button type="button" className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800" disabled={!/^https:\/\//i.test(imageUrl.trim()) || !imageInstruction.trim() || analyzeImage.isPending || uploadImage.isPending} onClick={() => { setImageAnswer(""); setImageError(""); analyzeImage.mutate({ imageUrl: imageUrl.trim(), instruction: imageInstruction.trim() }); }}>{analyzeImage.isPending ? "Analyse…" : "Analyser le visuel"}</Button>{imageUrl ? <span className="max-w-full truncate text-xs text-fuchsia-900">Source prête : {imageUrl}</span> : null}</div>
      {analyzeImage.isPending && <div className="rounded-xl border border-fuchsia-200 bg-white p-4 text-sm text-fuchsia-900">L’IA examine le visuel et prépare le brouillon…</div>}
      {imageError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><strong>Analyse impossible :</strong> {imageError}</div>}
      {imageAnswer && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p className="font-semibold">Résultat de l’analyse</p><p className="mt-2 whitespace-pre-wrap">{imageAnswer}</p><button type="button" onClick={() => copyDraft(imageAnswer)} className="mt-3 inline-flex min-h-10 items-center rounded-md border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-900">Copier l’analyse</button></div>}
    </CardContent></Card>
    <Card className="border-dashed border-slate-300"><CardContent className="p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Principe de sécurité</p><p className="mt-2">Rien n’est publié, aucun prix n’est modifié et aucun e-mail n’est envoyé. Les sources IA sont isolées par boutique ; les documents bruts ne sont pas exposés sur la vitrine.</p></CardContent></Card>
  </div>;
}
