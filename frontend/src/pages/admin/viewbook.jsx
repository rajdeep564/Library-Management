import { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { asArray } from "../../utils/safeArray";
import { SkeletonBookGrid, EmptyState, ErrorBanner, ButtonSpinner } from "../../components/ui";

import "./viewbook.css"

const ViewBooks = () => {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    category: "",
    isbn: "",
    price: "",
    totalCopies: "",
  });

  useEffect(() => {
    fetchBooks();
  }, [page, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const fetchBooks = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "24" });
      if (search) params.set("search", search);
      const response = await axios.get(`${Server_URL}books?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("authToken")}`,
          "Cache-Control": "no-cache",
        },
      });
      setBooks(asArray(response.data.books));
      setTotalBooks(response.data.totalBooks || 0);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load books");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this book?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`${Server_URL}books/delete/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      showSuccessToast("Book deleted successfully!");
      fetchBooks();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to delete book!");
    } finally {
      setDeletingId(null);
    }
  };

  
  const handleEdit = (book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      category: book.category,
      isbn: book.isbn,
      price: book.price,
      totalCopies: book.totalCopies,
    });
    setShowModal(true);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
 
  const handleUpdate = async () => {
    setSaving(true);
    try {
      await axios.put(`${Server_URL}books/update/${selectedBook._id}`, formData, {
        headers: { Authorization: `Bearer ${localStorage.getItem("authToken")}` },
      });
      showSuccessToast("Book updated successfully!");
      setShowModal(false);
      fetchBooks();
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Failed to update book!");
    } finally {
      setSaving(false);
    }
  };
  

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
          <div>
            <h4 style={{ fontSize: 18, fontWeight: 700, color: "var(--gov-text-primary)", margin: 0 }}>
              <i className="bi bi-book" style={{ marginRight: 8, color: "var(--gov-primary)" }}></i>
              Manage Library Books
            </h4>
            <p style={{ color: "var(--gov-text-light)", fontSize: 13, margin: "4px 0 0" }}>
              {totalBooks.toLocaleString()} books in catalog — showing page {page} of {totalPages}
            </p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <input
              className="gov-input"
              placeholder="Search title, author, ISBN..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{ minWidth: 220 }}
            />
            <Link to="/admin/books/bulk-import" className="btn-gov-primary">
            <i className="bi bi-upload me-1"></i>
            Bulk Import
          </Link>
          </div>
        </div>
      </div>
      <ErrorBanner message={error} onRetry={fetchBooks} />
      <div className="gov-card">
      <div className="container-fluid px-0">
  <div className="row">
    {loading ? (
      <div className="col-12"><SkeletonBookGrid count={8} /></div>
    ) : asArray(books).length > 0 ? (
      asArray(books).map((book) => (
        <div key={book._id} className="col-lg-3 col-md-4 col-sm-6 mb-4">
          <div className="card book-card">
            <div className="book-image-wrapper">
              <img
                src={book.coverImage || "https://via.placeholder.com/200"}
                className="book-image"
                alt={book.title}
              />
            </div>
            <div className="card-body">
              <h5 className="card-title">{book.title}</h5>
              <p className="book-author">{book.author}</p>
              <p className="book-category"><i className="bi bi-book me-1"></i>{book.category}</p>
              <p className="book-isbn"><i className="bi bi-upc me-1"></i>ISBN: {book.isbn}</p>
              <p className="book-price"><i className="bi bi-currency-rupee me-1"></i>{book.price}</p>
            </div>
            <div className="card-footer text-center">
              <ButtonSpinner variant="secondary" className="btn-sm me-2" onClick={() => handleEdit(book)} style={{ padding: "4px 10px", fontSize: 12 }}>
                <i className="bi bi-pencil me-1"></i>Edit
              </ButtonSpinner>
              <ButtonSpinner
                variant="danger"
                className="btn-sm"
                loading={deletingId === book._id}
                onClick={() => handleDelete(book._id)}
                style={{ padding: "4px 10px", fontSize: 12 }}
              >
                <i className="bi bi-trash me-1"></i>Delete
              </ButtonSpinner>
            </div>
          </div>
        </div>
      ))
    ) : (
      <div className="col-12">
        <EmptyState
          iconClass="bi-book"
          title="No books found"
          message="Add books manually or use bulk import"
          action={{ label: "Add Book", onClick: () => window.location.hash = "#/admin/addbook" }}
        />
      </div>
    )}
  </div>
      {!loading && totalPages > 1 && (
        <div className="d-flex justify-content-center align-items-center gap-2 mt-3 pb-2">
          <button type="button" className="btn-gov-outline btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </button>
          <span style={{ fontSize: 13, color: "var(--gov-text-secondary)" }}>Page {page} / {totalPages}</span>
          <button type="button" className="btn-gov-outline btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            Next
          </button>
        </div>
      )}
      </div>

      {showModal && selectedBook && (
        <div className="modal d-block" tabIndex="-1" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content gov-card" style={{ border: "none" }}>
              <div
                className="modal-header"
                style={{ background: "var(--gov-primary)", color: "white", borderRadius: "var(--gov-radius) var(--gov-radius) 0 0" }}
              >
                <h5 className="modal-title">Edit Book</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body p-4">
                <form>
                  <div className="mb-3">
                    <label className="gov-label">Title</label>
                    <input type="text" className="gov-input" name="title" value={formData.title} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="gov-label">Author</label>
                    <input type="text" className="gov-input" name="author" value={formData.author} onChange={handleChange} />
                  </div>
                  <div className="mb-3">
                    <label className="gov-label">Category</label>
                    <input type="text" className="gov-input" name="category" value={formData.category} onChange={handleChange} />
                  </div>
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="gov-label">ISBN</label>
                      <input type="text" className="gov-input" name="isbn" value={formData.isbn} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                      <label className="gov-label">Price (₹)</label>
                      <input type="number" className="gov-input" name="price" value={formData.price} onChange={handleChange} />
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="gov-label">Total Copies</label>
                    <input type="number" className="gov-input" name="totalCopies" value={formData.totalCopies} onChange={handleChange} />
                  </div>
                </form>
              </div>
              <div className="modal-footer d-flex justify-content-between p-3">
                <button type="button" className="btn-gov-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <ButtonSpinner loading={saving} onClick={handleUpdate}>Update</ButtonSpinner>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default ViewBooks;
