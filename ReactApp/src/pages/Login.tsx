import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { login } from "../services/accountService";
import { useAuth } from "../context/Authcontext";
import { useSite } from "../context/Sitecontext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const { setUser } = useAuth();
  const { setSelectedSite } = useSite();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      setLoading(true);
      const userData = await login(email, password);

      setUser(userData);

    setSelectedSite(null); navigate("/home",{replace:true});
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid Email Or Password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Navbar (logo only) ── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 10,
        background: "#fff", borderBottom: "1px solid #e5e7eb",
        padding: "8px 24px", display: "flex", alignItems: "center",
      }}>
        <img src="/UploadedImage/WebSiteLogo.jpg" alt="Builder Ledger" style={{ height: "50px" }} />
      </nav>

      {/* ── Full-viewport background + centered card ── */}
      <div style={{
        flex: 1, minHeight: "100vh",
        backgroundImage: "linear-gradient(rgba(20,40,65,0.75), rgba(20,40,65,0.75)), url('/UploadedImage/Background-Image.jpg')",
        backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat",
        display: "flex", alignItems: "center", justifyContent: "center",
        paddingTop: "56px",
      }}>
        <div style={{
          background: "#fff", borderRadius: "16px", padding: "40px 44px",
          width: "100%", maxWidth: "460px", boxShadow: "0 8px 32px rgba(0,0,0,0.22)",
        }}>
          <h3 style={{ fontWeight: 700, fontSize: "24px", textAlign: "center", color: "#1E293B", marginBottom: "6px" }}>
            Welcome Back
          </h3>
          <p style={{ textAlign: "center", color: "#6b7280", fontSize: "14px", marginBottom: "20px" }}>
            Login to Builder Ledger
          </p>

          {errorMessage && (
            <div style={{
              background: "#fdecea", color: "#c62828", border: "1px solid #f5c6cb",
              borderRadius: "8px", padding: "10px 14px", fontSize: "13px",
              marginBottom: "18px", textAlign: "center",
            }}>
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "6px", color: "#374151" }}>
                Email
              </label>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden" }}>
                <span style={{ background: "#f9fafb", borderRight: "1px solid #d1d5db", padding: "10px 14px", display: "flex", alignItems: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  type="email" required placeholder="zishan123@gmail.com"
                  value={email} onChange={(e) => setEmail(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", padding: "10px 14px", fontSize: "14px", color: "#111827", background: "transparent" }}
                />
              </div>
            </div>

            {/* Password */}
            <div style={{ marginBottom: "18px" }}>
              <label style={{ display: "block", fontWeight: 600, fontSize: "14px", marginBottom: "6px", color: "#374151" }}>
                Password
              </label>
              <div style={{ display: "flex", alignItems: "center", border: "1px solid #d1d5db", borderRadius: "8px", overflow: "hidden" }}>
                <span style={{ background: "#f9fafb", borderRight: "1px solid #d1d5db", padding: "10px 14px", display: "flex", alignItems: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"} required placeholder="••••••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  style={{ flex: 1, border: "none", outline: "none", padding: "10px 14px", fontSize: "14px", color: "#111827", background: "transparent" }}
                />
                <button
                  type="button" onClick={() => setShowPassword(!showPassword)}
                  style={{ background: "transparent", border: "none", padding: "10px 14px", cursor: "pointer", display: "flex", alignItems: "center", color: "#6b7280" }}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit" disabled={loading}
              style={{
                width: "100%", background: loading ? "#fbbf24" : "#F59E0B", color: "#fff",
                fontWeight: 700, fontSize: "15px", border: "none", borderRadius: "8px",
                padding: "12px", cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em", transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = "#d97706"; }}
              onMouseLeave={(e) => { if (!loading) (e.target as HTMLButtonElement).style.background = "#F59E0B"; }}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;