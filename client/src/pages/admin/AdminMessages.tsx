import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Archive, CheckCircle2, Mail, MailOpen, MessageSquare, Reply, Search, Undo2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const statusMeta = {
  unread: { label: "Non lu", className: "border-rose-200 bg-rose-50 text-rose-800" },
  read: { label: "Lu", className: "border-blue-200 bg-blue-50 text-blue-800" },
  archived: { label: "Archivé", className: "border-slate-200 bg-slate-100 text-slate-700" },
} as const;

type MessageStatus = keyof typeof statusMeta;

function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status as MessageStatus];
  return <Badge variant="outline" className={meta?.className || "bg-slate-50 text-slate-700"}>{meta?.label || status}</Badge>;
}

function formatDate(value: Date | string) {
  return new Date(value).toLocaleDateString("fr-CH", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminMessages() {
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | MessageStatus>("all");
  const { data: messages, isLoading, refetch } = trpc.admin.messages.getAll.useQuery();

  const updateStatus = trpc.admin.messages.updateStatus.useMutation({
    onSuccess: async () => { await refetch(); },
    onError: error => toast.error(error.message || "Mise à jour impossible."),
  });

  const filteredMessages = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (messages ?? []).filter(message => {
      const matchesStatus = statusFilter === "all" || message.status === statusFilter;
      const matchesSearch = !query || [message.name, message.email, message.subject || "", message.message]
        .some(value => value.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [messages, search, statusFilter]);

  const summary = useMemo(() => ({
    total: messages?.length ?? 0,
    unread: messages?.filter(message => message.status === "unread").length ?? 0,
    archived: messages?.filter(message => message.status === "archived").length ?? 0,
  }), [messages]);

  const setMessageStatus = (id: number, status: MessageStatus, successMessage: string) => {
    updateStatus.mutate({ id, status }, { onSuccess: async () => { toast.success(successMessage); await refetch(); } });
  };

  const openMessage = (message: any) => {
    setSelectedMessage(message);
    setIsOpen(true);
    if (message.status === "unread") setMessageStatus(message.id, "read", "Message marqué comme lu");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-8">
        <section className="rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50 via-white to-cyan-50 p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div><p className="mb-3 flex items-center gap-2 text-sm font-semibold text-sky-700"><Mail className="h-4 w-4" /> Service client</p><h1 className="text-3xl font-bold tracking-tight text-slate-900 md:text-4xl">Messages de contact</h1><p className="mt-2 max-w-2xl text-slate-600">Centralisez les demandes reçues depuis la boutique, suivez leur lecture et archivez celles qui sont traitées.</p></div>
            <div className="rounded-xl border border-sky-100 bg-white px-4 py-3 text-sm text-slate-700"><MessageSquare className="mr-2 inline h-4 w-4 text-sky-600" /> {summary.unread} message(s) à lire</div>
          </div>
        </section>

        <section className="grid gap-4 sm:grid-cols-3"><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Total reçu</p><p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p></CardContent></Card><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">À traiter</p><p className="mt-1 text-2xl font-bold text-rose-700">{summary.unread}</p></CardContent></Card><Card className="shadow-sm"><CardContent className="p-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Archivés</p><p className="mt-1 text-2xl font-bold text-slate-700">{summary.archived}</p></CardContent></Card></section>

        <Card className="shadow-sm"><CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center"><div className="relative flex-1"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Rechercher un nom, e-mail, sujet ou message…" /></div><Select value={statusFilter} onValueChange={value => setStatusFilter(value as "all" | MessageStatus)}><SelectTrigger className="w-full md:w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="unread">Non lus</SelectItem><SelectItem value="read">Lus</SelectItem><SelectItem value="archived">Archivés</SelectItem></SelectContent></Select><Button variant="outline" onClick={() => { setSearch(""); setStatusFilter("all"); }}>Réinitialiser</Button></CardContent></Card>

        <Card className="overflow-hidden shadow-sm"><div className="overflow-x-auto"><Table className="min-w-[920px]"><TableHeader><TableRow className="bg-slate-50/80"><TableHead>Expéditeur</TableHead><TableHead>Sujet</TableHead><TableHead>Aperçu</TableHead><TableHead>Date</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
          {isLoading ? Array.from({ length: 5 }).map((_, index) => <TableRow key={index}>{Array.from({ length: 6 }).map((__, cell) => <TableCell key={cell}><Skeleton className="h-5 w-full" /></TableCell>)}</TableRow>) : filteredMessages.length === 0 ? <TableRow><TableCell colSpan={6} className="py-16 text-center"><div className="mx-auto flex max-w-sm flex-col items-center"><div className="rounded-full bg-sky-50 p-4 text-sky-600"><MailOpen className="h-7 w-7" /></div><p className="mt-4 font-semibold text-slate-900">Aucun message trouvé</p><p className="mt-1 text-sm text-muted-foreground">Les nouveaux messages reçus via le formulaire de contact apparaîtront ici.</p></div></TableCell></TableRow> : filteredMessages.map(message => <TableRow key={message.id} className={message.status === "unread" ? "bg-sky-50/30 hover:bg-sky-50/60" : "hover:bg-slate-50/70"}><TableCell><p className="font-semibold text-slate-900">{message.name}</p><p className="text-xs text-muted-foreground">{message.email}</p></TableCell><TableCell className="font-medium text-slate-900">{message.subject || "Sans sujet"}</TableCell><TableCell className="max-w-xs truncate text-sm text-muted-foreground">{message.message}</TableCell><TableCell className="text-sm text-slate-600">{formatDate(message.createdAt)}</TableCell><TableCell><StatusBadge status={message.status} /></TableCell><TableCell className="text-right"><div className="flex justify-end gap-2"><Button variant="outline" size="sm" onClick={() => openMessage(message)}><MailOpen className="mr-1.5 h-4 w-4" /> Ouvrir</Button>{message.status !== "archived" ? <Button variant="outline" size="icon" title="Archiver" onClick={() => setMessageStatus(message.id, "archived", "Message archivé")}><Archive className="h-4 w-4" /></Button> : <Button variant="outline" size="icon" title="Rétablir comme non lu" onClick={() => setMessageStatus(message.id, "unread", "Message rétabli")}><Undo2 className="h-4 w-4" /></Button>}</div></TableCell></TableRow>)}
        </TableBody></Table></div></Card>

        <Dialog open={isOpen} onOpenChange={setIsOpen}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">{selectedMessage && <><DialogHeader><DialogTitle>{selectedMessage.subject || "Message sans sujet"}</DialogTitle><DialogDescription>Reçu le {formatDate(selectedMessage.createdAt)} · <StatusBadge status={selectedMessage.status === "unread" ? "read" : selectedMessage.status} /></DialogDescription></DialogHeader><div className="space-y-5 py-3"><div className="rounded-xl border bg-slate-50 p-4"><p className="font-semibold text-slate-900">{selectedMessage.name}</p><p className="mt-1 text-sm text-muted-foreground">{selectedMessage.email}</p></div><div className="whitespace-pre-wrap rounded-xl border p-5 leading-7 text-slate-800">{selectedMessage.message}</div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Fermer</Button><a href={`mailto:${selectedMessage.email}?subject=${encodeURIComponent(`Re: ${selectedMessage.subject || "Votre demande MAZIGHO"}`)}`}><Button type="button" className="bg-orange-500 hover:bg-orange-600"><Reply className="mr-2 h-4 w-4" /> Répondre par e-mail</Button></a>{selectedMessage.status !== "archived" && <Button type="button" variant="outline" onClick={() => { setMessageStatus(selectedMessage.id, "archived", "Message archivé"); setIsOpen(false); }}><Archive className="mr-2 h-4 w-4" /> Archiver</Button>}</DialogFooter></>}</DialogContent></Dialog>
      </div>
    </DashboardLayout>
  );
}
