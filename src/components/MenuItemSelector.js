import React, { useState, useEffect } from 'react';
import { menuItems, getMenuItemsByCategory, getCategories, searchMenuItems } from '../data/menuItems';
import RecipesService from '../services/recipesService';
import { StandardSearch, highlightMatch } from '../styles/standardStyles';

const MenuItemSelector = ({ onSelectMenuItem, onClose }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredItems, setFilteredItems] = useState(menuItems);
  const [loading, setLoading] = useState(false);

  const categories = ['All', ...getCategories()];

  useEffect(() => {
    let items = menuItems;
    
    if (selectedCategory !== 'All') {
      items = getMenuItemsByCategory(selectedCategory);
    }
    
    if (searchTerm) {
      items = searchMenuItems(searchTerm);
    }
    
    setFilteredItems(items);
  }, [selectedCategory, searchTerm]);

  const handleSelectItem = async (item) => {
    setLoading(true);
    try {
      // Create recipe from menu item
      const recipeData = {
        name: item.name,
        price: item.price,
        servings: item.servings,
        category: item.category
      };
      
      const newRecipe = await RecipesService.createRecipe(recipeData);
      
      // Add ingredients to the recipe
      if (item.ingredients && item.ingredients.length > 0) {
        await RecipesService.updateRecipeIngredients(newRecipe.id, item.ingredients);
      }
      
      onSelectMenuItem(newRecipe);
    } catch (error) {
      console.error('Failed to create recipe from menu item:', error);
      alert('Failed to create recipe. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 16
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 12,
        maxWidth: '600px',
        maxHeight: '90%',
        width: '100vw',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header */}
        <div style={{
          padding: 16,
          borderBottom: '1px solid #eee',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h3 style={{ margin: 0 }}>🍽️ Select Menu Item</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: 20,
              cursor: 'pointer',
              color: '#666'
            }}
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <StandardSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search menu items..."
            showClearButton={true}
            style={{ marginBottom: 0 }}
          />
        </div>

        {/* Categories */}
        <div style={{ padding: 16, borderBottom: '1px solid #eee' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 16,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backgroundColor: selectedCategory === category ? '#007bff' : '#f0f0f0',
                  color: selectedCategory === category ? 'white' : '#000'
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 16
        }}>
          {loading && (
            <div style={{ textAlign: 'center', padding: 20 }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>🔄</div>
              <div>Creating recipe...</div>
            </div>
          )}
          
          {!loading && filteredItems.length === 0 && (
            <div style={{ textAlign: 'center', padding: 20, color: '#666' }}>
              No items found
            </div>
          )}
          
          {!loading && filteredItems.map(item => (
            <div
              key={item.id}
              onClick={() => handleSelectItem(item)}
              style={{
                padding: 12,
                border: '1px solid #eee',
                borderRadius: 8,
                marginBottom: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: '#fff'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
                e.currentTarget.style.transform = 'scale(1.02)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#fff';
                e.currentTarget.style.transform = 'scale(1)';
              }}
            >
              <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {highlightMatch(item.name, searchTerm)}
              </div>
              <div style={{ fontSize: 12, color: '#666', marginBottom: 4 }}>
                {highlightMatch(item.category, searchTerm)} • ₹{item.price} • {item.prepTime} min
              </div>
              <div style={{ fontSize: 11, color: '#888' }}>
                {item.ingredients.length} ingredients: {item.ingredients.slice(0, 3).map(ing => ing.name).join(', ')}
                {item.ingredients.length > 3 && '...'}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: 16,
          borderTop: '1px solid #eee',
          backgroundColor: '#f8f9fa',
          textAlign: 'center',
          fontSize: 12,
          color: '#666'
        }}>
          Select an item to create recipe with pre-mapped ingredients
        </div>
      </div>
    </div>
  );
};

export default MenuItemSelector;