"use client";

import { useState, useRef, useEffect, useCallback, useMemo, Suspense } from "react";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import { Send, CheckCircle, Search, X } from "lucide-react";
import {
  getConversations, getMessages, sendMessage,
  subscribeToMessages, markAsRead, type MessageRow,
} from "@/lib/messages";

const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

interface ConvRaw {
  id: string;
  organisateur_id: string;
  evenement_id: string | null;
  last_message_at: string;
  organisateurs?: { nom_organisation?: string | null } | null;
  evenements?: { titre?: string | null } | null;
}

interface ConvListItem {
  id: string;
  organisateurNom: string;
  evenementTitre: string;
}

function MessageBubble({ m }: { m: MessageRow }) {
  const isMine = m.sender_type === "foodtrucker";
  const heure = new Date(m.created_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isMine ? "flex-end" : "flex-start" }}>
      <div style={{ maxWidth: "72%", backgroundColor: isMine ? S.terra : S.card, padding: "0.875rem 1.25rem", borderRadius: isMine ? "12px 12px 2px 12px" : "12px 12px 12px 2px" }}>
        <p style={{ fontFamily: S.sans, fontSize: "0.82rem", fontWeight: 300, color: isMine ? "#fff" : S.brown, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{m.content}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", marginTop: "0.3rem" }}>
        <span style={{ fontFamily: S.sans, fontSize: "0.6rem", color: S.muted }}>{heure}</span>
        {isMine && m.read_at && <CheckCircle size={10} color={S.green} strokeWidth={2} />}
      </div>
    </div>
  );
}

function MessagerieClientInner({ foodtruckerId }: { foodtruckerId: string }) {
  const [convs, setConvs] = useState<ConvListItem[]>([]);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageRow[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [query, setQuery] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const unsubRef = useRef<(() => void) | null>(null);

  const loadConvs = useCallback(async () => {
    try {
      const data = (await getConversations(foodtruckerId, "foodtrucker")) as unknown as ConvRaw[];
      setConvs((data || []).map(c => ({
        id: c.id,
        organisateurNom: c.organisateurs?.nom_organisation || "Organisateur",
        evenementTitre: c.evenements?.titre || "",
      })));
    } catch (err) {
      console.error("Erreur chargement conversations:", err);
    } finally {
      setLoadingConvs(false);
    }
  }, [foodtruckerId]);

  useEffect(() => { loadConvs(); }, [loadConvs]);

  useEffect(() => {
    if (!activeId && convs.length > 0) setActiveId(convs[0].id);
  }, [convs, activeId]);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    let cancelled = false;
    if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }

    (async () => {
      setLoadingMsgs(true);
      try {
        const msgs = await getMessages(activeId);
        if (cancelled) return;
        setMessages(msgs);
        markAsRead(activeId, foodtruckerId).catch(() => {});
      } catch (err) {
        console.error("Erreur chargement messages:", err);
      } finally {
        if (!cancelled) setLoadingMsgs(false);
      }
    })();

    unsubRef.current = subscribeToMessages(activeId, (m) => {
      setMessages(prev => prev.some(x => x.id === m.id) ? prev : [...prev, m]);
      if (m.sender_id !== foodtruckerId) markAsRead(activeId, foodtruckerId).catch(() => {});
    });

    return () => {
      cancelled = true;
      if (unsubRef.current) { unsubRef.current(); unsubRef.current = null; }
    };
  }, [activeId, foodtruckerId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const envoyer = async () => {
    const texte = draft.trim();
    if (!texte || !activeId || sending) return;
    setSending(true);
    try {
      const sent = await sendMessage({
        conversationId: activeId,
        senderId: foodtruckerId,
        senderType: "foodtrucker",
        content: texte,
      });
      setMessages(prev => prev.some(x => x.id === sent.id) ? prev : [...prev, sent]);
      setDraft("");
    } catch (err) {
      console.error("Erreur envoi message:", err);
    } finally {
      setSending(false);
    }
  };

  const filteredConvs = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return convs;
    return convs.filter(c => c.organisateurNom.toLowerCase().includes(q) || c.evenementTitre.toLowerCase().includes(q));
  }, [convs, query]);

  const activeConv = convs.find(c => c.id === activeId) ?? null;
  const canSend = draft.trim().length > 0 && !!activeId;

  return (
    <main style={{ minHeight: "100vh", backgroundColor: S.cream, color: S.brown, display: "grid", gridTemplateColumns: "260px 1fr" }}>
      <FoodtruckerSidebar active="/dashboard/foodtrucker/messagerie" />

      <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", height: "100vh", overflow: "hidden" }}>
        {/* Liste des conversations */}
        <div style={{ borderRight: `1px solid ${S.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "1.5rem 1.25rem 1rem", borderBottom: `1px solid ${S.border}`, flexShrink: 0 }}>
            <h1 style={{ fontFamily: S.serif, fontSize: "1.3rem", fontWeight: 800, color: S.brown, marginBottom: "0.75rem" }}>Messagerie</h1>
            <div style={{ position: "relative" }}>
              <Search size={13} color={S.muted} strokeWidth={1.5} style={{ position: "absolute", left: "0.7rem", top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Rechercher..."
                style={{ width: "100%", border: `1px solid ${S.border}`, backgroundColor: "transparent", padding: "0.55rem 2.25rem 0.55rem 2.1rem", fontFamily: S.sans, fontSize: "0.72rem", color: S.brown, outline: "none", boxSizing: "border-box" }} />
              {query && <button onClick={() => setQuery("")} style={{ position: "absolute", right: "0.5rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer" }}><X size={12} color={S.muted} /></button>}
            </div>
          </div>

          <div style={{ overflowY: "auto", flex: 1 }}>
            {loadingConvs ? (
              <p style={{ padding: "2rem", fontFamily: S.sans, fontSize: "0.75rem", color: S.muted, textAlign: "center" }}>Chargement…</p>
            ) : filteredConvs.length === 0 ? (
              <p style={{ padding: "2rem", fontFamily: S.sans, fontSize: "0.75rem", color: S.muted, textAlign: "center" }}>
                Aucune conversation pour l&apos;instant. Les organisateurs qui vous contactent apparaîtront ici.
              </p>
            ) : (
              filteredConvs.map(c => {
                const isActive = c.id === activeId;
                return (
                  <div key={c.id} onClick={() => setActiveId(c.id)}
                    style={{ padding: "1rem 1.25rem", cursor: "pointer", backgroundColor: isActive ? "rgba(196,98,45,0.08)" : "transparent", borderLeft: isActive ? `3px solid ${S.terra}` : "3px solid transparent", borderBottom: `1px solid ${S.border}` }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", backgroundColor: S.brown, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: S.serif, fontSize: "0.82rem", fontWeight: 700, color: "#fff" }}>{c.organisateurNom[0]}</span>
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <p style={{ fontFamily: S.sans, fontSize: "0.76rem", fontWeight: 600, color: S.brown, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.organisateurNom}</p>
                        {c.evenementTitre && <p style={{ fontFamily: S.sans, fontSize: "0.62rem", color: S.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.evenementTitre}</p>}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Conversation active */}
        {activeConv ? (
          <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
            <div style={{ padding: "1.25rem 2rem", borderBottom: `1px solid ${S.border}`, backgroundColor: S.cream, display: "flex", alignItems: "center", gap: "1rem", flexShrink: 0 }}>
              <div style={{ width: 40, height: 40, borderRadius: "50%", backgroundColor: S.brown, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: S.serif, fontSize: "1rem", fontWeight: 700, color: "#fff" }}>{activeConv.organisateurNom[0]}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: S.sans, fontSize: "0.88rem", fontWeight: 600, color: S.brown }}>{activeConv.organisateurNom}</p>
                {activeConv.evenementTitre && <p style={{ fontFamily: S.sans, fontSize: "0.65rem", fontWeight: 300, color: S.muted }}>{activeConv.evenementTitre}</p>}
              </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {loadingMsgs ? (
                <p style={{ fontFamily: S.sans, fontSize: "0.78rem", color: S.muted, textAlign: "center" }}>Chargement…</p>
              ) : messages.length === 0 ? (
                <p style={{ fontFamily: S.sans, fontSize: "0.78rem", color: S.muted, textAlign: "center" }}>Aucun message.</p>
              ) : (
                messages.map(m => <MessageBubble key={m.id} m={m} />)
              )}
              <div ref={bottomRef} />
            </div>

            <div style={{ borderTop: `1px solid ${S.border}`, backgroundColor: S.cream, flexShrink: 0 }}>
              <div style={{ padding: "1rem 2rem 1.25rem", display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                <textarea value={draft} onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); envoyer(); } }}
                  placeholder="Écrivez votre message… (Entrée pour envoyer)" rows={2}
                  style={{ flex: 1, border: `1px solid ${S.border}`, backgroundColor: "transparent", padding: "0.75rem 1rem", fontFamily: S.sans, fontSize: "0.82rem", color: S.brown, outline: "none", resize: "none", boxSizing: "border-box" }} />
                <button onClick={envoyer} disabled={!canSend || sending}
                  style={{ backgroundColor: canSend ? S.terra : S.border, color: "#fff", border: "none", padding: "0.875rem 1.5rem", cursor: canSend ? "pointer" : "not-allowed", display: "flex", alignItems: "center", flexShrink: 0 }}>
                  <Send size={15} strokeWidth={2} />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
            <p style={{ fontFamily: S.sans, fontSize: "0.78rem", color: S.muted }}>
              {loadingConvs ? "Chargement…" : "Sélectionnez une conversation"}
            </p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function MessagerieClient(props: { foodtruckerId: string }) {
  return (
    <Suspense>
      <MessagerieClientInner {...props} />
    </Suspense>
  );
}
