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

export default function SendCustomEmail() {
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

  // Custom email fields
  const [subject, setSubject] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [attachments, setAttachments] = useState([]);
  const [previewMode, setPreviewMode] = useState('desktop');

  const debouncedSearch = useDebounce(searchQuery, 500);
  const isInitialLoadDone = useRef(false);
  const currentFilter = useRef(filter);
  const currentSearch = useRef(debouncedSearch);

  // Sample HTML template
  const defaultHtml = `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #00ae58 0%, #007a37 100%); padding: 30px 20px; text-align: center; }
    .logo { font-size: 28px; font-weight: bold; color: #ffffff; }
    .content { padding: 30px; }
    .btn { display: inline-block; background: linear-gradient(135deg, #00ae58 0%, #007a37 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 25px; }
    .footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">⚡ PowerKing Tips</div>
    </div>
    <div class="content">
      <h2>Hello {{username}},</h2>
      <p>This is a custom email from PowerKing Tips.</p>
      <p>Add your custom content here...</p>
      <a href="https://powerking-tips.onrender.com" class="btn">Visit Website</a>
    </div>
    <div class="footer">
      <p>© 2024 PowerKing Tips. All rights reserved.</p>
      <p><a href="{{unsubscribe_link}}" style="color: #00ae58;">Unsubscribe</a></p>
    </div>
  </div>
</body>
</html>`;

  useEffect(() => {
    setHtmlContent(defaultHtml);
    setSubject('Custom Email from PowerKing Tips');
  }, []);

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

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newAttachments = files.map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file,
    }));
    setAttachments((prev) => [...prev, ...newAttachments]);
  };

  const removeAttachment = (index) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

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

    if (!htmlContent.trim()) {
      Swal.fire({
        title: 'Empty Content',
        text: 'Please add HTML content for the email.',
        icon: 'warning',
        confirmButtonText: 'OK',
      });
      return;
    }

    const confirm = await Swal.fire({
      title: 'Send Custom Email',
      html: `
        <div style="text-align: center;">
          <p>Send custom email to:</p>
          <p style="font-size: 24px; font-weight: bold; color: #7c4dff;">${
            selectedUsers.length
          } user(s)</p>
          <p style="font-size: 14px; color: #666;">Subject: <strong>${
            subject || 'No subject'
          }</strong></p>
          <p style="font-size: 14px; color: #666;">Attachments: <strong>${
            attachments.length
          }</strong></p>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#7c4dff',
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
      (user) =>
        emailService.sendCustomEmail(user, htmlContent, subject, attachments),
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
      confirmButtonColor: '#7c4dff',
    });
  }, [selectedUsers, displayedUsers, htmlContent, subject, attachments]);

  if (!isAdmin)
    return <div className="error-message">Access denied. Admin only.</div>;

  return (
    <div className="email-app">
      <AppHelmet title="Send Custom Email" location="/send-custom-email" />

      <div className="page-header">
        <h1>✏️ Send Custom Email</h1>
        <p>Create and send custom HTML emails with attachments</p>
      </div>

      <div
        style={{
          display: 'grid',
          gap: '30px',
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        {/* Email Editor Section */}
        <div
          style={{
            background: 'var(--lite)',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '15px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <h3 style={{ fontSize: '18px', fontWeight: '600' }}>
              📝 Email Editor
            </h3>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <button
                className={`btn ${previewMode === 'desktop' ? 'primary' : ''}`}
                onClick={() => setPreviewMode('desktop')}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                💻 Desktop
              </button>
              <button
                className={`btn ${previewMode === 'mobile' ? 'primary' : ''}`}
                onClick={() => setPreviewMode('mobile')}
                style={{ padding: '6px 12px', fontSize: '12px' }}
              >
                📱 Mobile
              </button>
            </div>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <input
              type="text"
              placeholder="Email Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={{
                width: '100%',
                padding: '12px 15px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                fontSize: '14px',
                transition: 'var(--transition-smooth)',
              }}
            />
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '20px',
            }}
          >
            {/* HTML Editor */}
            <div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '10px',
                }}
              >
                <label style={{ fontWeight: '600', fontSize: '14px' }}>
                  HTML Content
                </label>
                <button
                  className="btn"
                  onClick={() => setHtmlContent(defaultHtml)}
                  style={{ padding: '4px 12px', fontSize: '11px' }}
                >
                  Reset Template
                </button>
              </div>
              <textarea
                value={htmlContent}
                onChange={(e) => setHtmlContent(e.target.value)}
                style={{
                  width: '100%',
                  height: '400px',
                  padding: '12px',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  resize: 'vertical',
                  transition: 'var(--transition-smooth)',
                }}
                placeholder="Paste your HTML email template here..."
              />
            </div>

            {/* Preview */}
            <div>
              <label
                style={{
                  fontWeight: '600',
                  fontSize: '14px',
                  display: 'block',
                  marginBottom: '10px',
                }}
              >
                Preview
              </label>
              <div
                style={{
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  height: '400px',
                  background: '#f5f5f5',
                  padding: '10px',
                  maxWidth: previewMode === 'mobile' ? '375px' : '100%',
                  margin: previewMode === 'mobile' ? '0 auto' : '0',
                }}
              >
                <div
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    height: '100%',
                    overflowY: 'auto',
                  }}
                >
                  <div
                    dangerouslySetInnerHTML={{
                      __html: htmlContent
                        .replace(/\{\{username\}\}/g, 'John Doe')
                        .replace(/\{\{email\}\}/g, 'john@example.com')
                        .replace(/\{\{unsubscribe_link\}\}/g, '#'),
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div style={{ marginTop: '20px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '15px',
                flexWrap: 'wrap',
              }}
            >
              <label style={{ fontWeight: '600', fontSize: '14px' }}>
                Attachments:
              </label>
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ fontSize: '13px' }}
              />
              <span style={{ fontSize: '13px', color: 'var(--grey)' }}>
                {attachments.length} file(s) uploaded
              </span>
            </div>
            {attachments.length > 0 && (
              <div
                style={{
                  marginTop: '10px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '8px',
                }}
              >
                {attachments.map((att, index) => (
                  <div
                    key={index}
                    style={{
                      background: '#f5f5f5',
                      padding: '4px 12px',
                      borderRadius: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      fontSize: '13px',
                    }}
                  >
                    <span>📎 {att.name}</span>
                    <button
                      onClick={() => removeAttachment(index)}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#d33',
                        cursor: 'pointer',
                        fontSize: '16px',
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* User Selection Section */}
        <div
          style={{
            background: 'var(--lite)',
            borderRadius: '20px',
            padding: '25px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
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
                        )}&background=7c4dff&color=fff`}
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
              className="btn send-btn custom"
              onClick={handleSendEmails}
              disabled={
                sending || selectedUsers.length === 0 || !htmlContent.trim()
              }
            >
              {sending
                ? 'Sending...'
                : `✉️ Send Custom Email to ${selectedUsers.length} User(s)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
