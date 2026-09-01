import { APP_LOGO, APP_TITLE } from "@/const";

export function MaintenancePage({ title, message }: { title: string; message: string }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-slate-950 px-6 text-center text-white" data-testid="maintenance-page">
      <div aria-hidden="true" className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-orange-500/20 blur-3xl" />
      <div aria-hidden="true" className="absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-amber-400/10 blur-3xl" />
      <div className="relative z-10 flex flex-col items-center">
        <img src={APP_LOGO} alt={APP_TITLE} className="mb-8 h-20 w-20 rounded-2xl object-cover ring-1 ring-white/20" />
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.3em] text-orange-300">{APP_TITLE}</p>
        <h1 className="max-w-2xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">{title}</h1>
        <p className="mt-5 max-w-xl text-base leading-7 text-white/70">{message}</p>
        <div className="mt-10 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.24em] text-orange-200">
          <span className="h-2 w-2 animate-pulse rounded-full bg-orange-400" /> Maintenance en cours
        </div>
      </div>
    </div>
  );
}
