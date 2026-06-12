"use client";

import { useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RequestStatusBadge } from "@/components/shared/status-badge";
import { updateRequestStatus } from "@/actions/requests";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { WithdrawalRequest } from "@/lib/types";
import { Check, X } from "lucide-react";

export function PendingRequests({ requests }: { requests: WithdrawalRequest[] }) {
  const [isPending, startTransition] = useTransition();

  function handleAction(id: string, statut: "valide" | "refuse") {
    const label = statut === "valide" ? "valider" : "refuser";
    if (!confirm(`Confirmer : ${label} cette demande ?`)) return;

    startTransition(async () => {
      const result = await updateRequestStatus(id, statut);
      if (result.error) alert(result.error);
    });
  }

  const pending = requests.filter((r) => r.statut === "en_attente");

  return (
    <Card className="brand-card border-0">
      <CardHeader>
        <CardTitle className="text-brand-primary">
          Demandes en attente ({pending.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pending.length === 0 ? (
          <p className="text-sm text-muted-foreground">Aucune demande en attente.</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Fonction</TableHead>
                  <TableHead>Ressource</TableHead>
                  <TableHead>Qté</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pending.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="text-sm whitespace-nowrap">
                      {format(new Date(req.created_at), "dd/MM/yyyy", { locale: fr })}
                    </TableCell>
                    <TableCell>{req.demandeur}</TableCell>
                    <TableCell>{req.fonction}</TableCell>
                    <TableCell>{req.resources?.nom ?? "—"}</TableCell>
                    <TableCell>{req.quantite}</TableCell>
                    <TableCell className="max-w-[200px] truncate" title={req.motif}>
                      {req.motif}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          disabled={isPending}
                          onClick={() => handleAction(req.id, "valide")}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleAction(req.id, "refuse")}
                          className="text-red-600"
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

export function AllRequestsTable({ requests }: { requests: WithdrawalRequest[] }) {
  return (
    <Card className="brand-card border-0">
      <CardHeader>
        <CardTitle className="text-brand-primary">Toutes les demandes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Demandeur</TableHead>
                <TableHead>Ressource</TableHead>
                <TableHead>Qté</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell>
                    {format(new Date(req.created_at), "dd/MM/yyyy", { locale: fr })}
                  </TableCell>
                  <TableCell>{req.demandeur}</TableCell>
                  <TableCell>{req.resources?.nom ?? "—"}</TableCell>
                  <TableCell>{req.quantite}</TableCell>
                  <TableCell>
                    <RequestStatusBadge status={req.statut} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
