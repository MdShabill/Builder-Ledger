//Path: src/pages/ServiceProvider/ServiceProviderList.tsx
import { useEffect, useState }   from "react";
import { Link, useLocation }     from "react-router-dom";
import { getServiceProviders, deleteServiceProvider }
  from "../../services/serviceProviderService";
import type { ServiceProviderDto } from "../../services/serviceProviderService";
import PageHeader from "../../components/PageHeader";

function ServiceProviderList() {
  const location = useLocation();
  const [records,    setRecords]    = useState<ServiceProviderDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");

  const successMessage =
    (location.state as { success?: string })?.success ?? "";

  useEffect(() => {
    getServiceProviders()
      .then((res) => { setRecords(res.items); setTotalCount(res.totalCount); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this workforce member?")) return;
    try {
      await deleteServiceProvider(id);
      setRecords((prev) => prev.filter((r) => r.serviceProviderId !== id));
      setTotalCount((c) => c - 1);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const formatAddress = (item: ServiceProviderDto) => {
    const parts = [item.addressTypes, item.addressLine1, item.countryName, item.pinCode];
    return parts.filter(Boolean).join(" - ") || "—";
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh" }}>
      <div style={{ padding: "30px" }}>
        <div style={{
          background: "#fff", borderRadius: "18px",
          padding: "25px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
        }}>

          {/* CHANGE 2: old 3-column header replaced by PageHeader */}
          <PageHeader
            title="Contractors"
            addTo="/service-provider/add"
            badge={<span className="badge-pill">Total Contractors <b>{totalCount}</b></span>}
          />

          {/* Messages */}
          {successMessage && (
            <div style={{ color: "#16A34A", marginBottom: "12px", fontWeight: 500 }}>
              {successMessage}
            </div>
          )}
          {error && (
            <div style={{ color: "#DC2626", marginBottom: "12px" }}>{error}</div>
          )}

          {/* Table */}
          {loading ? (
            <p style={{ textAlign: "center", padding: "30px" }}>Loading...</p>
          ) : (
            // CHANGE 3a: className="stack-table"
            <table className="stack-table" style={{ width: "100%", borderCollapse: "collapse", borderRadius: "12px", overflow: "hidden" }}>
              <thead style={{ background: "#1E3A5F", color: "#fff" }}>
                <tr>
                  {["Service Type","Name","Gender","Mobile","Referred By","Address","Action"].map((h) => (
                    <th key={h} style={{ padding: "14px", textAlign: "left", fontSize: "14px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {records.length > 0 ? records.map((item) => (
                  <tr key={item.serviceProviderId}
                    style={{ borderBottom: "1px solid #eee" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#f9fafb")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "")}
                  >
                    {/* CHANGE 3b: data-label on every td */}
                    <td data-label="Service Type" style={{ padding: "12px", fontSize: "16px" }}>{item.serviceTypes}</td>
                    <td data-label="Name"         style={{ padding: "12px", fontSize: "16px" }}>{item.serviceProviderName}</td>
                    <td data-label="Gender"       style={{ padding: "12px", fontSize: "16px" }}>{item.gender}</td>
                    <td data-label="Mobile"       style={{ padding: "12px", fontSize: "16px" }}>{item.mobileNumber}</td>
                    <td data-label="Referred By"  style={{ padding: "12px", fontSize: "16px" }}>{item.referredBy}</td>
                    <td data-label="Address"      style={{ padding: "12px", fontSize: "16px", color: "#64748B" }}>
                      {formatAddress(item)}
                    </td>
                    <td data-label="Action" style={{ padding: "12px", width: "140px" }}>
                      <Link
                        to={`/service-provider/edit/${item.serviceProviderId}`}
                        style={{ color: "#16A34A", fontWeight: 500, textDecoration: "none", marginRight: "8px" }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(item.serviceProviderId)}
                        style={{
                          color: "#DC2626", fontWeight: 500,
                          background: "none", border: "none", cursor: "pointer", padding: 0,
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td data-label="" colSpan={7} style={{ textAlign: "center", padding: "20px", color: "#888" }}>
                      No Contractors members found.
                    </td>
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

export default ServiceProviderList;