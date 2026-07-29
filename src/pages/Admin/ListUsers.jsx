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
import Loader from '../../components/Loader';
import AppHelmet from '../../components/AppHelmet';
import './ListUsers.scss';

export default function ListUsers() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [lastDoc, setLastDoc] = useState(null);
  const [pageSize] = useState(50);

  const debouncedSearch = useDebounce(searchQuery, 300);
  const isInitialMount = useRef(true);

  const fetchUsers = useCallback(
    async (isNewFilter = false) => {
      if (!isAdmin) return;

      setLoading(true);
      const filters = {};
      if (filter === 'premium') filters.isPremium = true;
      if (filter === 'free') filters.isPremium = false;

      const currentLastDoc = isNewFilter ? null : lastDoc;

      const result = await userService.getAllUsers(
        page,
        pageSize,
        filters,
        currentLastDoc,
        debouncedSearch
      );

      if (isNewFilter || page === 1) {
        setUsers(result.users);
      } else {
        setUsers((prev) => [...prev, ...result.users]);
      }
      setHasMore(result.hasMore);
      setLastDoc(result.lastDoc);
      setLoading(false);
    },
    [pageSize, page, filter, isAdmin, lastDoc, debouncedSearch]
  );

  // Reset pagination when filter changes
  useEffect(() => {
    if (isAdmin && !isInitialMount.current) {
      setPage(1);
      setLastDoc(null);
      fetchUsers(true);
    }
    isInitialMount.current = false;
  }, [debouncedSearch, filter, isAdmin, fetchUsers]);

  // Fetch users when page changes
  useEffect(() => {
    if (isAdmin && page > 1) {
      fetchUsers(false);
    }
  }, [page, isAdmin, fetchUsers]);

  // Initial load
  useEffect(() => {
    if (isAdmin) {
      setPage(1);
      setLastDoc(null);
      fetchUsers(true);
    }
  }, [isAdmin, fetchUsers]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  if (!isAdmin)
    return <div className="error-message">Access denied. Admin only.</div>;

  return (
    <div className="list-users">
      <AppHelmet title="Manage Users" location="/users" />

      <div className="page-header">
        <h1>👥 Manage Users</h1>
        <p>View and manage all registered users</p>
      </div>

      <div className="header">
        <input
          type="search"
          placeholder="Search by username or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="all">All Users</option>
          <option value="premium">⭐ Premium Users</option>
          <option value="free">🔓 Free Users</option>
        </select>
        <span className="user-count">{users.length} users</span>
      </div>

      <div className="users-grid">
        {users.map((user) => (
          <div key={user.email} className="user-card">
            <div className="user-avatar">
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                  user.username || user.email
                )}&background=00BFFF&color=fff&size=60`}
                alt={user.username}
              />
            </div>
            <div className="user-info">
              <h3>{user.username || user.email?.split('@')[0]}</h3>
              <p className="user-email">{user.email}</p>
              <div className="user-badges">
                {user.isPremium && <span className="badge vip">⭐ VIP</span>}
                {user.isAdmin && <span className="badge admin">🛡️ Admin</span>}
                {user.subscription && (
                  <span className="badge plan">{user.subscription}</span>
                )}
              </div>
              <div className="user-meta">
                <span>
                  Joined:{' '}
                  {user.createdAt?.toDate?.()?.toLocaleDateString() || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {loading && <Loader />}

      {hasMore && !loading && users.length > 0 && (
        <div className="load-more">
          <button className="btn" onClick={loadMore}>
            Load More Users
          </button>
        </div>
      )}

      {users.length === 0 && !loading && (
        <div className="no-results">No users found matching your criteria</div>
      )}
    </div>
  );
}
