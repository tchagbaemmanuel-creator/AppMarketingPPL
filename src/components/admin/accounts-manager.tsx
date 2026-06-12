"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { approveUser, rejectUser } from "@/actions/auth";
import {
  deleteUserAccount,
  resetUserPassword,
  updateUserAccount,
} from "@/actions/accounts";
import { UserRoleBadge, UserStatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { User, UserRole, UserStatus } from "@/lib/types";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import {
  Check,
  KeyRound,
  Pencil,
  Search,
  Trash2,
  Users,
  X,
} from "lucide-react";

interface AccountsManagerProps {
  users: User[];
  currentUserId: string;
}

type DialogMode = "edit" | "password" | null;

export function AccountsManager({ users, currentUserId }: AccountsManagerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(searchParams.get("q") ?? "");

  const statusFilter = (searchParams.get("status") ?? "all") as UserStatus | "all";
  const roleFilter = (searchParams.get("role") ?? "all") as UserRole | "all";

  const stats = useMemo(
    () => ({
      total: users.length,
      pending: users.filter((u) => u.status === "en_attente").length,
      approved: users.filter((u) => u.status === "approuve").length,
    }),
    [users]
  );

  function updateFilters(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/admin/accounts?${params.toString()}`);
  }

  function applySearch() {
    updateFilters("q", searchInput.trim() || null);
  }

  function openEdit(user: User) {
    setSelectedUser(user);
    setError(null);
    setDialogMode("edit");
  }

  function openPasswordReset(user: User) {
    setSelectedUser(user);
    setError(null);
    setDialogMode("password");
  }

  function closeDialog() {
    setDialogMode(null);
    setSelectedUser(null);
    setError(null);
  }

  function handleApprove(userId: string, nom: string) {
    if (!confirm(`Approuver le compte de ${nom} ?`)) return;
    startTransition(async () => {
      const result = await approveUser(userId);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleReject(userId: string, nom: string) {
    if (!confirm(`Refuser ou suspendre le compte de ${nom} ?`)) return;
    startTransition(async () => {
      const result = await rejectUser(userId);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleDelete(userId: string, nom: string) {
    if (!confirm(`Supprimer définitivement le compte de ${nom} ? Cette action est irréversible.`)) {
      return;
    }
    startTransition(async () => {
      const result = await deleteUserAccount(userId);
      if (result.error) alert(result.error);
      else router.refresh();
    });
  }

  function handleEditSubmit(formData: FormData) {
    if (!selectedUser) return;
    setError(null);
    startTransition(async () => {
      const result = await updateUserAccount(selectedUser.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      closeDialog();
      router.refresh();
    });
  }

  function handlePasswordSubmit(formData: FormData) {
    if (!selectedUser) return;
    setError(null);
    startTransition(async () => {
      const result = await resetUserPassword(selectedUser.id, formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      closeDialog();
      alert(`Mot de passe réinitialisé pour ${selectedUser.nom}.`);
    });
  }

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="brand-card border-0">
          <CardContent className="pt-6">
            <p className="text-sm text-brand-text-muted">Total comptes</p>
            <p className="text-2xl font-bold text-brand-primary">{stats.total}</p>
          </CardContent>
        </Card>
        <Card className="brand-card border-0">
          <CardContent className="pt-6">
            <p className="text-sm text-brand-text-muted">En attente</p>
            <p className="text-2xl font-bold text-brand-warning">{stats.pending}</p>
          </CardContent>
        </Card>
        <Card className="brand-card border-0">
          <CardContent className="pt-6">
            <p className="text-sm text-brand-text-muted">Actifs</p>
            <p className="text-2xl font-bold text-brand-success">{stats.approved}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="brand-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-primary">
            <Users className="h-5 w-5" />
            Tous les comptes ({users.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-4">
            <div className="space-y-2 lg:col-span-2">
              <Label>Rechercher</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Nom, email ou fonction..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applySearch()}
                />
                <Button type="button" variant="outline" onClick={applySearch}>
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Statut</Label>
              <Select
                value={statusFilter}
                onValueChange={(v) => v && updateFilters("status", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="en_attente">En attente</SelectItem>
                  <SelectItem value="approuve">Approuvé</SelectItem>
                  <SelectItem value="refuse">Refusé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Rôle</Label>
              <Select value={roleFilter} onValueChange={(v) => v && updateFilters("role", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                  <SelectItem value="membre">Membre</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {users.length === 0 ? (
            <p className="text-sm text-brand-text-muted">Aucun compte trouvé.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Inscription</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Fonction</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="whitespace-nowrap text-sm">
                        {format(new Date(user.created_at), "dd/MM/yyyy", { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">
                        {user.nom}
                        {user.id === currentUserId && (
                          <span className="ml-2 text-xs text-brand-text-muted">(vous)</span>
                        )}
                      </TableCell>
                      <TableCell>{user.email ?? "—"}</TableCell>
                      <TableCell>{user.fonction ?? "—"}</TableCell>
                      <TableCell>
                        <UserRoleBadge role={user.role} />
                      </TableCell>
                      <TableCell>
                        <UserStatusBadge status={user.status} />
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => openEdit(user)}
                            title="Modifier"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => openPasswordReset(user)}
                            title="Réinitialiser le mot de passe"
                          >
                            <KeyRound className="h-4 w-4" />
                          </Button>
                          {user.status === "en_attente" && (
                            <>
                              <Button
                                size="sm"
                                disabled={isPending}
                                onClick={() => handleApprove(user.id, user.nom)}
                                className="bg-brand-success hover:bg-brand-success/90"
                                title="Approuver"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isPending}
                                onClick={() => handleReject(user.id, user.nom)}
                                className="text-brand-danger"
                                title="Refuser"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {user.id !== currentUserId && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleDelete(user.id, user.nom)}
                              className="text-brand-danger"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogMode === "edit"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le compte</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <AccountEditForm
              user={selectedUser}
              isPending={isPending}
              error={error}
              onSubmit={handleEditSubmit}
              onCancel={closeDialog}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogMode === "password"} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <PasswordResetForm
              userName={selectedUser.nom}
              isPending={isPending}
              error={error}
              onSubmit={handlePasswordSubmit}
              onCancel={closeDialog}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function AccountEditForm({
  user,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  user: User;
  isPending: boolean;
  error: string | null;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState<UserRole>(user.role);
  const [status, setStatus] = useState<UserStatus>(user.status);

  return (
    <form action={onSubmit} className="space-y-4">
      <input type="hidden" name="role" value={role} />
      <input type="hidden" name="status" value={status} />

      <div className="space-y-2">
        <Label htmlFor="edit-nom">Nom complet</Label>
        <Input id="edit-nom" name="nom" defaultValue={user.nom} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-email">Email</Label>
        <Input id="edit-email" name="email" type="email" defaultValue={user.email ?? ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-fonction">Fonction</Label>
        <Input id="edit-fonction" name="fonction" defaultValue={user.fonction ?? ""} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Rôle</Label>
          <Select value={role} onValueChange={(v) => v && setRole(v as UserRole)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="membre">Membre</SelectItem>
              <SelectItem value="admin">Administrateur</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Statut</Label>
          <Select value={status} onValueChange={(v) => v && setStatus(v as UserStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en_attente">En attente</SelectItem>
              <SelectItem value="approuve">Approuvé</SelectItem>
              <SelectItem value="refuse">Refusé</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && (
        <p className="rounded-lg bg-brand-danger-bg px-3 py-2 text-sm text-brand-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending} className="brand-btn-primary">
          {isPending ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

function PasswordResetForm({
  userName,
  isPending,
  error,
  onSubmit,
  onCancel,
}: {
  userName: string;
  isPending: boolean;
  error: string | null;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
}) {
  return (
    <form action={onSubmit} className="space-y-4">
      <p className="text-sm text-brand-text-muted">
        Définir un nouveau mot de passe pour <strong>{userName}</strong>.
      </p>

      <div className="space-y-2">
        <Label htmlFor="new-password">Nouveau mot de passe</Label>
        <Input id="new-password" name="password" type="password" minLength={8} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm-password">Confirmer</Label>
        <Input
          id="confirm-password"
          name="confirmPassword"
          type="password"
          minLength={8}
          required
        />
      </div>

      {error && (
        <p className="rounded-lg bg-brand-danger-bg px-3 py-2 text-sm text-brand-danger">{error}</p>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Annuler
        </Button>
        <Button type="submit" disabled={isPending} className="brand-btn-primary">
          {isPending ? "Enregistrement..." : "Réinitialiser"}
        </Button>
      </div>
    </form>
  );
}
