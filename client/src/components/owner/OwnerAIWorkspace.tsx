import { useEffect, useState } from "react";
import { Download, FilePlus2, FileText, LayoutTemplate, Loader2, Save, Trash2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

type WorkspaceKind = "document" | "template";
type ActiveDocument = { id: number; kind: WorkspaceKind; title: string } | null;

const starterTemplate = `# Titre du document

## Objectif
Décrivez ce que ce document doit préparer.

## Contenu
Ajoutez ici vos informations, puis relisez-les avant de les utiliser.`;

export default function OwnerAIWorkspace() {
  const utils = trpc.useUtils();
  const [activeKind, setActiveKind] = useState<WorkspaceKind>("document");
  const [activeDocument, setActiveDocument] = useState<ActiveDocument>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ActiveDocument>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const documents = trpc.owner.assistant.workspaceDocuments.list.useQuery({ kind: "document" });
  const templates = trpc.owner.assistant.workspaceDocuments.list.useQuery({ kind: "template" });
  const detail = trpc.owner.assistant.workspaceDocuments.get.useQuery(
    { documentId: activeDocument?.id || 0, kind: activeDocument?.kind },
    { enabled: Boolean(activeDocument) },
  );
  const refresh = async () => Promise.all([documents.refetch(), templates.refetch()]);
  const create = trpc.owner.assistant.workspaceDocuments.create.useMutation({
    onSuccess: async document => {
      setActiveDocument({ id: document.id, kind: document.kind, title: document.title });
      await refresh();
      toast.success(document.kind === "template" ? "Modèle enregistré." : "Document enregistré.");
    },
    onError: error => toast.error(error.message || "L’enregistrement a échoué."),
  });
  const update = trpc.owner.assistant.workspaceDocuments.update.useMutation({
    onSuccess: async () => {
      await refresh();
      toast.success("Document Workspace enregistré.");
    },
    onError: error => toast.error(error.message || "La mise à jour a échoué."),
  });
  const remove = trpc.owner.assistant.workspaceDocuments.delete.useMutation({
    onSuccess: async () => {
      setActiveDocument(null);
      setTitle("");
      setContent("");
      setDeleteTarget(null);
      await refresh();
      toast.success("Document Workspace supprimé.");
    },
    onError: error => toast.error(error.message || "La suppression a échoué."),
  });
  const exportDocument = trpc.owner.assistant.workspaceDocuments.export.useMutation({
    onSuccess: result => {
      const anchor = document.createElement("a");
      anchor.href = result.dataUrl;
      anchor.download = result.fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      toast.success(`Export ${result.fileName.endsWith(".pdf") ? "PDF" : "DOCX"} prêt.`);
    },
    onError: error => toast.error(error.message || "L’export a échoué."),
  });

  useEffect(() => {
    if (!detail.data) return;
    setTitle(detail.data.title);
    setContent(detail.data.content);
  }, [detail.data]);

  const startNew = (kind: WorkspaceKind) => {
    setActiveKind(kind);
    setActiveDocument(null);
    setTitle(kind === "template" ? "Nouveau modèle" : "Nouveau document");
    setContent(kind === "template" ? starterTemplate : "");
  };
  const open = (document: { id: number; kind: WorkspaceKind; title: string }) => {
    setActiveKind(document.kind);
    setActiveDocument(document);
  };
  const save = () => {
    if (!title.trim() || !content.trim()) { toast.error("Ajoutez un titre et du contenu avant d’enregistrer."); return; }
    if (activeDocument) update.mutate({ documentId: activeDocument.id, title, content });
    else create.mutate({ kind: activeKind, title, content });
  };
  const useTemplateAsDocument = async (template: { id: number; title: string }) => {
    try {
      const selected = await utils.owner.assistant.workspaceDocuments.get.fetch({ documentId: template.id, kind: "template" });
      setActiveKind("document");
      setActiveDocument(null);
      setTitle(`Depuis ${selected.title}`.slice(0, 140));
      setContent(selected.content);
      toast.success("Modèle copié dans un nouveau document. Ajustez-le puis enregistrez.");
    } catch {
      toast.error("Le modèle n’a pas pu être ouvert.");
    }
  };
  const list = activeKind === "document" ? documents.data : templates.data;
  const pending = create.isPending || update.isPending;

  return <Card className="border-amber-200 bg-amber-50/35"><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2 text-amber-950"><FileText className="h-5 w-5 text-amber-700" /> MAZIGHO Workspace</CardTitle><CardDescription className="mt-2 max-w-3xl leading-6">Préparez des documents de travail et vos propres modèles. Le contenu est chiffré, isolé par boutique et rien n’est publié automatiquement.</CardDescription></div><Badge variant="outline" className="border-amber-200 bg-white text-amber-900">Privé & chiffré</Badge></div></CardHeader><CardContent className="space-y-4"><div className="flex flex-wrap gap-2"><Button type="button" variant={activeKind === "document" ? "default" : "outline"} className={activeKind === "document" ? "bg-amber-700 hover:bg-amber-800" : "border-amber-200 bg-white text-amber-900"} onClick={() => { setActiveKind("document"); setActiveDocument(null); setTitle(""); setContent(""); }}><FileText className="mr-2 h-4 w-4" /> Documents ({documents.data?.length || 0})</Button><Button type="button" variant={activeKind === "template" ? "default" : "outline"} className={activeKind === "template" ? "bg-amber-700 hover:bg-amber-800" : "border-amber-200 bg-white text-amber-900"} onClick={() => { setActiveKind("template"); setActiveDocument(null); setTitle(""); setContent(""); }}><LayoutTemplate className="mr-2 h-4 w-4" /> Modèles ({templates.data?.length || 0})</Button><Button type="button" variant="outline" className="border-amber-200 bg-white text-amber-900" onClick={() => startNew(activeKind)}><FilePlus2 className="mr-2 h-4 w-4" /> Nouveau</Button></div><div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)]"><div className="max-h-80 space-y-2 overflow-y-auto rounded-xl border border-amber-100 bg-white p-2">{list?.length ? list.map(document => <div key={document.id} className={`flex overflow-hidden rounded-lg border ${activeDocument?.id === document.id ? "border-amber-400 bg-amber-50" : "border-slate-100"}`}><button type="button" onClick={() => open(document)} className="min-w-0 flex-1 px-3 py-2 text-left"><p className="truncate text-sm font-semibold text-slate-950">{document.title}</p><p className="mt-1 text-[11px] text-slate-500">Mis à jour {new Date(document.updatedAt).toLocaleDateString("fr-CH")}</p></button>{document.kind === "template" && <button type="button" aria-label={`Créer un document depuis ${document.title}`} title="Créer un document depuis ce modèle" onClick={() => useTemplateAsDocument(document)} className="border-l border-amber-100 px-2 text-amber-800 hover:bg-amber-100"><FilePlus2 className="h-3.5 w-3.5" /></button>}</div>) : <p className="p-3 text-sm leading-6 text-slate-600">{activeKind === "template" ? "Aucun modèle pour le moment. Créez une structure réutilisable." : "Aucun document de travail pour le moment."}</p>}</div><div className="space-y-3 rounded-xl border border-amber-100 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-slate-950">{activeDocument ? `Édition : ${activeDocument.title}` : activeKind === "template" ? "Nouveau modèle" : "Nouveau document"}</p><div className="flex flex-wrap gap-2">{activeDocument && <><Button type="button" size="sm" variant="outline" className="border-amber-200 bg-white text-amber-900" disabled={exportDocument.isPending} onClick={() => exportDocument.mutate({ documentId: activeDocument.id, format: "pdf" })}><Download className="mr-1.5 h-3.5 w-3.5" /> PDF</Button><Button type="button" size="sm" variant="outline" className="border-amber-200 bg-white text-amber-900" disabled={exportDocument.isPending} onClick={() => exportDocument.mutate({ documentId: activeDocument.id, format: "docx" })}><Download className="mr-1.5 h-3.5 w-3.5" /> DOCX</Button><Button type="button" size="sm" variant="outline" className="border-rose-200 text-rose-700 hover:bg-rose-50" onClick={() => { setDeleteConfirmation(""); setDeleteTarget(activeDocument); }}><Trash2 className="mr-1.5 h-3.5 w-3.5" /> Supprimer</Button></>}</div></div>{detail.isLoading && activeDocument ? <div className="flex min-h-40 items-center justify-center text-sm text-amber-800"><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Ouverture chiffrée…</div> : <><Input value={title} onChange={event => setTitle(event.target.value)} maxLength={140} placeholder="Titre du document" /><Textarea value={content} onChange={event => setContent(event.target.value)} rows={12} maxLength={40_000} placeholder="Écrivez votre document, votre trame de réponse ou votre modèle…" /><div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-slate-500">{content.length.toLocaleString("fr-CH")} / 40 000 caractères</p><Button type="button" className="bg-amber-700 hover:bg-amber-800" disabled={pending || !title.trim() || !content.trim()} onClick={save}>{pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Enregistrer</Button></div></>}</div></div><AlertDialog open={Boolean(deleteTarget)} onOpenChange={open => { if (!open) setDeleteTarget(null); }}><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer ce document Workspace ?</AlertDialogTitle><AlertDialogDescription>Cette suppression est définitive. Saisissez exactement son titre pour confirmer : « {deleteTarget?.title} ».</AlertDialogDescription></AlertDialogHeader><Input value={deleteConfirmation} onChange={event => setDeleteConfirmation(event.target.value)} placeholder="Titre exact du document" /><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction disabled={!deleteTarget || deleteConfirmation.trim() !== deleteTarget.title || remove.isPending} onClick={event => { if (!deleteTarget || deleteConfirmation.trim() !== deleteTarget.title) { event.preventDefault(); return; } remove.mutate({ documentId: deleteTarget.id, confirmationTitle: deleteConfirmation }); }}>Supprimer définitivement</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent></Card>;
}
