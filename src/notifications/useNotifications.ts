import { useCallback, useEffect, useState } from "react";

import { useRealtimeTable } from "../lib/realtime";
import { supabase } from "../lib/supabase";

export type HouseholdNotification = {
  id: string;
  title: string;
  body: string;
  readAt: string | null;
  createdAt: string;
};

export function useNotifications(memberId: string | null, householdId: string | null) {
  const [items, setItems] = useState<HouseholdNotification[]>([]);

  const load = useCallback(async () => {
    if (!memberId) {
      setItems([]);
      return;
    }
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("member_id", memberId)
      .order("created_at", { ascending: false })
      .limit(20);
    setItems(
      (data ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        body: row.body,
        readAt: row.read_at,
        createdAt: row.created_at,
      })),
    );
  }, [memberId]);

  useEffect(() => {
    void load();
  }, [load]);

  useRealtimeTable(
    "notifications",
    "notifications",
    householdId ? `household_id=eq.${householdId}` : undefined,
    load,
  );

  const unread = items.filter((item) => !item.readAt).length;

  async function markRead(id: string) {
    await supabase.from("notifications").update({ read_at: new Date().toISOString() }).eq("id", id);
    await load();
  }

  async function markAllRead() {
    if (!memberId) return;
    await supabase
      .from("notifications")
      .update({ read_at: new Date().toISOString() })
      .eq("member_id", memberId)
      .is("read_at", null);
    await load();
  }

  return { items, unread, markRead, markAllRead, reload: load };
}
