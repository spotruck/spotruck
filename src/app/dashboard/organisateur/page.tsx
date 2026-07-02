"use client";

import { useRouter } from "next/navigation";
import OrganisateurSidebar from "@/components/dashboard/OrganisateurSidebar";
import { CheckCircle, Star, ChevronRight, Lightbulb, Plus, Clock, Target, Shield, ClipboardList } from "lucide-react";

const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B", amber:  "#B8850A",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

const CANDIDATURES_RECENTES = [
  { id:"c1", truck:"Le Kalow Smash Burger", cuisine:"Burgers américains", note:4.8, score:97, statut:"EN ATTENTE", ville:"Bordeaux" },
  { id:"c2", truck:"Sweet Nomad Crêpes",    cuisine:"Crêperie bretonne",  note:4.6, score:85, statut:"EN ATTENTE", ville:"Mérignac" },
  { id:"c3", truck:"Tacos del Sol",         cuisine:"Mexicain",           note:4.3, score:72, statut:"RETENU",    ville:"Pessac" },
];

const STATUT_STYLE: Record<string, { color: string; bg: string }> = {
  "EN ATTENTE": { color: S.amber, bg: "rgba(184,133,10,0.1)" },
  "RETENU":     { color: S.green, bg: "rgba(44,122,75,0.1)" },
  "REFUSÉ":     { color: "#C0392B", bg: "rgba(192,57,43,0.1)" },
};

function Stars({ n }: { n: number }) {
  return (
    <span style={{ display:"inline-flex", gap:2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11} fill={i <= Math.round(n) ? S.amber : "none"} stroke={S.amber} strokeWidth={1.5} />
      ))}
    </span>
  );
}

export default function OrganisateurDashboard() {
  const router = useRouter();
  const today = new Date().toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" });

  return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <OrganisateurSidebar active="/dashboard/organisateur" badges={{ "/dashboard/organisateur/candidatures": 11 }} />

      <div style={{ padding:"3rem", maxWidth:1100, minWidth:0 }}>

        {/* Header */}
        <div style={{ marginBottom:"2.5rem" }}>
          <p style={{ fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>
            {today.toUpperCase()}
          </p>
          <h1 style={{ fontFamily:S.serif, fontSize:"2.4rem", fontWeight:800, lineHeight:1.1, marginBottom:"0.3rem" }}>
            Bonjour, Sophie.
          </h1>
          <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color:S.muted }}>
            Voici un aperçu de votre activité sur Spotruck
          </p>
        </div>

        {/* KPIs */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"2px", marginBottom:"3rem" }}>
          {[
            { label:"ÉVÉNEMENTS PUBLIÉS",  value:"2",  sub:"dont 1 actif en cours" },
            { label:"CANDIDATURES REÇUES", value:"14", sub:"11 non traitées" },
            { label:"TRUCKS RETENUS",      value:"3",  sub:"pour le Festival Solstice" },
          ].map(k => (
            <div key={k.label} style={{ backgroundColor:S.card, padding:"1.5rem" }}>
              <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.6rem" }}>{k.label}</p>
              <p style={{ fontFamily:S.serif, fontSize:"2.2rem", fontWeight:800, color:S.brown, lineHeight:1, marginBottom:"0.3rem" }}>{k.value}</p>
              <p style={{ fontFamily:S.sans, fontSize:"0.65rem", fontWeight:300, color:S.muted }}>{k.sub}</p>
            </div>
          ))}
        </div>

        {/* Bannière CTA */}
        <div style={{ marginBottom:"3rem", backgroundColor:S.brown, padding:"2rem 2.5rem", display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:"1rem" }}>
          <div>
            <p style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:700, color:S.cream, marginBottom:"0.4rem" }}>
              Préparez votre prochain événement
            </p>
            <p style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight:300, color:S.muted, lineHeight:1.6 }}>
              Publiez votre événement et recevez des candidatures de trucks qualifiés sous 48h
            </p>
          </div>
          <button
            onClick={() => router.push("/dashboard/organisateur/evenement")}
            style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.875rem 2rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.5rem", whiteSpace:"nowrap" }}
          >
            <Plus size={14} strokeWidth={2} /> PUBLIER UN ÉVÉNEMENT
          </button>
        </div>

        {/* Pourquoi Spotruck ? */}
        <section style={{ marginBottom:"3rem" }}>
          <div style={{ marginBottom:"1.5rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}` }}>
            <h2 style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:700, color:S.brown }}>Pourquoi Spotruck ?</h2>
            <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.2rem" }}>Ce que Spotruck vous apporte concrètement</p>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"2px" }}>
            {[
              {
                icon: <Clock size={24} strokeWidth={1.5} color={S.terra} />,
                titre: "GAGNER DU TEMPS",
                desc: "Fini les dizaines de mails non qualifiés. Recevez uniquement des candidatures de trucks vérifiés et compatibles avec votre événement.",
              },
              {
                icon: <Target size={24} strokeWidth={1.5} color={S.terra} />,
                titre: "LE BON TRUCK DU PREMIER COUP",
                desc: "Spotruck analyse votre public, vos horaires et votre budget pour vous recommander les trucks les plus adaptés.",
              },
              {
                icon: <Shield size={24} strokeWidth={1.5} color={S.terra} />,
                titre: "ZÉRO RISQUE",
                desc: "Contrat sécurisé, paiement garanti et remplacement assuré en cas d'annulation de dernière minute.",
              },
              {
                icon: <ClipboardList size={24} strokeWidth={1.5} color={S.terra} />,
                titre: "TOUT CENTRALISÉ",
                desc: "Candidatures, contrats, messagerie et historique au même endroit. Plus aucun document perdu.",
              },
            ].map((bloc, i) => (
              <div key={i} style={{ backgroundColor:S.card, padding:"1.5rem 1.25rem", display:"flex", flexDirection:"column", gap:"0.75rem" }}>
                <div style={{ width:48, height:48, borderRadius:"50%", backgroundColor:"rgba(196,98,45,0.1)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  {bloc.icon}
                </div>
                <div>
                  <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.18em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>
                    {bloc.titre}
                  </p>
                  <p style={{ fontFamily:S.sans, fontSize:"0.75rem", fontWeight:300, color:S.brown, lineHeight:1.6 }}>
                    {bloc.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Conseil Spotruck */}
        <div style={{ marginBottom:"3rem", backgroundColor:"rgba(196,98,45,0.07)", border:`1px solid rgba(196,98,45,0.25)`, padding:"1.25rem 1.5rem", display:"flex", gap:"1rem", alignItems:"flex-start" }}>
          <Lightbulb size={20} strokeWidth={1.5} color={S.terra} style={{ flexShrink:0, marginTop:2 }} />
          <div>
            <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.35rem" }}>CONSEIL SPOTRUCK</p>
            <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color:S.brown, lineHeight:1.7 }}>
              Pour votre <strong style={{ fontWeight:600 }}>Festival Solstice de Juin</strong> (public 18-35 ans, soirée), nous recommandons de compléter avec <strong style={{ fontWeight:600 }}>1 truck sucré</strong> en complément de vos 2 trucks salés retenus — les crêperies et glaciers mobiles affichent un taux de satisfaction de 94% sur ce type d'événement.
            </p>
          </div>
        </div>

        {/* Candidatures récentes */}
        <div>
          <div style={{ marginBottom:"1.5rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}`, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <h2 style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:700, color:S.brown }}>Candidatures récentes</h2>
              <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.2rem" }}>Festival Solstice — Bordeaux, 21 juin 2026</p>
            </div>
            <button onClick={() => router.push("/dashboard/organisateur/candidatures")}
              style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.18em", cursor:"pointer", display:"flex", alignItems:"center", gap:"0.4rem" }}>
              VOIR TOUTES <ChevronRight size={12} strokeWidth={2} />
            </button>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:"2px" }}>
            {CANDIDATURES_RECENTES.map(c => {
              const st = STATUT_STYLE[c.statut] ?? STATUT_STYLE["EN ATTENTE"];
              return (
                <div key={c.id} style={{ backgroundColor:S.card, padding:"1.25rem 1.5rem", display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", backgroundColor:S.brown, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <span style={{ fontFamily:S.serif, fontSize:"1rem", fontWeight:700, color:S.cream }}>{c.truck[0]}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.85rem", fontWeight:600, color:S.brown }}>{c.truck}</p>
                    <p style={{ fontFamily:S.sans, fontSize:"0.7rem", fontWeight:300, color:S.muted }}>{c.cuisine} · {c.ville}</p>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginTop:"0.3rem" }}>
                      <Stars n={c.note} />
                      <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>{c.note}/5</span>
                    </div>
                  </div>
                  <div style={{ textAlign:"center" }}>
                    <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", color:S.muted, marginBottom:"0.2rem" }}>COMPATIBILITÉ</p>
                    <p style={{ fontFamily:S.serif, fontSize:"1.4rem", fontWeight:800, color:c.score >= 90 ? S.green : c.score >= 75 ? S.amber : S.muted }}>{c.score}%</p>
                  </div>
                  <span style={{ backgroundColor:st.bg, color:st.color, fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", fontWeight:700, padding:"0.3rem 0.75rem" }}>
                    {c.statut}
                  </span>
                  <button onClick={() => router.push("/dashboard/organisateur/candidatures")}
                    style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                    VOIR
                  </button>
                </div>
              );
            })}
          </div>

          {/* Événements */}
          <div style={{ marginTop:"2rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2px" }}>
            {[
              { label:"ÉVÉNEMENT ACTIF",   val:"Festival Solstice",       sub:"21 juin 2026 · Bordeaux · 2 000 visiteurs", actif:true },
              { label:"DERNIER ÉVÉNEMENT", val:"Marché de Noël Bordeaux", sub:"20 déc. 2025 · 3 trucks · Terminé",        actif:false },
            ].map(e => (
              <div key={e.label} style={{ backgroundColor:S.card, padding:"1.25rem 1.5rem" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.4rem" }}>{e.label}</p>
                <p style={{ fontFamily:S.serif, fontSize:"1rem", fontWeight:700, color:S.brown, marginBottom:"0.25rem" }}>{e.val}</p>
                <p style={{ fontFamily:S.sans, fontSize:"0.68rem", fontWeight:300, color:S.muted }}>{e.sub}</p>
                <div style={{ display:"flex", alignItems:"center", gap:"0.35rem", marginTop:"0.5rem" }}>
                  {e.actif
                    ? <><div style={{ width:6, height:6, borderRadius:"50%", backgroundColor:S.green }} /><span style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.green, letterSpacing:"0.1em" }}>EN COURS</span></>
                    : <><CheckCircle size={12} strokeWidth={2} color={S.muted} /><span style={{ fontFamily:S.sans, fontSize:"0.6rem", color:S.muted }}>Terminé</span></>
                  }
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </main>
  );
}
