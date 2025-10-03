import React, { useState, useEffect } from 'react';
import { Plus, Search, ShoppingCart, RefreshCw } from 'lucide-react';
import './MenuDisplay.css';

export default function MenuDisplay({ cart = [], setCart, onViewCart }) {
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Direct API call without service layer for debugging
  const loadMenuData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔄 Loading menu data directly from API...');
      
      const response = await fetch('http://localhost:5001/api/menu/items', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': '1'
        }
      });

      if (!response.ok) {
        throw new Error(`API failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('📊 API Response:', result);

      if (result.success && result.data && Array.isArray(result.data)) {
        const items = result.data;
        console.log(`✅ Loaded ${items.length} items successfully`);
        console.log('🔍 Sample items:', items.slice(0, 3).map(item => ({
          name: item.name,
          category: item.category,
          price: item.price
        })));
        
        setMenuItems(items);
        console.log('🎯 State updated with items:', items.length);
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (err) {
      console.error('❌ Error loading menu:', err);
      setError(err.message);
      
      // Fallback to demo data to ensure something displays
      const demoItems = [
        {
          id: 1,
          name: 'Paneer Butter Masala',
          category: 'Main Course',
          price: '280.00',
          image_url: '/api/images/by-name/paneer_butter_masala.jpg',
          serving_unit: 'Serving',
          servings_per_batch: '4.00',
          is_active: true
        },
        {
          id: 2,
          name: 'Garlic Naan',
          category: 'Snacks',
          price: '40.00',
          image_url: '/api/images/by-name/garlic_naan.jpg',
          serving_unit: 'Piece',
          servings_per_batch: '1.00',
          is_active: true
        }
      ];
      setMenuItems(demoItems);
      console.log('🔄 Using fallback demo data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 MenuDisplay component mounted');
    loadMenuData();
  }, []);

  // Simple filtering logic
  const filteredItems = menuItems.filter(item => {
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Group items by category
  const groupedItems = {};
  filteredItems.forEach(item => {
    if (!groupedItems[item.category]) {
      groupedItems[item.category] = [];
    }
    groupedItems[item.category].push(item);
  });

  // Get unique categories for filter buttons
  const categories = ['All', ...new Set(menuItems.map(item => item.category))];

  const addToCart = (item) => {
    console.log('🛒 Adding to cart:', item.name);
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

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  const totalItemsInCart = cart.reduce((total, item) => total + item.quantity, 0);

  console.log('🔍 Render Debug:', {
    loading,
    error,
    menuItemsCount: menuItems.length,
    filteredItemsCount: filteredItems.length,
    groupedCategories: Object.keys(groupedItems),
    searchTerm,
    selectedCategory
  });

  if (loading) {
    return (
      <div className="menu-display">
        <div className="loading-container">
          <RefreshCw className="loading-spinner" size={40} />
          <h3>Loading Menu...</h3>
          <p>Fetching items from database...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="menu-display">
      {/* Header */}
      <div className="menu-header">
        <div className="menu-title">
          <h2>🍽️ Menu ({menuItems.length} items)</h2>
          {error && (
            <p className="error-text" style={{color: '#ff6b6b', fontSize: '14px'}}>
              ⚠️ {error} (showing available data)
            </p>
          )}
          <p className="menu-subtitle">
            Categories: {Object.keys(groupedItems).join(', ')}
          </p>
        </div>
        {totalItemsInCart > 0 && (
          <button className="cart-indicator" onClick={onViewCart}>
            <ShoppingCart size={20} />
            <span className="cart-count">{totalItemsInCart}</span>
            <span className="cart-text">View Cart</span>
          </button>
        )}
      </div>

      {/* Search and Filter */}
      <div className="menu-controls">
        <div className="search-container">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        
        <button onClick={loadMenuData} className="refresh-button">
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Category Filters */}
      <div className="category-filters">
        {categories.map(category => (
          <button
            key={category}
            className={`category-btn ${selectedCategory === category ? 'active' : ''}`}
            onClick={() => setSelectedCategory(category)}
          >
            {category} {category !== 'All' && groupedItems[category] ? `(${groupedItems[category].length})` : ''}
          </button>
        ))}
      </div>

      {/* Menu Items */}
      <div className="menu-content">
        {Object.keys(groupedItems).length === 0 ? (
          <div className="no-items">
            <ShoppingCart size={64} color="#ccc" />
            <h3>No items found</h3>
            <p>
              {searchTerm 
                ? `No items match "${searchTerm}"` 
                : selectedCategory !== 'All' 
                ? `No items in ${selectedCategory} category`
                : 'No menu items available'
              }
            </p>
            <button onClick={loadMenuData} className="reload-btn">
              <RefreshCw size={16} />
              Reload Menu
            </button>
          </div>
        ) : (
          Object.entries(groupedItems).map(([category, items]) => (
            <div key={category} className="category-section">
              <h3 className="category-title">{category} ({items.length} items)</h3>
              <div className="items-grid">
                {items.map(item => (
                  <div key={item.id} className="menu-item-card">
                    <div className="item-image">
                      <img 
                        src={item.image_url || '/images/placeholder-food.jpg'} 
                        alt={item.name}
                        onError={(e) => {
                          if (!e.target.dataset.fallbackAttempted) {
                            e.target.dataset.fallbackAttempted = 'true';
                            if(!e.target.dataset.fallback){ e.target.dataset.fallback='1'; e.target.src = require('../../assets/placeholder-menu-item.png'); }
                          }
                        }}
                      />
                      {getItemQuantityInCart(item.id) > 0 && (
                        <div className="quantity-badge">
                          {getItemQuantityInCart(item.id)}
                        </div>
                      )}
                    </div>
                    
                    <div className="item-info">
                      <h4 className="item-name">{item.name}</h4>
                      <p className="item-details">
                        Serves: {item.servings_per_batch} {item.serving_unit}
                        {item.is_active ? ' | ✅ Available' : ' | ❌ Unavailable'}
                      </p>
                      <div className="item-footer">
                        <span className="item-price">₹{item.price}</span>
                        <button 
                          className="add-btn"
                          onClick={() => addToCart(item)}
                          disabled={!item.is_active}
                        >
                          <Plus size={16} />
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}