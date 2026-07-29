import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { userService } from '../../services/firestore.service';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import emailService from '../../services/email.service';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader';
import AppHelmet from '../../components/AppHelmet';
import '../../styles/EmailApp.scss';

const FEATURES = [
  {
    icon: '📊',
    name: 'Enhanced Analytics Dashboard',
    description:
      'View detailed statistics, win rates, and performance metrics for all your bets.',
    new: true,
  },
  {
    icon: '🔔',
    name: 'Real-Time Match Alerts',
    description:
      'Get instant notifications for live matches, goal alerts, and result updates.',
    new: true,
  },
  {
    icon: '💳',
    name: 'Multiple Payment Options',
    description: 'Now pay with M-Pesa, PayPal, Cryptocurrency, and Google Pay.',
    new: true,
  },
  {
    icon: '📱',
    name: 'Mobile App Improvements',
    description:
      'Faster loading, better navigation, and offline access to predictions.',
    new: false,
    updated: true,
  },
];

export default function SendNewFeatureEmail() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    successCount: 0,
    failCount: 0,
  });
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState(null);

  const debouncedSearch = useDebounce(searchQuery, 500);
  const isInitialLoadDone = useRef(false);
  const currentFilter = useRef(filter);
  const currentSearch = useRef(debouncedSearch);

  // Load users function
  const loadUsers = useCallback(
    async (reset = false) => {
      if (!isAdmin) return;

      setLoading(true);

      const filters = {};
      if (filter === 'premium') filters.isPremium = true;
      if (filter === 'free') filters.isPremium = false;

      try {
        const result = await userService.getAllUsers(
          1,
          50,
          filters,
          reset ? null : lastDoc,
          debouncedSearch
        );

        if (reset) {
          setUsers(result.users);
          setSelectedUsers([]);
        } else {
          setUsers((prev) => [...prev, ...result.users]);
        }

        setHasMore(result.hasMore);
        setLastDoc(result.lastDoc);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    },
    [isAdmin, filter, debouncedSearch, lastDoc]
  );

  useEffect(() => {
    if (isAdmin && !isInitialLoadDone.current) {
      isInitialLoadDone.current = true;
      loadUsers(true);
    }
  }, [isAdmin, loadUsers]);

  useEffect(() => {
    if (!isInitialLoadDone.current) return;

    if (
      currentFilter.current !== filter ||
      currentSearch.current !== debouncedSearch
    ) {
      currentFilter.current = filter;
      currentSearch.current = debouncedSearch;
      setLastDoc(null);
      loadUsers(true);
    }
  }, [filter, debouncedSearch, loadUsers]);

  const loadMore = () => {
    if (!loading && hasMore) {
      loadUsers(false);
    }
  };

  const displayedUsers = useMemo(() => {
    if (!debouncedSearch) return users;
    const search = debouncedSearch.toLowerCase();
    return users.filter(
      (user) =>
        user.email?.toLowerCase().includes(search) ||
        user.username?.toLowerCase().includes(search)
    );
  }, [users, debouncedSearch]);

  const allSelected = useMemo(() => {
    if (displayedUsers.length === 0) return false;
    return displayedUsers.every((user) => selectedUsers.includes(user.email));
  }, [displayedUsers, selectedUsers]);

  const handleSelectAll = useCallback(() => {
    if (allSelected) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(displayedUsers.map((user) => user.email));
    }
  }, [allSelected, displayedUsers]);

  const handleSelectUser = useCallback((email) => {
    setSelectedUsers((prev) => {
      if (prev.includes(email)) {
        return prev.filter((e) => e !== email);
      } else {
        return [...prev, email];
      }
    });
  }, []);

  const handleSendEmails = useCallback(async () => {
    if (selectedUsers.length === 0) {
      Swal.fire({
        title: 'No Users Selected',
        text: 'Please select at least one user to send emails.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Send New Features Email',
      html: `
        <div style="text-align: center;">
          <p>Send <strong>"New Features Available!"</strong> email to:</p>
          <p style="font-size: 24px; font-weight: bold; color: #00ae58;">${
            selectedUsers.length
          } user(s)</p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; margin: 10px 0; text-align: left;">
            ${FEATURES.map(
              (f) =>
                `<p>${f.icon} ${f.name} ${f.new ? '🆕' : ''} ${
                  f.updated ? '🔄' : ''
                }</p>`
            ).join('')}
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#00ae58',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, Send Now!',
      cancelButtonText: 'Cancel',
    });

    if (!confirm.isConfirmed) return;

    setSending(true);
    const usersToSend = displayedUsers.filter((user) =>
      selectedUsers.includes(user.email)
    );

    const result = await emailService.sendBulkEmails(
      usersToSend,
      (user) => emailService.sendFeatureEmail(user),
      (progress) => setProgress(progress)
    );

    setSending(false);

    let failedMessage = '';
    if (result.failCount > 0) {
      failedMessage = `<p style="color: #d33; margin-top: 10px;">❌ Failed: ${result.failedUsers
        .slice(0, 3)
        .join(', ')}${
        result.failCount > 3 ? ` + ${result.failCount - 3} more` : ''
      }</p>`;
    }

    Swal.fire({
      title: 'Email Campaign Complete',
      html: `
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">📧</div>
          <p>✅ Successfully sent: <strong style="color: #00ae58;">${result.successCount}</strong></p>
          <p>❌ Failed: <strong style="color: #d33;">${result.failCount}</strong></p>
          <p>📊 Total: <strong>${usersToSend.length}</strong></p>
          ${failedMessage}
        </div>
      `,
      icon: result.successCount > 0 ? 'success' : 'error',
      confirmButtonText: 'OK',
      confirmButtonColor: '#00ae58',
    });
  }, [selectedUsers, displayedUsers]);

  if (!isAdmin)
    return <div className="error-message">Access denied. Admin only.</div>;

  return (
    <div className="email-app">
      <AppHelmet title="Send Feature Email" location="/send-feature-email" />

      <div className="page-header">
        <h1>🚀 Send New Features Email</h1>
        <p>Notify users about the latest features and improvements</p>
      </div>

      <div className="email-container">
        {/* Email Preview Section */}
        <div className="email-preview-section">
          <h3 className="section-title">
            📧 Email Preview: New Features Available!
          </h3>

          <div className="preview-card">
            <div className="preview-header">🚀 New Features Available!</div>
            <div className="preview-body">
              {FEATURES.map((feature, index) => (
                <div
                  key={index}
                  style={{
                    padding: '12px',
                    margin: '8px 0',
                    background: 'var(--lite)',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--blue)',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>{feature.icon}</span>
                    <div>
                      <strong>{feature.name}</strong>
                      {feature.new && (
                        <span
                          style={{
                            background: 'var(--gradient-primary)',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            marginLeft: '8px',
                          }}
                        >
                          NEW
                        </span>
                      )}
                      {feature.updated && (
                        <span
                          style={{
                            background: '#ff9800',
                            color: 'white',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '10px',
                            marginLeft: '8px',
                          }}
                        >
                          UPDATED
                        </span>
                      )}
                      <p
                        style={{
                          fontSize: '13px',
                          color: 'var(--grey)',
                          marginTop: '4px',
                        }}
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}

              <hr />
              <p>
                <strong>Template Variables:</strong>
              </p>
              <ul className="variable-list">
                <li>
                  <code>{'{{username}}'}</code> - User's name
                </li>
                <li>
                  <code>{'{{email}}'}</code> - User's email
                </li>
                <li>
                  <code>{'{{dashboardLink}}'}</code> - Dashboard URL
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* User Selection Section */}
        <div className="user-selection-section">
          <div className="selection-header">
            <div className="filters">
              <input
                type="search"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              >
                <option value="all">All Users</option>
                <option value="premium">⭐ Premium Users</option>
                <option value="free">🔓 Free Users</option>
              </select>
            </div>

            <div className="selection-actions">
              <label className="select-all">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={handleSelectAll}
                  disabled={displayedUsers.length === 0}
                />
                <span>Select All ({displayedUsers.length})</span>
              </label>
              <span className="selected-count">
                Selected: {selectedUsers.length} users
              </span>
            </div>
          </div>

          {loading && users.length === 0 ? (
            <Loader />
          ) : (
            <>
              <div className="users-list">
                {displayedUsers.map((user) => (
                  <label key={user.email} className="user-item">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.email)}
                      onChange={() => handleSelectUser(user.email)}
                    />
                    <div className="user-avatar">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                          user.username || user.email
                        )}&background=00BFFF&color=fff`}
                        alt=""
                      />
                    </div>
                    <div className="user-info">
                      <span className="user-name">
                        {user.username || user.email?.split('@')[0]}
                      </span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    {user.isPremium && (
                      <span className="vip-badge">⭐ VIP</span>
                    )}
                  </label>
                ))}
              </div>

              {hasMore && !loading && displayedUsers.length > 0 && (
                <div className="load-more">
                  <button className="btn" onClick={loadMore}>
                    Load More Users
                  </button>
                </div>
              )}
            </>
          )}

          {sending && (
            <div className="progress-section">
              <div className="progress-info">
                Sending... ({progress.current} / {progress.total}) | ✅{' '}
                {progress.successCount} | ❌ {progress.failCount}
              </div>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          <div className="action-buttons">
            <button
              className="btn send-btn primary"
              onClick={handleSendEmails}
              disabled={sending || selectedUsers.length === 0}
            >
              {sending
                ? 'Sending...'
                : `🚀 Send to ${selectedUsers.length} User(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
