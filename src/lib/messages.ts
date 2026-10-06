import { createClient } from "@/lib/supabase/client";

export type SenderType = "organisateur" | "foodtrucker";

export interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  sender_type: SenderType;
  content: string;
  read_at: string | null;
  created_at: string;
}

export interface ConversationRow {
  id: string;
  evenement_id: string | null;
  candidature_id: string | null;
  organisateur_id: string;
  foodtrucker_id: string;
  created_at: string;
  last_message_at: string;
}

export async function getOrCreateConversation({
  organisateurId,
  foodtruckerId,
  evenementId,
  candidatureId,
}: {
  organisateurId: string;
  foodtruckerId: string;
  evenementId?: string | null;
  candidatureId?: string | null;
}): Promise<ConversationRow> {
  const supabase = createClient();

  const { data: existing, error: fetchError } = await supabase
    .from("conversations")
    .select("*")
    .eq("organisateur_id", organisateurId)
    .eq("foodtrucker_id", foodtruckerId)
    .eq("evenement_id", evenementId ?? null)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (existing) return existing;

  const { data: created, error: insertError } = await supabase
    .from("conversations")
    .insert({
      organisateur_id: organisateurId,
      foodtrucker_id: foodtruckerId,
      evenement_id: evenementId ?? null,
      candidature_id: candidatureId ?? null,
    })
    .select()
    .single();

  if (insertError) throw insertError;
  return created;
}

export async function getConversations(userId: string, userType: SenderType) {
  const supabase = createClient();
  const column = userType === "organisateur" ? "organisateur_id" : "foodtrucker_id";

  const { data, error } = await supabase
    .from("conversations")
    .select(`
      *,
      foodtruckers:foodtrucker_id ( nom_truck, photo_truck_url ),
      organisateurs:organisateur_id ( nom_organisation ),
      evenements:evenement_id ( titre )
    `)
    .eq(column, userId)
    .order("last_message_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getMessages(conversationId: string): Promise<MessageRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
}

export async function sendMessage({
  conversationId,
  senderId,
  senderType,
  content,
}: {
  conversationId: string;
  senderId: string;
  senderType: SenderType;
  content: string;
}) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: senderId,
      sender_type: senderType,
      content,
    })
    .select()
    .single();

  if (error) throw error;

  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);

  return data;
}

export function subscribeToMessages(
  conversationId: string,
  onNewMessage: (message: MessageRow) => void
) {
  const supabase = createClient();
  const channel = supabase
    .channel(`messages:${conversationId}`)
    .on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      },
      (payload) => onNewMessage(payload.new as MessageRow)
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export async function markAsRead(conversationId: string, currentUserId: string) {
  const supabase = createClient();
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", currentUserId)
    .is("read_at", null);
}
