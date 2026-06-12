"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Resource } from "@/lib/types";

interface HistoryFiltersProps {
  resources: Pick<Resource, "id" | "nom">[];
}

export function HistoryFilters({ resources }: HistoryFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateFilter(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "all") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/history?${params.toString()}`);
  }

  function resetFilters() {
    router.push("/history");
  }

  return (
    <div className="brand-card grid gap-4 border-0 p-4 sm:grid-cols-4">
      <div className="space-y-2">
        <Label>Date (à partir de)</Label>
        <Input
          type="date"
          defaultValue={searchParams.get("date") ?? ""}
          onChange={(e) => updateFilter("date", e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label>Ressource</Label>
        <Select
          defaultValue={searchParams.get("resource") ?? "all"}
          onValueChange={(v) => updateFilter("resource", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Toutes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les ressources</SelectItem>
            {resources.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Statut</Label>
        <Select
          defaultValue={searchParams.get("statut") ?? "all"}
          onValueChange={(v) => updateFilter("statut", v)}
        >
          <SelectTrigger>
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="en_attente">En attente</SelectItem>
            <SelectItem value="valide">Validé</SelectItem>
            <SelectItem value="refuse">Refusé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-end">
        <Button variant="outline" onClick={resetFilters} className="w-full">
          Réinitialiser
        </Button>
      </div>
    </div>
  );
}
