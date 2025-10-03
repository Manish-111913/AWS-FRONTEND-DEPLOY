import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { FiPlus, FiCalendar } from 'react-icons/fi';
import MenuService from '../services/menuService';
import UsageService from '../services/usageService';
import './Usage.css';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { StandardSearch, highlightMatch } from '../styles/standardStyles';
import ImageWithFallback from './ImageWithFallback';

// Success Modal component for submission feedback
const SuccessModal = ({ show, message, onClose }) => {
    if (!show) return null;

    return (
        <div className="usage-modal-overlay" onClick={onClose}>
            <div className="usage-success-modal-box" onClick={e => e.stopPropagation()}>
                <FontAwesomeIcon icon={faCheck} className="usage-checkmark green" />
                <p>{message}</p>
                <button onClick={onClose} className="usage-ok-btn">OK</button>
            </div>
        </div>
    );
};

// Confirmation Modal component for showing usage details before submission
const ConfirmUsageModal = ({ show, selectedItems, selectedShift, notes, totalEstimatedCost, formattedDate, onConfirm, onCancel, isSubmitting }) => {
    if (!show) return null;

    return (
        <div className="usage-modal-overlay" onClick={!isSubmitting ? onCancel : undefined}>
            <div className="usage-modal-content usage-confirm-modal" onClick={e => e.stopPropagation()}>
                <h3>Confirm Usage Record</h3>
                
                {/* Items List */}
                <div className="usage-item-breakdown-list">
                    {selectedItems.map(item => (
                        <div className="usage-item-row" key={item.id}>
                            <span>{item.name}</span>
                            <span>x {item.quantity}</span>
                        </div>
                    ))}
                </div>

                {/* Summary Details */}
                <div className="usage-confirm-details">
                    <p><span>Total Items:</span><span>{selectedItems.reduce((sum, item) => sum + (item.quantity || 0), 0)}</span></p>
                    <div className="usage-estimated-cost-box">
                        <p><span>Estimated Cost:</span><span>₹{totalEstimatedCost.toFixed(2)}</span></p>
                    </div>
                    <p><span>Production Date:</span><span>{formattedDate}</span></p>
                    <p><span>Shift:</span><span>{selectedShift.name}</span></p>
                    <p><span>Shift Time:</span><span>{selectedShift.time}</span></p>
                    {notes && <p><span>Notes:</span><span>{notes}</span></p>}
                </div>

                {/* Action Buttons */}
                <div className="usage-confirm-actions">
                    <button 
                        className="usage-cancel-btn" 
                        onClick={onCancel}
                        disabled={isSubmitting}
                    >
                        Cancel
                    </button>
                    <button 
                        className="usage-confirm-btn-final" 
                        onClick={onConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Processing...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- Data for the shift dropdown ---
const shiftOptions = [
    { name: 'Morning Shift', time: '6:00 AM - 12:00 PM' },
    { name: 'Afternoon Shift', time: '12:00 PM - 6:00 PM' },
    { name: 'Night Shift', time: '6:00 PM - 12:00 AM' },
];

// --- Helper Component 1: The pop-up modal for adding items ---
const AddItemModal = ({ onClose, onAddItem, allItems }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filteredItems = useMemo(() => {
        if (!allItems || !Array.isArray(allItems)) return [];
        
        if (!searchTerm.trim()) {
            return allItems; // Return all items if no search term
        }
        
        // Sort items: matching items first, then non-matching items
        const matchingItems = allItems.filter(item =>
            item && item.name && item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        const nonMatchingItems = allItems.filter(item =>
            item && item.name && !item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        return [...matchingItems, ...nonMatchingItems];
    }, [searchTerm, allItems]);

    return (
        // Renamed for specificity
        <div className="usage-modal-overlay" onClick={onClose}>
            <div className="usage-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="usage-modal-header">
                    <h2>Select Dish to Produce</h2>
                    <button className="usage-close-btn" onClick={onClose}>×</button>
                </div>
                <div className="usage-search-bar">
                    <StandardSearch
                        value={searchTerm}
                        onChange={setSearchTerm}
                        placeholder="Search dishes..."
                        showClearButton={true}
                    />
                </div>
                <div className="usage-dishes-grid">
                    {filteredItems.length > 0 ? (
                        filteredItems.map(item => (
                            <div key={item.id || Math.random()} className="usage-dish-card" onClick={() => onAddItem(item)}>
                                <div className="usage-dish-img-wrapper">
                                    <ImageWithFallback
                                        src={item.img || item.image || item.fallback_img || item.placeholder_img}
                                        fallback={item.fallback_img}
                                        placeholder={item.placeholder_img}
                                        alt={item.name || 'Menu Item'}
                                        style={{ width: '100%', height: 120, borderRadius: 8 }}
                                    />
                                </div>
                                <p className="usage-dish-name">{highlightMatch(item.name || 'Unknown Item', searchTerm)}</p>
                                <p className="usage-dish-price">₹{(item.price || 0).toFixed(2)}</p>
                            </div>
                        ))
                    ) : (
                        <div className="usage-no-items-message">No items found</div>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- Helper Component 2: The card for each selected item ---
const UsageItemCard = ({ item, onUpdateQuantity, onRemove }) => {
    if (!item || !item.id) {
        return null;
    }
    
    const handleQuantityInputChange = (e) => {
        const value = e.target.value;
        onUpdateQuantity(item.id, value === '' ? 0 : parseInt(value, 10));
    };
    
    const increment = () => onUpdateQuantity(item.id, (item.quantity || 0) + 1);
    const decrement = () => onUpdateQuantity(item.id, Math.max(0, (item.quantity || 0) - 1));
    
    return (
    <div className="usage-item-card">
        <div className="usage-item-card-img">
            <ImageWithFallback
                src={item.img || item.image || item.fallback_img || item.placeholder_img}
                fallback={item.fallback_img}
                placeholder={item.placeholder_img}
                alt={item.name || 'Item'}
                style={{ width: 90, height: 70, borderRadius: 6 }}
            />
        </div>
        <div className="item-details">
            <div className="item-header">
                {/* Name is now the main element here */}
                <p className="item-name">{item.name || 'Unknown Item'}</p>
                <button className="remove-btn" onClick={() => onRemove(item.id)}>×</button>
            </div>
            <div className="item-controls">
                <div className="quantity-control">
                    {/* Quantity label is removed for a cleaner look */}
                    <div className="selector">
                        <button onClick={decrement}>-</button>
                        <input type="number" value={item.quantity || 0} onChange={handleQuantityInputChange} />
                        <button onClick={increment}>+</button>
                    </div>
                </div>
                {/* The unit dropdown is now just plain text */}
                <span className="unit-display">{item.unit || 'Plates'}</span>
            </div>
        </div>
    </div>
);
};


// --- Main Usage Component ---
const Usage = () => {
    const [selectedItems, setSelectedItems] = useState([]);
    const [notes, setNotes] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState(shiftOptions[0]);
    const [isShiftDropdownOpen, setShiftDropdownOpen] = useState(false);
    const [menuItems, setMenuItems] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // State for success modal
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    
    // State for confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const today = new Date();
    const dateOptions = { weekday: 'short', year: 'numeric', month: 'short', day: '2-digit' };
    const formattedDate = today.toLocaleDateString('en-IN', dateOptions);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const menuResponse = await MenuService.getMenuItems();
                if (menuResponse.success && menuResponse.data) {
                    const formattedMenuItems = menuResponse.data.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: parseFloat(item.price),
                        img: item.img,
                        fallback_img: item.fallback_img,
                        placeholder_img: item.placeholder_img
                    }));
                    setMenuItems(formattedMenuItems);
                }
            } catch (err) {
                setError(err.message);
                console.error('Error fetching data:', err);
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchData();
        
        const savedDraft = localStorage.getItem('usageDraft');
        if (savedDraft) {
            try {
                const draft = JSON.parse(savedDraft);
                if (draft && draft.selectedItems && Array.isArray(draft.selectedItems)) {
                    setSelectedItems(draft.selectedItems);
                    if (draft.notes) setNotes(draft.notes);
                    if (draft.shift) {
                        const foundShift = shiftOptions.find(s => s.name === draft.shift);
                        if (foundShift) setSelectedShift(foundShift);
                    }
                } else {
                    localStorage.removeItem('usageDraft');
                }
            } catch (error) {
                localStorage.removeItem('usageDraft');
            }
        }
    }, []);

    const totalEstimatedCost = useMemo(() => {
        if (!selectedItems || !Array.isArray(selectedItems)) return 0;
        return selectedItems.reduce((total, item) => {
            const price = item && item.price ? parseFloat(item.price) : 0;
            const quantity = item && item.quantity ? parseInt(item.quantity, 10) : 0;
            return total + (price * quantity);
        }, 0);
    }, [selectedItems]);

    const handleUpdateQuantity = useCallback((itemId, newQuantity) => {
        setSelectedItems(currentItems =>
            currentItems.map(item =>
                item.id === itemId ? { ...item, quantity: Math.max(0, newQuantity) } : item
            )
        );
    }, []);
    
    const handleRemoveItem = useCallback((itemId) => {
        setSelectedItems(currentItems => currentItems.filter(item => item.id !== itemId));
    }, []);

    const handleAddItem = useCallback((itemToAdd) => {
        if (selectedItems.find(item => item.id === itemToAdd.id)) return;
        setSelectedItems(currentItems => [...currentItems, { ...itemToAdd, quantity: 1, unit: 'Plates' }]);
        setIsModalOpen(false);
    }, [selectedItems]);
    
    const handleShiftSelect = (shift) => {
        setSelectedShift(shift);
        setShiftDropdownOpen(false);
    };

    const handleSubmit = async () => {
        if (!selectedItems || selectedItems.length === 0) {
            alert("Please add at least one item before submitting.");
            return;
        }
        
        const invalidItems = selectedItems.filter(item => !item || !item.quantity || item.quantity <= 0);
        if (invalidItems.length > 0) {
            alert("Some items have invalid quantities. Please check and try again.");
            return;
        }
        
        // Show confirmation modal instead of direct submission
        setShowConfirmModal(true);
    };

    const handleConfirmSubmission = async () => {
        setIsSubmitting(true);
        setError(null);
        
        try {
            const usageData = {
                items: selectedItems.map(item => ({
                    menu_item_id: item.id,
                    quantity: parseInt(item.quantity, 10) || 0,
                    unit: item.unit || 'Plates',
                    estimated_cost: (parseFloat(item.price) || 0) * (parseInt(item.quantity, 10) || 0)
                })),
                recorded_by_user_id: 1,
                production_date: today.toISOString().split('T')[0],
                shift: selectedShift ? selectedShift.name : 'Morning Shift',
                shift_time: selectedShift ? selectedShift.time : '6:00 AM - 12:00 PM',
                notes: notes || '',
                total_estimated_cost: totalEstimatedCost
            };
            
            localStorage.setItem('usageDraft', JSON.stringify({
                selectedItems,
                notes,
                shift: selectedShift ? selectedShift.name : 'Morning Shift',
            }));
            
            const response = await UsageService.recordUsage(usageData);
            
            if (response && response.success) {
                setShowConfirmModal(false);
                setSuccessMessage("Usage data submitted successfully!");
                setShowSuccessModal(true);
                
                // Clear the form data
                setSelectedItems([]);
                setNotes('');
                localStorage.removeItem('usageDraft');
            } else {
                throw new Error((response && response.message) || 'Failed to submit usage data');
            }
        } catch (err) {
            const errorMessage = err.message || 'An unexpected error occurred';
            setError(errorMessage);
            alert(`Error: ${errorMessage}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="usage-page-container">
            {isLoading && <div className="loading-overlay"><div className="loading-spinner"></div></div>}
            {error && <div className="error-message">Error: {error}</div>}
            {isModalOpen && (
                <AddItemModal onClose={() => setIsModalOpen(false)} onAddItem={handleAddItem} allItems={menuItems} />
            )}
            
            {/* Success Modal for submission feedback */}
            <SuccessModal
                show={showSuccessModal}
                message={successMessage}
                onClose={() => setShowSuccessModal(false)}
            />
            
            {/* Confirmation Modal for usage details */}
            <ConfirmUsageModal
                show={showConfirmModal}
                selectedItems={selectedItems}
                selectedShift={selectedShift}
                notes={notes}
                totalEstimatedCost={totalEstimatedCost}
                formattedDate={formattedDate}
                onConfirm={handleConfirmSubmission}
                onCancel={() => setShowConfirmModal(false)}
                isSubmitting={isSubmitting}
            />
            <div className="usage-form">
                <div className="form-group">
                    <div className="date-input">
                        <FiCalendar className="input-icon" />
                        <div className="input-text-wrapper">
                            <span style={{ fontSize: '0.8rem' }}>Production Date</span>
                            <span>{formattedDate}</span>
                        </div>
                    </div>
                </div>
                <div className="form-group relative">
                    <div className="shift-select" onClick={() => setShiftDropdownOpen(!isShiftDropdownOpen)}>
                        <div className="input-text-wrapper">
                            <span className="shift-details">{selectedShift.name} <span className="shift-time">{selectedShift.time}</span></span>
                        </div>
                            <span className="chevron-down" />
                    </div>
                    {isShiftDropdownOpen && (
                        <div className="shift-dropdown-options">
                            {shiftOptions.map((option) => (
                                <div key={option.name} className="shift-option" onClick={() => handleShiftSelect(option)}>
                                    <span className="shift-name">{option.name}</span>
                                    <span className="shift-time">{option.time}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="items-section">
                <h3>Items</h3>
                {selectedItems.length === 0 ? (
                    <button className="add-more-items-btn" onClick={() => setIsModalOpen(true)}>
                        <FiPlus /> Add Items
                    </button>
                ) : (
                    <>
                        <div className="items-list">
                            {selectedItems.map(item => (
                                <UsageItemCard key={item.id} item={item} onUpdateQuantity={handleUpdateQuantity} onRemove={handleRemoveItem} />
                            ))}
                        </div>
                        <button className="add-more-items-btn" onClick={() => setIsModalOpen(true)}>
                            <FiPlus /> Add More Items
                        </button>
                        <div className="total-cost-summary">
                            <p>Estimated Cost: ₹{totalEstimatedCost.toFixed(2)}</p>
                        </div>
                    </>
                )}
            </div>
            <div className="notes-section">
                <h3>Notes</h3>
                <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Add notes here..." />
            </div>
            <div className="form-actions">
                <button className="submit-btn" onClick={handleSubmit}>Submit</button>
            </div>
        </div>
    );
};

export default Usage;