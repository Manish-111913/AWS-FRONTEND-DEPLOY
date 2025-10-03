import React, { useState, useEffect } from 'react';
import OwnerDashboard from './OwnerDashboard';
import OwnerAnalytics from './OwnerAnalytics';
import './ownerApp.css';
import { BarChart2, LayoutGrid } from 'lucide-react';

// Shell container for Owner POV similar to QrBillingApp to unify background + footer
export default function OwnerApp() {
  const [tab, setTab] = useState('dashboard');
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('owner-app-active');
    return () => document.body.classList.remove('owner-app-active');
  }, []);

  return (
    <div className="owner-theme">
      <div className="owner-shell">
        <div className="owner-content">
          {tab === 'dashboard' && <OwnerDashboard onModalChange={setModalOpen} />}
          {tab === 'analytics' && <OwnerAnalytics />}
        </div>
        <div className={`owner-tabbar-outer ${modalOpen ? 'owner-tabbar-hidden' : ''}`}>
          <div className="owner-tabbar-inner">
            <div className="owner-tabbar">
              <button className={tab==='dashboard'? 'active':''} onClick={()=>setTab('dashboard')}>
                <LayoutGrid size={18} />
                <span>Dashboard</span>
              </button>
              <button className={tab==='analytics'? 'active':''} onClick={()=>setTab('analytics')}>
                <BarChart2 size={18} />
                <span>Analytics</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
