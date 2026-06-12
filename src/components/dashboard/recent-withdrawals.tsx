import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { RequestStatusBadge } from "@/components/shared/status-badge";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { WithdrawalRequest } from "@/lib/types";

export function RecentWithdrawals({ requests }: { requests: WithdrawalRequest[] }) {
  return (
    <Card className="brand-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold text-brand-primary">
          5 derniers retraits
        </CardTitle>
      </CardHeader>
      <CardContent>
        {requests.length === 0 ? (
          <p className="py-4 text-center text-sm text-brand-text-muted">
            Aucun retrait enregistré.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-brand-text-muted">Date</TableHead>
                <TableHead className="text-brand-text-muted">Demandeur</TableHead>
                <TableHead className="text-brand-text-muted">Ressource</TableHead>
                <TableHead className="text-brand-text-muted">Qté</TableHead>
                <TableHead className="text-brand-text-muted">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {requests.map((req) => (
                <TableRow key={req.id}>
                  <TableCell className="text-sm">
                    {format(new Date(req.created_at), "dd MMM yyyy", { locale: fr })}
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
        )}
      </CardContent>
    </Card>
  );
}
