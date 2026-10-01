import { useState } from "react";
import { RotateCcw, ShieldCheck, Sparkles } from "lucide-react";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const initialMessages: Message[] = [{ role: "system", content: "Vous êtes le copilote de MAZIGHO Studio." }];

export default function StudioAICopilot() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const chat = trpc.admin.studio.assistant.chat.useMutation({
    onSuccess: response => setMessages(current => [...current, { role: "assistant", content: response.answer }]),
    onError: error => toast.error(error.message || "Le copilote Studio est momentanément indisponible."),
  });

  const sendMessage = (content: string) => {
    const nextMessages = [...messages, { role: "user" as const, content }];
    setMessages(nextMessages);
    chat.mutate({
      messages: nextMessages
        .filter((message): message is Message & { role: "user" | "assistant" } => message.role !== "system")
        .map(message => ({ role: message.role, content: message.content })),
    });
  };

  const copyDraft = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast.success("Synthèse copiée dans le presse-papiers.");
    } catch {
      toast.error("La copie n’a pas pu être effectuée sur cet appareil.");
    }
  };

  return (
    <section id="studio-ai" className="scroll-mt-6 rounded-2xl border border-fuchsia-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 p-5 shadow-sm md:p-6" data-testid="studio-ai-copilot">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Pilotage augmenté</p>
          <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-violet-950"><Sparkles className="h-6 w-6" /> Copilote IA Studio</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-violet-900">Analysez l’état global de la plateforme, préparez un plan d’action et rédigez des messages opérateur. Le copilote ne modifie aucune boutique.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className="border-emerald-200 bg-emerald-50 text-emerald-800"><ShieldCheck className="mr-1 h-3.5 w-3.5" /> Données agrégées</Badge>
          <button type="button" onClick={() => setMessages(initialMessages)} disabled={chat.isPending || messages.length <= 1} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-violet-200 bg-white px-3 text-xs font-semibold text-violet-800 transition hover:bg-violet-50 disabled:cursor-not-allowed disabled:opacity-50"><RotateCcw className="h-3.5 w-3.5" /> Nouvelle conversation</button>
        </div>
      </div>
      <Card className="mt-5 border-violet-200 bg-white/80">
        <CardHeader><CardTitle className="text-base">Un assistant pour décider plus vite</CardTitle><CardDescription>Il peut résumer les boutiques à préparer, repérer les états à revoir et proposer une checklist. Les décisions et validations restent humaines.</CardDescription></CardHeader>
        <CardContent><AIChatBox messages={messages} onSendMessage={sendMessage} onCopyAssistantMessage={copyDraft} isLoading={chat.isPending} placeholder="Ex. Quelles sont les trois priorités Studio cette semaine ?" height="min(560px, 64vh)" emptyStateMessage="Quelle priorité souhaitez-vous analyser ?" suggestedPrompts={["Résume l’état global des boutiques et les points d’attention.", "Propose une checklist pour préparer une boutique avant ouverture.", "Quels contrôles faut-il faire avant d’activer une vraie vente ?", "Rédige un message clair pour accompagner un propriétaire en difficulté."]} /></CardContent>
      </Card>
      <p className="mt-4 text-xs leading-5 text-violet-900">Aucun secret, mot de passe, jeton, numéro de carte, contenu client ou donnée fournisseur détaillée n’est transmis au modèle.</p>
    </section>
  );
}
