// Path: ReactApp/src/pages/Site/SiteDetail.tsx

import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getSite } from "../services/siteService";
import type { SiteEditDto } from "../services/siteService";
import {getDashboardStats, getDashboardScopeItems, } from "../services/dashboardService";
import type {DashboardStatsDto,ScopeSummaryItemDto, } from "../services/dashboardService";
import type { CSSProperties } from "react";
import { API_BASE_URL } from "../constants/urls";

const fmt = (n?: number | null) =>
  n != null ? `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}` : "—";

const fmtDate = (date?: string | null) =>
  date
    ? new Date(date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

const scopeIcon = (id: number) =>
  id === 3 ? "✓" : id === 2 ? "⏳" : id === 4 ? "⏸" : "○";

const scopeColor = (id: number) =>
  id === 3 ? "#16A34A" : id === 2 ? "#F59E0B" : id === 4 ? "#DC2626" : "#94A3B8";

const escapeHtml = (value: unknown) =>
  String(value ?? "—")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const safeFileName = (value: string) =>
  value
    .trim()
    .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100) || "site-report";

const thStyle: CSSProperties = {
  padding: "10px 14px",
  background: "#1E3A5F",
  color: "#fff",
  fontSize: "13px",
  fontWeight: 600,
  textAlign: "left",
  borderRight: "1px solid rgba(255,255,255,0.15)",
};

const tdStyle: CSSProperties = {
  padding: "10px 14px",
  fontSize: "14px",
  color: "#1E293B",
  borderBottom: "1px solid #e2e8f0",
  borderRight: "1px solid #e2e8f0",
  verticalAlign: "top",
};

const tdLabelStyle: CSSProperties = {
  ...tdStyle,
  fontWeight: 600,
  background: "#f8fafc",
  width: "180px",
  color: "#64748B",
};

function SectionHeader({ title }: { title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <div style={{ width: 4, height: 20, background: "#F59E0B", borderRadius: 2 }} />
      <h2
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#1E293B",
          margin: 0,
          textTransform: "uppercase",
          letterSpacing: "0.8px",
        }}
      >
        {title}
      </h2>
    </div>
  );
}

function SiteDetail() {
  const { id } = useParams<{ id: string }>();
  const screenRef = useRef<HTMLDivElement>(null);

  const [site, setSite] = useState<SiteEditDto | null>(null);
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [scopes, setScopes] = useState<ScopeSummaryItemDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const siteId = Number(id);

    if (!id || !Number.isInteger(siteId) || siteId <= 0) {
      setError("Invalid site ID.");
      setLoading(false);
      return;
    }

    Promise.all([
      getSite(siteId),
      getDashboardStats(siteId),
      getDashboardScopeItems(siteId),
    ])
      .then(([siteData, statsData, scopeData]) => {
        if (!active) return;
        setSite(siteData);
        setStats(statsData);
        setScopes(scopeData);
      })
      .catch((err: unknown) => {
        if (active) {
          setError(err instanceof Error ? err.message : "Failed to load site details.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const spent = stats?.totalMaterialSpend ?? 0;
  const budget = stats?.expectedBudget;
  const budgetUtil = stats?.budgetUtilizationPercent;
  const remaining = budget != null ? budget - spent : null;

  const daysActive = site?.startedDate
    ? Math.max(
        0,
        Math.floor((Date.now() - new Date(site.startedDate).getTime()) / 86400000)
      )
    : null;

  const address =
    [
      site?.addressTypes,
      site?.addressLine1,
      site?.countryName,
      site?.pinCode,
    ]
      .filter(Boolean)
      .join(" · ") || "—";

  const contactName = site?.contactName ?? "—";
  const contactNumber = site?.contactNumber ?? "—";
  const completedCount = scopes.filter((s) => s.scopeStatusId === 3).length;

  const buildReportHTML = (): string => {
    const generatedDate = fmtDate(new Date().toISOString());
    const progress = Math.min(100, Math.max(0, budgetUtil ?? 0));
    const progressColor =
      progress >= 100 ? "#DC2626" : progress >= 70 ? "#F59E0B" : "#16A34A";

    const financialCard = (
      label: string,
      value: string,
      sub: string,
      color: string,
      bg: string,
      border: string
    ) => `
      <div style="flex:1;min-width:0;background:${bg};border:1px solid ${border};border-radius:8px;padding:16px;text-align:center;box-sizing:border-box;">
        <p style="margin:0 0 8px;font-size:10px;color:#64748B;font-weight:600;text-transform:uppercase;">${escapeHtml(label)}</p>
        <p style="margin:0 0 5px;font-size:20px;font-weight:800;color:${color};">${escapeHtml(value)}</p>
        <p style="margin:0;font-size:10px;color:#94A3B8;">${escapeHtml(sub)}</p>
      </div>`;

    const cards = [
      financialCard("Expected Budget", fmt(budget), "Total budget allocated", "#1E3A5F", "#EFF6FF", "#BFDBFE"),
      financialCard(
        "Amount Spent",
        fmt(spent),
        budgetUtil != null ? `${budgetUtil.toFixed(1)}% of budget used` : "All-time material cost",
        budget != null && spent > budget ? "#DC2626" : "#1E293B",
        budget != null && spent > budget ? "#FEF2F2" : "#F0FDF4",
        budget != null && spent > budget ? "#FECACA" : "#BBF7D0"
      ),
      financialCard(
        remaining != null && remaining < 0 ? "Over Budget" : "Remaining Amount",
        remaining != null ? fmt(Math.abs(remaining)) : "—",
        remaining != null && remaining < 0 ? "Exceeded budget" : "Budget balance",
        remaining != null && remaining < 0 ? "#DC2626" : "#16A34A",
        remaining != null && remaining < 0 ? "#FEF2F2" : "#F0FDF4",
        remaining != null && remaining < 0 ? "#FECACA" : "#BBF7D0"
      ),
    ].join("");

    const sectionHeader = (title: string) => `
      <div style="display:flex;align-items:center;gap:10px;margin:0 0 14px;page-break-after:avoid;">
        <div style="width:4px;height:18px;background:#F59E0B;border-radius:2px;"></div>
        <h2 style="margin:0;font-size:13px;color:#1E293B;text-transform:uppercase;letter-spacing:.8px;">
          ${escapeHtml(title)}
        </h2>
      </div>`;

    const scopeRows = scopes
      .map(
        (scope, index) => `
          <tr style="background:${index % 2 === 0 ? "#fff" : "#f8fafc"};page-break-inside:avoid;">
            <td style="padding:8px;border:1px solid #e2e8f0;text-align:center;">${index + 1}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;font-weight:600;overflow-wrap:anywhere;">${escapeHtml(scope.scopeName)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;color:${scopeColor(scope.scopeStatusId)};font-weight:600;">${escapeHtml(`${scopeIcon(scope.scopeStatusId)} ${scope.statusName ?? "—"}`)}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(fmtDate(scope.completedDate))}</td>
            <td style="padding:8px;border:1px solid #e2e8f0;overflow-wrap:anywhere;">${escapeHtml(scope.remarks || "—")}</td>
          </tr>`
      )
      .join("");

    return `
      <div style="background:#1E3A5F;padding:24px 32px;display:flex;justify-content:space-between;align-items:center;color:#fff;">
        <div style="display:flex;align-items:center;gap:14px;">
          <div style="width:48px;height:48px;background:#F59E0B;border-radius:8px;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px;color:#1E3A5F;">BL</div>
          <div>
            <p style="font-weight:800;font-size:17px;margin:0;">BUILDER LEDGER</p>
            <p style="color:#94A3B8;font-size:10px;margin:0;letter-spacing:1px;">CONSTRUCTION MANAGEMENT</p>
          </div>
        </div>
        <div style="text-align:right;">
          <p style="color:#F59E0B;font-weight:700;font-size:15px;margin:0 0 4px;">SITE REPORT</p>
          <p style="color:#94A3B8;font-size:11px;margin:0;">Generated: ${escapeHtml(generatedDate)}</p>
          <p style="color:#94A3B8;font-size:11px;margin:0;">Site ID: #${escapeHtml(String(id).padStart(3, "0"))}</p>
        </div>
      </div>
      <div style="height:4px;background:#F59E0B;"></div>
      <div style="padding:28px 32px;background:#fff;">
        <section style="margin-bottom:24px;page-break-inside:avoid;">
          ${sectionHeader("Section 1 — Site Overview")}
          <table style="width:100%;border-collapse:collapse;">
            <tr><td style="width:100px;padding:8px 0;font-weight:600;">Site:</td><td style="padding:8px 0;"><b>${escapeHtml(site?.name)}</b><br/><span style="color:#64748B;">${escapeHtml(address)}</span></td></tr>
            <tr><td style="padding:8px 0;font-weight:600;">Contact:</td><td style="padding:8px 0;"><b>${escapeHtml(contactName)}</b><br/><span style="color:#64748B;">${escapeHtml(contactNumber)}</span></td></tr>
          </table>
        </section>
        <hr style="border:0;border-top:1px solid #e2e8f0;margin-bottom:24px;"/>
        <section style="margin-bottom:24px;page-break-inside:avoid;">
          ${sectionHeader("Section 2 — Financial Summary")}
          <div style="display:flex;gap:12px;width:100%;margin-bottom:10px;">${cards}</div>
          ${
            budgetUtil != null
              ? `<div style="height:5px;background:#e2e8f0;border-radius:3px;overflow:hidden;"><div style="height:100%;width:${progress}%;background:${progressColor};"></div></div><p style="font-size:11px;color:#94A3B8;">Budget utilization: ${budgetUtil.toFixed(1)}%</p>`
              : ""
          }
        </section>
        ${
          scopes.length
            ? `<section style="margin-bottom:16px;">
                ${sectionHeader("Section 3 — Work Scope")}
                <p style="font-size:11px;color:#64748B;">${completedCount}/${scopes.length} Complete</p>
                <table style="width:100%;border-collapse:collapse;table-layout:fixed;">
                  <thead style="display:table-header-group;background:#1E3A5F;color:#fff;">
                    <tr>${["#", "Work", "Status", "Completed Date", "Remarks"]
                      .map((h) => `<th style="padding:10px;text-align:left;font-size:11px;">${h}</th>`)
                      .join("")}</tr>
                  </thead>
                  <tbody>${scopeRows}</tbody>
                </table>
              </section>`
            : ""
        }
      </div>
      <div style="background:#f8fafc;border-top:2px solid #F59E0B;padding:14px 32px;display:flex;justify-content:space-between;gap:20px;">
        <p style="margin:0;font-size:11px;color:#94A3B8;">BuilderLedger © ${new Date().getFullYear()} · Construction Management Made Simple</p>
        <p style="margin:0;font-size:11px;color:#94A3B8;">System generated report · ${escapeHtml(site?.name)}</p>
      </div>`;
  };

  const handlePrint = () => {
    if (!site) return;

    document.querySelector("[data-site-print-frame]")?.remove();

    const frame = document.createElement("iframe");
    frame.setAttribute("data-site-print-frame", "true");
    frame.title = "Site Report Print";
    Object.assign(frame.style, {
      position: "fixed",
      left: "-10000px",
      top: "0",
      width: "800px",
      height: "1000px",
      border: "0",
    });

    document.body.appendChild(frame);

    const printDocument = frame.contentDocument;
    const printWindow = frame.contentWindow;

    if (!printDocument || !printWindow) {
      frame.remove();
      return;
    }

    printDocument.open();
    printDocument.write(`<!DOCTYPE html>
      <html><head><meta charset="utf-8"/>
      <title>${escapeHtml(`Site Report - ${site.name ?? ""}`)}</title>
      <style>
        *{box-sizing:border-box}
        html,body{margin:0;padding:0;width:100%;font-family:Arial,sans-serif;color:#1E293B}
        table{max-width:100%}
        tr{page-break-inside:avoid;break-inside:avoid}
        thead{display:table-header-group}
        @page{size:A4 portrait;margin:10mm}
        @media print{
          *{-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}
        }
      </style></head><body>${buildReportHTML()}</body></html>`);
    printDocument.close();

    let cleaned = false;
    const cleanup = () => {
      if (cleaned) return;
      cleaned = true;
      printWindow.removeEventListener("afterprint", cleanup);
      frame.remove();
    };

    printWindow.addEventListener("afterprint", cleanup);
    frame.onload = () => {
      try {
        printWindow.focus();
        printWindow.print();
      } catch (err) {
        console.error("Failed to print Site Detail report:", err);
        cleanup();
      }
    };
  };

  const handleDownloadPDF = async () => {
    if (!site || pdfLoading) return;

    setPdfLoading(true);

    try {
      const fileName = `site-report-${safeFileName(site.name ?? `site-${id}`)}.pdf`;
      const response = await fetch(`${API_BASE_URL}/SiteReportAPI/generate-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: buildReportHTML(), fileName }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        let message = responseText || "Failed to generate PDF.";

        try {
          const data: unknown = JSON.parse(responseText);
          if (data && typeof data === "object" && "message" in data) {
            const apiMessage = (data as { message?: unknown }).message;
            if (typeof apiMessage === "string") message = apiMessage;
          }
        } catch {
          // The response was not JSON. Use its text as the error message.
        }

        throw new Error(message);
      }

      const blob = await response.blob();
      if (!blob.size) throw new Error("The server returned an empty PDF.");

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert(err instanceof Error ? err.message : "Unable to generate PDF.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={pageBackground}>
        <p style={{ color: "#fff", fontSize: 18 }}>Loading...</p>
      </div>
    );
  }

  if (error || !site) {
    return (
      <div style={{ padding: 40, textAlign: "center" }}>
        <p style={{ color: "#DC2626", marginBottom: 16 }}>
          {error || "Site details not found."}
        </p>
        <Link to="/sites" style={{ color: "#1E3A5F" }}>
          ← Back to Site List
        </Link>
      </div>
    );
  }

  const overviewRows = [
    { label: "Site Name", value: site.name ?? "—" },
    { label: "Contact Person", value: contactName },
    { label: "Contact Number", value: contactNumber },
    { label: "Address", value: address },
  ];

  const financialCards = [
    {
      label: "Expected Budget",
      value: fmt(budget),
      sub: "Total budget allocated",
      color: "#1E3A5F",
      bg: "#EFF6FF",
      border: "#BFDBFE",
    },
    {
      label: "Amount Spent",
      value: fmt(spent),
      sub: budgetUtil != null ? `${budgetUtil.toFixed(1)}% of budget used` : "All-time material cost",
      color: budget != null && spent > budget ? "#DC2626" : "#1E293B",
      bg: budget != null && spent > budget ? "#FEF2F2" : "#F0FDF4",
      border: budget != null && spent > budget ? "#FECACA" : "#BBF7D0",
    },
    {
      label: remaining != null && remaining < 0 ? "Over Budget" : "Remaining Amount",
      value: remaining != null ? fmt(Math.abs(remaining)) : "—",
      sub: remaining != null && remaining < 0 ? "Exceeded budget" : "Budget balance",
      color: remaining != null && remaining < 0 ? "#DC2626" : "#16A34A",
      bg: remaining != null && remaining < 0 ? "#FEF2F2" : "#F0FDF4",
      border: remaining != null && remaining < 0 ? "#FECACA" : "#BBF7D0",
    },
  ];

  return (
    <div style={{ ...pageBackground, padding: "30px 24px" }}>
      <div
        style={{
          maxWidth: 860,
          margin: "0 auto 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <Link to="/sites" style={{ color: "#fff", textDecoration: "none", fontSize: 14 }}>
          ← Back to Site List
        </Link>

        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={handlePrint} style={actionButton("#1E3A5F")}>
            🖨 Print
          </button>
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            style={actionButton(pdfLoading ? "#d4920a" : "#F59E0B")}
          >
            {pdfLoading ? "⏳ Generating..." : "⬇ Download PDF"}
          </button>
        </div>
      </div>

      <div
        ref={screenRef}
        style={{
          maxWidth: 860,
          margin: "0 auto",
          background: "#fff",
          borderRadius: 16,
          boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
          overflow: "hidden",
          fontFamily: "'Outfit', 'Segoe UI', sans-serif",
        }}
      >
        <div
          style={{
            background: "#1E3A5F",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div
              style={{
                width: 52,
                height: 52,
                background: "#F59E0B",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: 20,
                color: "#1E3A5F",
              }}
            >
              BL
            </div>
            <div>
              <p style={{ color: "#fff", fontWeight: 800, fontSize: 18, margin: 0 }}>
                BUILDER LEDGER
              </p>
              <p style={{ color: "#94A3B8", fontSize: 11, margin: 0, letterSpacing: 1 }}>
                CONSTRUCTION MANAGEMENT
              </p>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <p style={{ color: "#F59E0B", fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>
              SITE REPORT
            </p>
            <p style={{ color: "#94A3B8", fontSize: 12, margin: "0 0 2px" }}>
              Generated: {fmtDate(new Date().toISOString())}
            </p>
            <p style={{ color: "#94A3B8", fontSize: 12, margin: 0 }}>
              Site ID: #{String(id).padStart(3, "0")}
            </p>
          </div>
        </div>

        <div style={{ height: 4, background: "#F59E0B" }} />

        <div style={{ padding: 32 }}>
          <div style={{ marginBottom: 28 }}>
            <SectionHeader title="Section 1 — Site Overview" />
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0" }}>
              <tbody>
                {overviewRows.map((row, index) => (
                  <tr key={row.label}>
                    <td
                      style={{
                        ...tdLabelStyle,
                        borderBottom: index === overviewRows.length - 1 ? "none" : tdStyle.borderBottom,
                      }}
                    >
                      {row.label}
                    </td>
                    <td
                      style={{
                        ...tdStyle,
                        borderRight: "none",
                        borderBottom: index === overviewRows.length - 1 ? "none" : tdStyle.borderBottom,
                      }}
                    >
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginBottom: 28 }}>
            <SectionHeader title="Section 2 — Timeline & Status" />
            <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0" }}>
              <thead>
                <tr>
                  {["Status ID", "Started Date", "Expected Completion", "Days Active"].map((heading) => (
                    <th key={heading} style={thStyle}>{heading}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ ...tdStyle, fontWeight: 600 }}>{site.siteStatusId ?? "—"}</td>
                  <td style={tdStyle}>{fmtDate(site.startedDate)}</td>
                  <td style={tdStyle}>{fmtDate(site.expectedCompletionDate)}</td>
                  <td style={{ ...tdStyle, borderRight: "none", fontWeight: 700 }}>
                    {daysActive != null ? `${daysActive} days` : "—"}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {budget != null && (
            <div style={{ marginBottom: 28 }}>
              <SectionHeader title="Section 3 — Financial Summary" />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 12,
                }}
              >
                {financialCards.map((card) => (
                  <div
                    key={card.label}
                    style={{
                      background: card.bg,
                      border: `1px solid ${card.border}`,
                      borderRadius: 10,
                      padding: "18px 20px",
                      textAlign: "center",
                    }}
                  >
                    <p style={{ fontSize: 11, color: "#64748B", fontWeight: 600, margin: "0 0 8px" }}>
                      {card.label}
                    </p>
                    <p style={{ fontSize: 22, fontWeight: 800, color: card.color, margin: "0 0 6px" }}>
                      {card.value}
                    </p>
                    <p style={{ fontSize: 11, color: "#94A3B8", margin: 0 }}>{card.sub}</p>
                  </div>
                ))}
              </div>

              {budgetUtil != null && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ background: "#e2e8f0", height: 6, borderRadius: 3, overflow: "hidden" }}>
                    <div
                      style={{
                        height: "100%",
                        borderRadius: 3,
                        background: budgetUtil >= 100 ? "#DC2626" : budgetUtil >= 70 ? "#F59E0B" : "#16A34A",
                        width: `${Math.min(100, Math.max(0, budgetUtil))}%`,
                      }}
                    />
                  </div>
                  <p style={{ fontSize: 11, color: "#94A3B8", marginTop: 4 }}>
                    Budget utilization: {budgetUtil.toFixed(1)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {scopes.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                <div style={{ width: 4, height: 20, background: "#F59E0B", borderRadius: 2 }} />
                <h2
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#1E293B",
                    margin: 0,
                    textTransform: "uppercase",
                    letterSpacing: "0.8px",
                  }}
                >
                  Section 4 — Work Scope
                </h2>
                <span
                  style={{
                    background: "#F59E0B",
                    color: "#1E3A5F",
                    padding: "2px 10px",
                    borderRadius: 20,
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  {completedCount}/{scopes.length} Complete
                </span>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", border: "1px solid #e2e8f0" }}>
                  <thead>
                    <tr>
                      {["#", "Work", "Status", "Completed Date", "Remarks"].map((heading) => (
                        <th
                          key={heading}
                          style={{
                            ...thStyle,
                            textAlign: heading === "#" ? "center" : "left",
                            borderRight: heading === "Remarks" ? "none" : thStyle.borderRight,
                          }}
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {scopes.map((scope, index) => (
                      <tr key={scope.id} style={{ background: index % 2 === 0 ? "#fff" : "#f8fafc" }}>
                        <td style={{ ...tdStyle, textAlign: "center", color: "#94A3B8" }}>
                          {index + 1}
                        </td>
                        <td style={{ ...tdStyle, fontWeight: 600 }}>{scope.scopeName}</td>
                        <td style={tdStyle}>
                          <span style={{ color: scopeColor(scope.scopeStatusId), fontWeight: 600 }}>
                            {scopeIcon(scope.scopeStatusId)} {scope.statusName ?? "—"}
                          </span>
                        </td>
                        <td style={{ ...tdStyle, color: "#64748B" }}>
                          {fmtDate(scope.completedDate)}
                        </td>
                        <td style={{ ...tdStyle, color: "#64748B", borderRight: "none" }}>
                          {scope.remarks || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div
          style={{
            background: "#f8fafc",
            borderTop: "2px solid #F59E0B",
            padding: "16px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
            BuilderLedger © {new Date().getFullYear()} · Construction Management Made Simple
          </p>
          <p style={{ fontSize: 12, color: "#94A3B8", margin: 0 }}>
            System generated report · {site.name}
          </p>
        </div>
      </div>
    </div>
  );
}

const pageBackground: CSSProperties = {
  background: "linear-gradient(135deg, #1E3A5F, #0F172A)",
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
};

const actionButton = (background: string): CSSProperties => ({
  background,
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.3)",
  borderRadius: 8,
  padding: "8px 18px",
  cursor: "pointer",
  fontSize: 14,
  fontWeight: 600,
});

export default SiteDetail;