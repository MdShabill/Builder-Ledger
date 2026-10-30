// Path: src/components/SiteAdd.tsx
import { useEffect, useState }     from "react";
import { useNavigate, Link }       from "react-router-dom";
import { getMasterData, getServiceProviders, createSite } from "../services/siteService";
import type { DropdownItem, ProviderApiOption, ProviderOption,  ScopeMasterOption, ScopeStatusOption, ScopeItemDto, } from "../services/siteService";

// ── Checkbox Dropdown Component (existing) ──────────────────────
interface CheckboxGroupProps {
  label: string; options: ProviderOption[];
  selectedIds: number[]; onChange: (ids: number[]) => void;
}

function CheckboxDropdown({ label, options, selectedIds, onChange }: CheckboxGroupProps) {
  const [open, setOpen] = useState(false);
  const toggle = (id: number) =>
    onChange(selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id]);

  return (
    <div style={{ position: "relative", marginBottom: "12px" }}>
      <button type="button" onClick={() => setOpen(!open)} style={{
        width: "100%", textAlign: "left", borderRadius: "10px",
        padding: "8px 12px", height: "40px", fontSize: "14px",
        border: "1px solid #ced4da", background: "#fff", cursor: "pointer",
      }}>
        {label} ({selectedIds.length} selected) ▾
      </button>
      {open && (
        <div style={{
          position: "absolute", zIndex: 1000, background: "#fff",
          border: "1px solid #ddd", borderRadius: "8px", padding: "8px 12px",
          maxHeight: "220px", overflowY: "auto", width: "100%",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}>
          {options.map((o) => (
            <label key={o.id} style={{ display: "flex", gap: "8px", padding: "4px 0", cursor: "pointer", fontSize: "14px" }}>
              <input type="checkbox" checked={selectedIds.includes(o.id)}
                onChange={() => toggle(o.id)} />
              {o.name}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

function SiteAdd() {
  const navigate = useNavigate();

  // Existing state
  const [name,          setName]          = useState("");
  const [contactName, setContactName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [startedDate,   setStartedDate]   = useState(new Date().toISOString().slice(0, 10));
  const [siteStatusId,  setSiteStatusId]  = useState(0);
  const [note,          setNote]          = useState("");
  const [showAddress,   setShowAddress]   = useState(false);
  const [addressLine1,  setAddressLine1]  = useState("");
  const [addressTypeId, setAddressTypeId] = useState(0);
  const [countryId,     setCountryId]     = useState(0);
  const [pinCode,       setPinCode]       = useState("");

  // NEW fields
  const [expectedBudget,     setExpectedBudget]     = useState("");
  const [expectedCompletion, setExpectedCompletion] = useState("");

  // Dropdown data
  const [statuses,      setStatuses]      = useState<DropdownItem[]>([]);
  const [addressTypes,  setAddressTypes]  = useState<DropdownItem[]>([]);
  const [countries,     setCountries]     = useState<DropdownItem[]>([]);
  const [scopeMasters,  setScopeMasters]  = useState<ScopeMasterOption[]>([]);
  const [scopeStatuses, setScopeStatuses] = useState<ScopeStatusOption[]>([]);

  // Service Providers
  const [masonIds,       setMasonIds]       = useState<number[]>([]);
  const [labourIds,      setLabourIds]      = useState<number[]>([]);
  const [electricianIds, setElectricianIds] = useState<number[]>([]);
  const [plumberIds,     setPlumberIds]     = useState<number[]>([]);
  const [painterIds,     setPainterIds]     = useState<number[]>([]);
  const [carpenterIds,   setCarpenterIds]   = useState<number[]>([]);
  const [tilerIds,       setTilerIds]       = useState<number[]>([]);
  const [masons,       setMasons]       = useState<ProviderOption[]>([]);
  const [labours,      setLabours]      = useState<ProviderOption[]>([]);
  const [electricians, setElectricians] = useState<ProviderOption[]>([]);
  const [plumbers,     setPlumbers]     = useState<ProviderOption[]>([]);
  const [painters,     setPainters]     = useState<ProviderOption[]>([]);
  const [carpenters,   setCarpenters]   = useState<ProviderOption[]>([]);
  const [tilers,       setTilers]       = useState<ProviderOption[]>([]);

  // NEW — Scope selection: {scopeMasterId, scopeStatusId}
  const [selectedScopes, setSelectedScopes] = useState<ScopeItemDto[]>([]);

  const [errorMessage, setErrorMessage] = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const normalizeProviderOptions = (
  items: ProviderApiOption[]): ProviderOption[] => items.map((item) => ({
    id: "key" in item ? item.key : item.id,
    name: "value" in item ? item.value : item.name,
  }));

  useEffect(() => { Promise.all([
    getMasterData({ siteStatusData: true, addressTypeData: true, countriesData: true, scopeMastersData: true, scopeStatusesData: true }),
    getServiceProviders()
  ])
    .then(([dd, sp]) => {

      // Master Data
      setStatuses(dd.statuses ?? []);
      setAddressTypes(dd.addressTypes ?? []);
      setCountries(dd.countries ?? []);
      setScopeMasters(dd.scopeMasters ?? []);
      setScopeStatuses(dd.scopeStatuses ?? []);

      // Service Providers
      setMasons(normalizeProviderOptions(sp.masterMasons));
      setElectricians(normalizeProviderOptions(sp.electricians));

      setLabours(sp.labours);
      setPlumbers(sp.plumbers);
      setPainters(sp.painters);
      setCarpenters(sp.carpenters);
      setTilers(sp.tilers);

    })
    .catch((err: Error) => {setErrorMessage(err.message);});
  }, []);

  // Toggle scope selection
  const toggleScope = (scopeMasterId: number) => {
    setSelectedScopes((prev) => {
      const exists = prev.find((s) => s.siteScopeMasterId === scopeMasterId);
      if (exists) return prev.filter((s) => s.siteScopeMasterId !== scopeMasterId);
      // Default status = 1 (Pending)
      return [...prev, { siteScopeMasterId: scopeMasterId, scopeStatusId: 1 }];
    });
  };

  // Change status of a selected scope
  const changeScopeStatus = (scopeMasterId: number, statusId: number) => {
    setSelectedScopes((prev) =>
      prev.map((s) =>
        s.siteScopeMasterId === scopeMasterId
          ? { ...s, scopeStatusId: statusId }
          : s
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { setErrorMessage("Please enter Site Name"); return; }
    if (!siteStatusId) { setErrorMessage("Please select Site Status"); return; }
    setSubmitting(true);
    try {
      await createSite({
        name, contactName, contactNumber, startedDate, siteStatusId, note,
        addressLine1:  addressLine1 || undefined,
        addressTypeId: addressTypeId || undefined,
        countryId:     countryId    || undefined,
        pinCode:       pinCode ? Number(pinCode) : undefined,
        expectedBudget:        expectedBudget    ? Number(expectedBudget)    : undefined,
        expectedCompletionDate: expectedCompletion || undefined,
        selectedMasterMasonIds: masonIds,
        selectedElectricianIds: electricianIds,
        selectedLabourIds:      labourIds,
        selectedPlumberIds:     plumberIds,
        selectedPainterIds:     painterIds,
        selectedCarpenterIds:   carpenterIds,
        selectedTilerIds:       tilerIds,
        selectedScopes,
      });
      navigate("/sites", { state: { success: "Add New Site Successful" } });
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", borderRadius: "10px", padding: "8px 12px",
    height: "40px", fontSize: "14px", border: "1px solid #ddd", boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontWeight: 600, marginBottom: "4px", fontSize: "14px", display: "block",
  };

  //const defaultStatusId = scopeStatuses.find((s) => s.name === "Pending")?.id ?? 1;

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh", padding: "30px" }}>
      <div style={{
        background: "#fff", borderRadius: "20px", padding: "35px",
        maxWidth: "950px", margin: "auto", boxShadow: "0 12px 30px rgba(0,0,0,0.15)",
      }}>
        <h3 style={{ textAlign: "center", fontWeight: 700, color: "#1E293B", marginBottom: "25px" }}>
          Add Site
        </h3>

        {errorMessage && (
          <div style={{
            background: "#fdecea", color: "#c62828", padding: "10px 14px",
            borderRadius: "8px", marginBottom: "15px", textAlign: "center",
          }}>
            <b>{errorMessage}</b>
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* Row 1 — Date + Name */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "16px" }}>
            
            <div>
              <label style={labelStyle}>Site Name</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter site name" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Contact Person</label>
              <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="Enter contact name" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Contact Number</label>
             <input value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} placeholder="Enter contact number" style={inputStyle}/>
            </div>

            <div>
              <label style={labelStyle}>Site Status</label>
              <select value={siteStatusId} onChange={(e) => setSiteStatusId(Number(e.target.value))} style={inputStyle}>
                <option value={0}>-- SELECT STATUS --</option>
                {statuses.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

          </div>

          {/* Row 2 — Status + Note */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "16px" }}>
            
            <div>
              <label style={labelStyle}>Started Date</label>
              <input type="date" value={startedDate} onChange={(e) => setStartedDate(e.target.value)} style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Expected Completion Date</label>
              <input
                type="date" value={expectedCompletion}
                onChange={(e) => setExpectedCompletion(e.target.value)} style={inputStyle}
              />
            </div>            
          </div>

          {/* Row 3 — Budget + Expected Completion Date (NEW) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={labelStyle}>Expected Budget (₹)</label>
              <input
                type="number" value={expectedBudget}
                onChange={(e) => setExpectedBudget(e.target.value)}
                placeholder="e.g. 500000" style={inputStyle}
              />
            </div>

            <div>
              <label style={labelStyle}>Note</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Enter Note" style={inputStyle} />
            </div>  
          </div>

          <hr/>

          {/* Service Provider dropdowns */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
            <CheckboxDropdown label="Masons"       options={masons}       selectedIds={masonIds}       onChange={setMasonIds} />
            <CheckboxDropdown label="Labours"      options={labours}      selectedIds={labourIds}      onChange={setLabourIds} />
            <CheckboxDropdown label="Electricians" options={electricians} selectedIds={electricianIds} onChange={setElectricianIds} />
            <CheckboxDropdown label="Plumbers"     options={plumbers}     selectedIds={plumberIds}     onChange={setPlumberIds} />
            <CheckboxDropdown label="Painters"     options={painters}     selectedIds={painterIds}     onChange={setPainterIds} />
            <CheckboxDropdown label="Carpenters"   options={carpenters}   selectedIds={carpenterIds}   onChange={setCarpenterIds} />
            <CheckboxDropdown label="Tilers"       options={tilers}       selectedIds={tilerIds}       onChange={setTilerIds} />
          </div>

          <hr/>

          {/* NEW — Site Scope Section */}
          <div style={{
            border: "1px solid #e2e8f0", borderRadius: "12px",
            padding: "16px", marginBottom: "20px",
          }}>
            <label style={{ ...labelStyle, marginBottom: "12px", fontSize: "15px" }}>
              Site Work Scope
            </label>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
              {scopeMasters.map((sm) => {
                const selected = selectedScopes.find((s) => s.siteScopeMasterId === sm.id);
                return (
                  <div key={sm.id} style={{
                    border: selected ? "2px solid #F59E0B" : "1px solid #e2e8f0",
                    borderRadius: "8px", padding: "8px 10px",
                    background: selected ? "#FFFBEB" : "#fff",
                  }}>
                    <label style={{ display: "flex", gap: "8px", cursor: "pointer", fontWeight: 500, fontSize: "13px" }}>
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => toggleScope(sm.id)}
                      />
                      {sm.name}
                    </label>

                    {/* Status dropdown — sirf selected scope ke liye */}
                    {selected && (
                      <select
                        value={selected.scopeStatusId}
                        onChange={(e) => changeScopeStatus(sm.id, Number(e.target.value))}
                        style={{
                          width: "100%", marginTop: "6px", borderRadius: "6px",
                          padding: "4px 6px", fontSize: "12px",
                          border: "1px solid #ddd", cursor: "pointer",
                        }}
                      >
                        {scopeStatuses.map((ss) => (
                          <option key={ss.id} value={ss.id}>{ss.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedScopes.length > 0 && (
              <p style={{ fontSize: "12px", color: "#16A34A", marginTop: "10px" }}>
                ✓ {selectedScopes.length} scope(s) selected
              </p>
            )}
          </div>

          <hr/>

          {/* Address toggle */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <button type="button" onClick={() => setShowAddress(!showAddress)} style={{
              background: "#1E3A5F", color: "#fff", borderRadius: "12px",
              padding: "8px 18px", border: "none", cursor: "pointer", fontWeight: 500,
            }}>
              {showAddress ? "Tap to Hide Address" : "Tap for Address"}
            </button>
          </div>

          {showAddress && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <label style={labelStyle}>Address</label>
                <input value={addressLine1} onChange={(e) => setAddressLine1(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>Address Type</label>
                <select value={addressTypeId} onChange={(e) => setAddressTypeId(Number(e.target.value))} style={inputStyle}>
                  <option value={0}>-- Select --</option>
                  {addressTypes.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Country</label>
                <select value={countryId} onChange={(e) => setCountryId(Number(e.target.value))} style={inputStyle}>
                  <option value={0}>-- Select --</option>
                  {countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Pin Code</label>
                <input value={pinCode} onChange={(e) => setPinCode(e.target.value)} style={inputStyle} />
              </div>
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "16px" }}>
            <Link to="/sites" style={{
              borderRadius: "12px", padding: "8px 20px", border: "1px solid #CBD5E1",
              color: "#64748B", fontWeight: 600, textDecoration: "none",
            }}>
              Cancel
            </Link>
            <button type="submit" disabled={submitting} style={{
              background: "#F59E0B", color: "#fff", borderRadius: "12px",
              padding: "8px 20px", border: "none", fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
            }}>
              {submitting ? "Adding..." : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SiteAdd;