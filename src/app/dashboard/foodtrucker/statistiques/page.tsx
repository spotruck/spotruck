"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import FoodtruckerSidebar from "@/components/dashboard/FoodtruckerSidebar";
import {
  TrendingUp, TrendingDown, CheckCircle, AlertTriangle,
  XCircle, ChevronDown, Target, Zap, Lock,
} from "lucide-react";

// ─── Design tokens ────────────────────────────────────────────
const S = {
  cream:  "#F2EDE4", brown:  "#2C1810", terra:  "#C4622D",
  border: "#D4C9BC", muted:  "#8C7B6E", card:   "#EDE8DF",
  green:  "#2C7A4B", red:    "#C0392B", amber:  "#B8850A",
  blue:   "#2E6DA4",
  serif:  "'Playfair Display', Georgia, serif",
  sans:   "'Inter', Helvetica, sans-serif",
};

type PlanKey = "free" | "pro" | "premium" | "saison";
type Periode = "mois" | "3mois" | "6mois" | "annee";

// ─── Données historiques mock (8 mois) ───────────────────────
interface MoisData {
  key:    string;  // "2025-11"
  label:  string;  // "Nov."
  ca:     number;
  events: number;
  candEnvoyees: number;
  candAcceptees: number;
  droitPlace:    number;  // nb events
  privatisation: number;
}

const HISTORIQUE: MoisData[] = [
  { key:"2025-11", label:"Nov.",  ca:1200, events:2, candEnvoyees:5,  candAcceptees:3, droitPlace:1, privatisation:1 },
  { key:"2025-12", label:"Déc.",  ca: 800, events:2, candEnvoyees:4,  candAcceptees:2, droitPlace:2, privatisation:0 },
  { key:"2026-01", label:"Jan.",  ca: 900, events:2, candEnvoyees:4,  candAcceptees:2, droitPlace:1, privatisation:1 },
  { key:"2026-02", label:"Fév.",  ca:1100, events:3, candEnvoyees:6,  candAcceptees:4, droitPlace:2, privatisation:1 },
  { key:"2026-03", label:"Mars",  ca:1800, events:3, candEnvoyees:7,  candAcceptees:5, droitPlace:2, privatisation:1 },
  { key:"2026-04", label:"Avr.",  ca:2400, events:4, candEnvoyees:8,  candAcceptees:5, droitPlace:3, privatisation:1 },
  { key:"2026-05", label:"Mai",   ca:3200, events:5, candEnvoyees:9,  candAcceptees:6, droitPlace:3, privatisation:2 },
  { key:"2026-06", label:"Juin",  ca:2100, events:3, candEnvoyees:6,  candAcceptees:4, droitPlace:2, privatisation:1 },
];

const EVENTS_PASSES = [
  { id:"e1", label:"Festival Garorock — juin 2026",       ca:950,  charges:320, droitPlace:200 },
  { id:"e2", label:"Gala Tech Corp — mai 2026",           ca:3500, charges:480, droitPlace:0   },
  { id:"e3", label:"Estivales de Montpellier — mai 2026", ca:680,  charges:210, droitPlace:350 },
  { id:"e4", label:"Foire de Bordeaux — avr. 2026",       ca:1200, charges:380, droitPlace:600 },
  { id:"e5", label:"Marché nocturne Arcachon — avr. 2026",ca:480,  charges:140, droitPlace:180 },
];

// ─── LocalStorage ─────────────────────────────────────────────
const LS_ABO     = "spotruck_abonnement";
const LS_CALCULS = "spotruck_calculs_renta";
const LS_OBJEC   = "spotruck_objectifs";

function loadLS<T>(key: string, fb: T): T {
  if (typeof window === "undefined") return fb;
  try { const r = localStorage.getItem(key); return r ? JSON.parse(r) : fb; }
  catch { return fb; }
}
function saveLS(key: string, val: unknown) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
}

// ─── Helpers ──────────────────────────────────────────────────
function fmtCur(n: number) { return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " €"; }
function pct(n: number)  { return Math.round(n) + "%"; }

function slicePeriode(hist: MoisData[], p: Periode): { cur: MoisData[]; prev: MoisData[] } {
  const n = p === "mois" ? 1 : p === "3mois" ? 3 : p === "6mois" ? 6 : 8;
  const cur  = hist.slice(-n);
  const prev = hist.slice(-n * 2, -n);
  return { cur, prev };
}

function sumCA(data: MoisData[]) { return data.reduce((a, b) => a + b.ca, 0); }
function sumEvt(data: MoisData[]) { return data.reduce((a, b) => a + b.events, 0); }
function sumCandEnv(data: MoisData[]) { return data.reduce((a, b) => a + b.candEnvoyees, 0); }
function sumCandAcc(data: MoisData[]) { return data.reduce((a, b) => a + b.candAcceptees, 0); }

function variation(cur: number, prev: number): number {
  if (prev === 0) return 0;
  return Math.round(((cur - prev) / prev) * 100);
}

// ─── Toast ────────────────────────────────────────────────────
function Toast({ msg, color = S.green, onDone }: { msg: string; color?: string; onDone: () => void }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position:"fixed", bottom:"2rem", left:"50%", transform:"translateX(-50%)", backgroundColor:color, color:"#fff", zIndex:4000, display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.875rem 1.75rem", boxShadow:"0 8px 24px rgba(0,0,0,0.2)", fontFamily:S.sans, fontSize:"0.78rem", letterSpacing:"0.08em", animation:"toastIn 0.25s ease", whiteSpace:"nowrap" }}>
      <CheckCircle size={16} strokeWidth={2} /> {msg}
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(-50%) translateY(10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}

// ─── Variation badge ──────────────────────────────────────────
function VarBadge({ pct: p }: { pct: number }) {
  if (p === 0) return <span style={{ fontFamily:S.sans, fontSize:"0.65rem", color:S.muted }}>—</span>;
  const up = p > 0;
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.2rem", color: up ? S.green : S.red, fontFamily:S.sans, fontSize:"0.68rem", fontWeight:600 }}>
      {up ? <TrendingUp size={12} strokeWidth={2} /> : <TrendingDown size={12} strokeWidth={2} />}
      {up ? "+" : ""}{p}%
    </span>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────
function KpiCard({ label, value, sub, varPct, detail }: {
  label: string; value: string; sub: string; varPct: number; detail?: string;
}) {
  return (
    <div style={{ backgroundColor:S.card, padding:"1.5rem" }}>
      <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.6rem" }}>{label}</p>
      <div style={{ display:"flex", alignItems:"baseline", gap:"0.75rem", marginBottom:"0.3rem" }}>
        <span style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, color:S.brown, lineHeight:1 }}>{value}</span>
        <VarBadge pct={varPct} />
      </div>
      {detail && <p style={{ fontFamily:S.sans, fontSize:"0.7rem", fontWeight:300, color:S.brown, marginBottom:"0.2rem" }}>{detail}</p>}
      <p style={{ fontFamily:S.sans, fontSize:"0.65rem", fontWeight:300, color:S.muted }}>{sub}</p>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────
function SH({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom:"1.5rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}` }}>
      <h2 style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:700, color:S.brown }}>{title}</h2>
      {sub && <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.25rem" }}>{sub}</p>}
    </div>
  );
}

// ─── SVG Bar chart (vertical) ─────────────────────────────────
function BarChartV({ data, width = 680, height = 180 }: {
  data: { label: string; value: number; highlight?: boolean }[];
  width?: number; height?: number;
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const pad    = { top:10, right:8, bottom:32, left:52 };
  const chartW = width  - pad.left - pad.right;
  const chartH = height - pad.top  - pad.bottom;
  const barW   = Math.floor(chartW / data.length * 0.6);
  const gap    = chartW / data.length;
  const avg    = data.reduce((a, b) => a + b.value, 0) / data.length;
  const avgY   = chartH - (avg / maxVal) * chartH + pad.top;

  // Y-axis ticks
  const ticks = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(maxVal * f));

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display:"block" }}>
      {/* Y gridlines & labels */}
      {ticks.map(t => {
        const y = chartH - (t / maxVal) * chartH + pad.top;
        return (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y} y2={y} stroke={S.border} strokeWidth={1} strokeDasharray={t === 0 ? undefined : "4,3"} />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fill={S.muted} fontFamily={S.sans} fontSize={9}>{t === 0 ? "0" : (t >= 1000 ? `${t/1000}k` : t)}</text>
          </g>
        );
      })}

      {/* Avg line */}
      <line x1={pad.left} x2={width - pad.right} y1={avgY} y2={avgY} stroke={S.amber} strokeWidth={1.5} strokeDasharray="6,4" />
      <text x={width - pad.right - 2} y={avgY - 4} textAnchor="end" fill={S.amber} fontFamily={S.sans} fontSize={9}>moy.</text>

      {/* Bars */}
      {data.map((d, i) => {
        const barH = (d.value / maxVal) * chartH;
        const x    = pad.left + gap * i + (gap - barW) / 2;
        const y    = chartH - barH + pad.top;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={d.highlight ? S.terra : "rgba(196,98,45,0.55)"} rx={2} />
            <text x={x + barW / 2} y={height - pad.bottom + 14} textAnchor="middle" fill={S.muted} fontFamily={S.sans} fontSize={9}>{d.label}</text>
            {d.value > 0 && (
              <text x={x + barW / 2} y={y - 3} textAnchor="middle" fill={S.brown} fontFamily={S.sans} fontSize={8} fontWeight="600">
                {d.value >= 1000 ? `${(d.value/1000).toFixed(1)}k` : d.value}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ─── SVG Line / projection chart ──────────────────────────────
function LineChartProj({ hist, proj }: {
  hist:  { label: string; value: number }[];
  proj:  { label: string; opt: number; base: number; pes: number }[];
}) {
  const all  = [...hist.map(d => d.value), ...proj.map(d => d.opt)];
  const maxV = Math.max(...all, 1);
  const W = 680; const H = 180;
  const pad = { top:10, right:10, bottom:30, left:52 };
  const cW  = W - pad.left - pad.right;
  const cH  = H - pad.top  - pad.bottom;
  const pts  = [...hist, ...proj.map(d => ({ label:d.label, value:d.base }))];
  const n    = pts.length;
  const xOf  = (i: number) => pad.left + (i / (n - 1)) * cW;
  const yOf  = (v: number) => pad.top + cH - (v / maxV) * cH;

  const histPath = hist.map((d, i) => `${i === 0 ? "M" : "L"}${xOf(i)},${yOf(d.value)}`).join(" ");
  const basePath = proj.map((d, i) => `${i === 0 ? `M${xOf(hist.length - 1)},${yOf(hist[hist.length-1].value)} L` : "L"}${xOf(hist.length + i)},${yOf(d.base)}`).join(" ");
  const optPath  = proj.map((d, i) => `${i === 0 ? `M${xOf(hist.length - 1)},${yOf(hist[hist.length-1].value)} L` : "L"}${xOf(hist.length + i)},${yOf(d.opt)}`).join(" ");
  const pesPath  = proj.map((d, i) => `${i === 0 ? `M${xOf(hist.length - 1)},${yOf(hist[hist.length-1].value)} L` : "L"}${xOf(hist.length + i)},${yOf(d.pes)}`).join(" ");

  // Zone de projection (remplie)
  const topPts = proj.map((d, i) => `${xOf(hist.length + i)},${yOf(d.opt)}`).join(" ");
  const botPts = [...proj].reverse().map((d, i, arr) => `${xOf(hist.length + arr.length - 1 - i)},${yOf(d.pes)}`).join(" ");
  const zoneD  = hist.length > 0
    ? `M${xOf(hist.length-1)},${yOf(hist[hist.length-1].value)} ${topPts} ${botPts} Z`
    : "";

  const ticks = [0, 0.5, 1].map(f => Math.round(maxV * f));

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:"block" }}>
      {ticks.map(t => {
        const y = yOf(t);
        return (
          <g key={t}>
            <line x1={pad.left} x2={W - pad.right} y1={y} y2={y} stroke={S.border} strokeWidth={1} strokeDasharray="4,3" />
            <text x={pad.left - 6} y={y + 4} textAnchor="end" fill={S.muted} fontFamily={S.sans} fontSize={9}>
              {t >= 1000 ? `${t/1000}k` : t}
            </text>
          </g>
        );
      })}

      {/* Zone projection */}
      {zoneD && <path d={zoneD} fill="rgba(196,98,45,0.08)" />}

      {/* Lignes projection */}
      {optPath && <path d={optPath} fill="none" stroke={S.green}  strokeWidth={1.5} strokeDasharray="5,3" />}
      {pesPath && <path d={pesPath} fill="none" stroke={S.red}    strokeWidth={1.5} strokeDasharray="5,3" />}
      {basePath && <path d={basePath} fill="none" stroke={S.terra} strokeWidth={2}   strokeDasharray="6,4" />}

      {/* Historique */}
      <path d={histPath} fill="none" stroke={S.terra} strokeWidth={2.5} />
      {hist.map((d, i) => (
        <circle key={i} cx={xOf(i)} cy={yOf(d.value)} r={3} fill={S.terra} />
      ))}

      {/* Labels X */}
      {pts.map((d, i) => (
        <text key={i} x={xOf(i)} y={H - pad.bottom + 14} textAnchor="middle" fill={S.muted} fontFamily={S.sans} fontSize={9}>{d.label}</text>
      ))}
    </svg>
  );
}

// ─── SVG Donut ────────────────────────────────────────────────
function Donut({ slices }: { slices: { label: string; value: number; color: string }[] }) {
  const total = slices.reduce((a, b) => a + b.value, 0) || 1;
  const R = 52; const r = 30; const cx = 70; const cy = 70;
  let angle = -Math.PI / 2;
  const paths = slices.map(s => {
    const sweep = (s.value / total) * 2 * Math.PI;
    const x1 = cx + R * Math.cos(angle);
    const y1 = cy + R * Math.sin(angle);
    angle += sweep;
    const x2 = cx + R * Math.cos(angle);
    const y2 = cy + R * Math.sin(angle);
    const ix1 = cx + r * Math.cos(angle - sweep);
    const iy1 = cy + r * Math.sin(angle - sweep);
    const ix2 = cx + r * Math.cos(angle);
    const iy2 = cy + r * Math.sin(angle);
    const lg = sweep > Math.PI ? 1 : 0;
    return {
      d: `M${x1},${y1} A${R},${R} 0 ${lg},1 ${x2},${y2} L${ix2},${iy2} A${r},${r} 0 ${lg},0 ${ix1},${iy1} Z`,
      color: s.color,
    };
  });
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"1.5rem", flexWrap:"wrap" }}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {paths.map((p, i) => <path key={i} d={p.d} fill={p.color} />)}
      </svg>
      <div style={{ display:"flex", flexDirection:"column", gap:"0.5rem" }}>
        {slices.map(s => (
          <div key={s.label} style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
            <div style={{ width:10, height:10, borderRadius:"50%", backgroundColor:s.color, flexShrink:0 }} />
            <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.brown }}>
              {s.label}
              <span style={{ color:S.muted, marginLeft:"0.35rem" }}>{pct(Math.round(s.value / total * 100))}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Barre horizontale ────────────────────────────────────────
function HBar({ label, pct: p, color = S.terra }: { label: string; pct: number; color?: string }) {
  return (
    <div style={{ marginBottom:"0.75rem" }}>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.3rem" }}>
        <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.brown }}>{label}</span>
        <span style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:600, color:S.brown }}>{p}%</span>
      </div>
      <div style={{ height:8, backgroundColor:S.border, position:"relative" }}>
        <div style={{ position:"absolute", left:0, top:0, height:"100%", width:`${p}%`, backgroundColor:color, transition:"width 0.5s ease" }} />
      </div>
    </div>
  );
}

// ─── Progress bar objectif ────────────────────────────────────
function ProgressBar({ cur, target, unit }: { cur: number; target: number; unit: string }) {
  const p   = target > 0 ? Math.min(Math.round((cur / target) * 100), 100) : 0;
  const col = p >= 80 ? S.green : p >= 50 ? S.amber : S.red;
  return (
    <div>
      <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.4rem" }}>
        <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted }}>
          {unit === "€" ? fmtCur(cur) : cur + (unit === "%" ? "%" : "")} / {unit === "€" ? fmtCur(target) : target + (unit === "%" ? "%" : "")}
        </span>
        <span style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:700, color:col }}>{p}%</span>
      </div>
      <div style={{ height:10, backgroundColor:S.border }}>
        <div style={{ height:"100%", width:`${p}%`, backgroundColor:col, transition:"width 0.6s ease" }} />
      </div>
    </div>
  );
}

// ─── Verrou Premium ───────────────────────────────────────────
function LockBanner({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div style={{ border:`1px solid ${S.terra}`, padding:"2rem", textAlign:"center", backgroundColor:"rgba(196,98,45,0.04)" }}>
      <Lock size={28} strokeWidth={1.5} color={S.terra} style={{ marginBottom:"0.75rem" }} />
      <h3 style={{ fontFamily:S.serif, fontSize:"1.2rem", fontWeight:700, color:S.brown, marginBottom:"0.5rem" }}>
        Analyses avancées — Plan Premium
      </h3>
      <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color:S.muted, lineHeight:1.6, marginBottom:"1.25rem", maxWidth:480, margin:"0 auto 1.25rem" }}>
        Accédez aux projections, comparaisons mensuelles, analyse géographique et meilleure période en passant au plan supérieur.
      </p>
      <button
        onClick={onUpgrade}
        style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.875rem 2rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer", display:"inline-flex", alignItems:"center", gap:"0.5rem" }}
      >
        <Zap size={14} strokeWidth={1.5} /> PASSER EN PREMIUM
      </button>
    </div>
  );
}

// ─── Select simple ────────────────────────────────────────────
function Sel({ value, options, onChange, style: sx }: {
  value: string; options: string[]; onChange: (v: string) => void; style?: React.CSSProperties;
}) {
  return (
    <div style={{ position:"relative", display:"inline-block", ...sx }}>
      <select
        value={value} onChange={e => onChange(e.target.value)}
        style={{ appearance:"none", WebkitAppearance:"none", backgroundColor:"transparent", border:`1px solid ${S.border}`, color:S.brown, fontFamily:S.sans, fontSize:"0.72rem", padding:"0.5rem 2rem 0.5rem 0.75rem", outline:"none", cursor:"pointer", width:"100%" }}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={11} strokeWidth={1.5} color={S.muted} style={{ position:"absolute", right:"0.5rem", top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }} />
    </div>
  );
}

// ─── Field ────────────────────────────────────────────────────
function Field({ label, value, onChange, type = "number", placeholder }: {
  label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string;
}) {
  return (
    <div>
      <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, display:"block", marginBottom:"0.35rem" }}>{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder ?? "0"}
        style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.85rem", color:S.brown, outline:"none" }}
      />
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────
export default function StatistiquesPage() {
  const router = useRouter();

  // Plan
  const [plan, setPlan] = useState<PlanKey>("pro");
  useEffect(() => {
    const abo = loadLS<{ plan: PlanKey }>(LS_ABO, { plan: "pro" });
    setPlan(abo.plan);
  }, []);

  const isPremium = plan === "premium";
  const isFree    = plan === "free";

  // Période
  const [periode, setPeriode] = useState<Periode>("6mois");
  const periodeLabels: Record<Periode, string> = {
    mois:"Ce mois", "3mois":"3 mois", "6mois":"6 mois", annee:"Cette année",
  };

  const { cur, prev } = useMemo(() => slicePeriode(HISTORIQUE, periode), [periode]);

  // KPIs
  const caTotal    = sumCA(cur);
  const caPrec     = sumCA(prev);
  const evtTotal   = sumEvt(cur);
  const evtPrec    = sumEvt(prev);
  const candEnv    = sumCandEnv(cur);
  const candAcc    = sumCandAcc(cur);
  const candEnvPrev= sumCandEnv(prev);
  const candAccPrev= sumCandAcc(prev);
  const tauxAcc    = candEnv > 0 ? Math.round((candAcc / candEnv) * 100) : 0;
  const tauxPrev   = candEnvPrev > 0 ? Math.round((candAccPrev / candEnvPrev) * 100) : 0;
  const caEvt      = evtTotal > 0 ? caTotal / evtTotal : 0;
  const caEvtPrev  = evtPrec  > 0 ? caPrec  / evtPrec  : 0;
  const droitPlaceTotal = cur.reduce((a, b) => a + b.droitPlace, 0);
  const privatTotal     = cur.reduce((a, b) => a + b.privatisation, 0);

  // ─── Calculateur rentabilité ──────────────────────────────
  const [calcEvtSel,      setCalcEvtSel]      = useState("");
  const [calcNom,         setCalcNom]         = useState("");
  const [calcTypeOff,     setCalcTypeOff]     = useState("Droit de place");
  const [calcDroit,       setCalcDroit]       = useState("");
  const [calcCa,          setCalcCa]          = useState("");
  const [calcMP,          setCalcMP]          = useState("");
  const [calcPerso,       setCalcPerso]       = useState("");
  const [calcDeplac,      setCalcDeplac]      = useState("");
  const [calcAutres,      setCalcAutres]      = useState("");
  // Nouveaux états calculateur
  const [calcTVAMode,     setCalcTVAMode]     = useState<"HT"|"TTC">("HT");
  const [calcTVA,         setCalcTVA]         = useState<"5.5"|"10"|"20">("10");
  const [calcMPMode,      setCalcMPMode]      = useState<"montant"|"pct">("montant");
  const [calcMPPct,       setCalcMPPct]       = useState("30");
  const [calcOrgPctOn,    setCalcOrgPctOn]    = useState(false);
  const [calcOrgPct,      setCalcOrgPct]      = useState("");
  const [calcPanierMoyen, setCalcPanierMoyen] = useState("12");

  function applyPreset(id: string) {
    const e = EVENTS_PASSES.find(x => x.id === id);
    if (!e) return;
    setCalcNom(e.label);
    setCalcTypeOff(e.droitPlace > 0 ? "Droit de place" : "Privatisation");
    setCalcDroit(e.droitPlace > 0 ? String(e.droitPlace) : "");
    setCalcCa(String(e.ca));
    setCalcMP(String(e.charges));
    setCalcPerso(""); setCalcDeplac(""); setCalcAutres("");
    setCalcEvtSel(id);
  }

  const caSaisi    = parseFloat(calcCa)    || 0;
  const tvaRate    = parseFloat(calcTVA)   / 100;
  // caHT = base de calcul (toujours en HT)
  const caHT       = calcTVAMode === "HT" ? caSaisi : caSaisi / (1 + tvaRate);
  const caTTC      = calcTVAMode === "TTC" ? caSaisi : caSaisi * (1 + tvaRate);
  const caBrut     = caHT; // alias pour compatibilité
  const droitN     = parseFloat(calcDroit)  || 0;
  const orgPctVal  = calcOrgPctOn ? (parseFloat(calcOrgPct) || 0) : 0;
  const orgPctCharge = caHT * orgPctVal / 100;
  const chargesOrga  = droitN + orgPctCharge;
  const mp         = calcMPMode === "montant"
    ? (parseFloat(calcMP) || 0)
    : caHT * (parseFloat(calcMPPct) || 0) / 100;
  const mpRatioPct = caHT > 0 ? (mp / caHT) * 100 : 0;
  const mpColor    = mpRatioPct >= 45 ? S.red : mpRatioPct >= 35 ? S.amber : S.green;
  const perso      = parseFloat(calcPerso)  || 0;
  const deplac     = parseFloat(calcDeplac) || 0;
  const autres     = parseFloat(calcAutres) || 0;
  const chargesExpl    = mp + perso + deplac + autres;
  const totalCharges   = chargesOrga + chargesExpl;
  const margeBrute     = caHT - mp;
  const resultatNet    = caHT - totalCharges;
  const margeNetPct    = caHT > 0 ? Math.round((resultatNet / caHT) * 100) : 0;
  const margeBrutPct   = caHT > 0 ? Math.round((margeBrute  / caHT) * 100) : 0;
  const panierMoyen    = parseFloat(calcPanierMoyen) || 0;
  const seuilClients   = panierMoyen > 0 ? Math.ceil(totalCharges / panierMoyen) : 0;

  const [toast, setToast] = useState<{ msg: string; color?: string } | null>(null);

  const saveCalc = useCallback(() => {
    const list = loadLS<object[]>(LS_CALCULS, []);
    list.push({ nom:calcNom||"Calcul sans nom", ca:caHT, charges:totalCharges, net:resultatNet, pct:margeNetPct, date:new Date().toISOString() });
    saveLS(LS_CALCULS, list);
    setToast({ msg:"Calcul sauvegardé" });
  }, [calcNom, caHT, totalCharges, resultatNet, margeNetPct]);

  // ─── Objectifs ────────────────────────────────────────────
  const [objCA,     setObjCA]     = useState(3000);
  const [objEvts,   setObjEvts]   = useState(4);
  const [objTaux,   setObjTaux]   = useState(70);
  const [editObj,   setEditObj]   = useState(false);
  const [draftCA,   setDraftCA]   = useState("3000");
  const [draftEvts, setDraftEvts] = useState("4");
  const [draftTaux, setDraftTaux] = useState("70");

  useEffect(() => {
    const o = loadLS<{ ca:number; evts:number; taux:number }>(LS_OBJEC, { ca:3000, evts:4, taux:70 });
    setObjCA(o.ca); setObjEvts(o.evts); setObjTaux(o.taux);
    setDraftCA(String(o.ca)); setDraftEvts(String(o.evts)); setDraftTaux(String(o.taux));
  }, []);

  function saveObj() {
    const ca = parseInt(draftCA) || 3000;
    const ev = parseInt(draftEvts) || 4;
    const tx = parseInt(draftTaux) || 70;
    setObjCA(ca); setObjEvts(ev); setObjTaux(tx);
    saveLS(LS_OBJEC, { ca, evts:ev, taux:tx });
    setEditObj(false);
    setToast({ msg:"Objectifs mis à jour" });
  }

  // Mois courant pour objectifs
  const moisCur = HISTORIQUE[HISTORIQUE.length - 1];
  const caMonth = moisCur.ca;
  const evtsMonth= moisCur.events;
  const tauxMonth= moisCur.candEnvoyees > 0
    ? Math.round((moisCur.candAcceptees / moisCur.candEnvoyees) * 100) : 0;

  // ─── Données Premium ──────────────────────────────────────
  const barData = HISTORIQUE.map((d, i) => ({
    label: d.label, value: d.ca, highlight: i === HISTORIQUE.length - 1,
  }));
  const bestMois  = HISTORIQUE.reduce((a, b) => a.ca > b.ca ? a : b);

  // Projection sur 4 mois futurs
  const avgLast3  = HISTORIQUE.slice(-3).reduce((a, b) => a + b.ca, 0) / 3;
  const projLabels = ["Juil.", "Août", "Sept.", "Oct."];
  const projData   = projLabels.map((label, i) => ({
    label,
    base: Math.round(avgLast3 * (1 + i * 0.02)),
    opt:  Math.round(avgLast3 * 1.2 * (1 + i * 0.02)),
    pes:  Math.round(avgLast3 * 0.8 * (1 + i * 0.02)),
  }));
  const caAnnuelProj = Math.round((sumCA(HISTORIQUE) / HISTORIQUE.length) * 12);
  const caAnnuelOpt  = Math.round(caAnnuelProj * 1.2);
  const caAnnuelPes  = Math.round(caAnnuelProj * 0.8);

  if (isFree) return (
    <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
      <FoodtruckerSidebar active="/dashboard/foodtrucker/statistiques" />
      <div style={{ padding:"3rem", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"1.5rem", textAlign:"center" }}>
        <Lock size={40} strokeWidth={1.5} color={S.terra} />
        <h1 style={{ fontFamily:S.serif, fontSize:"2rem", fontWeight:800, color:S.brown }}>Statistiques réservées aux abonnés</h1>
        <p style={{ fontFamily:S.sans, fontSize:"0.875rem", fontWeight:300, color:S.muted, maxWidth:460, lineHeight:1.7 }}>
          Accédez à vos statistiques de performance, calculateur de rentabilité et analyses avancées en passant au plan Pro ou Premium.
        </p>
        <button onClick={() => router.push("/dashboard/foodtrucker/parametres")}
          style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.875rem 2rem", fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.2em", cursor:"pointer" }}>
          VOIR LES PLANS
        </button>
      </div>
    </main>
  );

  return (
    <>
      <main style={{ minHeight:"100vh", backgroundColor:S.cream, color:S.brown, display:"grid", gridTemplateColumns:"260px 1fr" }}>
        <FoodtruckerSidebar active="/dashboard/foodtrucker/statistiques" />

        <div style={{ padding:"3rem", maxWidth:1100, minWidth:0 }}>

          {/* ── Header ── */}
          <div style={{ marginBottom:"2.5rem", display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:"1rem" }}>
            <div>
              <p style={{ fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", color:S.muted, marginBottom:"0.5rem" }}>DASHBOARD — FOODTRUCKER</p>
              <h1 style={{ fontFamily:S.serif, fontSize:"2.2rem", fontWeight:800, lineHeight:1.1, marginBottom:"0.4rem" }}>Mes statistiques</h1>
              <p style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:300, color:S.muted }}>Analysez votre activité et optimisez votre rentabilité</p>
              <div style={{ marginTop:"0.75rem" }}>
                <span style={{
                  display:"inline-flex", alignItems:"center", gap:"0.35rem",
                  backgroundColor: isPremium ? "rgba(196,98,45,0.12)" : "rgba(44,122,75,0.1)",
                  color: isPremium ? S.terra : S.green,
                  fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.18em", fontWeight:700, padding:"0.3rem 0.7rem",
                }}>
                  {isPremium ? <Zap size={11} strokeWidth={2} /> : <CheckCircle size={11} strokeWidth={2} />}
                  PLAN {plan.toUpperCase()}
                </span>
              </div>
            </div>
            {/* Sélecteur période */}
            <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.4rem" }}>
              <span style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted }}>PÉRIODE</span>
              <div style={{ display:"flex", gap:"2px" }}>
                {(Object.keys(periodeLabels) as Periode[]).map(p => (
                  <button key={p} onClick={() => setPeriode(p)} style={{
                    backgroundColor: periode === p ? S.terra : "transparent",
                    color: periode === p ? "#fff" : S.muted,
                    border:`1px solid ${periode === p ? S.terra : S.border}`,
                    padding:"0.45rem 0.85rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em",
                    cursor:"pointer", transition:"background-color 0.15s",
                  }}>{periodeLabels[p]}</button>
                ))}
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════
              SECTION 1 — KPIs
          ══════════════════════════════════════════ */}
          <section style={{ marginBottom:"3rem" }}>
            <SH title="Vue d'ensemble" sub={`Sur les ${periodeLabels[periode].toLowerCase()}`} />
            <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:"2px" }}>
              <KpiCard
                label="CA TOTAL"
                value={fmtCur(caTotal)}
                varPct={variation(caTotal, caPrec)}
                sub="sur la période sélectionnée"
              />
              <KpiCard
                label="ÉVÉNEMENTS RÉALISÉS"
                value={String(evtTotal)}
                varPct={variation(evtTotal, evtPrec)}
                detail={`${droitPlaceTotal} droits de place · ${privatTotal} privatisations`}
                sub="événements terminés"
              />
              <KpiCard
                label="TAUX D'ACCEPTATION"
                value={pct(tauxAcc)}
                varPct={variation(tauxAcc, tauxPrev)}
                detail={`${candAcc} acc. / ${candEnv} envoyées`}
                sub="candidatures acceptées"
              />
              <KpiCard
                label="CA MOYEN / ÉVÉNEMENT"
                value={fmtCur(caEvt)}
                varPct={variation(caEvt, caEvtPrev)}
                detail={`Min ${fmtCur(Math.min(...cur.filter(d=>d.events>0).map(d=>d.ca/d.events)))} · Max ${fmtCur(Math.max(...cur.map(d=>d.events>0?d.ca/d.events:0)))}`}
                sub="par événement réalisé"
              />
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SECTION 2 — CALCULATEUR
          ══════════════════════════════════════════ */}
          <section style={{ marginBottom:"3rem" }}>
            <SH title="Calculateur de rentabilité" sub="Analysez la rentabilité de chaque événement en temps réel" />

            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem", alignItems:"start" }}>
              {/* Formulaire */}
              <div>
                {/* Événement existant */}
                <div style={{ marginBottom:"1.25rem" }}>
                  <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, display:"block", marginBottom:"0.35rem" }}>CHARGER UN ÉVÉNEMENT PASSÉ</label>
                  <Sel
                    value={calcEvtSel}
                    options={["— Saisie manuelle —", ...EVENTS_PASSES.map(e => e.id)]}
                    onChange={v => { if (v === "— Saisie manuelle —") { setCalcEvtSel(""); } else applyPreset(v); }}
                    style={{ width:"100%" }}
                  />
                  {calcEvtSel && (
                    <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted, marginTop:"0.3rem" }}>
                      {EVENTS_PASSES.find(e => e.id === calcEvtSel)?.label}
                    </p>
                  )}
                </div>

                {/* Toggle HT / TTC + TVA */}
                <div style={{ marginBottom:"1rem", display:"flex", alignItems:"center", gap:"0.75rem", flexWrap:"wrap" }}>
                  <span style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted }}>SAISIE EN</span>
                  {(["HT","TTC"] as const).map(m => (
                    <button key={m} onClick={() => setCalcTVAMode(m)} style={{
                      padding:"0.3rem 0.75rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.15em",
                      backgroundColor: calcTVAMode === m ? S.terra : "transparent",
                      color: calcTVAMode === m ? "#fff" : S.muted,
                      border:`1px solid ${calcTVAMode === m ? S.terra : S.border}`, cursor:"pointer",
                    }}>{m}</button>
                  ))}
                  <span style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, marginLeft:"0.5rem" }}>TVA</span>
                  {(["5.5","10","20"] as const).map(t => (
                    <button key={t} onClick={() => setCalcTVA(t)} style={{
                      padding:"0.3rem 0.65rem", fontFamily:S.sans, fontSize:"0.62rem",
                      backgroundColor: calcTVA === t ? S.brown : "transparent",
                      color: calcTVA === t ? "#fff" : S.muted,
                      border:`1px solid ${calcTVA === t ? S.brown : S.border}`, cursor:"pointer",
                    }}>{t}%</button>
                  ))}
                </div>
                {caSaisi > 0 && (
                  <p style={{ fontFamily:S.sans, fontSize:"0.68rem", color:S.muted, marginBottom:"0.75rem" }}>
                    CA HT : <strong style={{ color:S.brown }}>{fmtCur(caHT)}</strong>
                    {" · "}CA TTC : <strong style={{ color:S.brown }}>{fmtCur(caTTC)}</strong>
                  </p>
                )}

                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.75rem" }}>
                  <Field label="NOM DE L'ÉVÉNEMENT" value={calcNom} onChange={setCalcNom} type="text" placeholder="Ex: Festival Garorock" />
                  <div>
                    <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, display:"block", marginBottom:"0.35rem" }}>TYPE</label>
                    <Sel value={calcTypeOff} options={["Droit de place","Privatisation"]} onChange={setCalcTypeOff} style={{ width:"100%" }} />
                  </div>
                  {calcTypeOff === "Droit de place" ? (
                    <Field label="DROIT DE PLACE (€)" value={calcDroit} onChange={setCalcDroit} />
                  ) : (
                    <Field label="RÉMUNÉRATION REÇUE (€)" value={calcDroit} onChange={setCalcDroit} />
                  )}
                  <Field label={`CA RÉALISÉ SUR PLACE (${calcTVAMode})`} value={calcCa} onChange={setCalcCa} />

                  {/* % CA organisateur */}
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.4rem" }}>
                      <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted }}>% CA PRÉLEVÉ PAR L'ORGANISATEUR</label>
                      <button onClick={() => setCalcOrgPctOn(v => !v)} style={{
                        padding:"0.2rem 0.6rem", fontFamily:S.sans, fontSize:"0.6rem",
                        backgroundColor: calcOrgPctOn ? S.terra : "transparent",
                        color: calcOrgPctOn ? "#fff" : S.muted,
                        border:`1px solid ${calcOrgPctOn ? S.terra : S.border}`, cursor:"pointer",
                      }}>{calcOrgPctOn ? "OUI" : "NON"}</button>
                    </div>
                    {calcOrgPctOn && (
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                        <input type="number" value={calcOrgPct} onChange={e => setCalcOrgPct(e.target.value)} placeholder="0"
                          style={{ width:80, border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.5rem 0.6rem", fontFamily:S.sans, fontSize:"0.85rem", color:S.brown, outline:"none" }} />
                        <span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.muted }}>% du CA HT = {fmtCur(orgPctCharge)}</span>
                      </div>
                    )}
                  </div>

                  {/* Matières premières */}
                  <div style={{ gridColumn:"1/-1" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"0.5rem", flexWrap:"wrap" }}>
                      <label style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted }}>MATIÈRES PREMIÈRES</label>
                      {(["montant","pct"] as const).map(m => (
                        <button key={m} onClick={() => setCalcMPMode(m)} style={{
                          padding:"0.2rem 0.6rem", fontFamily:S.sans, fontSize:"0.6rem",
                          backgroundColor: calcMPMode === m ? S.brown : "transparent",
                          color: calcMPMode === m ? "#fff" : S.muted,
                          border:`1px solid ${calcMPMode === m ? S.brown : S.border}`, cursor:"pointer",
                        }}>{m === "montant" ? "Montant €" : "% CA HT"}</button>
                      ))}
                    </div>
                    {calcMPMode === "montant" ? (
                      <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                        <input type="number" value={calcMP} onChange={e => setCalcMP(e.target.value)} placeholder="0"
                          style={{ width:"100%", border:`1px solid ${S.border}`, backgroundColor:"transparent", padding:"0.6rem 0.75rem", fontFamily:S.sans, fontSize:"0.85rem", color:S.brown, outline:"none" }} />
                        {caHT > 0 && <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:mpColor, whiteSpace:"nowrap", fontWeight:600 }}>{Math.round(mpRatioPct)}% du CA HT</span>}
                      </div>
                    ) : (
                      <div>
                        <div style={{ display:"flex", alignItems:"center", gap:"1rem", marginBottom:"0.35rem" }}>
                          <input type="range" min={0} max={60} value={calcMPPct} onChange={e => setCalcMPPct(e.target.value)}
                            style={{ flex:1, accentColor:mpColor }} />
                          <span style={{ fontFamily:S.sans, fontSize:"0.85rem", fontWeight:700, color:mpColor, minWidth:36 }}>{calcMPPct}%</span>
                          <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted }}>{fmtCur(mp)}</span>
                        </div>
                        {/* Repère sectoriel */}
                        <div style={{ fontSize:"0.65rem", fontFamily:S.sans, display:"flex", gap:"0.5rem", alignItems:"center" }}>
                          <div style={{ width:8, height:8, borderRadius:"50%", backgroundColor:mpColor }} />
                          <span style={{ color:mpColor, fontWeight:600 }}>
                            {mpRatioPct < 28 ? "En dessous de la norme" : mpRatioPct <= 35 ? "Dans la norme sectorielle" : mpRatioPct <= 45 ? "Au-dessus de la norme" : "Trop élevé — optimiser"}
                          </span>
                          <span style={{ color:S.muted }}>— Norme secteur : 28–35%</span>
                        </div>
                      </div>
                    )}
                    {/* Code couleur ratio MP */}
                    {calcMPMode === "montant" && caHT > 0 && (
                      <p style={{ fontFamily:S.sans, fontSize:"0.65rem", color:mpColor, marginTop:"0.3rem", fontWeight:600 }}>
                        {mpRatioPct < 28 ? "En dessous de la norme" : mpRatioPct <= 35 ? "✓ Dans la norme sectorielle (28–35%)" : mpRatioPct <= 45 ? "⚠ Au-dessus de la norme (28–35%)" : "✗ Trop élevé — à optimiser"}
                      </p>
                    )}
                  </div>

                  <Field label="PERSONNEL (€)" value={calcPerso} onChange={setCalcPerso} />
                  <Field label="DÉPLACEMENT (€)" value={calcDeplac} onChange={setCalcDeplac} />
                  <Field label="AUTRES CHARGES (€)" value={calcAutres} onChange={setCalcAutres} />
                  <Field label="PANIER MOYEN (€)" value={calcPanierMoyen} onChange={setCalcPanierMoyen} placeholder="12" />
                </div>
              </div>

              {/* Résultats */}
              <div style={{ backgroundColor:S.card, padding:"1.5rem" }}>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"1.25rem" }}>RÉSULTATS DÉTAILLÉS</p>

                {/* CA */}
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.55rem 0", borderBottom:`1px solid ${S.border}` }}>
                  <span style={{ fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.12em", color:S.muted }}>CA HT</span>
                  <span style={{ fontFamily:S.sans, fontSize:"0.875rem", fontWeight:600, color:S.brown }}>{fmtCur(caHT)}</span>
                </div>
                {calcTVAMode === "TTC" && (
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.3rem 0 0.55rem", borderBottom:`1px solid ${S.border}` }}>
                    <span style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted }}>TVA collectée ({calcTVA}%)</span>
                    <span style={{ fontFamily:S.sans, fontSize:"0.8rem", color:S.muted }}>−{fmtCur(caTTC - caHT)}</span>
                  </div>
                )}

                {/* Charges organisateur */}
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.terra, marginTop:"0.75rem", marginBottom:"0.2rem" }}>CHARGES ORGANISATEUR</p>
                {[
                  { label: calcTypeOff === "Droit de place" ? "Droit de place" : "Privatisation (sortie)", value: droitN, show: droitN > 0 },
                  { label:`% CA organisateur (${orgPctVal}%)`, value: orgPctCharge, show: calcOrgPctOn && orgPctVal > 0 },
                ].filter(r => r.show).map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.45rem 0 0.45rem 0.75rem", borderBottom:`1px dashed ${S.border}` }}>
                    <span style={{ fontFamily:S.sans, fontSize:"0.63rem", color:S.muted }}>{r.label}</span>
                    <span style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:600, color:S.red }}>−{fmtCur(r.value)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"0.45rem 0", borderBottom:`1px solid ${S.border}` }}>
                  <span style={{ fontFamily:S.sans, fontSize:"0.63rem", letterSpacing:"0.1em", color:S.brown, fontWeight:600 }}>SOUS-TOTAL ORGA</span>
                  <span style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:700, color:S.red }}>−{fmtCur(chargesOrga)}</span>
                </div>

                {/* Charges exploitation */}
                <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.terra, marginTop:"0.75rem", marginBottom:"0.2rem" }}>CHARGES D'EXPLOITATION</p>
                {[
                  { label:`Matières premières (${Math.round(mpRatioPct)}% CA HT)`, value: mp },
                  { label:"Personnel", value: perso },
                  { label:"Déplacement", value: deplac },
                  { label:"Autres charges", value: autres },
                ].filter(r => r.value > 0).map(r => (
                  <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.45rem 0 0.45rem 0.75rem", borderBottom:`1px dashed ${S.border}` }}>
                    <span style={{ fontFamily:S.sans, fontSize:"0.63rem", color:S.muted }}>{r.label}</span>
                    <span style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:600, color:S.red }}>−{fmtCur(r.value)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"0.45rem 0", borderBottom:`1px solid ${S.border}` }}>
                  <span style={{ fontFamily:S.sans, fontSize:"0.63rem", letterSpacing:"0.1em", color:S.brown, fontWeight:600 }}>SOUS-TOTAL EXPLOITATION</span>
                  <span style={{ fontFamily:S.sans, fontSize:"0.82rem", fontWeight:700, color:S.red }}>−{fmtCur(chargesExpl)}</span>
                </div>

                {/* Synthèse */}
                <div style={{ marginTop:"0.75rem" }}>
                  {[
                    { label:"MARGE BRUTE (après MP)", value:`${fmtCur(margeBrute)} (${margeBrutPct}%)`, color:S.brown },
                    { label:"TOTAL CHARGES",           value:fmtCur(totalCharges),                       color:S.red   },
                    { label:"RÉSULTAT NET",             value:`${fmtCur(resultatNet)} (${margeNetPct}%)`, color: resultatNet >= 0 ? S.green : S.red },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.55rem 0", borderBottom:`1px solid ${S.border}` }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.65rem", letterSpacing:"0.12em", color:S.muted }}>{r.label}</span>
                      <span style={{ fontFamily:S.sans, fontSize:"0.875rem", fontWeight:600, color:r.color }}>{r.value}</span>
                    </div>
                  ))}
                </div>

                {/* Seuil de rentabilité */}
                <div style={{ marginTop:"0.75rem", padding:"0.75rem", backgroundColor:"rgba(44,26,16,0.05)", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                  <div>
                    <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.2rem" }}>SEUIL DE RENTABILITÉ</p>
                    <p style={{ fontFamily:S.sans, fontSize:"0.8rem", fontWeight:700, color:S.brown }}>{fmtCur(totalCharges)} CA HT</p>
                  </div>
                  {panierMoyen > 0 && (
                    <div style={{ textAlign:"right" }}>
                      <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.2rem" }}>COUVERTS NÉCESSAIRES</p>
                      <p style={{ fontFamily:S.serif, fontSize:"1.6rem", fontWeight:800, color:S.terra }}>{seuilClients}</p>
                      <p style={{ fontFamily:S.sans, fontSize:"0.62rem", color:S.muted }}>à {fmtCur(panierMoyen)} / couvert</p>
                    </div>
                  )}
                </div>

                {/* Verdict */}
                <div style={{ marginTop:"1rem", display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.875rem", backgroundColor: margeNetPct >= 30 ? "rgba(44,122,75,0.1)" : margeNetPct >= 10 ? "rgba(184,133,10,0.1)" : "rgba(192,57,43,0.1)" }}>
                  {margeNetPct >= 30
                    ? <><CheckCircle size={18} color={S.green} strokeWidth={2} /><span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.green, fontWeight:600 }}>Rentable — Excellente marge (&gt;30%)</span></>
                    : margeNetPct >= 10
                    ? <><AlertTriangle size={18} color={S.amber} strokeWidth={2} /><span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.amber, fontWeight:600 }}>Attention — Marge faible ({margeNetPct}%)</span></>
                    : caHT > 0
                    ? <><XCircle size={18} color={S.red} strokeWidth={2} /><span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.red, fontWeight:600 }}>Non rentable — Revoir les charges</span></>
                    : <span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.muted }}>Renseignez les données pour voir le verdict</span>
                  }
                </div>

                <div style={{ display:"flex", gap:"0.5rem", marginTop:"1rem" }}>
                  <button onClick={saveCalc} disabled={!calcNom && caHT === 0}
                    style={{ flex:1, backgroundColor:caHT > 0 ? S.terra : S.muted, color:"#fff", border:"none", padding:"0.65rem 0.75rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:caHT > 0 ? "pointer" : "not-allowed" }}>
                    SAUVEGARDER
                  </button>
                  <button onClick={() => window.print()}
                    style={{ flex:1, backgroundColor:"transparent", color:S.muted, border:`1px solid ${S.border}`, padding:"0.65rem 0.75rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.15em", cursor:"pointer" }}>
                    EXPORTER PDF
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SECTION 3 — RATIOS
          ══════════════════════════════════════════ */}
          <section style={{ marginBottom:"3rem" }}>
            <SH title="Ratios et performance" />
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:"2rem" }}>
              {/* Ratio candidatures */}
              <div>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"1rem" }}>ENTONNOIR CANDIDATURES</p>
                <HBar label={`Envoyées (${candEnv})`} pct={100} color={S.blue} />
                <HBar label={`Vues par l'organisateur (~${Math.round(candEnv * 0.85)})`} pct={85} color={S.amber} />
                <HBar label={`Retenues (${candAcc})`} pct={tauxAcc} color={S.terra} />
                <HBar label={`Événements réalisés (${evtTotal})`} pct={evtTotal > 0 && candEnv > 0 ? Math.round(evtTotal/candEnv*100) : 0} color={S.green} />

                {/* Conseil automatique */}
                <div style={{ marginTop:"1rem", padding:"0.875rem", backgroundColor: tauxAcc >= 60 ? "rgba(44,122,75,0.08)" : "rgba(184,133,10,0.08)", borderLeft:`3px solid ${tauxAcc >= 60 ? S.green : S.amber}` }}>
                  <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.brown, lineHeight:1.6 }}>
                    {tauxAcc >= 60
                      ? "🏆 Excellent taux d'acceptation ! Vous êtes dans le top des foodtruckers Spotruck."
                      : "💡 Votre profil manque peut-être de photos ou de description. Complétez votre profil pour améliorer vos chances."}
                  </p>
                </div>
              </div>

              {/* Répartition types + droit vs priv */}
              <div>
                <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"1rem" }}>RÉPARTITION PAR TYPE D'ÉVÉNEMENT</p>
                <Donut slices={[
                  { label:"Festival",         value:32, color:S.terra },
                  { label:"Fête de quartier", value:24, color:S.amber },
                  { label:"Salon / Expo",     value:18, color:S.blue  },
                  { label:"Marché",           value:16, color:S.green },
                  { label:"Autre",            value:10, color:S.muted },
                ]} />

                <div style={{ marginTop:"1.5rem" }}>
                  <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>DROIT DE PLACE vs PRIVATISATION</p>
                  {[
                    { label:`Droit de place (${droitPlaceTotal} events)`, ca:480, events:droitPlaceTotal },
                    { label:`Privatisation (${privatTotal} events)`,       ca:920, events:privatTotal },
                  ].map(r => (
                    <div key={r.label} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", padding:"0.6rem 0.875rem", backgroundColor:S.card, marginBottom:"2px" }}>
                      <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.brown }}>{r.label}</span>
                      <span style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:600, color:S.terra }}>~{fmtCur(r.ca)} moy.</span>
                    </div>
                  ))}
                  <p style={{ fontFamily:S.sans, fontSize:"0.7rem", fontWeight:300, color:S.muted, marginTop:"0.6rem" }}>
                    💡 Les privatisations vous rapportent en moyenne <strong style={{ color:S.brown }}>440 € de plus</strong> par événement.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════
              SECTION 4 — PREMIUM
          ══════════════════════════════════════════ */}
          <section style={{ marginBottom:"3rem" }}>
            <SH title="Analyses avancées" sub={isPremium ? undefined : "Réservé au plan Premium"} />

            {!isPremium ? (
              <LockBanner onUpgrade={() => router.push("/dashboard/foodtrucker/parametres")} />
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:"2.5rem" }}>

                {/* Comparaison mensuelle */}
                <div>
                  <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>CA MENSUEL — 8 DERNIERS MOIS</p>
                  <div style={{ backgroundColor:S.card, padding:"1.5rem" }}>
                    <BarChartV data={barData} />
                  </div>
                  <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.6rem" }}>
                    🏆 Votre meilleur mois : <strong style={{ color:S.brown }}>{bestMois.label} ({fmtCur(bestMois.ca)})</strong> — Ligne pointillée = moyenne mensuelle
                  </p>
                </div>

                {/* Projection */}
                <div>
                  <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.5rem" }}>PROJECTION CA ANNUEL</p>
                  <p style={{ fontFamily:S.sans, fontSize:"0.78rem", fontWeight:300, color:S.muted, marginBottom:"0.75rem" }}>
                    Basé sur votre activité des 6 derniers mois, votre CA annuel estimé est de{" "}
                    <strong style={{ color:S.brown }}>{fmtCur(caAnnuelProj)}</strong>
                  </p>
                  <div style={{ display:"flex", gap:"1rem", marginBottom:"0.75rem", flexWrap:"wrap" }}>
                    {[
                      { label:"Scénario base",        val:caAnnuelProj, color:S.terra },
                      { label:"Optimiste (+20%)",      val:caAnnuelOpt,  color:S.green },
                      { label:"Pessimiste (-20%)",     val:caAnnuelPes,  color:S.red   },
                    ].map(sc => (
                      <div key={sc.label} style={{ backgroundColor:S.card, padding:"0.75rem 1.25rem" }}>
                        <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.15em", color:S.muted, marginBottom:"0.25rem" }}>{sc.label.toUpperCase()}</p>
                        <p style={{ fontFamily:S.serif, fontSize:"1.4rem", fontWeight:800, color:sc.color }}>{fmtCur(sc.val)}</p>
                      </div>
                    ))}
                  </div>
                  <div style={{ backgroundColor:S.card, padding:"1.25rem" }}>
                    <LineChartProj hist={barData} proj={projData} />
                  </div>
                </div>

                {/* Meilleure période */}
                <div>
                  <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>MEILLEURES PÉRIODES</p>
                  <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"2px" }}>
                    {[
                      { label:"MOIS LES + RENTABLES",  val:"Mai, Juin, Avr.",       icon:"🗓️" },
                      { label:"JOUR LE + ACTIF",        val:"Samedi",               icon:"📅" },
                      { label:"TYPE LE + RENTABLE",     val:"Festival (850 € moy.)", icon:"🏆" },
                    ].map(i => (
                      <div key={i.label} style={{ backgroundColor:S.card, padding:"1.25rem" }}>
                        <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.18em", color:S.muted, marginBottom:"0.5rem" }}>{i.label}</p>
                        <p style={{ fontFamily:S.sans, fontSize:"1rem", fontWeight:600, color:S.brown }}>{i.icon} {i.val}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Analyse géographique */}
                <div>
                  <p style={{ fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.2em", color:S.terra, fontWeight:700, marginBottom:"0.75rem" }}>RÉPARTITION GÉOGRAPHIQUE</p>
                  <div style={{ backgroundColor:S.card, padding:"1.5rem" }}>
                    {[
                      { region:"Nouvelle-Aquitaine", pct:70, ca:9800  },
                      { region:"Pays de la Loire",   pct:15, ca:2100  },
                      { region:"Bretagne",            pct:10, ca:1400  },
                      { region:"Île-de-France",       pct:5,  ca:700   },
                    ].map(r => (
                      <div key={r.region} style={{ marginBottom:"0.75rem" }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:"0.3rem" }}>
                          <span style={{ fontFamily:S.sans, fontSize:"0.75rem", color:S.brown }}>{r.region}</span>
                          <span style={{ fontFamily:S.sans, fontSize:"0.72rem", color:S.muted }}>{fmtCur(r.ca)} · {r.pct}%</span>
                        </div>
                        <div style={{ height:8, backgroundColor:S.border }}>
                          <div style={{ height:"100%", width:`${r.pct}%`, backgroundColor:S.terra }} />
                        </div>
                      </div>
                    ))}
                    <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.75rem" }}>
                      📍 Vous travaillez principalement en <strong style={{ color:S.brown }}>Nouvelle-Aquitaine</strong> (70% de vos événements)
                    </p>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* ══════════════════════════════════════════
              SECTION 5 — OBJECTIFS
          ══════════════════════════════════════════ */}
          <section style={{ marginBottom:"2rem" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem", paddingBottom:"0.75rem", borderBottom:`1px solid ${S.border}` }}>
              <div>
                <h2 style={{ fontFamily:S.serif, fontSize:"1.3rem", fontWeight:700, color:S.brown }}>Mes objectifs</h2>
                <p style={{ fontFamily:S.sans, fontSize:"0.72rem", fontWeight:300, color:S.muted, marginTop:"0.2rem" }}>Suivi mensuel — Juin 2026</p>
              </div>
              <button onClick={() => setEditObj(v => !v)} style={{ backgroundColor:"transparent", color:S.terra, border:`1px solid ${S.terra}`, padding:"0.5rem 1rem", fontFamily:S.sans, fontSize:"0.6rem", letterSpacing:"0.18em", cursor:"pointer" }}>
                {editObj ? "ANNULER" : "MODIFIER"}
              </button>
            </div>

            {editObj ? (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1rem", marginBottom:"1rem" }}>
                <Field label="OBJECTIF CA MENSUEL (€)" value={draftCA}   onChange={setDraftCA}   />
                <Field label="OBJECTIF ÉVÉNEMENTS"     value={draftEvts} onChange={setDraftEvts} />
                <Field label="OBJECTIF TAUX ACC. (%)"  value={draftTaux} onChange={setDraftTaux} />
                <div style={{ gridColumn:"1/-1", display:"flex", justifyContent:"flex-end" }}>
                  <button onClick={saveObj} style={{ backgroundColor:S.terra, color:"#fff", border:"none", padding:"0.65rem 1.5rem", fontFamily:S.sans, fontSize:"0.62rem", letterSpacing:"0.2em", cursor:"pointer" }}>
                    SAUVEGARDER LES OBJECTIFS
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:"1.5rem" }}>
                {[
                  { label:"CA CE MOIS", cur:caMonth, target:objCA, unit:"€" },
                  { label:"ÉVÉNEMENTS CE MOIS", cur:evtsMonth, target:objEvts, unit:"" },
                  { label:"TAUX D'ACCEPTATION", cur:tauxMonth, target:objTaux, unit:"%" },
                ].map(o => (
                  <div key={o.label} style={{ backgroundColor:S.card, padding:"1.25rem" }}>
                    <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", marginBottom:"0.75rem" }}>
                      <Target size={14} strokeWidth={1.5} color={S.terra} />
                      <p style={{ fontFamily:S.sans, fontSize:"0.58rem", letterSpacing:"0.2em", color:S.muted }}>{o.label}</p>
                    </div>
                    <ProgressBar cur={o.cur} target={o.target} unit={o.unit} />
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>
      </main>

      {toast && <Toast msg={toast.msg} color={toast.color} onDone={() => setToast(null)} />}
    </>
  );
}
