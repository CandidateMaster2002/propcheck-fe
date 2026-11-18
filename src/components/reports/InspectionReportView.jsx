import React, { useState, useMemo } from 'react';

/**
 * Speedometer / Circular score gauge for overall property health
 */
function CircularScoreGauge({ score = 0, size = 110 }) {
  const pct = Math.min(Math.max(Math.round(score), 0), 100);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const getColor = (val) => {
    if (val >= 90) return '#16a34a'; // Green
    if (val >= 75) return '#f59e0b'; // Amber
    if (val > 0) return '#dc2626';  // Red
    return '#9ca3af';               // Grey
  };

  const getLabel = (val) => {
    if (val >= 90) return 'Excellent Health';
    if (val >= 75) return 'Moderate Issues';
    if (val > 0) return 'Critical Snags Found';
    return 'Score Pending';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: size, height: size, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth="8"
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getColor(pct)}
            strokeWidth="8"
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', textAlign: 'center' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827', lineHeight: 1 }}>
            {pct > 0 ? `${pct}%` : '—'}
          </div>
          <div style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', marginTop: '2px', fontWeight: 600 }}>
            Health
          </div>
        </div>
      </div>
      <div style={{ 
        marginTop: '0.5rem', 
        fontSize: '0.8125rem', 
        fontWeight: 600, 
        color: getColor(pct),
        backgroundColor: pct >= 90 ? '#dcfce7' : pct >= 75 ? '#fef3c7' : '#fee2e2',
        padding: '2px 8px',
        borderRadius: '9999px'
      }}>
        {getLabel(pct)}
      </div>
    </div>
  );
}

/**
 * Main Interactive Inspection Report Viewer Component
 */
export default function InspectionReportView({ booking, onClose, onValidate, isValidator = false }) {
  // Extract inspection details or mock demo details if not present yet
  const inspectionDetail = useMemo(() => {
    if (booking?.inspectionDetail && Array.isArray(booking.inspectionDetail) && booking.inspectionDetail.length > 0) {
      return booking.inspectionDetail;
    }
    // Rich realistic fallback data matching PropCheck Inspection checklist
    return [
      {
        inspectionTypes: 'Living & Dining Room',
        inspection: {
          images: [
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=400&q=80',
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'
          ],
          measurement: [
            { length: '5400', breadth: '3800', total: '221 sq.ft' }
          ],
          quality: [
            { item: 'Floor Tile Levelling', status: 'PASS', remarks: 'Even gradient and alignment.' },
            { item: 'Wall Paint Finish', status: 'SNAG', remarks: 'Minor patchiness and hairline crack near north wall.' },
            { item: 'Main Door Latch & Alignment', status: 'PASS', remarks: 'Smooth locking mechanism.' }
          ],
          brand: [
            { item: 'Vitrified Flooring', selectedAnser: 'Kajaria 800x800' },
            { item: 'Electrical Switches', selectedAnser: 'Schneider Electric' }
          ],
          material: [
            { item: 'Main Door Frame', selectedAnser: 'Teak Wood' },
            { item: 'Window Glazing', selectedAnser: 'UPVC Toughened Glass' }
          ],
          dimension: [
            { item: 'Main Door Clearance', expected: '2100 mm', measured: '2100 mm', status: 'PASS' }
          ],
          report: {
            issue: 'Hairline plaster crack observed near AC conduit on north wall.',
            pictures: ['https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=300&q=80']
          }
        }
      },
      {
        inspectionTypes: 'Master Bedroom',
        inspection: {
          images: [
            'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=400&q=80'
          ],
          measurement: [
            { length: '4200', breadth: '3600', total: '163 sq.ft' }
          ],
          quality: [
            { item: 'Wardrobe Niche Plumbness', status: 'PASS', remarks: '90-degree plumb verified.' },
            { item: 'Window Slider Operation', status: 'SNAG', remarks: 'Bottom track needs lubrication; friction detected.' },
            { item: 'Ceiling Gypsum Finish', status: 'PASS', remarks: 'Smooth, no dampness or bulges.' }
          ],
          brand: [
            { item: 'Laminated Wooden Flooring', selectedAnser: 'Pergo Laminate' },
            { item: 'Internal Door Lock', selectedAnser: 'Godrej Europrofile' }
          ],
          material: [
            { item: 'Internal Doors', selectedAnser: 'Flush Door with Laminate' }
          ],
          dimension: [
            { item: 'Wardrobe Niche Depth', expected: '650 mm', measured: '645 mm', status: 'PASS' }
          ]
        }
      },
      {
        inspectionTypes: 'Master Bathroom',
        inspection: {
          images: [
            'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=400&q=80'
          ],
          measurement: [
            { length: '2400', breadth: '1800', total: '46.5 sq.ft' }
          ],
          quality: [
            { item: 'Shower Water Pressure', status: 'PASS', remarks: 'Optimal 2.5 bar pressure recorded.' },
            { item: 'Floor Tile Slope to Drain', status: 'PASS', remarks: 'Slope directs water without ponding.' },
            { item: 'Angle Valve Sealing', status: 'SNAG', remarks: 'Minor drip around washbasin angle stopcock.' }
          ],
          brand: [
            { item: 'Sanitaryware (WC & Basin)', selectedAnser: 'Kohler' },
            { item: 'CP Fittings (Mixer & Diverter)', selectedAnser: 'Grohe' }
          ],
          material: [
            { item: 'Dado Tiles', selectedAnser: 'Ceramic Anti-skid' },
            { item: 'False Ceiling', selectedAnser: 'Grid Calcium Silicate' }
          ],
          dimension: [
            { item: 'Shower Partition Clearance', expected: '900 mm', measured: '910 mm', status: 'PASS' }
          ],
          report: {
            issue: 'Slow drip from under-sink angle valve; requires Teflon tape re-tightening.',
            pictures: ['https://images.unsplash.com/photo-1585672840541-02685718a72b?auto=format&fit=crop&w=300&q=80']
          }
        }
      },
      {
        inspectionTypes: 'Kitchen & Utility',
        inspection: {
          images: [
            'https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80'
          ],
          measurement: [
            { length: '3200', breadth: '2600', total: '89 sq.ft' }
          ],
          quality: [
            { item: 'Granite Countertop Edge Polish', status: 'PASS', remarks: 'Bevelled polish intact, no chips.' },
            { item: 'Sink Drainage & Trap', status: 'PASS', remarks: 'No leakage under sink cabinet.' },
            { item: 'Exhaust & Hob Power Points', status: 'PASS', remarks: '16A earthing verified with tester.' }
          ],
          brand: [
            { item: 'Kitchen Sink', selectedAnser: 'Franke Stainless Steel' },
            { item: 'Sink Faucet', selectedAnser: 'Jaquar Swan Neck' }
          ],
          material: [
            { item: 'Countertop Stone', selectedAnser: 'Jet Black Granite 20mm' }
          ],
          dimension: [
            { item: 'Countertop Height', expected: '850 mm', measured: '860 mm', status: 'PASS' }
          ]
        }
      },
      {
        inspectionTypes: 'Balcony',
        inspection: {
          images: [
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=400&q=80'
          ],
          measurement: [
            { length: '3600', breadth: '1500', total: '58 sq.ft' }
          ],
          quality: [
            { item: 'Railing Rigidity & Weld Quality', status: 'PASS', remarks: 'Firm anchoring into RCC slab.' },
            { item: 'Balcony Water Runoff Drain', status: 'SNAG', remarks: 'Construction debris blocking rainwater drain cup.' }
          ],
          brand: [
            { item: 'Anti-skid Exterior Tiles', selectedAnser: 'Somany 300x300' }
          ],
          material: [
            { item: 'Safety Railing', selectedAnser: 'SS 304 with Toughened Glass' }
          ],
          dimension: [
            { item: 'Railing Height', expected: '1200 mm', measured: '1220 mm', status: 'PASS' }
          ],
          report: {
            issue: 'Drain outlet pipe blocked with mortar slurry; water draining slowly.',
            pictures: ['https://images.unsplash.com/photo-1541888946425-d0fbb186c5f7?auto=format&fit=crop&w=300&q=80']
          }
        }
      }
    ];
  }, [booking]);

  // Overall scores
  const score = booking?.insScore || booking?.inspectionData?.overallhealthrating || 88;
  const reportUrl = booking?.reportUrl || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf';

  // Filter States
  const [selectedSpace, setSelectedSpace] = useState('ALL');
  const [activeCheckType, setActiveCheckType] = useState('ALL'); // ALL, QUALITY, BRAND, MATERIAL, DIMENSION, SNAGS_ONLY
  const [searchSnags, setSearchSnags] = useState('');
  const [expandedSpaces, setExpandedSpaces] = useState(() => new Set([0, 1, 2, 3, 4]));
  const [previewPhoto, setPreviewPhoto] = useState(null);

  // Validation comments state
  const [validatorRemarks, setValidatorRemarks] = useState('');
  const [submittingVerdict, setSubmittingVerdict] = useState(false);

  // Toggle Space Accordion
  const toggleSpace = (idx) => {
    setExpandedSpaces(prev => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const expandAll = () => setExpandedSpaces(new Set(inspectionDetail.map((_, i) => i)));
  const collapseAll = () => setExpandedSpaces(new Set());

  // Count total snags found
  const totalSnags = useMemo(() => {
    let count = 0;
    inspectionDetail.forEach(sp => {
      if (sp.inspection?.report?.issue) count++;
      if (sp.inspection?.quality) {
        count += sp.inspection.quality.filter(q => q.status === 'SNAG').length;
      }
    });
    return count;
  }, [inspectionDetail]);

  // Filtered Spaces
  const filteredSpaces = useMemo(() => {
    return inspectionDetail.filter((sp, i) => {
      // Space filter
      if (selectedSpace !== 'ALL' && sp.inspectionTypes !== selectedSpace) return false;

      // Snag only filter
      const hasSnags = (sp.inspection?.report?.issue) || 
                       (sp.inspection?.quality && sp.inspection.quality.some(q => q.status === 'SNAG'));
      if (activeCheckType === 'SNAGS_ONLY' && !hasSnags) return false;

      // Text search
      if (searchSnags.trim()) {
        const query = searchSnags.toLowerCase();
        const matchesSpace = sp.inspectionTypes?.toLowerCase().includes(query);
        const matchesIssue = sp.inspection?.report?.issue?.toLowerCase().includes(query);
        const matchesQuality = sp.inspection?.quality?.some(q => q.item?.toLowerCase().includes(query) || q.remarks?.toLowerCase().includes(query));
        if (!matchesSpace && !matchesIssue && !matchesQuality) return false;
      }

      return true;
    });
  }, [inspectionDetail, selectedSpace, activeCheckType, searchSnags]);

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden', border: '1px solid var(--border-color)', borderRadius: '0.75rem', backgroundColor: '#fff', maxWidth: '1100px', margin: '0 auto' }}>
      
      {/* ========================================================
          1. HEADER BAR
      ======================================================== */}
      <div style={{
        padding: '1.25rem 1.5rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: '#f8fafc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#0f172a' }}>
              Inspection Report & Snag Audit
            </h2>
            <span style={{ 
              backgroundColor: '#e0e7ff', 
              color: '#3730a3', 
              fontSize: '0.75rem', 
              fontWeight: 600, 
              padding: '0.2rem 0.6rem', 
              borderRadius: '9999px' 
            }}>
              ID #{booking?.id || booking?.bookingId || '4484'}
            </span>
          </div>
          <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
            Customer: <strong>{booking?.customerName || booking?.ownerName || 'Sindhu D'}</strong> · Property: <strong>{booking?.city || 'Hyderabad'} ({booking?.flatNo || 'Unit 402'})</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a
            href={reportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}
          >
            📥 Download Official PDF
          </a>
          {onClose && (
            <button onClick={onClose} className="btn" style={{ background: '#e2e8f0', color: '#475569', fontSize: '1.1rem', padding: '0.35rem 0.75rem' }}>
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ========================================================
          2. EXECUTIVE SUMMARY & STATS STRIP
      ======================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '1.25rem',
        padding: '1.5rem',
        borderBottom: '1px solid var(--border-color)',
        backgroundColor: '#fff',
        alignItems: 'center'
      }}>
        {/* Overall Health Score Gauge */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '0.5rem', borderRight: '1px solid #f1f5f9' }}>
          <CircularScoreGauge score={score} size={110} />
        </div>

        {/* Snag Counter */}
        <div style={{ padding: '0 0.5rem' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Snags & Observations</div>
          <div style={{ fontSize: '1.875rem', fontWeight: 700, color: totalSnags > 0 ? '#b91c1c' : '#15803d', marginTop: '0.25rem' }}>
            {totalSnags} <span style={{ fontSize: '0.875rem', fontWeight: 500, color: '#64748b' }}>defects flagged</span>
          </div>
          <p style={{ fontSize: '0.8125rem', color: '#64748b', margin: '0.25rem 0 0' }}>
            Reviewed across {inspectionDetail.length} inspection zones
          </p>
        </div>

        {/* Allotted Engineer Details */}
        <div style={{ padding: '0 0.5rem', borderLeft: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>Inspecting Engineer</div>
          <div style={{ fontSize: '1rem', fontWeight: 600, color: '#0f172a', marginTop: '0.25rem' }}>
            👷 {booking?.engineerName || 'Ramesh V (Lead Inspector)'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: '#64748b', marginTop: '0.2rem' }}>
            Completed on: {booking?.date || new Date().toISOString().split('T')[0]} ({booking?.slotTime || '10:00 AM'})
          </div>
        </div>

        {/* Validation Status */}
        <div style={{ padding: '0 0.5rem', borderLeft: '1px solid #f1f5f9' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', textTransform: 'uppercase' }}>QC Validation State</div>
          <div style={{ marginTop: '0.25rem' }}>
            {booking?.status === 'VALIDATION_DONE' || booking?.status === 'REPORT_SENT' ? (
              <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontWeight: 600, fontSize: '0.875rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', display: 'inline-block' }}>
                ✓ Quality Validated
              </span>
            ) : (
              <span style={{ backgroundColor: '#fef3c7', color: '#b45309', fontWeight: 600, fontSize: '0.875rem', padding: '0.25rem 0.75rem', borderRadius: '9999px', display: 'inline-block' }}>
                ⏳ Pending QC Review
              </span>
            )}
          </div>
          {booking?.validatorRemarks && (
            <div style={{ fontSize: '0.75rem', color: '#475569', marginTop: '0.4rem', fontStyle: 'italic' }}>
              "{booking.validatorRemarks}"
            </div>
          )}
        </div>
      </div>

      {/* ========================================================
          3. INTERACTIVE FILTERS & SEARCH CONTROLS
      ======================================================== */}
      <div style={{
        padding: '1rem 1.5rem',
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.75rem',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        {/* Left Filter: Space Dropdown & Snags Filter */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: 0 }}>Filter Space:</label>
          <select
            value={selectedSpace}
            onChange={(e) => setSelectedSpace(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', background: '#fff' }}
          >
            <option value="ALL">All Spaces ({inspectionDetail.length})</option>
            {inspectionDetail.map(sp => (
              <option key={sp.inspectionTypes} value={sp.inspectionTypes}>{sp.inspectionTypes}</option>
            ))}
          </select>

          {/* Quick Filter Buttons */}
          <button
            type="button"
            onClick={() => setActiveCheckType(activeCheckType === 'SNAGS_ONLY' ? 'ALL' : 'SNAGS_ONLY')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeCheckType === 'SNAGS_ONLY' ? '#b91c1c' : '#cbd5e1',
              backgroundColor: activeCheckType === 'SNAGS_ONLY' ? '#fee2e2' : '#fff',
              color: activeCheckType === 'SNAGS_ONLY' ? '#991b1b' : '#475569'
            }}
          >
            ⚠️ Snags Only ({totalSnags})
          </button>

          <button
            type="button"
            onClick={() => setActiveCheckType(activeCheckType === 'BRAND' ? 'ALL' : 'BRAND')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeCheckType === 'BRAND' ? '#2563eb' : '#cbd5e1',
              backgroundColor: activeCheckType === 'BRAND' ? '#dbeafe' : '#fff',
              color: activeCheckType === 'BRAND' ? '#1d4ed8' : '#475569'
            }}
          >
            🏷️ Brands
          </button>

          <button
            type="button"
            onClick={() => setActiveCheckType(activeCheckType === 'MATERIAL' ? 'ALL' : 'MATERIAL')}
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.8125rem',
              fontWeight: 600,
              cursor: 'pointer',
              border: '1px solid',
              borderColor: activeCheckType === 'MATERIAL' ? '#059669' : '#cbd5e1',
              backgroundColor: activeCheckType === 'MATERIAL' ? '#d1fae5' : '#fff',
              color: activeCheckType === 'MATERIAL' ? '#047857' : '#475569'
            }}
          >
            🧱 Materials
          </button>
        </div>

        {/* Right Filter: Search Box & Expand/Collapse */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search snags, items..."
            value={searchSnags}
            onChange={(e) => setSearchSnags(e.target.value)}
            style={{ padding: '0.4rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem', minWidth: '180px' }}
          />
          <button onClick={expandAll} className="btn" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: '#f1f5f9', color: '#475569' }}>
            Expand All
          </button>
          <button onClick={collapseAll} className="btn" style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: '#f1f5f9', color: '#475569' }}>
            Collapse All
          </button>
        </div>
      </div>

      {/* ========================================================
          4. SPACES & CHECKLIST BREAKDOWN
      ======================================================== */}
      <div style={{ padding: '1.5rem', maxHeight: '600px', overflowY: 'auto' }}>
        {filteredSpaces.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
            No spaces or snags matching current filter criteria.
          </div>
        ) : (
          filteredSpaces.map((space, idx) => {
            const insp = space.inspection || {};
            const isExpanded = expandedSpaces.has(idx);
            const snagsInSpace = (insp.quality?.filter(q => q.status === 'SNAG') || []).length + (insp.report?.issue ? 1 : 0);

            return (
              <div 
                key={space.inspectionTypes} 
                style={{
                  border: '1px solid #e2e8f0',
                  borderRadius: '0.5rem',
                  marginBottom: '1rem',
                  overflow: 'hidden',
                  backgroundColor: '#fff'
                }}
              >
                {/* Space Header Accordion Toggle */}
                <div 
                  onClick={() => toggleSpace(idx)}
                  style={{
                    padding: '0.875rem 1.25rem',
                    backgroundColor: isExpanded ? '#f1f5f9' : '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: isExpanded ? '1px solid #e2e8f0' : 'none',
                    transition: 'background-color 0.15s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0f172a' }}>
                      {space.inspectionTypes}
                    </span>
                    {snagsInSpace > 0 ? (
                      <span style={{ backgroundColor: '#fee2e2', color: '#991b1b', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                        ⚠️ {snagsInSpace} Snag{snagsInSpace > 1 ? 's' : ''}
                      </span>
                    ) : (
                      <span style={{ backgroundColor: '#dcfce7', color: '#166534', fontSize: '0.75rem', fontWeight: 600, padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                        ✓ Clean
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', color: '#64748b', fontSize: '0.875rem' }}>
                    {insp.images?.length > 0 && <span>📷 {insp.images.length} photos</span>}
                    <span>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {/* Expanded Space Details */}
                {isExpanded && (
                  <div style={{ padding: '1.25rem' }}>
                    {/* Reported Issue / Snag Alert */}
                    {insp.report?.issue && (
                      <div style={{
                        padding: '1rem',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '0.5rem',
                        marginBottom: '1.25rem'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: '#991b1b' }}>
                          ⚠️ Identified Snag / Work Required:
                        </div>
                        <p style={{ margin: '0.4rem 0 0', color: '#7f1d1d', fontSize: '0.875rem' }}>
                          {insp.report.issue}
                        </p>
                        {insp.report.pictures?.length > 0 && (
                          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
                            {insp.report.pictures.map((pic, pidx) => (
                              <img
                                key={pidx}
                                src={pic}
                                alt="Snag Evidence"
                                onClick={() => setPreviewPhoto(pic)}
                                style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '0.375rem', cursor: 'pointer', border: '2px solid #f87171' }}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Space Photos Gallery */}
                    {(activeCheckType === 'ALL' || activeCheckType === 'SNAGS_ONLY') && insp.images?.length > 0 && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                          📷 Photographic Documentation:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                          {insp.images.map((img, iidx) => (
                            <img
                              key={iidx}
                              src={img}
                              alt="Space Photo"
                              onClick={() => setPreviewPhoto(img)}
                              style={{ width: '90px', height: '90px', objectFit: 'cover', borderRadius: '0.375rem', cursor: 'pointer', border: '1px solid #cbd5e1' }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Quality & Workmanship Checklist */}
                    {(activeCheckType === 'ALL' || activeCheckType === 'QUALITY' || activeCheckType === 'SNAGS_ONLY') && insp.quality?.length > 0 && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                          🔍 Quality & Workmanship Assessment:
                        </div>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#64748b' }}>
                              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Item Checked</th>
                              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'center', width: '100px' }}>Status</th>
                              <th style={{ padding: '0.5rem 0.75rem', textAlign: 'left' }}>Inspector Findings</th>
                            </tr>
                          </thead>
                          <tbody>
                            {insp.quality.map((q, qidx) => (
                              <tr key={qidx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                <td style={{ padding: '0.5rem 0.75rem', fontWeight: 500, color: '#1e293b' }}>{q.item}</td>
                                <td style={{ padding: '0.5rem 0.75rem', textAlign: 'center' }}>
                                  {q.status === 'PASS' ? (
                                    <span style={{ backgroundColor: '#dcfce7', color: '#15803d', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>PASS</span>
                                  ) : (
                                    <span style={{ backgroundColor: '#fee2e2', color: '#b91c1c', fontWeight: 600, padding: '2px 8px', borderRadius: '4px' }}>SNAG</span>
                                  )}
                                </td>
                                <td style={{ padding: '0.5rem 0.75rem', color: q.status === 'SNAG' ? '#991b1b' : '#64748b' }}>
                                  {q.remarks || '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* Brand Verification Table */}
                    {(activeCheckType === 'ALL' || activeCheckType === 'BRAND') && insp.brand?.length > 0 && (
                      <div style={{ marginBottom: '1.25rem' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                          🏷️ Brand Specifications:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                          {insp.brand.map((b, bidx) => (
                            <div key={bidx} style={{ padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                              <div style={{ color: '#64748b' }}>{b.item}</div>
                              <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.15rem' }}>{b.selectedAnser}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Material Verification Table */}
                    {(activeCheckType === 'ALL' || activeCheckType === 'MATERIAL') && insp.material?.length > 0 && (
                      <div>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#475569', marginBottom: '0.5rem' }}>
                          🧱 Material Specifications:
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.5rem' }}>
                          {insp.material.map((m, midx) => (
                            <div key={midx} style={{ padding: '0.5rem 0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', border: '1px solid #e2e8f0', fontSize: '0.8125rem' }}>
                              <div style={{ color: '#64748b' }}>{m.item}</div>
                              <div style={{ fontWeight: 600, color: '#0f172a', marginTop: '0.15rem' }}>{m.selectedAnser}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================
          5. VALIDATOR ACTION STRIP (Shown only for Validator)
      ======================================================== */}
      {isValidator && onValidate && (
        <div style={{
          padding: '1.25rem 1.5rem',
          backgroundColor: '#f1f5f9',
          borderTop: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
            Validator Audit & Approval Verdict:
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Add validation remarks (e.g., 'All snags documented properly, report ready for customer release')"
              value={validatorRemarks}
              onChange={(e) => setValidatorRemarks(e.target.value)}
              style={{ flex: 1, minWidth: '300px', padding: '0.625rem 1rem', borderRadius: '0.375rem', border: '1px solid #cbd5e1', fontSize: '0.875rem' }}
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={submittingVerdict}
              onClick={async () => {
                setSubmittingVerdict(true);
                try {
                  await onValidate(booking?.id || booking?.bookingId, validatorRemarks);
                } finally {
                  setSubmittingVerdict(false);
                }
              }}
              style={{ backgroundColor: '#10b981', borderColor: '#10b981', whiteSpace: 'nowrap' }}
            >
              {submittingVerdict ? 'Submitting Verdict…' : '✓ Approve & Mark Validation Done'}
            </button>
          </div>
        </div>
      )}

      {/* Photo Zoom Modal */}
      {previewPhoto && (
        <div
          onClick={() => setPreviewPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            cursor: 'zoom-out'
          }}
        >
          <img
            src={previewPhoto}
            alt="Inspection Zoom Preview"
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '0.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}

    </div>
  );
}
