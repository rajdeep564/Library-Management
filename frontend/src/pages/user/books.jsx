import { useEffect, useState } from "react";
import axios from "axios";
import "./books.css";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Server_URL } from "../../utils/config";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { asArray } from "../../utils/safeArray";
import { SkeletonBookGrid, EmptyState, ErrorBanner } from "../../components/ui";

const PAGE_SIZE = 24;

const Books = () => {
  const [books, setBooks] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [categories, setCategories] = useState(["All"]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const categoryFromUrl = searchParams.get("category");

  async function issueBook(bookid) {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        showErrorToast("Please login to issue a book.");
        return;
      }
      const response = await axios.post(`${Server_URL}books/borrow/request-issue/${bookid}`, {}, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const { error, message } = response.data;
      if (error) showErrorToast(message);
      else showSuccessToast(message);
    } catch (err) {
      showErrorToast(err.response?.data?.message || "Something went wrong! Please try again.");
    }
  }

  function bookDetails(bookid) {
    navigate(`/bookdetails/${bookid}`);
  }

  useEffect(() => {
    axios.get(`${Server_URL}books/categories`)
      .then((res) => setCategories(asArray(res.data.categories).length ? res.data.categories : ["All"]))
      .catch(() => setCategories(["All"]));
  }, []);

  useEffect(() => {
    if (categoryFromUrl) {
      setSelectedCategory(categoryFromUrl);
      setPage(1);
    }
  }, [categoryFromUrl]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      setSearchQuery(searchTerm.trim());
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (searchQuery) params.set("search", searchQuery);
    if (selectedCategory !== "All") params.set("category", selectedCategory);

    axios.get(`${Server_URL}books?${params}`, { headers: { "Cache-Control": "no-cache" } })
      .then((response) => {
        setBooks(asArray(response.data.books));
        setTotalBooks(response.data.totalBooks || 0);
        setTotalPages(response.data.totalPages || 1);
      })
      .catch((err) => {
        setError(err.response?.data?.message || err.message || "Failed to load books");
      })
      .finally(() => setIsLoading(false));
  }, [page, searchQuery, selectedCategory]);

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setPage(1);
  };

  return (
    <div className="container-fluid books-container">
      <div className="row">
        <div className="col-md-3 p-4 sidebar">
          <h4 className="text-center mb-4">📚 Categories</h4>
          <div className="category-scroll">
            {categories.map((category, index) => (
              <div
                key={index}
                className={`category-item ${selectedCategory === category ? "active" : ""}`}
                onClick={() => handleCategoryChange(category)}
              >
                {category}
              </div>
            ))}
          </div>
        </div>

        <div className="col-md-9 main-content">
          <div className="search-header p-3">
            <h2 className="page-title">All Books</h2>
            <p className="text-muted small mb-2">{totalBooks.toLocaleString()} books</p>
            <div className="search-box">
              <input
                type="text"
                className="form-control"
                placeholder="Search by title, author, ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <i className="bi bi-search search-icon"></i>
            </div>
          </div>

          <ErrorBanner message={error} onRetry={() => setPage((p) => p)} />

          {isLoading ? (
            <SkeletonBookGrid count={8} />
          ) : asArray(books).length > 0 ? (
            <>
              <div className="books-grid">
                {books.map((book) => (
                  <div key={book._id} className="book-card">
                    <div className="card-image-container">
                      <img
                        src={book.coverImage || "https://via.placeholder.com/150x200?text=No+Cover"}
                        className="card-image"
                        alt={book.title}
                        onError={(e) => {
                          e.target.src = "https://via.placeholder.com/150x200?text=No+Cover";
                        }}
                      />
                      <div className="book-badge">{book.category}</div>
                    </div>
                    <div className="card-body">
                      <h5 className="card-title">{book.title}</h5>
                      <p className="card-author">By {book.author}</p>
                      <div className="card-footer">
                        <span className="card-price">₹{book.price}</span>
                        <div className="card-actions">
                          <button className="btn btn-outline-primary btn-sm" onClick={() => bookDetails(book._id)}>
                            Details
                          </button>
                          <button className="btn btn-primary btn-sm" onClick={() => issueBook(book._id)}>
                            Issue
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="d-flex justify-content-center align-items-center gap-2 my-4">
                  <button className="btn btn-outline-primary btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </button>
                  <span className="text-muted small">Page {page} of {totalPages}</span>
                  <button className="btn btn-outline-primary btn-sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <EmptyState iconClass="bi-book" title="No books found" message="Try adjusting your search or category filter" />
          )}
        </div>
      </div>
    </div>
  );
};

export default Books;
