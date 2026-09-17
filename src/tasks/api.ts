import type { Tables } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import {
  CHORE_KINDS,
  CHORE_REPEATS,
  type Chore,
  type ChoreKind,
  type ChoreRepeat,
  type NewChore,
} from "./types";

// `kind` and `repeat` are text columns guarded by CHECK constraints, so narrow
// them on the way in rather than trusting the string.
function toKind(value: string): ChoreKind {
  return CHORE_KINDS.find((kind) => kind === value) ?? "on_demand";
}

function toRepeat(value: string): ChoreRepeat {
  return CHORE_REPEATS.find((repeat) => repeat === value) ?? "none";
}

function mapChore(row: Tables<"tasks">): Chore {
  return {
    id: row.id,
    title: row.title,
    kind: toKind(row.kind),
    repeat: toRepeat(row.repeat),
    dueDate: row.due_date,
    rotate: row.rotate,
    holderIds: row.holder_ids,
    holderIndex: row.holder_index,
    done: row.done,
    lastDoneAt: row.last_done_at,
    lastDoneBy: row.last_done_by,
  };
}

export async function fetchChores(householdId: string): Promise<Chore[]> {
  const { data, error } = await supabase
    .from("tasks")
    .select("*")
    .eq("household_id", householdId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(mapChore);
}

export async function insertChore(householdId: string, chore: NewChore): Promise<Chore> {
  const { data, error } = await supabase
    .from("tasks")
    .insert({
      household_id: householdId,
      title: chore.title,
      kind: chore.kind,
      repeat: chore.repeat,
      due_date: chore.dueDate,
      rotate: chore.rotate,
      holder_ids: chore.holderIds,
      holder_index: 0,
      done: false,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapChore(data);
}

export async function saveChore(chore: Chore): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({
      kind: chore.kind,
      repeat: chore.repeat,
      due_date: chore.dueDate,
      rotate: chore.rotate,
      holder_ids: chore.holderIds,
      holder_index: chore.holderIndex,
      done: chore.done,
      last_done_at: chore.lastDoneAt,
      last_done_by: chore.lastDoneBy,
      updated_at: new Date().toISOString(),
    })
    .eq("id", chore.id);

  if (error) throw error;
}

export async function setChoreDone(id: string, done: boolean): Promise<void> {
  const { error } = await supabase
    .from("tasks")
    .update({ done, updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) throw error;
}

export async function deleteChore(id: string): Promise<void> {
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) throw error;
}
