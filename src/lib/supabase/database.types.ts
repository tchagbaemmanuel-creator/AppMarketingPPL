export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          nom: string;
          email: string | null;
          fonction: string | null;
          role: "admin" | "membre";
          status: "en_attente" | "approuve" | "refuse";
          password_hash: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          email?: string | null;
          fonction?: string | null;
          role?: "admin" | "membre";
          status?: "en_attente" | "approuve" | "refuse";
          password_hash?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          email?: string | null;
          fonction?: string | null;
          role?: "admin" | "membre";
          status?: "en_attente" | "approuve" | "refuse";
          password_hash?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      resources: {
        Row: {
          id: string;
          nom: string;
          categorie: string;
          description: string | null;
          type: "physique" | "numerique" | "service";
          quantite: number;
          seuil_minimum: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          nom: string;
          categorie: string;
          description?: string | null;
          type?: "physique" | "numerique" | "service";
          quantite?: number;
          seuil_minimum?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          nom?: string;
          categorie?: string;
          description?: string | null;
          type?: "physique" | "numerique" | "service";
          quantite?: number;
          seuil_minimum?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      withdrawal_requests: {
        Row: {
          id: string;
          user_id: string | null;
          demandeur: string;
          fonction: string;
          resource_id: string;
          quantite: number;
          motif: string;
          statut: "en_attente" | "valide" | "refuse";
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          demandeur: string;
          fonction: string;
          resource_id: string;
          quantite: number;
          motif: string;
          statut?: "en_attente" | "valide" | "refuse";
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          demandeur?: string;
          fonction?: string;
          resource_id?: string;
          quantite?: number;
          motif?: string;
          statut?: "en_attente" | "valide" | "refuse";
          created_at?: string;
        };
        Relationships: [];
      };
      stock_movements: {
        Row: {
          id: string;
          resource_id: string;
          type_mouvement: "ajout" | "retrait";
          quantite: number;
          commentaire: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          resource_id: string;
          type_mouvement: "ajout" | "retrait";
          quantite: number;
          commentaire?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          resource_id?: string;
          type_mouvement?: "ajout" | "retrait";
          quantite?: number;
          commentaire?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
