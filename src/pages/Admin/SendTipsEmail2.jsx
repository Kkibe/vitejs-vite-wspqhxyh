// pages/Admin/SendTipsEmail.jsx

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
import Loader from '../../components/Loader/Loader';
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

  // Build the HTML table for tips
  const buildTipsTableHTML = (tips, isPremium = false) => {
    if (!tips || tips.length === 0) return '';

    const badgeClass = isPremium ? 'premium-badge' : 'free-badge';
    const badgeText = isPremium ? '⭐ VIP' : 'Free';

    let rows = '';
    tips.forEach((tip) => {
      rows += `
        <tr>
          <td>
            <strong>${tip.home || 'Team A'} vs ${tip.away || 'Team B'}</strong>
            <br />
            <span class="match-time">🏆 ${tip.league || 'Major League'} • ⏰ ${
        tip.time || 'TBD'
      }</span>
          </td>
          <td>${tip.pick || 'Home Win'}</td>
          <td><strong>${tip.odd || '1.00'}</strong></td>
          <td><span class="${badgeClass}">${badgeText}</span></td>
        </tr>
      `;
    });

    return `
      <table class="tips-table">
        <thead>
          <tr>
            <th>Match</th>
            <th>Tip</th>
            <th>Odds</th>
            <th>Type</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    `;
  };

  // Build the complete HTML email
  const buildEmailHTML = (user, tipsData, isUserPremium) => {
    const formattedDate = new Date(emailDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const freeTipsHTML =
      tipsData.freeTips && tipsData.freeTips.length > 0
        ? `
        <h3>🔥 Free Predictions</h3>
        ${buildTipsTableHTML(tipsData.freeTips, false)}
      `
        : '';

    const premiumTipsHTML =
      isUserPremium && tipsData.premiumTips && tipsData.premiumTips.length > 0
        ? `
        <h3>⭐ VIP Exclusive Predictions</h3>
        ${buildTipsTableHTML(tipsData.premiumTips, true)}
      `
        : '';

    const upgradeSectionHTML =
      !isUserPremium && tipsData.hasVipTips
        ? `
        <div class="vip-upgrade">
          <strong>💎 Unlock VIP Predictions</strong>
          <p>Get access to <strong>${
            tipsData.vipTipsCount
          }</strong> premium tips with higher odds and better returns.</p>
          <a href="${'https://powerking-tips.onrender.com/pay'}" class="btn btn-dark">⭐ Upgrade to VIP →</a>
        </div>
      `
        : '';

    const premiumBanner = isUserPremium
      ? `<div class="premium-banner">⭐ PREMIUM MEMBER - Full Access ⭐</div>`
      : '';

    // Build the full HTML
    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Today's Tips - PowerKing Tips</title>
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #00ae58 0%, #007a37 100%);
      padding: 30px 20px;
      text-align: center;
      position: relative;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #ffffff;
      text-decoration: none;
    }
    .premium-banner {
      background: rgba(255, 215, 0, 0.2);
      border: 1px solid #ffd700;
      border-radius: 8px;
      padding: 10px 15px;
      margin-top: 15px;
      display: inline-block;
      color: #ffd700;
      font-weight: bold;
      font-size: 14px;
    }
    .content {
      padding: 30px;
    }
    .content h2 {
      color: #00ae58;
      margin-top: 0;
      font-size: 24px;
    }
    .content h3 {
      color: #333;
      margin-top: 25px;
      font-size: 18px;
    }
    .content p {
      color: #333;
      line-height: 1.6;
    }
    .tips-table {
      width: 100%;
      border-collapse: collapse;
      margin: 15px 0;
      font-size: 14px;
    }
    .tips-table th {
      background: #00ae58;
      color: white;
      padding: 12px 10px;
      text-align: left;
      font-weight: 600;
    }
    .tips-table td {
      padding: 10px;
      border-bottom: 1px solid #eee;
      color: #333;
    }
    .tips-table tr:nth-child(even) {
      background: #f9f9f9;
    }
    .tips-table tr:hover {
      background: #f0f7f0;
    }
    .premium-badge {
      background: #ffd700;
      color: #333;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      display: inline-block;
    }
    .free-badge {
      background: #e0e0e0;
      color: #666;
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: bold;
      display: inline-block;
    }
    .match-time {
      font-size: 11px;
      color: #888;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 15px;
      margin: 20px 0;
      background: #f5f5f5;
      padding: 20px;
      border-radius: 12px;
    }
    .stat-item {
      text-align: center;
    }
    .stat-value {
      font-size: 28px;
      font-weight: bold;
      color: #00ae58;
    }
    .stat-label {
      font-size: 12px;
      color: #888;
      margin-top: 4px;
    }
    .btn {
      display: inline-block;
      background: linear-gradient(135deg, #00ae58 0%, #007a37 100%);
      color: white !important;
      padding: 12px 30px;
      text-decoration: none !important;
      border-radius: 25px;
      margin: 10px 5px;
      font-weight: 600;
      text-align: center;
    }
    .btn-dark {
      background: #333;
    }
    .vip-upgrade {
      background: linear-gradient(135deg, #ffd700, #ffa500);
      padding: 25px;
      border-radius: 12px;
      text-align: center;
      margin: 25px 0;
    }
    .vip-upgrade strong {
      font-size: 18px;
      color: #333;
    }
    .vip-upgrade p {
      color: #555;
      margin: 10px 0;
    }
    .vip-upgrade .btn {
      background: #333;
      margin-top: 10px;
    }
    .footer {
      background: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #666;
    }
    .footer a {
      color: #00ae58;
      text-decoration: none;
    }
    .pro-tip-box {
      background: #e8f5e9;
      border-left: 4px solid #00ae58;
      padding: 15px 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .pro-tip-box strong {
      color: #00ae58;
    }
    .no-tips {
      text-align: center;
      padding: 30px;
      color: #888;
      background: #f9f9f9;
      border-radius: 8px;
    }
    .text-center {
      text-align: center;
    }
    .mt-20 {
      margin-top: 20px;
    }
    @media (max-width: 480px) {
      .tips-table {
        font-size: 12px;
      }
      .tips-table th,
      .tips-table td {
        padding: 8px 6px;
      }
      .stats-grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        padding: 15px;
      }
      .content {
        padding: 20px;
      }
      .btn {
        padding: 10px 20px;
        font-size: 14px;
        display: block;
        text-align: center;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <div class="logo">⚡ PowerKing Tips</div>
      ${premiumBanner}
    </div>

    <!-- Content -->
    <div class="content">
      <h2>⚽ Today's Tips Are Live!</h2>
      <p>Hello ${
        user.username || user.email?.split('@')[0] || 'Valued Member'
      },</p>
      <p>
        Our expert analysts have posted today's betting tips for 
        <strong>${formattedDate}</strong>.
      </p>

      <!-- Stats Summary -->
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-value">${tipsData.totalTips || 0}</div>
          <div class="stat-label">🎯 Predictions</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${tipsData.todayMatches || 0}</div>
          <div class="stat-label">⚽ Matches</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${tipsData.avgOdds || '1.5'}</div>
          <div class="stat-label">💰 Avg Odds</div>
        </div>
        <div class="stat-item">
          <div class="stat-value">${tipsData.confidenceRate || 85}%</div>
          <div class="stat-label">📈 Confidence</div>
        </div>
      </div>

      <!-- Free Tips -->
      ${freeTipsHTML}

      <!-- Premium Tips (Only for premium users) -->
      ${premiumTipsHTML}

      <!-- Upgrade Section (For free users) -->
      ${upgradeSectionHTML}

      <!-- Pro Tip -->
      <div class="pro-tip-box">
        <strong>💡 Pro Tip:</strong> ${
          tipsData.proTip || 'Always compare odds across multiple bookmakers'
        }
      </div>

      <!-- View All Tips Button -->
      <div class="text-center mt-20">
        <a href="${'https://powerking-tips.onrender.com/tips'}" class="btn">📊 View All Tips →</a>
      </div>

      <p class="text-center" style="color: #666; font-style: italic; margin-top: 20px;">
        Best of luck with your bets!<br />
        <strong>The PowerKing Tips Team 🏆</strong>
      </p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p>© ${new Date().getFullYear()} PowerKing Tips. All rights reserved.</p>
      <p>
        <a href="${
          'https://powerking-tips.onrender.com/unsubscribe/' + user.email
        }">Unsubscribe</a> from daily tips
      </p>
    </div>
  </div>
</body>
</html>
    `;
  };

  // Fetch today's tips data
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
          : '1.5';

      const uniqueMatches = new Set(
        allTips.map((tip) => `${tip.home}_${tip.away}`)
      ).size;

      setTipsData({
        totalTips: allTips.length,
        vipTipsCount: premiumTips.length,
        freeTipsCount: freeTips.length,
        todayMatches: uniqueMatches,
        avgOdds: avgOdds,
        confidenceRate: 92,
        hasVipTips: premiumTips.length > 0,
        freeTips: freeTips.slice(0, 10),
        premiumTips: premiumTips.slice(0, 10),
        proTip: PRO_TIPS[Math.floor(Math.random() * PRO_TIPS.length)],
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
        freeTips: [],
        premiumTips: [],
        proTip: PRO_TIPS[0],
      });
    } finally {
      setLoadingTips(false);
    }
  }, [emailDate]);

  useEffect(() => {
    if (isAdmin) {
      fetchTodaysTips();
    }
  }, [isAdmin, fetchTodaysTips]);

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
    let successCount = 0;
    let failCount = 0;
    const failedUsers = [];

    for (let i = 0; i < usersToSend.length; i++) {
      const user = usersToSend[i];
      const isUserPremium = user.isPremium === true;

      // Build the complete HTML for this user
      const htmlContent = buildEmailHTML(user, tipsData, isUserPremium);

      setProgress({
        current: i + 1,
        total: usersToSend.length,
        successCount,
        failCount,
      });

      try {
        // Send using email service with the pre-built HTML
        const result = await emailService.sendTipsEmailWithHTML(
          user,
          htmlContent
        );
        if (result.success) {
          successCount++;
          console.log(`✅ Successfully sent to ${user.email}`);
        } else {
          failCount++;
          failedUsers.push(user.email);
          console.error(`❌ Failed to send to ${user.email}:`, result.error);
        }
      } catch (error) {
        failCount++;
        failedUsers.push(user.email);
        console.error(`❌ Exception for ${user.email}:`, error);
      }

      // Delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    setSending(false);

    let failedMessage = '';
    if (failCount > 0) {
      failedMessage = `<p style="color: #d33; margin-top: 10px;">❌ Failed: ${failedUsers
        .slice(0, 3)
        .join(', ')}${failCount > 3 ? ` + ${failCount - 3} more` : ''}</p>`;
    }

    Swal.fire({
      title: 'Email Campaign Complete',
      html: `
        <div style="text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">📧</div>
          <p>✅ Successfully sent: <strong style="color: #00ae58;">${successCount}</strong></p>
          <p>❌ Failed: <strong style="color: #d33;">${failCount}</strong></p>
          <p>📊 Total: <strong>${usersToSend.length}</strong></p>
          ${failedMessage}
        </div>
      `,
      icon: successCount > 0 ? 'success' : 'error',
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
                <div
                  className="stats-grid"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                    gap: '15px',
                    margin: '15px 0',
                  }}
                >
                  <div className="stat-item" style={{ textAlign: 'center' }}>
                    <div
                      className="stat-value"
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#00ae58',
                      }}
                    >
                      {tipsData.totalTips}
                    </div>
                    <div
                      className="stat-label"
                      style={{ fontSize: '12px', color: '#888' }}
                    >
                      Total Tips
                    </div>
                  </div>
                  <div className="stat-item" style={{ textAlign: 'center' }}>
                    <div
                      className="stat-value"
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#00ae58',
                      }}
                    >
                      {tipsData.freeTipsCount}
                    </div>
                    <div
                      className="stat-label"
                      style={{ fontSize: '12px', color: '#888' }}
                    >
                      Free Tips
                    </div>
                  </div>
                  <div className="stat-item" style={{ textAlign: 'center' }}>
                    <div
                      className="stat-value"
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#ffd700',
                      }}
                    >
                      {tipsData.vipTipsCount}
                    </div>
                    <div
                      className="stat-label"
                      style={{ fontSize: '12px', color: '#888' }}
                    >
                      VIP Tips
                    </div>
                  </div>
                  <div className="stat-item" style={{ textAlign: 'center' }}>
                    <div
                      className="stat-value"
                      style={{
                        fontSize: '24px',
                        fontWeight: 'bold',
                        color: '#00ae58',
                      }}
                    >
                      {tipsData.avgOdds}
                    </div>
                    <div
                      className="stat-label"
                      style={{ fontSize: '12px', color: '#888' }}
                    >
                      Avg Odds
                    </div>
                  </div>
                </div>

                <hr />
                <p>
                  <strong>Email will be sent with:</strong>
                </p>
                <ul style={{ paddingLeft: '20px', margin: '10px 0' }}>
                  <li>✅ Complete HTML with formatted tables</li>
                  <li>✅ Different content for free vs premium users</li>
                  <li>✅ Upgrade section for free users (if VIP tips exist)</li>
                  <li>✅ Pro tips and stats summary</li>
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
                {progress.successCount || 0} | ❌ {progress.failCount || 0}
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
