"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  FREE_FEATURES,
  GRACE_DAYS,
  LAUNCH_OFFER_ACTIVE,
  PRICE_DISPLAY,
  PRO_FEATURES,
  isPaidPlan,
  type Feature,
} from "@/lib/billing/plans";

type Profile = {
  plan?: string | null;
  plan_expire_at?: string | null;
  plan_status?: string | null;
  plan_cancel_at_period_end?: boolean | null;
};

const ORANGE = "#e85d1a";

function euro(n: number) {
  return n.toFixed(2).replace(".", ",") + " €";
}

function FeatureList({ items }: { items: Feature[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: "16px 0 0", display: "grid", gap: 10 }}>
      {items.map((f) => (
        <li key={f.text} style={{ display: "flex", gap: 8, fontSize: 14, lineHeight: 1.4 }}>
          <span style={{ color: ORANGE, fontWeight: 800 }}>✓</span>
          <span>
            {f.text}
            {f.soon && (
              <span
                style={{
                  marginLeft: 8,
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  padding: "2px 6px",
                  borderRadius: 4,
                  border: "1px solid currentColor",
                  opacity: 0.6,
                }}
              >
                BIENTÔT
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function AbonnementPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [erreur, setErreur] = useState("");

  const getToken = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }, []);

  const charger = useCallback(async () => {
    const supabase = createClient();
    const { data: s } = await supabase.auth.getUser();
    if (!s.user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("foodtruckers")
      .select("plan, plan_expire_at, plan_status, plan_cancel_at_period_end")
      .eq("id", s.user.id)
      .maybeSingle();
    setProfile((data as Profile) || null);
    setLoading(false);
  }, []);

  const appeler = useCallback(
    async (url: string, body?: object) => {
      const token = await getToken();
      if (!token) throw new Error("Session expirée, reconnecte-toi.");
      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body || {}),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Erreur");
      return j;
    },
    [getToken]
  );

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const sid = params.get("session_id");
      try {
        if (params.get("success") && sid) {
          setMsg("Paiement reçu, activation de ton abonnement…");
          await appeler("/api/stripe/sync", { session_id: sid });
          setMsg("Bienvenue dans Spotruck Pro ! Ton abonnement est actif.");
        } else if (params.get("refresh")) {
          await appeler("/api/stripe/sync");
        } else if (params.get("canceled")) {
          setMsg("Paiement annulé, rien n'a été débité.");
        }
      } catch (e) {
        setMsg("");
        setErreur(e instanceof Error ? e.message : "Erreur");
      }
      if (params.toString()) window.history.replaceState(null, "", window.location.pathname);
      await charger();
    })();
  }, [appeler, charger]);

  async function demarrer(route: string) {
    setBusy(true);
    setErreur("");
    try {
      const j = await appeler(route);
      if (j.url) window.location.href = j.url;
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Erreur");
      setBusy(false);
    }
  }

  const pro = isPaidPlan(profile);
  const prix = LAUNCH_OFFER_ACTIVE ? PRICE_DISPLAY.launch : PRICE_DISPLAY.normal;
  const finPeriode =
    profile?.plan_expire_at && !Number.isNaN(Date.parse(profile.plan_expire_at))
      ? new Date(Date.parse(profile.plan_expire_at) - GRACE_DAYS * 86400000).toLocaleDateString("fr-FR")
      : null;

  const card: React.CSSProperties = {
    flex: "1 1 280px",
    border: "1px solid rgba(128,128,128,0.35)",
    borderRadius: 12,
    padding: 24,
  };

  return (
    <div style={{ padding: 32, maxWidth: 820 }}>
      <Link
        href="/dashboard/foodtrucker"
        style={{ display: "inline-block", marginBottom: 20, fontSize: 14, fontWeight: 600, color: ORANGE, textDecoration: "none" }}
      >
        ← Retour au tableau de bord
      </Link>
      <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Mon abonnement</h1>
      <p style={{ opacity: 0.7, marginBottom: 24 }}>
        Les annonces restent gratuites pour tous. Le plan Pro te fait gagner du temps sur tes candidatures.
      </p>

      {msg && (
        <p style={{ padding: 12, borderRadius: 8, background: "rgba(34,160,90,0.15)", marginBottom: 16 }}>{msg}</p>
      )}
      {erreur && (
        <p style={{ padding: 12, borderRadius: 8, background: "rgba(225,17,17,0.12)", color: "#e11", marginBottom: 16 }}>
          {erreur}
        </p>
      )}

      {loading ? (
        <p style={{ opacity: 0.6 }}>Chargement…</p>
      ) : (
        <>
          <p style={{ marginBottom: 20, fontWeight: 700 }}>
            Ton plan actuel : {pro ? "PRO" : "GRATUIT"}
            {pro && profile?.plan_cancel_at_period_end && finPeriode && (
              <span style={{ fontWeight: 400, opacity: 0.75 }}>
                {" "}
                — résiliation programmée, accès Pro jusqu&apos;au {finPeriode}
              </span>
            )}
            {pro && !profile?.plan_cancel_at_period_end && finPeriode && (
              <span style={{ fontWeight: 400, opacity: 0.75 }}> — prochain renouvellement le {finPeriode}</span>
            )}
          </p>

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ ...card, ...(pro ? {} : { border: `2px solid ${ORANGE}` }) }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, opacity: 0.7 }}>
                GRATUIT{!pro && <span style={{ marginLeft: 8, color: ORANGE }}>· TON PLAN ACTUEL</span>}
              </div>
              <div style={{ fontSize: 32, fontWeight: 800, margin: "8px 0" }}>0 €</div>
              <FeatureList items={FREE_FEATURES} />
              <div style={{ marginTop: 24 }}>
                {pro ? (
                  <>
                    <button
                      onClick={() => demarrer("/api/stripe/portal")}
                      disabled={busy}
                      style={{ background: "transparent", border: "2px solid rgba(128,128,128,0.6)", color: "inherit", fontWeight: 700, padding: "12px 20px", borderRadius: 8, cursor: "pointer" }}
                    >
                      {busy ? "OUVERTURE…" : "REVENIR AU GRATUIT"}
                    </button>
                    <p style={{ fontSize: 12, opacity: 0.6, marginTop: 8 }}>
                      Tu gardes le Pro jusqu&apos;à la fin de la période déjà payée.
                    </p>
                  </>
                ) : (
                  <Link
                    href="/dashboard/foodtrucker"
                    style={{ display: "inline-block", border: "2px solid rgba(128,128,128,0.6)", color: "inherit", fontWeight: 700, padding: "12px 20px", borderRadius: 8, textDecoration: "none" }}
                  >
                    CONTINUER EN GRATUIT
                  </Link>
                )}
              </div>
            </div>

            <div style={{ ...card, border: `2px solid ${ORANGE}` }}>
              <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: 1, color: ORANGE }}>PRO{pro && " · TON PLAN ACTUEL"}</div>
              <div style={{ margin: "8px 0" }}>
                <span style={{ fontSize: 32, fontWeight: 800 }}>{euro(prix)}</span>
                <span style={{ opacity: 0.7 }}> / mois TTC</span>
                {LAUNCH_OFFER_ACTIVE && (
                  <span style={{ marginLeft: 10, textDecoration: "line-through", opacity: 0.55 }}>
                    {euro(PRICE_DISPLAY.normal)}
                  </span>
                )}
              </div>
              {LAUNCH_OFFER_ACTIVE && (
                <div style={{ fontSize: 13, fontWeight: 700, color: ORANGE }}>
                  Offre de lancement : ce prix est garanti tant que tu restes abonné.
                </div>
              )}
              <FeatureList items={PRO_FEATURES} />
              <div style={{ marginTop: 24 }}>
                {pro ? (
                  <button
                    onClick={() => demarrer("/api/stripe/portal")}
                    disabled={busy}
                    style={{ background: "transparent", border: `2px solid ${ORANGE}`, color: ORANGE, fontWeight: 700, padding: "12px 20px", borderRadius: 8, cursor: "pointer" }}
                  >
                    {busy ? "OUVERTURE…" : "GÉRER MON ABONNEMENT"}
                  </button>
                ) : (
                  <button
                    onClick={() => demarrer("/api/stripe/checkout")}
                    disabled={busy}
                    style={{ background: ORANGE, color: "#fff", fontWeight: 700, padding: "14px 24px", borderRadius: 8, border: 0, cursor: "pointer" }}
                  >
                    {busy ? "REDIRECTION…" : "PASSER AU PRO"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <p style={{ fontSize: 12, opacity: 0.6, marginTop: 20 }}>
            Paiement sécurisé par Stripe. Résiliable à tout moment depuis « Gérer mon abonnement ».
          </p>
        </>
      )}
    </div>
  );
}
