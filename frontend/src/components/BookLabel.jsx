/* eslint-disable react/prop-types */
import QRCode from "react-qr-code";

export default function BookLabel({ book, qrData }) {
  return (
    <div
      style={{
        width: "3in",
        height: "2in",
        border: "1px solid var(--gov-primary)",
        padding: "0.12in",
        background: "white",
        display: "grid",
        gridTemplateColumns: "1fr 1.1in",
        gap: "0.1in",
        fontFamily: "var(--gov-font)",
      }}
    >
      <div>
        <div style={{ fontWeight: 700, fontSize: 11, color: "var(--gov-primary)" }}>e-GranthaAlaya</div>
        <div style={{ fontSize: 8, color: "var(--gov-text-light)", marginBottom: 10 }}>
          Ahmedabad Municipal Library Network
        </div>
        <div style={{ fontWeight: 700, fontSize: 10, lineHeight: 1.2 }}>
          {(book?.title || "Untitled").slice(0, 48)}
        </div>
        <div style={{ fontSize: 8, marginTop: 8 }}>ISBN: {book?.isbn || "-"}</div>
        <div style={{ fontSize: 8 }}>Accession: {book?.accessionNo || book?._id || "-"}</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <QRCode value={qrData || book?.qrCode || "{}"} size={88} />
      </div>
    </div>
  );
}
