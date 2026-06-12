"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addStock } from "@/actions/resources";
import type { Resource } from "@/lib/types";
import { PackagePlus } from "lucide-react";

export function StockDialog({ resource }: { resource: Resource }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);
    const quantite = Number(formData.get("quantite"));
    const commentaire = formData.get("commentaire") as string;

    startTransition(async () => {
      const result = await addStock(resource.id, quantite, commentaire);
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      <Button variant="outline" size="sm" type="button" onClick={() => setOpen(true)}>
        <PackagePlus className="mr-1 h-4 w-4" />
        Stock
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ajouter du stock — {resource.nom}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Stock actuel : <strong>{resource.quantite}</strong>
          </p>
          <div className="space-y-2">
            <Label htmlFor="quantite">Quantité à ajouter</Label>
            <Input id="quantite" name="quantite" type="number" min={1} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="commentaire">Commentaire</Label>
            <Textarea id="commentaire" name="commentaire" rows={2} placeholder="Réapprovisionnement..." />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button type="submit" disabled={isPending} className="brand-btn-primary w-full">
            {isPending ? "Ajout..." : "Ajouter au stock"}
          </Button>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
