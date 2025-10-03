// Test the enhanced menu display with fallback data
// Run this in the browser console or as a React component test

import React from 'react';
import { createRoot } from 'react-dom/client';
import MenuDisplay from './MenuDisplay';

// Test component wrapper
function TestMenuDisplay() {
  const [cart, setCart] = React.useState([]);
  const [showCart, setShowCart] = React.useState(false);

  const handleViewCart = () => {
    setShowCart(true);
    console.log('View Cart clicked, cart has:', cart.length, 'items');
  };

  const handleBackToMenu = () => {
    setShowCart(false);
  };

  console.log('🧪 Testing Enhanced Menu Display');
  console.log('Current cart:', cart);

  if (showCart) {
    return (
      <div style={{ padding: '20px' }}>
        <h2>Cart View (Test Mode)</h2>
        <button onClick={handleBackToMenu}>← Back to Menu</button>
        <pre>{JSON.stringify(cart, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      <MenuDisplay
        cart={cart}
        setCart={setCart}
        onViewCart={handleViewCart}
      />
      
      {/* Debug panel */}
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: 'rgba(0,0,0,0.8)',
        color: 'white',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        maxWidth: '300px'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#4CAF50' }}>Debug Info</h4>
        <p>Cart Items: {cart.length}</p>
        <p>Total Quantity: {cart.reduce((sum, item) => sum + item.quantity, 0)}</p>
        <p>Categories: {cart.length > 0 ? [...new Set(cart.map(item => item.category))].join(', ') : 'None'}</p>
      </div>
    </div>
  );
}

// For testing in browser
if (typeof window !== 'undefined' && document.getElementById('menu-test')) {
  const container = document.getElementById('menu-test');
  const root = createRoot(container);
  root.render(<TestMenuDisplay />);
}

export default TestMenuDisplay;