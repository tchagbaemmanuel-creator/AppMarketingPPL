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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RESOURCE_CATEGORIES, RESOURCE_TYPE_LABELS } from "@/lib/constants";
import { createResource, updateResource } from "@/actions/resources";
import type { Resource, ResourceType } from "@/lib/types";
import { Plus, Pencil } from "lucide-react";

interface ResourceFormDialogProps {
  resource?: Resource;
  trigger?: React.ReactNode;
}

export function ResourceFormDialog({ resource, trigger }: ResourceFormDialogProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categorie, setCategorie] = useState(resource?.categorie ?? "");
  const [type, setType] = useState<ResourceType>(resource?.type ?? "physique");
  const [isPending, startTransition] = useTransition();
  const isEdit = !!resource;

  function handleSubmit(formData: FormData) {
    setError(null);
    startTransition(async () => {
      const result = isEdit
        ? await updateResource(resource.id, formData)
        : await createResource(formData);

      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
    });
  }

  return (
    <>
      {trigger ? (
        <span onClick={() => setOpen(true)} className="inline-flex cursor-pointer">
          {trigger}
        </span>
      ) : (
        <Button
          type="button"
          onClick={() => setOpen(true)}
          className="brand-btn-primary"
        >
          {isEdit ? (
            <>
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </>
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter une ressource
            </>
          )}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier la ressource" : "Nouvelle ressource"}
          </DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="categorie" value={categorie} />
          <input type="hidden" name="type" value={type} />

          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" name="nom" defaultValue={resource?.nom} required />
          </div>

          <div className="space-y-2">
            <Label htmlFor="categorie">Catégorie</Label>
            <Select value={categorie} onValueChange={(v) => setCategorie(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Choisir une catégorie" />
              </SelectTrigger>
              <SelectContent>
                {RESOURCE_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={resource?.description ?? ""}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={(v) => v && setType(v as ResourceType)} required>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(RESOURCE_TYPE_LABELS) as ResourceType[]).map((t) => (
                    <SelectItem key={t} value={t}>
                      {RESOURCE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="quantite">Quantité en stock</Label>
              <Input
                id="quantite"
                name="quantite"
                type="number"
                min={0}
                defaultValue={resource?.quantite ?? 0}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seuil_minimum">Seuil minimum</Label>
            <Input
              id="seuil_minimum"
              name="seuil_minimum"
              type="number"
              min={0}
              defaultValue={resource?.seuil_minimum ?? 5}
              required
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isPending} className="brand-btn-primary">
              {isPending ? "Enregistrement..." : isEdit ? "Mettre à jour" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
