import React from "react";
import { Link } from "react-router-dom";
import {
  FiFacebook,
  FiTwitter,
  FiInstagram,
  FiLinkedin,
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
} from "react-icons/fi";
import "./footer.css";
import PoweredByWildChild from "./PoweredByWildChild";

const Footer = () => {
  const handleLinkClick = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="library-footer gov-footer">
      <div className="footer-container">
        <div className="footer-main">
          <div className="footer-column">
            <h3 className="footer-heading">
              <i className="bi bi-book-half me-2"></i>
              e-GranthaAlaya
            </h3>
            <p className="footer-about-text">
              Digital Library Management System for the Ahmedabad Municipal Library Network.
              Access municipal library resources, browse collections, and manage your membership online.
            </p>
            <div className="footer-social">
              <a href="#" className="social-icon" aria-label="Facebook">
                <FiFacebook />
              </a>
              <a href="#" className="social-icon" aria-label="Twitter">
                <FiTwitter />
              </a>
              <a href="#" className="social-icon" aria-label="Instagram">
                <FiInstagram />
              </a>
              <a href="#" className="social-icon" aria-label="LinkedIn">
                <FiLinkedin />
              </a>
            </div>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Quick Links</h3>
            <ul className="footer-links">
              <li><Link to="/" className="footer-link" onClick={handleLinkClick}>Home</Link></li>
              <li><Link to="/aboutus" className="footer-link" onClick={handleLinkClick}>About</Link></li>
              <li><Link to="/books" className="footer-link" onClick={handleLinkClick}>Books</Link></li>
              <li><Link to="/category" className="footer-link" onClick={handleLinkClick}>Categories</Link></li>
              <li><Link to="/contactus" className="footer-link" onClick={handleLinkClick}>Contact</Link></li>
            </ul>
          </div>

          <div className="footer-column">
            <h3 className="footer-heading">Contact Us</h3>
            <ul className="footer-contact-info">
              <li className="contact-item">
                <FiMapPin className="contact-icon" />
                <span>Ahmedabad Municipal Corporation, Gujarat, India</span>
              </li>
              <li className="contact-item">
                <FiMail className="contact-icon" />
                <span>library@amcn.gov.in</span>
              </li>
              <li className="contact-item">
                <FiPhone className="contact-icon" />
                <span>+91 79 0000 0000</span>
              </li>
              <li className="contact-item">
                <FiClock className="contact-icon" />
                <div>
                  <p>Mon–Sat: 9:00 AM – 8:00 PM</p>
                  <p>Sunday: 10:00 AM – 5:00 PM</p>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">
            &copy; {new Date().getFullYear()} e-GranthaAlaya — Digital Library Management System. All rights reserved.
          </div>
          <PoweredByWildChild variant="footer" />
          <div className="footer-legal">
            <Link to="/privacy" className="legal-link" onClick={handleLinkClick}>Privacy Policy</Link>
            <Link to="/terms" className="legal-link" onClick={handleLinkClick}>Terms of Use</Link>
            <Link to="/accessibility" className="legal-link" onClick={handleLinkClick}>Accessibility</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
