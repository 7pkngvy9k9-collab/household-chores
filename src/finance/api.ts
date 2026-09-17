import type { Tables } from "../lib/database.types";
import { supabase } from "../lib/supabase";

export type Balance = {
  memberId: string;
  name: string;
  balance: number;
};

export type Expense = {
  id: string;
  title: string;
  amount: number;
  paidBy: string;
  expenseDate: string;
};

export type Settlement = {
  id: string;
  fromUser: string;
  toUser: string;
  amount: number;
  status: string;
};

export async function fetchBalances(householdId: string): Promise<Balance[]> {
  const { data, error } = await supabase.rpc("calculate_balances", { p_household_id: householdId });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    memberId: row.member_id,
    name: row.member_name,
    balance: Number(row.balance),
  }));
}

export async function fetchExpenses(householdId: string): Promise<Expense[]> {
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("household_id", householdId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row: Tables<"expenses">) => ({
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    paidBy: row.paid_by,
    expenseDate: row.expense_date,
  }));
}

export async function fetchSettlements(householdId: string): Promise<Settlement[]> {
  const { data, error } = await supabase
    .from("settlements")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data.map((row) => ({
    id: row.id,
    fromUser: row.from_user,
    toUser: row.to_user,
    amount: Number(row.amount),
    status: row.status,
  }));
}

export async function createExpense(
  householdId: string,
  title: string,
  amount: number,
  paidBy: string,
  participantIds: string[],
): Promise<void> {
  const { error } = await supabase.rpc("create_expense", {
    p_household_id: householdId,
    p_title: title,
    p_amount: amount,
    p_paid_by: paidBy,
    p_participant_ids: participantIds,
  });
  if (error) throw error;
}

export async function createSettlement(
  householdId: string,
  fromUser: string,
  toUser: string,
  amount: number,
): Promise<void> {
  const { error } = await supabase.from("settlements").insert({
    household_id: householdId,
    from_user: fromUser,
    to_user: toUser,
    amount,
    status: "open",
  });
  if (error) throw error;
}

export async function confirmSettlement(id: string): Promise<void> {
  const { error } = await supabase
    .from("settlements")
    .update({ status: "confirmed", settled_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export function suggestSettlements(balances: Balance[]): { from: Balance; to: Balance; amount: number }[] {
  const debtors = balances
    .filter((row) => row.balance < -0.009)
    .map((row) => ({ ...row }))
    .sort((a, b) => a.balance - b.balance);
  const creditors = balances
    .filter((row) => row.balance > 0.009)
    .map((row) => ({ ...row }))
    .sort((a, b) => b.balance - a.balance);

  const suggestions: { from: Balance; to: Balance; amount: number }[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    if (!debtor || !creditor) break;
    const amount = Math.min(-debtor.balance, creditor.balance);
    suggestions.push({ from: debtor, to: creditor, amount: Math.round(amount * 100) / 100 });
    debtor.balance += amount;
    creditor.balance -= amount;
    if (debtor.balance > -0.009) i += 1;
    if (creditor.balance < 0.009) j += 1;
  }
  return suggestions;
}
