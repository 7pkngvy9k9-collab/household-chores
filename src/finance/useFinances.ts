import { useCallback, useEffect, useState } from "react";

import { reportError } from "../lib/errors";
import { useRealtimeTable } from "../lib/realtime";
import {
  confirmSettlement,
  createExpense,
  createSettlement,
  fetchBalances,
  fetchExpenses,
  fetchSettlements,
  type Balance,
  type Expense,
  type Settlement,
} from "./api";

export function useFinances(householdId: string | null) {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!householdId) {
      setBalances([]);
      setExpenses([]);
      setSettlements([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [nextBalances, nextExpenses, nextSettlements] = await Promise.all([
        fetchBalances(householdId),
        fetchExpenses(householdId),
        fetchSettlements(householdId),
      ]);
      setBalances(nextBalances);
      setExpenses(nextExpenses);
      setSettlements(nextSettlements);
    } catch (cause) {
      setError(reportError(cause, "We could not load finances. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useRealtimeTable(
    "expenses",
    "expenses",
    householdId ? `household_id=eq.${householdId}` : undefined,
    reload,
  );

  const addExpense = useCallback(
    async (title: string, amount: number, paidBy: string, participantIds: string[]) => {
      if (!householdId) return;
      setError("");
      try {
        await createExpense(householdId, title, amount, paidBy, participantIds);
        await reload();
      } catch (cause) {
        setError(reportError(cause, "The expense could not be added. Please try again."));
        throw cause;
      }
    },
    [householdId, reload],
  );

  const addSettlement = useCallback(
    async (fromUser: string, toUser: string, amount: number) => {
      if (!householdId) return;
      try {
        await createSettlement(householdId, fromUser, toUser, amount);
        await reload();
      } catch (cause) {
        setError(reportError(cause, "The settlement could not be created. Please try again."));
      }
    },
    [householdId, reload],
  );

  const confirm = useCallback(
    async (id: string) => {
      try {
        await confirmSettlement(id);
        await reload();
      } catch (cause) {
        setError(reportError(cause, "The settlement could not be confirmed. Please try again."));
      }
    },
    [reload],
  );

  return { balances, expenses, settlements, loading, error, reload, addExpense, addSettlement, confirm };
}
