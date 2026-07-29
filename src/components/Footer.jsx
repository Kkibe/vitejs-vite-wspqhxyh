import React from 'react';
import './Footer.scss';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-section">
          <h3>⚡ PowerKing Tips</h3>
          <p>Your trusted source for football predictions and betting tips.</p>
        </div>

        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li>
              <a href="/">Home</a>
            </li>
            <li>
              <a href="/tips">Tips</a>
            </li>
            <li>
              <a href="/about">About</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Support</h4>
          <ul>
            <li>
              <a href="/contact">Contact Us</a>
            </li>
            <li>
              <a href="/faq">FAQ</a>
            </li>
            <li>
              <a href="/privacy">Privacy Policy</a>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Follow Us</h4>
          <div className="social-links">
            <a
              href="https://t.me/powerkingtips"
              target="_blank"
              rel="noopener noreferrer"
            >
              📱 Telegram
            </a>
            <a
              href="https://twitter.com/powerkingtips"
              target="_blank"
              rel="noopener noreferrer"
            >
              🐦 Twitter
            </a>
            <a
              href="https://facebook.com/powerkingtips"
              target="_blank"
              rel="noopener noreferrer"
            >
              📘 Facebook
            </a>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <p>&copy; {currentYear} PowerKing Tips. All rights reserved.</p>
      </div>
    </footer>
  );
}
