"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Nombre de messages non lus reçus par l'utilisateur connecté (mis à jour en temps réel)
export function useUnreadMessages(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function refresh(userId: string) {
      const { count: n, error } = await supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .is("read_at", null)
        .neq("sender_id", userId);
      if (!cancelled && !error) setCount(n ?? 0);
    }

    async function init() {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId || cancelled) return;
      await refresh(userId);
      channel = supabase
        .channel(`unread-${userId}-${Math.random().toString(36).slice(2)}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => refresh(userId))
        .subscribe();
    }

    init();
    return () => {
      cancelled = true;
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  return count;
}
