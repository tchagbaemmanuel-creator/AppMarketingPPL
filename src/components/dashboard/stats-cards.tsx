import { Card, CardContent } from "@/components/ui/card";
import { Package, Boxes, Clock, CheckCircle2 } from "lucide-react";
import type { DashboardStats } from "@/lib/types";
import { cn } from "@/lib/utils";

const cards = [
  {
    key: "totalResources" as const,
    label: "Ressources",
    icon: Package,
    iconBg: "bg-brand-primary/10 text-brand-primary",
  },
  {
    key: "totalStock" as const,
    label: "Stock total",
    icon: Boxes,
    iconBg: "bg-brand-success-bg text-brand-success",
  },
  {
    key: "pendingRequests" as const,
    label: "En attente",
    icon: Clock,
    iconBg: "bg-brand-warning-bg text-brand-warning",
  },
  {
    key: "completedWithdrawals" as const,
    label: "Retraits effectués",
    icon: CheckCircle2,
    iconBg: "bg-brand-accent/15 text-brand-secondary",
  },
];

export function StatsCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        return (
          <Card key={card.key} className="brand-card overflow-hidden border-0">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={cn("rounded-xl p-3", card.iconBg)}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-brand-text-muted">{card.label}</p>
                <p className="text-2xl font-bold text-brand-primary">{stats[card.key]}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
