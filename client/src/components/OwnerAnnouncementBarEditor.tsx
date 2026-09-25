import { useEffect, useState } from "react";
import { Eye, EyeOff, Loader2, MessageSquareText } from "lucide-react";
import type { DesignProfile } from "@/hooks/useDesignProfile";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function OwnerAnnouncementBarEditor({ profile, onSaved }: { profile: DesignProfile; onSaved: (profile: DesignProfile) => void }) {
  const [visible, setVisible] = useState(profile.showAnnouncement);
  const [items, setItems] = useState<string[]>(() => [...profile.announcementItems]);
  const save = trpc.owner.saveAnnouncementBar.useMutation({
    onSuccess: saved => {
      onSaved(saved as DesignProfile);
      toast.success("Barre d’informations enregistrée pour votre boutique.");
    },
    onError: error => toast.error(error.message || "La barre d’informations n’a pas pu être enregistrée."),
  });

  useEffect(() => {
    setVisible(profile.showAnnouncement);
    setItems([...profile.announcementItems]);
  }, [profile]);

  const setItem = (index: number, value: string) => setItems(current => current.map((item, itemIndex) => itemIndex === index ? value : item));

  return <Card className="border-sky-200">
    <CardHeader>
      <div className="flex flex-wrap items-start justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><MessageSquareText className="h-5 w-5 text-sky-700" /> Barre d’informations</CardTitle><CardDescription className="mt-1">La bande tout en haut de la boutique. Modifiez ses trois messages, laissez un message vide pour le masquer, ou cachez toute la barre.</CardDescription></div><Button type="button" variant={visible ? "default" : "outline"} className={visible ? "bg-sky-700 hover:bg-sky-800" : ""} onClick={() => setVisible(current => !current)}>{visible ? <><Eye className="mr-2 h-4 w-4" /> Visible</> : <><EyeOff className="mr-2 h-4 w-4" /> Masquée</>}</Button></div>
    </CardHeader>
    <CardContent className="space-y-5">
      <div className="grid gap-4 md:grid-cols-3">{["Premier message", "Deuxième message", "Troisième message"].map((label, index) => <div key={label} className="space-y-2"><Label htmlFor={`announcement-${index}`}>{label}</Label><Input id={`announcement-${index}`} value={items[index] || ""} maxLength={120} onChange={event => setItem(index, event.target.value)} placeholder="Laissez vide pour masquer" /></div>)}</div>
      <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="max-w-2xl text-xs leading-5 text-slate-500">Les messages sont propres à votre boutique. Cette modification ne touche ni le menu, ni une autre boutique, ni les conditions de livraison.</p><Button type="button" disabled={save.isPending} onClick={() => save.mutate({ showAnnouncement: visible, announcementItems: items.map(item => item.trim()) })} className="min-h-11 bg-sky-700 hover:bg-sky-800">{save.isPending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enregistrement…</> : "Enregistrer la barre"}</Button></div>
    </CardContent>
  </Card>;
}
