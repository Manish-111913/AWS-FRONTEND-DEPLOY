import React, { useState } from 'react';
import { ServiceHealthChecker } from '../services';
import { API_BASE_URL } from '../services/apiClient';

const Navigation = ({ currentScreen, goTo }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);

  const navigationItems = [
    { id: 'overview', label: '📊 Overview', category: 'Main' },
    { id: 'abc', label: '🔠 ABC Analysis', category: 'Main' },
    { id: 'qr-onboarding', label: '🧭 QR Onboarding', category: 'Setup' },
    { id: 'inventory-calculator', label: '🧮 Inventory Calculator', category: 'Setup' },
    { id: 'qr-billing', label: '🧾 QR Billing', category: 'Operations' },
    { id: 'qr-management', label: '🏷️ QR Management', category: 'Operations' },
    { id: 'owner-dashboard', label: '👑 Owner POV', category: 'Operations' },
    { id: 'stock-in', label: '📦 Stock In', category: 'Inventory' },
    { id: 'stock-out', label: '📤 Stock Out', category: 'Inventory' },
    { id: 'usage', label: '🍽️ Usage', category: 'Operations' },
    { id: 'complimentary-items', label: '🍛 Complimentary Items', category: 'Operations' },
    { id: 'todays-sales-report', label: '📈 Today\'s Sales', category: 'Operations' },
    { id: 'ocr', label: '📄 OCR Scanner', category: 'Tools' },
    { id: 'vendors', label: '🏪 Vendors', category: 'Management' },
    { id: 'itemmap', label: '🧩 Item Mapping', category: 'Setup' },
    { id: 'minimal-stock', label: '🛡️ Minimal Stock', category: 'Inventory' },
  { id: 'wastage-thresholds', label: '🚯 Wastage Thresholds', category: 'Inventory' },
    { id: 'create-reorder', label: '🛒 Create Reorder', category: 'Inventory' },
    { id: 'map', label: '📏 Unit Mapping', category: 'Setup' },
    { id: 'test', label: '🧪 API Test', category: 'Debug' },
    { id: 'service-test', label: '🔬 Service Tester', category: 'Debug' }
  ];

  const categories = {
    'Main': '🏠',
    'Inventory': '📦',
    'Operations': '⚙️',
    'Tools': '🛠️',
    'Management': '👥',
    'Setup': '⚙️',
    'Debug': '🐛'
  };

  const checkHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const results = await ServiceHealthChecker.checkAllServices();
      setHealthStatus(results);
    } catch (error) {
      console.error('Health check failed:', error);
    } finally {
      setIsCheckingHealth(false);
    }
  };

  const groupedItems = navigationItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {});

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000
    }}>
      {/* Navigation Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '12px',
          backgroundColor: '#2196f3',
          color: 'white',
          border: 'none',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '20px',
          width: '50px',
          height: '50px',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)'
        }}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Navigation Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          backgroundColor: 'white',
          border: '1px solid #ddd',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          minWidth: '250px',
          maxHeight: '80vh',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <div style={{
            padding: '16px',
            borderBottom: '1px solid #eee',
            backgroundColor: '#f8f9fa'
          }}>
            <h3 style={{ margin: 0, fontSize: '16px', color: '#000' }}>Navigation</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>Current: {currentScreen}</p>
          </div>

          {/* Health Check */}
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid #eee'
          }}>
            <button
              onClick={checkHealth}
              disabled={isCheckingHealth}
              style={{
                width: '100%',
                padding: '8px',
                backgroundColor: isCheckingHealth ? '#ccc' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isCheckingHealth ? 'not-allowed' : 'pointer',
                fontSize: '12px'
              }}
            >
              {isCheckingHealth ? '🔄 Checking...' : '🏥 Check API Health'}
            </button>
            
            {healthStatus && (
              <div style={{ marginTop: '8px', fontSize: '11px' }}>
                {Object.entries(healthStatus).map(([service, status]) => (
                  <div key={service} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '2px 0',
                    color: status.status === 'healthy' ? '#28a745' : '#dc3545'
                  }}>
                    <span>{service}:</span>
                    <span>{status.status === 'healthy' ? '✅' : '❌'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation Items */}
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <div style={{
                padding: '8px 16px',
                backgroundColor: '#f1f3f4',
                fontSize: '12px',
                fontWeight: 'bold',
                color: '#5f6368'
              }}>
                {categories[category]} {category}
              </div>
              {items.map(item => (
                <button
                  key={item.id}
                  onClick={() => {
                    goTo(item.id);
                    setIsOpen(false);
                  }}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: 'none',
                    backgroundColor: currentScreen === item.id ? '#e3f2fd' : 'transparent',
                    color: currentScreen === item.id ? '#1976d2' : '#000',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '14px',
                    borderBottom: '1px solid #f0f0f0'
                  }}
                  onMouseEnter={(e) => {
                    if (currentScreen !== item.id) {
                      e.target.style.backgroundColor = '#f5f5f5';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (currentScreen !== item.id) {
                      e.target.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ))}

          {/* Footer */}
          <div style={{
            padding: '12px 16px',
            borderTop: '1px solid #eee',
            backgroundColor: '#f8f9fa',
            fontSize: '11px',
            color: '#666',
            textAlign: 'center'
          }}>
            🌐 API: {API_BASE_URL}<br/>
            📱 Frontend: localhost:3000
          </div>
        </div>
      )}
    </div>
  );
};

export default Navigation;