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

    const channel = supabase
      .channel(channelName)
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
