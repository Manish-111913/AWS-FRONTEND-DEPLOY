import React, { useState, useEffect } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { StandardCard } from '../styles/standardStyles';
import UnitMappingService from '../services/unitMappingService';
import notificationsApi from '../services/notificationsApi';

const BackArrowIcon = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;

const SupplierConversions = ({ goTo }) => {
  const [conversions, setConversions] = useState([]);
  const [unitOptions, setUnitOptions] = useState([]);
  const [containerOptions, setContainerOptions] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [dropdowns, setDropdowns] = useState({});
  const [searchTerms, setSearchTerms] = useState({});
  const [customContainerTypes, setCustomContainerTypes] = useState([]);
  const [newContainerInput, setNewContainerInput] = useState({});
  const [showAddContainerInput, setShowAddContainerInput] = useState({});

  // Load existing supplier conversions and unit options on component mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load unit options, inventory items, and supplier conversions in parallel
      const businessId = UnitMappingService.getBusinessId();
      
      try {
        // First try with UnitMappingService
        const [unitOptionsData, inventoryItemsData, savedConversions] = await Promise.all([
          UnitMappingService.getUnitOptions(),
          UnitMappingService.getInventoryItems(businessId),
          UnitMappingService.getSupplierConversions(businessId)
        ]);
        
        // Set inventory items
        setInventoryItems(inventoryItemsData);
        
        // Exclude basic weight/volume units from dropdowns
        const excludedSymbols = new Set(['kg', 'g', 'ml', 'l']);

        // Helper to map to option shape
        const toOption = (unit) => ({
          value: unit.unit_symbol,
          label: unit.unit_type === 'container' 
            ? unit.unit_name.charAt(0).toUpperCase() + unit.unit_name.slice(1)
            : `${unit.unit_symbol} (${unit.unit_name})`,
          type: unit.unit_type
        });

        // Build unit options (for "unit" dropdown) allowing ONLY basic weight/volume units
        const allowedUnitSymbols = new Set(['kg', 'g', 'ml', 'l']);
        const supplierUnits = (unitOptionsData.supplier || [])
          .filter(u => u.unit_symbol && allowedUnitSymbols.has(String(u.unit_symbol).toLowerCase()))
          .map(toOption);

        // Build container options - ONLY allow the 8 specified container types
        const allowedContainerTypes = new Set(['carton', 'bag', 'box', 'can', 'packet', 'bucket', 'sack', 'crate']);
        
        const customContainerTypes = [
          { unit_symbol: 'carton', unit_name: 'Carton', unit_type: 'container' },
          { unit_symbol: 'bag', unit_name: 'Bag', unit_type: 'container' },
          { unit_symbol: 'box', unit_name: 'Box', unit_type: 'container' },
          { unit_symbol: 'can', unit_name: 'Can', unit_type: 'container' },
          { unit_symbol: 'packet', unit_name: 'Packet', unit_type: 'container' },
          { unit_symbol: 'bucket', unit_name: 'Bucket', unit_type: 'container' },
          { unit_symbol: 'sack', unit_name: 'Sack', unit_type: 'container' },
          { unit_symbol: 'crate', unit_name: 'Crate', unit_type: 'container' }
        ];

        // Only include backend data if it matches our allowed container types
        const backendContainers = [
          ...(unitOptionsData.container || []),
          ...(unitOptionsData.supplier || [])
        ].filter(u => u.unit_symbol && allowedContainerTypes.has(String(u.unit_symbol).toLowerCase()));

        const rawContainerCandidates = [
          ...customContainerTypes,
          ...backendContainers
        ];

        // Deduplicate by unit_symbol
        const seen = new Set();
        const dedupedContainers = [];
        for (const u of rawContainerCandidates) {
          const sym = String(u.unit_symbol || '').toLowerCase();
          if (!sym || seen.has(sym) || !allowedContainerTypes.has(sym)) continue;
          seen.add(sym);
          dedupedContainers.push(toOption(u));
        }

        // Optional: sort alphabetically by label for nicer UX
        supplierUnits.sort((a, b) => a.label.localeCompare(b.label));
        dedupedContainers.sort((a, b) => a.label.localeCompare(b.label));

        // Set options
        setUnitOptions(supplierUnits);
        setContainerOptions(dedupedContainers);
        
        // Always show only the default examples (ignore saved conversions)
        const defaultExamples = [
          {
            conversion_id: null,
            item: 'Oil',
            containerType: 'carton',
            quantity: 20,
            unit: 'kg',
            description: ''
          },
          {
            conversion_id: null,
            item: 'Rice',
            containerType: 'bag',
            quantity: 50,
            unit: 'kg',
            description: ''
          }
        ];
        
        setConversions(defaultExamples);
      } catch (primaryError) {
        console.error('Primary service failed:', primaryError);
        // Set default examples even when backend fails
        const defaultExamples = [
          {
            conversion_id: null,
            item: 'Oil',
            containerType: 'carton',
            quantity: 20,
            unit: 'kg',
            description: ''
          },
          {
            conversion_id: null,
            item: 'Rice',
            containerType: 'bag',
            quantity: 50,
            unit: 'kg',
            description: ''
          }
        ];
        setConversions(defaultExamples);
        setUnitOptions([
          { value: 'kg', label: 'kg (Kilogram)', type: 'weight' },
          { value: 'g', label: 'g (Gram)', type: 'weight' },
          { value: 'ml', label: 'ml (Milliliter)', type: 'volume' },
          { value: 'l', label: 'l (Liter)', type: 'volume' }
        ]);
        setContainerOptions([
          { value: 'carton', label: 'Carton', type: 'container' },
          { value: 'bag', label: 'Bag', type: 'container' },
          { value: 'box', label: 'Box', type: 'container' },
          { value: 'can', label: 'Can', type: 'container' },
          { value: 'packet', label: 'Packet', type: 'container' },
          { value: 'bucket', label: 'Bucket', type: 'container' },
          { value: 'sack', label: 'Sack', type: 'container' },
          { value: 'crate', label: 'Crate', type: 'container' }
        ]);
        setInventoryItems([
          { name: 'Flour', category: 'Ingredient', standardUnit: 'kg' },
          { name: 'Oil', category: 'Ingredient', standardUnit: 'l' },
          { name: 'Sugar', category: 'Ingredient', standardUnit: 'kg' },
          { name: 'Salt', category: 'Ingredient', standardUnit: 'kg' }
        ]);
        setError('Backend API is not available. Please ensure the backend server is running to load data.');
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Failed to load data from server. Please ensure the backend is running.');
      // Clear all data
      setUnitOptions([]);
      setContainerOptions([]);
      setInventoryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const saveSupplierConversions = async () => {
    try {
      setSaving(true);
      setError(null);
      
      // Check for incomplete conversions
      const incompleteConversions = conversions.filter(conv => 
        !conv.item || !conv.containerType || conv.quantity <= 0 || !conv.unit
      );
      
      if (incompleteConversions.length > 0) {
        const message = 'Please complete all conversions or remove them using "Remove Conversion" before proceeding.';
        alert(message);
        setError(message);
        return false;
      }
      
      // Filter out incomplete conversions (this should now be empty, but keeping for safety)
      const validConversions = conversions.filter(conv => 
        conv.item && conv.containerType && conv.quantity > 0 && conv.unit
      );
      
      if (validConversions.length === 0) {
        const message = 'Please add at least one complete conversion before proceeding.';
        alert(message);
        setError(message);
        return false;
      }
      
      const businessId = UnitMappingService.getBusinessId();
      // Only use the primary service, no fallback to static data
      await UnitMappingService.saveSupplierConversions(businessId, validConversions);
      console.log('Supplier conversions saved successfully');
      
  // Do not create a generic success notification; backend will notify only when actual changes occur
      
      setError(null);
      return true;
    } catch (error) {
      console.error('Failed to save supplier conversions:', error);
      const message = 'Failed to save conversions. Please try again.';
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
      // Use real inventory items from backend
      return inventoryItems.filter(item => 
        item.name.toLowerCase().includes((search || '').toLowerCase())
      );
    } else if (type === 'containerType') {
      // Combine predefined and custom container types
      const allContainers = [
        ...containerOptions,
        ...customContainerTypes.map(container => ({ value: container, label: container, type: 'container' }))
      ];
      return allContainers.filter(opt => 
        opt.label.toLowerCase().includes((search || '').toLowerCase())
      );
    } else {
      return unitOptions.filter(opt => 
        opt.label.toLowerCase().includes((search || '').toLowerCase())
      );
    }
  };

  const addConversion = () => {
    setConversions([...conversions, { item: '', containerType: '', quantity: 0, unit: '' }]);
  };

  const deleteConversion = (index) => {
    const newConversions = [...conversions];
    newConversions.splice(index, 1);
    setConversions(newConversions);
  };

  const addCustomContainerType = (index, containerName) => {
    if (containerName && containerName.trim() && !customContainerTypes.includes(containerName.trim())) {
      const newContainer = containerName.trim();
      setCustomContainerTypes(prev => [...prev, newContainer]);
      handleSelect(index, 'containerType', newContainer);
      setNewContainerInput(prev => ({ ...prev, [index]: '' }));
      setShowAddContainerInput(prev => ({ ...prev, [index]: false }));
    }
  };

  const handleNewContainerInputChange = (index, value) => {
    setNewContainerInput(prev => ({ ...prev, [index]: value }));
  };

  const toggleAddContainerInput = (index) => {
    setShowAddContainerInput(prev => ({ ...prev, [index]: !prev[index] }));
    setNewContainerInput(prev => ({ ...prev, [index]: '' }));
  };

  const removeCustomContainerType = (containerName, event) => {
    event.stopPropagation(); // Prevent dropdown item click
    setCustomContainerTypes(prev => prev.filter(container => container !== containerName));
    // If this container is currently selected in any conversion, clear it
    setConversions(prev => prev.map(conv => 
      conv.containerType === containerName ? { ...conv, containerType: '' } : conv
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
          onClick={() => goTo && goTo('map1')}
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
        <h2 style={{ marginBottom: '5px', marginTop: '2px', fontSize: '24px' }}>Supplier Conversions</h2>
        <p style={{ color: '#777' }}>Step 3 of 3</p>
      </div>

      <StandardCard style={{
        width: '100vw',
        maxWidth: '600px',
        marginTop: '20px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 10px' }}>
            How do you buy from suppliers?
          </h3>
          <p style={{ fontSize: '14px', color: '#6B7280' }}>
            For each item, tell us how a vendor's unit (like a carton) converts to your base unit (like packets).
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
            <div style={{ marginBottom: '10px', fontSize: '18px' }}>📦</div>
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
            <div style={{ marginBottom: '10px', fontSize: '24px' }}>📋</div>
            <div style={{ marginBottom: '5px', fontWeight: 'bold' }}>No conversions yet</div>
            <div style={{ fontSize: '14px' }}>Click "Add Conversion" below to get started</div>
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

            {/* Row: Container, Quantity, Unit */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px', marginBottom: '10px' }}>
              {/* Container */}
              <div style={{ flex: 1, position: 'relative' }}>
                <div
                  onClick={() => toggleDropdown(index, 'containerType')}
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
                  }}>{conversion.containerType || 'Select Type'}</span>
                  <FaChevronDown style={{ flexShrink: 0 }} />
                </div>
                {dropdowns[index] === 'containerType' && (
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
                      placeholder="Search containerType..."
                      value={searchTerms[`${index}-containerType`] || ''}
                      onChange={(e) => handleSearchChange(`${index}-containerType`, e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px',
                        borderRadius: '8px',
                        border: '1px solid #ddd',
                        marginBottom: '8px'
                      }}
                    />
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {filteredOptions('containerType', searchTerms[`${index}-containerType`]).length === 0 && !searchTerms[`${index}-containerType`] ? (
                        <div style={{
                          padding: '20px',
                          textAlign: 'center',
                          color: '#666',
                          fontSize: '14px'
                        }}>
                          {containerOptions.length === 0 ? 'No container types available from backend' : 'No containers match your search'}
                        </div>
                      ) : (
                        <>
                          {filteredOptions('containerType', searchTerms[`${index}-containerType`]).map((option, i) => {
                            const isCustomContainer = customContainerTypes.includes(option.value);
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
                                  backgroundColor: conversion.containerType === option.value ? 'whitesmoke' : 'white',
                                  color: conversion.containerType === option.value ? 'black' : '#000',
                                  fontWeight: 'bold',
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
                                    flex: 1,
                                    textAlign: 'center',
                                    wordWrap: 'break-word',
                                    whiteSpace: 'normal',
                                    overflow: 'hidden'
                                  }}
                                  onClick={() => handleSelect(index, 'containerType', option.value)}
                                >
                                  {option.label}
                                </div>
                                {isCustomContainer && (
                                  <button
                                    onClick={(e) => removeCustomContainerType(option.value, e)}
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
                                    title="Remove custom container"
                                  >
                                    −
                                  </button>
                                )}
                              </div>
                            );
                          })}
                          
                          {/* Add New Container Section */}
                          <div style={{
                            borderTop: '1px solid #eee',
                            marginTop: '8px',
                            paddingTop: '8px'
                          }}>
                            {!showAddContainerInput[index] ? (
                              // Show "Add Tool" button
                              <div style={{ padding: '0 8px' }}>
                                <button
                                  onClick={() => toggleAddContainerInput(index)}
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
                                  placeholder="Enter container name..."
                                  value={newContainerInput[index] || ''}
                                  onChange={(e) => handleNewContainerInputChange(index, e.target.value)}
                                  onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                      addCustomContainerType(index, newContainerInput[index]);
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
                                    onClick={() => addCustomContainerType(index, newContainerInput[index])}
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
                                    onClick={() => toggleAddContainerInput(index)}
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
                          {unitOptions.length === 0 ? 'No units available from backend' : 'No units match your search'}
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
                              color: conversion.unit === option.value ? 'black' : '#000',
                              textAlign: 'left',
                              width: '100%',
                              boxSizing: 'border-box',
                              overflow: 'hidden',
                              wordWrap: 'break-word',
                              whiteSpace: 'normal'
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
              Remove Conversion
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
          <span style={{ fontSize: '20px' }}>+</span> Add Conversion
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
            const success = await saveSupplierConversions();
            if (success) {
              goTo && goTo('map3');
            }
          }}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Finish Setup'}
        </button>
      </div>
    </div>
  );
};

export default SupplierConversions;