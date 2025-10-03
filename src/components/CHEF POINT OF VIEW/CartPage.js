import React, { useState, useMemo } from 'react';
import './CartPage.css';
import './shared.css';
import { Plus, Minus, Trash2, ShoppingCart, ArrowLeft } from 'lucide-react';

export default function CartPage({ cart = [], setCart, onCheckout, onBackToMenu }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [notes, setNotes] = useState('');

  const formatINR = (v) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(v || 0));

  const totalItems = useMemo(()=> cart.reduce((s,i)=>s+i.quantity,0), [cart]);
  const subtotal = useMemo(()=> cart.reduce((s,i)=>s + i.price * i.quantity,0), [cart]);
  const tax = subtotal * 0.08;
  const delivery = cart.length ? 3.99 : 0;
  const grandTotal = subtotal + tax + delivery;

  const updateQty = (id, change) => {
    setCart(prev => prev
      .map(it => it.id === id ? { ...it, quantity: Math.max(0, it.quantity + change) } : it)
      .filter(it => it.quantity > 0)
    );
  };
  const removeItem = (id) => setCart(prev => prev.filter(i=>i.id!==id));

  if (!cart.length) return (
    <div className="qr-cart-empty">
      <ShoppingCart size={80} color="#666" />
      <h3>Your cart is empty</h3>
      <p>Add some delicious items to get started!</p>
      {onBackToMenu && (
        <button className="back-to-menu-btn" onClick={onBackToMenu}>
          <ArrowLeft size={16} />
          Browse Menu
        </button>
      )}
    </div>
  );

  return (
    <div className="qr-cart">
      <div className="qr-cart-head">
        <div className="cart-header-left">
          {onBackToMenu && (
            <button className="back-btn" onClick={onBackToMenu}>
              <ArrowLeft size={20} />
            </button>
          )}
          <div>
            <h2>Your Cart</h2>
            <span className="items">{totalItems} items</span>
          </div>
        </div>
      </div>
      <div className="qr-cart-list">
        {cart.map(item => (
          <div key={item.id} className="qr-cart-item">
            <img src={item.image} alt={item.name} />
            <div className="info">
              <h4>{item.name}</h4>
              <p className="category">Category: {item.category || 'General'}</p>
              {!!(item.customizations && item.customizations.length > 0) && (
                <p className="customs">{item.customizations.join(', ')}</p>
              )}
              <div className="price">
                <span className="line-total">{formatINR(item.price * item.quantity)}</span>
              </div>
            </div>
            <div className="qty">
              <button onClick={()=>updateQty(item.id,-1)}><Minus size={14}/></button>
              <span>{item.quantity}</span>
              <button onClick={()=>updateQty(item.id,1)}><Plus size={14}/></button>
            </div>
            <button className="remove" onClick={()=>removeItem(item.id)}><Trash2 size={18} color="#ff4444" /></button>
          </div>
        ))}
      </div>
      <div className="qr-summary">
        <div className="row"><span>Subtotal:</span><span>{formatINR(subtotal)}</span></div>
        <div className="row"><span>Tax (8% of subtotal):</span><span>{formatINR(tax)}</span></div>
        <div className="row"><span>Delivery:</span><span>{formatINR(delivery)}</span></div>
        <div className="row total"><span>Total:</span><span>{formatINR(grandTotal)}</span></div>
        <div className="row note"><small>Note: Tax is computed at 8% of the subtotal.</small></div>
      </div>

      {/* Special Instructions */}
      <div className="special-notes">
        <label htmlFor="notes">Special Instructions (Optional):</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any special requests or dietary requirements..."
          rows={3}
        />
      </div>

      <div className="cart-actions">
        {onBackToMenu && (
          <button className="continue-shopping-btn" onClick={onBackToMenu}>
            <ArrowLeft size={16} />
            Add More Items
          </button>
        )}
        <button className="checkout-btn" onClick={()=> setShowConfirm(true)}>
          Proceed to Checkout
        </button>
      </div>

      {showConfirm && (
        <div className="qr-modal-backdrop center" onClick={()=>setShowConfirm(false)}>
          <div className="qr-modal small" onClick={e=>e.stopPropagation()}>
            <h3>Confirm Your Order</h3>
            <div className="order-summary">
              <p><strong>Total: {formatINR(grandTotal)}</strong></p>
              <p>Items: {totalItems}</p>
              <p>Estimated delivery: 30-45 minutes</p>
              {notes && (
                <div className="order-notes">
                  <p><strong>Special Instructions:</strong></p>
                  <p className="notes-text">{notes}</p>
                </div>
              )}
            </div>
            <div className="qr-actions">
              <button onClick={()=>setShowConfirm(false)} className="secondary">Cancel</button>
              <button onClick={()=>{ 
                onCheckout && onCheckout({ cart, total: grandTotal, notes });
                setShowConfirm(false); 
              }}>Confirm Order</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
