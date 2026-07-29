import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AppHelmet from '../components/AppHelmet';
import './Home.scss';

import { userService } from '../services/firestore.service';

export default function Home() {
  const { currentUser, isAdmin } = useAuth();

  const handleMakeAdmin = async () => {
    const result = await userService.setKkibetkkoirAsAdmin();
    if (result) {
      alert('kkibetkkoir@gmail.com is now an admin!');
    } else {
      alert('Failed to set admin. Make sure the user exists.');
    }
  };

  return (
    <div className="home-page">
      <AppHelmet title="Home" location="/" />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>⚡ PowerKing Tips</h1>
          <p>Expert football predictions with 85%+ accuracy</p>
          <p className="sub-text">
            Get premium tips, real-time alerts, and win more bets
          </p>
          {currentUser ? (
            <div className="hero-buttons">
              <Link to="/tips" className="btn btn-primary">
                View Today's Tips
              </Link>
              {isAdmin && (
                <Link to="/admin" className="btn btn-secondary">
                  Admin Dashboard
                </Link>
              )}

              {/*<button onClick={handleMakeAdmin}>
                Make kkibetkkoir@gmail.com Admin
              </button>*/}
            </div>
          ) : (
            <div className="hero-buttons">
              <Link to="/register" className="btn btn-primary">
                Get Started Free
              </Link>
              <Link to="/login" className="btn btn-secondary">
                Login
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Why Choose PowerKing Tips?</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">🎯</div>
            <h3>85%+ Accuracy</h3>
            <p>
              Our expert analysis delivers consistently accurate predictions
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>Real-Time Alerts</h3>
            <p>Get instant notifications for live matches and results</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Expert Analysis</h3>
            <p>Detailed statistics and insights from professional tipsters</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💎</div>
            <h3>VIP Access</h3>
            <p>Exclusive premium tips with higher odds and better returns</p>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-container">
          <div className="stat-item">
            <span className="stat-number">85%</span>
            <span className="stat-label">Success Rate</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Active Users</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">500+</span>
            <span className="stat-label">Daily Tips</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">98%</span>
            <span className="stat-label">Satisfaction</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Start Winning?</h2>
          <p>
            Join thousands of users who trust PowerKing Tips for their daily
            predictions
          </p>
          {currentUser ? (
            <Link to="/tips" className="btn btn-primary">
              View Today's Tips
            </Link>
          ) : (
            <Link to="/register" className="btn btn-primary">
              Create Free Account
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
