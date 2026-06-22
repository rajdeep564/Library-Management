import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { ButtonSpinner } from "../../components/ui";
import { Server_URL } from "../../utils/config";
import { asArray } from "../../utils/safeArray";

export default function SendNotification() {
  const token = localStorage.getItem("authToken");
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    recipientType: "all",
    userId: "",
    title: "",
    message: "",
    sendInApp: true,
    sendEmail: false,
  });

  useEffect(() => {
    axios
      .get(`${Server_URL}users`, { headers })
      .then((res) => setMembers(asArray(res.data.user).filter((u) => u.role === "user")))
      .catch(() => {});
  }, [headers]);

  const previewText = form.title
    ? `${form.title}\n\n${form.message || "Your notification message will appear here."}`
    : "Preview will appear after you enter a title and message.";

  const submit = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.message.trim()) {
      return toast.error("Title and message are required");
    }
    setLoading(true);
    try {
      const res = await axios.post(`${Server_URL}notifications/send`, form, { headers });
      toast.success(`Notification sent to ${res.data.sent} recipient(s)`);
      setForm((f) => ({ ...f, title: "", message: "" }));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to send notification");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-megaphone" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Send Notification
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Send manual in-app and email alerts to members or library staff
        </p>
      </div>

      <div className="row g-3">
        <div className="col-lg-7">
          <div className="gov-card">
            <form onSubmit={submit}>
              <div className="mb-3">
                <label className="gov-label">Recipient</label>
                <select
                  className="gov-input"
                  value={form.recipientType}
                  onChange={(e) => setForm((f) => ({ ...f, recipientType: e.target.value, userId: "" }))}
                >
                  <option value="all">All Members and Librarians</option>
                  <option value="member">All Members</option>
                  <option value="librarian">All Librarians</option>
                  <option value="specific">Specific Member</option>
                </select>
              </div>

              {form.recipientType === "specific" && (
                <div className="mb-3">
                  <label className="gov-label">Member</label>
                  <select
                    className="gov-input"
                    value={form.userId}
                    onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                  >
                    <option value="">Select member</option>
                    {members.map((member) => (
                      <option key={member._id} value={member._id}>
                        {member.name} ({member.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="gov-label">Title</label>
                <input
                  className="gov-input"
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Library holiday notice"
                />
              </div>

              <div className="mb-3">
                <label className="gov-label">Message</label>
                <textarea
                  className="gov-input"
                  rows="5"
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder="Enter the notification message"
                />
              </div>

              <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.sendInApp}
                    onChange={(e) => setForm((f) => ({ ...f, sendInApp: e.target.checked }))}
                  />
                  Send in-app notification
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={form.sendEmail}
                    onChange={(e) => setForm((f) => ({ ...f, sendEmail: e.target.checked }))}
                  />
                  Send email
                </label>
              </div>

              <ButtonSpinner type="submit" loading={loading}>
                Send Notification
              </ButtonSpinner>
            </form>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="gov-card">
            <div className="gov-card-header">
              <i className="bi bi-eye"></i>
              Preview
            </div>
            <div
              style={{
                background: "#ebf0f5",
                borderRadius: 8,
                padding: 16,
                whiteSpace: "pre-wrap",
                fontSize: 13,
                minHeight: 180,
              }}
            >
              {previewText}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
