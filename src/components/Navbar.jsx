import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/auth.service';
import './Navbar.scss';

export default function Navbar() {
  const { currentUser, isAdmin, userData } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await authService.logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">PowerKing Tips</span>
        </Link>

        <div className="navbar-menu">
          <Link to="/" className="nav-link">
            Home
          </Link>

          {currentUser && isAdmin && (
            <>
              <Link to="/admin" className="nav-link admin-link">
                Admin
              </Link>
              <Link to="/users" className="nav-link">
                Users
              </Link>
            </>
          )}

          {currentUser ? (
            <div className="nav-user">
              <span className="user-email">
                {userData?.username || currentUser.email?.split('@')[0]}
              </span>
              {userData?.isPremium && <span className="vip-badge">⭐ VIP</span>}
              {isAdmin && <span className="admin-badge">🛡️ Admin</span>}
              <button onClick={handleLogout} className="btn logout-btn">
                Logout
              </button>
            </div>
          ) : (
            <div className="nav-auth">
              <Link to="/login" className="btn btn-login">
                Login
              </Link>
              <Link to="/register" className="btn btn-register">
                Register
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
