export type ProjectCategory = "personal" | "corporate" | "major";

export interface Expense {
  id: string;
  name: string;
  amount: number;
}

// ProductionType is now a flexible string to support custom values
export type ProductionType = string;

export type ProductionStatus =
  | "under_negotiation"
  | "in_production"
  | "technically_completed"
  | "pending_payment"
  | "fully_settled";

export interface Project {
  id: string;
  category: ProjectCategory;
  name: string;
  client: string;
  productionType: ProductionType;
  contractValue: number;
  advancePayment: number;
  finalPayment: number;
  status: ProductionStatus;
  startDate: string;
  deliveryDate: string;
  notes: string;
  expenses: Expense[];
  year: number;
  createdAt: string;
}

export interface FinancialSummary {
  personalCompleted: number;
  corporateCompleted: number;
  majorCompleted: number;
  totalCompleted: number;
  totalProjects: number;
  completedCount: number;
  inProgressCount: number;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
}
