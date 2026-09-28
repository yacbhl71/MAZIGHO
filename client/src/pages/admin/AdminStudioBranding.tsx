import { type ChangeEvent, useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO } from "@/const";
import { trpc } from "@/lib/trpc";
import { DEFAULT_PLATFORM_IDENTITY, type PlatformIdentity, type PlatformIdentitySurface } from "@shared/platformIdentity";
import { CheckCircle2, ImagePlus, Loader2, MonitorUp, Palette, Save, Upload } from "lucide-react";
import { toast } from "sonner";

type IdentityField = "logoUrl" | "faviconUrl";

function SurfaceIdentityCard({
  surface,
  title,
  description,
  host,
  value,
  saving,
  onValueChange,
  onUpload,
  uploading,
}: {
  surface: PlatformIdentitySurface;
  title: string;
  description: string;
  host: string;
  value: PlatformIdentity[PlatformIdentitySurface];
  saving: boolean;
  uploading: IdentityField | null;
  onValueChange: (field: IdentityField, value: string) => void;
  onUpload: (field: IdentityField, event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const assetEditor = (field: IdentityField, label: string, hint: string) => {
    const currentUrl = value[field];
    const fallback = field === "logoUrl" ? APP_LOGO : "";
    return <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className={field === "logoUrl" ? "grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white" : "grid h-20 w-20 shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 bg-white"}>
          {currentUrl || fallback ? <img src={currentUrl || fallback} alt={`Aperçu ${label}`} className="h-full w-full object-contain p-2" /> : <ImagePlus className="h-7 w-7 text-slate-400" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2.5">
          <div><Label htmlFor={`${surface}-${field}`} className="font-semibold text-slate-900">{label}</Label><p className="mt-1 text-xs leading-5 text-slate-500">{hint}</p></div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input id={`${surface}-${field}`} value={currentUrl} onChange={event => onValueChange(field, event.target.value)} placeholder="https://… ou /…" />
            <label className="inline-flex min-h-10 shrink-0 cursor-pointer items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:bg-slate-50">
              {uploading === field ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
              {uploading === field ? "Envoi…" : "Téléverser"}
              <input className="sr-only" type="file" accept="image/jpeg,image/png,image/webp" disabled={Boolean(uploading) || saving} onChange={event => onUpload(field, event)} />
            </label>
          </div>
        </div>
      </div>
    </div>;
  };

  return <Card className="overflow-hidden border-slate-200 shadow-sm">
    <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
      <div className="flex items-start gap-3"><div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white"><Palette className="h-5 w-5" /></div><div><CardTitle>{title}</CardTitle><CardDescription className="mt-1">{description}</CardDescription><p className="mt-2 inline-flex rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600">{host}</p></div></div>
    </CardHeader>
    <CardContent className="space-y-4 pt-5">
      {assetEditor("logoUrl", "Logo", "Utilisé dans l’en-tête et la navigation de cet espace. Laisser vide conserve le logo MAZIGHO actuel.")}
      {assetEditor("faviconUrl", "Favicon", "Icône du navigateur pour cet espace. Une image carrée donne le meilleur résultat.")}
    </CardContent>
  </Card>;
}

export default function AdminStudioBranding() {
  const identityQuery = trpc.admin.platformIdentity.get.useQuery();
  const saveIdentity = trpc.admin.platformIdentity.save.useMutation();
  const uploadImage = trpc.admin.platformIdentity.uploadImage.useMutation();
  const [identity, setIdentity] = useState<PlatformIdentity>(DEFAULT_PLATFORM_IDENTITY);
  const [uploading, setUploading] = useState<{ surface: PlatformIdentitySurface; field: IdentityField } | null>(null);

  useEffect(() => {
    if (identityQuery.data) setIdentity(identityQuery.data);
  }, [identityQuery.data]);

  const setValue = (surface: PlatformIdentitySurface, field: IdentityField, value: string) => {
    setIdentity(current => ({ ...current, [surface]: { ...current[surface], [field]: value } }));
  };

  const upload = async (surface: PlatformIdentitySurface, field: IdentityField, event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!new Set(["image/jpeg", "image/png", "image/webp"]).has(file.type)) {
      toast.error("Choisissez une image JPEG, PNG ou WebP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("L’image doit peser 5 Mo maximum.");
      return;
    }
    try {
      setUploading({ surface, field });
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Lecture du fichier impossible"));
        reader.onerror = () => reject(new Error("Lecture du fichier impossible"));
        reader.readAsDataURL(file);
      });
      const result = await uploadImage.mutateAsync({ surface, dataUrl, fileName: file.name });
      setValue(surface, field, result.url);
      toast.success("Image téléversée. Enregistrez l’identité pour la publier.");
    } catch (error) {
      toast.error(`Téléversement impossible : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    try {
      await saveIdentity.mutateAsync(identity);
      await identityQuery.refetch();
      toast.success("Identité Studio et Pro enregistrée.");
    } catch (error) {
      toast.error(`Enregistrement impossible : ${error instanceof Error ? error.message : "erreur inconnue"}`);
    }
  };

  return <DashboardLayout><div className="mx-auto max-w-6xl space-y-6 pb-10">
    <section className="overflow-hidden rounded-2xl border border-[#dce5aa] bg-gradient-to-br from-[#f5f8e7] via-white to-[#fff5df] p-6 shadow-sm md:p-8">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-[#647136]"><MonitorUp className="h-4 w-4" /> Identité plateforme</p><h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 md:text-4xl">Logo et favicon de Studio & Pro</h1><p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Ces réglages concernent uniquement <strong>studio.mazigho.ch</strong> et <strong>pro.mazigho.ch</strong>. Les logos des boutiques clientes restent indépendants dans leur panneau Vitrine.</p></div><div className="grid h-20 w-20 place-items-center rounded-[1.5rem] bg-[#5b6836] text-white shadow-lg shadow-[#5b6836]/20"><Palette className="h-9 w-9" /></div></div>
    </section>

    <div className="grid gap-6 lg:grid-cols-2">
      <SurfaceIdentityCard surface="studio" title="MAZIGHO Studio" description="Console opérateur et gestion de la plateforme." host="studio.mazigho.ch" value={identity.studio} saving={saveIdentity.isPending} uploading={uploading?.surface === "studio" ? uploading.field : null} onValueChange={(field, value) => setValue("studio", field, value)} onUpload={(field, event) => upload("studio", field, event)} />
      <SurfaceIdentityCard surface="saas" title="MAZIGHO Pro" description="Landing SaaS publique et présentation commerciale." host="pro.mazigho.ch" value={identity.saas} saving={saveIdentity.isPending} uploading={uploading?.surface === "saas" ? uploading.field : null} onValueChange={(field, value) => setValue("saas", field, value)} onUpload={(field, event) => upload("saas", field, event)} />
    </div>

    <div className="sticky bottom-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-xl backdrop-blur sm:flex-row sm:items-center sm:justify-between"><p className="flex items-center gap-2 text-sm text-slate-600"><CheckCircle2 className="h-4 w-4 text-emerald-600" /> Les changements sont réversibles : vider un champ rétablit le logo MAZIGHO actuel.</p><Button className="min-h-11 bg-slate-950 hover:bg-slate-800" disabled={saveIdentity.isPending || Boolean(uploading)} onClick={save}>{saveIdentity.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}Enregistrer l’identité</Button></div>
  </div></DashboardLayout>;
}
