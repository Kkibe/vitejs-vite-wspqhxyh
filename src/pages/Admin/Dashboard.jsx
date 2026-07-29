import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import AppHelmet from '../../components/AppHelmet';
import '../../styles/EmailApp.scss';

const adminCards = [
  {
    path: '/send-tips-email',
    icon: '⚽',
    title: 'Send Tips Email',
    description: 'Send "Today\'s Tips Are Live" to users',
    color: '#00ae58',
  },
  {
    path: '/send-feature-email',
    icon: '🚀',
    title: 'New Features Email',
    description: 'Notify users about latest features',
    color: '#2196f3',
  },
  {
    path: '/send-vip-email',
    icon: '🎁',
    title: 'Free VIP Offer',
    description: 'Send 7-day free VIP access offer',
    color: '#ff9800',
  },
  {
    path: '/send-custom-email',
    icon: '✏️',
    title: 'Custom Email',
    description: 'Create and send custom HTML emails',
    color: '#7c4dff',
  },
  {
    path: '/users',
    icon: '👥',
    title: 'Manage Users',
    description: 'View and manage all registered users',
    color: '#00bcd4',
  },
  {
    path: '/admin/tips',
    icon: '📊',
    title: 'Manage Tips',
    description: 'Add, edit, or delete tips',
    color: '#e91e63',
  },
];

export default function AdminDashboard() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <div className="error-message">Access denied. Admin only.</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <AppHelmet title="Admin Dashboard" location="/admin" />

      <div className="page-header">
        <h1>🛡️ Admin Dashboard</h1>
        <p>Manage your email campaigns and content</p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '20px',
          marginTop: '30px',
        }}
      >
        {adminCards.map((card) => (
          <Link
            key={card.path}
            to={card.path}
            style={{
              background: 'var(--lite)',
              borderRadius: '16px',
              padding: '25px',
              boxShadow: 'var(--card-shadow)',
              textDecoration: 'none',
              color: 'var(--dark)',
              transition: 'var(--transition-smooth)',
              borderLeft: `4px solid ${card.color}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = 'var(--card-hover-shadow)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'var(--card-shadow)';
            }}
          >
            <div style={{ fontSize: '32px', marginBottom: '10px' }}>
              {card.icon}
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '8px',
              }}
            >
              {card.title}
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--grey)' }}>
              {card.description}
            </p>
          </Link>
        ))}
      </div>
    </div>
  );
}
