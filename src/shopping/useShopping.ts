import { useCallback, useEffect, useState } from "react";

import { reportError } from "../lib/errors";
import { useRealtimeTable } from "../lib/realtime";
import {
  addShoppingItem,
  convertListToExpense,
  createShoppingList,
  deleteShoppingItem,
  fetchShoppingItems,
  fetchShoppingLists,
  toggleShoppingItem,
  type ShoppingItem,
  type ShoppingList,
} from "./api";

export function useShopping(householdId: string | null, userId: string | null) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [listId, setListId] = useState<string | null>(null);
  const [items, setItems] = useState<ShoppingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadLists = useCallback(async () => {
    if (!householdId) {
      setLists([]);
      setListId(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      let next = await fetchShoppingLists(householdId);
      if (next.length === 0) {
        next = [await createShoppingList(householdId, "Groceries")];
      }
      setLists(next);
      setListId((current) => current ?? next[0]?.id ?? null);
    } catch (cause) {
      setError(reportError(cause, "We could not load the shopping lists. Please try again."));
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  const loadItems = useCallback(async () => {
    if (!listId) {
      setItems([]);
      return;
    }
    try {
      setItems(await fetchShoppingItems(listId));
    } catch (cause) {
      setError(reportError(cause, "We could not load the shopping items. Please try again."));
    }
  }, [listId]);

  useEffect(() => {
    void loadLists();
  }, [loadLists]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useRealtimeTable("shopping-items", "shopping_items", listId ? `shopping_list_id=eq.${listId}` : undefined, loadItems);

  const add = useCallback(
    async (name: string, quantity: number | null, unit: string | null) => {
      if (!listId) return;
      setError("");
      try {
        const created = await addShoppingItem(listId, name, quantity, unit);
        setItems((current) => [...current, created]);
      } catch (cause) {
        setError(reportError(cause, "The item could not be added. Please try again."));
      }
    },
    [listId],
  );

  const toggle = useCallback(
    async (item: ShoppingItem) => {
      if (!userId) return;
      const previous = items;
      setItems(previous.map((row) => (row.id === item.id ? { ...row, completedAt: row.completedAt ? null : new Date().toISOString() } : row)));
      try {
        const saved = await toggleShoppingItem(item, userId);
        setItems((current) => current.map((row) => (row.id === saved.id ? saved : row)));
      } catch (cause) {
        setItems(previous);
        setError(reportError(cause, "The item could not be updated. Please try again."));
      }
    },
    [items, userId],
  );

  const remove = useCallback(async (id: string) => {
    const previous = items;
    setItems(previous.filter((item) => item.id !== id));
    try {
      await deleteShoppingItem(id);
    } catch (cause) {
      setItems(previous);
      setError(reportError(cause, "The item could not be removed. Please try again."));
    }
  }, [items]);

  const addList = useCallback(
    async (name: string) => {
      if (!householdId) return;
      try {
        const created = await createShoppingList(householdId, name);
        setLists((current) => [...current, created]);
        setListId(created.id);
      } catch (cause) {
        setError(reportError(cause, "The list could not be created. Please try again."));
      }
    },
    [householdId],
  );

  const convert = useCallback(
    async (title: string, amount: number, paidBy: string, participantIds: string[]) => {
      if (!listId) return;
      try {
        await convertListToExpense(listId, title, amount, paidBy, participantIds);
      } catch (cause) {
        setError(reportError(cause, "The expense could not be created. Please try again."));
        throw cause;
      }
    },
    [listId],
  );

  return { lists, listId, setListId, items, loading, error, add, toggle, remove, addList, convert, reload: loadItems };
}
