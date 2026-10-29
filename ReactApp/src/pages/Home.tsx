// Path: src/pages/Home.tsx
import { useEffect, useState } from "react";
import { getDashboardStats, getDashboardScopeItems, getMonthlyActivity } from "../services/dashboardService";
import type { DashboardStatsDto, ScopeSummaryItemDto, MonthlyActivityDto } from "../services/dashboardService";
import { useSite } from "../context/Sitecontext";
import { updateScopeStatus } from "../services/siteService";

// ── Constants & helpers ─────────────────────────────────────
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const SCOPE_STATUS: Record<number, string> = { 1: "Pending", 2: "In Progress", 3: "Completed", 4: "On Hold", 5: "Not Started" };
const SCOPE_STYLE: Record<number, { bg: string; color: string }> = {
  3: { bg: "#dcfce7", color: "#16A34A" },
  2: { bg: "#FEF3C7", color: "#92400E" },
  4: { bg: "#fef2f2", color: "#DC2626" },
  5: { bg: "#f8fafc", color: "#94A3B8" },
};
const fmt = (n: number) => "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 0 });
const siteStatusColor = (s?: string) =>
  s === "Completed" ? "#16A34A" : s === "Partially Completed" ? "#3B82F6" : s === "On Hold" ? "#DC2626" : "#F59E0B";

// text style helper: size, color, extra
const t = (fontSize: string, color = "#fff", extra: React.CSSProperties = {}): React.CSSProperties => ({ fontSize, color, margin: 0, ...extra });

// ── Shared styles ───────────────────────────────────────────
const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)", border: "0.5px solid rgba(255,255,255,0.12)",
  borderRadius: "10px", padding: "12px 14px", boxSizing: "border-box",
};
const inlineCard: React.CSSProperties = { ...card, flex: 1 };
const colCard: React.CSSProperties = { ...inlineCard, display: "flex", flexDirection: "column", justifyContent: "flex-start" };
const label: React.CSSProperties = { ...t("9px", "#94A3B8"), textTransform: "uppercase", letterSpacing: "0.7px", marginBottom: "4px" };
const bar = (pct: number, color: string, h = "5px") => (
  <div style={{ background: "rgba(255,255,255,0.1)", height: h, borderRadius: "3px", overflow: "hidden", marginBottom: "4px" }}>
    <div style={{ height: "100%", borderRadius: "3px", background: color, width: `${Math.min(100, pct)}%`, transition: "width 0.6s ease" }} />
  </div>
);
const stepBtn = (disabled = false): React.CSSProperties => ({
  background: "none", border: "none", fontSize: "14px", fontWeight: 700, padding: "0 4px",
  color: disabled ? "#4B5563" : "#F59E0B", cursor: disabled ? "not-allowed" : "pointer",
});

function Stepper({ text, onPrev, onNext, nextDisabled, mb }: { text: string | number; onPrev: () => void; onNext: () => void; nextDisabled: boolean; mb: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: mb }}>
      <button onClick={onPrev} style={stepBtn()}>‹</button>
      <span style={t("11px", "#fff", { fontWeight: 600 })}>{text}</span>
      <button onClick={onNext} disabled={nextDisabled} style={stepBtn(nextDisabled)}>›</button>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
function Home() {
  const { selectedSite } = useSite();
  const siteId = selectedSite?.id ?? 0;
  const now = new Date();

  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [scopeItems, setScopeItems] = useState<ScopeSummaryItemDto[]>([]);
  const [showScopeTable, setShowScopeTable] = useState(false);
  const [statsLoading, setStatsLoading] = useState(true);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [monthly, setMonthly] = useState<MonthlyActivityDto | null>(null);
  const [monthlyLoading, setMonthlyLoading] = useState(false);

  // Load stats + scopes when site changes
  useEffect(() => {
    setStatsLoading(true);
    setShowScopeTable(false);
    const calls: Promise<any>[] = [getDashboardStats(siteId)];
    if (siteId > 0) calls.push(getDashboardScopeItems(siteId));
    Promise.all(calls)
      .then(([s, sc]) => { setStats(s); setScopeItems(sc ?? []); })
      .catch(() => { setStats(null); setScopeItems([]); })
      .finally(() => setStatsLoading(false));
  }, [siteId]);

  // Reset month/year when site changes
  useEffect(() => {
    setMonth(new Date().getMonth() + 1);
    setYear(new Date().getFullYear());
    setMonthly(null);
  }, [siteId]);

  // Load selected month's activity
  useEffect(() => {
    if (!stats?.hasSiteInfo || !siteId) return;
    setMonthlyLoading(true);
    getMonthlyActivity(siteId, month, year)
      .then(setMonthly)
      .catch(() => setMonthly(null))
      .finally(() => setMonthlyLoading(false));
  }, [month, year, siteId, stats?.hasSiteInfo]);

  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();
  const isCurrentMonth = month === curMonth && year === curYear;

  const prevMonth = () => (month === 1 ? (setMonth(12), setYear((y) => y - 1)) : setMonth((m) => m - 1));
  const nextMonth = () => {
    if (isCurrentMonth) return;
    month === 12 ? (setMonth(1), setYear((y) => y + 1)) : setMonth((m) => m + 1);
  };
  const nextYear = () => year < curYear && setYear((y) => y + 1);

  const displaySpend = monthly?.monthlySpend ?? stats?.thisMonthSpend ?? 0;
  const displayPurchases = monthly?.monthlyPurchases ?? stats?.thisMonthPurchases ?? 0;
  const displayAttendance = monthly?.monthlyAttendance ?? stats?.thisMonthAttendance ?? 0;

  const handleScopeStatusChange = async (id: number, statusId: number) => {
    try {
      await updateScopeStatus(id, statusId);
      setScopeItems((prev) => prev.map((s) => (s.id === id ? { ...s, scopeStatusId: statusId, statusName: SCOPE_STATUS[statusId] } : s)));
    } catch {
      alert("Failed to update scope status");
    }
  };

  // Right-hand stat cards
  const sideCards = [
    { title: siteId > 0 ? "Total Spend — This Site" : "Total Material Spend", value: stats ? fmt(stats.totalMaterialSpend) : "—", sub: "all-time material cost", subColor: "#F59E0B" },
    { title: "Total Purchases", value: stats?.totalPurchases ?? "—", sub: "all-time material entries", subColor: "#F59E0B" },
    { title: "Total Attendance", value: stats?.totalAttendanceWorkers ?? "—", sub: "all-time workers", subColor: "#4ADE80" },
  ];

  // ════════════════════════════════════════════════════════════
  return (
    <div>
      {/* ═══ HERO + DASHBOARD ═══ */}
      <section style={{ background: "linear-gradient(135deg, #1c2e46 0%, #0F172A 100%)", padding: "32px 24px 28px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div className="hero-row" style={{ display: "flex", alignItems: "flex-start", gap: "28px" }}>

            {/* LEFT */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: "7px", background: "rgba(245,158,11,0.15)",
                border: "0.5px solid rgba(245,158,11,0.35)", color: "#FCD34D", fontSize: "12px",
                padding: "4px 12px", borderRadius: "20px", marginBottom: "16px",
              }}>
                <span style={{ width: "7px", height: "7px", background: "#F59E0B", borderRadius: "50%", display: "inline-block" }} />
                Construction Management Platform
              </div>

              <h1 style={{ fontSize: "clamp(22px, 5vw, 32px)", fontWeight: 700, color: "#fff", lineHeight: 1.2, margin: "0 0 24px" }}>
                Control Every Rupee, <span style={{ color: "#F59E0B" }}>Every Site, Every Day.</span>
              </h1>

              {siteId === 0 && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: "15px", maxWidth: "630px", }}>
                {[
                  { title: "Total Sites", value: stats?.totalSites, color: "#FFFFFF" },
                  { title: "Active Sites", value: stats?.activeSites, color: "#4ADE80" },
                  { title: "Hold Sites", value: stats?.holdSites, color: "#FBBF24" },
                ].map((item) => (
                  <div key={item.title} style={{ ...card, aspectRatio: "1 / 0.85", display: "flex", flexDirection: "column",
                        justifyContent: "center", alignItems: "center", padding: "20px", minWidth: 0,
                  }}>
                  <p style={label}>{item.title}</p>
                  <p style={t("32px", item.color, { fontWeight: 600 })}>
                  {statsLoading ? "..." : item.value ?? 0}</p>
                </div>
              ))}
            </div>

              <p style={{ color: "#FFFFFF", fontSize: "17px", fontWeight: 800, margin: "20px 0 24px", lineHeight: 1.6,}}>
                  Select Any Site To Explore My{" "}
                <span style={{ color: "#F59E0B" }}> Builder Ladger Dashbord </span>
              </p>
            </>
            )}

              {stats?.hasSiteInfo && !statsLoading && (
                <div>
                  {/* Site name + status */}
                  <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                    <h3 style={t("17px", "#fff", { fontWeight: 700 })}>{stats.siteName}</h3>
                    <span style={{ background: siteStatusColor(stats.siteStatus), color: "#fff", fontSize: "11px", fontWeight: 600, padding: "2px 10px", borderRadius: "20px" }}>
                      {stats.siteStatus ?? "—"}
                    </span>
                  </div>

                  {/* Row 1 — Timeline chips */}
                  <div className="chip-row" style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                    <div style={inlineCard}>
                      <p style={label}>Started</p>
                      <p style={t("13px", "#fff", { fontWeight: 700 })}>{stats.siteStartedDate ?? "—"}</p>
                    </div>
                    <div style={inlineCard}>
                      <p style={label}>Due</p>
                      <p style={t("13px", stats.siteExpectedCompletion ? (stats.isOverdue ? "#F87171" : "#fff") : "#64748B", { fontWeight: 700 })}>
                        {stats.siteExpectedCompletion ?? "Not Set"}
                      </p>
                    </div>
                    <div style={inlineCard}>
                      <p style={label}>Days Active</p>
                      <p style={t("20px", "#fff", { fontWeight: 700 })}>{stats.daysElapsed ?? "—"}</p>
                    </div>
                    <div style={inlineCard}>
                      <p style={label}>{stats.isOverdue ? "Overdue By" : "Days Left"}</p>
                      <p style={t("20px", stats.daysRemaining == null ? "#94A3B8" : stats.isOverdue ? "#F87171" : "#4ADE80", { fontWeight: 700 })}>
                        {stats.daysRemaining == null ? "—" : Math.abs(stats.daysRemaining)}
                      </p>
                      {stats.timelineProgressPercent != null && (
                        <div style={{ marginTop: "6px" }}>{bar(stats.timelineProgressPercent, stats.isOverdue ? "#F87171" : "#F59E0B", "3px")}</div>
                      )}
                    </div>
                  </div>

                  {/* Row 2 — Budget + Scope + This Month */}
                  <div className="chip-row" style={{ display: "flex", gap: "10px", marginBottom: "12px", alignItems: "stretch" }}>

                    {/* BUDGET */}
                    <div style={{ ...colCard, flex: 1.2 }}>
                      <p style={label}>Budget</p>
                      {stats.expectedBudget ? (
                        <>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginBottom: "8px", alignItems: "flex-start" }}>
                            {[
                              { l: "Expected", v: fmt(stats.expectedBudget), c: "#fff" },
                              { l: "Spent", v: fmt(stats.totalMaterialSpend), c: "#fff" },
                              {
                                l: (stats.budgetRemaining ?? 0) < 0 ? "Over" : "Left",
                                v: stats.budgetRemaining != null ? fmt(Math.abs(stats.budgetRemaining)) : "—",
                                c: (stats.budgetRemaining ?? 0) < 0 ? "#F87171" : "#4ADE80",
                              },
                            ].map((i) => (
                              <div key={i.l}>
                                <p style={{ ...label, marginBottom: "2px" }}>{i.l}</p>
                                <p style={t("13px", i.c, { fontWeight: 700 })}>{i.v}</p>
                              </div>
                            ))}
                          </div>
                          {bar(
                            stats.budgetUtilizationPercent ?? 0,
                            (stats.budgetUtilizationPercent ?? 0) >= 90 ? "#F87171" : (stats.budgetUtilizationPercent ?? 0) >= 70 ? "#F59E0B" : "#4ADE80"
                          )}
                          <p style={t("10px", "#94A3B8")}>{(stats.budgetUtilizationPercent ?? 0).toFixed(1)}% utilized</p>
                        </>
                      ) : (
                        <>
                          <p style={t("20px", "#fff", { fontWeight: 700, marginBottom: "3px" })}>{fmt(stats.totalMaterialSpend)}</p>
                          <p style={t("11px", "#F59E0B")}>Total spend · Budget not set</p>
                        </>
                      )}
                    </div>

                    {/* SCOPE */}
                    <div style={colCard}>
                      <p style={label}>Work Scope</p>
                      {stats.totalScopes > 0 ? (
                        <>
                          <div style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
                            {[
                              { l: "Done", n: stats.completedScopes, c: "#4ADE80" },
                              { l: "Active", n: stats.inProgressScopes, c: "#F59E0B" },
                              { l: "Pending", n: stats.pendingScopes, c: "#94A3B8" },
                              { l: "Hold", n: stats.onHoldScopes, c: "#F87171" },
                            ].map((i) => (
                              <div key={i.l} style={{ textAlign: "center", flex: 1 }}>
                                <p style={t("18px", i.c, { fontWeight: 700 })}>{i.n}</p>
                                <p style={t("9px", "#94A3B8", { marginTop: "1px" })}>{i.l}</p>
                              </div>
                            ))}
                          </div>
                          {bar(stats.scopeCompletionPercent, "#4ADE80")}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <p style={t("10px", "#94A3B8")}>{stats.completedScopes}/{stats.totalScopes} complete</p>
                            <button
                              onClick={() => setShowScopeTable(!showScopeTable)}
                              style={{ background: "none", border: "none", color: "#F59E0B", fontSize: "11px", cursor: "pointer", padding: 0, fontWeight: 600 }}
                            >
                              {showScopeTable ? "▲ Hide" : "▼ Details"}
                            </button>
                          </div>
                        </>
                      ) : (
                        <p style={t("12px", "#64748B", { marginTop: "8px" })}>No scopes defined</p>
                      )}
                    </div>

                    {/* THIS MONTH */}
                    <div style={colCard}>
                      <p style={label}>{isCurrentMonth ? "This Month" : "Selected Month"}</p>
                      <Stepper text={MONTHS[month - 1]} onPrev={prevMonth} onNext={nextMonth} nextDisabled={isCurrentMonth} mb="2px" />
                      <Stepper text={year} onPrev={() => setYear((y) => y - 1)} onNext={nextYear} nextDisabled={year >= curYear} mb="7px" />
                      <div style={{ borderTop: "0.5px solid rgba(255,255,255,0.1)", marginBottom: "8px" }} />

                      {monthlyLoading ? (
                        <p style={t("12px", "#94A3B8")}>Loading...</p>
                      ) : (
                        <div style={{ display: "flex", width: "100%", minHeight: "58px" }}>
                          <div style={{ flex: 1, minWidth: 0, paddingRight: "12px" }}>
                            <p style={{ ...label, marginBottom: "2px" }}>MATERIAL</p>
                            <p style={t("14px", "#fff", { fontWeight: 700, whiteSpace: "nowrap" })}>{fmt(displaySpend)}</p>
                            <p style={t("10px", "#94A3B8", { marginTop: "1px" })}>
                              {displayPurchases} purchase{displayPurchases !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div style={{ width: "1px", background: "rgba(255,255,255,0.12)", alignSelf: "stretch", flexShrink: 0 }} />
                          <div style={{ flex: 1, minWidth: 0, paddingLeft: "12px" }}>
                            <p style={{ ...label, marginBottom: "2px" }}>LABOUR</p>
                            <p style={t("14px", "#fff", { fontWeight: 700 })}>{displayAttendance}</p>
                            <p style={t("10px", "#94A3B8", { marginTop: "1px" })}>workers this month</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Scope detail table — scrolls inside its card on small screens */}
                  {showScopeTable && scopeItems.length > 0 && (
                    <div style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: "10px", overflowX: "auto" }}>
                      <table style={{ width: "100%", minWidth: "480px", borderCollapse: "collapse" }}>
                        <thead>
                          <tr style={{ background: "rgba(255,255,255,0.08)" }}>
                            {["Work", "Status", "Remarks", "Update"].map((h) => (
                              <th key={h} style={{ ...t("11px", "#94A3B8", { fontWeight: 600 }), padding: "10px 14px", textAlign: "left", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {scopeItems.map((s, i) => {
                            const { bg, color } = SCOPE_STYLE[s.scopeStatusId] ?? { bg: "#f1f5f9", color: "#64748B" };
                            return (
                              <tr key={s.id} style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)", background: i % 2 ? "rgba(255,255,255,0.02)" : "transparent" }}>
                                <td style={{ padding: "9px 14px", fontSize: "13px", color: "#fff" }}>{s.scopeName}</td>
                                <td style={{ padding: "9px 14px" }}>
                                  <span style={{ background: bg, color, fontWeight: 600, padding: "2px 8px", borderRadius: "20px", fontSize: "11px", whiteSpace: "nowrap" }}>
                                    {s.statusName}
                                  </span>
                                </td>
                                <td style={{ padding: "9px 14px", fontSize: "12px", color: "#64748B" }}>{s.remarks || "—"}</td>
                                <td style={{ padding: "9px 14px" }}>
                                  <select
                                    value={s.scopeStatusId}
                                    onChange={(e) => handleScopeStatusChange(s.id, Number(e.target.value))}
                                    style={{ borderRadius: "6px", padding: "3px 7px", fontSize: "11px", border: "1px solid rgba(255,255,255,0.15)", background: "#1c2e46", color: "#fff", cursor: "pointer" }}
                                  >
                                    {Object.entries(SCOPE_STATUS).map(([id, name]) => (
                                      <option key={id} value={id}>{name}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* RIGHT — 3 compact stat cards */}
            <div className="hero-side" style={{ flexShrink: 0, width: "180px", display: "flex", flexDirection: "column", gap: "10px", alignSelf: "flex-start", marginTop: "68px" }}>
              {sideCards.map((c) => (
                <div key={c.title} style={{ ...card, minHeight: "92px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <p style={{ ...label, fontSize: "10px" }}>{c.title}</p>
                    <p style={t(statsLoading ? "13px" : "22px", statsLoading ? "#94A3B8" : "#fff", { fontWeight: statsLoading ? 400 : 700 })}>
                      {statsLoading ? "Loading..." : c.value}
                    </p>
                  </div>
                  {!statsLoading && <p style={t("11px", c.subColor, { marginTop: "8px" })}>{c.sub}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section style={{
        position: "relative", overflow: "hidden", padding: "64px 24px 78px",
        background: 
        "radial-gradient(circle at 12% 5%, rgba(30,136,229,0.10), transparent 28%), radial-gradient(circle at 88% 15%, rgba(30,136,229,0.08), transparent 28%), linear-gradient(180deg, #ffffff 0%, #f5f9fd 100%)",
      }}>
        <div style={{ 
          position: "absolute", width: "220px", height: "220px", borderRadius: "50%", 
          background: "rgba(30,136,229,0.07)", top: "-100px", left: "-100px" }} />
        <div style={{ 
          position: "absolute", width: "280px", height: "280px", borderRadius: "50%", 
          background: "rgba(30,136,229,0.045)", bottom: "-160px", right: "-100px" }} />

        <div style={{ position: "relative", maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ marginBottom: "34px" }}>
            <p style={t("12px", "#3678B7", { 
              fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.8px", marginBottom: "10px" })}>
              WHAT BUILDERLEDGER DOES
            </p>
            <div style={{ 
              width: "48px", height: "4px", borderRadius: "4px", background: "#F59E0B", marginBottom: "14px" }} />
            <h2 style={{ 
              fontSize: "clamp(24px, 5vw, 32px)", fontWeight: 700, color: "#102E52", margin: "0 0 10px", lineHeight: 1.2 }}>
              Everything your site needs, in one system
            </h2>
            <p style={{ fontSize: "15px", color: "#47627F", maxWidth: "650px", lineHeight: 1.65, margin: 0 }}>
              Designed for construction teams managing multiple sites, vendors, and budgets simultaneously.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "22px" }}>
            {FEATURES.map((f) => <FeatureCard key={f.type} {...f} />)}
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer style={{ 
        position: "relative", background: "linear-gradient(135deg, #1c3554 0%, #10233D 100%)", 
        padding: "34px 24px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ 
          position: "relative", display: "flex", justifyContent: "center", 
          alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          <span style={{
            width: "22px", height: "22px", borderRadius: "50%", border: "2px solid #F59E0B", display: "inline-flex",
            alignItems: "center", justifyContent: "center", color: "#F59E0B", fontSize: "11px", fontWeight: 700,
          }}>✓</span>
          <p style={t("13px", "#AFC0D3")}>BuilderLedger © 2026. Construction management made simple.</p>
        </div>
      </footer>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// FEATURE CARDS
// ════════════════════════════════════════════════════════════
type FeatureType = "cost" | "attendance" | "material" | "service" | "reports" | "expense";

const FEATURES: { type: FeatureType; title: string; description: string }[] = [
  { type: "cost", title: "Cost master", description: "Define standard rates for materials, labour, and equipment. All transactions reference these rates automatically." },
  { type: "attendance", title: "Attendance tracking", description: "Record daily worker attendance per site. Calculate wages, overtime, and absenteeism across your workforce." },
  { type: "material", title: "Material reports", description: "Track every purchase, quantity, brand, supplier, and cost. Identify overspend and compare against budget." },
  { type: "service", title: "Workforce", description: "Manage your contractors, workers, and workforce members in one centralized system."},
  { type: "reports", title: "Site-wise reports", description: "View construction activity and financial information site by site." },
  { type: "expense", title: "Expense control", description: "Track expenses and maintain better control over your construction budget." },
];

const FEATURE_COLORS: Record<FeatureType, { accent: string; soft: string }> = {
  cost: { accent: "#1687E8", soft: "rgba(22,135,232,0.10)" },
  attendance: { accent: "#2FB985", soft: "rgba(47,185,133,0.11)" },
  material: { accent: "#F2A900", soft: "rgba(242,169,0,0.12)" },
  service: { accent: "#4C35D8", soft: "rgba(76,53,216,0.10)" },
  reports: { accent: "#0C9CB0", soft: "rgba(12,156,176,0.10)" },
  expense: { accent: "#E23B43", soft: "rgba(226,59,67,0.10)" },
};

function FeatureCard({ type, title, description }: { type: FeatureType; title: string; description: string }) {
  const { accent, soft } = FEATURE_COLORS[type];
  const hover = (e: React.MouseEvent<HTMLDivElement>, up: boolean) => {
    e.currentTarget.style.transform = up ? "translateY(-4px)" : "translateY(0)";
    e.currentTarget.style.boxShadow = up ? "0 14px 32px rgba(25,55,90,0.12)" : "0 8px 24px rgba(25,55,90,0.07)";
  };
  return (
    <div
      onMouseEnter={(e) => hover(e, true)}
      onMouseLeave={(e) => hover(e, false)}
      style={{
        position: "relative", display: "flex", alignItems: "flex-start", gap: "18px", minHeight: "178px",
        padding: "27px 22px 24px 28px", borderRadius: "14px", border: `1px solid ${accent}25`, borderLeft: `5px solid ${accent}`,
        background: "linear-gradient(135deg, rgba(255,255,255,0.98), rgba(248,251,255,0.94))",
        boxShadow: "0 8px 24px rgba(25,55,90,0.07)", transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
    >
      <div style={{ flexShrink: 0, width: "62px", height: "62px", borderRadius: "50%", background: soft, display: "flex", alignItems: "center", justifyContent: "center", color: accent }}>
        <FeatureIcon type={type} color={accent} />
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingRight: "28px" }}>
        <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#12345A", margin: "3px 0 10px", lineHeight: 1.25 }}>{title}</h3>
        <p style={{ fontSize: "13.5px", color: "#466482", lineHeight: 1.65, margin: 0 }}>{description}</p>
      </div>
    </div>
  );
}

function FeatureIcon({ type, color }: { type: FeatureType; color: string }) {
  if (type === "cost") return <span style={{ fontSize: "30px", fontWeight: 700, lineHeight: 1 }}>₹</span>;

  const svg = (children: React.ReactNode) => (
    <svg width="34" height="34" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">{children}</svg>
  );

  switch (type) {
    case "attendance":
      return svg(<>
        <circle cx="20" cy="11" r="6" fill={color} />
        <path d="M8 31C8 24.9249 13.3726 20 20 20C26.6274 20 32 24.9249 32 31" fill={color} />
        <circle cx="7" cy="17" r="4" fill={color} opacity="0.65" />
        <circle cx="33" cy="17" r="4" fill={color} opacity="0.65" />
      </>);
    case "material":
      return svg(<>
        <path d="M20 5L33 12L20 19L7 12L20 5Z" fill={color} />
        <path d="M7 12V27L20 34V19L7 12Z" fill={color} opacity="0.72" />
        <path d="M33 12V27L20 34V19L33 12Z" fill={color} opacity="0.9" />
        <path d="M20 19V34" stroke="#fff" strokeWidth="1.5" opacity="0.5" />
      </>);
    case "service":
      return svg(<>
        <circle cx="20" cy="10" r="6" fill={color} />
        <path d="M9 34C9 26.8203 13.9249 21 20 21C26.0751 21 31 26.8203 31 34" fill={color} />
        <path d="M14 20L20 25L26 20" stroke="#fff" strokeWidth="2" opacity="0.55" />
      </>);
    case "reports":
      return svg(<>
        <rect x="6" y="20" width="6" height="13" rx="1" fill={color} opacity="0.65" />
        <rect x="17" y="13" width="6" height="20" rx="1" fill={color} opacity="0.85" />
        <rect x="28" y="6" width="6" height="27" rx="1" fill={color} />
      </>);
    default:
      return svg(<>
        <path d="M20 4L33 9V18C33 26 27.5 32.5 20 36C12.5 32.5 7 26 7 18V9L20 4Z" stroke={color} strokeWidth="3" strokeLinejoin="round" />
        <path d="M14 20L18 24L26 15" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>);
  }
}

export default Home;