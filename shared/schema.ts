// Re-export schema from db-schema.ts for backwards compatibility
export * from "./db-schema";

// Utility function for formatting CPF numbers
export function formatCPF(cpf: unknown): string {
  if (cpf === null || cpf === undefined) return "N/A";
  const str = String(cpf);
  if (!str || str === "null" || str === "undefined") return "N/A";
  const numeric = str.replace(/\D/g, "");
  if (numeric.length !== 11) return str;
  return `${numeric.slice(0, 3)}.${numeric.slice(3, 6)}.${numeric.slice(6, 9)}-${numeric.slice(9)}`;
}

// Additional types for compliance module
export type ComplianceStatus = "approved" | "rejected" | "pending" | "manual_review" | "error";

// Types for Bigdatacorp process data
export interface BigdatacorpUpdate {
  Date?: string;
  Description?: string;
  Type?: string;
  Content?: string;
  PublicationDate?: string;
  CaptureDate?: string;
}

export interface BigdatacorpPetition {
  Date?: string;
  Description?: string;
  Type?: string;
  Content?: string;
}

export interface BigdatacorpParty {
  Name?: string;
  Type?: string;
  Document?: string;
  Polarity?: string;
  OAB?: string;
  OABState?: string;
}

export interface BigdatacorpDecision {
  Date?: string;
  Description?: string;
  Result?: string;
  Content?: string;
}

export interface RawBigdatacorpDecision { Data?: string; Teor?: string; Descricao?: string; }
export interface RawBigdatacorpPetition { Data?: string; Teor?: string; Tipo?: string; }
export interface RawBigdatacorpUpdate { Data?: string; Descricao?: string; Teor?: string; DataPublicacao?: string; DataCaptura?: string; }
export interface RawBigdatacorpParty { Nome?: string; Documento?: string; Tipo?: string; Polaridade?: string; OAB?: string; EstadoOAB?: string; }

export interface BigdatacorpDecisionsWrapper { Total: number; Items?: RawBigdatacorpDecision[] }
export interface BigdatacorpPetitionsWrapper { Total: number; Items?: RawBigdatacorpPetition[] }
export interface BigdatacorpUpdatesWrapper { Total: number; Items?: RawBigdatacorpUpdate[]; Rows?: RawBigdatacorpUpdate[] }
export interface BigdatacorpPartiesWrapper { Total: number; Items?: RawBigdatacorpParty[] }

export interface RawBigdatacorpLawsuit { [key: string]: any }
export interface BigdatacorpLawsuit { [key: string]: any }

// Bank types for Pluggy integration
export interface Bank {
  id: string;
  name: string;
  code?: string;
  logo?: string;
}

export const BRAZILIAN_BANKS: Bank[] = [
  { id: "1", name: "Banco do Brasil", code: "001" },
  { id: "2", name: "Bradesco", code: "237" },
  { id: "3", name: "Caixa Econômica Federal", code: "104" },
  { id: "4", name: "Itaú Unibanco", code: "341" },
  { id: "5", name: "Santander Brasil", code: "033" },
  { id: "6", name: "Nubank", code: "260" },
  { id: "7", name: "Inter", code: "077" },
  { id: "8", name: "C6 Bank", code: "336" },
  { id: "9", name: "BTG Pactual", code: "208" },
  { id: "10", name: "Sicoob", code: "756" },
];

// Billing and Projection types
export interface InstallmentInfo {
  hasInstallment: boolean;
  current: number;
  total: number;
  remaining: number;
}

export interface RecurringTransaction {
  description: string;
  amount: number;
  frequency: number;
  isActive: boolean;
  lastOccurrence: string;
}

export interface InstallmentProjection {
  description: string;
  amount: number;
  parcel: string;
  currentParcel: number;
  totalParcels: number;
}

export interface MonthlyProjection {
  month: string;
  monthKey: string;
  total: number;
  installments: InstallmentProjection[];
  recurring: RecurringTransaction[];
  breakdown: {
    installmentsTotal: number;
    recurringTotal: number;
  };
}

