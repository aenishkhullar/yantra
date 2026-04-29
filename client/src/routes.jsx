import React, { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import AppLayout from './components/layout/AppLayout';
import Dashboard from './pages/Dashboard';
import Markets from './pages/Markets';
import Trading from './pages/Trading';
import Portfolio from './pages/Portfolio';
import Analytics from './pages/Analytics';
import Journal from './pages/Journal';
import Leaderboard from './pages/Leaderboard';
import Settings from './pages/Settings';

// Mock imports for routes that aren't created yet but are referenced in Sidebar/Topbar
const OrderHistory = () => <div style={{color: '#f0f0f0'}}>Order History coming soon...</div>;

const Spinner = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100vw', background: '#000000', color: '#f0f0f0' }}>
    Loading...
  </div>
);

const ProtectedRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <Spinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout />;
};

const router = createBrowserRouter([
  {
    path: '/',
    element: (
      <AuthProvider>
        <Suspense fallback={<Spinner />}>
          <Outlet />
        </Suspense>
      </AuthProvider>
    ),
    children: [
      {
        path: '/',
        element: <Landing />,
      },
      {
        path: '/login',
        element: <Login />,
      },
      {
        path: '/register',
        element: <Register />,
      },
      {
        element: <ProtectedRoute />,
        children: [
          {
            path: '/dashboard',
            element: <Dashboard />,
          },
          {
            path: '/markets',
            element: <Markets />,
          },
          {
            path: '/trading/:symbol',
            element: <Trading />,
          },
          {
            path: '/portfolio',
            element: <Portfolio />,
          },
          {
            path: '/orders',
            element: <OrderHistory />,
          },
          {
            path: '/analytics',
            element: <Analytics />,
          },
          {
            path: '/journal',
            element: <Journal />,
          },
          {
            path: '/leaderboard',
            element: <Leaderboard />,
          },
          {
            path: '/settings',
            element: <Settings />,
          },
        ],
      },
    ],
  },
]);

export default router;
