// Path: src/pages/CostMaster/CostMasterList.tsx
import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCostMasters, deleteCostMaster } from "../../services/costMasterService";
import type { CostMasterDto, ServiceTypeOption } from "../../services/costMasterService";
import { useSite } from "../../context/Sitecontext";
import PageHeader from "../../components/PageHeader";

const th: React.CSSProperties = { padding: "14px", textAlign: "center", borderRight: "2px solid #fff" };
const td: React.CSSProperties = { padding: "12px", textAlign: "center", borderRight: "1px solid #E2E8F0" };
const notice = (bg: string, color: string): React.CSSProperties => ({ 
  background: bg, color, padding: "10px", 
  borderRadius: "8px", textAlign: "center", marginBottom: "15px" });

function CostMasterList() {
  const location = useLocation();
  const { selectedSite } = useSite();
  const siteId = selectedSite?.id ?? 0;

  const [costMasters, setCostMasters] = useState<CostMasterDto[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeOption[]>([]);
  const [serviceTypeId, setServiceTypeId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const isFirstLoad = useRef(true);
  const successMessage = (location.state as { success?: string })?.success;

  // Initial load
  useEffect(() => {
    getCostMasters(siteId)
      .then((r) => { setServiceTypes(r.serviceTypes); setCostMasters(r.items); setServiceTypeId(r.selectedServiceTypeId); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [siteId]);

  // Filter change
  useEffect(() => {
    if (isFirstLoad.current) { isFirstLoad.current = false; return; }
    if (!serviceTypeId) return;
    setLoading(true);
    getCostMasters(siteId, serviceTypeId)
      .then((r) => setCostMasters(r.items))
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [serviceTypeId, siteId]);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteCostMaster(siteId, id);
      setCostMasters((prev) => prev.filter((x) => x.id !== id));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "calc(100vh - 68px)" }}>
      <div className="page-pad" style={{ padding: "30px 38px", maxWidth: "1200px", margin: "0 auto" }}>
        <div className="page-card" style={{ 
          background: "#fff", borderRadius: "16px", 
          padding: "25px", boxShadow: "0 10px 30px rgba(0,0,0,0.2)" }}>

          <PageHeader title="Cost Master" addTo="/cost-master/add" />

          {successMessage && <div style={notice("#dcfce7", "#166534")}>{successMessage}</div>}
          {error && <div style={notice("#fdecea", "#c62828")}>{error}</div>}

          {/* Service Type filter */}
          <div style={{ marginBottom: "15px", display: "flex", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <label style={{ fontWeight: 600, color: "#1E293B" }}>Service Type:</label>
            <select
              value={serviceTypeId ?? ""}
              onChange={(e) => setServiceTypeId(Number(e.target.value))}
              style={{ 
                borderRadius: "8px", padding: "8px 10px", 
                width: "100%", maxWidth: "240px", border: "1px solid #CBD5E1", 
                background: "#fff", fontSize: "15px" }}
            >
              {serviceTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          {loading ? (
            <p style={{ textAlign: "center", padding: "30px" }}>Loading...</p>
          ) : costMasters.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table className="stack-table" style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}>
                <thead style={{ background: "#1E3A5F", color: "#fff" }}>
                  <tr>
                    <th style={{ ...th, width: "24%" }}>Date</th>
                    <th style={{ ...th, width: "28%" }}>Service Type</th>
                    <th style={{ ...th, width: "23%" }}>Cost</th>
                    <th style={{ ...th, width: "25%", borderRight: "none" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {costMasters.map((item) => (
                    <tr key={item.id} style={{ borderBottom: "1px solid #E2E8F0" }}>
                      <td data-label="Date" style={td}>
                        {new Date(item.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
                      </td>
                      <td data-label="Service Type" style={td}>{item.name}</td>
                      <td data-label="Cost" style={td}>
                        <span style={{ 
                          display: "inline-block", background: "#FEF3C7", 
                          color: "#92400E", border: "1px solid #FDE68A", 
                          padding: "4px 12px", borderRadius: "8px" }}>
                          ₹ {item.cost}
                        </span>
                      </td>
                      <td data-label="Action" style={{ ...td, borderRight: "none" }}>
                        <Link to={`/cost-master/edit/${item.id}`} style={{ 
                          color: "#16A34A", fontWeight: 500, textDecoration: "none" }}>Edit</Link>
                        <span style={{ color: "#94A3B8", margin: "0 12px" }}>|</span>
                        <button onClick={() => handleDelete(item.id)} style={{ 
                          color: "#DC2626", fontWeight: 500, background: "none", 
                          border: "none", cursor: "pointer", padding: 0 }}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "30px", fontWeight: 600, color: "#6c757d" }}>
              🚫 No records found for selected service type
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CostMasterList;