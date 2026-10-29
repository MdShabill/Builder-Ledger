// Path: src/pages/CostMaster/CostMasterEdit.tsx
import { useEffect, useState }              from "react";
import { useNavigate, useParams, Link }     from "react-router-dom";
import { getCostMasterById, updateCostMaster, getCostMasters } from "../../services/costMasterService";
import type { ServiceTypeOption }           from "../../services/costMasterService";
import { useSite }                          from "../../context/Sitecontext";

function CostMasterEdit() {
  const { id }       = useParams();
  const navigate     = useNavigate();
  const { selectedSite } = useSite();
  const siteId       = selectedSite?.id ?? 0;

  const [serviceTypes,  setServiceTypes]  = useState<ServiceTypeOption[]>([]);
  const [date,          setDate]          = useState("");
  const [serviceTypeId, setServiceTypeId] = useState<number>(0);
  const [cost,          setCost]          = useState("");
  const [errorMessage,  setErrorMessage]  = useState("");
  const [submitting,    setSubmitting]    = useState(false);

  useEffect(() => {
    async function load() {
      try {
        // Service types from index, item data from getById
        const [listResult, item] = await Promise.all([
          getCostMasters(siteId),
          getCostMasterById(siteId, Number(id)),
        ]);
        setServiceTypes(listResult.serviceTypes);
        setDate(item.date?.slice(0, 10) ?? "");
        setServiceTypeId(item.serviceTypeId);
        setCost(String(item.cost));
      } catch (err) {
        setErrorMessage((err as Error).message);
      }
    }
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !serviceTypeId) {
      setErrorMessage("Please enter correct inputs.");
      return;
    }
    if (!cost || isNaN(Number(cost)) || Number(cost) <= 0) {
      setErrorMessage("Cost must be a positive number.");
      return;
    }
    setSubmitting(true);
    try {
      await updateCostMaster(siteId, Number(id), {
        serviceTypeId,
        cost: Number(cost),
        date,
      });
      navigate("/cost-master", { state: { success: "Cost Master updated successfully." } });
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      background: "linear-gradient(135deg, #1E3A5F, #0F172A)",
      minHeight: "100vh",
      padding: "30px",
    }}>
      <div style={{
        background: "#fff",
        borderRadius: "16px",
        padding: "30px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        maxWidth: "500px",
        margin: "auto",
      }}>
        <h3 style={{ textAlign: "center", fontWeight: 700, color: "#1E293B", marginBottom: "20px" }}>
          Edit Cost
        </h3>

        {errorMessage && (
          <div style={{
            background: "#fdecea", color: "#c62828", border: "1px solid #f5c6cb",
            borderRadius: "8px", padding: "10px 14px", marginBottom: "15px", textAlign: "center",
          }}>
            <b>{errorMessage}</b>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Date */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "5px" }}>Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{
                width: "100%", borderRadius: "10px", padding: "10px",
                border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Service Type */}
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "5px" }}>Service Type</label>
            <select
              value={serviceTypeId}
              onChange={(e) => setServiceTypeId(Number(e.target.value))}
              style={{
                width: "100%", borderRadius: "10px", padding: "10px",
                border: "1px solid #ddd", height: "40px", fontSize: "14px",
                boxSizing: "border-box",
              }}
            >
              <option value={0}>-- Select --</option>
              {serviceTypes.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          {/* Cost */}
          <div style={{ marginBottom: "25px" }}>
            <label style={{ fontWeight: 600, display: "block", marginBottom: "5px" }}>Cost</label>
            <input
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              style={{
                width: "100%", borderRadius: "10px", padding: "10px",
                border: "1px solid #ddd", fontSize: "14px", boxSizing: "border-box",
              }}
            />
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <Link
              to="/cost-master"
              style={{
                background: "transparent", color: "#64748B", fontWeight: 600,
                borderRadius: "10px", padding: "10px 18px",
                border: "1px solid #CBD5E1", textDecoration: "none",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={submitting}
              style={{
                background: "#F59E0B", color: "#fff", fontWeight: 600,
                borderRadius: "10px", padding: "10px 20px", border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}

export default CostMasterEdit;