import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS_LABELS, USER_ROLE_LABELS, USER_STATUS_LABELS } from "@/lib/constants";
import { STOCK_STATUS_LABELS } from "@/lib/resources";
import type { RequestStatus, StockStatus, UserRole, UserStatus } from "@/lib/types";
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

const userStatusVariants: Record<UserStatus, string> = {
  en_attente: "bg-brand-warning-bg text-brand-warning border-brand-warning/20",
  approuve: "bg-brand-success-bg text-brand-success border-brand-success/20",
  refuse: "bg-brand-danger-bg text-brand-danger border-brand-danger/20",
};

const userRoleVariants: Record<UserRole, string> = {
  admin: "bg-brand-primary/10 text-brand-primary border-brand-primary/20",
  membre: "bg-brand-background-subtle text-brand-text-muted border-brand-border",
};

export function UserStatusBadge({ status }: { status: UserStatus }) {
  return (
    <Badge variant="outline" className={cn("font-medium", userStatusVariants[status])}>
      {USER_STATUS_LABELS[status]}
    </Badge>
  );
}

export function UserRoleBadge({ role }: { role: UserRole }) {
  return (
    <Badge variant="outline" className={cn("font-medium", userRoleVariants[role])}>
      {USER_ROLE_LABELS[role]}
    </Badge>
  );
}
