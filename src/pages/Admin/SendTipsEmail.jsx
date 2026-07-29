import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { userService, tipsService } from '../../services/firestore.service';
import { useAuth } from '../../context/AuthContext';
import { useDebounce } from '../../hooks/useDebounce';
import emailService from '../../services/email.service';
import Swal from 'sweetalert2';
import Loader from '../../components/Loader';
import AppHelmet from '../../components/AppHelmet';
import '../../styles/EmailApp.scss';

// Pro tips collection
const PRO_TIPS = [
  'Compare odds across multiple bookmakers before placing your bet',
  'Never chase losses - stick to your betting strategy',
  'Focus on leagues you know well rather than betting randomly',
  'Keep a record of your bets to track your performance',
  'Bet with your head, not your heart - avoid bias towards favorite teams',
  'Consider bankroll management - never bet more than 5% on a single tip',
  'Look for value bets where odds are higher than actual probability',
  'Follow team news and injuries before placing bets',
];

export default function SendTipsEmail() {
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
  const [tipsData, setTipsData] = useState(null);
  const [loadingTips, setLoadingTips] = useState(false);
  const [emailDate, setEmailDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  const debouncedSearch = useDebounce(searchQuery, 500);
  const isInitialLoadDone = useRef(false);
  const currentFilter = useRef(filter);
  const currentSearch = useRef(debouncedSearch);

  // Fetch today's tips data for email preview
  const fetchTodaysTips = useCallback(async () => {
    setLoadingTips(true);
    try {
      const formattedDate = new Date(emailDate).toLocaleDateString('en-US');

      const freeTips = await tipsService.getTipsByDate(
        formattedDate,
        50,
        false
      );
      const premiumTips = await tipsService.getTipsByDate(
        formattedDate,
        50,
        true
      );

      const allTips = [...freeTips, ...premiumTips];

      const avgOdds =
        allTips.length > 0
          ? (
              allTips.reduce(
                (sum, tip) => sum + (parseFloat(tip.odd) || 0),
                0
              ) / allTips.length
            ).toFixed(1)
          : '2.5';

      const uniqueMatches = new Set(
        allTips.map((tip) => `${tip.home}_${tip.away}`)
      ).size;

      const leaguesMap = new Map();
      allTips.forEach((tip) => {
        const league = tip.league || 'Major League';
        if (!leaguesMap.has(league)) {
          leaguesMap.set(league, { matches: 0, predictions: 0 });
        }
        leaguesMap.get(league).matches++;
        leaguesMap.get(league).predictions++;
      });

      const topLeagues = Array.from(leaguesMap.entries())
        .map(([name, data]) => ({
          name,
          matchCount: data.matches,
          predictionCount: data.predictions,
        }))
        .slice(0, 3);

      setTipsData({
        totalTips: allTips.length,
        vipTipsCount: premiumTips.length,
        freeTipsCount: freeTips.length,
        todayMatches: uniqueMatches,
        avgOdds: avgOdds,
        confidenceRate: 92,
        hasVipTips: premiumTips.length > 0,
        topLeagues: topLeagues,
        proTip: PRO_TIPS[Math.floor(Math.random() * PRO_TIPS.length)],
        freeTips: freeTips.slice(0, 5),
        premiumTips: premiumTips.slice(0, 5),
      });
    } catch (error) {
      console.error('Error fetching tips:', error);
      setTipsData({
        totalTips: 0,
        vipTipsCount: 0,
        freeTipsCount: 0,
        todayMatches: 0,
        avgOdds: '0',
        confidenceRate: 0,
        hasVipTips: false,
        topLeagues: [],
        proTip: PRO_TIPS[0],
        freeTips: [],
        premiumTips: [],
      });
    } finally {
      setLoadingTips(false);
    }
  }, [emailDate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTodaysTips();
    }
  }, [isAdmin, fetchTodaysTips, emailDate]);

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

  // Initial load
  useEffect(() => {
    if (isAdmin && !isInitialLoadDone.current) {
      isInitialLoadDone.current = true;
      loadUsers(true);
    }
  }, [isAdmin, loadUsers]);

  // Handle filter or search changes
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

    if (!tipsData || tipsData.totalTips === 0) {
      Swal.fire({
        title: 'No Tips Available',
        text: `No tips found for ${new Date(
          emailDate
        ).toLocaleDateString()}. Please add tips first.`,
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const premiumCount = selectedUsers.filter((email) => {
      const user = users.find((u) => u.email === email);
      return user?.isPremium === true;
    }).length;

    const freeCount = selectedUsers.length - premiumCount;

    const confirm = await Swal.fire({
      title: 'Send Daily Tips Email',
      html: `
        <div style="text-align: center;">
          <p>Send <strong>"Today's Tips Are Live"</strong> email to:</p>
          <p style="font-size: 24px; font-weight: bold; color: #00ae58;">${selectedUsers.length} user(s)</p>
          <div style="background: #f5f5f5; padding: 10px; border-radius: 8px; margin: 10px 0;">
            <p>⭐ Premium: <strong>${premiumCount}</strong> (full tips)</p>
            <p>🔓 Free: <strong>${freeCount}</strong> (free tips + upgrade prompt)</p>
          </div>
          <p style="font-size: 12px; color: #666;">
            📧 ${tipsData.freeTipsCount} free tips • ${tipsData.vipTipsCount} VIP tips
          </p>
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
      (user) => emailService.sendTipsEmail(user, tipsData),
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
  }, [selectedUsers, displayedUsers, tipsData, emailDate, users]);

  if (!isAdmin)
    return <div className="error-message">Access denied. Admin only.</div>;

  return (
    <div className="email-app">
      <AppHelmet title="Send Tips Email" location="/send-tips-email" />

      <div className="page-header">
        <h1>⚽ Send Daily Tips Email</h1>
        <p>Send "Today's Tips Are Live" notification to selected users</p>
      </div>

      <div className="email-container">
        {/* Email Preview Section */}
        <div className="email-preview-section">
          <h3 className="section-title">
            📧 Email Preview: Today's Tips Are Live!
          </h3>

          <div
            style={{
              marginBottom: '15px',
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <label style={{ fontWeight: '600' }}>Tips Date:</label>
            <input
              type="date"
              value={emailDate}
              onChange={(e) => setEmailDate(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid #ddd',
                fontSize: '14px',
              }}
            />
            <button
              onClick={fetchTodaysTips}
              className="btn"
              style={{ padding: '8px 16px', fontSize: '13px' }}
            >
              Refresh
            </button>
          </div>

          {loadingTips ? (
            <Loader />
          ) : tipsData && tipsData.totalTips > 0 ? (
            <div className="preview-card">
              <div className="preview-header">
                📊 Summary for {new Date(emailDate).toLocaleDateString()}
              </div>
              <div className="preview-body">
                <div className="stats-grid">
                  <div className="stat-item">
                    <div className="stat-value">{tipsData.totalTips}</div>
                    <div className="stat-label">Total Tips</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{tipsData.freeTipsCount}</div>
                    <div className="stat-label">Free Tips</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{tipsData.vipTipsCount}</div>
                    <div className="stat-label">VIP Tips</div>
                  </div>
                  <div className="stat-item">
                    <div className="stat-value">{tipsData.avgOdds}</div>
                    <div className="stat-label">Avg Odds</div>
                  </div>
                </div>

                <hr />
                <p>
                  <strong>Template Variables:</strong>
                </p>
                <ul className="variable-list">
                  <li>
                    <code>{'{{username}}'}</code> - User's name
                  </li>
                  <li>
                    <code>{'{{date}}'}</code> - Today's date
                  </li>
                  <li>
                    <code>{'{{total_tips}}'}</code> - Total tips count
                  </li>
                  <li>
                    <code>{'{{free_tips_json}}'}</code> - JSON of free tips
                  </li>
                  <li>
                    <code>{'{{premium_tips_json}}'}</code> - JSON of VIP tips
                  </li>
                  <li>
                    <code>{'{{is_premium}}'}</code> - true/false for premium
                    users
                  </li>
                  <li>
                    <code>{'{{has_vip_tips}}'}</code> - true/false if VIP tips
                    exist
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="preview-card">
              <div className="preview-body" style={{ color: '#d33' }}>
                ⚠️ No tips available for{' '}
                {new Date(emailDate).toLocaleDateString()}
              </div>
            </div>
          )}
        </div>

        {/* User Selection Section */}
        <div className="user-selection-section">
          <div className="selection-header">
            <div className="filters">
              <input
                type="search"
                placeholder="Search users by email or username..."
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
                    {user.subscription && user.isPremium && (
                      <span className="plan-badge">{user.subscription}</span>
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
              className="btn send-btn success"
              onClick={handleSendEmails}
              disabled={
                sending ||
                selectedUsers.length === 0 ||
                loadingTips ||
                !tipsData ||
                tipsData.totalTips === 0
              }
            >
              {sending
                ? 'Sending...'
                : `⚽ Send Tips to ${selectedUsers.length} User(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
