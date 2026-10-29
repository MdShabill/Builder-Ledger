import { useEffect, useState }         from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import {
  getServiceProviderById, getSPDropdownData, updateServiceProvider,
} from "../../services/serviceProviderService";
import type { DropdownOption } from "../../services/serviceProviderService";

function ServiceProviderEdit() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const [serviceTypes,  setServiceTypes]  = useState<DropdownOption[]>([]);
  const [addressTypes,  setAddressTypes]  = useState<DropdownOption[]>([]);
  const [countries,     setCountries]     = useState<DropdownOption[]>([]);

  const [name,          setName]          = useState("");
  const [gender,        setGender]        = useState("Male");
  const [dob,           setDob]           = useState("");
  const [mobile,        setMobile]        = useState("");
  const [referredBy,    setReferredBy]    = useState("");
  const [serviceTypeId, setServiceTypeId] = useState("");
  const [showAddress,   setShowAddress]   = useState(false);
  const [addressLine1,  setAddressLine1]  = useState("");
  const [addressTypeId, setAddressTypeId] = useState("");
  const [countryId,     setCountryId]     = useState("");
  const [pinCode,       setPinCode]       = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    Promise.all([getSPDropdownData(), getServiceProviderById(Number(id))])
      .then(([dd, sp]) => {
        setServiceTypes(dd.serviceTypes);
        setAddressTypes(dd.addressTypes);
        setCountries(dd.countries);

        setName(sp.serviceProviderName ?? "");
        setGender(sp.gender ?? "Male");
        setDob(sp.dob ? sp.dob.slice(0, 10) : "");
        setMobile(sp.mobileNumber ?? "");
        setReferredBy(sp.referredBy ?? "");
        setServiceTypeId(String(sp.serviceTypeId));
        setAddressLine1(sp.addressLine1 ?? "");
        setPinCode(sp.pinCode ? String(sp.pinCode) : "");

        if (sp.addressTypeId) setAddressTypeId(String(sp.addressTypeId));
        if (sp.countryId)     setCountryId(String(sp.countryId));

        if (sp.addressLine1 || sp.addressTypes || sp.countryName || sp.pinCode)
          setShowAddress(true);
      })
      .catch((err: Error) => setErrorMessage(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSubmitting(true);
    try {
      await updateServiceProvider(Number(id), {
        serviceProviderName: name,
        serviceTypeId:  Number(serviceTypeId),
        gender,
        dob,
        mobileNumber:   mobile,
        referredBy,
        addressLine1:   addressLine1 || undefined,
        addressTypeId:  addressTypeId ? Number(addressTypeId) : undefined,
        countryId:      countryId     ? Number(countryId)     : undefined,
        pinCode:        pinCode       ? Number(pinCode)       : undefined,
      });
      navigate("/service-provider", { state: { success: "Workforce member updated successfully." } });
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: "10px", padding: "10px",
    fontSize: "14px", border: "1px solid #ddd", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 600, marginBottom: "6px", display: "block",
  };

  if (loading) return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "#fff" }}>Loading...</p>
    </div>
  );

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh", padding: "30px" }}>
      <div style={{
        maxWidth: "900px", margin: "auto", background: "#fff",
        borderRadius: "18px", padding: "30px", boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
      }}>
        <div style={{ textAlign: "center", fontSize: "28px", fontWeight: 600, color: "#1E293B", marginBottom: "25px" }}>
          Edit Contractor
        </div>

        {errorMessage && (
          <div style={{ color: "#c62828", fontWeight: 700, marginBottom: "15px" }}>{errorMessage}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>

            <div>
              <label style={labelStyle}>Contractor Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                maxLength={15} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Service Type</label>
              <select value={serviceTypeId} onChange={(e) => setServiceTypeId(e.target.value)} style={inputStyle}>
                <option value="">-- SELECT --</option>
                {serviceTypes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            <div>
              <label style={labelStyle}>Mobile Number</label>
              <input value={mobile} onChange={(e) => setMobile(e.target.value)}
                maxLength={10} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Referred By</label>
              <input value={referredBy} onChange={(e) => setReferredBy(e.target.value)}
                maxLength={15} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>DOB</label>
              <input type="date" value={dob} onChange={(e) => setDob(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Gender</label>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", paddingTop: "8px" }}>
                {["Male","Female","Transgender","Others"].map((g) => (
                  <label key={g} style={{ fontWeight: 400, cursor: "pointer", display: "flex", gap: "4px" }}>
                    <input type="radio" value={g} checked={gender === g}
                      onChange={() => setGender(g)} />
                    {g}
                  </label>
                ))}
              </div>
            </div>

          </div>

          {/* Address toggle */}
          <div style={{ textAlign: "center", margin: "20px 0 16px" }}>
            <button type="button" onClick={() => setShowAddress(!showAddress)} style={{
              background: "#1E3A5F", color: "#fff", borderRadius: "10px",
              padding: "8px 14px", border: "none", cursor: "pointer",
            }}>
              {showAddress ? "Tap to Hide Address" : "Tap for Address"}
            </button>
          </div>

          {/* Address section */}
          {showAddress && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>
              <div>
                <label style={labelStyle}>Address Type</label>
                <select value={addressTypeId} onChange={(e) => setAddressTypeId(e.target.value)} style={inputStyle}>
                  <option value="">-- Select --</option>
                  {addressTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Country Name</label>
                <select value={countryId} onChange={(e) => setCountryId(e.target.value)} style={inputStyle}>
                  <option value="">-- Select --</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={labelStyle}>Address</label>
                <textarea value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)}
                  style={{ ...inputStyle, height: "70px", resize: "vertical" }} />
              </div>
              <div>
                <label style={labelStyle}>Pin Code</label>
                <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
            <Link to="/service-provider" style={{
              background: "transparent", color: "#64748B", fontWeight: 600,
              borderRadius: "10px", padding: "10px 18px",
              border: "1px solid #CBD5E1", textDecoration: "none",
            }}>
              Cancel
            </Link>
            <button type="submit" disabled={submitting} style={{
              background: "#F59E0B", color: "#fff", fontWeight: 500,
              borderRadius: "10px", padding: "10px 18px", border: "none",
              cursor: submitting ? "not-allowed" : "pointer",
            }}>
              {submitting ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ServiceProviderEdit;