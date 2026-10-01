import { ChangeEvent, useState } from "react";
import { FileText, ImagePlus, RotateCcw, Search, ShieldCheck, Sparkles, Trash2, Upload, X } from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { toast } from "sonner";

type OwnerAICopilotProps = { storeName: string };

const initialMessages: Message[] = [{ role: "system", content: "Vous êtes le copilote de la boutique courante." }];

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture impossible"));
    reader.onerror = () => reject(new Error("Lecture impossible"));
    reader.readAsDataURL(file);
  });
}

export default function OwnerAICopilot({ storeName }: OwnerAICopilotProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [imageUrl, setImageUrl] = useState("");
  const [imageInstruction, setImageInstruction] = useState("Analyse ce visuel et prépare un brouillon de fiche produit.");
  const [imageAnswer, setImageAnswer] = useState("");
  const [imageError, setImageError] = useState("");
  const [knowledgeFolder, setKnowledgeFolder] = useState("Général");
  const [knowledgeSearch, setKnowledgeSearch] = useState("");
  const [submittedKnowledgeSearch, setSubmittedKnowledgeSearch] = useState("");
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [documentForDeletion, setDocumentForDeletion] = useState<{ id: number; title: string } | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const usageQuery = trpc.owner.assistant.getUsage.useQuery();
  const knowledgeDocuments = trpc.owner.assistant.knowledgeDocuments.list.useQuery();
  const searchKnowledge = trpc.owner.assistant.knowledgeDocuments.search.useQuery(
    { query: submittedKnowledgeSearch || "--" },
    { enabled: submittedKnowledgeSearch.length >= 2 },
  );
  const importKnowledge = trpc.owner.assistant.knowledgeDocuments.importDocument.useMutation({
    onSuccess: async document => { await knowledgeDocuments.refetch(); toast.success(`« ${document.title} » est prêt pour vos recherches.`); },
    onError: error => toast.error(error.message || "L’import du document a échoué."),
  });
  const deleteKnowledge = trpc.owner.assistant.knowledgeDocuments.delete.useMutation({
    onSuccess: async () => { setSelectedDocumentIds([]); await knowledgeDocuments.refetch(); toast.success("Document supprimé."); },
    onError: error => toast.error(error.message || "La suppression a échoué."),
  });
  const chat = trpc.owner.assistant.chat.useMutation({
    onSuccess: async response => {
      const sources = response.citations?.length ? `\n\nSources internes utilisées : ${response.citations.map(citation => `« ${citation.title} »`).join(", ")}.` : "";
      setMessages(current => [...current, { role: "assistant", content: `${response.answer}${sources}` }]);
      await usageQuery.refetch();
    },
    onError: error => toast.error(error.message || "Le copilote IA est momentanément indisponible."),
  });
  const uploadImage = trpc.owner.uploadImage.useMutation({
    onSuccess: result => { setImageUrl(result.url); toast.success("Image téléversée. Elle est prête à être analysée."); },
    onError: error => toast.error(error.message || "Le téléversement a échoué."),
  });
  const analyzeImage = trpc.owner.assistant.analyzeImage.useMutation({
    onSuccess: async response => { setImageAnswer(response.answer); setImageError(""); setMessages(current => [...current, { role: "assistant", content: `Analyse du visuel\n\n${response.answer}` }]); await usageQuery.refetch(); toast.success("Analyse terminée."); },
    onError: error => { setImageError(error.message || "L’analyse de l’image a échoué."); toast.error(error.message || "L’analyse de l’image a échoué."); },
  });

  const sendMessage = (content: string) => {
    const nextMessages: Message[] = [...messages, { role: "user", content }];
    setMessages(nextMessages);
    chat.mutate({ messages: nextMessages.filter((message): message is Message & { role: "user" | "assistant" } => message.role !== "system").map(message => ({ role: message.role, content: message.content })), ...(selectedDocumentIds.length ? { documentIds: selectedDocumentIds } : {}) });
  };
  const copyDraft = async (content: string) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(content);
      else { const area = document.createElement("textarea"); area.value = content; area.style.position = "fixed"; area.style.opacity = "0"; document.body.appendChild(area); area.focus(); area.select(); document.execCommand("copy"); area.remove(); }
      toast.success("Brouillon copié.");
    } catch { toast.error("La copie n’a pas pu être effectuée sur cet appareil. Sélectionnez le texte et utilisez Copier."); }
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
  const onKnowledgeUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const supported = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain", "text/csv", "application/csv"];
    if (!supported.includes(file.type) || file.size > 5 * 1024 * 1024) {
      toast.error("Choisissez un PDF, DOCX, TXT ou CSV de 5 Mo maximum."); return;
    }
    try { importKnowledge.mutate({ dataUrl: await fileToDataUrl(file), sourceName: file.name, folder: knowledgeFolder.trim() || "Général" }); }
    catch { toast.error("La lecture du document a échoué."); }
  };
  const displayedDocuments = searchKnowledge.data ?? knowledgeDocuments.data ?? [];
  const toggleDocument = (documentId: number) => setSelectedDocumentIds(current => current.includes(documentId) ? current.filter(id => id !== documentId) : [...current, documentId].slice(0, 6));

  return <div className="space-y-5">
    <Card className="overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
      <CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div>
        <CardTitle className="flex items-center gap-2 text-violet-950"><Sparkles className="h-5 w-5 text-violet-700" /> Assistant IA de votre boutique</CardTitle>
        <CardDescription className="mt-2 max-w-3xl leading-6">Rédaction, SEO, traductions et analyse de visuels pour « {storeName} ». Les URL externes et les images téléversées restent des sources de brouillon.</CardDescription>
      </div><div className="flex flex-wrap gap-2"><Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Brouillon contrôlé</Badge>{usageQuery.data && <Badge variant="outline" className="border-violet-200 bg-white text-violet-900">IA ce mois : {usageQuery.data.used}/{usageQuery.data.limit}</Badge>}</div>
      <button type="button" onClick={() => setMessages(initialMessages)} disabled={chat.isPending || messages.length <= 1} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-800 disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" /> Nouvelle conversation</button>
      </div></CardHeader>
      <CardContent><AIChatBox messages={messages} onSendMessage={sendMessage} onCopyAssistantMessage={copyDraft} isLoading={chat.isPending} placeholder="Demandez une idée, une fiche produit ou une amélioration…" height="min(620px, 68vh)" emptyStateMessage="Que souhaitez-vous préparer aujourd’hui ?" suggestedPrompts={["Rédige une fiche produit professionnelle pour mon meilleur produit.", "Propose trois textes de hero pour une boutique chaleureuse et moderne.", "Donne-moi une FAQ courte pour rassurer mes clients avant l’achat.", "Comment améliorer le référencement de ma boutique ?"]} /></CardContent>
    </Card>
    {knowledgeDocuments.data !== undefined && <Card className="border-sky-200 bg-sky-50/40"><CardHeader><CardTitle className="flex items-center gap-2 text-sky-950"><FileText className="h-5 w-5 text-sky-700" /> Centre documentaire privé</CardTitle><CardDescription>Importez un PDF, DOCX, TXT ou CSV. Le texte est chiffré dans votre boutique ; sélectionnez au plus 6 documents pour les citer dans le prochain brouillon IA.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row"><Input value={knowledgeFolder} onChange={event => setKnowledgeFolder(event.target.value)} placeholder="Dossier (ex. Fournisseurs)" className="sm:max-w-xs" /><label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-sky-200 bg-white px-3 text-sm font-semibold text-sky-900"><Upload className="h-4 w-4" /> {importKnowledge.isPending ? "Import…" : "Ajouter un document"}<input type="file" accept="application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,.pdf,.docx,.txt,.csv" className="sr-only" onChange={onKnowledgeUpload} disabled={importKnowledge.isPending} /></label></div>
      <div className="flex flex-col gap-2 sm:flex-row"><Input value={knowledgeSearch} onChange={event => setKnowledgeSearch(event.target.value)} placeholder="Rechercher dans les documents…" /><Button type="button" variant="outline" className="min-h-10 border-sky-200 text-sky-900" disabled={knowledgeSearch.trim().length < 2 || searchKnowledge.isFetching} onClick={() => setSubmittedKnowledgeSearch(knowledgeSearch.trim())}><Search className="mr-2 h-4 w-4" /> Rechercher</Button>{submittedKnowledgeSearch && <Button type="button" variant="ghost" className="min-h-10 text-sky-900" onClick={() => { setKnowledgeSearch(""); setSubmittedKnowledgeSearch(""); }}><X className="mr-1 h-4 w-4" /> Tout voir</Button>}</div>
      {selectedDocumentIds.length > 0 && <p className="rounded-lg border border-sky-200 bg-white px-3 py-2 text-xs text-sky-900">{selectedDocumentIds.length} document(s) seront utilisés comme contexte pour la prochaine question.</p>}
      <div className="space-y-2">{displayedDocuments.length ? displayedDocuments.map(document => <div key={document.id} className="rounded-xl border border-sky-100 bg-white p-3"><div className="flex flex-wrap items-start justify-between gap-2"><button type="button" onClick={() => toggleDocument(document.id)} className={`min-h-9 rounded-md px-2 text-left text-sm font-semibold ${selectedDocumentIds.includes(document.id) ? "bg-sky-700 text-white" : "text-slate-900"}`}><FileText className="mr-2 inline h-4 w-4" />{document.title}</button><span className="rounded-full bg-sky-50 px-2 py-1 text-[11px] font-semibold uppercase text-sky-800">{document.sourceType}</span></div><p className="mt-1 text-xs text-slate-600">{document.folder}{"excerpt" in document ? ` · ${document.excerpt}` : ` · ${Math.max(1, Math.round(document.characterCount / 1000))} k caractères`}</p>{!('excerpt' in document) && <button type="button" className="mt-2 inline-flex min-h-9 items-center text-xs font-semibold text-rose-700" onClick={() => { setDeleteConfirmation(""); setDocumentForDeletion({ id: document.id, title: document.title }); }}><Trash2 className="mr-1 h-3.5 w-3.5" /> Supprimer</button>}</div>) : <p className="rounded-xl border border-dashed border-sky-200 bg-white p-4 text-sm text-slate-600">Aucun document dans ce dossier pour le moment.</p>}</div>
      <AlertDialog open={Boolean(documentForDeletion)} onOpenChange={open => { if (!open) setDocumentForDeletion(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer ce document privé ?</AlertDialogTitle><AlertDialogDescription>Cette suppression est définitive. Saisissez exactement le titre pour confirmer : « {documentForDeletion?.title} ».</AlertDialogDescription></AlertDialogHeader><Input value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} placeholder="Titre exact du document" /><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction disabled={!documentForDeletion || deleteConfirmation.trim() !== documentForDeletion.title || deleteKnowledge.isPending} onClick={event => { if (!documentForDeletion || deleteConfirmation.trim() !== documentForDeletion.title) { event.preventDefault(); return; } deleteKnowledge.mutate({ documentId: documentForDeletion.id, confirmationTitle: deleteConfirmation }); setDocumentForDeletion(null); }}>Supprimer définitivement</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </CardContent></Card>}
    <Card className="border-fuchsia-200 bg-fuchsia-50/40"><CardHeader><CardTitle className="flex items-center gap-2 text-fuchsia-950"><ImagePlus className="h-5 w-5 text-fuchsia-700" /> Analyser un visuel</CardTitle><CardDescription>Collez une URL HTTPS d’image ou téléversez un fichier. L’IA prépare un brouillon avec texte alternatif, titre, description et catégories possibles.</CardDescription></CardHeader><CardContent className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row"><Input value={imageUrl} onChange={event => setImageUrl(event.target.value)} placeholder="https://… image publique" inputMode="url" /><label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-fuchsia-200 bg-white px-3 text-sm font-semibold text-fuchsia-900"><Upload className="h-4 w-4" /> Téléverser<input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onImageUpload} /></label></div>
      <Textarea value={imageInstruction} onChange={event => setImageInstruction(event.target.value)} rows={3} placeholder="Que voulez-vous obtenir de cette image ?" />
      <div className="flex flex-wrap items-center gap-3"><Button type="button" className="min-h-11 bg-fuchsia-700 hover:bg-fuchsia-800" disabled={!/^https:\/\//i.test(imageUrl.trim()) || !imageInstruction.trim() || analyzeImage.isPending || uploadImage.isPending} onClick={() => { setImageAnswer(""); setImageError(""); analyzeImage.mutate({ imageUrl: imageUrl.trim(), instruction: imageInstruction.trim() }); }}>{analyzeImage.isPending ? "Analyse…" : "Analyser le visuel"}</Button>{imageUrl ? <span className="max-w-full truncate text-xs text-fuchsia-900">Source prête : {imageUrl}</span> : null}</div>
      {analyzeImage.isPending && <div className="rounded-xl border border-fuchsia-200 bg-white p-4 text-sm text-fuchsia-900">L’IA examine le visuel et prépare le brouillon…</div>}
      {imageError && <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-900"><strong>Analyse impossible :</strong> {imageError}</div>}
      {imageAnswer && <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><p className="font-semibold">Résultat de l’analyse</p><p className="mt-2 whitespace-pre-wrap">{imageAnswer}</p><button type="button" onClick={() => copyDraft(imageAnswer)} className="mt-3 inline-flex min-h-10 items-center rounded-md border border-emerald-300 bg-white px-3 text-xs font-semibold text-emerald-900">Copier l’analyse</button></div>}
    </CardContent></Card>
    <Card className="border-dashed border-slate-300"><CardContent className="p-5 text-sm leading-6 text-slate-600"><p className="font-semibold text-slate-800">Principe de sécurité</p><p className="mt-2">Rien n’est publié, aucun prix n’est modifié et aucun e-mail n’est envoyé. Les téléversements passent par le stockage isolé de cette boutique et respectent son quota média.</p></CardContent></Card>
  </div>;
}
