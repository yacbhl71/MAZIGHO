import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Component, ReactNode } from "react";
import { isStaleDynamicImportError, recoverFromStaleDynamicImport } from "@/lib/dynamicImportRecovery";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    recoverFromStaleDynamicImport(error);
  }

  render() {
    if (this.state.hasError) {
      const updateInProgress = isStaleDynamicImportError(this.state.error);
      return (
        <div className="grid min-h-screen place-items-center bg-stone-50 p-6">
          <div className="w-full max-w-lg rounded-3xl border border-amber-100 bg-white p-7 text-center shadow-sm sm:p-10">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-amber-50 text-amber-700">
              <AlertTriangle size={28} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-bold tracking-tight text-slate-950">
              {updateInProgress ? "Mise à jour en cours" : "Cette page ne s’est pas affichée correctement"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {updateInProgress
                ? "Une nouvelle version vient d’être publiée. La page se recharge automatiquement pour vous afficher la version à jour."
                : "Aucune donnée ni commande n’a été modifiée. Réessayez simplement d’ouvrir la page."}
            </p>
            <button
              onClick={() => window.location.reload()}
              className={cn(
                "mx-auto mt-6 flex min-h-11 items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold",
                "bg-teal-700 text-white hover:bg-teal-800 focus:outline-none focus:ring-2 focus:ring-teal-700 focus:ring-offset-2"
              )}
            >
              <RotateCcw size={16} />
              Réessayer
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
