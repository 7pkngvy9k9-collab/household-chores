import type { Tables } from "../lib/database.types";
import { supabase } from "../lib/supabase";

export type ShoppingList = {
  id: string;
  name: string;
};

export type ShoppingItem = {
  id: string;
  listId: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  category: string | null;
  note: string | null;
  completedAt: string | null;
};

function mapList(row: Tables<"shopping_lists">): ShoppingList {
  return { id: row.id, name: row.name };
}

function mapItem(row: Tables<"shopping_items">): ShoppingItem {
  return {
    id: row.id,
    listId: row.shopping_list_id,
    name: row.name,
    quantity: row.quantity,
    unit: row.unit,
    note: row.note,
    category: row.category,
    completedAt: row.completed_at,
  };
}

export async function fetchShoppingLists(householdId: string): Promise<ShoppingList[]> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at");
  if (error) throw error;
  return data.map(mapList);
}

export async function createShoppingList(householdId: string, name: string): Promise<ShoppingList> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ household_id: householdId, name })
    .select("*")
    .single();
  if (error) throw error;
  return mapList(data);
}

export async function fetchShoppingItems(listId: string): Promise<ShoppingItem[]> {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("shopping_list_id", listId)
    .order("position")
    .order("created_at");
  if (error) throw error;
  return data.map(mapItem);
}

export async function addShoppingItem(
  listId: string,
  name: string,
  quantity: number | null,
  unit: string | null,
  category: string | null,
): Promise<ShoppingItem> {
  const { data, error } = await supabase
    .from("shopping_items")
    .insert({
      shopping_list_id: listId,
      name,
      quantity,
      unit,
      category,
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data);
}

export async function toggleShoppingItem(
  item: ShoppingItem,
  userId: string,
): Promise<ShoppingItem> {
  const completed = item.completedAt
    ? { completed_at: null, completed_by: null }
    : { completed_at: new Date().toISOString(), completed_by: userId };
  const { data, error } = await supabase
    .from("shopping_items")
    .update({ ...completed, updated_at: new Date().toISOString() })
    .eq("id", item.id)
    .select("*")
    .single();
  if (error) throw error;
  return mapItem(data);
}

export async function deleteShoppingItem(id: string): Promise<void> {
  const { error } = await supabase.from("shopping_items").delete().eq("id", id);
  if (error) throw error;
}

export async function convertListToExpense(
  listId: string,
  title: string,
  amount: number,
  paidBy: string,
  participantIds: string[],
): Promise<void> {
  const { error } = await supabase.rpc("convert_shopping_to_expense", {
    p_list_id: listId,
    p_title: title,
    p_amount: amount,
    p_paid_by: paidBy,
    p_participant_ids: participantIds,
  });
  if (error) throw error;
}
