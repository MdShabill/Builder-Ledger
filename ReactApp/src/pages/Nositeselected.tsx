function NoSiteSelected() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1E3A5F, #0F172A)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: "20px",
          padding: "44px 48px",
          maxWidth: "560px",
          width: "100%",
          textAlign: "center",
          boxShadow: "0 20px 50px rgba(0,0,0,0.3)",
        }}
      >
        {/* Warning icon */}
        <div
          style={{
            width: "76px",
            height: "76px",
            borderRadius: "50%",
            background: "#FEF3C7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 22px",
          }}
        >
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
        </div>

        <h2 style={{ fontSize: "26px", fontWeight: 700, color: "#1E293B", marginBottom: "10px" }}>
          No Site Selected
        </h2>

        <p style={{ fontSize: "15px", color: "#64748B", marginBottom: "28px", lineHeight: 1.6 }}>
          Please select an active site from the top menu before navigating to this section.
        </p>

        {/* Steps box */}
        <div
          style={{
            background: "#F8FAFC",
            border: "1px solid #E2E8F0",
            borderRadius: "12px",
            padding: "20px 24px",
            textAlign: "left",
          }}
        >
          <p style={{
            fontSize: "11px",
            fontWeight: 700,
            color: "#94A3B8",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "16px",
          }}>
            How to continue
          </p>

          {[
            { num: 1, text: <>Look for the <strong>SITE</strong> dropdown in the top navigation bar</> },
            { num: 2, text: "Select your site from the list" },
            { num: 3, text: <>Click the <span style={{ color: "#F59E0B", fontWeight: 600 }}>Go</span> button to confirm</> },
          ].map((step) => (
            <div key={step.num} style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "12px" }}>
              <div style={{
                width: "24px", height: "24px", minWidth: "24px",
                background: "#1E3A5F",
                borderRadius: "50%",
                display: "flex", alignItems: "center", justifyContent: "center",
                marginTop: "1px",
              }}>
                <span style={{ fontSize: "12px", color: "#fff", fontWeight: 600 }}>{step.num}</span>
              </div>
              <p style={{ fontSize: "14.5px", color: "#475569", margin: 0, lineHeight: 1.5 }}>
                {step.text}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default NoSiteSelected;