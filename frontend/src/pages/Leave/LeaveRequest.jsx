import React from 'react';
import {
  inputStyle,
  primaryBtnStyle,
  successBtnStyle,
  dangerBtnStyle,
  tableStyle,
  thStyle,
  tdStyle,
} from '../../components/common';

export default function LeaveRequest({
  employees,
  leaveData,
  handleLeaveChange,
  handleLeaveSubmit,
  leaves,
  leaveBalances,
  handleLeaveAction,
  handleInitializeBalances,
  upcomingHolidays,        // ← အသစ်
  isAdmin,
  employeeId,
}) {
  const ownEmployee = employees.find(
    (e) => String(e.id) === String(employeeId)
  );

  // Working days preview တွက် helper
  const calculatePreviewDays = () => {
    if (!leaveData.start_date || !leaveData.end_date) return null;

    const start = new Date(leaveData.start_date);
    const end = new Date(leaveData.end_date);
    if (start > end) return null;

    let workingDays = 0;
    let holidayCount = 0;
    let weekendCount = 0;

    const current = new Date(start);
    while (current <= end) {
      const day = current.getDay(); // 0 = Sun, 6 = Sat
      const dateStr = current.toISOString().split('T')[0];
      const isWeekend = day === 0 || day === 6;
      const isHoliday = (upcomingHolidays || []).some(
        (h) => h.date === dateStr
      );

      if (isHoliday) holidayCount++;
      else if (isWeekend) weekendCount++;
      else workingDays++;

      current.setDate(current.getDate() + 1);
    }

    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1;
    return { totalDays, workingDays, holidayCount, weekendCount };
  };

  const preview = calculatePreviewDays();

  return (
    <div>
      {/* ── Leave Balance Cards ─────────────────────────────── */}
      {leaveBalances && leaveBalances.length > 0 && (
        <div style={{ marginBottom: '30px' }}>
          <h3
            style={{
              color: '#2c3e50',
              borderBottom: '2px solid #f1f2f6',
              paddingBottom: '10px',
              marginTop: 0,
            }}
          >
            ခွင့်လက်ကျန် (Leave Balance)
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '15px',
              marginTop: '15px',
            }}
          >
            {leaveBalances.map((bal) => (
              <div
                key={bal.id}
                style={{
                  background: 'white',
                  padding: '20px',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  borderLeft: '4px solid #2980b9',
                }}
              >
                <div
                  style={{
                    fontSize: '12px',
                    color: '#7f8c8d',
                    textTransform: 'uppercase',
                    marginBottom: '5px',
                    fontWeight: '600',
                    letterSpacing: '0.5px',
                  }}
                >
                  {bal.leave_type} ({bal.year})
                </div>
                <div
                  style={{
                    fontSize: '28px',
                    fontWeight: '700',
                    color: '#2c3e50',
                  }}
                >
                  {bal.available_days}
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#7f8c8d',
                      fontWeight: '400',
                    }}
                  >
                    {' '}
                    days
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    color: '#95a5a6',
                    marginTop: '8px',
                  }}
                >
                  Entitled: {bal.entitled_days} · Used: {bal.used_days}
                  {parseFloat(bal.adjustment_days) !== 0 && (
                    <>
                      {' '}
                      · Adjusted:{' '}
                      {parseFloat(bal.adjustment_days) > 0 ? '+' : ''}
                      {bal.adjustment_days}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Admin: Initialize Balance Button ───────────────── */}
      {isAdmin && (
        <div style={{ marginBottom: '20px' }}>
          <button
            type="button"
            onClick={() => {
              const empId = prompt(
                'Employee ID ကို ထည့်ပါ (balance initialize လုပ်ရန်)'
              );
              if (empId) handleInitializeBalances(empId);
            }}
            style={{
              padding: '8px 16px',
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: '600',
            }}
          >
            + Initialize Balance for Employee
          </button>
        </div>
      )}

      {/* ── Upcoming Holidays ─────────────────────────────── */}
      {upcomingHolidays && upcomingHolidays.length > 0 && (
        <details
          style={{
            background: '#fff8e1',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            borderLeft: '4px solid #f39c12',
          }}
        >
          <summary
            style={{
              cursor: 'pointer',
              fontWeight: '600',
              color: '#d68910',
              fontSize: '14px',
            }}
          >
            📅 လာမယ့် Public Holidays ({upcomingHolidays.length} ရက်)
          </summary>
          <ul
            style={{
              marginTop: '10px',
              paddingLeft: '20px',
              fontSize: '13px',
              color: '#7f8c8d',
              lineHeight: '1.8',
            }}
          >
            {upcomingHolidays.slice(0, 10).map((h) => (
              <li key={h.id}>
                <strong>{h.date}</strong> — {h.name}{' '}
                <span style={{ color: '#95a5a6' }}>({h.region_display})</span>
              </li>
            ))}
            {upcomingHolidays.length > 10 && (
              <li style={{ color: '#95a5a6', fontStyle: 'italic' }}>
                ... နောက်ထပ် {upcomingHolidays.length - 10} ရက်
              </li>
            )}
          </ul>
        </details>
      )}

      {/* ── Leave Application Form ────────────────────────── */}
      <h3
        style={{
          color: '#2c3e50',
          borderBottom: '2px solid #f1f2f6',
          paddingBottom: '10px',
          marginTop: 0,
        }}
      >
        ခွင့်တင်ရန် (Leave Application)
      </h3>
      <form
        onSubmit={handleLeaveSubmit}
        style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px',
          border: '1px solid #e9ecef',
        }}
      >
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '15px',
          }}
        >
          {isAdmin ? (
            <select
              name="employee"
              value={leaveData.employee}
              onChange={handleLeaveChange}
              required
              style={inputStyle}
            >
              <option value="">ဝန်ထမ်းရွေးချယ်ပါ</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.first_name} {emp.last_name}
                </option>
              ))}
            </select>
          ) : (
            <select
              name="employee"
              value={employeeId || ''}
              disabled
              style={inputStyle}
            >
              <option value={employeeId || ''}>
                {ownEmployee
                  ? `${ownEmployee.first_name} ${ownEmployee.last_name}`
                  : 'ကျွန်ုပ်'}
              </option>
            </select>
          )}

          <select
            name="leave_type"
            value={leaveData.leave_type}
            onChange={handleLeaveChange}
            required
            style={inputStyle}
          >
            <option value="casual">Casual Leave (ရှောင်တခင်ခွင့်)</option>
            <option value="medical">Medical Leave (ဆေးခွင့်)</option>
            <option value="annual">Annual Leave (နှစ်စဉ်ခွင့်)</option>
          </select>

          <div>
            <label
              style={{
                fontSize: '13px',
                color: '#666',
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
              }}
            >
              စတင်မည့်ရက်:
            </label>
            <input
              type="date"
              name="start_date"
              value={leaveData.start_date}
              onChange={handleLeaveChange}
              required
              style={inputStyle}
            />
          </div>

          <div>
            <label
              style={{
                fontSize: '13px',
                color: '#666',
                display: 'block',
                marginBottom: '5px',
                fontWeight: '500',
              }}
            >
              ပြီးဆုံးမည့်ရက်:
            </label>
            <input
              type="date"
              name="end_date"
              value={leaveData.end_date}
              onChange={handleLeaveChange}
              required
              style={inputStyle}
            />
          </div>

          <textarea
            name="reason"
            placeholder="ခွင့်ယူရသည့် အကြောင်းရင်း..."
            value={leaveData.reason}
            onChange={handleLeaveChange}
            required
            style={{ ...inputStyle, gridColumn: 'span 2', height: '80px' }}
          ></textarea>
        </div>

        {/* ── Working Days Preview ────────────────────── */}
        {preview && (
          <div
            style={{
              background:
                preview.workingDays === 0 ? '#fadbd8' : '#d4efdf',
              padding: '12px 16px',
              borderRadius: '8px',
              marginTop: '15px',
              fontSize: '14px',
              color:
                preview.workingDays === 0 ? '#c0392b' : '#27ae60',
              borderLeft: `4px solid ${
                preview.workingDays === 0 ? '#c0392b' : '#27ae60'
              }`,
            }}
          >
            <strong>Preview:</strong> စုစုပေါင်း {preview.totalDays} ရက် →{' '}
            <strong>လုပ်ငန်းရက် {preview.workingDays} ရက်</strong>
            {preview.weekendCount > 0 && (
              <span style={{ color: '#7f8c8d', marginLeft: '8px' }}>
                (weekend {preview.weekendCount})
              </span>
            )}
            {preview.holidayCount > 0 && (
              <span style={{ color: '#d68910', marginLeft: '8px' }}>
                (holiday {preview.holidayCount})
              </span>
            )}
            {preview.workingDays === 0 && (
              <div style={{ fontSize: '12px', marginTop: '6px', color: '#c0392b' }}>
                ⚠️ weekend/holiday ပဲ ဖြစ်နေတယ် — ခွင့်တင်လို့ မရပါ
              </div>
            )}
          </div>
        )}

        <button
          type="submit"
          style={{ ...primaryBtnStyle, marginTop: '20px' }}
        >
          ခွင့်တင်မည်
        </button>
      </form>

      {/* ── Leave Requests Table ──────────────────────────── */}
      <h3
        style={{
          color: '#2c3e50',
          borderBottom: '2px solid #f1f2f6',
          paddingBottom: '10px',
        }}
      >
        ခွင့်တောင်းခံထားမှု စာရင်းများ
      </h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyle}>
          <thead>
            <tr
              style={{
                background: '#2c3e50',
                color: 'white',
                textAlign: 'left',
              }}
            >
              <th style={thStyle}>ဝန်ထမ်းအမည်</th>
              <th style={thStyle}>ခွင့်အမျိုးအစား</th>
              <th style={thStyle}>စတင်ရက်</th>
              <th style={thStyle}>ပြီးဆုံးရက်</th>
              <th style={thStyle}>အကြောင်းရင်း</th>
              <th style={thStyle}>Status</th>
              {isAdmin && <th style={thStyle}>Action (Admin)</th>}
            </tr>
          </thead>
          <tbody>
            {leaves.length > 0 ? (
              leaves.map((leave, index) => (
                <tr
                  key={leave.id}
                  style={{
                    background: index % 2 === 0 ? '#fcfcfc' : '#ffffff',
                  }}
                >
                  <td style={tdStyle}>{leave.employee_name || '—'}</td>
                  <td style={tdStyle}>{leave.leave_type.toUpperCase()}</td>
                  <td style={tdStyle}>{leave.start_date}</td>
                  <td style={tdStyle}>{leave.end_date}</td>
                  <td style={tdStyle}>{leave.reason}</td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        color: 'white',
                        background:
                          leave.status === 'pending'
                            ? '#f39c12'
                            : leave.status === 'approved'
                            ? '#27ae60'
                            : '#c0392b',
                      }}
                    >
                      {leave.status.toUpperCase()}
                    </span>
                  </td>
                  {isAdmin && (
                    <td style={tdStyle}>
                      {leave.status === 'pending' && (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onClick={() =>
                              handleLeaveAction(leave.id, 'approved')
                            }
                            style={successBtnStyle}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() =>
                              handleLeaveAction(leave.id, 'rejected')
                            }
                            style={dangerBtnStyle}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={isAdmin ? 7 : 6}
                  style={{
                    textAlign: 'center',
                    padding: '20px',
                    color: '#7f8c8d',
                  }}
                >
                  ခွင့်တင်ထားမှု မရှိသေးပါ။
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}