export type UserRole = "admin" | "membre";
export type UserStatus = "en_attente" | "approuve" | "refuse";
export type ResourceType = "physique" | "numerique" | "service";
export type RequestStatus = "en_attente" | "valide" | "refuse";
export type MovementType = "ajout" | "retrait";
export type StockStatus = "disponible" | "stock_faible" | "rupture";

export interface User {
  id: string;
  nom: string;
  email: string | null;
  fonction: string | null;
  role: UserRole;
  status: UserStatus;
  password_hash?: string | null;
  created_at: string;
}

export interface Resource {
  id: string;
  nom: string;
  categorie: string;
  description: string | null;
  type: ResourceType;
  quantite: number;
  seuil_minimum: number;
  created_at: string;
}

export interface WithdrawalRequest {
  id: string;
  user_id: string | null;
  demandeur: string;
  fonction: string;
  resource_id: string;
  quantite: number;
  motif: string;
  statut: RequestStatus;
  created_at: string;
  resources?: Pick<Resource, "nom" | "categorie" | "type">;
}

export interface StockMovement {
  id: string;
  resource_id: string;
  type_mouvement: MovementType;
  quantite: number;
  commentaire: string | null;
  created_at: string;
  resources?: Pick<Resource, "nom">;
}

export interface DashboardStats {
  totalResources: number;
  totalStock: number;
  pendingRequests: number;
  completedWithdrawals: number;
}
