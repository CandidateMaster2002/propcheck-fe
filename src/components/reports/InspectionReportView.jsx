import React, { useState, useMemo } from 'react';

/**
 * 270° Speedometer Gauge — matches the B2C Portal (/inspections/[id]) component
 */
function SpeedometerGauge({ label, progress = 0, threshold = 80 }) {
  const pct = Math.min(Math.max(Math.round(Number(progress) || 0), 0), 100);
  const isZero = pct <= 0;
  const isHigh = pct >= threshold;

  const cx = 100, cy = 84, r = 68, nLen = 50;
  const toRad = (d) => (d * Math.PI) / 180;

  const needleAngle = 225 - (pct / 100) * 270;
  const nx = cx + nLen * Math.cos(toRad(needleAngle));
  const ny = cy - nLen * Math.sin(toRad(needleAngle));

  const pt = (deg) => ({
    x: +(cx + r * Math.cos(toRad(deg))).toFixed(2),
    y: +(cy - r * Math.sin(toRad(deg))).toFixed(2),
  });
  const p225 = pt(225);
  const p157 = pt(157.5);
  const p90 = pt(90);
  const p22 = pt(22.5);
  const p315 = pt(-45);

  const seg = (a, b, large = 0) =>
    `M ${a.x} ${a.y} A ${r} ${r} 0 ${large} 1 ${b.x} ${b.y}`;

  const badgeBg = isHigh ? '#dcfce7' : '#fee2e2';
  const badgeTxt = isHigh ? '#15803d' : '#dc2626';

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      backgroundColor: '#F8FAFC', borderRadius: '8px',
      padding: '16px 8px 12px', width: '100%', boxSizing: 'border-box',
    }}>
      {label && (
        <div style={{
          fontSize: '13px', fontWeight: 500, color: '#64748b',
          textAlign: 'center', lineHeight: 1.4, marginBottom: '8px',
          minHeight: '36px', display: 'flex', alignItems: 'center',
        }}>
          {label}
        </div>
      )}

      <svg viewBox="0 0 200 190" width="200" height="190" style={{ maxWidth: '100%', display: 'block' }}>
        <path
          d={seg(p225, p315, 1)}
          fill="none" stroke="#E2E8F0" strokeWidth="13" strokeLinecap="round"
        />

        {!isZero && (
          <>
            <path d={seg(p225, p157)} fill="none" stroke="#E63535" strokeWidth="13" strokeLinecap="butt" />
            <path d={seg(p157, p90)} fill="none" stroke="#FB9D4B" strokeWidth="13" strokeLinecap="butt" />
            <path d={seg(p90, p22)} fill="none" stroke="#FBC02D" strokeWidth="13" strokeLinecap="butt" />
            <path d={seg(p22, p315)} fill="none" stroke="#16A34A" strokeWidth="13" strokeLinecap="butt" />

            <line
              x1={cx} y1={cy} x2={nx} y2={ny}
              stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round"
            />
            <circle cx={cx} cy={cy} r="5" fill="#1F2937" />
          </>
        )}

        <text
          x={cx} y={cy + 20}
          textAnchor="middle"
          fontSize="24" fontWeight="700" fill="#1A1717"
          fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
        >
          {pct}%
        </text>

        {!isZero && (
          <g transform={`translate(${cx}, 158)`}>
            <rect
              x="-42" y="-13" width="84" height="22" rx="5"
              fill={badgeBg} stroke={isHigh ? '#86efac' : '#fca5a5'} strokeWidth="0.8"
            />
            <text
              x="0" y="3"
              textAnchor="middle"
              fontSize="11" fontWeight="600" fill={badgeTxt}
              fontFamily="-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif"
            >
              {isHigh ? '▲ Good' : '▼ Needs Fix'}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

const cardStyle = {
  backgroundColor: '#ffffff',
  borderRadius: '8px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  border: '1px solid #e5e7eb',
  padding: '1.5rem',
};

const cardTitleStyle = {
  fontSize: '1rem',
  fontWeight: 600,
  color: '#111827',
  marginBottom: '1rem',
  paddingBottom: '0.625rem',
  borderBottom: '1px solid #e5e7eb',
};

const fieldLabelStyle = {
  fontSize: '0.75rem',
  fontWeight: 500,
  color: '#6b7280',
  marginBottom: '0.2rem',
};

const fieldValueStyle = {
  fontSize: '0.9375rem',
  color: '#111827',
  fontWeight: 400,
};

function FieldRow({ label, value }) {
  return (
    <div style={{ marginBottom: '0.85rem' }}>
      <div style={fieldLabelStyle}>{label}</div>
      <div style={fieldValueStyle}>
        {value || <span style={{ color: '#9ca3af' }}>N/A</span>}
      </div>
    </div>
  );
}

export default function InspectionReportView({
  booking,
  b2cProperty = null,
  b2cLoading = false,
  b2cError = '',
  onValidate,
  isValidator = false,
}) {
  const [expandedSpaces, setExpandedSpaces] = useState(() => new Set([0]));
  const [reportedIssueModal, setReportedIssueModal] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [validating, setValidating] = useState(false);

  const property = useMemo(() => {
    const p = b2cProperty || {};
    return {
      _id: p._id || booking?.b2cPropertyId || null,
      propertyName: p.propertyName || booking?.projectName || 'N/A',
      propertyType: p.propertyType || 'Apartment',
      address: p.address || booking?.address || '',
      city: p.city || booking?.city || '',
      unitNo: p.unitNo || booking?.flatNo || booking?.unitNo || '',
      bedrooms: p.bedrooms || booking?.bhkType || '',
      size: p.size || '',
      bookingStatus: p.bookingStatus || booking?.status || booking?.currentBookingStatus || 'Pending',
      inspectionDate: p.inspectionDate || booking?.date || booking?.inspectionDateAndTime || null,
      inspectionTime: p.inspectionTime || booking?.slotTime || '',
      ownerName: p.ownerName || booking?.customerName || 'N/A',
      ownerPhone: p.ownerPhone || booking?.phone || '',
      ownerEmail: p.ownerEmail || booking?.email || '',
      inspectorId: p.inspectorId || null,
      validatorId: p.validatorId || null,
      reportUrl: p.reportUrl || booking?.reportUrl || '',
      videoUrl: p.videoUrl || '',
      insScore: Math.round(
        p.inspectionData?.overallhealthrating ?? p.overallhealthrating ?? booking?.insScore ?? 0
      ),
      reInsScore: Math.round(
        p.inspectionData?.overallhealthrating_reinsp ?? p.overallhealthrating_reinsp ?? 0
      ),
      inspectionDetail: Array.isArray(p.inspectionDetail)
        ? p.inspectionDetail
        : Array.isArray(booking?.inspectionDetail)
        ? booking.inspectionDetail
        : [],
    };
  }, [b2cProperty, booking]);

  const currentStatus = booking?.status || booking?.currentBookingStatus || property.bookingStatus;
  const isValidated = ['VALIDATION_DONE', 'REPORT_SENT', 'APPROVED'].includes(currentStatus);

  const toggleSpace = (index) => {
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSpaces(new Set(property.inspectionDetail.map((_, i) => i)));
  };

  const collapseAll = () => {
    setExpandedSpaces(new Set());
  };

  const handleValidateClick = async () => {
    if (!onValidate) return;
    setValidating(true);
    try {
      await onValidate(booking?.id, remarks);
    } finally {
      setValidating(false);
    }
  };

  const handleDownloadReport = () => {
    if (property.reportUrl) {
      window.open(property.reportUrl, '_blank', 'noopener,noreferrer');
    } else {
      window.print();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Action Header */}
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 700, color: '#0f172a' }}>
              {property.propertyName} {property.unitNo ? `— Unit ${property.unitNo}` : ''}
            </h1>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 600,
                padding: '3px 10px',
                borderRadius: '999px',
                backgroundColor: isValidated ? '#dcfce7' : '#fef3c7',
                color: isValidated ? '#166534' : '#b45309',
              }}
            >
              {currentStatus}
            </span>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#64748b', marginTop: '0.25rem' }}>
            {property.city ? `${property.city} · ` : ''}
            {property.bedrooms ? `${property.bedrooms} · ` : ''}
            Customer: <strong style={{ color: '#334155' }}>{property.ownerName}</strong>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleDownloadReport}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#0f172a',
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
            }}
          >
            {property.reportUrl ? '📄 Open Official PDF Report' : '🖨️ Print / Save PDF'}
          </button>
        </div>
      </div>

      {/* Property + Customer / Inspector / Validator Info Grid (matches B2C) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        <div style={cardStyle}>
          <div style={cardTitleStyle}>Property Information</div>
          <FieldRow label="Property / Project" value={property.propertyName} />
          <FieldRow label="Type" value={property.propertyType} />
          <FieldRow label="Unit / Flat No." value={property.unitNo} />
          <FieldRow label="City" value={property.city} />
          <FieldRow label="Address" value={property.address} />
          <FieldRow
            label="Inspection Schedule"
            value={
              property.inspectionDate
                ? `${String(property.inspectionDate).split('T')[0]} ${property.inspectionTime || ''}`.trim()
                : 'Not Scheduled'
            }
          />
        </div>

        <div style={cardStyle}>
          <div style={cardTitleStyle}>Customer Information</div>
          <FieldRow label="Name" value={property.ownerName} />
          <FieldRow label="Phone" value={property.ownerPhone} />
          <FieldRow label="Email" value={property.ownerEmail} />

          <div style={{ ...cardTitleStyle, marginTop: '1.25rem' }}>Inspector Information</div>
          {property.inspectorId ? (
            <>
              <FieldRow
                label="Name"
                value={property.inspectorId.name || property.inspectorId.userName}
              />
              <FieldRow label="Phone" value={property.inspectorId.phone} />
            </>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#9ca3af', marginBottom: '1rem' }}>
              {booking?.engineerEmployeeNumber
                ? `Engineer #${booking.engineerEmployeeNumber}`
                : 'No inspector assigned yet.'}
            </div>
          )}

          <div style={{ ...cardTitleStyle, marginTop: '1.25rem' }}>Validator Information</div>
          {property.validatorId ? (
            <>
              <FieldRow
                label="Name"
                value={property.validatorId.name || property.validatorId.userName}
              />
              <FieldRow label="Phone" value={property.validatorId.phone} />
            </>
          ) : (
            <div style={{ fontSize: '0.875rem', color: '#9ca3af' }}>
              {booking?.validatorName || 'No validator assigned yet.'}
            </div>
          )}
        </div>
      </div>

      {/* Unit Health (exact B2C SpeedometerGauge) */}
      <div style={cardStyle}>
        <div style={cardTitleStyle}>Unit Health</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px', alignItems: 'stretch' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {`Post ${property.propertyType === 'Villa' ? 'Internal' : 'External'} Inspection Score`}
            </div>
            <SpeedometerGauge label="" progress={property.insScore} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#64748b', marginBottom: '8px', minHeight: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {`Post ${property.propertyType === 'Villa' ? 'Internal' : 'External'} Recheck Score`}
            </div>
            <SpeedometerGauge label="" progress={property.reInsScore} />
          </div>
        </div>
      </div>

      {/* List of Spaces — exact B2C table & expandable detail cards */}
      <div style={{ ...cardStyle, padding: 0, overflow: 'hidden' }}>
        <div
          style={{
            padding: '0.875rem 1.25rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: '#111827' }}>
            List of Spaces ({property.inspectionDetail.length})
          </h2>
          {property.inspectionDetail.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={expandAll}
                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={collapseAll}
                style={{ padding: '4px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}
              >
                Collapse All
              </button>
            </div>
          )}
        </div>

        {b2cLoading ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            Syncing live inspection checklist & photos from B2C portal...
          </div>
        ) : property.inspectionDetail.length === 0 ? (
          <div style={{ padding: '2.5rem', textAlign: 'center', color: '#64748b', fontSize: '0.9rem' }}>
            {b2cError || 'No B2C inspection checklist data has been synced for this property yet.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8f9fa' }}>
                  {['No.', 'Space', 'Area Measurement', 'Quality', 'Brand Check', 'Material Check', 'Dimension Check', ''].map((h, idx) => (
                    <th
                      key={idx}
                      style={{
                        padding: '0.625rem 1rem',
                        textAlign: idx >= 2 && idx <= 6 ? 'center' : 'left',
                        borderBottom: '2px solid #dee2e6',
                        fontSize: '0.8125rem',
                        fontWeight: 600,
                        color: '#495057',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {property.inspectionDetail.map((space, i) => {
                  const insp = space.inspection || {};
                  const isExpanded = expandedSpaces.has(i);
                  const hasReport = Boolean(insp.report?.issue || (insp.report?.pictures?.length ?? 0) > 0);
                  const spaceName =
                    space.inspectionTypes === 'COMMON_AREA' || space.inspectionTypes === 'EXTERNAL'
                      ? space.otherSpaceName || 'Other Space'
                      : space.inspectionTypes || `Space ${i + 1}`;

                  const checkIcon = (
                    <span style={{ color: '#6CBE00', fontSize: '16px', fontWeight: 700 }}>✓</span>
                  );
                  const dashIcon = <span style={{ color: '#aaa' }}>–</span>;

                  return (
                    <React.Fragment key={`space-${i}`}>
                      <tr
                        onClick={() => toggleSpace(i)}
                        style={{
                          cursor: 'pointer',
                          backgroundColor: isExpanded ? '#f0f4ff' : '#ffffff',
                        }}
                      >
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #dee2e6' }}>
                          {i + 1}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #dee2e6', fontWeight: 600 }}>
                          {spaceName}
                          {hasReport && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportedIssueModal({
                                  spaceName,
                                  issue: insp.report?.issue || '',
                                  pictures: insp.report?.pictures || [],
                                });
                              }}
                              title="View reported issue"
                              style={{
                                marginLeft: '6px',
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                color: '#d97706',
                                fontSize: '15px',
                                padding: 0,
                              }}
                            >
                              ⚠
                            </button>
                          )}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                          {(insp.measurement?.length ?? 0) > 0 ? checkIcon : dashIcon}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                          {(insp.quality?.length ?? 0) > 0 ? checkIcon : dashIcon}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                          {(insp.brand?.length ?? 0) > 0 ? checkIcon : dashIcon}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                          {(insp.material?.length ?? 0) > 0 ? checkIcon : dashIcon}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #dee2e6', textAlign: 'center' }}>
                          {(insp.dimension?.length ?? 0) > 0 ? checkIcon : dashIcon}
                        </td>
                        <td style={{ padding: '0.625rem 1rem', fontSize: '0.875rem', borderBottom: '1px solid #dee2e6', textAlign: 'center', color: '#0066cc' }}>
                          {isExpanded ? '▲' : '▼'}
                        </td>
                      </tr>

                      {isExpanded && (
                        <tr>
                          <td colSpan={8} style={{ borderBottom: '2px solid #dee2e6', padding: 0 }}>
                            <div
                              style={{
                                borderTop: '2px solid #f1f5f7',
                                padding: '12px',
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                                gap: '10px',
                              }}
                            >
                              {(insp.images?.length ?? 0) > 0 && (
                                <div style={{ gridColumn: '1 / -1', backgroundColor: '#F2F8FF', borderRadius: '4px' }}>
                                  <h5 style={{ margin: 0, padding: '12px 15px', fontSize: '0.875rem', fontWeight: 600, color: '#000', backgroundColor: '#FDB93F', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                                    Pictures of the space ✓
                                  </h5>
                                  <div style={{ padding: '10px 15px', display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                    {insp.images.map((img, j) => (
                                      <a key={j} href={img} target="_blank" rel="noopener noreferrer">
                                        <div
                                          style={{
                                            width: '100px',
                                            height: '100px',
                                            backgroundImage: `url(${img})`,
                                            backgroundSize: 'cover',
                                            backgroundPosition: 'center',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '6px',
                                            border: '1px solid #dee2e6',
                                          }}
                                        />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {(insp.measurement?.length ?? 0) > 0 && (
                                <div style={{ backgroundColor: '#F2F8FF', borderRadius: '4px' }}>
                                  <h5 style={{ margin: 0, padding: '12px 15px', fontSize: '0.875rem', fontWeight: 600, color: '#000', backgroundColor: '#FDB93F', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                                    Area Measurement ✓
                                  </h5>
                                  <div style={{ padding: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                      <thead>
                                        <tr>
                                          {['No.', 'Length (mm)', 'Breadth (mm)', 'Total (in²)'].map((h) => (
                                            <th key={h} style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #eff2f7', fontWeight: 600, color: '#555', fontSize: '0.75rem' }}>
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {insp.measurement.map((m, j) => (
                                          <tr key={j}>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{j + 1}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{m.length || '–'}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{m.breadth || '–'}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{m.total || '–'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {(insp.brand?.length ?? 0) > 0 && (
                                <div style={{ backgroundColor: '#F2F8FF', borderRadius: '4px' }}>
                                  <h5 style={{ margin: 0, padding: '12px 15px', fontSize: '0.875rem', fontWeight: 600, color: '#000', backgroundColor: '#FDB93F', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                                    Brand Check ✓
                                  </h5>
                                  <div style={{ padding: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                      <thead>
                                        <tr>
                                          {['No.', 'Item', 'Brand'].map((h) => (
                                            <th key={h} style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #eff2f7', fontWeight: 600, color: '#555', fontSize: '0.75rem' }}>
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {insp.brand.map((b, j) => (
                                          <tr key={j}>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{j + 1}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{b.item || b.name || '–'}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{b.selectedAnser || b.brand || '–'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {(insp.material?.length ?? 0) > 0 && (
                                <div style={{ backgroundColor: '#F2F8FF', borderRadius: '4px' }}>
                                  <h5 style={{ margin: 0, padding: '12px 15px', fontSize: '0.875rem', fontWeight: 600, color: '#000', backgroundColor: '#FDB93F', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                                    Material Check ✓
                                  </h5>
                                  <div style={{ padding: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                      <thead>
                                        <tr>
                                          {['No.', 'Item', 'Material'].map((h) => (
                                            <th key={h} style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #eff2f7', fontWeight: 600, color: '#555', fontSize: '0.75rem' }}>
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {insp.material.map((m, j) => (
                                          <tr key={j}>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{j + 1}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{m.item || m.name || '–'}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{m.selectedAnser || m.material || '–'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {(insp.dimension?.length ?? 0) > 0 && (
                                <div style={{ backgroundColor: '#F2F8FF', borderRadius: '4px' }}>
                                  <h5 style={{ margin: 0, padding: '12px 15px', fontSize: '0.875rem', fontWeight: 600, color: '#000', backgroundColor: '#FDB93F', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                                    Dimension Check ✓
                                  </h5>
                                  <div style={{ padding: '8px' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                                      <thead>
                                        <tr>
                                          {['No.', 'Item', 'Value'].map((h) => (
                                            <th key={h} style={{ padding: '4px 8px', textAlign: 'left', borderBottom: '1px solid #eff2f7', fontWeight: 600, color: '#555', fontSize: '0.75rem' }}>
                                              {h}
                                            </th>
                                          ))}
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {insp.dimension.map((d, j) => (
                                          <tr key={j}>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{j + 1}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{d.item || d.name || '–'}</td>
                                            <td style={{ padding: '6px 8px', borderTop: '1px solid #eff2f7' }}>{d.selectedAnser || d.value || '–'}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              )}

                              {(insp.quality?.length ?? 0) > 0 && (
                                <div style={{ gridColumn: '1 / -1', backgroundColor: '#F2F8FF', borderRadius: '4px' }}>
                                  <h5 style={{ margin: 0, padding: '12px 15px', fontSize: '0.875rem', fontWeight: 600, color: '#000', backgroundColor: '#FDB93F', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
                                    Quality ✓
                                  </h5>
                                  <div style={{ padding: '10px 15px' }}>
                                    <ol style={{ margin: 0, paddingLeft: '17px' }}>
                                      {insp.quality.map((q, j) => (
                                        <li key={j} style={{ color: '#363636', fontSize: '12px', lineHeight: '22px', marginBottom: '10px' }}>
                                          <strong style={{ fontSize: '13px' }}>{q.item || `Item ${j + 1}`}</strong>
                                          <span style={{ display: 'block', paddingLeft: '14px', marginTop: '4px', marginBottom: '3px' }}>
                                            › {q.selectedAnser || q.status || '–'}
                                          </span>
                                          {(q.pictures?.length ?? 0) > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
                                              {q.pictures.map((pic, k) => (
                                                <a key={k} href={pic} target="_blank" rel="noopener noreferrer">
                                                  <div
                                                    style={{
                                                      width: '100px',
                                                      height: '100px',
                                                      backgroundImage: `url(${pic})`,
                                                      backgroundSize: 'cover',
                                                      backgroundPosition: 'center',
                                                      backgroundColor: '#f8f9fa',
                                                      borderRadius: '6px',
                                                      border: '1px solid #dee2e6',
                                                    }}
                                                  />
                                                </a>
                                              ))}
                                            </div>
                                          )}
                                          {q.issue && (
                                            <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#b91c1c' }}>
                                              <strong>Reported issue:- </strong>
                                              {q.issue}
                                            </p>
                                          )}
                                        </li>
                                      ))}
                                    </ol>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Validator QC Approval Panel */}
      {isValidator && !isValidated && onValidate && (
        <div style={{ ...cardStyle, border: '1px solid #fde68a', backgroundColor: '#fffbeb' }}>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: '#92400e', marginBottom: '0.5rem' }}>
            QC Validation & Approval
          </div>
          <p style={{ margin: '0 0 0.75rem', fontSize: '0.85rem', color: '#78350f' }}>
            Review all spaces, snags, and photos above before marking this inspection as Quality Validated.
          </p>
          <textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="Optional validator remarks..."
            rows={2}
            style={{
              width: '100%',
              padding: '0.6rem 0.75rem',
              borderRadius: '8px',
              border: '1px solid #fcd34d',
              marginBottom: '0.75rem',
              fontSize: '0.875rem',
              boxSizing: 'border-box',
            }}
          />
          <button
            type="button"
            disabled={validating}
            onClick={handleValidateClick}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '8px',
              border: 'none',
              background: '#16a34a',
              color: '#ffffff',
              fontWeight: 600,
              fontSize: '0.875rem',
              cursor: validating ? 'not-allowed' : 'pointer',
            }}
          >
            {validating ? 'Validating...' : '✓ Approve & Mark Validation Done'}
          </button>
        </div>
      )}

      {/* Reported Issue Popup (matches B2C ⚠ icon click) */}
      {reportedIssueModal && (
        <div
          onClick={() => setReportedIssueModal(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '10px',
              maxWidth: '520px',
              width: '100%',
              padding: '1.25rem',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>
                ⚠ Reported Issue — {reportedIssueModal.spaceName}
              </h3>
              <button
                type="button"
                onClick={() => setReportedIssueModal(null)}
                style={{ border: 'none', background: 'none', fontSize: '1.1rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>
            <p style={{ fontSize: '0.9rem', color: '#334155', margin: '0 0 1rem' }}>
              {reportedIssueModal.issue || 'No text description provided.'}
            </p>
            {reportedIssueModal.pictures?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {reportedIssueModal.pictures.map((pic, idx) => (
                  <a key={idx} href={pic} target="_blank" rel="noopener noreferrer">
                    <img
                      src={pic}
                      alt={`Issue ${idx + 1}`}
                      style={{ width: '96px', height: '96px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e2e8f0' }}
                    />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
