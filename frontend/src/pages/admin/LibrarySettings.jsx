import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { Server_URL } from "../../utils/config";
import { PageLoader, ButtonSpinner, ErrorBanner } from "../../components/ui";

function paisaToRupees(value = 0) {
  return (Number(value || 0) / 100).toFixed(2);
}

function rupeesToPaisa(value = 0) {
  return Math.round(Number(value || 0) * 100);
}

export default function LibrarySettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    finePerDay: "1.00",
    maxFineCap: "500.00",
    gracePeriodDays: 0,
    loanPeriodDays: 14,
  });
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailOverdue: true,
    emailDueTomorrow: true,
    emailFineReminder: true,
    inAppAll: true,
  });
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [error, setError] = useState(null);

  const headers = { Authorization: `Bearer ${localStorage.getItem("authToken")}` };

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const [fineRes, prefRes] = await Promise.all([
          axios.get(`${Server_URL}config/fine-settings`, { headers }),
          axios.get(`${Server_URL}notifications/preferences`, { headers }),
        ]);
        const settings = fineRes.data.settings || {};
        setForm({
          finePerDay: paisaToRupees(settings.finePerDay),
          maxFineCap: paisaToRupees(settings.maxFineCap),
          gracePeriodDays: settings.gracePeriodDays ?? 0,
          loanPeriodDays: settings.loanPeriodDays ?? 14,
        });
        setNotificationPrefs(prefRes.data.preferences || notificationPrefs);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to load settings";
        setError(msg);
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put(
        `${Server_URL}config/fine-settings`,
        {
          finePerDay: rupeesToPaisa(form.finePerDay),
          maxFineCap: rupeesToPaisa(form.maxFineCap),
          gracePeriodDays: Number(form.gracePeriodDays),
          loanPeriodDays: Number(form.loanPeriodDays),
        },
        { headers }
      );
      toast.success("Fine settings saved successfully");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationPrefs = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      await axios.put(`${Server_URL}notifications/preferences`, notificationPrefs, { headers });
      toast.success("Notification preferences saved");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to save notification preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
          <i className="bi bi-gear" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
          Library Settings
        </h4>
        <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
          Configure fine rules and default loan settings
        </p>
      </div>

      <ErrorBanner message={error} onRetry={() => window.location.reload()} />

      <div className="gov-card">
        <div className="gov-card-header">
          <i className="bi bi-currency-rupee"></i>
          Fine Settings
        </div>

        {loading ? (
          <PageLoader label="Loading settings..." />
        ) : (
          <form onSubmit={saveSettings}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
              <div>
                <label className="gov-label">Fine per day (₹)</label>
                <input
                  className="gov-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.finePerDay}
                  onChange={(e) => setForm((f) => ({ ...f, finePerDay: e.target.value }))}
                />
              </div>
              <div>
                <label className="gov-label">Max fine cap (₹)</label>
                <input
                  className="gov-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxFineCap}
                  onChange={(e) => setForm((f) => ({ ...f, maxFineCap: e.target.value }))}
                />
              </div>
              <div>
                <label className="gov-label">Grace period (days)</label>
                <input
                  className="gov-input"
                  type="number"
                  min="0"
                  value={form.gracePeriodDays}
                  onChange={(e) => setForm((f) => ({ ...f, gracePeriodDays: e.target.value }))}
                />
              </div>
              <div>
                <label className="gov-label">Default loan period (days)</label>
                <input
                  className="gov-input"
                  type="number"
                  min="1"
                  value={form.loanPeriodDays}
                  onChange={(e) => setForm((f) => ({ ...f, loanPeriodDays: e.target.value }))}
                />
              </div>
            </div>

            <ButtonSpinner type="submit" loading={saving} style={{ marginTop: 20 }}>
              Save Fine Settings
            </ButtonSpinner>
          </form>
        )}
      </div>

      <div className="gov-card" style={{ marginTop: 20 }}>
        <div className="gov-card-header">
          <i className="bi bi-bell"></i>
          Notification Preferences
        </div>
        {loading ? (
          <PageLoader label="Loading preferences..." />
        ) : (
          <form onSubmit={saveNotificationPrefs}>
            <div style={{ display: "grid", gap: 12 }}>
              {[
                ["emailOverdue", "Email me when a book is overdue"],
                ["emailDueTomorrow", "Email me 1 day before due date"],
                ["emailFineReminder", "Email me for fine reminders"],
                ["inAppAll", "Show in-app notifications"],
              ].map(([key, label]) => (
                <label key={key} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13 }}>
                  <input
                    type="checkbox"
                    checked={notificationPrefs[key]}
                    onChange={(e) =>
                      setNotificationPrefs((prefs) => ({ ...prefs, [key]: e.target.checked }))
                    }
                  />
                  {label}
                </label>
              ))}
            </div>
            <ButtonSpinner type="submit" loading={savingPrefs} style={{ marginTop: 20 }}>
              Save Notification Preferences
            </ButtonSpinner>
          </form>
        )}
      </div>
    </div>
  );
}
