// Path: src/components/SiteList.tsx
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAllSites, filterSites, getMasterData, deleteSite } from "../services/siteService";
import type { SiteListDto, DropdownItem } from "../services/siteService";
import PageHeader from "./PageHeader";

type Filter = "status" | "date" | "budget";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const addressText = (s: SiteListDto) => [s.addressTypes, s.addressLine1, s.countryName, s.pinCode].filter(Boolean).join(" - ") || "—";

const filterBtn = (active: boolean, minWidth: string): React.CSSProperties => ({
  minWidth, padding: "10px 14px", borderRadius: "9px", border: "1px solid #CBD5E1",
  background: active ? "#FFF7E6" : "#fff", color: "#334155", cursor: "pointer", fontSize: "14px", textAlign: "left",
});
const popStyle = (width: string, padding: string): React.CSSProperties => ({
  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20, width, background: "#fff",
  border: "1px solid #E2E8F0", borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", padding,
});
const popInput: React.CSSProperties = { width: "100%", padding: "9px 10px", border: "1px solid #CBD5E1", borderRadius: "7px", outline: "none", marginBottom: "12px" };
const popLabel: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 500, color: "#475569", marginBottom: "5px" };
const th: React.CSSProperties = { padding: "10px 12px", textAlign: "left", fontSize: "14px", fontWeight: 600, whiteSpace: "nowrap", borderRight: "3px solid rgba(255,255,255,0.95)" };
const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({ padding: "8px 12px", textAlign: "left", verticalAlign: "middle", borderRight: "1px solid #E5E7EB", ...extra });

function SiteList() {
  const location = useLocation();
  const [sites, setSites] = useState<SiteListDto[]>([]);
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");
  const [openFilter, setOpenFilter] = useState<Filter | null>(null);
  const [expandAddress, setExpandAddress] = useState(false);

  const successMessage = (location.state as { success?: string })?.success ?? "";

  // Shared loader: runs a fetch, updates the list, closes any open popup
  const run = async (fn: () => Promise<SiteListDto[]>) => {
    try {
      setLoading(true);
      setError("");
      setSites(await fn());
      setOpenFilter(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { run(getAllSites);
    getMasterData({siteStatusData: true })
    .then((data) => {setStatuses(data.statuses ?? []); })
    .catch((err: Error) => {
      setError(err.message); });
  }, []);

  const toNum = (v: string) => (v.trim() !== "" ? Number(v) : undefined);
  const params = (status = statusId) => ({
    search: search.trim() || undefined, statusId: status,
    fromDate: fromDate || undefined, toDate: toDate || undefined,
    budgetFrom: toNum(budgetFrom), budgetTo: toNum(budgetTo),
  });

  const handleApply = () => {
    const p = params();
    const bad = (n?: number) => n !== undefined && (Number.isNaN(n) || n < 0);
    if (fromDate && toDate && fromDate > toDate) return setError("From Date cannot be greater than To Date.");
    if (bad(p.budgetFrom)) return setError("Budget From cannot be negative.");
    if (bad(p.budgetTo)) return setError("Budget To cannot be negative.");
    if (p.budgetFrom !== undefined && p.budgetTo !== undefined && p.budgetFrom > p.budgetTo)
      return setError("Budget From cannot be greater than Budget To.");
    run(() => filterSites(p));
  };

  const handleStatus = (id?: number) => { setStatusId(id); run(() => filterSites(params(id))); };

  const handleClear = () => {
    setSearch(""); setStatusId(undefined); setFromDate(""); setToDate(""); setBudgetFrom(""); setBudgetTo("");
    run(getAllSites);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this site?")) return;
    try {
      await deleteSite(id);
      setSites((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const hasFilters = search.trim() !== "" || statusId !== undefined || fromDate || toDate || budgetFrom || budgetTo;
  const statusName = statuses.find((s) => s.id === statusId)?.name ?? "";

  // Render helpers (plain functions, not components, so inputs keep focus)
  const field = (lbl: string, val: string, set: (v: string) => void, type: string, ph?: string) => (
    <>
      <label style={popLabel}>{lbl}</label>
      <input type={type} min={type === "number" ? "0" : undefined} value={val} placeholder={ph} onChange={(e) => set(e.target.value)} style={popInput} />
    </>
  );
  const actions = (onClear: () => void) => (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
      <button type="button" onClick={onClear} 
        style={{ 
          padding: "8px 12px", borderRadius: "7px", border: "1px solid #CBD5E1", 
          background: "#fff", color: "#475569", cursor: "pointer" }}>Clear</button>
      <button type="button" onClick={handleApply} 
        style={{ 
          padding: "8px 14px", borderRadius: "7px", border: "none", 
          background: "#F59E0B", color: "#fff", cursor: "pointer", fontWeight: 500 }}>Apply</button>
    </div>
  );
  const dropdown = (name: Filter, text: string, active: boolean, minWidth: string, popup: React.ReactNode) => (
    <div className="filter-wrap" style={{ position: "relative" }}>
      <button type="button" onClick={() => setOpenFilter(openFilter === name ? null : name)} style={filterBtn(active, minWidth)}>
        {text}<span style={{ float: "right", marginLeft: "10px" }}>▾</span>
      </button>
      {openFilter === name && popup}
    </div>
  );
  const statusItem = (id: number | undefined, text: string) => (
    <button key={text} type="button" onClick={() => handleStatus(id)}
      style={{ width: "100%", textAlign: "left", border: "none", background: statusId === id ? "#FFF7E6" : "#fff", padding: "9px 10px", borderRadius: "7px", cursor: "pointer", color: "#334155" }}>
      {text}
    </button>
  );

  const HEADERS = ["Site Name", "Started Date", "Status", "Contact Name", "Contact Number", "Address", "Action"];

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh" }}>
      <div className="page-pad" style={{ padding: "30px" }}>
        <div className="page-card" style={{ background: "#fff", borderRadius: "18px", padding: "25px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)" }}>

          <PageHeader title="Site List" addTo="/site-add" badge={<span className="badge-pill">Total Sites <b>{sites.length}</b></span>} />

          {/* ── Filter bar ── */}
          <div className="filter-bar" style={{ position: "relative", display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px", flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #CBD5E1", borderRadius: "9px", overflow: "hidden", background: "#fff" }}>
                <span style={{ paddingLeft: "12px", color: "#64748B", fontSize: "16px" }}>🔍</span>
                <input
                  type="text" value={search} placeholder="Search Site Name or Contact Name"
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleApply()}
                  style={{ width: "100%", border: "none", outline: "none", padding: "10px 12px 10px 8px", fontSize: "14px" }}
                />
              </div>
            </div>

            {dropdown("status", statusName || "Status", statusId !== undefined, "130px",
              <div className="filter-pop" style={popStyle("220px", "8px")}>
                {statusItem(undefined, "All Statuses")}
                {statuses.map((s) => statusItem(s.id, s.name))}
              </div>
            )}

            {dropdown("date", "Date", !!(fromDate || toDate), "110px",
            <div className="filter-pop" style={popStyle("280px", "15px")}>
              {field("From Date", fromDate, setFromDate, "date")}
              {field("To Date", toDate, setToDate, "date")}

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button type="button" onClick={() => { setFromDate(""); setToDate("");}}
              style={{ padding: "8px 12px", borderRadius: "7px", border: "1px solid #CBD5E1",
                      background: "#fff", color: "#475569", cursor: "pointer", }}> Clear
            </button>
          </div>
       </div>
      )}

            {dropdown("budget", "Budget", !!(budgetFrom || budgetTo), "115px",
              <div className="filter-pop" style={popStyle("280px", "15px")}>
                <div style={{ fontWeight: 600, color: "#1E293B", marginBottom: "12px" }}>Budget</div>
                {field("From Amount", budgetFrom, setBudgetFrom, "number", "Minimum budget")}
                {field("To Amount", budgetTo, setBudgetTo, "number", "Maximum budget")}
                {actions(() => { setBudgetFrom(""); setBudgetTo(""); })}
              </div>
            )}

            <button type="button" onClick={handleApply} 
              style={{ padding: "10px 16px", borderRadius: "9px", border: "none", 
                background: "#1E3A5F", color: "#fff", cursor: "pointer", fontWeight: 500 }}>
              Apply
            </button>
            {hasFilters && (
              <button type="button" onClick={handleClear} 
                style={{ padding: "10px 14px", borderRadius: "9px", border: "1px solid #CBD5E1", 
                  background: "#fff", color: "#475569", cursor: "pointer", fontWeight: 500 }}>
                Clear
              </button>
            )}
          </div>

          {successMessage && <div 
            style={{ color: "#16A34A", marginBottom: "10px", fontWeight: 500 }}>{successMessage}</div>}
          {error && (
            <div style={{ color: "#DC2626", 
              background: "#FEF2F2", border: "1px solid #FECACA", padding: "9px 12px", 
              borderRadius: "7px", marginBottom: "12px" }}>
              {error}
            </div>
          )}

          {/* ── Table ── */}
          {loading ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Loading...</p>
          ) : (
            <table className="stack-table" 
              style={{ width: "100%", borderCollapse: "collapse", borderRadius: "12px", overflow: "hidden", tableLayout: "fixed" }}>
              <colgroup>
                {["14%", "11%", "14%", "13%", "13%", expandAddress ? "25%" : "15%", "10%"].map((w, i) => (
                  <col key={i} style={{ width: w, transition: "width 0.3s ease" }} />
                ))}
              </colgroup>
              <thead style={{ background: "#1E3A5F", color: "#fff" }}>
                <tr>
                  {HEADERS.map((h, i) => <th key={h} 
                  style={{ ...th, borderRight: i === HEADERS.length - 1 ? "none" : th.borderRight }}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {sites.length > 0 ? sites.map((s, i) => {
                  const bg = i % 2 ? "#F3F4F6" : "#FFFFFF";
                  return (
                    <tr key={s.id} style={{ borderBottom: "1px solid #E5E7EB", background: bg }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = bg)}>
                      <td data-label={HEADERS[0]} style={cell()}>
                        <Link to={`/site-detail/${s.id}`} 
                          style={{ color: "inherit", textDecoration: "none" }}><b>{s.name}</b></Link>
                      </td>
                      <td data-label={HEADERS[1]} 
                        style={cell({ whiteSpace: "nowrap" })}>{s.startedDate ? fmt(s.startedDate) : "—"}</td>
                      <td data-label={HEADERS[2]} 
                        style={cell()}>{s.status ?? "—"}</td>
                      <td data-label={HEADERS[3]} 
                        style={cell()}>{s.contactName ?? "—"}</td>
                      <td data-label={HEADERS[4]} 
                        style={cell({ whiteSpace: "nowrap" })}>{s.contactNumber ?? "—"}</td>
                      <td
                        data-label={HEADERS[5]}
                        onClick={() => setExpandAddress((c) => !c)}
                        title={expandAddress ? "Click to collapse Address column" : "Click to expand Address column"}
                        style={cell({
                          color: "#64748B", cursor: "pointer", overflow: "hidden",
                          whiteSpace: expandAddress ? "normal" : "nowrap",
                          textOverflow: expandAddress ? "clip" : "ellipsis",
                          wordBreak: expandAddress ? "break-word" : "normal",
                        })}
                      >
                        {addressText(s)}
                      </td>
                      <td data-label={HEADERS[6]} style={cell({ whiteSpace: "nowrap", borderRight: "none" })}>
                        <Link to={`/site-edit/${s.id}`} 
                        style={{ color: "#16A34A", fontWeight: 500, textDecoration: "none" }}>Edit</Link>
                        {" | "}
                        <button 
                          onClick={() => handleDelete(s.id)} 
                          style={{ color: "#DC2626", fontWeight: 500, 
                          background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td data-label="" colSpan={7} 
                    style={{ textAlign: "center", padding: "15px", color: "#888" }}
                    >No site records found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

export default SiteList;