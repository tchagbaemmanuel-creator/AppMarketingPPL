import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS_LABELS } from "@/lib/constants";
import { STOCK_STATUS_LABELS } from "@/lib/resources";
import type { RequestStatus, StockStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const stockVariants: Record<StockStatus, string> = {
  disponible: "bg-brand-success-bg text-brand-success border-brand-success/20",
  stock_faible: "bg-brand-warning-bg text-brand-warning border-brand-warning/20",
  rupture: "bg-brand-danger-bg text-brand-danger border-brand-danger/20",
};

const requestVariants: Record<RequestStatus, string> = {
  en_attente: "bg-brand-warning-bg text-brand-warning border-brand-warning/20",
  valide: "bg-brand-success-bg text-brand-success border-brand-success/20",
  refuse: "bg-brand-danger-bg text-brand-danger border-brand-danger/20",
};

export function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", stockVariants[status])}>
      {STOCK_STATUS_LABELS[status]}
    </Badge>
  );
}

export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", requestVariants[status])}>
      {REQUEST_STATUS_LABELS[status]}
    </Badge>
  );
}
