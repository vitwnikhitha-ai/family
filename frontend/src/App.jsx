import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './components/Login';
import AetheraLanding from './components/AetheraLanding';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import MembersList from './components/MembersList';
import MemberProfile from './components/MemberProfile';
import FamilyTree from './components/FamilyTree/FamilyTree';
import Documents from './components/Documents';
import Settings from './components/Settings';

// Protected Route Guard
function PrivateRoute({ children }) {
  const { token, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-saas-bg gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-primary-600 border-t-transparent animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Authenticating session...</p>
      </div>
    );
  }

  return token ? children : <Navigate to="/login" replace />;
}

// Layout wrapper for authenticated pages
function Layout({ children }) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-transparent text-saas-text-primary">
      <Navbar />
      
      <main className="flex-grow overflow-y-auto p-6 md:p-8 pt-24 md:pt-28">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Authentication */}
          <Route path="/" element={<AetheraLanding />} />
          <Route path="/login" element={<Login />} />
          
          {/* Protected Area */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/members" element={
            <PrivateRoute>
              <Layout>
                <MembersList />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/profile" element={
            <PrivateRoute>
              <Layout>
                <MemberProfile />
              </Layout>
            </PrivateRoute>
          } />

          <Route path="/profile/:id" element={
            <PrivateRoute>
              <Layout>
                <MemberProfile />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/tree" element={
            <PrivateRoute>
              <Layout>
                <FamilyTree />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/documents" element={
            <PrivateRoute>
              <Layout>
                <Documents />
              </Layout>
            </PrivateRoute>
          } />
          
          <Route path="/settings" element={
            <PrivateRoute>
              <Layout>
                <Settings />
              </Layout>
            </PrivateRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
