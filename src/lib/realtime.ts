import { useEffect } from "react";

import { supabase } from "./supabase";

export function useRealtimeTable(
  channelName: string,
  table: string,
  filter: string | undefined,
  onChange: () => void,
): void {
  useEffect(() => {
    if (!filter) return;

    // Unique name per mount: supabase.channel(name) reuses a live channel,
    // and .on() after subscribe() throws (two NotificationBells share "notifications").
    const channel = supabase
      .channel(`${channelName}:${crypto.randomUUID()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table, filter },
        () => {
          onChange();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [channelName, table, filter, onChange]);
}
