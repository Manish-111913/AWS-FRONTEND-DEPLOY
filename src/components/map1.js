import React, { useState, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { StandardCard } from '../styles/standardStyles';
import UnitMappingService from '../services/unitMappingService';

const BackArrowIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

const KitchenUnitsStep = ({ goTo }) => {
  const [conversions, setConversions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [kitchenToolOptions, setKitchenToolOptions] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dropdowns, setDropdowns] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [customKitchenTools, setCustomKitchenTools] = useState([]);
  const [newToolInput, setNewToolInput] = useState({});
  const [showAddToolInput, setShowAddToolInput] = useState({});

  // Load existing kitchen units and unit options on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Define kitchen tools - only these 8 are allowed
      const kitchenTools = [
        { name: 'Tablespoon' },
        { name: 'Teaspoon' },
        { name: 'Cup' },
        { name: 'Bowl' },
        { name: 'Glass' },
        { name: 'Teacup' },
        { name: 'Ladle' },
        { name: 'Scoop' }
      ];
      
      setKitchenToolOptions(kitchenTools);
      
      // Load unit options, inventory items, and kitchen units in parallel
      const businessId = UnitMappingService.getBusinessId();
      
      try {
        const [unitOptionsData, inventoryItemsData, savedConversions] = await Promise.all([
          UnitMappingService.getUnitOptions(),
          UnitMappingService.getInventoryItems(businessId),
          UnitMappingService.getIngredientKitchenUnits(businessId)
        ]);
        
        // Set inventory items
        setInventoryItems(inventoryItemsData);
        
        // Set unit options for dropdowns
        const allowedSymbols = new Set(['ml', 'l', 'kg', 'g', 'mg']);
        let filteredKitchenOptions = unitOptionsData.kitchen
          .filter(unit => allowedSymbols.has(unit.unit_symbol.toLowerCase()))
          .map(unit => {
            const sym = unit.unit_symbol.toLowerCase();
            const name = unit.unit_name;
            return {
              value: sym,
              label: `${sym} (${name.charAt(0).toUpperCase()}${name.slice(1)})`,
              type: unit.unit_type
            };
          });
          
        // Ensure required options exist
        const required = [
          { value: 'ml', label: 'ml (Milliliter)', type: 'volume' },
          { value: 'l', label: 'l (Liter)', type: 'volume' },
          { value: 'kg', label: 'kg (Kilogram)', type: 'weight' },
          { value: 'g', label: 'g (Gram)', type: 'weight' },
          { value: 'mg', label: 'mg (Milligram)', type: 'weight' }
        ];
        const have = new Set(filteredKitchenOptions.map(o => o.value));
        required.forEach(opt => { if (!have.has(opt.value)) filteredKitchenOptions.push(opt); });
        setUnitOptions(filteredKitchenOptions);
        
        if (savedConversions && savedConversions.length > 0) {
          // Normalize backend data to frontend format (ingredient-scoped)
          const normalized = savedConversions.map(row => ({
            item: row.item || '',
            kitchenTool: row.kitchen_tool ? String(row.kitchen_tool).toLowerCase() : '',
            quantity: row.quantity || 0,
            unit: row.unit || ''
          })).filter(x => x.item && x.kitchenTool && x.quantity && x.unit);
          setConversions(normalized);
        } else {
          // Start with two functional examples to show users how it works
          const defaultExamples = [
            {
              item: 'Oil',
              kitchenTool: 'Tablespoon',
              quantity: 15,
              unit: 'ml'
            },
            {
              item: 'Salt',
              kitchenTool: 'Teaspoon',
              quantity: 5,
              unit: 'g'
            }
          ];
          setConversions(defaultExamples);
        }
      } catch (primaryError) {
        console.error('Primary service failed:', primaryError);
        // Set default examples even when backend fails
        const defaultExamples = [
          {
            item: 'Oil',
            kitchenTool: 'Tablespoon',
            quantity: 15,
            unit: 'ml'
          },
          {
            item: 'Salt',
            kitchenTool: 'Teaspoon',
            quantity: 5,
            unit: 'g'
          }
        ];
        setConversions(defaultExamples);
        setUnitOptions([
          { value: 'ml', label: 'ml (Milliliter)', type: 'volume' },
          { value: 'l', label: 'l (Liter)', type: 'volume' },
          { value: 'kg', label: 'kg (Kilogram)', type: 'weight' },
          { value: 'g', label: 'g (Gram)', type: 'weight' },
          { value: 'mg', label: 'mg (Milligram)', type: 'weight' }
        ]);
        setKitchenToolOptions([
          { name: 'Tablespoon' },
          { name: 'Teaspoon' },
          { name: 'Cup' },
          { name: 'Bowl' },
          { name: 'Glass' },
          { name: 'Teacup' },
          { name: 'Ladle' },
          { name: 'Scoop' }
        ]);
        setInventoryItems([
          { name: 'Oil', category: 'Ingredient', standardUnit: 'l' },
          { name: 'Salt', category: 'Ingredient', standardUnit: 'kg' },
          { name: 'Flour', category: 'Ingredient', standardUnit: 'kg' },
          { name: 'Sugar', category: 'Ingredient', standardUnit: 'kg' }
        ]);
        setError('Backend API is not available. Please ensure the backend server is running to load data.');
      }
      
      setError(null);
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data from server. Please ensure the backend is running.');
      setUnitOptions([]);
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const saveKitchenUnits = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Check for incomplete conversions
      const incompleteConversions = conversions.filter(conv => 
        !conv.item || !conv.kitchenTool || conv.quantity <= 0 || !conv.unit
      );
      
      if (incompleteConversions.length > 0) {
        const message = 'Please complete all conversions or remove them using "Remove Conversion" before proceeding.';
        alert(message);
        setError(message);
        return false;
      }
      
      // Filter out incomplete conversions (this should now be empty, but keeping for safety)
      const validConversions = conversions.filter(conv => 
        conv.item && conv.kitchenTool && conv.quantity > 0 && conv.unit
      );
      
      if (validConversions.length === 0) {
        const message = 'Please add at least one complete conversion before proceeding.';
        alert(message);
        setError(message);
        return false;
      }
      
      const businessId = UnitMappingService.getBusinessId();
      // Save as ingredient-scoped kitchen conversions
      await UnitMappingService.saveIngredientKitchenUnits(businessId, validConversions.map(c => ({
        item: c.item,
        kitchenTool: c.kitchenTool,
        quantity: c.quantity,
        unit: c.unit
      })));
      console.log('Kitchen units saved successfully');
      
      setError(null);
      return true;
    } catch (error) {
      console.error('Failed to save kitchen units:', error);
      const message = 'Failed to save kitchen units. Please try again.';
      alert(message);
      setError(message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const toggleDropdown = (index, type) => {
    setDropdowns(prev => ({
      ...prev,
      [index]: prev[index] === type ? null : type,
    }));
  };

  const handleChange = (index, field, value) => {
    const newConversions = [...conversions];
    newConversions[index][field] = value;
    setConversions(newConversions);
  };

  const handleSelect = (index, field, value) => {
    handleChange(index, field, value);
    setDropdowns({ ...dropdowns, [index]: null });
  };

  const handleSearchChange = (index, value) => {
    setSearchTerms(prev => ({ ...prev, [index]: value }));
  };

  const filteredOptions = (type, search) => {
    if (type === 'item') {
      return inventoryItems.filter(item => 
        item.name.toLowerCase().includes((search || '').toLowerCase())
      );
    } else if (type === 'kitchenTool') {
      // Combine predefined and custom kitchen tools
      const allTools = [
        ...kitchenToolOptions,
        ...customKitchenTools.map(tool => ({ name: tool }))
      ];
      return allTools.filter(tool => 
        tool.name.toLowerCase().includes((search || '').toLowerCase())
      );
    } else {
      return unitOptions.filter(opt => 
        opt.label.toLowerCase().includes((search || '').toLowerCase())
      );
    }
  };

  const addConversion = () => {
    setConversions([...conversions, { item: '', kitchenTool: '', quantity: 0, unit: '' }]);
  };

  const deleteConversion = (index) => {
    const newConversions = [...conversions];
    newConversions.splice(index, 1);
    setConversions(newConversions);
  };

  const addCustomKitchenTool = (index, toolName) => {
    if (toolName && toolName.trim() && !customKitchenTools.includes(toolName.trim())) {
      const newTool = toolName.trim();
      setCustomKitchenTools(prev => [...prev, newTool]);
      handleSelect(index, 'kitchenTool', newTool);
      setNewToolInput(prev => ({ ...prev, [index]: '' }));
      setShowAddToolInput(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleNewToolInputChange = (index, value) => {
    setNewToolInput(prev => ({ ...prev, [index]: value }));
  };

  const toggleAddToolInput = (index) => {
    setShowAddToolInput(prev => ({ ...prev, [index]: !prev[index] }));
    setNewToolInput(prev => ({ ...prev, [index]: '' }));
  };

  const removeCustomKitchenTool = (toolName, event) => {
    event.stopPropagation(); // Prevent dropdown item click
    setCustomKitchenTools(prev => prev.filter(tool => tool !== toolName));
    // If this tool is currently selected in any conversion, clear it
    setConversions(prev => prev.map(conv => 
      conv.kitchenTool === toolName ? { ...conv, kitchenTool: '' } : conv
    ));
  };

  const hoverStyle = {
    border: '1px solid #ddd',
    cursor: 'pointer',
    backgroundColor: '#fff',
    color: 'black',
    display: 'flex',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: '10px',
    borderRadius: '8px',
    transition: 'border 0.2s ease-in-out',
    marginBottom: '10px',
    width: '100%',
    minHeight: '44px',
    boxSizing: 'border-box',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  };

  return (
    <div style={{
      fontFamily: 'Arial, sans-serif',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '10px'
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginTop: '20px',
        position: 'relative',
        width: '100%',
        maxWidth: '600px'
      }}>
        <button
          onClick={() => goTo('map')}
          style={{
            position: 'absolute',
            left: '0px',
            top: '2px',
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: '18px',
            color: '#000',
            padding: '8px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '40px',
            height: '40px',
            fontWeight: 'normal',
            zIndex: 10
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          <BackArrowIcon />
        </button>
        <h2 style={{ marginBottom: '5px', marginTop: '2px', fontSize: '24px' }}>Kitchen Units</h2>
        <p style={{ color: '#777' }}>Step 2 of 3</p>
      </div>

      <StandardCard style={{
        width: '100vw',
        maxWidth: '600px',
        marginTop: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px' }}>
            Tell us how you measure
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            For each item, tell us how your kitchen tool (like a cup or bowl) converts to your base unit (like ml or grams).
          </p>
          {error && (
            <div style={{
              backgroundColor: '#ffebee',
              color: '#c62828',
              padding: '10px',
              borderRadius: '8px',
              marginTop: '10px',
              fontSize: '14px'
            }}>
              {error}
            </div>
          )}
        </div>

        {loading ? (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#666'
          }}>
            <div>Loading real data from backend...</div>
          </div>
        ) : inventoryItems.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '200px',
            color: '#666',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '10px', fontSize: '18px' }}>🥄</div>
            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>No inventory items found</div>
            <div style={{ fontSize: '14px' }}>Please add inventory items to your business first</div>
          </div>
        ) : (
        <>
        {conversions.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            height: '150px',
            color: '#666',
            textAlign: 'center',
            border: '2px dashed #ddd',
            borderRadius: '12px',
            marginBottom: '20px'
          }}>
            <div style={{ marginBottom: '10px', fontSize: '24px' }}>🥄</div>
            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>No kitchen units yet</div>
            <div style={{ fontSize: '14px' }}>Click "Add Kitchen Unit" below to get started</div>
          </div>
        ) : (
          conversions.map((conversion, index) => (
          <div key={index} style={{ marginBottom: '40px', position: 'relative' }}>
            {/* Item */}
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>Item:</label>
            <div
              onClick={() => toggleDropdown(index, 'item')}
              style={{ ...hoverStyle }}
              onMouseEnter={e => e.currentTarget.style.border = '1px solid black'}
              onMouseLeave={e => e.currentTarget.style.border = '1px solid #ddd'}
            >
              <span style={{
                flex: 1,
                textAlign: 'left',
                wordWrap: 'break-word',
                whiteSpace: 'normal',
                overflow: 'hidden',
                marginRight: '8px'
              }}>{conversion.item || 'Select item'}</span>
              <FaChevronDown style={{ flexShrink: 0 }} />
            </div>

            {dropdowns[index] === 'item' && (
              <div style={{
                position: 'absolute',
                top: '60px',
                left: '0',
                right: '0',
                zIndex: 1000,
                backgroundColor: '#fff',
                borderRadius: '12px',
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                padding: '10px',
                maxHeight: '240px',
                overflow: 'hidden'
              }}>
                <input
                  type="text"
                  placeholder="Search item..."
                  value={searchTerms[`${index}-item`] || ''}
                  onChange={(e) => handleSearchChange(`${index}-item`, e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #ddd',
                    marginBottom: '8px'
                  }}
                />
                <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                  {filteredOptions('item', searchTerms[`${index}-item`]).length === 0 ? (
                    <div style={{
                      padding: '20px',
                      textAlign: 'center',
                      color: '#666',
                      fontSize: '14px'
                    }}>
                      {inventoryItems.length === 0 ? 'No inventory items available from backend' : 'No items match your search'}
                    </div>
                  ) : (
                    filteredOptions('item', searchTerms[`${index}-item`]).map((item, i) => (
                      <div
                        key={item.id || i}
                        onClick={() => handleSelect(index, 'item', item.name)}
                        style={{
                          padding: '10px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ fontWeight: 'bold' }}>{item.name}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Row: Kitchen Tool, Quantity, Unit */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '10px' }}>
              {/* Kitchen Tool */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  onClick={() => toggleDropdown(index, 'kitchenTool')}
                  style={{ ...hoverStyle }}
                  onMouseEnter={e => e.currentTarget.style.border = '1px solid black'}
                  onMouseLeave={e => e.currentTarget.style.border = '1px solid #ddd'}
                >
                  <span style={{
                    flex: 1,
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    marginRight: '8px'
                  }}>{conversion.kitchenTool || 'Select Tool'}</span>
                  <FaChevronDown style={{ flexShrink: 0 }} />
                </div>
                {dropdowns[index] === 'kitchenTool' && (
                  <div style={{
                    position: 'absolute',
                    top: '52px',
                    left: '0',
                    right: '0',
                    zIndex: 1000,
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    padding: '10px',
                    maxHeight: '240px',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="text"
                      placeholder="Search kitchen tool..."
                      value={searchTerms[`${index}-kitchenTool`] || ''}
                      onChange={(e) => handleSearchChange(`${index}-kitchenTool`, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        marginBottom: '8px'
                      }}
                    />
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {filteredOptions('kitchenTool', searchTerms[`${index}-kitchenTool`]).length === 0 && !searchTerms[`${index}-kitchenTool`] ? (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#666',
                          fontSize: '14px'
                        }}>
                          No kitchen tools match your search
                        </div>
                      ) : (
                        <>
                          {filteredOptions('kitchenTool', searchTerms[`${index}-kitchenTool`]).map((tool, i) => {
                            const isCustomTool = customKitchenTools.includes(tool.name);
                            return (
                              <div
                                key={i}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  padding: '10px',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  backgroundColor: conversion.kitchenTool === tool.name ? 'whitesmoke' : 'white',
                                  color: conversion.kitchenTool === tool.name ? 'black' : '#000',
                                  textAlign: 'center',
                                  width: '100%',
                                  boxSizing: 'border-box',
                                  overflow: 'hidden',
                                  wordWrap: 'break-word',
                                  whiteSpace: 'normal'
                                }}
                              >
                                <div 
                                  style={{ 
                                    fontWeight: 'bold', 
                                    textAlign: 'center',
                                    wordWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    overflow: 'hidden',
                                    flex: 1
                                  }}
                                  onClick={() => handleSelect(index, 'kitchenTool', tool.name)}
                                >
                                  {tool.name}
                                </div>
                                {isCustomTool && (
                                  <button
                                    onClick={(e) => removeCustomKitchenTool(tool.name, e)}
                                    style={{
                                      width: '20px',
                                      height: '20px',
                                      borderRadius: '50%',
                                      backgroundColor: 'black',
                                      color: 'white',
                                      border: 'none',
                                      cursor: 'pointer',
                                      fontSize: '12px',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      marginLeft: '8px',
                                      flexShrink: 0
                                    }}
                                    title="Remove custom tool"
                                  >
                                    −
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Add New Tool Section */}
                          <div style={{
                            borderTop: '1px solid #eee',
                            marginTop: '8px',
                            paddingTop: '8px'
                          }}>
                            {!showAddToolInput[index] ? (
                              // Show "Add Tool" button
                              <div style={{ padding: '0 8px' }}>
                                <button
                                  onClick={() => toggleAddToolInput(index)}
                                  style={{
                                    width: '100%',
                                    padding: '10px',
                                    backgroundColor: 'black',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    fontWeight: 'bold'
                                  }}
                                >
                                  + Add Tool
                                </button>
                              </div>
                            ) : (
                              // Show input field and buttons
                              <div style={{
                                padding: '0 8px'
                              }}>
                                <input
                                  type="text"
                                  placeholder="Enter tool name..."
                                  value={newToolInput[index] || ''}
                                  onChange={(e) => handleNewToolInputChange(index, e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      addCustomKitchenTool(index, newToolInput[index]);
                                    }
                                  }}
                                  maxLength={15}
                                  style={{
                                    width: '100%',
                                    padding: '8px',
                                    borderRadius: '4px',
                                    border: '1px solid #ddd',
                                    fontSize: '14px',
                                    marginBottom: '8px',
                                    boxSizing: 'border-box'
                                  }}
                                  autoFocus
                                />
                                <div style={{ display: 'flex', gap: '8px' }}>
                                  <button
                                    onClick={() => addCustomKitchenTool(index, newToolInput[index])}
                                    style={{
                                      flex: 1,
                                      padding: '8px 12px',
                                      backgroundColor: 'black',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    Add
                                  </button>
                                  <button
                                    onClick={() => toggleAddToolInput(index)}
                                    style={{
                                      flex: 1,
                                      padding: '8px 12px',
                                      backgroundColor: '#f5f5f5',
                                      color: 'black',
                                      border: '1px solid #ddd',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '14px',
                                      fontWeight: 'bold'
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantity */}
              <div style={{
                flex: 1,
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '0 6px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                boxSizing: 'border-box',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                <button
                  onClick={() => handleChange(index, 'quantity', Math.max(0, (conversion.quantity || 0) - 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: 'black',
                    width: '24px',
                    height: '100%',
                  }}
                >−</button>
                <input
                  type="text"
                  inputMode="numeric"
                  value={conversion.quantity === 0 ? '0' : (Number.isInteger(conversion.quantity) ? String(conversion.quantity) : String(conversion.quantity))}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    const bounded = Math.max(0, Math.min(10000, isNaN(val) ? 0 : val));
                    handleChange(index, 'quantity', bounded);
                  }}
                  style={{
                    width: '50px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '16px',
                    textAlign: 'center',
                    background: 'transparent',
                    height: '100%',
                  }}
                />
                <button
                  onClick={() => handleChange(index, 'quantity', Math.min(10000, (conversion.quantity || 0) + 1))}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    color: 'black',
                    width: '24px',
                    height: '100%',
                  }}
                >+</button>
              </div>

              {/* Unit */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  onClick={() => toggleDropdown(index, 'unit')}
                  style={{ ...hoverStyle }}
                  onMouseEnter={e => e.currentTarget.style.border = '1px solid black'}
                  onMouseLeave={e => e.currentTarget.style.border = '1px solid #ddd'}
                >
                  <span style={{
                    flex: 1,
                    wordWrap: 'break-word',
                    whiteSpace: 'normal',
                    overflow: 'hidden',
                    marginRight: '8px'
                  }}>{conversion.unit || 'Select unit'}</span>
                  <FaChevronDown style={{ flexShrink: 0 }} />
                </div>
                {dropdowns[index] === 'unit' && (
                  <div style={{
                    position: 'absolute',
                    top: '52px',
                    left: '0',
                    right: '0',
                    zIndex: 1000,
                    backgroundColor: '#fff',
                    borderRadius: '12px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                    padding: '10px',
                    maxHeight: '240px',
                    overflow: 'hidden'
                  }}>
                    <input
                      type="text"
                      placeholder="Search unit..."
                      value={searchTerms[`${index}-unit`] || ''}
                      onChange={(e) => handleSearchChange(`${index}-unit`, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        marginBottom: '8px'
                      }}
                    />
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {filteredOptions('unit', searchTerms[`${index}-unit`]).length === 0 ? (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#666',
                          fontSize: '14px'
                        }}>
                          No units match your search
                        </div>
                      ) : (
                        filteredOptions('unit', searchTerms[`${index}-unit`]).map((option, i) => (
                          <div
                            key={i}
                            onClick={() => handleSelect(index, 'unit', option.value)}
                            style={{
                              padding: '10px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              backgroundColor: conversion.unit === option.value ? 'whitesmoke' : 'white',
                              color: conversion.unit === option.value ? 'black' : '#000'
                            }}
                          >
                            {option.label}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => deleteConversion(index)}
              style={{
                marginTop: '5px',
                background: '#ffdddd',
                border: 'none',
                borderRadius: '8px',
                padding: '10px',
                cursor: 'pointer',
                color: '#d00',
                fontWeight: 'bold',
                width: '100%',
                transition: 'transform 0.2s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
            >
              Remove Kitchen Unit
            </button>
          </div>
        )))}

        <button
          onClick={addConversion}
          style={{
            width: '100%',
            padding: '12px',
            color: 'black',
            fontWeight: 'bold',
            border: '2px dashed black',
            borderRadius: '12px',
            backgroundColor: 'transparent',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            fontSize: '16px',
            marginTop: '10px',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.03)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1.0)'}
        >
          <span style={{ fontSize: '20px' }}>+</span> Add Kitchen Unit
        </button>
        </>
        )}
      </StandardCard>

      <div style={{
        display: 'flex',
        justifyContent: 'center',
        width: '100%',
        maxWidth: '600px',
        padding: '20px 0',
        marginTop: '60px'
      }}>
        <button
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: saving ? '#666' : 'black',
            color: 'white',
            fontWeight: 'bold',
            border: 'none',
            borderRadius: '10px',
            cursor: saving ? 'not-allowed' : 'pointer',
            fontSize: '16px'
          }}
          onClick={async () => {
            if (saving) return;
            const success = await saveKitchenUnits();
            if (success) {
              goTo('map2');
            }
          }}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default KitchenUnitsStep;
