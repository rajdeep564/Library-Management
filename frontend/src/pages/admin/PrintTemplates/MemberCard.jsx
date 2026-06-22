import QRCode from "react-qr-code";

export default function MemberCard({ member, qrData }) {
  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .member-card-print, .member-card-print * { visibility: visible; }
          .member-card-print { position: absolute; left: 0; top: 0; }
        }
      `}</style>
      <div
        className="member-card-print"
        style={{
          width: "3.375in",
          height: "2.125in",
          border: "1px solid var(--gov-primary)",
          borderRadius: 8,
          overflow: "hidden",
          background: "white",
          fontFamily: "var(--gov-font)",
        }}
      >
        <div style={{ background: "var(--gov-primary)", color: "white", padding: "8px 12px" }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>e-GranthaAlaya</div>
          <div style={{ fontSize: 9 }}>Digital Library Member Card</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 0.9in", gap: 10, padding: 12 }}>
          <div>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{member?.name || "Member"}</div>
            <div style={{ fontSize: 9, marginTop: 8 }}>Member ID: {member?.memberId || member?._id || "-"}</div>
            <div style={{ fontSize: 9 }}>Email: {member?.email || "-"}</div>
            <div style={{ fontSize: 8, color: "var(--gov-text-light)", marginTop: 12 }}>
              Ahmedabad Municipal Library Network
            </div>
          </div>
          <QRCode value={qrData || member?.qrCode || "{}"} size={76} />
        </div>
      </div>
    </div>
  );
}
