import React, { useState, useMemo, useEffect, useRef } from 'react';
import Counter from './Counter';
import { FiStar, FiTruck, FiCheckCircle, FiCalendar, FiPlus, FiPhone, FiX, FiArrowLeft, FiCheck } from 'react-icons/fi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar as faCalendarRegular } from '@fortawesome/free-regular-svg-icons';
import './VendorManagement.css'; // Make sure you have this CSS file
import { StandardSearch, StandardScrollStyles, highlightMatch, performSmartSearch, standardTextSizes } from '../styles/standardStyles';

// Shared CalendarSelect component (module scope) to preserve state across re-renders
const CalendarSelect = ({ options, value, onChange, width = 140 }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = options.find(o => o.value === value) || options[0];
    return (
        <div
            className="calendar-select"
            ref={ref}
            style={{ width }}
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
        >
            <button
                type="button"
                className="calendar-select-trigger"
                onClick={() => setOpen(v => !v)}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <span>{current?.label}</span>
                <span className="calendar-select-caret">▾</span>
            </button>
            {open && (
                <div
                    className="calendar-select-menu"
                    style={{ width }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="calendar-select-list standard-scrollbar">
                        {options.map(opt => (
                            <div
                                key={opt.value}
                                className={`calendar-select-option${opt.value === value ? ' selected' : ''}`}
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                            >
                                <span>{opt.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const VendorSelectModal = ({ vendors, onSelect, onCancel }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef(null);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const filtered = performSmartSearch(vendors, searchTerm, ['name', 'category']);

    return (
        <div className="vm-modal-overlay">
            <div className="vm-modal-content">
                <StandardScrollStyles />
                <div className="vm-modal-header">
                    <h2 style={standardTextSizes.lg}>Select Vendor</h2>
                    <button onClick={onCancel} className="vm-modal-close-btn"><FiX /></button>
                </div>
                <StandardSearch
                    searchTerm={searchTerm}
                    onSearchChange={handleSearchChange}
                    onClearSearch={clearSearch}
                    placeholder="Search vendors..."
                    inputRef={searchInputRef}
                />
                <div className="vm-modal-list standard-scrollbar" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filtered.map(vendor => (
                        <div key={vendor.id} className="vm-modal-list-item" onClick={() => onSelect(vendor)}>
                            <span style={standardTextSizes.base}>
                                {highlightMatch(vendor.name, searchTerm)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const AddCreditModal = ({ vendor, onAdd, onCancel }) => {
    const [amount, setAmount] = useState('');
    const handleAddClick = () => {
        const numericAmount = parseFloat(amount);
        if (!isNaN(numericAmount) && numericAmount > 0) {
            onAdd(vendor.id, numericAmount);
        } else {
            alert('Please enter a valid amount.');
        }
    };

    return (
        <div className="vm-modal-overlay">
            <div className="vm-modal-content">
                <div className="vm-modal-header">
                    <h2>Add Credit for {vendor.name}</h2>
                    <button onClick={onCancel} className="vm-modal-close-btn"><FiX /></button>
                </div>
                <p>Current Balance: ₹{vendor.creditBalance.toLocaleString()}</p>
                <div className="ev-input-group">
                    <label>Amount to Add</label>
                    <input type="number" placeholder="e.g., 5000" value={amount} onChange={(e) => setAmount(e.target.value)} />
                </div>
                <div className="vm-modal-actions">
                    <button className="vm-modal-btn-secondary" onClick={onCancel}>Cancel</button>
                    <button className="vm-modal-btn-primary" onClick={handleAddClick}>Add Credit</button>
                </div>
            </div>
        </div>
    );
};

const StarRating = ({ rating, onRatingChange }) => {
    const [hover, setHover] = useState(0);
    return (
        <div className="ev-star-rating">
            {[...Array(5)].map((star, index) => {
                const ratingValue = index + 1;
                return (
                    <label key={index}>
                        <input type="radio" name="rating" value={ratingValue} onClick={() => onRatingChange(ratingValue)} />
                        <FiStar className="ev-star" color={ratingValue <= (hover || Number(rating || 0)) ? "#ffc107" : "#e4e5e9"} onMouseEnter={() => setHover(ratingValue)} onMouseLeave={() => setHover(0)} />
                    </label>
                );
            })}
            <span className="ev-star-rating-text">{Number(rating || 0).toFixed(1)} stars</span>
        </div>
    );
};

const EditVendor = ({ vendor, onSave, onCancel, onDelete }) => {
    const [formData, setFormData] = useState(vendor);
    // Custom calendar state (match StockInForm)
    const [showLastOrderPicker, setShowLastOrderPicker] = useState(false);
    const [lastOrderViewDate, setLastOrderViewDate] = useState(() => {
        return formData.lastOrder ? new Date(formData.lastOrder) : new Date();
    });
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const openLastOrderPicker = () => {
        const cur = formData.lastOrder;
        setLastOrderViewDate(cur ? new Date(cur) : new Date());
        setShowLastOrderPicker(true);
    };
    const closeLastOrderPicker = () => setShowLastOrderPicker(false);
    const navigateLastOrderMonth = (direction) => {
        const d = new Date(lastOrderViewDate);
        d.setMonth(d.getMonth() + direction);
        setLastOrderViewDate(d);
    };
    const handleLastOrderClick = (day) => {
        const sel = new Date(lastOrderViewDate.getFullYear(), lastOrderViewDate.getMonth(), day);
        const ymd = sel.toLocaleDateString('en-CA');
        setFormData(prev => ({ ...prev, lastOrder: ymd }));
        setShowLastOrderPicker(false);
    };
    const renderLastOrderCalendar = () => {
        const daysInMonth = getDaysInMonth(lastOrderViewDate);
        const firstDay = getFirstDayOfMonth(lastOrderViewDate);
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        for (let day = 1; day <= daysInMonth; day++) {
            days.push(
                <div key={day} className="calendar-day" onClick={() => handleLastOrderClick(day)}>
                    {day}
                </div>
            );
        }
        return days;
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        
        // Validate percentage fields to not exceed 100
        if (name === 'onTime' || name === 'quality') {
            const numValue = parseFloat(value);
            if (numValue > 100) {
                // Don't update if value exceeds 100
                return;
            }
            // Also ensure it's not negative
            if (numValue < 0) {
                setFormData(prev => ({ ...prev, [name]: 0 }));
                return;
            }
        }
        
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    // Using module-scoped CalendarSelect defined above
    const handleRatingChange = (newRating) => {
        setFormData(prev => ({ ...prev, rating: newRating }));
    };

    return (
        <div className="ev-page-container">
            <header className="ev-header">
                <button className="ev-back-btn" onClick={onCancel}><FiX /></button>
                <h1>{vendor.id ? 'Edit Vendor' : 'Add Vendor'}</h1>
                <button className="ev-save-btn" onClick={() => onSave(formData)}>Save</button>
            </header>
            <div className="ev-content">
                <div className="ev-section"><h2 className="ev-section-title">Basic Information</h2><div className="ev-input-group"><label>Vendor Name</label><input type="text" name="name" value={formData.name} onChange={handleInputChange} /></div><div className="ev-input-group"><label>Description</label><textarea name="description" value={formData.description} onChange={handleInputChange}></textarea></div></div>
                <div className="ev-section"><h2 className="ev-section-title">Category</h2><div className="vm-filters">{['Wholesale', 'Dairy', 'Meat', 'Seafood', 'Vegetables', 'Fruits'].map(cat => (<button key={cat} className={`vm-filter-pill ${formData.category === cat ? 'active' : ''}`} onClick={() => setFormData(prev => ({ ...prev, category: cat }))}>{cat}</button>))}</div></div>
                <div className="ev-section"><h2 className="ev-section-title">Your Rating</h2><StarRating rating={formData.rating} onRatingChange={handleRatingChange} /><p className="ev-rating-prompt">Rate this vendor based on your experience</p></div>
                <div className="ev-section"><h2 className="ev-section-title">Performance Metrics</h2><div className="ev-input-group"><label>On-Time Delivery (%)</label><input type="number" name="onTime" value={formData.onTime} onChange={handleInputChange} min="0" max="100" step="0.01" /></div><div className="ev-input-group"><label>Quality Score (%)</label><input type="number" name="quality" value={formData.quality} onChange={handleInputChange} min="0" max="100" step="0.01" /></div><div className="ev-input-group"><label>Last Delivery Date</label><div className="date-picker-wrap"><input type="date" name="lastOrder" value={formData.lastOrder} onChange={handleInputChange} /><button type="button" className="date-picker-button" aria-label="Open calendar" onClick={openLastOrderPicker}><FontAwesomeIcon icon={faCalendarRegular} /></button></div></div></div>

            {/* Last Delivery Date calendar overlay (same type as StockIn) */}
            {showLastOrderPicker && (
                <div className="date-picker-overlay" onClick={closeLastOrderPicker}>
                    <div className="date-picker-popup" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()}>
                        <div className="calendar-header">
                            <button onClick={() => navigateLastOrderMonth(-1)}>‹</button>
                            <div className="calendar-header-controls">
                                <CalendarSelect
                                    options={monthNames.map((m, i) => ({ label: m, value: i }))}
                                    value={lastOrderViewDate.getMonth()}
                                    onChange={(val) => { const d = new Date(lastOrderViewDate); d.setMonth(val); setLastOrderViewDate(d); }}
                                    width={130}
                                />
                                <CalendarSelect
                                    options={Array.from({ length: 21 }, (_, k) => new Date().getFullYear() - 10 + k).map(y => ({ label: String(y), value: y }))}
                                    value={lastOrderViewDate.getFullYear()}
                                    onChange={(val) => { const d = new Date(lastOrderViewDate); d.setFullYear(val); setLastOrderViewDate(d); }}
                                    width={90}
                                />
                            </div>
                            <button onClick={() => navigateLastOrderMonth(1)}>›</button>
                        </div>
                        <div className="calendar-weekdays">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                                <div key={d} className="weekday">{d}</div>
                            ))}
                        </div>
                        <div className="calendar-grid">
                            {renderLastOrderCalendar()}
                        </div>
                    </div>
                </div>
            )}
                <div className="ev-section"><h2 className="ev-section-title">Contact Information</h2><div className="ev-input-group"><label>Phone Number</label><input type="tel" name="phone" value={formData.phone} onChange={handleInputChange} /></div><div className="ev-input-group"><label>Email</label><input type="email" name="email" value={formData.email} onChange={handleInputChange} /></div><div className="ev-input-group"><label>Address</label><textarea name="address" value={formData.address} onChange={handleInputChange}></textarea></div></div>
                
                {/* Delete Section - Only show for existing vendors */}
                {vendor.id && !String(vendor.id).startsWith('temp_') && (
                    <div className="ev-section ev-danger-section">
                        <button 
                            className="ev-delete-btn"
                            onClick={() => onDelete && onDelete(vendor.id, vendor.name)}
                            style={{
                                backgroundColor: '#fee2e2',
                                color: '#dc2626',
                                border: 'none',
                                padding: '14px 24px',
                                borderRadius: '8px',
                                fontSize: '16px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                width: '100%',
                                marginTop: '20px',
                                transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#fecaca';
                                e.target.style.color = '#b91c1c';
                            }}
                            onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#fee2e2';
                                e.target.style.color = '#dc2626';
                            }}
                        >
                            Delete Vendor
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

const VendorManagement = ({ onNavigateBack, isSelectingMode, onSelectVendor, initialCategoryFilter = 'All' }) => {
    console.log('🟢 VendorManagement received initialCategoryFilter:', initialCategoryFilter);

    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef(null);
    const [activeFilter, setActiveFilter] = useState(initialCategoryFilter);
    const [editingVendor, setEditingVendor] = useState(null);
    const [vendorForCredit, setVendorForCredit] = useState(null);
    const [isVendorSelectOpen, setIsVendorSelectOpen] = useState(false);
    const [successMessage, setSuccessMessage] = useState(null);

    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const clearSearch = () => {
        setSearchTerm('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    // Update activeFilter when initialCategoryFilter changes
    useEffect(() => {
        console.log('🟢 VendorManagement updating activeFilter to:', initialCategoryFilter);
        setActiveFilter(initialCategoryFilter);
    }, [initialCategoryFilter]);

    // Fetch vendors from API
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                setLoading(true);
                // Fetching vendors from API

                // Build API URL with category filter
                let apiUrl = '/api/vendor-management/vendors/1';
                if (activeFilter !== 'All') {
                    apiUrl += `?category=${activeFilter}`;
                }

                const response = await fetch(apiUrl);
                const data = await response.json();

                // API Response received

                if (data.success) {
                    // Transform API data to match component expectations
                    const transformedVendors = data.data.map(vendor => ({
                        id: vendor.vendor_id,
                        name: vendor.name,
                        description: vendor.description || '',
                        category: vendor.category || 'Wholesale',
                        rating: Number(vendor.user_rating || vendor.average_rating || 0) || 0,
                        onTime: vendor.on_time_delivery_rate || 0,
                        quality: vendor.quality_score || 0,
                        lastOrder: vendor.last_order_date || new Date().toISOString().split('T')[0],
                        phone: vendor.contact_phone || '',
                        email: vendor.contact_email || '',
                        address: vendor.address || '',
                        creditBalance: vendor.credit_balance || 0,
                        totalSpend: Number(vendor.total_spend || 0) || 0,
                        totalOrders: vendor.total_purchase_orders || 0
                    }));
                    setVendors(transformedVendors);
                } else {
                    console.error('Failed to fetch vendors:', data.error);
                    // If no vendors exist, try to setup sample vendors
                    const setupResponse = await fetch('/api/vendor-management/setup-categories/1', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' }
                    });
                    const setupData = await setupResponse.json();

                    if (setupData.success) {
                        // Retry fetching vendors
                        window.location.reload();
                    } else {
                        setVendors([]);
                    }
                }
            } catch (error) {
                console.error('❌ Error fetching vendors:', error);
                setVendors([]);
            } finally {
                setLoading(false);
            }
        };

        fetchVendors();
    }, [activeFilter]); // Re-fetch when filter changes

    const filteredVendors = useMemo(() => {
        // Use smart search with priority-based filtering
        return searchTerm.trim()
            ? performSmartSearch(vendors, searchTerm, ['name', 'category', 'description'])
            : vendors;
    }, [vendors, searchTerm]);

    const totalCredit = useMemo(() => {
        return vendors.reduce((sum, vendor) => sum + vendor.creditBalance, 0);
    }, [vendors]);

    const handleSaveVendor = async (vendorToSave) => {
        try {
            // Check if this is a new vendor (temporary ID from Date.now()) or existing vendor
            const isNewVendor = vendorToSave.id > 2147483647; // If ID is larger than max integer, it's a timestamp

            if (isNewVendor) {
                // Create new vendor
                const createData = {
                    businessId: 1, // Default business ID
                    name: vendorToSave.name,
                    description: vendorToSave.description,
                    category: vendorToSave.category,
                    contactPhone: vendorToSave.phone,
                    contactEmail: vendorToSave.email,
                    contactWhatsapp: vendorToSave.phone, // Use phone as whatsapp for now
                    address: vendorToSave.address,
                    averageRating: vendorToSave.rating,
                    qualityScore: vendorToSave.quality,
                    userId: 1 // Default user ID
                };

                const response = await fetch(`/api/vendor-management/vendors`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(createData)
                });

                const result = await response.json();

                if (result.success) {
                    // Add the new vendor with the real ID from database
                    const newVendor = {
                        ...vendorToSave,
                        id: result.data.vendor_id,
                        // Map backend response to frontend format
                        category: result.data.category,
                        onTime: result.data.on_time_delivery_rate || 0,
                        creditBalance: 0
                    };
                    setVendors(prev => [...prev, newVendor]);

                    // Show success popup
                    setSuccessMessage('Vendor created successfully');

                    // Close edit form
                    setEditingVendor(null);
                } else {
                    console.error('Failed to create vendor:', result.error);
                    alert('Failed to create vendor: ' + result.error);
                }
            } else {
                // Update existing vendor
                const updateData = {
                    name: vendorToSave.name,
                    description: vendorToSave.description,
                    contact_phone: vendorToSave.phone,
                    contact_email: vendorToSave.email,
                    address: vendorToSave.address,
                    average_rating: vendorToSave.rating,
                    quality_score: vendorToSave.quality
                };

                const response = await fetch(`/api/vendor-management/vendors/${vendorToSave.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(updateData)
                });

                const result = await response.json();

                if (result.success) {
                    // Update local state
                    setVendors(prev => prev.map(v => v.id === vendorToSave.id ? vendorToSave : v));

                    // Show success popup
                    setSuccessMessage('Vendor updated successfully');

                    // Close edit form
                    setEditingVendor(null);
                } else {
                    console.error('Failed to update vendor:', result.error);
                    alert('Failed to update vendor: ' + result.error);
                }
            }
        } catch (error) {
            console.error('Error saving vendor:', error);
            alert('Error saving vendor: ' + error.message);
        }
    };

    const handleDeleteVendor = async (vendorId, vendorName) => {
        if (!window.confirm(`Are you sure you want to delete "${vendorName}"? This action cannot be undone.`)) {
            return;
        }

        try {
            const response = await fetch(`/api/vendor-management/vendors/${vendorId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            const result = await response.json();
            
            if (result.success) {
                // Remove vendor from local state
                setVendors(prev => prev.filter(vendor => vendor.id !== vendorId));
                setSuccessMessage('Vendor deleted successfully');
                // Close edit form if this vendor was being edited
                setEditingVendor(null);
            } else {
                console.error('Failed to delete vendor:', result.error);
                alert('Failed to delete vendor: ' + result.error);
            }
        } catch (error) {
            console.error('Error deleting vendor:', error);
            alert('Error deleting vendor: ' + error.message);
        }
    };

    const handleAddVendorClick = () => {
        const newVendorTemplate = {
            id: Date.now(),
            name: '',
            description: '',
            category: 'Vegetables',
            rating: 0,
            onTime: 0,
            quality: 0,
            lastOrder: new Date().toISOString().split('T')[0],
            phone: '',
            email: '',
            address: '',
            creditBalance: 0
        };
        setEditingVendor(newVendorTemplate);
    };

    const handleSelectVendorForCredit = (vendor) => {
        setVendorForCredit(vendor);
        setIsVendorSelectOpen(false);
    };

    const handleAddCredit = (vendorId, amount) => {
        setVendors(prev =>
            prev.map(v => v.id === vendorId ? { ...v, creditBalance: v.creditBalance + amount } : v)
        );
        setVendorForCredit(null);
    };

    const closeModals = () => {
        setIsVendorSelectOpen(false);
        setVendorForCredit(null);
    };

    if (editingVendor) {
        return <EditVendor vendor={editingVendor} onSave={handleSaveVendor} onCancel={() => setEditingVendor(null)} onDelete={handleDeleteVendor} />;
    }

    return (
        <>
            <StandardScrollStyles />
            <div className="vm-page-container">
                <div className="vm-content">
                    <header className="vm-header">
                        <button className="vm-back-btn" onClick={onNavigateBack}>
                            <FiArrowLeft />
                        </button>
                        <h1 style={standardTextSizes.xl}>Vendor Management</h1>
                    </header>
                    <StandardSearch
                        searchTerm={searchTerm}
                        onSearchChange={handleSearchChange}
                        onClearSearch={clearSearch}
                        placeholder="Search vendors..."
                        inputRef={searchInputRef}
                    />
                    <div className="vm-filters">
                        {['All', 'Wholesale', 'Dairy', 'Meat', 'Seafood', 'Vegetables', 'Fruits'].map(filter => {
                            const isActive = activeFilter === filter;
                            console.log(`🟢 Filter: ${filter}, activeFilter: ${activeFilter}, isActive: ${isActive}`);
                            return (
                                <button
                                    key={filter}
                                    className={`vm-filter-pill ${isActive ? 'active' : ''}`}
                                    onClick={() => setActiveFilter(filter)}
                                >
                                    {filter}
                                </button>
                            );
                        })}
                    </div>
                    <>
                        <div className="vm-kpi-grid">
                                                        <div className="vm-kpi-card"><span className="vm-kpi-value">4.8</span><span className="vm-kpi-label">Avg. Rating</span></div>
                                                        <div className="vm-kpi-card"><span className="vm-kpi-value">98%</span><span className="vm-kpi-label">On-time Delivery</span></div>
                                                        <div className="vm-kpi-card"><span className="vm-kpi-value">95%</span><span className="vm-kpi-label">Quality Score</span></div>
                                                        <div className="vm-kpi-card"><span className="vm-kpi-value">
                                                                <Counter
                                                                    value={Number(vendors.length || 0)}
                                                                    places={(() => { const n = Number(vendors.length || 0); if (n >= 100) return [100,10,1]; if (n>=10) return [10,1]; return [1]; })()}
                                                                    fontSize={18}
                                                                    padding={0}
                                                                    gap={0}
                                                                    horizontalPadding={0}
                                                                    borderRadius={0}
                                                                    textColor={'currentColor'}
                                                                    gradientHeight={0}
                                                                    containerStyle={{ display: 'inline-block', verticalAlign: 'baseline' }}
                                                                    counterStyle={{ lineHeight: 1 }}
                                                                />
                                                            </span><span className="vm-kpi-label">Active Vendors</span></div>
                        </div>
                        <div className="vm-total-spend-card-modified">
                            <div className="vm-total-spend-info">
                                <span className="vm-total-spend-label">Total Spend</span>
                                <div className="vm-total-spend-amount">
                                    ₹ 18,200
                                    <span className="vm-total-spend-period">(This Period)</span>
                                </div>
                            </div>

                            <div className="vm-total-credit-info">
                                <span className="vm-total-credit-label">Total Credit Extended</span>
                                <span className="vm-total-credit-amount">
                                    ₹{totalCredit.toLocaleString()}
                                </span>
                            </div>

                            <button className="vm-add-credit-btn" onClick={() => setIsVendorSelectOpen(true)}>
                                <FiPlus /> Add Credit
                            </button>
                        </div>
                    </>
                    <div className="vm-vendor-list">
                        {loading ? (
                            <div className="vm-loading-container">
                                <p>Loading vendors...</p>
                            </div>
                        ) : filteredVendors.length > 0 ? (
                            filteredVendors.map(vendor => (
                                <div
                                    key={vendor.id}
                                    className="vm-vendor-card"
                                    onClick={() => {
                                        if (isSelectingMode && onSelectVendor) {
                                            // Transform vendor data for CreateReorder
                                            const vendorForSelection = {
                                                vendor_id: vendor.id,
                                                name: vendor.name,
                                                description: vendor.description,
                                                vendor_category: vendor.category.toLowerCase(),
                                                category: vendor.category,
                                                average_rating: vendor.rating,
                                                contact_phone: vendor.phone,
                                                contact_email: vendor.email,
                                                total_purchase_orders: vendor.totalOrders,
                                                on_time_delivery_rate: vendor.onTime,
                                                quality_score: vendor.quality,
                                                address: vendor.address
                                            };

                                            console.log('🟡 VendorManagement: Vendor clicked in selection mode:', vendorForSelection);

                                            // Primary method: pass selection up
                                            onSelectVendor(vendorForSelection);
                                            // Backup: store in localStorage for CreateReorder listener
                                            localStorage.setItem('pendingVendorSelection', JSON.stringify(vendorForSelection));
                                            console.log('🟡 VendorManagement: Stored in localStorage as backup');
                                            // Navigate back to Create Reorder immediately
                                            if (typeof onNavigateBack === 'function') {
                                                onNavigateBack();
                                            }
                                        } else {
                                            setEditingVendor(vendor);
                                        }
                                    }}
                                >
                                    <div className="vm-vendor-header">
                                        <div className="vm-vendor-title">
                                            <h2 style={standardTextSizes.lg}>
                                                {highlightMatch(vendor.name, searchTerm)}
                                            </h2>
                                            <p style={standardTextSizes.sm}>
                                                {highlightMatch(vendor.description, searchTerm)}
                                            </p>
                                        </div>
                                        <div className="vm-vendor-rating">
                                            <FiStar className="vm-star-icon" />
                                            <span>{vendor.rating}</span>
                                        </div>
                                    </div>
                                    <div className="vm-vendor-stats"><span className="vm-stat-item"><FiTruck /> {vendor.onTime}% On-time</span><span className="vm-stat-item"><FiCheckCircle /> {vendor.quality}% Quality</span><span className="vm-stat-item"><FiCalendar /> {new Date(vendor.lastOrder).toLocaleDateString('en-GB')}</span></div>
                                    <div className="vm-vendor-actions"><button className="vm-contact-btn" onClick={(e) => e.stopPropagation()}><FiPhone /> Contact</button><button className="vm-details-btn" onClick={(e) => { e.stopPropagation(); setEditingVendor(vendor); }}>View Details</button></div>
                                </div>
                            ))
                        ) : (
                            <div className="vm-no-vendors-container">
                                <p className="vm-no-vendors-message">No vendors found for the selected filter: "{activeFilter}"</p>
                                <p className="vm-no-vendors-suggestion">Try selecting "All" or add a new vendor.</p>
                            </div>
                        )}
                    </div>
                    <button className="vm-add-vendor-btn" onClick={handleAddVendorClick}><FiPlus /> Add a Vendor</button>
                </div>
            </div>
            {isVendorSelectOpen && <VendorSelectModal vendors={vendors} onSelect={handleSelectVendorForCredit} onCancel={closeModals} />}
            {vendorForCredit && !isVendorSelectOpen && <AddCreditModal vendor={vendorForCredit} onAdd={handleAddCredit} onCancel={closeModals} />}

            {/* Success Popup */}
            {successMessage && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999
                }}>
                    <div style={{
                        width: 'min(400px, 90vw)',
                        background: '#fff',
                        borderRadius: '12px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
                        padding: '24px',
                        textAlign: 'center'
                    }}>
                        {/* Green Tick Mark */}
                        <div style={{
                            display: 'flex',
                            justifyContent: 'center',
                            marginBottom: '16px'
                        }}>
                            <div style={{
                                width: '60px',
                                height: '60px',
                                borderRadius: '50%',
                                border: '3px solid #22c55e',
                                backgroundColor: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FiCheck size={36} color="#22c55e" strokeWidth={3} />
                            </div>
                        </div>

                        {/* Success Message */}
                        <div style={{
                            fontSize: '18px',
                            fontWeight: '600',
                            marginBottom: '20px',
                            color: '#1f2937'
                        }}>
                            {successMessage}
                        </div>

                        {/* OK Button */}
                        <button
                            onClick={() => setSuccessMessage(null)}
                            style={{
                                padding: '10px 24px',
                                backgroundColor: '#22c55e',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '14px',
                                fontWeight: '600',
                                cursor: 'pointer'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default VendorManagement;