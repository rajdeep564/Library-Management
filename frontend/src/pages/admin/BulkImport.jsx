import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Server_URL } from "../../utils/config";
import { asArray } from "../../utils/safeArray";
import ImportErrorReport from "../../components/ImportErrorReport";
import { PageLoader, ButtonSpinner } from "../../components/ui";

const steps = ["Upload", "Preview", "Result"];

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function BulkImport() {
  const token = localStorage.getItem("authToken");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importProgress, setImportProgress] = useState(0);

  const loadHistory = useCallback(async () => {
    try {
      const res = await axios.get(`${Server_URL}books/import-history`, { headers });
      setHistory(asArray(res.data.logs));
    } catch (err) {
      console.error("Failed to load import history", err.response?.data?.message || err.message);
    }
  }, [headers]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const downloadTemplate = async () => {
    try {
      const res = await axios.get(`${Server_URL}books/import-template`, {
        headers,
        responseType: "blob",
      });
      downloadBlob(res.data, "book-import-template.xlsx");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to download template");
    }
  };

  const previewImport = async () => {
    if (!file) return toast.info("Select an Excel or CSV file first");
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${Server_URL}books/bulk-import/preview`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setPreview(res.data);
      setStep(1);
      toast.success(res.data.valid ? "Preview validated successfully" : "Preview completed with errors");
      loadHistory();
    } catch (err) {
      toast.error(err.response?.data?.message || "Preview failed");
    } finally {
      setLoading(false);
    }
  };

  const confirmImport = async () => {
    if (!file) return toast.info("Select an Excel or CSV file first");
    if (!preview?.valid) return toast.error("Fix validation errors before import");
    setLoading(true);
    setImportProgress(0);
    const progressTimer = setInterval(() => {
      setImportProgress((p) => (p >= 90 ? p : p + 10));
    }, 300);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await axios.post(`${Server_URL}books/bulk-import`, formData, {
        headers: { ...headers, "Content-Type": "multipart/form-data" },
      });
      setImportProgress(100);
      setResult(res.data);
      setStep(2);
      toast.success(`Imported ${res.data.insertedRows} books successfully`);
      loadHistory();
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        setPreview({
          valid: false,
          totalRows: data.totalRows,
          errorCount: data.errorCount,
          errors: data.errors,
          previewRows: [],
        });
        setStep(1);
      }
      toast.error(data?.message || "Import failed");
    } finally {
      clearInterval(progressTimer);
      setLoading(false);
      setImportProgress(0);
    }
  };

  const resetWizard = () => {
    setFile(null);
    setPreview(null);
    setResult(null);
    setStep(0);
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-upload" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Bulk Book Import
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Upload Excel or CSV catalog data with validation, accession generation, QR payloads, and import history.
        </p>
      </div>

      <div className="gov-card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {steps.map((label, index) => (
            <div
              key={label}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                background: step === index ? "var(--gov-primary)" : "var(--gov-bg)",
                color: step === index ? "white" : "var(--gov-text-secondary)",
                border: "1px solid var(--gov-border)",
                fontWeight: 600,
                fontSize: 13,
              }}
            >
              {index + 1}. {label}
            </div>
          ))}
        </div>
      </div>

      {step === 0 && (
        <div className="gov-card" style={{ marginBottom: 20 }}>
          <div className="gov-card-header">
            <i className="bi bi-file-earmark-spreadsheet"></i>
            Upload Import File
          </div>
          <div className="row g-3">
            <div className="col-lg-7">
              <label className="gov-label">Excel/CSV File</label>
              <input
                type="file"
                className="gov-input"
                accept=".xlsx,.xls,.csv"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <small style={{ color: "var(--gov-text-light)" }}>
                Maximum 5MB and 1000 rows. Required columns: title, author, isbn, totalCopies.
              </small>
              {file && <p style={{ marginTop: 10, fontSize: 13 }}>Selected: <strong>{file.name}</strong></p>}
            </div>
            <div className="col-lg-5">
              <div style={{ background: "var(--gov-bg)", padding: 16, borderRadius: 8 }}>
                <strong>Template</strong>
                <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "8px 0 12px" }}>
                  Download the official template to avoid validation errors.
                </p>
                <button type="button" className="btn-gov-outline" onClick={downloadTemplate}>
                  <i className="bi bi-download me-1"></i>
                  Download Template
                </button>
              </div>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <ButtonSpinner type="button" loading={loading} onClick={previewImport}>
              Preview & Validate
            </ButtonSpinner>
          </div>
          {loading && <PageLoader label="Validating..." />}
        </div>
      )}

      {step === 1 && preview && (
        <div className="gov-card" style={{ marginBottom: 20 }}>
          <div className="gov-card-header">
            <i className="bi bi-check2-square"></i>
            Validation Preview
          </div>
          <div className="row g-3" style={{ marginBottom: 16 }}>
            <div className="col-md-4"><div className="stat-card"><div><div className="stat-card-value">{preview.totalRows || 0}</div><div className="stat-card-label">Rows Found</div></div></div></div>
            <div className="col-md-4"><div className="stat-card"><div><div className="stat-card-value">{preview.errorCount || 0}</div><div className="stat-card-label">Errors</div></div></div></div>
            <div className="col-md-4"><div className="stat-card"><div><div className="stat-card-value">{preview.valid ? "Ready" : "Blocked"}</div><div className="stat-card-label">Import Status</div></div></div></div>
          </div>

          <ImportErrorReport errors={preview.errors} />

          <div className="table-responsive" style={{ marginTop: 18 }}>
            <table className="table table-sm table-hover align-middle">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Accession</th>
                  <th>Total Copies</th>
                </tr>
              </thead>
              <tbody>
                {asArray(preview.previewRows).map((row, index) => (
                  <tr key={`${row.isbn}-${index}`}>
                    <td>{row.title}</td>
                    <td>{row.author}</td>
                    <td>{row.isbn}</td>
                    <td>{row.accessionNo}</td>
                    <td>{row.totalCopies}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {loading && (
            <div style={{ marginTop: 16 }}>
              <div className="progress" style={{ height: 8 }}>
                <div
                  className="progress-bar"
                  role="progressbar"
                  style={{ width: `${importProgress}%`, background: "var(--gov-primary)" }}
                  aria-valuenow={importProgress}
                  aria-valuemin="0"
                  aria-valuemax="100"
                />
              </div>
              <small style={{ color: "var(--gov-text-light)" }}>Importing... {importProgress}%</small>
            </div>
          )}
          <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
            <button type="button" className="btn-gov-outline" onClick={() => setStep(0)} disabled={loading}>Back</button>
            <ButtonSpinner type="button" loading={loading} disabled={!preview.valid} onClick={confirmImport}>
              Confirm Import
            </ButtonSpinner>
          </div>
        </div>
      )}

      {step === 2 && result && (
        <div className="gov-card" style={{ marginBottom: 20 }}>
          <div className="gov-card-header">
            <i className="bi bi-check-circle-fill"></i>
            Import Complete
          </div>
          <div className="alert alert-success">
            {result.message}. Inserted rows: <strong>{result.insertedRows}</strong>
          </div>
          <button type="button" className="btn-gov-primary" onClick={resetWizard}>
            Start New Import
          </button>
        </div>
      )}

      <div className="gov-card">
        <div className="gov-card-header">
          <i className="bi bi-clock-history"></i>
          Recent Import History
        </div>
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Date</th>
                <th>File</th>
                <th>Status</th>
                <th>Rows</th>
                <th>Inserted</th>
                <th>Errors</th>
                <th>Uploaded By</th>
              </tr>
            </thead>
            <tbody>
              {asArray(history).map((log) => (
                <tr key={log._id}>
                  <td>{new Date(log.createdAt).toLocaleString()}</td>
                  <td>{log.fileName || "-"}</td>
                  <td><span className={log.status === "SUCCESS" ? "badge-returned" : log.status === "FAILED" ? "badge-overdue" : "badge-pending"}>{log.status}</span></td>
                  <td>{log.attemptedRows}</td>
                  <td>{log.insertedRows}</td>
                  <td>{log.errorCount}</td>
                  <td>{log.uploadedBy?.name || log.uploadedBy?.email || "-"}</td>
                </tr>
              ))}
              {!asArray(history).length && (
                <tr>
                  <td colSpan="7" className="text-center text-muted py-4">No import history yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
