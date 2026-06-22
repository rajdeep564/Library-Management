import { useEffect, useState } from "react";
import axios from "axios";
import { Server_URL } from "../../utils/config";
import "./profile.css";
import { getAuthToken } from "../../utils/auth";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { asArray } from "../../utils/safeArray";
import { PageLoader, ErrorBanner, ButtonSpinner } from "../../components/ui";

function ProfilePage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [returningId, setReturningId] = useState(null);
  const [allBooks, setAllBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [issuedRequests, setIssuedRequests] = useState([]);
  const [returnRequests, setReturnRequests] = useState([]);
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailOverdue: true,
    emailDueTomorrow: true,
    emailFineReminder: true,
    inAppAll: true,
  });

  const fetchIssuedBooks = async () => {
    try {
      const url = Server_URL + "books/issued";
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const books = asArray(response.data.issuedBooks);
      setAllBooks(books);
      setIssuedBooks(books.filter((b) => b.status === "Issued"));
      setIssuedRequests(books.filter((b) => b.status === "Requested"));
      setReturnRequests(books.filter((b) => b.status === "Requested Return"));
    } catch (error) {
      console.error("Error fetching issued books:", error.message);
    }
  };
  async function fetchProfile() {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Server_URL}users/profile`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      });
      const { user } = response.data;
      setUser(user);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProfile();
    fetchIssuedBooks();
    axios
      .get(`${Server_URL}notifications/preferences`, {
        headers: { Authorization: `Bearer ${getAuthToken()}` },
      })
      .then((res) => setNotificationPrefs(res.data.preferences || notificationPrefs))
      .catch(() => {});
  }, []);

  async function returnBook(borrowId) {
    setReturningId(borrowId);
    try {
      const response = await axios.put(
        `${Server_URL}books/returnrequest/${borrowId}`,
        {},
        { headers: { Authorization: `Bearer ${getAuthToken()}` } }
      );
      showSuccessToast(response.data.message);
      fetchIssuedBooks();
    } catch (error) {
      console.error("Error returning book:", error);
      showErrorToast(error.response?.data?.message || "Something went wrong!");
    } finally {
      setReturningId(null);
    }
  }

  if (loading) return <PageLoader label="Loading profile..." />;
  if (!user) return <ErrorBanner message={error || "Profile not found"} onRetry={fetchProfile} />;

  return (
    <div className="profile-page animate-fadeIn">
      <ErrorBanner message={error} onRetry={fetchProfile} />
      <div className="profile-container">
        <div className="profile-info card">
          <h1>{user.name}</h1>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {user.role}</p>
        </div>

        <div className="profile-sections">
          <div className="section-card issued-books">
            <h2>📚 Issued Books</h2>
            {asArray(issuedBooks).length === 0 ? (
              <p>No books currently issued.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Issue Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                    <th>Fine</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedBooks.map((book) => (
                    <tr key={book._id}>
                      <td>{book.bookId.title}</td>
                      <td>{new Date(book.issueDate).toLocaleDateString()}</td>
                      <td>{new Date(book.dueDate).toLocaleDateString()}</td>
                      <td><span className="badge issued">{book.status}</span></td>
                      <td>₹{((book.fine || 0) / 100).toFixed(2)}</td>
                      <td>
                        <ButtonSpinner
                          className="return-btn"
                          loading={returningId === book._id}
                          onClick={() => returnBook(book._id)}
                          style={{ padding: "6px 12px", fontSize: 13 }}
                        >
                          Request Return
                        </ButtonSpinner>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="section-card issued-requests">
            <h2>📝 Issued Requests</h2>
            {asArray(issuedRequests).length === 0 ? (
              <p>No pending issue requests.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Request Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {issuedRequests.map((book) => (
                    <tr key={book._id}>
                      <td>{book.bookId.title}</td>
                      <td>{new Date(book.issueDate).toLocaleDateString()}</td>
                      <td>{new Date(book.dueDate).toLocaleDateString()}</td>
                      <td><span className="badge requested">{book.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="section-card return-requests">
            <h2>🔄 Return Requests</h2>
            {asArray(returnRequests).length === 0 ? (
              <p>No pending return requests.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Book Title</th>
                    <th>Request Date</th>
                    <th>Due Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {returnRequests.map((book) => (
                    <tr key={book._id}>
                      <td>{book.bookId.title}</td>
                      <td>{new Date(book.issueDate).toLocaleDateString()}</td>
                      <td>{new Date(book.dueDate).toLocaleDateString()}</td>
                      <td><span className="badge return-requested">{book.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="section-card">
            <h2>Notification Preferences</h2>
            <div style={{ display: "grid", gap: 10 }}>
              {[
                ["emailOverdue", "Email me when a book is overdue"],
                ["emailDueTomorrow", "Email me 1 day before due date"],
                ["emailFineReminder", "Email me for fine reminders"],
                ["inAppAll", "Show in-app notifications"],
              ].map(([key, label]) => (
                <label key={key} style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
            <button
              type="button"
              className="btn btn-primary mt-3"
              onClick={async () => {
                try {
                  await axios.put(`${Server_URL}notifications/preferences`, notificationPrefs, {
                    headers: { Authorization: `Bearer ${getAuthToken()}` },
                  });
                  showSuccessToast("Notification preferences saved");
                } catch (error) {
                  showErrorToast(error.response?.data?.message || "Failed to save preferences");
                }
              }}
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;
