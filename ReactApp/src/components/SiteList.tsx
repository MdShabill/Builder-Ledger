
import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getAllSites, filterSites, getMasterData, deleteSite } from "../services/siteService";
import type { SiteListDto, DropdownItem, SiteSortColumn, SortOrder } from "../services/siteService";
import PageHeader from "./PageHeader";

type Filter = "status" | "date" | "budget";

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", {
  day: "2-digit", month: "short", year: "numeric"
});

const addressText = (s: SiteListDto) =>
  [s.addressTypes, s.addressLine1, s.countryName, s.pinCode]
    .filter(Boolean).join(" - ") || "—";

const filterBtn = (active: boolean, minWidth: string): React.CSSProperties => ({
  minWidth, padding: "10px 14px", borderRadius: "9px",
  border: "1px solid #CBD5E1", background: active ? "#FFF7E6" : "#fff",
  color: "#334155", cursor: "pointer", fontSize: "14px", textAlign: "left"
});

const popStyle = (width: string, padding: string): React.CSSProperties => ({
  position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 20,
  width, background: "#fff", border: "1px solid #E2E8F0",
  borderRadius: "10px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)", padding
});

const popInput: React.CSSProperties = {
  width: "100%", padding: "9px 10px", border: "1px solid #CBD5E1",
  borderRadius: "7px", outline: "none", marginBottom: "12px"
};

const popLabel: React.CSSProperties = {
  display: "block", fontSize: "13px", fontWeight: 500,
  color: "#475569", marginBottom: "5px"
};

const th: React.CSSProperties = {
  padding: "10px 12px", textAlign: "left", fontSize: "14px",
  fontWeight: 600, whiteSpace: "nowrap",
  borderRight: "3px solid rgba(255,255,255,0.95)"
};

const cell = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  padding: "8px 12px", textAlign: "left", verticalAlign: "middle",
  borderRight: "1px solid #E5E7EB", ...extra
});

// Client-side sorting for filtered results
const sortFilteredSites = (
  data: SiteListDto[],
  column: SiteSortColumn,
  order: SortOrder
): SiteListDto[] => {
  return [...data].sort((a, b) => {
    let result = 0;

    if (column === "Id") {
      result = a.id - b.id;
    } else if (column === "StartedDate") {
      result = new Date(a.startedDate || 0).getTime() -
               new Date(b.startedDate || 0).getTime();
    } else {
      result = (a[column === "Name" ? "name" : "status"] ?? "")
        .localeCompare(
          b[column === "Name" ? "name" : "status"] ?? "",
          undefined,
          { sensitivity: "base", numeric: true }
        );
    }

    return order === "ASC" ? result : -result;
  });
};

function SiteList() {
  const location = useLocation();

  const [sites, setSites] = useState<SiteListDto[]>([]);
  const [statuses, setStatuses] = useState<DropdownItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");

  // Pagination
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Sorting
  const [sortColumn, setSortColumn] = useState<SiteSortColumn>("Id");
  const [sortOrder, setSortOrder] = useState<SortOrder>("DESC");

  // Filters
  const [search, setSearch] = useState("");
  const [statusId, setStatusId] = useState<number | undefined>();
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [budgetFrom, setBudgetFrom] = useState("");
  const [budgetTo, setBudgetTo] = useState("");
  const [openFilter, setOpenFilter] = useState<Filter | null>(null);
  const [expandAddress, setExpandAddress] = useState(false);

  const successMessage = (location.state as { success?: string })?.success ?? "";

  const hasFilters = !!( search.trim() || statusId !== undefined || fromDate ||
                         toDate || budgetFrom || budgetTo );

  const totalPages = Math.ceil(totalCount / pageSize);

  // Load paginated and sorted sites
  const loadPage = async ( page = 1, size = pageSize, column = sortColumn, order = sortOrder) => {
    try { setLoading(true); setError("");

      const result = await getAllSites(page, size, column, order);

      setSites(result.items);
      setTotalCount(result.totalCount);
      setPageNumber(result.pageNumber);
      setPageSize(result.pageSize);
      setOpenFilter(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Load filtered sites
  const run = async (fn: () => Promise<SiteListDto[]>) => {
    try {
      setLoading(true);
      setError("");
      setSites(sortFilteredSites(await fn(), sortColumn, sortOrder));
      setOpenFilter(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Change sorting
  const handleSort = (column: SiteSortColumn) => {
    const order: SortOrder = sortColumn === column && sortOrder === "ASC" ? "DESC" : "ASC";

    setSortColumn(column);
    setSortOrder(order);

    if (hasFilters) {
      run(() => filterSites(params()).then(data =>
        sortFilteredSites(data, column, order)
      ));
    } else {
      loadPage(1, pageSize, column, order);
    }
  };

  useEffect(() => { loadPage(1); getMasterData({ siteStatusData: true })
      .then(data => setStatuses(data.statuses ?? []))
      .catch((err: Error) => setError(err.message));
  }, []);

  const toNum = (v: string) => v.trim() !== "" ? Number(v) : undefined;

  const params = (status = statusId) => ({
    search: search.trim() || undefined,
    statusId: status,
    fromDate: fromDate || undefined,
    toDate: toDate || undefined,
    budgetFrom: toNum(budgetFrom),
    budgetTo: toNum(budgetTo)
  });

  // Apply filters
  const handleApply = () => {
    const p = params();
    const bad = (n?: number) =>
      n !== undefined && (Number.isNaN(n) || n < 0);

    if (fromDate && toDate && fromDate > toDate)
      return setError("From Date cannot be greater than To Date.");

    if (bad(p.budgetFrom))
      return setError("Budget From cannot be negative.");

    if (bad(p.budgetTo))
      return setError("Budget To cannot be negative.");

    if (p.budgetFrom !== undefined && p.budgetTo !== undefined &&
        p.budgetFrom > p.budgetTo)
      return setError("Budget From cannot be greater than Budget To.");

    if (!hasFilters) return loadPage(1);
    run(() => filterSites(p));
  };

  const handleStatus = (id?: number) => {
    setStatusId(id);
    run(() => filterSites(params(id)));
  };

  // Clear filters
  const handleClear = () => {
    setSearch("");
    setStatusId(undefined);
    setFromDate("");
    setToDate("");
    setBudgetFrom("");
    setBudgetTo("");
    loadPage(1);
  };

  // Delete site
  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this site?"))
      return;

    try {
      setError("");
      setDeleteSuccess("");
      await deleteSite(id);
      setDeleteSuccess("Your Site Has been Deleted successfully.");

      if (!hasFilters) {
        const nextPage = sites.length === 1 && pageNumber > 1 ? pageNumber - 1 : pageNumber;
        await loadPage(nextPage);
      } else {
        await run(() => filterSites(params()));
      }
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const statusName = statuses.find(s => s.id === statusId)?.name ?? "";

  // Filter UI helpers
  const field = ( lbl: string, val: string, set: (v: string) => void, type: string, ph?: string
  ) => (
    <>
      <label style={popLabel}>{lbl}</label>
      <input type={type} min={type === "number" ? "0" : undefined}
        value={val} placeholder={ph}
        onChange={e => set(e.target.value)} style={popInput} />
    </>
  );

  const actions = (onClear: () => void) => (
    <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
      <button type="button" onClick={onClear}
        style={{ padding: "8px 12px", borderRadius: "7px",
          border: "1px solid #CBD5E1", background: "#fff",
          color: "#475569", cursor: "pointer" }}>
        Clear
      </button>
      <button type="button" onClick={handleApply}
        style={{ padding: "8px 14px", borderRadius: "7px",
          border: "none", background: "#F59E0B",
          color: "#fff", cursor: "pointer", fontWeight: 500 }}>
        Apply
      </button>
    </div>
  );

  const dropdown = (
    name: Filter, text: string, active: boolean,
    minWidth: string, popup: React.ReactNode
  ) => (
    <div className="filter-wrap" style={{ position: "relative" }}>
      <button type="button"
        onClick={() => setOpenFilter(openFilter === name ? null : name)}
        style={filterBtn(active, minWidth)}>
        {text}<span style={{ float: "right", marginLeft: "10px" }}>▾</span>
      </button>
      {openFilter === name && popup}
    </div>
  );

  const statusItem = (id: number | undefined, text: string) => (
    <button key={text} type="button" onClick={() => handleStatus(id)}
      style={{ width: "100%", textAlign: "left", border: "none",
        background: statusId === id ? "#FFF7E6" : "#fff",
        padding: "9px 10px", borderRadius: "7px",
        cursor: "pointer", color: "#334155" }}>
      {text}
    </button>
  );

  // Only these three visible columns are sortable
  const HEADERS = [
    { label: "Site Name", column: "Name" as SiteSortColumn },
    { label: "Started Date", column: "StartedDate" as SiteSortColumn },
    { label: "Status", column: "Status" as SiteSortColumn },
    { label: "Contact Name" },
    { label: "Contact Number" },
    { label: "Address" },
    { label: "Action" }
  ];

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh" }}>
      <div className="page-pad" style={{ padding: "30px" }}>
        <div className="page-card" style={{
          background: "#fff", borderRadius: "18px", padding: "25px",
          boxShadow: "0 10px 25px rgba(0,0,0,0.15)"
        }}>
          <PageHeader title="Site List" addTo="/site-add"
            badge={<span className="badge-pill">
              Total Sites <b>{hasFilters ? sites.length : totalCount}</b>
            </span>}
          />

          {/* Filter bar */}
          <div className="filter-bar" style={{
            position: "relative", display: "flex", alignItems: "center",
            gap: "10px", marginBottom: "20px", flexWrap: "wrap"
          }}>
            <div style={{ flex: "1 1 240px", minWidth: 0 }}>
              <div style={{
                display: "flex", alignItems: "center",
                border: "1px solid #CBD5E1", borderRadius: "9px",
                overflow: "hidden", background: "#fff"
              }}>
                <span style={{ paddingLeft: "12px", color: "#64748B" }}>🔍</span>
                <input type="text" value={search}
                  placeholder="Search Site Name or Contact Name"
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleApply()}
                  style={{ width: "100%", border: "none", outline: "none",
                    padding: "10px 12px 10px 8px", fontSize: "14px" }}
                />
              </div>
            </div>

            {dropdown("status", statusName || "Status",
              statusId !== undefined, "130px",
              <div className="filter-pop" style={popStyle("220px", "8px")}>
                {statusItem(undefined, "All Statuses")}
                {statuses.map(s => statusItem(s.id, s.name))}
              </div>
            )}

            {dropdown("date", "Date", !!(fromDate || toDate), "110px",
              <div className="filter-pop" style={popStyle("280px", "15px")}>
                {field("From Date", fromDate, setFromDate, "date")}
                {field("To Date", toDate, setToDate, "date")}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="button"
                    onClick={() => { setFromDate(""); setToDate(""); }}
                    style={{ padding: "8px 12px", borderRadius: "7px",
                      border: "1px solid #CBD5E1", background: "#fff",
                      color: "#475569", cursor: "pointer" }}>
                    Clear
                  </button>
                </div>
              </div>
            )}

            {dropdown("budget", "Budget", !!(budgetFrom || budgetTo), "115px",
              <div className="filter-pop" style={popStyle("280px", "15px")}>
                <div style={{ fontWeight: 600, color: "#1E293B", marginBottom: "12px" }}>
                  Budget
                </div>
                {field("From Amount", budgetFrom, setBudgetFrom, "number", "Minimum budget")}
                {field("To Amount", budgetTo, setBudgetTo, "number", "Maximum budget")}
                {actions(() => { setBudgetFrom(""); setBudgetTo(""); })}
              </div>
            )}

            <button type="button" onClick={handleApply}
              style={{ padding: "10px 16px", borderRadius: "9px",
                border: "none", background: "#1E3A5F",
                color: "#fff", cursor: "pointer", fontWeight: 500 }}>
              Apply
            </button>

            {hasFilters && (
              <button type="button" onClick={handleClear}
                style={{ padding: "10px 14px", borderRadius: "9px",
                  border: "1px solid #CBD5E1", background: "#fff",
                  color: "#475569", cursor: "pointer", fontWeight: 500 }}>
                Clear
              </button>
            )}
          </div>

          {(deleteSuccess || successMessage) && (
            <div style={{
              color: "#16A34A", background: "#F0FDF4",
              border: "1px solid #BBF7D0", padding: "10px 12px",
              borderRadius: "7px", marginBottom: "12px", fontWeight: 500
            }}>
              {deleteSuccess || successMessage}
            </div>
          )}

          {error && (
            <div style={{ color: "#DC2626", background: "#FEF2F2",
              border: "1px solid #FECACA", padding: "9px 12px",
              borderRadius: "7px", marginBottom: "12px" }}>
              {error}
            </div>
          )}

          {/* Site table */}
          {loading ? (
            <p style={{ textAlign: "center", padding: "20px" }}>Loading...</p>
          ) : (
            <table className="stack-table" style={{
              width: "100%", borderCollapse: "collapse",
              borderRadius: "12px", overflow: "hidden", tableLayout: "fixed"
            }}>
              <colgroup>
                {["14%", "11%", "14%", "13%", "13%",
                  expandAddress ? "25%" : "15%", "10%"].map((w, i) => (
                  <col key={i} style={{ width: w, transition: "width 0.3s ease" }} />
                ))}
              </colgroup>

              <thead style={{ background: "#1E3A5F", color: "#fff" }}>
                <tr>
                  {HEADERS.map((h, i) => (
                    <th key={h.label} style={{
                      ...th,
                      borderRight: i === HEADERS.length - 1 ? "none" : th.borderRight
                    }}>
                      {h.column ? (
                        <button type="button"
                          onClick={() => handleSort(h.column!)}
                          style={{
                            background: "transparent", border: "none",
                            color: "inherit", font: "inherit",
                            cursor: "pointer", padding: 0, whiteSpace: "nowrap"
                          }}>
                          {h.label}{" "}
                          {sortColumn === h.column
                            ? sortOrder === "ASC" ? "▲" : "▼"
                            : "↕"}
                        </button>
                      ) : h.label}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {sites.length > 0 ? sites.map((s, i) => {
                  const bg = i % 2 ? "#F3F4F6" : "#FFFFFF";

                  return (
                    <tr key={s.id} style={{
                      borderBottom: "1px solid #E5E7EB", background: bg
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = "#F9FAFB"}
                      onMouseLeave={e => e.currentTarget.style.background = bg}>

                      <td data-label="Site Name" style={cell()}>
                        <Link to={`/site-detail/${s.id}`}
                          style={{ color: "inherit", textDecoration: "none" }}>
                          <b>{s.name}</b>
                        </Link>
                      </td>

                      <td data-label="Started Date"
                        style={cell({ whiteSpace: "nowrap" })}>
                        {s.startedDate ? fmt(s.startedDate) : "—"}
                      </td>

                      <td data-label="Status" style={cell()}>
                        {s.status ?? "—"}
                      </td>

                      <td data-label="Contact Name" style={cell()}>
                        {s.contactName ?? "—"}
                      </td>

                      <td data-label="Contact Number"
                        style={cell({ whiteSpace: "nowrap" })}>
                        {s.contactNumber ?? "—"}
                      </td>

                      <td data-label="Address"
                        onClick={() => setExpandAddress(c => !c)}
                        title={expandAddress ? "Click to collapse Address column" : "Click to expand Address column"}
                        style={cell({
                          color: "#64748B", cursor: "pointer", overflow: "hidden",
                          whiteSpace: expandAddress ? "normal" : "nowrap",
                          textOverflow: expandAddress ? "clip" : "ellipsis",
                          wordBreak: expandAddress ? "break-word" : "normal"
                        })}>
                        {addressText(s)}
                      </td>

                      <td data-label="Action"
                        style={cell({ whiteSpace: "nowrap", borderRight: "none" })}>
                        <Link to={`/site-edit/${s.id}`}
                          style={{ color: "#16A34A", fontWeight: 500, textDecoration: "none" }}>
                          Edit
                        </Link>
                        {" | "}
                        <button onClick={() => handleDelete(s.id)}
                          style={{ color: "#DC2626", fontWeight: 500,
                            background: "none", border: "none",
                            cursor: "pointer", padding: 0 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={7} data-label=""
                      style={{ textAlign: "center", padding: "15px", color: "#888" }}>
                      No site records found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* Pagination */}
          {!loading && !hasFilters && totalCount > 0 && (
            <div style={{
              display: "flex", justifyContent: "space-between",
              alignItems: "center", flexWrap: "wrap",
              gap: "12px", marginTop: "20px"
            }}>
              <div style={{ color: "#64748B", fontSize: "14px" }}>
                Showing {(pageNumber - 1) * pageSize + 1}
                {" - "}
                {Math.min(pageNumber * pageSize, totalCount)}
                {" of "}{totalCount} sites
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <button type="button" disabled={pageNumber === 1}
                  onClick={() => loadPage(pageNumber - 1)}
                  style={{
                    padding: "8px 14px", borderRadius: "7px",
                    border: "1px solid #CBD5E1",
                    background: pageNumber === 1 ? "#F1F5F9" : "#fff",
                    color: "#334155",
                    cursor: pageNumber === 1 ? "not-allowed" : "pointer"
                  }}>
                  Previous
                </button>

                <span style={{
                  padding: "8px 14px", background: "#1E3A5F",
                  color: "#fff", borderRadius: "7px", fontWeight: 600
                }}>
                  {pageNumber} / {totalPages}
                </span>

                <button type="button" disabled={pageNumber >= totalPages}
                  onClick={() => loadPage(pageNumber + 1)}
                  style={{
                    padding: "8px 14px", borderRadius: "7px",
                    border: "1px solid #CBD5E1",
                    background: pageNumber >= totalPages ? "#F1F5F9" : "#fff",
                    color: "#334155",
                    cursor: pageNumber >= totalPages ? "not-allowed" : "pointer"
                  }}>
                  Next
                </button>
              </div>

              <div style={{
                display: "flex", alignItems: "center",
                gap: "8px", fontSize: "14px"
              }}>
                <span>Rows per page:</span>
                <select value={pageSize}
                  onChange={e => loadPage(1, Number(e.target.value))}
                  style={{
                    padding: "7px 10px", border: "1px solid #CBD5E1",
                    borderRadius: "7px"
                  }}>
                  {[5, 10, 20, 50].map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SiteList;
