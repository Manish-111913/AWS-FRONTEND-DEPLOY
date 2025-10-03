import React, { useState, useMemo, useEffect } from 'react';
import './MenuPage.css';
import './shared.css';
import { Search, Filter, Clock, Star, Plus, Minus, X, TrendingUp, Heart, Tag, DollarSign, Timer } from 'lucide-react';
import TenantAwareMenuService from '../../services/tenantAwareMenuService';
// import OrderService from '../../services/orderService'; // Commented out - not used since placeOrder function is disabled
// import { getTenant } from '../../services/tenantContext'; // Commented out unused import
import PaymentPage from './PaymentPage';
import PaymentSuccessPage from './PaymentSuccessPage';

// Web-adapted version of the Expo Menu screen.
// Replaces React Native components with standard HTML elements and CSS classes.

const categories = ['All', 'Starters', 'Main Course', 'Desserts', 'Drinks', 'Beverages', 'Complimentary', 'Signature Dishes', 'Snacks'];
const filterDefs = [
  { id: 'trending', name: 'Trending', icon: TrendingUp },
  { id: 'liked', name: 'Most Liked', icon: Heart },
  { id: 'offers', name: 'Offers', icon: Tag },
  { id: 'price', name: 'Price', icon: DollarSign },
  { id: 'time', name: 'Prep Time', icon: Timer },
];

export default function MenuCard({ onSelectAdd, onQuantityChange, quantities = {}, tableNumber: propTableNumber, goTo }) {
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('All');
  const [filters, setFilters] = useState([]);
  const [localQuantities, setLocalQuantities] = useState(quantities);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cart, setCart] = useState([]);
  // const [placing, setPlacing] = useState(false); // Commented out unused variable
  
  // Payment flow state management
  const [currentView, setCurrentView] = useState('menu'); // 'menu', 'cart', 'payment', 'success'
  const [orderData, setOrderData] = useState(null);
  
  // Load menu items from database
  useEffect(() => {
    const loadMenuItems = async () => {
      try {
        console.log('🍽️ MenuPage: Loading items from database...');
        const response = await TenantAwareMenuService.getMenuItems();
        
        if (response.success && response.data) {
          // Transform database items to match the expected format
          const transformedItems = response.data.map(item => ({
            id: item.id.toString(),
            name: item.name,
            description: `Fresh ${item.name.toLowerCase()}, grilled to perfection, served with roasted vegetables and lemon sauce.`,
            price: parseFloat(item.price),
            image_url: item.image_url || 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400',
            category: item.category,
            prepTime: 8 + Math.floor(Math.random() * 15), // Random prep time for demo
            isAvailable: item.is_active,
            isTrending: Math.random() > 0.7, // Random trending status for demo
            isLiked: Math.random() > 0.5,
            hasOffer: item.price > 100 && Math.random() > 0.8, // Offers for expensive items
            rating: (4.0 + Math.random() * 1.0).toFixed(1), // Random rating between 4.0-5.0
            customizations: ['Spicy', 'Mild', 'Extra portions'],
            recommendations: ['Rice', 'Bread'],
            serving_unit: item.serving_unit || 'piece'
          }));
          
          setMenuItems(transformedItems);
          console.log(`✅ MenuPage: Loaded ${transformedItems.length} items from ${response.source}`);
          setError(null);
        } else {
          throw new Error('Failed to load menu items');
        }
      } catch (err) {
        console.error('❌ MenuPage: Error loading menu items:', err);
        setError('Failed to load menu items');
        // Keep empty array for now
      } finally {
        setLoading(false);
      }
    };

    loadMenuItems();
  }, []);

  // Sync when parent changes (e.g., cart modifications from CartPage)
  React.useEffect(()=>{ setLocalQuantities(quantities); }, [quantities]);
  const [modalItem, setModalItem] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [recommendation, setRecommendation] = useState(null);

  const toggleFilter = (id) => {
    setFilters(prev => prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]);
  };

  const updateQty = (id, change) => {
    setLocalQuantities(prev => {
      const next = { ...prev, [id]: Math.max(0, (prev[id] || 0) + change) };
      const item = menuItems.find(i=>i.id===id);
      if (item && onQuantityChange) onQuantityChange(item, next[id]);
      
      // Update cart when quantity changes
      if (next[id] > 0) {
        addToCart(item, next[id]);
      } else {
        removeFromCart(id);
      }
      
      return next;
    });
  };

  // Cart management functions
  const addToCart = (item, quantity = 1) => {
    console.log('🛒 Adding to cart:', item.name, 'quantity:', quantity);
    setCart(prev => {
      const existingIndex = prev.findIndex(p => p.id === item.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = { 
          ...updated[existingIndex], 
          quantity: quantity 
        };
        console.log('📝 Updated cart:', updated);
        return updated;
      }
      const newCart = [...prev, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        quantity: quantity,
        image: item.image_url || item.image
      }];
      console.log('📝 New cart:', newCart);
      return newCart;
    });
  };

  // Simple direct add to cart function
  const directAddToCart = (item) => {
    console.log('🎯 Direct add to cart:', item.name);
    setCart(prev => {
      const existingItem = prev.find(p => p.id === item.id);
      if (existingItem) {
        const updated = prev.map(p => 
          p.id === item.id 
            ? { ...p, quantity: p.quantity + 1 }
            : p
        );
        console.log('📝 Updated cart after add:', updated);
        return updated;
      }
      const newCart = [...prev, { 
        id: item.id, 
        name: item.name, 
        price: item.price, 
        quantity: 1,
        image: item.image_url || item.image
      }];
      console.log('📝 New cart after add:', newCart);
      return newCart;
    });
    
    // Also update local quantities for UI
    setLocalQuantities(prev => ({
      ...prev,
      [item.id]: (prev[item.id] || 0) + 1
    }));
    
    // Item added successfully
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const increaseCartItem = (id) => {
    setCart(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    ));
    setLocalQuantities(prev => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const decreaseCartItem = (id) => {
    setCart(prev => {
      const updated = prev.map(item => 
        item.id === id ? { ...item, quantity: Math.max(0, item.quantity - 1) } : item
      ).filter(item => item.quantity > 0);
      return updated;
    });
    setLocalQuantities(prev => {
      const newQty = Math.max(0, (prev[id] || 0) - 1);
      return { ...prev, [id]: newQty };
    });
  };

  // Cart totals calculation
  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08; // 8% tax
    const delivery = cart.length > 0 ? 3.99 : 0;
    const total = subtotal + tax + delivery;
    return { subtotal, tax, delivery, total };
  }, [cart]);

  // Place order function (commented out as it's not used)
  /*
  const placeOrder = async () => {
    if (!cart.length) return;
    setPlacing(true);
    setError(null);
    
    try {
      let scannedTable = propTableNumber;
      if (!scannedTable) {
        try { 
          scannedTable = sessionStorage.getItem('qr.tableNumber') || undefined; 
        } catch {}
      }
      
      const payload = {
        items: cart.map(item => ({ 
          id: item.id, 
          name: item.name, 
          quantity: item.quantity, 
          price: item.price 
        })),
        customerInfo: { name: 'QR Customer', phone: '0000000000' },
        paymentMethod: 'Online',
        total: cartTotals.total,
        tableNumber: scannedTable || `QR-${Date.now().toString().slice(-4)}`,
        orderSource: 'QR_BILLING'
      };
      
      const res = await OrderService.createOrder(payload);
      if (res.success) {
        setCart([]);
        setLocalQuantities({});
        if (goTo) goTo('qr-billing');
        alert('Order placed successfully!');
      } else {
        throw new Error(res.error || 'Failed to create order');
      }
    } catch (e) {
      console.error('Order failed', e);
      setError(e.message);
    } finally { 
      setPlacing(false); 
    }
  };
  */

  // Navigation functions
  const goToCart = () => {
    if (!cart.length) return;
    setCurrentView('cart');
  };

  const proceedToPayment = () => {
    if (!cart.length) return;
    
    // Prepare order data for payment
    let scannedTable = propTableNumber;
    if (!scannedTable) {
      try { 
        scannedTable = sessionStorage.getItem('qr.tableNumber') || undefined; 
      } catch {}
    }
    
    const orderPayload = {
      items: cart.map(item => ({ 
        id: item.id, 
        name: item.name, 
        quantity: item.quantity, 
        price: item.price 
      })),
      customerInfo: { name: 'QR Customer', phone: '0000000000' },
      paymentMethod: 'Online',
      total: cartTotals.total,
      tableNumber: scannedTable || `QR-${Date.now().toString().slice(-4)}`,
      orderSource: 'QR_BILLING'
    };
    
    setOrderData(orderPayload);
    setCurrentView('payment');
  };

  const handlePaymentSuccess = (paymentDetails) => {
    setCurrentView('success');
  };

  const backToMenu = () => {
    setCurrentView('menu');
    setCart([]);
    setLocalQuantities({});
    setOrderData(null);
  };

  // const backToCart = () => {
  //   setCurrentView('cart');
  // };
  // NOTE: backToCart function currently unused but kept for potential future navigation needs

  const filtered = useMemo(() => {
    if (loading) return [];
    return menuItems.filter(item => {
      if (category !== 'All' && item.category !== category) return false;
      if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase())) return false;
      if (filters.includes('trending') && !item.isTrending) return false;
      if (filters.includes('liked') && !item.isLiked) return false;
      if (filters.includes('offers') && !item.hasOffer) return false;
      return true;
    }).sort((a,b) => {
      if (filters.includes('price')) return a.price - b.price;
      if (filters.includes('time')) return a.prepTime - b.prepTime;
      return 0;
    });
  }, [searchText, category, filters, loading, menuItems]);

  const handleOpen = (item) => {
    if (!item.isAvailable) { alert('Item unavailable today.'); return; }
    setModalItem(item);
    if (item.recommendations?.length) {
      setRecommendation(item.recommendations.join(' & '));
      setTimeout(() => setRecommendation(null), 3000);
    }
  };

  // Conditional rendering for different views
  if (currentView === 'cart') {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#2c2c2c',
        color: 'white',
        fontFamily: 'Arial, sans-serif'
      }}>
        {/* Cart Header */}
        <div style={{
          background: '#1a1a1a',
          padding: '20px',
          borderBottom: '1px solid #444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>🛒</span>
            <div>
              <h2 style={{ margin: 0, fontSize: '20px' }}>Your Cart</h2>
              <p style={{ margin: 0, color: '#ffc107', fontSize: '14px' }}>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentView('menu')}
            style={{
              background: 'transparent',
              border: '1px solid #666',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            ← Back
          </button>
        </div>

        {cart.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: '#999'
          }}>
            <h3>Your cart is empty</h3>
            <p>Add some delicious items from the menu!</p>
            <button 
              onClick={() => setCurrentView('menu')}
              style={{
                background: '#ffc107',
                color: '#000',
                border: 'none',
                padding: '12px 30px',
                borderRadius: '25px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer',
                marginTop: '20px'
              }}
            >
              Browse Menu
            </button>
          </div>
        ) : (
          <div style={{ padding: '0' }}>
            {/* Cart Items */}
            <div style={{ padding: '20px 15px' }}>
              {cart.map((item, index) => (
                <div key={item.id} style={{
                  background: '#3a3a3a',
                  borderRadius: '12px',
                  padding: '20px',
                  marginBottom: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '15px'
                }}>
                  {/* Item Image Placeholder */}
                  <div style={{
                    width: '60px',
                    height: '60px',
                    background: '#555',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '24px'
                  }}>
                    🍽️
                  </div>
                  
                  {/* Item Details */}
                  <div style={{ flex: 1 }}>
                    <h3 style={{ 
                      margin: '0 0 5px 0', 
                      fontSize: '18px',
                      fontWeight: 'bold'
                    }}>
                      {item.name}
                    </h3>
                    <p style={{ 
                      margin: '0', 
                      color: '#999', 
                      fontSize: '14px' 
                    }}>
                      Category: General
                    </p>
                    <p style={{ 
                      margin: '5px 0 0 0', 
                      color: '#999', 
                      fontSize: '12px' 
                    }}>
                      Spicy, Mild, Extra portions
                    </p>
                    <p style={{
                      margin: '8px 0 0 0',
                      fontSize: '18px',
                      fontWeight: 'bold',
                      color: 'white'
                    }}>
                      ₹{item.price}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px'
                  }}>
                    <button
                      onClick={() => decreaseCartItem(item.id)}
                      style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        background: '#ff6b6b',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      -
                    </button>
                    
                    <div style={{
                      width: '35px',
                      height: '35px',
                      borderRadius: '50%',
                      background: '#ffc107',
                      color: '#000',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '16px'
                    }}>
                      {item.quantity}
                    </div>
                    
                    <button
                      onClick={() => increaseCartItem(item.id)}
                      style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        background: '#4CAF50',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      +
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{
                        width: '35px',
                        height: '35px',
                        borderRadius: '50%',
                        background: '#666',
                        color: 'white',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: '5px'
                      }}
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div style={{
              background: '#1a1a1a',
              padding: '25px',
              margin: '20px 15px',
              borderRadius: '12px'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '15px',
                fontSize: '16px'
              }}>
                <span>Subtotal:</span>
                <span>₹{cartTotals.subtotal.toFixed(2)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '15px',
                fontSize: '16px'
              }}>
                <span>Tax (8%):</span>
                <span>₹{cartTotals.tax.toFixed(2)}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '20px',
                fontSize: '16px'
              }}>
                <span>Delivery:</span>
                <span>₹{cartTotals.delivery.toFixed(2)}</span>
              </div>
              
              <hr style={{ border: '1px solid #444', margin: '20px 0' }} />
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '20px',
                fontWeight: 'bold',
                marginBottom: '25px'
              }}>
                <span>Total:</span>
                <span>₹{cartTotals.total.toFixed(2)}</span>
              </div>

              {/* Special Instructions */}
              <div style={{ marginBottom: '25px' }}>
                <label style={{
                  display: 'block',
                  marginBottom: '10px',
                  fontSize: '16px',
                  fontWeight: 'bold'
                }}>
                  Special Instructions (Optional):
                </label>
                <textarea
                  placeholder="Any special requests or dietary requirements..."
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    background: '#333',
                    border: '1px solid #555',
                    borderRadius: '8px',
                    padding: '12px',
                    color: 'white',
                    fontSize: '14px',
                    resize: 'vertical',
                    fontFamily: 'Arial, sans-serif'
                  }}
                />
              </div>

              {/* Checkout Button */}
              <button
                onClick={proceedToPayment}
                style={{
                  width: '100%',
                  background: '#ffc107',
                  color: '#000',
                  border: 'none',
                  padding: '18px',
                  borderRadius: '25px',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => e.target.style.background = '#ffcd38'}
                onMouseOut={(e) => e.target.style.background = '#ffc107'}
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (currentView === 'payment') {
    return (
      <PaymentPage
        orderData={orderData}
        onPaymentSuccess={handlePaymentSuccess}
        onBack={() => setCurrentView('cart')}
      />
    );
  }

  if (currentView === 'success') {
    return (
      <PaymentSuccessPage
        orderData={orderData}
        onBackToMenu={backToMenu}
      />
    );
  }

  // Default menu view
  return (
    <div className="qr-menu-container">
      <div className="qr-header"><h2>QR Billing Menu</h2></div>
      
      {loading ? (
        <div className="loading-state">
          <Clock size={48} color="#4CAF50" />
          <h3>Loading Menu Items...</h3>
          <p>Fetching fresh items from the kitchen</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <X size={48} color="#ff4444" />
          <h3>Unable to Load Menu</h3>
          <p>{error}</p>
          <button onClick={() => window.location.reload()} className="retry-button">
            Try Again
          </button>
        </div>
      ) : (
        <>
          <div className="qr-search-bar">
            <Search size={18} />
            <input value={searchText} onChange={e=>setSearchText(e.target.value)} placeholder="Search for food" />
            <button className="qr-filter-toggle" onClick={()=>setShowFilters(s=>!s)}>
              <Filter size={18} color="#fbbf24" />
            </button>
          </div>

      {showFilters && (
        <div className="qr-filters">
          {filterDefs.map(f => {
            const Icon = f.icon; const active = filters.includes(f.id);
            return (
              <button key={f.id} onClick={()=>toggleFilter(f.id)} className={"qr-filter-chip" + (active? ' active':'')}>
                <Icon size={14} /> {f.name}
              </button>
            );
          })}
        </div>
      )}

      <div className="qr-categories">
        {categories.map(c => (
          <button key={c} onClick={()=>setCategory(c)} className={"qr-cat" + (category===c? ' active':'')}>{c}</button>
        ))}
      </div>

      <div className="qr-grid">
        {filtered.map(item => {
          const quantity = localQuantities[item.id] || 0;
          return (
            <div key={item.id} className={"qr-item" + (!item.isAvailable? ' unavailable':'')}>
              <div className="qr-img-wrap" onClick={() => handleOpen(item)}>
                <img 
                  src={item.image_url || item.image || 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400'} 
                  alt={item.name} 
                  onError={(e) => {e.currentTarget.src = 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400'}}
                />
                <div className="qr-badge time"><Clock size={10} /> {item.prepTime}m</div>
                {item.hasOffer && <div className="qr-badge offer">Offer</div>}
                {!item.isAvailable && <div className="qr-overlay">Empty</div>}
              </div>
              <div className="qr-info">
                <h4 onClick={() => handleOpen(item)}>{item.name}</h4>
                <p onClick={() => handleOpen(item)}>{item.description}</p>
                <div className="qr-footer-line">
                  <span className="price">₹{item.price}</span>
                  <span className="rating"><Star size={12} fill="#fbbf24" color="#fbbf24" /> {item.rating}</span>
                </div>
                <div className="qr-actions">
                  {quantity === 0 ? (
                    <button 
                      className="qr-add-btn" 
                      onClick={(e) => {e.stopPropagation(); directAddToCart(item);}} 
                      disabled={!item.isAvailable}
                    >
                      Add
                    </button>
                  ) : (
                    <div className="qr-qty-controls">
                      <button 
                        className="qr-qty-btn" 
                        onClick={(e) => {e.stopPropagation(); updateQty(item.id, -1);}}
                      >
                        <Minus size={14}/>
                      </button>
                      <span className="qr-qty-display">{quantity}</span>
                      <button 
                        className="qr-qty-btn" 
                        onClick={(e) => {e.stopPropagation(); updateQty(item.id, 1);}}
                      >
                        <Plus size={14}/>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {modalItem && (
        <div className="qr-modal-backdrop" onClick={()=>setModalItem(null)}>
          <div className="qr-modal" onClick={e=>e.stopPropagation()}>
            <div className="qr-modal-head">
              <h3>{modalItem.name}</h3>
              <button onClick={()=>setModalItem(null)}><X size={20} /></button>
            </div>
            <img 
              src={modalItem.image_url || modalItem.image || 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400'} 
              alt={modalItem.name} 
              className="qr-modal-img" 
              onError={(e) => {e.currentTarget.src = 'https://images.pexels.com/photos/3026805/pexels-photo-3026805.jpeg?auto=compress&cs=tinysrgb&w=400'}}
            />
            <p>{modalItem.description}</p>
            <h5>Customizations</h5>
            <ul className="qr-customizations">
              {modalItem.customizations?.map((c,i)=>(<li key={i}>{c}</li>))}
            </ul>
            <div className="qr-modal-footer">
              <div className="modal-price">${modalItem.price}</div>
              <button className="add-btn" onClick={()=>{ updateQty(modalItem.id,1); onSelectAdd && onSelectAdd(modalItem); setModalItem(null); }}> <Plus size={16}/> Add to Cart</button>
            </div>
          </div>
        </div>
      )}

      {/* Cart Panel */}
      {cart.length > 0 && (
        <div className="qr-cart-panel">
          <div className="qr-cart-info">
            <div className="qr-cart-summary">
              <span className="qr-cart-count">
                {cart.reduce((sum, item) => sum + item.quantity, 0)} items
              </span>
              <span className="qr-cart-total">
                ${cartTotals.total.toFixed(2)}
              </span>
            </div>
            <div className="qr-cart-items">
              {cart.slice(0, 2).map((item, index) => (
                <span key={item.id} className="qr-cart-item-name">
                  {item.name} (x{item.quantity}) {index < cart.slice(0, 2).length - 1 && cart.length > 1 ? ', ' : ''}
                </span>
              ))}
              {cart.length > 2 && <span className="qr-cart-more">+{cart.length - 2} more</span>}
            </div>
          </div>
          <div className="qr-cart-actions">
            <button 
              className="qr-place-order-btn" 
              onClick={goToCart}
            >
              View Cart
            </button>
          </div>
        </div>
      )}

      {recommendation && (
        <div className="qr-recommend">
          Perfect Combo! Try {recommendation} with this item!
        </div>
      )}
        </>
      )}
    </div>
  );
}
