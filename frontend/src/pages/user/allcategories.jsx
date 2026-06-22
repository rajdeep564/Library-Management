import React, { useState, useEffect } from "react";
import { Server_URL } from "../../utils/config";
import axios from "axios";
import "./allcategories.css";
import { Link } from "react-router-dom";
import { SkeletonCard, EmptyState, ErrorBanner } from "../../components/ui";
import { showErrorToast, showSuccessToast } from "../../utils/toasthelper";
import { asArray } from "../../utils/safeArray";

export default function ViewAllCategories() {
  const [books, setBooks] = useState([]);
  const [filterBooks, setFilteredBooks] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [categoryCounts, setCategoryCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = Server_URL + "books";
      const response = await axios.get(url);
      const { error, message, books } = response.data;

      if (error) {
        showErrorToast(message);
        setBooks([]);
        setFilteredBooks([]);
      } else {
        const list = asArray(books);
        setBooks(list);
        setFilteredBooks(list);

        const categoryCountMap = {};
        list.forEach((book) => {
          const cat = book.category;
          categoryCountMap[cat] = (categoryCountMap[cat] || 0) + 1;
        });

        setCategoryCounts(categoryCountMap);
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load categories");
      showErrorToast("Failed to load categories.");
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryClick = (selectedCategory) => {
    setActiveCategory(selectedCategory);
    if (selectedCategory === "All") {
      setFilteredBooks(asArray(books));
    } else {
      const filtered = asArray(books).filter(
        (book) => book.category === selectedCategory
      );
      setFilteredBooks(filtered);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="all-categories-container">
      <div className="all-categories-row">
        {/* Sidebar */}
        <nav className="all-categories-sidebar">
          <h5 className="all-categories-sidebar-title">Categories</h5>
          <ul className="all-categories-nav">
            <li
              className={`all-categories-nav-item ${
                activeCategory === "All" ? "active" : ""
              }`}
              onClick={() => handleCategoryClick("All")}
            >
              All
            </li>
            {[...new Set(asArray(books).map((book) => book.category))].map(
              (category, index) => (
                <li
                  key={index}
                  className={`all-categories-nav-item ${
                    activeCategory === category ? "active" : ""
                  }`}
                  onClick={() => handleCategoryClick(category)}
                >
                  {category}
                </li>
              )
            )}
          </ul>
        </nav>

        {/* Main Content */}
        <main className="all-categories-main">
          <h2 className="all-categories-main-title">Explore All Categories</h2>
          <ErrorBanner message={error} onRetry={fetchCategories} />
          {loading ? (
            <SkeletonCard count={6} />
          ) : asArray(filterBooks).length > 0 ? (
            <div className="all-categories-grid">
              {[...new Set(asArray(filterBooks).map((book) => book.category))].map(
                (category, index) => (
                  <div key={index} className="all-categories-card-wrapper">
                    <div className="all-categories-card shadow-sm">
                      <img
                        src={
                          asArray(filterBooks).find(
                            (b) => b.category === category
                          )?.coverImage
                        }
                        className="all-categories-card-img"
                        alt={category}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src =
                            "https://via.placeholder.com/300x400?text=No+Image";
                        }}
                      />
                      <div className="all-categories-card-body">
                        <h5 className="all-categories-card-title">
                          {category}
                        </h5>
                        <p className="text-muted">
                          Books: {categoryCounts[category] || 0}
                        </p>
                        <Link to="/books" className="all-categories-btn">
                          Explore
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              )}
            </div>
          ) : (
            <EmptyState iconClass="bi-grid" title="No categories" message="No books found in this category" />
          )}
        </main>
      </div>
    </div>
  );
}
