import { ChangeEvent, useState } from "react";
import { ImagePlus, RotateCcw, Sparkles, ShieldCheck, Upload } from "lucide-react";
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
  const usageQuery = trpc.owner.assistant.getUsage.useQuery();
  const chat = trpc.owner.assistant.chat.useMutation({
    onSuccess: async response => { setMessages(current => [...current, { role: "assistant", content: response.answer }]); await usageQuery.refetch(); },
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
    chat.mutate({ messages: nextMessages.filter((message): message is Message & { role: "user" | "assistant" } => message.role !== "system").map(message => ({ role: message.role, content: message.content })) });
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
