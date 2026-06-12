"use client";

import { useTransition } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { StockStatusBadge } from "@/components/shared/status-badge";
import { ResourceFormDialog } from "./resource-form-dialog";
import { StockDialog } from "./stock-dialog";
import { deleteResource } from "@/actions/resources";
import { getStockStatus } from "@/lib/resources";
import { RESOURCE_TYPE_LABELS } from "@/lib/constants";
import type { Resource } from "@/lib/types";
import { Trash2 } from "lucide-react";

export function ResourceTable({ resources }: { resources: Resource[] }) {
  const [isPending, startTransition] = useTransition();

  function handleDelete(id: string, nom: string) {
    if (!confirm(`Supprimer la ressource « ${nom} » ?`)) return;
    startTransition(async () => {
      await deleteResource(id);
    });
  }

  if (resources.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">Aucune ressource enregistrée.</p>
    );
  }

  return (
    <div className="brand-card overflow-x-auto border-0">
      <Table>
        <TableHeader>
          <TableRow className="bg-brand-background-subtle hover:bg-brand-background-subtle">
            <TableHead>Nom</TableHead>
            <TableHead>Catégorie</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Quantité</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {resources.map((resource) => (
            <TableRow key={resource.id}>
              <TableCell className="font-medium">{resource.nom}</TableCell>
              <TableCell>{resource.categorie}</TableCell>
              <TableCell>{RESOURCE_TYPE_LABELS[resource.type]}</TableCell>
              <TableCell>{resource.quantite}</TableCell>
              <TableCell>
                <StockStatusBadge status={getStockStatus(resource)} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-1">
                  <StockDialog resource={resource} />
                  <ResourceFormDialog
                    resource={resource}
                    trigger={
                      <Button variant="outline" size="sm">
                        Modifier
                      </Button>
                    }
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleDelete(resource.id, resource.nom)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
