import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ActivityTicker from './components/ActivityTicker';

import Login from './pages/Login';
import Register from './pages/Register';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';
import InventoryPage from './pages/InventoryPage';
import MrnPage from './pages/MrnPage';
import InvoicePage from './pages/InvoicePage';
import PriceRequestsPage from './pages/PriceRequestsPage';
import ReturnsPage from './pages/ReturnsPage';
import PaymentsPage from './pages/PaymentsPage';
import KycPage from './pages/KycPage';
import AdminKycPage from './pages/AdminKycPage';

function ProtectedLayout() {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-sm">
        Authenticating KickVault session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      <Navbar />
      <ActivityTicker />
      <div className="flex flex-1">
        <Sidebar />
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          <Routes>
            <Route
              path="/dashboard"
              element={role === 'admin' ? <AdminDashboard /> : <VendorDashboard />}
            />
            <Route path="/inventory" element={<InventoryPage />} />
            <Route path="/mrns" element={<MrnPage />} />
            <Route path="/invoices" element={<InvoicePage />} />
            <Route path="/price-requests" element={<PriceRequestsPage />} />
            <Route path="/returns" element={<ReturnsPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="/kyc" element={<KycPage />} />
            <Route path="/admin/kyc" element={<AdminKycPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
