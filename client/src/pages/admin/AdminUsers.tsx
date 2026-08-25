import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2, Mail, Pencil, Shield, ShieldBan, ShieldCheck, Trash2, User, UserCog, UserPlus, Search, RotateCcw, SlidersHorizontal } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type Role = "user" | "catalog_editor" | "support_agent" | "order_operator" | "admin";
type AccountStatus = "pending_invitation" | "active" | "blocked";
type AccountView = "all" | "clients" | "internal";

const roleLabels: Record<Role, string> = {
  user: "Client",
  catalog_editor: "Éditeur catalogue",
  support_agent: "Service client",
  order_operator: "Opérateur commandes",
  admin: "Administrateur",
};

const assignableRoles: Role[] = ["user", "catalog_editor", "support_agent", "order_operator", "admin"];
const roleFilterLabels: Record<Role, string> = {
  user: "Clients",
  catalog_editor: "Éditeurs catalogue",
  support_agent: "Service client",
  order_operator: "Opérateurs commandes",
  admin: "Administrateurs",
};
type UserRow = {
  id: number;
  name: string | null;
  email: string | null;
  role: Role;
  accountStatus: AccountStatus;
  lastSignedIn: Date | string | null;
};
type SensitiveAction = "block" | "unblock" | "demote" | "promote" | "delete";
type ManualInvitation = { name: string; email: string; role?: Role; link: string; expiresAt: Date | string };

function getActionLabel(action: SensitiveAction) {
  switch (action) {
    case "block": return "Bloquer";
    case "unblock": return "Débloquer";
    case "demote": return "Rétrograder";
    case "promote": return "Promouvoir";
    case "delete": return "Supprimer";
  }
}

function getConfirmationKeyword(action: SensitiveAction) {
  switch (action) {
    case "block": return "BLOQUER";
    case "demote": return "RETROGRADER";
    case "delete": return "SUPPRIMER";
    default: return "";
  }
}

export default function AdminUsers() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", role: "user" as Role });
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [editForm, setEditForm] = useState({ name: "", email: "" });
  const [sensitive, setSensitive] = useState<{ target: UserRow; action: SensitiveAction } | null>(null);
  const [confirmation, setConfirmation] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | Role>("all");
  const [accountStatusFilter, setAccountStatusFilter] = useState<"all" | AccountStatus>("all");
  const [accountView, setAccountView] = useState<AccountView>("all");
  const [manualInvitation, setManualInvitation] = useState<ManualInvitation | null>(null);

  const utils = trpc.useUtils();
  const { data: currentUser } = trpc.auth.me.useQuery();
  const { data: users, isLoading, refetch } = trpc.admin.users.getAll.useQuery();

  const createUser = trpc.admin.users.create.useMutation({
    onSuccess: async result => {
      setManualInvitation({
        name: result.recipient.name,
        email: result.recipient.email,
        role: result.recipient.role as Role,
        link: result.invitationLink,
        expiresAt: result.invitationExpiresAt,
      });
      toast.success("Invitation créée. Copiez maintenant le lien personnel.");
      setIsCreateOpen(false);
      setCreateForm({ name: "", email: "", role: "user" });
      await refetch();
    },
    onError: error => toast.error(error.message || "Création impossible."),
  });

  const resendInvitation = trpc.admin.users.resendInvitation.useMutation({
    onSuccess: async result => {
      setManualInvitation({
        name: result.recipient.name,
        email: result.recipient.email,
        link: result.invitationLink,
        expiresAt: result.invitationExpiresAt,
      });
      toast.success("Nouveau lien créé. L’ancien lien a été invalidé.");
      await refetch();
    },
    onError: error => toast.error(error.message || "Renvoi impossible."),
  });

  const updateProfile = trpc.admin.users.updateProfile.useMutation({
    onSuccess: async () => {
      toast.success("Profil utilisateur mis à jour.");
      setEditTarget(null);
      await refetch();
    },
    onError: error => toast.error(error.message || "Modification impossible."),
  });

  const updateRole = trpc.admin.users.updateRole.useMutation({
    onSuccess: async () => {
      toast.success("Rôle mis à jour.");
      setSensitive(null);
      setConfirmation("");
      await refetch();
    },
    onError: error => toast.error(error.message || "Modification impossible."),
  });

  const setAccountStatus = trpc.admin.users.setAccountStatus.useMutation({
    onSuccess: async () => {
      toast.success("Statut du compte mis à jour.");
      setSensitive(null);
      setConfirmation("");
      await refetch();
    },
    onError: error => toast.error(error.message || "Modification impossible."),
  });

  const deleteUser = trpc.admin.users.delete.useMutation({
    onSuccess: async () => {
      toast.success("Utilisateur supprimé.");
      setSensitive(null);
      setConfirmation("");
      await refetch();
    },
    onError: error => toast.error(error.message || "Suppression impossible."),
  });

  const mutationPending = createUser.isPending || resendInvitation.isPending || updateProfile.isPending || updateRole.isPending || setAccountStatus.isPending || deleteUser.isPending;
  const copyInvitationLink = async () => {
    if (!manualInvitation) return;
    try {
      await navigator.clipboard.writeText(manualInvitation.link);
      toast.success("Lien copié. Envoyez-le vous-même au collaborateur.");
    } catch {
      toast.info("Copiez le lien affiché manuellement.");
    }
  };
  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return (users || []).filter(rawUser => {
      const user = rawUser as UserRow;
      const matchesQuery = !normalizedQuery || [user.name, user.email]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalizedQuery));
      const matchesRole = roleFilter === "all" || user.role === roleFilter;
      const matchesStatus = accountStatusFilter === "all" || user.accountStatus === accountStatusFilter;
      const matchesView = accountView === "all" || (accountView === "clients" ? user.role === "user" : user.role !== "user");
      return matchesQuery && matchesRole && matchesStatus && matchesView;
    });
  }, [users, searchQuery, roleFilter, accountStatusFilter, accountView]);
  const selectAccountView = (view: AccountView) => {
    setAccountView(view);
    setRoleFilter("all");
  };
  const clearUserFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setAccountStatusFilter("all");
    setAccountView("all");
  };
  const expectedPhrase = useMemo(() => {
    if (!sensitive || sensitive.target.role !== "admin") return "";
    const keyword = getConfirmationKeyword(sensitive.action);
    return keyword && sensitive.target.email ? `${keyword} ${sensitive.target.email.toLowerCase()}` : "";
  }, [sensitive]);

  const openEdit = (user: UserRow) => {
    setEditTarget(user);
    setEditForm({ name: user.name || "", email: user.email || "" });
  };

  const submitCreate = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    createUser.mutate(createForm);
  };

  const submitEdit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editTarget) return;
    updateProfile.mutate({ id: editTarget.id, ...editForm });
  };

  const runSensitiveAction = () => {
    if (!sensitive) return;
    const { target, action } = sensitive;
    const confirmationValue = expectedPhrase ? confirmation : undefined;

    if (expectedPhrase && confirmation !== expectedPhrase) {
      toast.error("La phrase de confirmation ne correspond pas exactement.");
      return;
    }

    if (action === "block" || action === "unblock") {
      setAccountStatus.mutate({ id: target.id, accountStatus: action === "block" ? "blocked" : "active", confirmation: confirmationValue });
      return;
    }
    if (action === "demote" || action === "promote") {
      updateRole.mutate({ id: target.id, role: action === "demote" ? "user" : "admin", confirmation: confirmationValue });
      return;
    }
    deleteUser.mutate({ id: target.id, confirmation: confirmationValue });
  };

  const statusLabel = (status: AccountStatus) => {
    if (status === "pending_invitation") return "Invitation en attente";
    if (status === "blocked") return "Bloqué";
    return "Actif";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion des utilisateurs</h1>
            <p className="text-muted-foreground">Créez des invitations, modifiez les profils et gérez les autorisations sans retirer la sécurité du compte administrateur.</p>
          </div>
          <Button className="bg-orange-500 hover:bg-orange-600" onClick={() => setIsCreateOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Inviter un utilisateur
          </Button>
        </div>

        <div className="rounded-lg border bg-amber-50 p-4 text-sm text-amber-950">
          <div className="flex items-start gap-3">
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
            <p><strong>Protection administrateur :</strong> vous ne pouvez pas gérer votre propre ligne ici. Pour bloquer, rétrograder ou supprimer un autre administrateur, une double confirmation avec une phrase écrite est obligatoire. MAZIGHO conservera toujours au moins un administrateur actif.</p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrer par catégorie de compte">
            <Button type="button" size="sm" variant={accountView === "all" ? "default" : "outline"} onClick={() => selectAccountView("all")} className={accountView === "all" ? "bg-slate-900 hover:bg-slate-800" : ""}>Tous les comptes ({users?.length ?? 0})</Button>
            <Button type="button" size="sm" variant={accountView === "clients" ? "default" : "outline"} onClick={() => selectAccountView("clients")} className={accountView === "clients" ? "bg-orange-500 hover:bg-orange-600" : ""}>Clients ({users?.filter(rawUser => (rawUser as UserRow).role === "user").length ?? 0})</Button>
            <Button type="button" size="sm" variant={accountView === "internal" ? "default" : "outline"} onClick={() => selectAccountView("internal")} className={accountView === "internal" ? "bg-teal-600 hover:bg-teal-700" : ""}>Équipe interne ({users?.filter(rawUser => (rawUser as UserRow).role !== "user").length ?? 0})</Button>
          </div>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><div className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-purple-600" /><h2 className="font-semibold text-slate-900">Recherche et suivi des comptes</h2></div><p className="mt-1 text-sm text-muted-foreground">{isLoading ? "Chargement des comptes…" : `${filteredUsers.length} compte(s) affiché(s) sur ${users?.length ?? 0}`}</p></div>
            <Button type="button" variant="ghost" size="sm" onClick={clearUserFilters} disabled={!searchQuery && roleFilter === "all" && accountStatusFilter === "all" && accountView === "all"} className="self-start text-slate-600 hover:bg-slate-100 lg:self-auto"><RotateCcw className="mr-2 h-4 w-4" /> Réinitialiser</Button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,1.5fr)_1fr_1fr]">
            <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" /><Input value={searchQuery} onChange={event => setSearchQuery(event.target.value)} className="pl-9" placeholder="Nom ou adresse e-mail…" /></div>
            <select value={roleFilter} onChange={event => setRoleFilter(event.target.value as typeof roleFilter)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">Tous les rôles</option>{assignableRoles.map(role => <option key={role} value={role}>{roleFilterLabels[role]}</option>)}</select>
            <select value={accountStatusFilter} onChange={event => setAccountStatusFilter(event.target.value as typeof accountStatusFilter)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">Tous les statuts</option><option value="active">Actifs</option><option value="pending_invitation">Invitations en attente</option><option value="blocked">Bloqués</option></select>
          </div>
        </section>

        <div className="overflow-hidden rounded-lg border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Dernière connexion</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell><TableCell><Skeleton className="h-4 w-48" /></TableCell><TableCell><Skeleton className="h-4 w-20" /></TableCell><TableCell><Skeleton className="h-4 w-28" /></TableCell><TableCell><Skeleton className="h-4 w-24" /></TableCell><TableCell><Skeleton className="ml-auto h-8 w-36" /></TableCell>
                  </TableRow>
                ))
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="py-10 text-center text-muted-foreground"><div className="flex flex-col items-center gap-2"><p>{users?.length === 0 ? "Aucun utilisateur trouvé." : "Aucun compte ne correspond à ces filtres."}</p>{users?.length ? <Button variant="outline" size="sm" onClick={clearUserFilters}>Effacer les filtres</Button> : null}</div></TableCell></TableRow>
              ) : filteredUsers.map(rawUser => {
                const user = rawUser as UserRow;
                const isSelf = currentUser?.id === user.id;
                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium"><div className="flex items-center gap-3"><div className="rounded bg-purple-50 p-2"><User className="h-4 w-4 text-purple-500" /></div>{user.name || "Utilisateur sans nom"}</div></TableCell>
                    <TableCell>{user.email || "—"}</TableCell>
                    <TableCell><Badge variant={user.role === "admin" ? "default" : user.role === "user" ? "secondary" : "outline"}>{user.role === "admin" ? <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> {roleLabels[user.role]}</span> : roleLabels[user.role]}</Badge></TableCell>
                    <TableCell><Badge variant={user.accountStatus === "blocked" ? "destructive" : user.accountStatus === "pending_invitation" ? "secondary" : "outline"}>{statusLabel(user.accountStatus)}</Badge></TableCell>
                    <TableCell>{user.lastSignedIn ? new Date(user.lastSignedIn).toLocaleDateString() : "Jamais"}</TableCell>
                    <TableCell className="text-right">
                      {isSelf ? <span className="text-xs text-muted-foreground">Votre compte</span> : (
                        <div className="flex flex-wrap justify-end gap-2">
                          <Button variant="outline" size="sm" disabled={mutationPending} onClick={() => openEdit(user)}><Pencil className="mr-1 h-4 w-4" /> Modifier</Button>
                          {user.accountStatus === "pending_invitation" && <Button variant="outline" size="sm" disabled={mutationPending} onClick={() => resendInvitation.mutate({ id: user.id })}><Mail className="mr-1 h-4 w-4" /> Renvoyer l’invitation</Button>}
                          {user.role !== "admin" && <select aria-label={`Rôle de ${user.email || user.name || "cet utilisateur"}`} value={user.role} onChange={event => updateRole.mutate({ id: user.id, role: event.target.value as Role })} disabled={mutationPending} className="h-8 max-w-44 rounded-md border border-input bg-background px-2 text-xs ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{assignableRoles.filter(role => role !== "admin").map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select>}
                          <Button variant="outline" size="sm" disabled={mutationPending} onClick={() => setSensitive({ target: user, action: user.role === "admin" ? "demote" : "promote" })}><UserCog className="mr-1 h-4 w-4" /> {user.role === "admin" ? "Rétrograder" : "Élever admin"}</Button>
                          <Button variant="outline" size="sm" disabled={mutationPending} onClick={() => setSensitive({ target: user, action: user.accountStatus === "blocked" ? "unblock" : "block" })}><ShieldBan className="mr-1 h-4 w-4" /> {user.accountStatus === "blocked" ? "Débloquer" : "Bloquer"}</Button>
                          <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" disabled={mutationPending} onClick={() => setSensitive({ target: user, action: "delete" })}><Trash2 className="mr-1 h-4 w-4" /> Supprimer</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Inviter un utilisateur</DialogTitle><DialogDescription>Le compte restera en attente jusqu’au choix de son mot de passe depuis un lien personnel.</DialogDescription></DialogHeader>
          <form onSubmit={submitCreate} className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="invite-name">Nom complet</Label><Input id="invite-name" value={createForm.name} onChange={event => setCreateForm({ ...createForm, name: event.target.value })} placeholder="Jean Dupont" required /></div>
            <div className="space-y-2"><Label htmlFor="invite-email">Adresse e-mail</Label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" /><Input id="invite-email" type="email" className="pl-10" value={createForm.email} onChange={event => setCreateForm({ ...createForm, email: event.target.value })} placeholder="jean.dupont@exemple.ch" required /></div></div>
            <div className="space-y-2"><Label htmlFor="invite-role">Rôle à attribuer</Label><select id="invite-role" value={createForm.role} onChange={event => setCreateForm({ ...createForm, role: event.target.value as Role })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{assignableRoles.map(role => <option key={role} value={role}>{roleLabels[role]}</option>)}</select><p className="text-xs text-muted-foreground">La personne recevra un lien personnel et ne verra que les écrans nécessaires à sa mission.</p></div>
            <DialogFooter><Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)}>Annuler</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={createUser.isPending}>{createUser.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Créer l’invitation</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(manualInvitation)} onOpenChange={open => !open && setManualInvitation(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader><DialogTitle>Lien personnel prêt à envoyer</DialogTitle><DialogDescription>Vous êtes le seul à voir ce lien. Copiez-le, puis envoyez-le vous-même à la bonne personne par le canal de votre choix.</DialogDescription></DialogHeader>
          {manualInvitation && <div className="space-y-4 py-3"><div className="rounded-lg border border-orange-100 bg-orange-50 p-3 text-sm text-orange-950"><p><strong>Destinataire :</strong> {manualInvitation.name} · {manualInvitation.email}</p>{manualInvitation.role && <p className="mt-1"><strong>Mission :</strong> {roleLabels[manualInvitation.role]}</p>}<p className="mt-1"><strong>Expiration :</strong> {new Date(manualInvitation.expiresAt).toLocaleString("fr-CH")}</p></div><div className="space-y-2"><Label htmlFor="manual-invitation-link">Lien d’activation personnel</Label><Textarea id="manual-invitation-link" value={manualInvitation.link} readOnly rows={4} className="font-mono text-xs" /></div><p className="text-xs leading-5 text-muted-foreground">Le lien est valable une journée. Un nouveau lien invalide immédiatement le précédent. Ne le publiez jamais dans un espace public.</p></div>}
          <DialogFooter><Button type="button" variant="outline" onClick={() => setManualInvitation(null)}>Fermer</Button><Button type="button" className="bg-orange-600 hover:bg-orange-700" onClick={copyInvitationLink}>Copier le lien</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editTarget)} onOpenChange={open => !open && setEditTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Modifier le profil</DialogTitle><DialogDescription>Le rôle, le blocage et la suppression se font séparément avec leurs garde-fous.</DialogDescription></DialogHeader>
          <form onSubmit={submitEdit} className="space-y-4 py-4">
            <div className="space-y-2"><Label htmlFor="edit-name">Nom complet</Label><Input id="edit-name" value={editForm.name} onChange={event => setEditForm({ ...editForm, name: event.target.value })} required /></div>
            <div className="space-y-2"><Label htmlFor="edit-email">Adresse e-mail</Label><Input id="edit-email" type="email" value={editForm.email} onChange={event => setEditForm({ ...editForm, email: event.target.value })} required /></div>
            <DialogFooter><Button type="button" variant="ghost" onClick={() => setEditTarget(null)}>Annuler</Button><Button type="submit" className="bg-orange-500 hover:bg-orange-600" disabled={updateProfile.isPending}>{updateProfile.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(sensitive)} onOpenChange={open => { if (!open) { setSensitive(null); setConfirmation(""); } }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-600" /> {sensitive ? `${getActionLabel(sensitive.action)} un compte` : "Action sensible"}</DialogTitle><DialogDescription>{sensitive?.action === "delete" ? "Cette action est irréversible. Un compte ayant des commandes ne pourra pas être supprimé." : "Cette action modifie immédiatement les accès au compte."}</DialogDescription></DialogHeader>
          {sensitive && <div className="space-y-4 py-4"><div className="rounded-lg bg-muted p-3 text-sm"><p><strong>Compte ciblé :</strong> {sensitive.target.email || "sans e-mail"}</p><p><strong>Rôle :</strong> {roleLabels[sensitive.target.role]}</p></div>{expectedPhrase && <div className="space-y-2"><Label htmlFor="admin-confirmation">Pour confirmer, saisissez exactement :</Label><code className="block break-all rounded bg-slate-950 p-3 text-xs text-white">{expectedPhrase}</code><Input id="admin-confirmation" value={confirmation} onChange={event => setConfirmation(event.target.value)} autoComplete="off" placeholder={expectedPhrase} /></div>}<p className="text-sm text-muted-foreground">{expectedPhrase ? "Cette seconde confirmation écrite est également vérifiée par le serveur." : "Confirmez l’action ci-dessous."}</p></div>}
          <DialogFooter><Button type="button" variant="ghost" onClick={() => { setSensitive(null); setConfirmation(""); }}>Annuler</Button><Button type="button" variant={sensitive?.action === "delete" ? "destructive" : "default"} className={sensitive?.action !== "delete" ? "bg-orange-500 hover:bg-orange-600" : ""} disabled={mutationPending || Boolean(expectedPhrase && confirmation !== expectedPhrase)} onClick={runSensitiveAction}>{mutationPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{sensitive ? getActionLabel(sensitive.action) : "Confirmer"}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
