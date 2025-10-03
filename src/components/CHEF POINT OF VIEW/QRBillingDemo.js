import React, { useState } from 'react';
import MenuDisplay from './MenuDisplay';
import CartPage from './CartPage';
import './QRBillingDemo.css';

// Demo component showing the complete QR Billing Menu and Cart system
export default function QRBillingDemo() {
  const [currentView, setCurrentView] = useState('menu'); // 'menu' or 'cart'
  const [cart, setCart] = useState([]);

  const handleViewCart = () => {
    setCurrentView('cart');
  };

  const handleBackToMenu = () => {
    setCurrentView('menu');
  };

  const handleCheckout = (orderData) => {
    console.log('🎉 Order placed successfully!', orderData);
    
    // Here you would typically:
    // 1. Send order to backend API
    // 2. Process payment
    // 3. Generate QR code for order tracking
    // 4. Send confirmation to user
    
    alert(`Order placed! Total: ₹${orderData.total.toFixed(2)}`);
    
    // Clear cart after successful order
    setCart([]);
    setCurrentView('menu');
  };

  const cartItemCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="qr-billing-demo">
      {/* Navigation Header */}
      <div className="demo-header">
        <h1>QR Billing System</h1>
        <div className="nav-buttons">
          <button 
            className={`nav-btn ${currentView === 'menu' ? 'active' : ''}`}
            onClick={() => setCurrentView('menu')}
          >
            Menu
            <span className="item-count">{cart.length > 0 ? `(${cart.length} categories)` : ''}</span>
          </button>
          <button 
            className={`nav-btn ${currentView === 'cart' ? 'active' : ''}`}
            onClick={() => setCurrentView('cart')}
          >
            Cart
            {cartItemCount > 0 && <span className="cart-badge">{cartItemCount}</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="demo-content">
        {currentView === 'menu' && (
          <MenuDisplay
            cart={cart}
            setCart={setCart}
            onViewCart={handleViewCart}
          />
        )}
        
        {currentView === 'cart' && (
          <CartPage
            cart={cart}
            setCart={setCart}
            onCheckout={handleCheckout}
            onBackToMenu={handleBackToMenu}
          />
        )}
      </div>

      {/* Debug Info (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-info">
          <h4>Debug Info:</h4>
          <p>Current View: {currentView}</p>
          <p>Cart Items: {cartItemCount}</p>
          <p>Cart Categories: {[...new Set(cart.map(item => item.category))].join(', ')}</p>
          <details>
            <summary>Cart Contents</summary>
            <pre>{JSON.stringify(cart, null, 2)}</pre>
          </details>
        </div>
      )}
    </div>
  );
}