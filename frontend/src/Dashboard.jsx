import React, { useState, useEffect } from 'react';

function EnterpriseDashboard() {
  const [metrics, setMetrics] = useState({
    active_headcount: 0,
    monthly_labor_cost: 0,
    pending_approvals: 0,
    timestamp: null
  });

  useEffect(() => {
    // Subscribe to Django SSE Stream
    const eventSource = new EventSource('http://127.0.0.1:8000/api/analytics/stream/');

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMetrics(data);
    };

    eventSource.onerror = (err) => {
      console.error("EventSource failed:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Real-Time Workforce Telemetry Dashboard</h2>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '20px' }}>
        
        <div style={{ padding: '20px', background: '#007bff', color: 'white', borderRadius: '8px' }}>
          <h3>Active Headcount</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0' }}>{metrics.active_headcount}</p>
        </div>

        <div style={{ padding: '20px', background: '#28a745', color: 'white', borderRadius: '8px' }}>
          <h3>Monthly Labor Cost</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0' }}>
            ${metrics.monthly_labor_cost.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div style={{ padding: '20px', background: '#ffc107', color: '#333', borderRadius: '8px' }}>
          <h3>Pending Workflow Approvals</h3>
          <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '10px 0 0 0' }}>{metrics.pending_approvals}</p>
        </div>

      </div>
      {metrics.timestamp && (
        <p style={{ marginTop: '15px', fontSize: '12px', color: '#666' }}>
          Live Stream Connected. Last packet received: {new Date(metrics.timestamp * 1000).toLocaleTimeString()}
        </p>
      )}
    </div>
  );
}

export default EnterpriseDashboard;