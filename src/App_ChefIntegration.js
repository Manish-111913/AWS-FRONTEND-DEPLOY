// Example App.js integration for Chef Dashboard

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import ChefDashboard from './components/CHEF POINT OF VIEW/ChefDashboard';
import OrdersPage from './components/CHEF POINT OF VIEW/OrdersPage';
import OwnerDashboard from './components/OWNER POINT OF VIEW/OwnerDashboard';
import QrBillingApp from './components/CHEF POINT OF VIEW/QrBillingApp';

// Wrapper component to pass orderId from URL params to OrdersPage
function OrdersPageWrapper() {
  const { orderId } = useParams();
  return <OrdersPage orderId={orderId} />;
}

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Customer Routes */}
          <Route path="/" element={<Navigate to="/customer" replace />} />
          <Route path="/customer" element={<QrBillingApp />} />
          <Route path="/customer/orders/:orderId" element={<OrdersPageWrapper />} />
          
          {/* Chef Routes */}
          <Route path="/chef" element={<Navigate to="/chef/dashboard" replace />} />
          <Route path="/chef/dashboard" element={<ChefDashboard />} />
          
          {/* Owner Routes */}
          <Route path="/owner" element={<Navigate to="/owner/dashboard" replace />} />
          <Route path="/owner/dashboard" element={<OwnerDashboard />} />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/customer" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;