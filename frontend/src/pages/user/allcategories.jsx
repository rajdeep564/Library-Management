import React, { useState, useEffect } from "react";
import { Server_URL } from "../../utils/config";
import axios from "axios";
import "./allcategories.css";
import { Link } from "react-router-dom";
import { SkeletonCard, EmptyState, ErrorBanner } from "../../components/ui";
import { asArray } from "../../utils/safeArray";

export default function ViewAllCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${Server_URL}books/category-stats`);
      setCategories(asArray(response.data.categories));
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to load categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  return (
    <div className="all-categories-container">
      <div className="all-categories-row">
        <nav className="all-categories-sidebar">
          <h5 className="all-categories-sidebar-title">Categories</h5>
          <ul className="all-categories-nav">
            <li className="all-categories-nav-item active">All</li>
            {categories.map((item, index) => (
              <li key={index} className="all-categories-nav-item">
                {item.category}
              </li>
            ))}
          </ul>
        </nav>

        <main className="all-categories-main">
          <h2 className="all-categories-main-title">Explore All Categories</h2>
          <ErrorBanner message={error} onRetry={fetchCategories} />
          {loading ? (
            <SkeletonCard count={6} />
          ) : categories.length > 0 ? (
            <div className="all-categories-grid">
              {categories.map((item, index) => (
                <div key={index} className="all-categories-card-wrapper">
                  <div className="all-categories-card shadow-sm">
                    <img
                      src={item.coverImage || "https://via.placeholder.com/300x400?text=No+Image"}
                      className="all-categories-card-img"
                      alt={item.category}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = "https://via.placeholder.com/300x400?text=No+Image";
                      }}
                    />
                    <div className="all-categories-card-body">
                      <h5 className="all-categories-card-title">{item.category}</h5>
                      <p className="text-muted">Books: {item.count || 0}</p>
                      <Link to={`/books?category=${encodeURIComponent(item.category)}`} className="all-categories-btn">
                        Explore
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState iconClass="bi-grid" title="No categories" message="No book categories found" />
          )}
        </main>
      </div>
    </div>
  );
}
