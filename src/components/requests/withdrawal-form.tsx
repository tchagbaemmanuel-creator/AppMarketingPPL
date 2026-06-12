"use client";

import { useState, useTransition } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createWithdrawalRequest } from "@/actions/requests";
import type { Resource } from "@/lib/types";
import { Send } from "lucide-react";

interface WithdrawalFormProps {
  resources: Resource[];
  defaultDemandeur?: string;
  defaultFonction?: string;
}

export function WithdrawalForm({
  resources,
  defaultDemandeur,
  defaultFonction,
}: WithdrawalFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [resourceId, setResourceId] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setError(null);
    setSuccess(false);
    startTransition(async () => {
      const result = await createWithdrawalRequest(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setSuccess(true);
    });
  }

  const availableResources = resources.filter((r) => r.quantite > 0);

  return (
    <Card className="brand-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-brand-primary">
          <Send className="h-5 w-5" />
          Nouvelle demande de retrait
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <input type="hidden" name="resource_id" value={resourceId} />
          <div className="space-y-2">
            <Label htmlFor="demandeur">Nom du demandeur</Label>
            <Input
              id="demandeur"
              name="demandeur"
              defaultValue={defaultDemandeur}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="fonction">Fonction</Label>
            <Input
              id="fonction"
              name="fonction"
              defaultValue={defaultFonction}
              placeholder="Ex : Responsable formation"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource_id">Ressource demandée</Label>
            <Select value={resourceId} onValueChange={(v) => setResourceId(v ?? "")} required>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une ressource" />
              </SelectTrigger>
              <SelectContent>
                {availableResources.map((resource) => (
                  <SelectItem key={resource.id} value={resource.id}>
                    {resource.nom} ({resource.quantite} disponibles)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantite">Quantité</Label>
            <Input id="quantite" name="quantite" type="number" min={1} required />
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="motif">Motif</Label>
            <Textarea
              id="motif"
              name="motif"
              rows={3}
              placeholder="Décrivez la raison de la demande..."
              required
            />
          </div>

          {error && <p className="text-sm text-red-600 sm:col-span-2">{error}</p>}
          {success && (
            <p className="text-sm text-emerald-600 sm:col-span-2">
              Demande enregistrée avec succès. Statut : En attente.
            </p>
          )}

          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={isPending || availableResources.length === 0}
              className="brand-btn-primary"
            >
              {isPending ? "Envoi..." : "Soumettre la demande"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
