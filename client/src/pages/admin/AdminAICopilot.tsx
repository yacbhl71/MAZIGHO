import DashboardLayout from "@/components/DashboardLayout";
import StudioAICopilot from "@/components/StudioAICopilot";
import { Sparkles } from "lucide-react";

export default function AdminAICopilot() {
  return <DashboardLayout><main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-7 md:px-8" data-testid="admin-ai-copilot">
    <section className="rounded-2xl border border-fuchsia-200 bg-gradient-to-r from-fuchsia-50 via-white to-violet-50 p-6 md:p-8">
      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-fuchsia-800"><Sparkles className="h-4 w-4" /> Pilotage augmenté</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Assistant IA MAZIGHO</h1>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700 md:text-base">Préparez des analyses, priorités, textes et checklists depuis votre espace d’administration. L’assistant n’effectue aucune modification sans action explicite dans les modules concernés.</p>
    </section>
    <StudioAICopilot />
  </main></DashboardLayout>;
}
