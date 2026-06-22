function buildBookQrPayload(book) {
  return JSON.stringify({
    type: "BOOK",
    id: String(book._id),
    isbn: book.isbn || "",
    title: book.title || "",
    v: 1,
  });
}

function buildMemberQrPayload(user) {
  return JSON.stringify({
    type: "MEMBER",
    id: String(user._id),
    memberId: user.memberId || String(user._id),
    name: user.name || "",
    v: 1,
  });
}

function parseQrData(qrData) {
  if (!qrData || typeof qrData !== "string") {
    throw new Error("QR data is required");
  }

  let parsed;
  try {
    parsed = JSON.parse(qrData);
  } catch (err) {
    throw new Error("Invalid QR data format");
  }

  if (!["BOOK", "MEMBER"].includes(parsed.type) || !parsed.id) {
    throw new Error("Unsupported QR payload");
  }

  return parsed;
}

module.exports = {
  buildBookQrPayload,
  buildMemberQrPayload,
  parseQrData,
};
