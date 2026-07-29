import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { HelmetProvider } from 'react-helmet-async';

// Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';
import AppHelmet from './components/AppHelmet';

// Lazy load pages
const Home = lazy(() => import('./pages/Home'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Admin pages
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const ListUsers = lazy(() => import('./pages/Admin/ListUsers'));
const SendTipsEmail = lazy(() => import('./pages/Admin/SendTipsEmail'));
const SendNewFeatureEmail = lazy(() =>
  import('./pages/Admin/SendNewFeatureEmail')
);
const SendFreeVIPEmail = lazy(() => import('./pages/Admin/SendFreeVIPEmail'));
const SendCustomEmail = lazy(() => import('./pages/Admin/SendCustomEmail'));

// Firebase config
import './config/firebase';
import './styles/App.scss';

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { currentUser, isAdmin, loading } = useAuth();

  if (loading) return <Loader />;
  if (!currentUser) return <Navigate to="/login" replace />;
  if (adminOnly && !isAdmin) return <Navigate to="/" replace />;

  return children;
};

function App() {
  return (
    <HelmetProvider>
      <div className="App">
        <Navbar />
        <main>
          <Suspense fallback={<Loader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/users"
                element={
                  <ProtectedRoute adminOnly>
                    <ListUsers />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send-tips-email"
                element={
                  <ProtectedRoute adminOnly>
                    <SendTipsEmail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send-feature-email"
                element={
                  <ProtectedRoute adminOnly>
                    <SendNewFeatureEmail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send-vip-email"
                element={
                  <ProtectedRoute adminOnly>
                    <SendFreeVIPEmail />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/send-custom-email"
                element={
                  <ProtectedRoute adminOnly>
                    <SendCustomEmail />
                  </ProtectedRoute>
                }
              />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </div>
    </HelmetProvider>
  );
}

export default App;
