/* eslint-disable react/prop-types */
import * as XLSX from "xlsx";
import { asArray } from "../utils/safeArray";

export default function ImportErrorReport({ errors = [] }) {
  const rows = asArray(errors);

  const downloadReport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((error) => ({
        Row: error.row,
        Field: error.field,
        Message: error.message,
      }))
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Import Errors");
    XLSX.writeFile(workbook, "book-import-errors.xlsx");
  };

  if (!rows.length) {
    return (
      <div className="alert alert-success" style={{ marginTop: 16 }}>
        No validation errors found.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
        <strong style={{ color: "var(--gov-danger)" }}>{rows.length} validation errors</strong>
        <button type="button" className="btn-gov-outline" onClick={downloadReport}>
          <i className="bi bi-download me-1"></i>
          Download Error Report
        </button>
      </div>
      <div className="table-responsive" style={{ maxHeight: 260, overflow: "auto" }}>
        <table className="table table-sm table-hover align-middle">
          <thead>
            <tr>
              <th>Row</th>
              <th>Field</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((error, index) => (
              <tr key={`${error.row}-${error.field}-${index}`}>
                <td>{error.row}</td>
                <td>{error.field}</td>
                <td>{error.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
