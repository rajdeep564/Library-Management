/* eslint-disable react/prop-types */
import QRCode from "react-qr-code";

export default function QRDisplay({ data, size = 180, title = "QR Code" }) {
  const downloadPng = () => {
    const svg = document.getElementById("qr-display-svg");
    if (!svg) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svg);
    const image = new Image();
    const canvas = document.createElement("canvas");
    canvas.width = size * 2;
    canvas.height = size * 2;
    const ctx = canvas.getContext("2d");
    image.onload = () => {
      ctx.fillStyle = "#fff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const link = document.createElement("a");
      link.download = `${title.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    };
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
  };

  const printQr = () => {
    const win = window.open("", "_blank", "width=420,height=520");
    if (!win) return;
    win.document.write(`
      <html><head><title>${title}</title></head>
      <body style="font-family:Arial;text-align:center;padding:24px">
        <h3>${title}</h3>
        <div>${document.getElementById("qr-display-wrapper")?.innerHTML || ""}</div>
        <script>window.onload = () => window.print();</script>
      </body></html>
    `);
    win.document.close();
  };

  return (
    <div style={{ textAlign: "center" }}>
      <h6 style={{ marginBottom: 14 }}>{title}</h6>
      <div id="qr-display-wrapper" style={{ background: "white", padding: 12, display: "inline-block" }}>
        <QRCode id="qr-display-svg" value={data || "{}"} size={size} />
      </div>
      <div style={{ display: "flex", gap: 8, justifyContent: "center", marginTop: 14 }}>
        <button type="button" className="btn-gov-outline" onClick={downloadPng}>Download PNG</button>
        <button type="button" className="btn-gov-primary" onClick={printQr}>Print</button>
      </div>
    </div>
  );
}
