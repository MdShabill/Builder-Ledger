// Path: src/pages/MaterialPurchase/MaterialPurchaseAdd.tsx
import { useEffect, useState }  from "react";
import { useNavigate, Link }    from "react-router-dom";
import {
  getDropdownData, getMaterialInfo, addMaterialPurchase,
} from "../../services/materialPurchaseService";
import type { DropdownOption }  from "../../services/materialPurchaseService";
import { useSite }              from "../../context/Sitecontext";

function MaterialPurchaseAdd() {
  const navigate = useNavigate();
  const { selectedSite } = useSite();
  const siteId = selectedSite?.id ?? 0;

  const [suppliers,  setSuppliers]  = useState<DropdownOption[]>([]);
  const [materials,  setMaterials]  = useState<DropdownOption[]>([]);
  const [brands,     setBrands]     = useState<DropdownOption[]>([]);

  const [date,          setDate]          = useState(new Date().toISOString().slice(0, 16));
  const [supplierId,    setSupplierId]    = useState("");
  const [phoneNumber,   setPhoneNumber]   = useState("");
  const [brandId,       setBrandId]       = useState("");
  const [materialId,    setMaterialId]    = useState("");
  const [unitOfMeasure, setUnitOfMeasure] = useState("");
  const [unitPrice,     setUnitPrice]     = useState("");
  const [quantity,      setQuantity]      = useState("");
  const [materialCost,  setMaterialCost]  = useState("");
  const [deliveryCharge,setDeliveryCharge]= useState("0.00");
  const [totalAmount,   setTotalAmount]   = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [submitting,   setSubmitting]   = useState(false);

  useEffect(() => {
    getDropdownData()
      .then((dd) => {
        setSuppliers(dd.suppliers);
        setMaterials(dd.materials);
        setBrands(dd.brands);
      })
      .catch((err: Error) => setErrorMessage(err.message));
  }, []);

  // Mirrors MVC AJAX call on material change — fetches unitPrice + unitOfMeasure
  const handleMaterialChange = async (id: string) => {
    setMaterialId(id);
    setUnitPrice("");
    setUnitOfMeasure("");
    setMaterialCost("");
    setTotalAmount("");

    if (!id) return;

    try {
      const info = await getMaterialInfo(Number(id));
      setUnitPrice(String(info.unitPrice));
      setUnitOfMeasure(info.unitOfMeasure);

      if (quantity) {
        const cost = info.unitPrice * Number(quantity);
        setMaterialCost(cost.toFixed(2));
        const delivery = Number(deliveryCharge) || 0;
        setTotalAmount((cost + delivery).toFixed(2));
      }
    } catch {
      setErrorMessage("Failed to load material info.");
    }
  };

  const updateMaterialCost = (qty: string, price: string) => {
    const cost = (Number(price) || 0) * (Number(qty) || 0);
    setMaterialCost(cost.toFixed(2));
    const delivery = Number(deliveryCharge) || 0;
    setTotalAmount((cost + delivery).toFixed(2));
  };

  const updateTotalAmount = (cost: string, delivery: string) => {
    setTotalAmount(((Number(cost) || 0) + (Number(delivery) || 0)).toFixed(2));
  };

  const validate = (): string | null => {
    if (!materialId || !supplierId || !brandId)
      return "Please provide valid input for all required fields.";
    if (!quantity || Number(quantity) <= 0 || !/^\d+$/.test(quantity))
      return "Quantity must be a positive integer.";
    if (!phoneNumber || phoneNumber.length !== 10 || !/^\d{10}$/.test(phoneNumber))
      return "Supplier Phone Number must be numeric and exactly 10 digits long.";
    if (new Date(date) > new Date())
      return "Date cannot be in the future.";
    if (!materialCost || Number(materialCost) <= 0)
      return "Please provide valid input for all required fields.";
    if (Number(deliveryCharge) < 0)
      return "Delivery Charge must be a non-negative decimal value.";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setErrorMessage(validationError); return; }

    setSubmitting(true);
    try {
      await addMaterialPurchase(siteId, {
        date,
        supplierId:     Number(supplierId),
        phoneNumber,
        brandId:        Number(brandId),
        materialId:     Number(materialId),
        unitOfMeasure,
        unitPrice:      Number(unitPrice),
        quantity:       Number(quantity),
        materialCost:   Number(materialCost),
        deliveryCharge: Number(deliveryCharge),
      });
      navigate("/material", { state: { success: "Added successfully in Material Purchase" } });
    } catch (err) {
      setErrorMessage((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Matches MVC form-row-inline layout exactly
  const rowStyle: React.CSSProperties = {
    display: "flex", alignItems: "center", marginBottom: "15px",
  };
  const labelStyle: React.CSSProperties = {
    width: "180px", fontWeight: 600, color: "#1E293B", flexShrink: 0,
  };
  const inputStyle: React.CSSProperties = {
    flex: 1, borderRadius: "8px", height: "38px",
    padding: "0 10px", border: "1px solid #ddd", fontSize: "14px",
  };
  const readonlyStyle: React.CSSProperties = { ...inputStyle, background: "#e9ecef" };

  return (
    <div style={{ background: "linear-gradient(135deg, #1E3A5F, #0F172A)", minHeight: "100vh", padding: "30px" }}>
      <div style={{
        background: "#fff", borderRadius: "16px", padding: "25px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
      }}>
        <h3 style={{ fontWeight: 700, color: "#1E293B", textAlign: "center", marginBottom: "25px" }}>
          Material Purchase
        </h3>

        {errorMessage && (
          <div style={{ color: "#c62828", textAlign: "center", marginBottom: "15px", fontWeight: 700 }}>
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Row 1 — Date + Supplier */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Date:</label>
              <input type="datetime-local" value={date}
                onChange={(e) => setDate(e.target.value)} style={inputStyle} />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Supplier/Vendor:</label>
              <select value={supplierId} onChange={(e) => setSupplierId(e.target.value)} style={inputStyle}>
                <option value="">-- Select Supplier --</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2 — Supplier Contact + Brand */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Supplier Contact:</label>
              <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)}
                maxLength={10} style={inputStyle} />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Brand:</label>
              <select value={brandId} onChange={(e) => setBrandId(e.target.value)} style={inputStyle}>
                <option value="">-- Select Brand --</option>
                {brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          </div>

          {/* Row 3 — Material + Unit Price */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Material:</label>
              <select value={materialId} onChange={(e) => handleMaterialChange(e.target.value)} style={inputStyle}>
                <option value="">-- Select Material --</option>
                {materials.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Unit Price:</label>
              <input value={unitPrice} readOnly style={readonlyStyle} />
            </div>
          </div>

          {/* Unit of Measure — shown only after material selected */}
          {unitOfMeasure && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
              <div style={rowStyle}>
                <label style={labelStyle}>Unit Of Measure:</label>
                <span style={{ ...readonlyStyle, display: "flex", alignItems: "center", paddingLeft: "10px" }}>
                  {unitOfMeasure}
                </span>
              </div>
            </div>
          )}

          {/* Row 4 — Quantity + Material Cost */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Quantity:</label>
              <input
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  updateMaterialCost(e.target.value, unitPrice);
                }}
                style={inputStyle}
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Material Cost:</label>
              <input value={materialCost} readOnly style={readonlyStyle} />
            </div>
          </div>

          {/* Row 5 — Delivery Cost + Total Amount */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div style={rowStyle}>
              <label style={labelStyle}>Delivery Cost:</label>
              <input
                value={deliveryCharge}
                onChange={(e) => {
                  setDeliveryCharge(e.target.value);
                  updateTotalAmount(materialCost, e.target.value);
                }}
                style={inputStyle}
              />
            </div>
            <div style={rowStyle}>
              <label style={labelStyle}>Total Amount:</label>
              <input value={totalAmount} readOnly style={readonlyStyle} />
            </div>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "16px" }}>
            <Link to="/material" style={{
              background: "transparent", color: "#64748B", fontWeight: 600,
              borderRadius: "10px", padding: "10px 18px",
              border: "1px solid #CBD5E1", textDecoration: "none",
            }}>
              Cancel
            </Link>
            <button type="submit" disabled={submitting} style={{
              background: "#F59E0B", color: "#fff", fontWeight: 600,
              borderRadius: "10px", padding: "10px 30px", border: "none",
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

export default MaterialPurchaseAdd;