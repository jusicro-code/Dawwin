import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Project, ProjectCategory, ProductionStatus, FinancialSummary, ProductionType, Expense } from "@/types";

// Map DB row (snake_case) → Project (camelCase)
function mapDbProject(row: Record<string, unknown>): Project {
  let expenses: Expense[] = [];
  if (Array.isArray(row.expenses)) {
    expenses = row.expenses as Expense[];
  }
  return {
    id: row.id as string,
    category: row.category as ProjectCategory,
    name: row.name as string,
    client: row.client as string,
    productionType: row.production_type as ProductionType,
    contractValue: Number(row.contract_value) || 0,
    advancePayment: Number(row.advance_payment) || 0,
    finalPayment: Number(row.final_payment) || 0,
    status: row.status as ProductionStatus,
    startDate: (row.start_date as string) || "",
    deliveryDate: (row.delivery_date as string) || "",
    notes: (row.notes as string) || "",
    expenses,
    year: Number(row.year),
    createdAt: (row.created_at as string) || new Date().toISOString(),
  };
}

/**
 * Sort all active projects:
 * 1. Projects with a delivery date, sorted ascending (soonest first)
 *    - pending_payment goes to bottom of dated group
 * 2. Projects WITHOUT a delivery date → always last
 */
function sortActiveProjects(projects: Project[]): Project[] {
  const withDate = projects.filter((p) => p.deliveryDate && p.status !== "pending_payment");
  const pendingWithDate = projects.filter((p) => p.deliveryDate && p.status === "pending_payment");
  const withoutDate = projects.filter((p) => !p.deliveryDate);

  const sortByDate = (a: Project, b: Project) => {
    const da = new Date(a.deliveryDate).getTime();
    const db = new Date(b.deliveryDate).getTime();
    return da - db;
  };

  return [
    ...withDate.sort(sortByDate),
    ...pendingWithDate.sort(sortByDate),
    ...withoutDate,
  ];
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  // "archive" is the only special tab now; default is "active" (all categories merged)
  const [activeTab, setActiveTab] = useState<"active" | "archive">("active");

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setProjects(data.map(mapDbProject));
    }
    setLoadingProjects(false);
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // All active (non-settled) projects across all categories, smart-sorted
  const filteredActiveProjects = sortActiveProjects(
    projects.filter((p) => p.status !== "fully_settled")
  );

  // Archive: all fully_settled regardless of category/year
  const archivedProjects = projects.filter((p) => p.status === "fully_settled");

  // Stats always computed over ALL projects
  const financialSummary: FinancialSummary = {
    personalCompleted: projects
      .filter((p) => p.category === "personal" && p.status === "fully_settled")
      .reduce((s, p) => s + p.contractValue, 0),
    corporateCompleted: projects
      .filter((p) => p.category === "corporate" && p.status === "fully_settled")
      .reduce((s, p) => s + p.contractValue, 0),
    majorCompleted: projects
      .filter((p) => p.category === "major" && p.status === "fully_settled")
      .reduce((s, p) => s + p.contractValue, 0),
    get totalCompleted() {
      return this.personalCompleted + this.corporateCompleted + this.majorCompleted;
    },
    totalProjects: projects.length,
    completedCount: projects.filter((p) => p.status === "fully_settled").length,
    inProgressCount: projects.filter((p) => p.status !== "fully_settled").length,
  };

  const addProject = useCallback(
    async (data: Omit<Project, "id" | "createdAt">) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: row, error } = await supabase
        .from("projects")
        .insert({
          user_id: user.id,
          category: data.category,
          name: data.name,
          client: data.client,
          production_type: data.productionType,
          contract_value: data.contractValue,
          advance_payment: data.advancePayment,
          final_payment: data.finalPayment,
          status: data.status,
          start_date: data.startDate || null,
          delivery_date: data.deliveryDate || null,
          notes: data.notes,
          expenses: data.expenses ?? [],
          year: data.year,
        })
        .select()
        .single();

      if (!error && row) {
        setProjects((prev) => [mapDbProject(row), ...prev]);
      }
    },
    []
  );

  const updateProject = useCallback(
    async (id: string, data: Partial<Omit<Project, "id" | "createdAt">>) => {
      const updateData: Record<string, unknown> = {};
      if (data.name !== undefined) updateData.name = data.name;
      if (data.client !== undefined) updateData.client = data.client;
      if (data.productionType !== undefined)
        updateData.production_type = data.productionType;
      if (data.contractValue !== undefined)
        updateData.contract_value = data.contractValue;
      if (data.advancePayment !== undefined)
        updateData.advance_payment = data.advancePayment;
      if (data.finalPayment !== undefined)
        updateData.final_payment = data.finalPayment;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.startDate !== undefined)
        updateData.start_date = data.startDate || null;
      if (data.deliveryDate !== undefined)
        updateData.delivery_date = data.deliveryDate || null;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.expenses !== undefined) updateData.expenses = data.expenses;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.year !== undefined) updateData.year = data.year;

      const { data: row, error } = await supabase
        .from("projects")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (!error && row) {
        setProjects((prev) =>
          prev.map((p) => (p.id === id ? mapDbProject(row) : p))
        );
      }
    },
    []
  );

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (!error) {
      setProjects((prev) => prev.filter((p) => p.id !== id));
    }
  }, []);

  return {
    projects,
    loadingProjects,
    filteredActiveProjects,
    archivedProjects,
    financialSummary,
    statsFilter: null as ProjectCategory | null,
    activeTab,
    setActiveTab,
    addProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
