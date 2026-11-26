import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import SalesDashboard from './pages/SalesDashboard';
import CityHeadDashboard from './pages/CityHeadDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import ValidatorDashboard from './pages/ValidatorDashboard';
import Profile from './pages/Profile';
import LeadDetail from './pages/LeadDetail';
import BookingsPage from './pages/BookingsPage';
import MyBookingsPage from './pages/MyBookingsPage';
import MasterSchedulePage from './pages/MasterSchedulePage';
import CreateBookingPage from './pages/CreateBookingPage';
import InspectionReportPage from './pages/InspectionReportPage';
import ProtectedRoute from './components/ProtectedRoute';
import DevApiToggle from './components/DevApiToggle';

function App() {
  return (
    <>
      <DevApiToggle />
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
      <Route path="/validator" element={
        <ProtectedRoute requireValidator><ValidatorDashboard /></ProtectedRoute>
      } />
      <Route path="/reports/:bookingId" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SUPER_ADMIN', 'SALES', 'CITY_HEAD', 'VALIDATOR', 'CUSTOMER']}>
          <InspectionReportPage />
        </ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'CITY_HEAD', 'CUSTOMER']}>
          <Profile />
        </ProtectedRoute>
      } />

      <Route path="/schedule" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'CITY_HEAD']}>
          <MasterSchedulePage />
        </ProtectedRoute>
      } />

      <Route path="/bookings" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'CITY_HEAD']}>
          <BookingsPage />
        </ProtectedRoute>
      } />

      <Route path="/create-booking" element={
        <ProtectedRoute allowedRoles={['ADMIN', 'SALES', 'CITY_HEAD']}>
          <CreateBookingPage />
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
    </>
  );
}

export default App;
