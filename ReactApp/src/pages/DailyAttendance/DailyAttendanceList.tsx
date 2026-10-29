// Path: src/pages/DailyAttendance/DailyAttendanceList.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getDailyAttendances } from "../../services/dailyAttendanceService";
import type { DailyAttendanceDto } from "../../services/dailyAttendanceService";
import { useSite } from "../../context/Sitecontext";
import PageHeader from "../../components/PageHeader";

const pill = (v: React.ReactNode) => (
  <span style={{ 
    background: "#FEF3C7", color: "#92400E", 
    border: "1px solid #FDE68A", padding: "4px 12px", 
    borderRadius: "8px" }}>{v}</span>
);
const dateInput: React.CSSProperties = { width: "150px", borderRadius: "8px", padding: "6px 10px", border: "1px solid #ddd" };
const HEADERS = [ "Date", "Job Category", "Contractors", "Total Workers", "Amount Per Worker", "Total Amount",];

function DailyAttendanceList() {
  const location = useLocation();
  const { selectedSite } = useSite();
  const siteId = selectedSite?.id ?? 0;

  const [records, setRecords] = useState<DailyAttendanceDto[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const successMessage = (location.state as { success?: string })?.success;

  const loadData = (from?: string, to?: string) => {
    setLoading(true);
    getDailyAttendances(siteId, from, to)
      .then(setRecords)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [siteId]);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const today = new Date().toISOString().split("T")[0];
    if (dateFrom && dateTo && dateFrom > dateTo) return setError("FROM DATE cannot be greater than TO DATE.");
    // fixed: previously compared dateFrom/dateTo against today in the wrong pairs
    if ((dateFrom && dateFrom > today) || (dateTo && dateTo > today)) 
      return setError("FROM DATE and TO DATE cannot be in the future.");
    loadData(dateFrom || undefined, dateTo || undefined);
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh" }}>
      <div className="page-pad" style={{ padding: "30px" }}>
        <div className="page-card" style={{ 
          background: "#fff", borderRadius: "16px", 
          padding: "25px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>

          <PageHeader title="Attendance" addTo="/attendance/add" />

          {successMessage && (
            <div style={{ 
              background: "#dcfce7", color: "#166534", 
              padding: "10px", borderRadius: "8px", textAlign: "center", 
              marginBottom: "15px" }}>
              {successMessage}
            </div>
          )}

          <form onSubmit={handleGo} className="filter-form">
            <label className="fl">From: <input 
            type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} style={dateInput} /></label>
            <label className="fl">To: <input 
            type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} style={dateInput} /></label>
            <button type="submit" style={{ 
              background: "#F59E0B", color: "#fff", fontWeight: 600, 
              borderRadius: "10px", padding: "8px 18px", border: "none", cursor: "pointer" }}>
              Go
            </button>
          </form>

          {error && <p style={{ color: "red", fontWeight: 500, marginTop: 0 }}>{error}</p>}

          {loading ? (
            <p style={{ textAlign: "center", padding: "30px" }}>Loading...</p>
          ) : records.length > 0 ? (
            <table className="stack-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "#1E3A5F", color: "#fff" }}>
                <tr>{HEADERS.map((h) => <th key={h} style={{ padding: "14px", textAlign: "center" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {records.map((r) => (
                  <tr key={r.id} style={{ borderBottom: "1px solid #eee", textAlign: "center" }}>
                    <td data-label={HEADERS[0]} style={{ padding: "12px" }}>
                      {new Date(r.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td data-label={HEADERS[1]} style={{ padding: "12px" }}>{r.name}</td>
                    <td data-label={HEADERS[2]} style={{ padding: "12px" }}>{r.serviceProviderName}</td>
                    <td data-label={HEADERS[3]} style={{ padding: "12px" }}>{pill(r.totalWorker)}</td>
                    <td data-label={HEADERS[4]} style={{ padding: "12px" }}>{pill(r.amountPerWorker.toFixed(2))}</td>
                    <td data-label={HEADERS[5]} style={{ padding: "12px" }}>{pill(`₹ ${r.totalAmount.toFixed(2)}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div style={{ textAlign: "center", padding: "30px", fontWeight: 600, color: "#6c757d" }}>🚫 No Record Found</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DailyAttendanceList;