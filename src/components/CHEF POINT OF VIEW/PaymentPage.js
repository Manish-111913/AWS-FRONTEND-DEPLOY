import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import './PaymentPage.css';

const PaymentPage = ({ orderData, onPaymentComplete, onBack, onPaymentSuccess }) => {
  const [currentOrderData, setCurrentOrderData] = useState(null);

  useEffect(() => {
    // Get order data from props or use fallback data
    if (orderData?.items) {
      setCurrentOrderData(orderData);
    } else {
      // Fallback to sample data if no order data provided
      setCurrentOrderData({
        items: [
          { name: 'Classic Burger', quantity: 2, price: 12.00 },
          { name: 'Fries', quantity: 1, price: 8.00 },
          { name: 'Soda', quantity: 1, price: 3.00 }
        ]
      });
    }
  }, [orderData]);

  const calculateSubtotal = () => {
    if (!currentOrderData?.items) return 0;
    return currentOrderData.items.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTax = () => {
    const subtotal = calculateSubtotal();
    return subtotal * 0.08; // 8% tax
  };

  const calculateTotal = () => {
    return calculateSubtotal() + calculateTax();
  };

  const handlePayNow = () => {
    // For now, simulate successful payment and create order
    handleConfirmPay('UPI');
  };

  const handlePayAtCounter = () => {
    // For now, simulate pay at counter and create order
    handleConfirmPay('COUNTER');
  };

  const handleConfirmPay = (methodOverride) => {
    // Compute total and pass payment details forward
    const subtotal = calculateSubtotal();
    const tax = calculateTax();
    const totalAmount = subtotal + tax;
    const paymentDetails = {
      paymentMethod: methodOverride || 'online',
      totalAmount,
      transactionId: `TXN-${Date.now()}`
    };
    const enriched = { ...currentOrderData, ...paymentDetails };
    onPaymentSuccess && onPaymentSuccess(enriched); // Navigate to success page and let QrBillingApp create order
  };

  const handleClose = () => {
    onBack && onBack(); // Go back to cart
  };

  if (!currentOrderData) {
    return <div className="payment-loading">Loading...</div>;
  }

  return (
    <div className="qr-payment-container">
      {/* Header */}
      <div className="qr-header">
        <div className="payment-header">
          <button className="close-btn" onClick={handleClose}>
            <X size={24} />
          </button>
          <h1 className="payment-title">Payment</h1>
        </div>
      </div>

        {/* Order Summary */}
        <div className="order-summary-section">
          <h2 className="section-title">Order Summary</h2>
          
          <div className="order-items">
            {currentOrderData.items.map((item, index) => (
              <div key={index} className="order-item">
                <div className="item-info">
                  <div className="item-name">{item.name}</div>
                  <div className="item-quantity">{item.quantity} x ₹{item.price.toFixed(2)}</div>
                </div>
                <div className="item-total">₹{(item.quantity * item.price).toFixed(2)}</div>
              </div>
            ))}
          </div>

          {/* Summary Section */}
          <div className="summary-section">
            <h3 className="summary-title">Summary</h3>
            <div className="summary-line"></div>
            
            <div className="summary-row">
              <span>Subtotal</span>
              <span>₹{calculateSubtotal().toFixed(2)}</span>
            </div>
            
            <div className="summary-row">
              <span>Tax</span>
              <span>₹{calculateTax().toFixed(2)}</span>
            </div>
            
            <div className="summary-row total-row">
              <span>Total</span>
              <span>₹{calculateTotal().toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="payment-method-section">
            <h3 className="section-title">Payment Method</h3>
            
            <button className="payment-btn primary-btn" onClick={handlePayNow}>
              Pay Now (UPI, Paytm, Google Pay)
            </button>
            
            <button className="payment-btn secondary-btn" onClick={handlePayAtCounter}>
              Pay at Counter
            </button>
            
            <button className="payment-btn confirm-btn" onClick={() => handleConfirmPay('online')}>
              Confirm & Pay
            </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentPage;