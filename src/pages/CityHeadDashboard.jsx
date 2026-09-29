import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import LeadsTable from '../components/LeadsTable';
import ConflictWidget from '../components/bookings/ConflictWidget';
import CreateBookingModal from '../components/bookings/CreateBookingModal';

import AssignEngineerModal from '../components/bookings/AssignEngineerModal';
import RescheduleBookingModal from '../components/bookings/RescheduleBookingModal';

export default function CityHeadDashboard() {
  const { logout, name, city, id: userId } = useAuth();
  const navigate = useNavigate();

  const [leads, setLeads] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [bookingFilter, setBookingFilter] = useState('ALL');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [bookingLeadTarget, setBookingLeadTarget] = useState(null);
  
  // States for modals
  const [assignEngineerTarget, setAssignEngineerTarget] = useState(null);
  const [rescheduleTarget, setRescheduleTarget] = useState(null);
  
  const [selectedCity, setSelectedCity] = useState(city || 'Hyderabad');
  const [ownerFilter, setOwnerFilter] = useState('All');
  const [allUsers, setAllUsers] = useState([]);
  const salesUsers = allUsers.filter(u => u.role === 'SALES');

  const [loadingLeads, setLoadingLeads] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await client.get('/users');
        setAllUsers(response.data || []);
      } catch (err) {
        console.error('Failed to fetch users', err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const fetchLeads = useCallback(async () => {
    setLoadingLeads(true);
    try {
      const params = new URLSearchParams();
      // Only append city if selectedCity is not empty ("All")
      if (selectedCity) params.append('city', selectedCity);
      if (debouncedSearch) params.append('search', debouncedSearch);
      params.append('bookingFilter', bookingFilter);
      if (ownerFilter !== 'All') params.append('owner', ownerFilter);

      const response = await client.get(`/leads?${params.toString()}`);
      setLeads(response.data);
    } catch (err) {
      console.error('Failed to fetch leads', err);
    } finally {
      setLoadingLeads(false);
    }
  }, [selectedCity, debouncedSearch, bookingFilter, ownerFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLeadAction = async (action, lead) => {
    const bookingId = lead.currentBookingId || lead.id;
    
    // Open Modals for complex actions
    if (action === 'RESCHEDULE') {
      // Derive a pseudo-booking object for the modal
      const slotTimeStr = lead.inspectionDateAndTime ? new Date(lead.inspectionDateAndTime).toLocaleTimeString('en-US', { hour12: false }) : '';
      const assumedSlot = (slotTimeStr && parseInt(slotTimeStr.split(':')[0]) >= 14) ? 'EVENING' : 'MORNING';
      setRescheduleTarget({
        ...lead,
        id: bookingId,
        bookingType: lead.inspectionType || 'INSPECTION'
      });
      return;
    }
    
    if (action === 'ASSIGN_ENGINEER') {
      const slotTimeStr = lead.inspectionDateAndTime ? new Date(lead.inspectionDateAndTime).toLocaleTimeString('en-US', { hour12: false }) : '';
      const assumedSlot = (slotTimeStr && parseInt(slotTimeStr.split(':')[0]) >= 14) ? 'EVENING' : 'MORNING';
      setAssignEngineerTarget({
        ...lead,
        id: bookingId,
        leadId: lead.id,
        date: lead.inspectionDateAndTime ? lead.inspectionDateAndTime.split('T')[0] : new Date().toISOString().split('T')[0],
        slot: lead.slot || assumedSlot
      });
      return;
    }

    // Direct API actions for simple state changes
    try {
      if (action === 'CANCEL') {
        await client.put(`/bookings/${bookingId}/cancel`);
      } else if (action === 'MARK_DONE') {
        await client.put(`/bookings/${bookingId}/mark-done`);
      } else if (action === 'MARK_VALIDATION_DONE') {
        await client.put(`/bookings/for-lead/${lead.id}/mark-validation-done`);
      } else if (action === 'REPORT_SENT') {
        await client.put(`/bookings/${bookingId}/report-sent`);
      }
      fetchLeads(); // refresh immediately
    } catch (err) {
      console.error('Action failed:', err);
      alert(err.response?.data?.error || 'Action failed');
    }
  };

  return (
    <div className="app-container">
      <div className="dashboard-container">
        <header className="dashboard-header">
          <div>
            <h1 style={{ marginBottom: 0 }}>City Head Dashboard</h1>
            <p style={{ color: 'var(--text-muted)' }}>
              Welcome back, {name || 'City Head'} | Managing: {city || 'Unassigned'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={() => navigate('/schedule')}>🗓️ Schedule</button>
            <button className="btn btn-secondary" onClick={() => navigate('/analytics')}>📊 Analytics</button>
            <button className="btn btn-secondary" onClick={() => navigate('/profile')}>Profile</button>
          </div>
        </header>

        <ConflictWidget city={selectedCity} />

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h2 style={{ marginBottom: 0 }}>Leads</h2>
              <button className="btn btn-secondary" onClick={fetchLeads} disabled={loadingLeads} style={{ padding: '0.25rem 0.75rem', fontSize: '0.875rem' }}>
                {loadingLeads ? '...' : 'Refresh'}
              </button>
            </div>
          </div>
          
          {/* Dashboard Filters Panel */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
            gap: '1rem', 
            marginBottom: '1rem', 
            background: 'var(--background-color, #f9fafb)', 
            padding: '1.25rem', 
            borderRadius: '0.5rem', 
            border: '1px solid var(--border-color)' 
          }}>
            {/* Search - Full Width */}
            <div style={{ gridColumn: '1 / -1' }}>
              <input
                type="text"
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid var(--border-color)',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            {/* Dropdowns */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>City</label>
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              >
                <option value="">All</option>
                <option value="Hyderabad">Hyderabad</option>
                <option value="Bangalore">Bangalore</option>
                <option value="Pune">Pune</option>
                <option value="Mumbai">Mumbai</option>
                <option value="Delhi NCR">Delhi NCR</option>
                <option value="Chennai">Chennai</option>
                <option value="Others">Others</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Lead Owner</label>
              <select
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              >
                <option value="All">All</option>
                {salesUsers.map(user => (
                  <option key={user.id} value={user.name}>{user.name}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-muted)' }}>Booking Status</label>
              <select
                value={bookingFilter}
                onChange={(e) => setBookingFilter(e.target.value)}
                style={{ padding: '0.6rem', borderRadius: '0.5rem', border: '1px solid var(--border-color)' }}
              >
                <option value="ALL">All Leads</option>
                <option value="UNBOOKED">Unbooked (Never booked)</option>
                <option value="PENDING_ENGINEER">Date Allotted (Engineer Not Allotted)</option>
                <option value="ENGINEER_ALLOTTED">Engineer Allotted</option>
                <option value="INSPECTION_DONE">Inspection Done</option>
                <option value="VALIDATION_DONE">Validation Done</option>
                <option value="REPORT_SENT">Report Sent</option>
                <option value="POSTPONED_CANCELLED">Postponed / Cancelled</option>
              </select>
            </div>
          </div>

          <LeadsTable 
            leads={leads}
            users={allUsers}
            loading={loadingLeads} 
            emptyMessage={`No leads found for ${selectedCity || 'All Cities'}.`}
            onBookClick={(lead) => setBookingLeadTarget(lead)}
            onAction={handleLeadAction}
            onRowClick={(id) => navigate('/leads/' + id)}
          />
        </div>

        {bookingLeadTarget && (
          <CreateBookingModal 
            lead={bookingLeadTarget} 
            onClose={() => setBookingLeadTarget(null)}
            onSuccess={fetchLeads}
          />
        )}
        
        {assignEngineerTarget && (
          <AssignEngineerModal 
            booking={assignEngineerTarget}
            onClose={() => setAssignEngineerTarget(null)}
            onSuccess={fetchLeads}
          />
        )}
        
        {rescheduleTarget && (
          <RescheduleBookingModal
            booking={rescheduleTarget}
            onClose={() => setRescheduleTarget(null)}
            onSuccess={fetchLeads}
          />
        )}
      </div>
    </div>
  );
}
