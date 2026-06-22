import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import QrScanner from "qr-scanner";
import { toast } from "react-toastify";
import { Server_URL } from "../../utils/config";
import { asArray } from "../../utils/safeArray";
import QRDisplay from "../../components/QRDisplay";
import BookLabel from "../../components/BookLabel";
import MemberCard from "./PrintTemplates/MemberCard";
import { SkeletonTable, ButtonSpinner, Spinner } from "../../components/ui";
import { showLoadingToast, dismissToast } from "../../utils/toasthelper";

const tabs = ["books", "members", "scan"];

function bookPayload(book) {
  return JSON.stringify({
    type: "BOOK",
    id: book._id,
    isbn: book.isbn || "",
    title: book.title || "",
    v: 1,
  });
}

function memberPayload(member) {
  return JSON.stringify({
    type: "MEMBER",
    id: member._id,
    memberId: member.memberId || member._id,
    name: member.name || "",
    v: 1,
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function QRManager() {
  const token = localStorage.getItem("authToken");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [activeTab, setActiveTab] = useState("books");
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);
  const [modal, setModal] = useState(null);
  const [scanInput, setScanInput] = useState("");
  const [selectedMember, setSelectedMember] = useState(null);
  const [selectedBook, setSelectedBook] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [downloadingKey, setDownloadingKey] = useState(null);
  const [batchLoading, setBatchLoading] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const videoRef = useRef(null);
  const scannerRef = useRef(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [bookRes, memberRes] = await Promise.all([
        axios.get(`${Server_URL}books`),
        axios.get(`${Server_URL}qr/members`, { headers }),
      ]);
      setBooks(asArray(bookRes.data.books));
      setMembers(asArray(memberRes.data.members));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load QR data");
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const processScan = useCallback(async (qrData) => {
    if (!qrData) return;
    setScanLoading(true);
    try {
      const res = await axios.post(`${Server_URL}qr/scan`, { qrData }, { headers });
      if (res.data.type === "MEMBER") {
        setSelectedMember(res.data.data);
        toast.success("Member QR scanned");
      } else {
        setSelectedBook(res.data.data);
        toast.success("Book QR scanned");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Unable to read QR code");
    } finally {
      setScanLoading(false);
    }
  }, [headers]);

  useEffect(() => {
    if (activeTab !== "scan" || !videoRef.current) return undefined;
    scannerRef.current = new QrScanner(
      videoRef.current,
      (result) => processScan(result?.data || result),
      { highlightScanRegion: true, highlightCodeOutline: true }
    );
    setCameraReady(false);
    scannerRef.current.start().then(() => setCameraReady(true)).catch(() => {
      toast.info("Camera scanner unavailable. Use manual QR paste.");
    });
    return () => {
      setCameraReady(false);
      scannerRef.current?.stop();
      scannerRef.current?.destroy();
      scannerRef.current = null;
    };
  }, [activeTab, processScan]);

  const filteredBooks = asArray(books).filter((book) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [book.title, book.isbn, book.accessionNo, book.author]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });

  const filteredMembers = asArray(members).filter((member) => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return [member.name, member.email, member.memberId]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(term));
  });

  const downloadFile = async (url, filename, key) => {
    setDownloadingKey(key);
    const toastId = showLoadingToast("Downloading...");
    try {
      const res = await axios.get(url, { headers, responseType: "blob" });
      downloadBlob(res.data, filename);
    } catch (err) {
      toast.error(err.response?.data?.message || "Download failed");
    } finally {
      dismissToast(toastId);
      setDownloadingKey(null);
    }
  };

  const downloadBatch = async (type) => {
    const ids = type === "book" ? selectedBooks : selectedMembers;
    if (!ids.length) return toast.info("Select at least one record");
    setBatchLoading(true);
    const toastId = showLoadingToast("Preparing ZIP download...");
    try {
      const res = await axios.post(
        `${Server_URL}qr/batch-generate`,
        { type, ids },
        { headers, responseType: "blob" }
      );
      downloadBlob(res.data, `${type}-qr-codes.zip`);
    } catch (err) {
      toast.error(err.response?.data?.message || "Batch download failed");
    } finally {
      dismissToast(toastId);
      setBatchLoading(false);
    }
  };

  const toggleSelected = (id, values, setValues) => {
    setValues(values.includes(id) ? values.filter((item) => item !== id) : [...values, id]);
  };

  const quickIssue = async () => {
    if (!selectedMember?.member || !selectedBook?.book) return toast.info("Scan both member and book first");
    try {
      await axios.post(
        `${Server_URL}qr/issue`,
        { memberId: selectedMember.member._id, bookId: selectedBook.book._id },
        { headers }
      );
      toast.success("Book issued via QR");
      setSelectedBook(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Quick issue failed");
    }
  };

  const quickReturn = async () => {
    const borrowId = selectedBook?.activeBorrow?._id;
    const bookId = selectedBook?.book?._id;
    if (!borrowId && !bookId) return toast.info("Scan an issued book first");
    try {
      await axios.post(`${Server_URL}qr/return`, { borrowId, bookId }, { headers });
      toast.success("Book returned via QR");
      setSelectedBook(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || "Quick return failed");
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-qr-code" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          QR Code Management
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Generate labels, member cards, and scan QR codes for circulation workflows.
        </p>
      </div>

      <div className="gov-card" style={{ marginBottom: 20, display: "flex", gap: 10, flexWrap: "wrap" }}>
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            className={activeTab === tab ? "btn-gov-primary" : "btn-gov-outline"}
            onClick={() => setActiveTab(tab)}
          >
            {tab === "books" ? "Books QR" : tab === "members" ? "Members QR" : "Scan & Issue"}
          </button>
        ))}
      </div>

      {activeTab !== "scan" && (
        <div className="gov-card" style={{ marginBottom: 20 }}>
          <label className="gov-label">Search</label>
          <input
            className="gov-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, ISBN, accession no, name, or email"
          />
        </div>
      )}

      {activeTab === "books" && (
        <div className="gov-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <strong>Book QR Labels</strong>
            <ButtonSpinner variant="secondary" loading={batchLoading} onClick={() => downloadBatch("book")}>
              Download Selected ZIP
            </ButtonSpinner>
          </div>
          {loading ? <SkeletonTable rows={8} cols={6} /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th></th>
                    <th>Book Title</th>
                    <th>ISBN</th>
                    <th>Accession No</th>
                    <th>QR Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => (
                    <tr key={book._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedBooks.includes(book._id)}
                          onChange={() => toggleSelected(book._id, selectedBooks, setSelectedBooks)}
                        />
                      </td>
                      <td>{book.title}</td>
                      <td>{book.isbn || "-"}</td>
                      <td>{book.accessionNo || book._id}</td>
                      <td><span className={book.qrCode ? "badge-returned" : "badge-pending"}>{book.qrCode ? "Generated" : "Pending"}</span></td>
                      <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" className="btn-gov-outline" onClick={() => setModal({ type: "book", item: book })}>View QR</button>
                        <ButtonSpinner variant="secondary" className="btn-sm" style={{ padding: "4px 10px", fontSize: 12 }} loading={downloadingKey === `book-png-${book._id}`} onClick={() => downloadFile(`${Server_URL}qr/book/${book._id}`, `book-${book._id}.png`, `book-png-${book._id}`)}>PNG</ButtonSpinner>
                        <ButtonSpinner className="btn-sm" style={{ padding: "4px 10px", fontSize: 12 }} loading={downloadingKey === `book-pdf-${book._id}`} onClick={() => downloadFile(`${Server_URL}qr/book/${book._id}/pdf`, `book-label-${book._id}.pdf`, `book-pdf-${book._id}`)}>Label PDF</ButtonSpinner>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "members" && (
        <div className="gov-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
            <strong>Member QR Cards</strong>
            <ButtonSpinner variant="secondary" loading={batchLoading} onClick={() => downloadBatch("member")}>
              Download Selected ZIP
            </ButtonSpinner>
          </div>
          {loading ? <SkeletonTable rows={8} cols={6} /> : (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead>
                  <tr>
                    <th></th>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Member ID</th>
                    <th>QR Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((member) => (
                    <tr key={member._id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedMembers.includes(member._id)}
                          onChange={() => toggleSelected(member._id, selectedMembers, setSelectedMembers)}
                        />
                      </td>
                      <td>{member.name}</td>
                      <td>{member.email}</td>
                      <td>{member.memberId || member._id}</td>
                      <td><span className={member.qrCode ? "badge-returned" : "badge-pending"}>{member.qrCode ? "Generated" : "Pending"}</span></td>
                      <td style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <button type="button" className="btn-gov-outline" onClick={() => setModal({ type: "member", item: member })}>View QR</button>
                        <ButtonSpinner variant="secondary" className="btn-sm" style={{ padding: "4px 10px", fontSize: 12 }} loading={downloadingKey === `member-png-${member._id}`} onClick={() => downloadFile(`${Server_URL}qr/member/${member._id}`, `member-${member._id}.png`, `member-png-${member._id}`)}>PNG</ButtonSpinner>
                        <ButtonSpinner className="btn-sm" style={{ padding: "4px 10px", fontSize: 12 }} loading={downloadingKey === `member-pdf-${member._id}`} onClick={() => downloadFile(`${Server_URL}qr/member/${member._id}/pdf`, `member-card-${member._id}.pdf`, `member-pdf-${member._id}`)}>Card PDF</ButtonSpinner>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "scan" && (
        <div className="row g-3">
          <div className="col-lg-5">
            <div className="gov-card">
              <strong>Camera Scanner</strong>
              <div style={{ position: "relative", marginTop: 12 }}>
                <video ref={videoRef} style={{ width: "100%", minHeight: 260, background: "#0f172a" }}></video>
                {!cameraReady && (
                  <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(15,23,42,0.7)" }}>
                    <Spinner label="Starting camera..." color="white" />
                  </div>
                )}
              </div>
              <label className="gov-label" style={{ marginTop: 14 }}>Manual QR Payload</label>
              <textarea className="gov-input" rows="5" value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder='Paste {"type":"BOOK"...} or {"type":"MEMBER"...}' />
              <ButtonSpinner type="button" loading={scanLoading} onClick={() => processScan(scanInput)} style={{ marginTop: 10 }}>
                Read QR Payload
              </ButtonSpinner>
            </div>
          </div>
          <div className="col-lg-7">
            <div className="gov-card" style={{ marginBottom: 16 }}>
              <strong>Selected Member</strong>
              {selectedMember?.member ? (
                <div style={{ marginTop: 10 }}>
                  <p style={{ margin: 0 }}>{selectedMember.member.name} ({selectedMember.member.email})</p>
                  <small>Active loans/requests: {asArray(selectedMember.activeLoans).length}</small>
                </div>
              ) : <p style={{ color: "var(--gov-text-light)", marginTop: 10 }}>Scan a member QR code.</p>}
            </div>
            <div className="gov-card" style={{ marginBottom: 16 }}>
              <strong>Selected Book</strong>
              {selectedBook?.book ? (
                <div style={{ marginTop: 10 }}>
                  <p style={{ margin: 0 }}>{selectedBook.book.title}</p>
                  <small>Available copies: {selectedBook.book.availableCopies ?? 0}</small>
                  {selectedBook.activeBorrow && <div><small>Active borrower: {selectedBook.activeBorrow.userId?.name || selectedBook.activeBorrow.userId?.email}</small></div>}
                </div>
              ) : <p style={{ color: "var(--gov-text-light)", marginTop: 10 }}>Scan a book QR code.</p>}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <button type="button" className="btn-gov-primary" onClick={quickIssue}>Quick Issue</button>
              <button type="button" className="btn-gov-outline" onClick={quickReturn}>Quick Return</button>
              <button type="button" className="btn-gov-outline" onClick={() => { setSelectedMember(null); setSelectedBook(null); setScanInput(""); }}>Clear</button>
            </div>
          </div>
        </div>
      )}

      {modal && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,.45)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{modal.type === "book" ? "Book QR" : "Member QR"}</h5>
                <button type="button" className="btn-close" onClick={() => setModal(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row g-3 align-items-center">
                  <div className="col-md-5">
                    <QRDisplay
                      data={modal.type === "book" ? (modal.item.qrCode || bookPayload(modal.item)) : (modal.item.qrCode || memberPayload(modal.item))}
                      title={modal.type === "book" ? modal.item.title : modal.item.name}
                    />
                  </div>
                  <div className="col-md-7">
                    {modal.type === "book" ? (
                      <BookLabel book={modal.item} qrData={modal.item.qrCode || bookPayload(modal.item)} />
                    ) : (
                      <MemberCard member={modal.item} qrData={modal.item.qrCode || memberPayload(modal.item)} />
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-gov-outline" onClick={() => setModal(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
