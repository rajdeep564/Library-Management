import { useState, useEffect } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import { toast } from "react-toastify";
import { SkeletonCard, ButtonSpinner, Spinner } from "../../components/ui";
import { showLoadingToast, dismissToast } from "../../utils/toasthelper";

async function loadPdfLibs() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);
  return { jsPDF, autoTable };
}

async function loadExcelLibs() {
  const [XLSX, { saveAs }] = await Promise.all([import("xlsx"), import("file-saver")]);
  return { XLSX, saveAs };
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [exportingKey, setExportingKey] = useState(null);
  const token = localStorage.getItem("authToken");
  const headers = { Authorization: `Bearer ${token}` };

  const loadSummary = () => {
    setSummaryLoading(true);
    axios
      .get(`${Server_URL}reports/summary`, { headers })
      .then((r) => setSummary(r.data))
      .catch(console.error)
      .finally(() => setSummaryLoading(false));
  };

  useEffect(() => {
    loadSummary();
  }, []);

  const runExport = async (key, fn) => {
    setExportingKey(key);
    const toastId = showLoadingToast("Generating report...");
    try {
      await fn();
    } finally {
      dismissToast(toastId);
      setExportingKey(null);
    }
  };

  const getDate = () => new Date().toLocaleDateString("en-IN");
  const getDateTime = () => new Date().toLocaleString("en-IN");
  const fineRate = summary?.fineRatePerDay || 100;
  const formatCurrency = (paisa = 0) => `₹${(Number(paisa || 0) / 100).toFixed(2)}`;

  const addPdfHeader = (doc, title) => {
    doc.setFillColor(26, 60, 110);
    doc.rect(0, 0, 210, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("e-GranthaAlaya — Digital Library Management System", 14, 11);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Ahmedabad Municipal Library Network", 14, 18);
    doc.setTextColor(40, 40, 40);
    doc.setFontSize(13);
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 38);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${getDateTime()}`, 14, 44);
    doc.setDrawColor(26, 60, 110);
    doc.setLineWidth(0.5);
    doc.line(14, 47, 196, 47);
  };

  const downloadBorrowedPDF = async () => {
    try {
      const { jsPDF, autoTable } = await loadPdfLibs();
      const { data } = await axios.get(`${Server_URL}reports/borrowed`, { headers });
      const doc = new jsPDF();
      addPdfHeader(doc, "Circulation Report — All Issued & Returned Books");
      autoTable(doc, {
        startY: 52,
        head: [["#", "Book Title", "Author", "Member", "Email", "Issue Date", "Due Date", "Status", "Fine (₹)"]],
        body: data.map((r, i) => [
          i + 1,
          r.bookId?.title || "N/A",
          r.bookId?.author || "N/A",
          r.userId?.name || "N/A",
          r.userId?.email || "N/A",
          r.issueDate ? new Date(r.issueDate).toLocaleDateString("en-IN") : "-",
          r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "-",
          r.status || "-",
          formatCurrency(r.fineAmount),
        ]),
        headStyles: { fillColor: [26, 60, 110], fontSize: 8, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [245, 247, 250] },
        margin: { left: 14, right: 14 },
      });
      doc.save(`Circulation_Report_${getDate()}.pdf`);
      toast.success("PDF downloaded!");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  const downloadOverduePDF = async () => {
    try {
      const { jsPDF, autoTable } = await loadPdfLibs();
      const { data } = await axios.get(`${Server_URL}reports/overdue`, { headers });
      const doc = new jsPDF();
      addPdfHeader(doc, "Overdue Books Report");
      doc.setFontSize(10);
      doc.setTextColor(200, 16, 46);
      doc.text(`Total Overdue Books: ${data.length}`, 14, 54);
      autoTable(doc, {
        startY: 60,
        head: [["#", "Book Title", "ISBN", "Member Name", "Email", "Due Date", "Days Overdue", "Fine (₹)"]],
        body: data.map((r, i) => {
          const days = Math.max(0, Math.floor((new Date() - new Date(r.dueDate)) / (1000 * 60 * 60 * 24)));
          return [
            i + 1,
            r.bookId?.title || "N/A",
            r.bookId?.isbn || "N/A",
            r.userId?.name || "N/A",
            r.userId?.email || "N/A",
            r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "-",
            days,
            formatCurrency(days * fineRate),
          ];
        }),
        headStyles: { fillColor: [200, 16, 46], fontSize: 8 },
        bodyStyles: { fontSize: 8 },
        alternateRowStyles: { fillColor: [255, 245, 245] },
        margin: { left: 14, right: 14 },
      });
      doc.save(`Overdue_Report_${getDate()}.pdf`);
      toast.success("PDF downloaded!");
    } catch (e) {
      toast.error("Failed to generate PDF");
    }
  };

  const downloadMembersExcel = async () => {
    try {
      const { XLSX, saveAs } = await loadExcelLibs();
      const { data } = await axios.get(`${Server_URL}reports/members`, { headers });
      const rows = data.map((m, i) => ({
        "Sr.No": i + 1,
        Name: m.name,
        Email: m.email,
        Stream: m.stream || "-",
        Year: m.year || "-",
        Joined: m.createdAt ? new Date(m.createdAt).toLocaleDateString("en-IN") : "-",
        Role: m.role,
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      ws["!cols"] = [{ wch: 6 }, { wch: 24 }, { wch: 30 }, { wch: 16 }, { wch: 8 }, { wch: 14 }, { wch: 10 }];
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Members");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buf]), `Members_List_${getDate()}.xlsx`);
      toast.success("Excel downloaded!");
    } catch (e) {
      toast.error("Failed to export Excel");
    }
  };

  const downloadBorrowedExcel = async () => {
    try {
      const { XLSX, saveAs } = await loadExcelLibs();
      const { data } = await axios.get(`${Server_URL}reports/borrowed`, { headers });
      const rows = data.map((r, i) => ({
        "Sr.No": i + 1,
        "Book Title": r.bookId?.title || "N/A",
        Author: r.bookId?.author || "N/A",
        ISBN: r.bookId?.isbn || "N/A",
        "Member Name": r.userId?.name || "N/A",
        "Member Email": r.userId?.email || "N/A",
        "Issue Date": r.issueDate ? new Date(r.issueDate).toLocaleDateString("en-IN") : "-",
        "Due Date": r.dueDate ? new Date(r.dueDate).toLocaleDateString("en-IN") : "-",
        "Return Date": r.returnDate ? new Date(r.returnDate).toLocaleDateString("en-IN") : "-",
        Status: r.status,
        "Fine (₹)": formatCurrency(r.fineAmount),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Circulation");
      const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
      saveAs(new Blob([buf]), `Circulation_Report_${getDate()}.xlsx`);
      toast.success("Excel downloaded!");
    } catch (e) {
      toast.error("Failed to export Excel");
    }
  };

  const reportButtons = [
    {
      title: "Circulation Report",
      sub: "All issued & returned books",
      icon: "bi-journal-check",
      color: "#1a3c6e",
      actions: [
        { key: "circ-pdf", label: "Download PDF", fn: downloadBorrowedPDF, icon: "bi-file-earmark-pdf" },
        { key: "circ-xlsx", label: "Download Excel", fn: downloadBorrowedExcel, icon: "bi-file-earmark-spreadsheet" },
      ],
    },
    {
      title: "Overdue Books Report",
      sub: "Books not returned by due date",
      icon: "bi-exclamation-circle",
      color: "#c8102e",
      actions: [{ key: "overdue-pdf", label: "Download PDF", fn: downloadOverduePDF, icon: "bi-file-earmark-pdf" }],
    },
    {
      title: "Members List",
      sub: "All registered library members",
      icon: "bi-people",
      color: "#276749",
      actions: [{ key: "members-xlsx", label: "Download Excel", fn: downloadMembersExcel, icon: "bi-file-earmark-spreadsheet" }],
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-file-earmark-bar-graph" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Reports & MIS Export
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Generate and download official reports in PDF and Excel formats
        </p>
      </div>

      {summaryLoading ? (
        <SkeletonCard count={4} />
      ) : summary ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(160px,1fr))",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {[
            ["Total Books", summary.totalBooks, "#1a3c6e", "bi-book"],
            ["Active Borrows", summary.totalBorrows, "#2b6cb0", "bi-arrow-right-circle"],
            ["Returned", summary.totalReturned, "#276749", "bi-check-circle"],
            ["Overdue", summary.totalOverdue, "#c8102e", "bi-exclamation-circle"],
            ["Members", summary.totalMembers, "#6b46c1", "bi-people"],
            ["Fine (₹)", formatCurrency(summary.totalFine), "#b45309", "bi-cash-coin"],
          ].map(([label, val, color, icon], i) => (
            <div key={i} className="stat-card" style={{ borderLeftColor: color, padding: "14px 16px" }}>
              <div className="stat-card-icon" style={{ background: color, width: 40, height: 40, fontSize: 18 }}>
                <i className={`bi ${icon}`}></i>
              </div>
              <div>
                <div className="stat-card-value" style={{ fontSize: 22 }}>
                  {val}
                </div>
                <div className="stat-card-label">{label}</div>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 16 }}>
        {reportButtons.map((r, i) => (
          <div key={i} className="gov-card">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  background: r.color,
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <i className={`bi ${r.icon}`} style={{ color: "white", fontSize: 20 }}></i>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: "var(--gov-text-primary)", fontSize: 14 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: "var(--gov-text-light)" }}>{r.sub}</div>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {r.actions.map((a, j) => (
                <ButtonSpinner
                  key={a.key || j}
                  variant="secondary"
                  loading={exportingKey === a.key}
                  disabled={!!exportingKey && exportingKey !== a.key}
                  style={{ fontSize: 12, padding: "7px 14px" }}
                  onClick={() => runExport(a.key, a.fn)}
                >
                  <i className={`bi ${a.icon} me-1`}></i>
                  {a.label}
                </ButtonSpinner>
              ))}
            </div>
          </div>
        ))}
      </div>

      {exportingKey && (
        <div style={{ textAlign: "center", marginTop: 20, color: "var(--gov-text-secondary)", fontSize: 13 }}>
          <Spinner size="sm" label="Generating report, please wait..." />
        </div>
      )}
    </div>
  );
}
