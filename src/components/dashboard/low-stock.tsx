import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StockStatusBadge } from "@/components/shared/status-badge";
import { getStockStatus } from "@/lib/resources";
import type { Resource } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

export function LowStockResources({ resources }: { resources: Resource[] }) {
  const lowStock = resources
    .filter((r) => {
      const status = getStockStatus(r);
      return status === "stock_faible" || status === "rupture";
    })
    .slice(0, 5);

  return (
    <Card className="brand-card border-0">
      <CardHeader className="flex flex-row items-center gap-2 pb-3">
        <div className="rounded-lg bg-brand-warning-bg p-2">
          <AlertTriangle className="h-4 w-4 text-brand-warning" />
        </div>
        <CardTitle className="text-base font-semibold text-brand-primary">
          Stock faible / rupture
        </CardTitle>
      </CardHeader>
      <CardContent>
        {lowStock.length === 0 ? (
          <p className="py-4 text-center text-sm text-brand-text-muted">
            Tous les stocks sont suffisants.
          </p>
        ) : (
          <ul className="space-y-2">
            {lowStock.map((resource) => (
              <li
                key={resource.id}
                className="flex items-center justify-between rounded-xl border border-brand-border-subtle bg-brand-background-subtle px-4 py-3"
              >
                <div>
                  <p className="font-medium text-brand-text">{resource.nom}</p>
                  <p className="text-xs text-brand-text-muted">{resource.categorie}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-primary">
                    {resource.quantite} restants
                  </span>
                  <StockStatusBadge status={getStockStatus(resource)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
