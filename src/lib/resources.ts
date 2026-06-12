import type { Resource, StockStatus } from "./types";

export function getStockStatus(resource: Pick<Resource, "quantite" | "seuil_minimum">): StockStatus {
  if (resource.quantite === 0) return "rupture";
  if (resource.quantite <= resource.seuil_minimum) return "stock_faible";
  return "disponible";
}

export const STOCK_STATUS_LABELS: Record<StockStatus, string> = {
  disponible: "Disponible",
  stock_faible: "Stock faible",
  rupture: "Rupture",
};
