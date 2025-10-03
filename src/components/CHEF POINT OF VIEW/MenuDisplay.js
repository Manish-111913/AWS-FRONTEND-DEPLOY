import React, { useState, useEffect } from 'react';
import { Plus, ShoppingCart } from 'lucide-react';
import './MenuDisplay.css';

export default function MenuDisplay({ cart = [], setCart, onViewCart }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const TENANT_ID = '1';

  // Simple data loading without blob complexity
  const loadMenuData = async () => {
    try {
      console.log('🔄 Loading menu data...');
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/menu/items', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': TENANT_ID
        }
      });

      console.log('📡 Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 Raw API Response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
        console.log(`✅ Loaded ${result.data.length} items successfully`);
        console.log('🔍 First 3 items:', result.data.slice(0, 3));
        setMenuItems(result.data);
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      console.error('❌ Error loading menu:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Simple MenuDisplay component mounted');
    loadMenuData();
  }, []);

  // Helper functions
  const addToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    if (existingItem) {
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantity: cartItem.quantity + 1 }
          : cartItem
      ));
    } else {
      setCart([...cart, { ...item, quantity: 1 }]);
    }
  };

  const totalItemsInCart = cart.reduce((sum, item) => sum + item.quantity, 0);

  if (loading) {
    return (
      <div style={{textAlign: 'center', padding: '50px'}}>
        <h2>🔄 Loading Menu...</h2>
        <p>Please wait while we load the menu items...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{textAlign: 'center', padding: '50px', color: 'red'}}>
        <h2>❌ Error Loading Menu</h2>
        <p>{error}</p>
        <button onClick={loadMenuData} style={{padding: '10px 20px', marginTop: '10px'}}>
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div style={{padding: '20px', fontFamily: 'Arial, sans-serif'}}>
      {/* Header */}
      <div style={{marginBottom: '30px', textAlign: 'center'}}>
        <h1>🍽️ Menu ({menuItems.length} items)</h1>
        {totalItemsInCart > 0 && (
          <button onClick={onViewCart} style={{
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            padding: '10px 20px',
            borderRadius: '5px',
            cursor: 'pointer',
            margin: '10px'
          }}>
            <ShoppingCart size={16} style={{marginRight: '5px'}} />
            Cart ({totalItemsInCart})
          </button>
        )}
      </div>

      {/* Debug Section */}
      <div style={{
        backgroundColor: '#f0f8ff', 
        padding: '15px', 
        marginBottom: '20px', 
        borderRadius: '8px',
        border: '1px solid #ccc'
      }}>
        <h3>🔍 Debug Information:</h3>
        <p><strong>Total Items Loaded:</strong> {menuItems.length}</p>
        <p><strong>API Status:</strong> ✅ Working</p>
        <p><strong>Sample Items:</strong></p>
        <div style={{fontSize: '12px'}}>
          {menuItems.slice(0, 5).map((item, index) => (
            <div key={item.id} style={{marginBottom: '10px', padding: '5px', backgroundColor: 'white'}}>
              <strong>{index + 1}. {item.name}</strong><br/>
              Category: {item.category}<br/>
              Price: ₹{item.price}<br/>
              Image URL: {item.image_url || 'No URL'}<br/>
            </div>
          ))}
        </div>
      </div>

      {/* Simple Menu Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {menuItems.map(item => (
          <div key={item.id} style={{
            border: '1px solid #ddd',
            borderRadius: '12px',
            overflow: 'hidden',
            backgroundColor: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            {/* Image Section */}
            <div style={{
              height: '200px',
              backgroundColor: '#f5f5f5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              {item.image_url ? (
                <img 
                  src={`https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com${item.image_url}`}
                  alt={item.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  onLoad={() => console.log('✅ Image loaded:', item.name)}
                  onError={(e) => {
                    console.log('❌ Image failed:', item.name);
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div style={{
                position: item.image_url ? 'absolute' : 'static',
                inset: 0,
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#4CAF50',
                color: 'white',
                fontSize: '14px'
              }}>
                {item.name}
              </div>
            </div>

            {/* Content Section */}
            <div style={{padding: '15px'}}>
              <h3 style={{margin: '0 0 10px 0'}}>{item.name}</h3>
              <p style={{color: '#666', fontSize: '14px', margin: '5px 0'}}>
                Category: {item.category}<br/>
                Serves: {item.servings_per_batch || 1} {item.serving_unit || 'portion'}
              </p>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '15px'
              }}>
                <span style={{fontSize: '20px', fontWeight: 'bold', color: '#007bff'}}>
                  ₹{item.price}
                </span>
                <button 
                  onClick={() => addToCart(item)}
                  style={{
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '8px 15px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px'
                  }}
                >
                  <Plus size={16} />
                  Add to Cart
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}