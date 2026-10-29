// Path: src/pages/DailyAttendance/DailyAttendanceAdd.tsx
import { useEffect, useState }    from "react";
import { useNavigate, Link }      from "react-router-dom";
import {
  getDropdownData, getCostByServiceType, addDailyAttendance,
} from "../../services/dailyAttendanceService";
import type {
  ServiceTypeOption, ServiceTypeCost, ServiceProviderOption,
} from "../../services/dailyAttendanceService";
import { useSite } from "../../context/Sitecontext";

function DailyAttendanceAdd() {
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const siteId = selectedSite?.id ?? 0;

  const [serviceTypes,     setServiceTypes]     = useState<ServiceTypeOption[]>([]);
  const [serviceTypeCosts, setServiceTypeCosts] = useState<ServiceTypeCost[]>([]);
  const [serviceProviders, setServiceProviders] = useState<ServiceProviderOption[]>([]);

  const [date,              setDate]              = useState(new Date().toISOString().slice(0, 16));
  const [serviceTypeId,     setServiceTypeId]     = useState("");
  const [serviceProviderId, setServiceProviderId] = useState("");
  const [totalWorker,       setTotalWorker]       = useState("");
  const [amountPerWorker,   setAmountPerWorker]   = useState("");
  const [totalAmount,       setTotalAmount]       = useState("");
  const [notes,             setNotes]             = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    getDropdownData(siteId)
      .then((result) => {
        setServiceTypes(result.serviceTypes);
        setServiceTypeCosts(result.serviceTypeCosts);
      })
      .catch((err: Error) => setErrorMessage(err.message));
  }, [siteId]);

  const handleServiceTypeChange = async (id: string) => {
    setServiceTypeId(id);
    setServiceProviderId("");
    setAmountPerWorker("");
    setTotalAmount("");

    if (!id) {
      setServiceProviders([]);
      return;
    }

    // Auto-fill cost from preloaded list (mirrors serviceTypeCosts JS array in MVC)
    const matched = serviceTypeCosts.find((s) => s.serviceTypeId === Number(id));
    if (matched) {
      setAmountPerWorker(String(matched.cost));
      if (totalWorker) {
        setTotalAmount((matched.cost * Number(totalWorker)).toFixed(2));
      }
    }

    // Fetch service providers for this type
    try {
      const result = await getCostByServiceType(siteId, Number(id));
      setServiceProviders(result.serviceProviders);
      if (!matched) setAmountPerWorker(String(result.cost));
    } catch {
      setServiceProviders([]);
    }
  };

  const handleTotalWorkerChange = (value: string) => {
    setTotalWorker(value);
    if (amountPerWorker && value) {
      setTotalAmount((Number(amountPerWorker) * Number(value)).toFixed(2));
    } else {
      setTotalAmount("");
    }
  };

  const validate = (): string | null => {
    if (!serviceTypeId) return "Please select a Job Category.";
    if (!totalWorker || Number(totalWorker) <= 0) return "Please enter a valid number of Total Workers.";
    if (!/^\d+$/.test(totalWorker)) return "Total Worker must be a valid positive number and cannot contain any special characters or alphabets.";
    if (new Date(date) > new Date()) return "Date cannot be in the future.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setErrorMessage(validationError); return; }

    setSubmitting(true);
    try {
      await addDailyAttendance(siteId, {
        date,
        serviceTypeId:     Number(serviceTypeId),
        serviceProviderId: Number(serviceProviderId) || 0,
        totalWorker:       Number(totalWorker),
        notes,
      });
      navigate("/attendance", { state: { success: "Add New Daily Attendance Successful" } });
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: "8px", padding: "8px",
    border: "1px solid #ddd", boxSizing: "border-box",
  };
  const readonlyStyle: React.CSSProperties = { ...inputStyle, background: "#e9ecef" };
  const labelStyle: React.CSSProperties = { fontWeight: 600, display: "block", marginBottom: "6px" };

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh", padding: "30px" }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "25px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)", maxWidth: "900px", margin: "auto",
      }}>
        <h3 style={{ textAlign: "center", fontWeight: 700, color: "#1E293B", marginBottom: "20px" }}>
          Daily Attendance
        </h3>

        {errorMessage && (
          <div style={{ textAlign: "center", marginBottom: "15px" }}>
            <span style={{ color: "#c62828", fontWeight: 700 }}>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "16px" }}>

            <div>
              <label style={labelStyle}>Date</label>
              <input
                type="datetime-local" value={date}
                onChange={(e) => setDate(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Job Category</label>
              <select
                value={serviceTypeId}
                onChange={(e) => handleServiceTypeChange(e.target.value)}
                style={inputStyle}
              >
                <label style={labelStyle}>Contractor</label>
                {serviceTypes.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Contractor Name</label>
              <select
                value={serviceProviderId}
                onChange={(e) => setServiceProviderId(e.target.value)}
                style={inputStyle}
              >
                <option value="-1">SELECT</option>
                {serviceProviders.map((sp) => (
                  <option key={sp.serviceProviderId} value={sp.serviceProviderId}>
                    {sp.serviceProviderName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Total Worker</label>
              <input
                value={totalWorker}
                onChange={(e) => handleTotalWorkerChange(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Amount Per Worker</label>
              <input value={amountPerWorker} readOnly style={readonlyStyle} />
            </div>

            <div>
              <label style={labelStyle}>Total Amount</label>
              <input value={totalAmount} readOnly style={readonlyStyle} />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={labelStyle}>Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                style={{ ...inputStyle, resize: "vertical" }}
              />
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <Link
              to="/attendance"
              style={{
                background: "transparent", color: "#64748B", fontWeight: 600,
                borderRadius: "10px", padding: "10px 18px",
                border: "1px solid #CBD5E1", textDecoration: "none",
              }}
            >
              Cancel
            </Link>
            <button
              type="submit" disabled={submitting}
              style={{
                background: "#F59E0B", color: "#fff", fontWeight: 600,
                borderRadius: "10px", padding: "8px 20px", border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
              }}
            >
              {submitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DailyAttendanceAdd;