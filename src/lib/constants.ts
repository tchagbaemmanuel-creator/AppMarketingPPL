export const RESOURCE_CATEGORIES = [
  "Calendriers",
  "T-shirts AA",
  "T-shirts ASM",
  "Brochures",
  "Fournitures de bureau",
  "Affiches",
  "Flyers",
  "Livret de formation AA",
  "Livret de formation ASM",
  "Supports PDF",
  "Documents de formation",
  "Coaching AA",
  "Coaching ASM",
] as const;

export const RESOURCE_TYPE_LABELS: Record<string, string> = {
  physique: "Physique",
  numerique: "Numérique",
  service: "Service",
};

export const REQUEST_STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  valide: "Validé",
  refuse: "Refusé",
};

export const USER_STATUS_LABELS: Record<string, string> = {
  en_attente: "En attente",
  approuve: "Approuvé",
  refuse: "Refusé",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  admin: "Administrateur",
  membre: "Membre",
};

export const MOVEMENT_TYPE_LABELS: Record<string, string> = {
  ajout: "Ajout",
  retrait: "Retrait",
};
