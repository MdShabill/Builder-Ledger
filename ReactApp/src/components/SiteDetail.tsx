// Path: src/pages/Site/SiteDetail.tsx

import { useEffect, useRef, useState } from "react";

import { useParams, Link } from "react-router-dom";

import { getSite } from "../services/siteService";

import { getDashboardStats, getDashboardScopeItems, } from "../services/dashboardService";

import type { SiteEditDto } from "../services/siteService";

import type { DashboardStatsDto, ScopeSummaryItemDto, } from "../services/dashboardService";

import type { CSSProperties } from "react";

import { API_BASE_URL } from "../constants/urls";

function SiteDetail() {
  const { id } = useParams();

  const screenRef = useRef<HTMLDivElement>(null);

  const [site, setSite] = useState<SiteEditDto | null>(null);
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [scopes, setScopes] = useState<ScopeSummaryItemDto[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [pdfLoading, setPdfLoading] = useState(false);

  // =========================================================
  // LOAD SITE DATA
  // =========================================================

  useEffect(() => {
    const siteId = Number(id);

    if (!Number.isFinite(siteId)) {
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
        setSite(siteData);
        setStats(statsData);
        setScopes(scopeData);
      })
      .catch((err: unknown) => {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load site details."
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  // =========================================================
  // HELPERS
  // =========================================================

  const fmt = (n?: number | null) => {
    return n != null
      ? "₹" +
          n.toLocaleString("en-IN", {
            maximumFractionDigits: 0,
          })
      : "—";
  };

  const fmtDate = (d?: string | null) => {
    return d
      ? new Date(d).toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })
      : "—";
  };

  const statusColor = (status?: string) => {
    if (status === "Completed") return "#16A34A";
    if (status === "Partially Completed") return "#3B82F6";
    if (status === "On Hold") return "#DC2626";
    if (status === "Planned") return "#F59E0B";

    return "#64748B";
  };

  const scopeIcon = (statusId: number) => {
    if (statusId === 3) return "✓";
    if (statusId === 2) return "⏳";
    if (statusId === 4) return "⏸";

    return "○";
  };

  const scopeColor = (statusId: number) => {
    if (statusId === 3) return "#16A34A";
    if (statusId === 2) return "#F59E0B";
    if (statusId === 4) return "#DC2626";

    return "#94A3B8";
  };

  // =========================================================
  // ESCAPE DATA BEFORE INSERTING INTO REPORT HTML
  // =========================================================

  const escapeHtml = (value: unknown) => {
    return String(value ?? "—")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const getSafeFileName = (value: string) => {
    return (
      value
        .trim()
        .replace(/[<>:"/\\|?*\x00-\x1F]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 100) || "site-report"
    );
  };

  // =========================================================
  // CALCULATED VALUES
  // =========================================================

  const daysActive = site?.startedDate
    ? Math.floor(
        (Date.now() -
          new Date(site.startedDate).getTime()) /
          86400000
      )
    : null;

  const budgetUtil = stats?.budgetUtilizationPercent;

  const spent = stats?.totalMaterialSpend ?? 0;

  const budget = stats?.expectedBudget;

  const remaining =
    budget != null
      ? budget - spent
      : null;

  // These fields exist in the API response,
  // although they are not currently represented
  // directly in SiteEditDto.

  const address = [
    (site as any)?.addressTypes,
    site?.addressLine1,
    site?.countryName,
    site?.pinCode,
  ]
    .filter(Boolean)
    .join(" · ") || "—";

  const contactName =
    (site as any)?.contactName ?? "—";

  const contactNumber =
    (site as any)?.contactNumber ?? "—";

  // =========================================================
  // BUILD REPORT HTML
  // =========================================================

  const buildReportHTML = (): string => {
    const generatedDate =
      new Date().toLocaleDateString(
        "en-GB",
        {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }
      );

    const completedCount = scopes.filter(
      (s) => s.scopeStatusId === 3
    ).length;

    const progressWidth = Math.min(
      100,
      budgetUtil ?? 0
    );

    const progressColor =
      (budgetUtil ?? 0) >= 100
        ? "#DC2626"
        : (budgetUtil ?? 0) >= 70
        ? "#F59E0B"
        : "#16A34A";

    // =======================================================
    // FINANCIAL CARD BUILDER
    // =======================================================

    const card = (
      label: string,
      value: string,
      sub: string,
      color: string,
      bg: string,
      border: string
    ) => `
      <div
        style="
          flex:1;
          min-width:0;
          background:${bg};
          border:1px solid ${border};
          border-radius:8px;
          padding:16px 20px;
          text-align:center;
          box-sizing:border-box;
        "
      >
        <p
          style="
            margin:0 0 8px 0;
            font-size:10px;
            color:#64748B;
            font-weight:600;
            text-transform:uppercase;
            letter-spacing:0.7px;
          "
        >
          ${escapeHtml(label)}
        </p>

        <p
          style="
            margin:0 0 5px 0;
            font-size:20px;
            font-weight:800;
            color:${color};
          "
        >
          ${escapeHtml(value)}
        </p>

        <p
          style="
            margin:0;
            font-size:10px;
            color:#94A3B8;
          "
        >
          ${escapeHtml(sub)}
        </p>
      </div>
    `;

    const b1 = card(
      "Expected Budget",
      fmt(budget),
      "Total budget allocated",
      "#1E3A5F",
      "#EFF6FF",
      "#BFDBFE"
    );

    const b2 = card(
      "Amount Spent",
      fmt(spent),
      budgetUtil != null
        ? `${budgetUtil.toFixed(1)}% of budget used`
        : "All-time material cost",
      spent > (budget ?? Infinity)
        ? "#DC2626"
        : "#1E293B",
      spent > (budget ?? Infinity)
        ? "#FEF2F2"
        : "#F0FDF4",
      spent > (budget ?? Infinity)
        ? "#FECACA"
        : "#BBF7D0"
    );

    const b3 = card(
      remaining != null && remaining < 0
        ? "Over Budget"
        : "Remaining Amount",
      remaining != null
        ? fmt(Math.abs(remaining))
        : "—",
      remaining != null && remaining < 0
        ? "Exceeded budget"
        : "Budget balance",
      remaining != null && remaining < 0
        ? "#DC2626"
        : "#16A34A",
      remaining != null && remaining < 0
        ? "#FEF2F2"
        : "#F0FDF4",
      remaining != null && remaining < 0
        ? "#FECACA"
        : "#BBF7D0"
    );

    // =======================================================
    // REPORT SECTION HEADER
    // =======================================================

    const reportSectionHeader = (
      title: string
    ) => `
      <div
        style="
          display:flex;
          align-items:center;
          gap:10px;
          margin:0 0 14px 0;
          page-break-after:avoid;
          break-after:avoid;
        "
      >
        <div
          style="
            width:4px;
            height:18px;
            background:#F59E0B;
            border-radius:2px;
            flex-shrink:0;
          "
        ></div>

        <h2
          style="
            margin:0;
            font-size:13px;
            font-weight:700;
            color:#1E293B;
            text-transform:uppercase;
            letter-spacing:0.8px;
          "
        >
          ${escapeHtml(title)}
        </h2>
      </div>
    `;

    // =======================================================
    // WORK SCOPE ROWS
    // =======================================================

    const scopeRows = scopes
      .map(
        (scope, i) => `
          <tr
            style="
              background:${
                i % 2 === 0
                  ? "#ffffff"
                  : "#f8fafc"
              };
              page-break-inside:avoid;
              break-inside:avoid;
            "
          >
            <td
              style="
                padding:8px 10px;
                width:40px;
                text-align:center;
                vertical-align:top;
                color:#94A3B8;
                font-size:12px;
                border-bottom:1px solid #e2e8f0;
                border-right:1px solid #e2e8f0;
              "
            >
              ${i + 1}
            </td>

            <td
              style="
                padding:8px 10px;
                vertical-align:top;
                color:#1E293B;
                font-size:12px;
                font-weight:600;
                border-bottom:1px solid #e2e8f0;
                border-right:1px solid #e2e8f0;
                overflow-wrap:anywhere;
                word-break:break-word;
              "
            >
              ${escapeHtml(scope.scopeName)}
            </td>

            <td
              style="
                padding:8px 10px;
                vertical-align:top;
                color:${scopeColor(
                  scope.scopeStatusId
                )};
                font-size:12px;
                font-weight:600;
                border-bottom:1px solid #e2e8f0;
                border-right:1px solid #e2e8f0;
                overflow-wrap:anywhere;
                word-break:break-word;
              "
            >
              ${escapeHtml(
                `${scopeIcon(
                  scope.scopeStatusId
                )} ${scope.statusName ?? "—"}`
              )}
            </td>

            <td
              style="
                padding:8px 10px;
                vertical-align:top;
                color:#64748B;
                font-size:12px;
                border-bottom:1px solid #e2e8f0;
                border-right:1px solid #e2e8f0;
              "
            >
              ${
                scope.completedDate
                  ? escapeHtml(
                      new Date(
                        scope.completedDate
                      ).toLocaleDateString(
                        "en-GB",
                        {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        }
                      )
                    )
                  : "—"
              }
            </td>

            <td
              style="
                padding:8px 10px;
                vertical-align:top;
                color:#64748B;
                font-size:12px;
                border-bottom:1px solid #e2e8f0;
                overflow-wrap:anywhere;
                word-break:break-word;
              "
            >
              ${escapeHtml(
                scope.remarks || "—"
              )}
            </td>
          </tr>
        `
      )
      .join("");

    // =======================================================
    // COMPLETE PRINT/PDF REPORT
    // =======================================================

    return `
      <!-- REPORT HEADER -->

      <div
        style="
          width:100%;
          box-sizing:border-box;
          background:#1E3A5F;
          padding:24px 32px;
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:20px;
        "
      >
        <div
          style="
            display:flex;
            align-items:center;
            gap:14px;
          "
        >
          <div
            style="
              width:48px;
              height:48px;
              background:#F59E0B;
              border-radius:8px;
              display:flex;
              align-items:center;
              justify-content:center;
              font-weight:900;
              font-size:18px;
              color:#1E3A5F;
              flex-shrink:0;
            "
          >
            BL
          </div>

          <div>
            <p
              style="
                color:#ffffff;
                font-weight:800;
                font-size:17px;
                margin:0;
                letter-spacing:0.5px;
              "
            >
              BUILDER LEDGER
            </p>

            <p
              style="
                color:#94A3B8;
                font-size:10px;
                margin:0;
                letter-spacing:1px;
              "
            >
              CONSTRUCTION MANAGEMENT
            </p>
          </div>
        </div>

        <div style="text-align:right;">
          <p
            style="
              color:#F59E0B;
              font-weight:700;
              font-size:15px;
              margin:0 0 4px 0;
              letter-spacing:1px;
            "
          >
            SITE REPORT
          </p>

          <p
            style="
              color:#94A3B8;
              font-size:11px;
              margin:0 0 2px 0;
            "
          >
            Generated:
            ${escapeHtml(generatedDate)}
          </p>

          <p
            style="
              color:#94A3B8;
              font-size:11px;
              margin:0;
            "
          >
            Site ID: #
            ${escapeHtml(
              String(id).padStart(3, "0")
            )}
          </p>
        </div>
      </div>

      <!-- HEADER AMBER LINE -->

      <div
        style="
          height:4px;
          background:#F59E0B;
        "
      ></div>

      <!-- REPORT CONTENT -->

      <div
        style="
          width:100%;
          box-sizing:border-box;
          padding:28px 32px;
          background:#ffffff;
        "
      >

        <!-- SECTION 1 -->

        <div
          class="report-section"
          style="
            margin-bottom:24px;
            page-break-inside:avoid;
            break-inside:avoid;
          "
        >
          ${reportSectionHeader(
            "Section 1 — Site Overview"
          )}

          <table
            style="
              width:100%;
              border-collapse:collapse;
              border:none;
            "
          >
            <tbody>

              <tr>
                <td
                  style="
                    width:90px;
                    padding:5px 0;
                    vertical-align:top;
                    font-size:14px;
                    font-weight:500;
                    color:#1E293B;
                  "
                >
                  Site:
                </td>

                <td
                  style="
                    padding:5px 0;
                    vertical-align:top;
                  "
                >
                  <span
                    style="
                      display:inline-block;
                      font-size:14px;
                      font-weight:700;
                      color:#1E293B;
                    "
                  >
                    ${escapeHtml(
                      site?.name ?? "—"
                    )}
                  </span>

                  <br />

                  <span
                    style="
                      display:inline-block;
                      margin-top:2px;
                      font-size:13px;
                      font-weight:400;
                      color:#64748B;
                    "
                  >
                    ${escapeHtml(address)}
                  </span>
                </td>
              </tr>

              <tr>
                <td
                  style="
                    width:90px;
                    padding:10px 0 5px 0;
                    vertical-align:top;
                    font-size:14px;
                    font-weight:500;
                    color:#1E293B;
                  "
                >
                  Contacts:
                </td>

                <td
                  style="
                    padding:10px 0 5px 0;
                    vertical-align:top;
                  "
                >
                  <span
                    style="
                      display:inline-block;
                      font-size:14px;
                      font-weight:700;
                      color:#1E293B;
                    "
                  >
                    ${escapeHtml(
                      contactName
                    )}
                  </span>

                  <br />

                  <span
                    style="
                      display:inline-block;
                      margin-top:2px;
                      font-size:13px;
                      font-weight:400;
                      color:#64748B;
                    "
                  >
                    ${escapeHtml(
                      contactNumber
                    )}
                  </span>
                </td>
              </tr>

            </tbody>
          </table>
        </div>

        <!-- DIVIDER -->

        <div
          style="
            border-top:1px solid #e2e8f0;
            margin-bottom:24px;
          "
        ></div>

        <!-- SECTION 2 -->

        <div
          class="report-section"
          style="
            margin-bottom:24px;
            page-break-inside:avoid;
            break-inside:avoid;
          "
        >
          ${reportSectionHeader(
            "Section 2 — Financial Summary"
          )}

          <div
            style="
              display:flex;
              gap:12px;
              width:100%;
              margin-bottom:10px;
            "
          >
            ${b1}
            ${b2}
            ${b3}
          </div>

          ${
            budgetUtil != null
              ? `
                <div
                  style="
                    background:#e2e8f0;
                    height:5px;
                    border-radius:3px;
                    overflow:hidden;
                    margin-bottom:4px;
                  "
                >
                  <div
                    style="
                      height:100%;
                      width:${progressWidth}%;
                      background:${progressColor};
                      border-radius:3px;
                    "
                  ></div>
                </div>

                <p
                  style="
                    margin:0;
                    font-size:11px;
                    color:#94A3B8;
                  "
                >
                  Budget utilization:
                  ${budgetUtil.toFixed(1)}%
                </p>
              `
              : ""
          }
        </div>

        <!-- SECTION 3 -->

        ${
          scopes.length > 0
            ? `
              <div
                class="report-work-scope"
                style="
                  margin-bottom:16px;
                  page-break-inside:auto;
                  break-inside:auto;
                "
              >

                <div
                  style="
                    display:flex;
                    align-items:center;
                    gap:10px;
                    margin-bottom:14px;
                    page-break-after:avoid;
                    break-after:avoid;
                  "
                >
                  <div
                    style="
                      width:4px;
                      height:18px;
                      background:#F59E0B;
                      border-radius:2px;
                      flex-shrink:0;
                    "
                  ></div>

                  <h2
                    style="
                      font-size:13px;
                      font-weight:700;
                      color:#1E293B;
                      margin:0;
                      text-transform:uppercase;
                      letter-spacing:0.8px;
                    "
                  >
                    Section 3 — Work Scope
                  </h2>

                  <span
                    style="
                      background:#F59E0B;
                      color:#1E3A5F;
                      padding:2px 10px;
                      border-radius:20px;
                      font-size:11px;
                      font-weight:700;
                      white-space:nowrap;
                    "
                  >
                    ${completedCount}/${scopes.length}
                    Complete
                  </span>
                </div>

                <table
                  style="
                    width:100%;
                    border-collapse:collapse;
                    border:1px solid #e2e8f0;
                    table-layout:fixed;
                  "
                >
                  <colgroup>
                    <col style="width:40px;" />
                    <col style="width:22%;" />
                    <col style="width:18%;" />
                    <col style="width:20%;" />
                    <col style="width:auto;" />
                  </colgroup>

                  <thead
                    style="
                      display:table-header-group;
                    "
                  >
                    <tr>

                      <th
                        style="
                          padding:10px;
                          background:#1E3A5F;
                          color:#ffffff;
                          font-size:12px;
                          font-weight:600;
                          text-align:center;
                          border-right:1px solid rgba(255,255,255,0.15);
                        "
                      >
                        #
                      </th>

                      <th
                        style="
                          padding:10px;
                          background:#1E3A5F;
                          color:#ffffff;
                          font-size:12px;
                          font-weight:600;
                          text-align:left;
                          border-right:1px solid rgba(255,255,255,0.15);
                        "
                      >
                        Work
                      </th>

                      <th
                        style="
                          padding:10px;
                          background:#1E3A5F;
                          color:#ffffff;
                          font-size:12px;
                          font-weight:600;
                          text-align:left;
                          border-right:1px solid rgba(255,255,255,0.15);
                        "
                      >
                        Status
                      </th>

                      <th
                        style="
                          padding:10px;
                          background:#1E3A5F;
                          color:#ffffff;
                          font-size:12px;
                          font-weight:600;
                          text-align:left;
                          border-right:1px solid rgba(255,255,255,0.15);
                        "
                      >
                        Completed Date
                      </th>

                      <th
                        style="
                          padding:10px;
                          background:#1E3A5F;
                          color:#ffffff;
                          font-size:12px;
                          font-weight:600;
                          text-align:left;
                        "
                      >
                        Remarks
                      </th>

                    </tr>
                  </thead>

                  <tbody>
                    ${scopeRows}
                  </tbody>

                </table>
              </div>
            `
            : ""
        }

      </div>

      <!-- REPORT FOOTER -->

      <div
        style="
          width:100%;
          box-sizing:border-box;
          background:#f8fafc;
          border-top:2px solid #F59E0B;
          padding:14px 32px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:20px;
        "
      >
        <p
          style="
            margin:0;
            font-size:11px;
            color:#94A3B8;
          "
        >
          BuilderLedger ©
          ${new Date().getFullYear()}
          · Construction Management Made Simple
        </p>

        <p
          style="
            margin:0;
            font-size:11px;
            color:#94A3B8;
            text-align:right;
          "
        >
          System generated report
          · ${escapeHtml(site?.name ?? "")}
        </p>
      </div>
    `;
  };

  // =========================================================
  // PRINT
  // =========================================================

  const handlePrint = () => {
    if (!site) return;

    const oldFrame =
      document.querySelector<HTMLIFrameElement>(
        "[data-site-print-frame]"
      );

    oldFrame?.remove();

    const printFrame =
      document.createElement("iframe");

    printFrame.setAttribute(
      "data-site-print-frame",
      "true"
    );

    printFrame.title = "Site Report Print";

    printFrame.style.position = "fixed";
    printFrame.style.left = "-10000px";
    printFrame.style.top = "0";
    printFrame.style.width = "800px";
    printFrame.style.height = "1000px";
    printFrame.style.border = "0";
    printFrame.style.opacity = "0";
    printFrame.style.pointerEvents = "none";

    document.body.appendChild(printFrame);

    const printDocument =
      printFrame.contentDocument;

    const printWindow =
      printFrame.contentWindow;

    if (!printDocument || !printWindow) {
      printFrame.remove();
      return;
    }

    const printTitle =
      `Site Report — ${site.name ?? ""}`;

    printDocument.open();

    printDocument.write(`
      <!DOCTYPE html>

      <html>

        <head>

          <meta charset="utf-8" />

          <title>
            ${escapeHtml(printTitle)}
          </title>

          <style>

            * {
              box-sizing:border-box;
            }

            html,
            body {
              margin:0;
              padding:0;
              width:100%;
              min-height:100%;
              background:#ffffff;
              font-family:
                'Segoe UI',
                Arial,
                sans-serif;
              color:#1E293B;
            }

            body {
              overflow:visible;
            }

            table {
              max-width:100%;
            }

            tr {
              page-break-inside:avoid;
              break-inside:avoid;
            }

            thead {
              display:table-header-group;
            }

            @page {
              size:A4 portrait;
              margin:10mm;
            }

            @media print {

              html,
              body {
                width:100%;
                margin:0 !important;
                padding:0 !important;
                background:#ffffff !important;
              }

              *,
              *::before,
              *::after {
                -webkit-print-color-adjust:exact !important;
                print-color-adjust:exact !important;
              }

              .report-work-scope {
                page-break-inside:auto !important;
                break-inside:auto !important;
              }

              .report-work-scope tr {
                page-break-inside:avoid !important;
                break-inside:avoid !important;
              }

              .report-section {
                page-break-inside:avoid !important;
                break-inside:avoid !important;
              }

            }

          </style>

        </head>

        <body>

          ${buildReportHTML()}

        </body>

      </html>
    `);

    printDocument.close();

    let cleaned = false;

    const cleanup = () => {
      if (cleaned) return;

      cleaned = true;

      printWindow.removeEventListener(
        "afterprint",
        cleanup
      );

      printFrame.remove();
    };

    printWindow.addEventListener(
      "afterprint",
      cleanup
    );

    printFrame.onload = () => {
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (err) {
          console.error(
            "Failed to print Site Detail report:",
            err
          );

          cleanup();
        }
      }, 150);
    };
  };

  // =========================================================
  // DOWNLOAD PDF
  // =========================================================

  const handleDownloadPDF = async () => {
  if (!site || pdfLoading) return;

  setPdfLoading(true);

  try {
    const reportHTML =
      buildReportHTML();

    const safeSiteName =
      getSafeFileName(
        site.name ?? `site-${id}`
      );

    const response = await fetch(
      `${API_BASE_URL}/SiteReportAPI/generate-pdf`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          html: reportHTML,
          fileName:
            `site-report-${safeSiteName}.pdf`,
        }),
      }
    );

    if (!response.ok) {
      let errorMessage =
        "Failed to generate PDF.";

      try {
        const errorData =
          await response.json();

        if (errorData?.message) {
          errorMessage =
            errorData.message;

          if (errorData.error) {
            errorMessage +=
              ` ${errorData.error}`;
          }
        }
      } catch {
        const errorText =
          await response.text();

        if (errorText) {
          errorMessage =
            errorText;
        }
      }

      throw new Error(
        errorMessage
      );
    }

    const blob =
      await response.blob();

    if (!blob || blob.size === 0) {
      throw new Error(
        "The server returned an empty PDF."
      );
    }

    const downloadUrl =
      window.URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = downloadUrl;

    link.download =
      `site-report-${safeSiteName}.pdf`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      downloadUrl
    );
  } catch (error) {
    console.error(
      "PDF generation failed:",
      error
    );

    alert(
      error instanceof Error
        ? error.message
        : "Unable to generate PDF."
    );
  } finally {
    setPdfLoading(false);
  }
};

  // =========================================================
  // SCREEN-ONLY TABLE STYLES
  // =========================================================

  const thStyle: CSSProperties = {
    padding: "10px 14px",
    background: "#1E3A5F",
    color: "#fff",
    fontSize: "13px",
    fontWeight: 600,
    textAlign: "left",
    borderRight:
      "1px solid rgba(255,255,255,0.15)",
  };

  const tdStyle: CSSProperties = {
    padding: "10px 14px",
    fontSize: "14px",
    color: "#1E293B",
    borderBottom:
      "1px solid #e2e8f0",
    borderRight:
      "1px solid #e2e8f0",
    verticalAlign: "top",
  };

  const tdLabelStyle: CSSProperties = {
    ...tdStyle,
    fontWeight: 600,
    background: "#f8fafc",
    width: "180px",
    color: "#64748B",
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div
        style={{
          background:
            "linear-gradient(135deg, #1E3A5F, #0F172A)",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <p
          style={{
            color: "#fff",
            fontSize: "18px",
          }}
        >
          Loading...
        </p>
      </div>
    );
  }

  // =========================================================
  // ERROR
  // =========================================================

  if (error) {
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
        }}
      >
        <p
          style={{
            color: "#DC2626",
            marginBottom: "16px",
          }}
        >
          {error}
        </p>

        <Link
          to="/sites"
          style={{
            color: "#1E3A5F",
          }}
        >
          ← Back to Site List
        </Link>
      </div>
    );
  }

  // =========================================================
  // SCREEN VIEW
  // =========================================================

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, #1E3A5F, #0F172A)",
        minHeight: "100vh",
        padding: "30px 24px",
      }}
    >

      {/* Back + Buttons */}

      <div
        style={{
          maxWidth: "860px",
          margin: "0 auto 16px auto",
          display: "flex",
          justifyContent:
            "space-between",
          alignItems: "center",
        }}
      >

        <Link
          to="/sites"
          style={{
            color: "#fff",
            textDecoration: "none",
            fontSize: "14px",
            fontWeight: 500,
            display: "flex",
            alignItems: "center",
            gap: "6px",
          }}
        >
          ← Back to Site List
        </Link>

        <div
          style={{
            display: "flex",
            gap: "10px",
          }}
        >

          {/* PRINT */}

          <button
            onClick={handlePrint}
            style={{
              background: "#1E3A5F",
              color: "#fff",
              border:
                "1px solid rgba(255,255,255,0.3)",
              borderRadius: "8px",
              padding: "8px 18px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 500,
            }}
          >
            🖨 Print
          </button>

          {/* DOWNLOAD PDF */}

          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            style={{
              background:
                pdfLoading
                  ? "#d4920a"
                  : "#F59E0B",
              color: "#fff",
              border: "none",
              borderRadius: "8px",
              padding: "8px 18px",
              cursor:
                pdfLoading
                  ? "not-allowed"
                  : "pointer",
              fontSize: "14px",
              fontWeight: 600,
            }}
          >
            {pdfLoading
              ? "⏳ Generating..."
              : "⬇ Download PDF"}
          </button>

        </div>
      </div>

      {/* SCREEN DOCUMENT */}

      <div
        ref={screenRef}
        style={{
          maxWidth: "860px",
          margin: "0 auto",
          background: "#fff",
          borderRadius: "16px",
          boxShadow:
            "0 20px 40px rgba(0,0,0,0.3)",
          overflow: "hidden",
          fontFamily:
            "'Outfit', 'Segoe UI', sans-serif",
        }}
      >

        {/* HEADER */}

        <div
          style={{
            background: "#1E3A5F",
            padding: "28px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent:
              "space-between",
          }}
        >

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "16px",
            }}
          >

            <div
              style={{
                width: "52px",
                height: "52px",
                background: "#F59E0B",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 900,
                fontSize: "20px",
                color: "#1E3A5F",
                flexShrink: 0,
              }}
            >
              BL
            </div>

            <div>

              <p
                style={{
                  color: "#fff",
                  fontWeight: 800,
                  fontSize: "18px",
                  margin: 0,
                }}
              >
                BUILDER LEDGER
              </p>

              <p
                style={{
                  color: "#94A3B8",
                  fontSize: "11px",
                  margin: 0,
                  letterSpacing: "1px",
                }}
              >
                CONSTRUCTION MANAGEMENT
              </p>

            </div>

          </div>

          <div
            style={{
              textAlign: "right",
            }}
          >

            <p
              style={{
                color: "#F59E0B",
                fontWeight: 700,
                fontSize: "16px",
                margin:
                  "0 0 4px 0",
              }}
            >
              SITE REPORT
            </p>

            <p
              style={{
                color: "#94A3B8",
                fontSize: "12px",
                margin:
                  "0 0 2px 0",
              }}
            >
              Generated:{" "}
              {new Date().toLocaleDateString(
                "en-GB",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                }
              )}
            </p>

            <p
              style={{
                color: "#94A3B8",
                fontSize: "12px",
                margin: 0,
              }}
            >
              Site ID: #
              {String(id).padStart(
                3,
                "0"
              )}
            </p>

          </div>

        </div>

        <div
          style={{
            height: "4px",
            background: "#F59E0B",
          }}
        />

        {/* CONTENT */}

        <div
          style={{
            padding: "32px",
          }}
        >

          {/* SCREEN SECTION 1 */}

          <div
            style={{
              marginBottom: "28px",
            }}
          >

            <SectionHeader
              title="Section 1 — Site Overview"
            />

            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <tbody>

                {[
                  {
                    label: "Site Name",
                    value:
                      site?.name ?? "—",
                  },
                  {
                    label:
                      "Contact Person",
                    value:
                      contactName,
                  },
                  {
                    label:
                      "Contact Number",
                    value:
                      contactNumber,
                  },
                  {
                    label: "Address",
                    value: address,
                  },
                ].map(
                  (row, i, arr) => (
                    <tr
                      key={row.label}
                    >

                      <td
                        style={{
                          ...tdLabelStyle,
                          borderBottom:
                            i ===
                            arr.length - 1
                              ? "none"
                              : "1px solid #e2e8f0",
                        }}
                      >
                        {row.label}
                      </td>

                      <td
                        style={{
                          ...tdStyle,
                          borderRight:
                            "none",
                          borderBottom:
                            i ===
                            arr.length - 1
                              ? "none"
                              : "1px solid #e2e8f0",
                        }}
                      >
                        {row.value}
                      </td>

                    </tr>
                  )
                )}

              </tbody>

            </table>

          </div>

          {/* SCREEN SECTION 2 */}

          <div
            style={{
              marginBottom: "28px",
            }}
          >

            <SectionHeader
              title="Section 2 — Timeline & Status"
            />

            <table
              style={{
                width: "100%",
                borderCollapse:
                  "collapse",
                border:
                  "1px solid #e2e8f0",
              }}
            >

              <thead>

                <tr>

                  {[
                    "Status",
                    "Started Date",
                    "Expected Completion",
                    "Days Active",
                  ].map(
                    (h, i, arr) => (
                      <th
                        key={h}
                        style={{
                          ...thStyle,
                          borderRight:
                            i <
                            arr.length - 1
                              ? "1px solid rgba(255,255,255,0.15)"
                              : "none",
                        }}
                      >
                        {h}
                      </th>
                    )
                  )}

                </tr>

              </thead>

              <tbody>

                <tr>

                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: 600,
                      color:
                        statusColor(
                          site?.status
                        ),
                    }}
                  >
                    {site?.status ??
                      "—"}
                  </td>

                  <td style={tdStyle}>
                    {fmtDate(
                      site?.startedDate
                    )}
                  </td>

                  <td style={tdStyle}>
                    {fmtDate(
                      site?.expectedCompletionDate
                    )}
                  </td>

                  <td
                    style={{
                      ...tdStyle,
                      borderRight:
                        "none",
                      fontWeight: 700,
                    }}
                  >
                    {daysActive != null
                      ? `${daysActive} days`
                      : "—"}
                  </td>

                </tr>

              </tbody>

            </table>

          </div>

          {/* SCREEN SECTION 3 */}

          {budget != null && (
            <div
              style={{
                marginBottom: "28px",
              }}
            >

              <SectionHeader
                title="Section 3 — Financial Summary"
              />

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "1fr 1fr 1fr",
                  gap: "12px",
                }}
              >

                {[
                  {
                    label:
                      "Expected Budget",
                    value:
                      fmt(budget),
                    sub:
                      "Total budget allocated",
                    color: "#1E3A5F",
                    bg: "#EFF6FF",
                    border:
                      "#BFDBFE",
                  },

                  {
                    label:
                      "Amount Spent",
                    value:
                      fmt(spent),
                    sub:
                      budgetUtil != null
                        ? `${budgetUtil.toFixed(
                            1
                          )}% of budget used`
                        : "All-time material cost",
                    color:
                      spent >
                      (budget ??
                        Infinity)
                        ? "#DC2626"
                        : "#1E293B",
                    bg:
                      spent >
                      (budget ??
                        Infinity)
                        ? "#FEF2F2"
                        : "#F0FDF4",
                    border:
                      spent >
                      (budget ??
                        Infinity)
                        ? "#FECACA"
                        : "#BBF7D0",
                  },

                  {
                    label:
                      remaining !=
                        null &&
                      remaining < 0
                        ? "Over Budget"
                        : "Remaining Amount",

                    value:
                      remaining !=
                        null
                        ? fmt(
                            Math.abs(
                              remaining
                            )
                          )
                        : "—",

                    sub:
                      remaining !=
                        null &&
                      remaining < 0
                        ? "Exceeded budget"
                        : "Budget balance",

                    color:
                      remaining !=
                        null &&
                      remaining < 0
                        ? "#DC2626"
                        : "#16A34A",

                    bg:
                      remaining !=
                        null &&
                      remaining < 0
                        ? "#FEF2F2"
                        : "#F0FDF4",

                    border:
                      remaining !=
                        null &&
                      remaining < 0
                        ? "#FECACA"
                        : "#BBF7D0",
                  },
                ].map((c) => (

                  <div
                    key={c.label}
                    style={{
                      background:
                        c.bg,
                      border:
                        `1px solid ${c.border}`,
                      borderRadius:
                        "10px",
                      padding:
                        "18px 20px",
                      textAlign:
                        "center",
                    }}
                  >

                    <p
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "#64748B",
                        fontWeight:
                          600,
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          "0.7px",
                        margin:
                          "0 0 8px 0",
                      }}
                    >
                      {c.label}
                    </p>

                    <p
                      style={{
                        fontSize:
                          "22px",
                        fontWeight:
                          800,
                        color:
                          c.color,
                        margin:
                          "0 0 6px 0",
                      }}
                    >
                      {c.value}
                    </p>

                    <p
                      style={{
                        fontSize:
                          "11px",
                        color:
                          "#94A3B8",
                        margin: 0,
                      }}
                    >
                      {c.sub}
                    </p>

                  </div>

                ))}

              </div>

              {budgetUtil != null && (
                <div
                  style={{
                    marginTop:
                      "12px",
                  }}
                >

                  <div
                    style={{
                      background:
                        "#e2e8f0",
                      height: "6px",
                      borderRadius:
                        "3px",
                      overflow:
                        "hidden",
                    }}
                  >

                    <div
                      style={{
                        height:
                          "100%",
                        borderRadius:
                          "3px",
                        background:
                          budgetUtil >=
                          100
                            ? "#DC2626"
                            : budgetUtil >=
                              70
                            ? "#F59E0B"
                            : "#16A34A",
                        width:
                          `${Math.min(
                            100,
                            budgetUtil
                          )}%`,
                      }}
                    />

                  </div>

                  <p
                    style={{
                      fontSize:
                        "11px",
                      color:
                        "#94A3B8",
                      marginTop:
                        "4px",
                    }}
                  >
                    Budget utilization:{" "}
                    {budgetUtil.toFixed(
                      1
                    )}
                    %
                  </p>

                </div>
              )}

            </div>
          )}

          {/* SCREEN SECTION 4 */}

          {scopes.length > 0 && (
            <div
              style={{
                marginBottom: "16px",
              }}
            >

              <div
                style={{
                  display: "flex",
                  alignItems:
                    "center",
                  gap: "10px",
                  marginBottom:
                    "12px",
                }}
              >

                <div
                  style={{
                    width: "4px",
                    height: "20px",
                    background:
                      "#F59E0B",
                    borderRadius:
                      "2px",
                  }}
                />

                <h2
                  style={{
                    fontSize:
                      "14px",
                    fontWeight:
                      700,
                    color:
                      "#1E293B",
                    margin: 0,
                    textTransform:
                      "uppercase",
                    letterSpacing:
                      "0.8px",
                  }}
                >
                  Section 4 — Work Scope
                </h2>

                <span
                  style={{
                    background:
                      "#F59E0B",
                    color:
                      "#1E3A5F",
                    padding:
                      "2px 10px",
                    borderRadius:
                      "20px",
                    fontSize:
                      "12px",
                    fontWeight:
                      700,
                  }}
                >
                  {
                    scopes.filter(
                      (s) =>
                        s.scopeStatusId ===
                        3
                    ).length
                  }
                  /
                  {scopes.length}{" "}
                  Complete
                </span>

              </div>

              <table
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                  border:
                    "1px solid #e2e8f0",
                }}
              >

                <thead>

                  <tr>

                    {[
                      "#",
                      "Work",
                      "Status",
                      "Completed Date",
                      "Remarks",
                    ].map(
                      (h, i, arr) => (
                        <th
                          key={h}
                          style={{
                            ...thStyle,
                            textAlign:
                              h === "#"
                                ? "center"
                                : "left",
                            width:
                              h === "#"
                                ? "40px"
                                : undefined,
                            borderRight:
                              i <
                              arr.length - 1
                                ? "1px solid rgba(255,255,255,0.15)"
                                : "none",
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}

                  </tr>

                </thead>

                <tbody>

                  {scopes.map(
                    (scope, i) => (
                      <tr
                        key={scope.id}
                        style={{
                          background:
                            i % 2 === 0
                              ? "#fff"
                              : "#f8fafc",
                        }}
                      >

                        <td
                          style={{
                            ...tdStyle,
                            textAlign:
                              "center",
                            color:
                              "#94A3B8",
                            width:
                              "40px",
                          }}
                        >
                          {i + 1}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            fontWeight:
                              600,
                          }}
                        >
                          {
                            scope.scopeName
                          }
                        </td>

                        <td
                          style={
                            tdStyle
                          }
                        >
                          <span
                            style={{
                              color:
                                scopeColor(
                                  scope.scopeStatusId
                                ),
                              fontWeight:
                                600,
                              fontSize:
                                "13px",
                            }}
                          >
                            {
                              scopeIcon(
                                scope.scopeStatusId
                              )
                            }{" "}
                            {
                              scope.statusName
                            }
                          </span>
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color:
                              "#64748B",
                          }}
                        >
                          {scope.completedDate
                            ? new Date(
                                scope.completedDate
                              ).toLocaleDateString(
                                "en-GB",
                                {
                                  day: "2-digit",
                                  month:
                                    "short",
                                  year: "numeric",
                                }
                              )
                            : "—"}
                        </td>

                        <td
                          style={{
                            ...tdStyle,
                            color:
                              "#64748B",
                            borderRight:
                              "none",
                          }}
                        >
                          {
                            scope.remarks ||
                            "—"
                          }
                        </td>

                      </tr>
                    )
                  )}

                </tbody>

              </table>

            </div>
          )}

        </div>

        {/* SCREEN FOOTER */}

        <div
          style={{
            background:
              "#f8fafc",
            borderTop:
              "2px solid #F59E0B",
            padding:
              "16px 32px",
            display: "flex",
            justifyContent:
              "space-between",
            alignItems:
              "center",
          }}
        >

          <p
            style={{
              fontSize: "12px",
              color: "#94A3B8",
              margin: 0,
            }}
          >
            BuilderLedger ©{" "}
            {new Date().getFullYear()}
            · Construction Management
            Made Simple
          </p>

          <p
            style={{
              fontSize: "12px",
              color: "#94A3B8",
              margin: 0,
            }}
          >
            System generated report ·{" "}
            {site?.name}
          </p>

        </div>

      </div>
    </div>
  );
}

// ===========================================================
// SCREEN SECTION HEADER
// ===========================================================

function SectionHeader({
  title,
}: {
  title: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        marginBottom: "12px",
      }}
    >
      <div
        style={{
          width: "4px",
          height: "20px",
          background: "#F59E0B",
          borderRadius: "2px",
        }}
      />

      <h2
        style={{
          fontSize: "14px",
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

export default SiteDetail;