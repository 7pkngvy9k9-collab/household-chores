import { useCallback, useEffect, useState } from "react";

import { reportError } from "../lib/errors";
import { deleteChore, fetchChores, insertChore, saveChore, setChoreDone } from "./api";
import { completedChore } from "./schedule";
import type { Chore, NewChore } from "./types";

export type ChoresValue = {
  chores: Chore[];
  loading: boolean;
  error: string;
  reload: () => Promise<void>;
  add: (input: NewChore) => Promise<void>;
  complete: (id: string) => Promise<void>;
  reopen: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
};

export function useChores(
  householdId: string | null,
  currentMemberId: string | null,
): ChoresValue {
  const [chores, setChores] = useState<Chore[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!householdId) {
      setChores([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      setChores(await fetchChores(householdId));
    } catch (cause) {
      setError(reportError(cause, "We could not load the chores. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const add = useCallback(
    async (input: NewChore) => {
      if (!householdId) return;
      setError("");
      try {
        const created = await insertChore(householdId, input);
        setChores((current) => [created, ...current]);
      } catch (cause) {
        setError(reportError(cause, "The chore could not be added. Please try again."));
      }
    },
    [householdId],
  );

  // The three mutations below update the list first and roll back if the write
  // fails, so ticking a chore feels immediate.
  const complete = useCallback(
    async (id: string) => {
      const target = chores.find((chore) => chore.id === id);
      if (!target) return;

      const previous = chores;
      const next = completedChore(target, currentMemberId);
      setError("");
      setChores(previous.map((chore) => (chore.id === id ? next : chore)));

      try {
        await saveChore(next);
      } catch (cause) {
        setChores(previous);
        setError(reportError(cause, "The chore could not be completed. Please try again."));
      }
    },
    [chores, currentMemberId],
  );

  const reopen = useCallback(
    async (id: string) => {
      const previous = chores;
      setError("");
      setChores(previous.map((chore) => (chore.id === id ? { ...chore, done: false } : chore)));

      try {
        await setChoreDone(id, false);
      } catch (cause) {
        setChores(previous);
        setError(reportError(cause, "The chore could not be reopened. Please try again."));
      }
    },
    [chores],
  );

  const remove = useCallback(
    async (id: string) => {
      const previous = chores;
      setError("");
      setChores(previous.filter((chore) => chore.id !== id));

      try {
        await deleteChore(id);
      } catch (cause) {
        setChores(previous);
        setError(reportError(cause, "The chore could not be removed. Please try again."));
      }
    },
    [chores],
  );

  return { chores, loading, error, reload, add, complete, reopen, remove };
}
