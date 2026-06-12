"use client";

import { useTransition } from "react";
import { approveUser, rejectUser } from "@/actions/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { User } from "@/lib/types";
import { Check, UserPlus, X } from "lucide-react";

interface PendingUsersTableProps {
  users: User[];
}

export function PendingUsersTable({ users }: PendingUsersTableProps) {
  const [isPending, startTransition] = useTransition();

  function handleApprove(id: string, nom: string) {
    if (!confirm(`Approuver l'inscription de ${nom} ?`)) return;
    startTransition(async () => {
      const result = await approveUser(id);
      if (result.error) alert(result.error);
    });
  }

  function handleReject(id: string, nom: string) {
    if (!confirm(`Refuser l'inscription de ${nom} ?`)) return;
    startTransition(async () => {
      const result = await rejectUser(id);
      if (result.error) alert(result.error);
    });
  }

  return (
    <Card className="brand-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-primary">
          <UserPlus className="h-5 w-5" />
          Inscriptions en attente ({users.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <p className="text-sm text-brand-text-muted">
            Aucune demande d&apos;inscription en attente.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {format(new Date(user.created_at), "dd/MM/yyyy HH:mm", {
                        locale: fr,
                      })}
                    </TableCell>
                    <TableCell className="font-medium">{user.nom}</TableCell>
                    <TableCell>{user.email ?? "—"}</TableCell>
                    <TableCell>{user.fonction ?? "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleApprove(user.id, user.nom)}
                          className="bg-brand-success hover:bg-brand-success/90"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleReject(user.id, user.nom)}
                          className="text-brand-danger"
                        >
                          <X className="h-4 w-4" />
                        </Button>
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
  );
}
