// Path: src/pages/MaterialPurchase/MaterialPurchaseList.tsx
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getMaterialPurchases, getDropdownData, deleteMaterialPurchase } from "../../services/materialPurchaseService";
import type { MaterialPurchaseDto, DropdownOption } from "../../services/materialPurchaseService";
import { useSite } from "../../context/Sitecontext";
import PageHeader from "../../components/PageHeader";

const HEADERS = ["Date", "Supplier", "Supplier Contact", "Brand", "Material", "Unit Price", "Quantity", "Material Cost", "Delivery Charge", "Total Amount", "Action"];
const inputStyle: React.CSSProperties = { boxSizing: "border-box", border: "1px solid #ddd", borderRadius: 8, padding: "8px 10px", fontSize: 14, width: "100%", minWidth: 0 };
const cell: React.CSSProperties = { padding: "12px 10px", textAlign: "left", verticalAlign: "middle", whiteSpace: "nowrap"};
const pill = (v: React.ReactNode) => <span style={{ display: "inline-block", background: "#FEF3C7", color: "#92400E", border: "1px solid #FDE68A", padding: "4px 8px", borderRadius: 8 }}>{v}</span>;
const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

function MaterialPurchaseList() {
  const { selectedSite } = useSite(), siteId = selectedSite?.id ?? 0;
  const successMessage = (useLocation().state as { success?: string })?.success;
  const [records, setRecords] = useState<MaterialPurchaseDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [materials, setMaterials] = useState<DropdownOption[]>([]);
  const [suppliers, setSuppliers] = useState<DropdownOption[]>([]);
  const [brands, setBrands] = useState<DropdownOption[]>([]);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [materialId, setMaterialId] = useState("");
  const [supplierId, setSupplierId] = useState("");
  const [brandId, setBrandId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getDropdownData().then(d => { setMaterials(d.materials); setSuppliers(d.suppliers); setBrands(d.brands); }).catch(() => {});
  }, []);

  const loadData = (from?: string, to?: string, mat?: string, sup?: string, brd?: string) => {
    setLoading(true); setError("");
    getMaterialPurchases(siteId, from || undefined, to || undefined, mat ? Number(mat) : undefined, sup ? Number(sup) : undefined, brd ? Number(brd) : undefined)
      .then(res => { setRecords(res.items); setTotalCount(res.totalCount); })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [siteId]);

  const handleGo = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toLocaleDateString("en-CA");
    if (dateFrom && dateTo && dateFrom > dateTo) return setError("FROM DATE cannot be greater than TO DATE.");
    if ((dateFrom && dateFrom > today) || (dateTo && dateTo > today)) return setError("FROM DATE and TO DATE cannot be in the future.");
    loadData(dateFrom, dateTo, materialId, supplierId, brandId);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Are you sure you want to delete this record?")) return;
    try {
      await deleteMaterialPurchase(siteId, id);
      setRecords(prev => prev.filter(r => r.id !== id));
      setTotalCount(c => Math.max(0, c - 1));
    } catch (err) { setError((err as Error).message); }
  };

  const select = (label: string, value: string, set: (v: string) => void, options: DropdownOption[]) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 145px", minWidth: 0, fontSize: 13, fontWeight: 600 }}>
      {label}
      <select value={value} onChange={e => set(e.target.value)} style={inputStyle}>
        <option value="">-- Select --</option>
        {options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
    </label>
  );

  const dateInput = (label: string, value: string, set: (v: string) => void) => (
    <label style={{ display: "flex", flexDirection: "column", gap: 5, flex: "1 1 145px", minWidth: 0, fontSize: 13, fontWeight: 600 }}>
      {label}<input type="date" value={value} onChange={e => set(e.target.value)} style={inputStyle} />
    </label>
  );

  const deleteButton = (id: number) => (
    <button type="button" onClick={() => handleDelete(id)} style={{ color: "#DC2626", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 7, padding: "7px 12px", cursor: "pointer", fontWeight: 600 }}>Delete</button>
  );

  const field = (label: string, value: React.ReactNode) => (
    <div style={{ minWidth: 0, overflowWrap: "anywhere" }}>
      <div style={{ color: "#64748B", fontSize: 12, marginBottom: 4 }}>{label}</div>
      <div style={{ color: "#12345A", fontSize: 14, fontWeight: 500 }}>{value}</div>
    </div>
  );

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh", padding: "clamp(12px, 3vw, 30px) 0", boxSizing: "border-box" }}>
      <style>{`
        .mpl-filters { display:flex; flex-wrap:wrap; align-items:end; gap:12px; margin:22px 0; }
        .mpl-table th { background:#1E3A5F; color:white; padding:11px 8px; font-size:12px; white-space:normal; }
        .mpl-table tbody tr:nth-child(even) { background:#F8FAFC; }
        .mpl-table tbody tr:hover { background:#EEF2F7; }
        .mpl-mobile { display:none; }
        @media(max-width:650px) {
          .mpl-desktop { display:none !important; }
          .mpl-mobile { display:grid; gap:14px; }
          .mpl-filters > label { flex:1 1 130px !important; }
        }
      `}</style>

      <div style={{ width: "min(1600px, 96%)", margin: "0 auto", boxSizing: "border-box" }}>
        <div style={{ background: "#fff", borderRadius: 16, padding: "clamp(14px, 2.5vw, 28px)", boxShadow: "0 10px 30px rgba(0,0,0,.2)", minWidth: 0 }}>
          {successMessage && <p style={{ color: "#166534", textAlign: "center", fontWeight: 600 }}>{successMessage}</p>}
          <PageHeader title="Material Purchase" addTo="/material/add" badge={<span className="badge-pill">Total Purchase <b>{totalCount}</b></span>} />

          <form onSubmit={handleGo} className="mpl-filters">
            {dateInput("From", dateFrom, setDateFrom)}
            {dateInput("To", dateTo, setDateTo)}
            {select("Material", materialId, setMaterialId, materials)}
            {select("Supplier", supplierId, setSupplierId, suppliers)}
            {select("Brand", brandId, setBrandId, brands)}
            <button type="submit" style={{ background: "#F59E0B", color: "#fff", border: 0, borderRadius: 8, padding: "10px 20px", cursor: "pointer", fontWeight: 600 }}>Go</button>
          </form>

          {error && <p role="alert" style={{ color: "#DC2626", fontWeight: 500 }}>{error}</p>}
          {loading ? <p style={{ textAlign: "center", padding: 30 }}>Loading...</p> : !records.length ? (
            <div style={{ textAlign: "center", padding: 30, fontWeight: 600, color: "#6c757d" }}>🚫 No Record Found</div>
          ) : <>
            <div className="mpl-desktop" style={{ overflowX: "auto", width: "100%", borderRadius: 8, border: "1px solid #E2E8F0" }}>
              <table className="mpl-table" style={{ width: "100%", minWidth: 1000, borderCollapse: "collapse", tableLayout: "auto" }}>
                <thead><tr>{HEADERS.map(h => <th key={h}>{h}</th>)}</tr></thead>
                <tbody>{records.map(r => (
                  <tr key={r.id}>
                    <td style={cell}>{fmt(r.date)}</td><td style={cell}>{r.supplierName}</td><td style={cell}>{r.phoneNumber}</td>
                    <td style={cell}>{r.brandName}</td><td style={cell}>{r.materialName}</td>
                    <td style={cell}>{r.unitPrice.toFixed(2)} / <i>{r.unitOfMeasure}</i></td>
                    <td style={cell}>{r.quantity.toFixed(2)} / <i>{r.unitOfMeasure}</i></td>
                    <td style={cell}>{pill(r.materialCost.toFixed(2))}</td><td style={cell}>{pill(r.deliveryCharge.toFixed(2))}</td>
                    <td style={cell}>{pill(`₹ ${(r.materialCost + r.deliveryCharge).toFixed(2)}`)}</td>
                    <td style={cell}>{deleteButton(r.id)}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>

            <div className="mpl-mobile">
              {records.map(r => (
                <article key={r.id} style={{ border: "1px solid #E2E8F0", borderRadius: 12, padding: 14, background: "#F8FAFC", display: "grid", gap: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <strong style={{ color: "#12345A", fontSize: 15 }}>{r.materialName}</strong>
                    <span style={{ flexShrink: 0, fontSize: 12, color: "#64748B" }}>{fmt(r.date)}</span>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 14 }}>
                    {field("Supplier", r.supplierName)}{field("Contact", r.phoneNumber)}
                    {field("Brand", r.brandName)}{field("Unit Price", <>{r.unitPrice.toFixed(2)} / {r.unitOfMeasure}</>)}
                    {field("Quantity", <>{r.quantity.toFixed(2)} / {r.unitOfMeasure}</>)}{field("Material Cost", pill(r.materialCost.toFixed(2)))}
                    {field("Delivery Charge", pill(r.deliveryCharge.toFixed(2)))}
                    {field("Total Amount", pill(`₹ ${(r.materialCost + r.deliveryCharge).toFixed(2)}`))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "flex-end", borderTop: "1px solid #E2E8F0", paddingTop: 10 }}>{deleteButton(r.id)}</div>
                </article>
              ))}
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

export default MaterialPurchaseList;