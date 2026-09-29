import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SalesDashboard from './pages/SalesDashboard';
import CityHeadDashboard from './pages/CityHeadDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import Profile from './pages/Profile';
import LeadDetail from './pages/LeadDetail';
import BookingsPage from './pages/BookingsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import MasterSchedulePage from './pages/MasterSchedulePage';
import CreateBookingPage from './pages/CreateBookingPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/admin" element={
        <ProtectedRoute allowedRole="ADMIN"><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/sales" element={
        <ProtectedRoute allowedRole="SALES"><SalesDashboard /></ProtectedRoute>
      } />
      <Route path="/cityhead" element={
        <ProtectedRoute allowedRole="CITY_HEAD"><CityHeadDashboard /></ProtectedRoute>
      } />
      <Route path="/customer" element={
        <ProtectedRoute allowedRole="CUSTOMER"><CustomerDashboard /></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'CITY_HEAD', 'CUSTOMER']}>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/analytics" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'CITY_HEAD']}>
          <AnalyticsDashboard />
        </ProtectedRoute>
      } />

      <Route path="/schedule" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'CITY_HEAD']}>
          <MasterSchedulePage />
        </ProtectedRoute>
      } />

      {/* Bookings — Customer */}
      <Route path="/my-bookings" element={
        <ProtectedRoute allowedRole="CUSTOMER">
          <MyBookingsPage />
        </ProtectedRoute>
      } />

      <Route path="/leads/:id" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'CITY_HEAD']}>
          <LeadDetail />
        </ProtectedRoute>
      } />
    </Routes>
  );
}

export default App;
