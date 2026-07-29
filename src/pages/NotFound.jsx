import React from 'react';
import { Link } from 'react-router-dom';
import AppHelmet from '../components/AppHelmet';
import './NotFound.scss';

export default function NotFound() {
  return (
    <div className="not-found">
      <AppHelmet title="Page Not Found" location="/404" />

      <div className="not-found-content">
        <div className="error-code">404</div>
        <h1>Page Not Found</h1>
        <p>Oops! The page you're looking for doesn't exist.</p>
        <Link to="/" className="btn">
          🏠 Go Back Home
        </Link>
      </div>
    </div>
  );
}
