import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import OCRService from '../services/ocrService';
import SalesService from '../services/salesService';
import './TodaysSalesReport.css';

const TodaysSalesReport = ({ goTo }) => {
    // State for OCR scanned data - starts empty, populated by OCR
    const [salesData, setSalesData] = useState([]);
    // Per-row complementary counts keyed by the parser's exact item_name
    const [rowComplementary, setRowComplementary] = useState({});
    const [totalAmount, setTotalAmount] = useState('₹0');
    const [isScanning, setIsScanning] = useState(false);
    const [error, setError] = useState(null);
    const [isDeducting, setIsDeducting] = useState(false);



    // Function to handle bill scanning
    const handleScanBill = () => {
        document.getElementById('bill-scan-input').click();
    };

    // Function to handle file selection and OCR processing
    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
                    if (!file) return;

                    setIsScanning(true);
                    setError(null);
                    setSalesData([]);
                    setRowComplementary({});
                    setTotalAmount('₹0');
        try {
            // Process the sales report using OCR service
            const result = await OCRService.processSalesReport(file);

                if (result.success && result.salesData) {
                const { salesData } = result;

                // Menu items with their variations
                const menuItems = {
                    'Paneer Butter Masala': {
                        id: 1,
                        variations: ['Paneer Butter', 'Butter Paneer', 'Paneer Makhani']
                    },
                    'Vegetable Biryani': {
                        id: 2,
                        variations: ['Veg Biryani', 'Vegetable Biryani', 'Veg. Biryani']
                    },
                    'Masala Chai': {
                        id: 3,
                        variations: ['Chai', 'Tea', 'Masala Tea']
                    },
                    'Chicken Tikka': {
                        id: 4,
                        variations: ['Chk Tikka']
                    },
                    'Garlic Naan': {
                        id: 5,
                        variations: ['Naan']
                    },
                    'Lassi': {
                        id: 6,
                        variations: ['Sweet Lassi', 'Plain Lassi']
                    },
                    'Tandoori Chicken': {
                        id: 7,
                        variations: ['Tandoori Chk']
                    },
                    'Paneer Tikka': {
                        id: 8,
                        variations: ['P.Tikka']
                    },
                    'Veggie Samosa': {
                        id: 9,
                        variations: ['Samosa', 'Veg Samosa']
                    },
                    'Sweet Ladoo': {
                        id: 10,
                        variations: ['Ladoo', 'Laddu']
                    }
                };

                // Helper function to find menu item ID from name
                const findMenuItemId = (itemName) => {
                    itemName = itemName.toLowerCase().trim();
                    
                    // First try exact match
                    const exactMatch = Object.entries(menuItems).find(([key]) => 
                        key.toLowerCase() === itemName
                    );
                    if (exactMatch) return exactMatch[1].id;

                    // Then try variations
                    const variationMatch = Object.entries(menuItems).find(([_, value]) => 
                        value.variations.some(v => v.toLowerCase() === itemName)
                    );
                    if (variationMatch) return variationMatch[1].id;

                    // Finally try partial match
                    const partialMatch = Object.entries(menuItems).find(([key, value]) => {
                        const mainName = key.toLowerCase();
                        if (itemName.includes(mainName) || mainName.includes(itemName)) return true;
                        return value.variations.some(v => 
                            v.toLowerCase().includes(itemName) || itemName.includes(v.toLowerCase())
                        );
                    });
                    
                    return partialMatch ? partialMatch[1].id : null;
                };

                console.log('Received OCR Data:', salesData);

                // Transform OCR data to match our component format and store API data
                const transformedData = salesData.items.map(item => {
                    // Clean and normalize item name
                    const rawItemName = item.item_name || 'Unknown Item';
                    const itemName = rawItemName.trim();
                    
                    // Extract numeric values safely
                    let quantity = 1;
                    if (typeof item.total_quantity === 'string') {
                        quantity = parseInt(item.total_quantity.match(/\d+/)?.[0]) || 1;
                    } else if (typeof item.total_quantity === 'number') {
                        quantity = item.total_quantity;
                    }

                    let amount = 0;
                    if (typeof item.total_amount === 'string') {
                        amount = parseFloat(item.total_amount.replace(/[^\d.]/g, '')) || 0;
                    } else if (typeof item.total_amount === 'number') {
                        amount = item.total_amount;
                    }

                    const unitPrice = amount / quantity;

                    // Find matching menu item ID
                    const menuItemId = findMenuItemId(itemName);
                    
                    // Find the original menu item name if there's a match
                    let displayName = itemName;
                    if (menuItemId) {
                        const menuItemEntry = Object.entries(menuItems).find(([_, value]) => 
                            value.id === menuItemId
                        );
                        if (menuItemEntry) {
                            displayName = menuItemEntry[0]; // Use the canonical name
                        }
                    }
                    
                    console.log('Processing item:', {
                        rawName: rawItemName,
                        cleanName: itemName,
                        menuItemId,
                        displayName,
                        quantity,
                        amount,
                        unitPrice
                    });

            return {
                        item: displayName,
                        quantity: `${quantity} ${item.unit || 'plate'}`,
                        amount: `₹${amount.toFixed(2)}`,
                        apiData: {
                            menuItemId: menuItemId,
                            quantity: quantity,
                            unitPrice: unitPrice,
                            originalName: itemName,
                parserName: rawItemName,
                            matched: Boolean(menuItemId)
                        }
                    };
                });

                setSalesData(transformedData);
                
                // Build per-row complementary map from backend AI breakdown
                const breakdown = salesData.complementary_breakdown || {};
                const initialRowComp = {};
                Object.entries(breakdown).forEach(([name, qty]) => {
                    initialRowComp[name] = {
                        groundnut_chutney: qty,
                        tomato_chutney: qty,
                        karam_podi: qty,
                        sambar: qty
                    };
                });
                setRowComplementary(initialRowComp);
                
                setTotalAmount(`₹${salesData.summary.total_revenue.toFixed(2)}`);
                console.log('✅ Sales Report OCR processing successful:', {
                    itemsExtracted: transformedData.length,
                    totalItemsSold: salesData.summary.total_items_sold,
                    totalRevenue: salesData.summary.total_revenue,
                    uniqueItemsCount: salesData.summary.unique_items_count
                });
            } else {
                throw new Error(result.error || 'No sales data found in the report');
            }
        } catch (error) {
            console.error('❌ OCR processing failed:', error);
            setError(`Failed to process image: ${error.message}`);
            setSalesData([]);
            setRowComplementary({});
            setTotalAmount('₹0');
        } finally {
            setIsScanning(false);
            // Clear the file input
            event.target.value = '';
        }
    };

    return (
        <>
            <div className="sales-container">
                <div className="content-wrapper">
                    <div className={`scan-container ${isScanning ? 'scanning' : ''}`} onClick={handleScanBill}>
                        <div className="camera-icon-container">
                            <FontAwesomeIcon icon={faCamera} className="camera-icon" />
                        </div>
                        <p className="scan-text">{isScanning ? 'Scanning...' : 'Scan Sales Report'}</p>
                        {/* animations removed: no overlay/scan line while scanning */}
                        <input
                            type="file"
                            id="bill-scan-input"
                            accept="image/*"
                            onChange={handleFileSelect}
                            style={{ display: 'none' }}
                            capture="environment"
                        />
                    </div>

                    <div className="sales-report-container">
                        <h2 className="report-title">Today's Sales Report</h2>
                        
                        {error && (
                            <div className={`message-box ${typeof error === 'object' && error.type === 'success' ? 'success-message' : 'error-message'}`}>
                                <p>{typeof error === 'object' && error.type === 'success' ? '✅' : '⚠️'} {typeof error === 'string' ? error : error.message}</p>
                                {typeof error === 'object' && error.type === 'error' && (
                                    <small>Please try scanning again or check your data</small>
                                )}
                            </div>
                        )}

                        <div className="sales-table">
                            <div className="table-header">
                                <div className="header-item">Item</div>
                                <div className="header-quantity">Quantity</div>
                                <div className="header-amount">Amount</div>
                                <div className="header-complementary">Complementary Items</div>
                            </div>

                            {salesData.length === 0 ? (
                                <div className="empty-state">
                                    <div className="empty-icon">📋</div>
                                    <div className="empty-title">No sales data yet</div>
                                    <div className="empty-subtitle">
                                        {isScanning ? 'Processing your image...' : 'Scan a sales report to get started'}
                                    </div>
                                </div>
                            ) : (
                                salesData.map((item, index) => (
                                    <div className="table-row" key={index}>
                                        <div className="row-item">{item.item}</div>
                                        <div className="row-quantity">{item.quantity}</div>
                                        <div className="row-amount">{item.amount}</div>
                                        <div className="row-complementary">
                                            {(() => {
                                                const parserName = item.apiData?.parserName;
                                                const rc = parserName ? rowComplementary[parserName] : null;
                                                if (!rc) return null;
                                                return (
                                                <div className="complementary-items-grid">
                                                    <div className="complementary-item">
                                                        <span className="complementary-label">Groundnut Chutney:</span>
                                                        <div className="quantity-controls">
                                                            <button 
                                                                className="quantity-btn decrement"
                                                                onClick={() => setRowComplementary(prev => ({
                                                                    ...prev,
                                                                    [parserName]: {
                                                                        ...prev[parserName],
                                                                        groundnut_chutney: Math.max(0, prev[parserName].groundnut_chutney - 1)
                                                                    }
                                                                }))}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="quantity-input"
                                                                min={0}
                                                                step={1}
                                                                value={rc.groundnut_chutney}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value, 10);
                                                                    setRowComplementary(prev => ({
                                                                        ...prev,
                                                                        [parserName]: {
                                                                            ...prev[parserName],
                                                                            groundnut_chutney: Number.isNaN(val) || val < 0 ? 0 : val
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                            <button 
                                                                className="quantity-btn increment"
                                                                onClick={() => setRowComplementary(prev => ({
                                                                    ...prev,
                                                                    [parserName]: {
                                                                        ...prev[parserName],
                                                                        groundnut_chutney: prev[parserName].groundnut_chutney + 1
                                                                    }
                                                                }))}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="complementary-item">
                                                        <span className="complementary-label">Tomato Chutney:</span>
                                                        <div className="quantity-controls">
                                                            <button 
                                                                className="quantity-btn decrement"
                                                                onClick={() => setRowComplementary(prev => ({
                                                                    ...prev,
                                                                    [parserName]: {
                                                                        ...prev[parserName],
                                                                        tomato_chutney: Math.max(0, prev[parserName].tomato_chutney - 1)
                                                                    }
                                                                }))}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="quantity-input"
                                                                min={0}
                                                                step={1}
                                                                value={rc.tomato_chutney}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value, 10);
                                                                    setRowComplementary(prev => ({
                                                                        ...prev,
                                                                        [parserName]: {
                                                                            ...prev[parserName],
                                                                            tomato_chutney: Number.isNaN(val) || val < 0 ? 0 : val
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                            <button 
                                                                className="quantity-btn increment"
                                                                onClick={() => setRowComplementary(prev => ({
                                                                    ...prev,
                                                                    [parserName]: {
                                                                        ...prev[parserName],
                                                                        tomato_chutney: prev[parserName].tomato_chutney + 1
                                                                    }
                                                                }))}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="complementary-item">
                                                        <span className="complementary-label">Karam Podi:</span>
                                                        <div className="quantity-controls">
                                                            <button 
                                                                className="quantity-btn decrement"
                                                                onClick={() => setRowComplementary(prev => ({
                                                                    ...prev,
                                                                    [parserName]: {
                                                                        ...prev[parserName],
                                                                        karam_podi: Math.max(0, prev[parserName].karam_podi - 1)
                                                                    }
                                                                }))}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="quantity-input"
                                                                min={0}
                                                                step={1}
                                                                value={rc.karam_podi}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value, 10);
                                                                    setRowComplementary(prev => ({
                                                                        ...prev,
                                                                        [parserName]: {
                                                                            ...prev[parserName],
                                                                            karam_podi: Number.isNaN(val) || val < 0 ? 0 : val
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                            <button 
                                                                className="quantity-btn increment"
                                                                onClick={() => setRowComplementary(prev => ({
                                                                    ...prev,
                                                                    [parserName]: {
                                                                        ...prev[parserName],
                                                                        karam_podi: prev[parserName].karam_podi + 1
                                                                    }
                                                                }))}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="complementary-item">
                                                        <span className="complementary-label">Sambar:</span>
                                                        <div className="quantity-controls">
                                                            <button 
                                                                className="quantity-btn decrement"
                                                                onClick={() => setRowComplementary(prev => ({
                                                                    ...prev,
                                                                    [parserName]: {
                                                                        ...prev[parserName],
                                                                        sambar: Math.max(0, prev[parserName].sambar - 1)
                                                                    }
                                                                }))}
                                                            >
                                                                -
                                                            </button>
                                                            <input
                                                                type="number"
                                                                className="quantity-input"
                                                                min={0}
                                                                step={1}
                                                                value={rc.sambar}
                                                                onChange={(e) => {
                                                                    const val = parseInt(e.target.value, 10);
                                                                    setRowComplementary(prev => ({
                                                                        ...prev,
                                                                        [parserName]: {
                                                                            ...prev[parserName],
                                                                            sambar: Number.isNaN(val) || val < 0 ? 0 : val
                                                                        }
                                                                    }));
                                                                }}
                                                            />
                                                            <button 
                                                                className="quantity-btn increment"
                                                                onClick={() => setRowComplementary(prev => ({
                                                                    ...prev,
                                                                    [parserName]: {
                                                                        ...prev[parserName],
                                                                        sambar: prev[parserName].sambar + 1
                                                                    }
                                                                }))}
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                ))
                            )}

                        </div>
                        {salesData.length > 0 && (
                            <div className="summary-bar" aria-live="polite">
                                <div className="summary-label">Total</div>
                                <div className="summary-amount">{totalAmount}</div>
                            </div>
                        )}
                    </div>
                </div>
                
                {salesData.length > 0 && (
                    <div className="button-container">
                        <button
                            className={`confirm-button ${isDeducting ? 'loading' : ''}`}
                            onClick={async () => {
                                try {
                                    setIsDeducting(true);
                                    setError(null);

                                    console.log('Processing sales data for API:', salesData);

                                    const parseNumber = (val) => {
                                        if (typeof val === 'number') return val;
                                        const n = Number(String(val ?? '').replace(/[^0-9.\-]/g, ''));
                                        return Number.isFinite(n) ? n : 0;
                                    };

                                    // Filter out items with valid menuItemIds and prepare API data
                                    const items = salesData
                                        .filter(item => {
                                            const hasMenuId = Boolean(item.apiData?.menuItemId);
                                            if (!hasMenuId) {
                                                console.warn('Item skipped - no menu ID:', item.item);
                                            }
                                            return hasMenuId;
                                        })
                                        .map(item => ({
                                            menuItemId: item.apiData.menuItemId,
                                            quantity: parseNumber(item.apiData.quantity),
                                            unitPrice: parseNumber(item.apiData.unitPrice)
                                        }));

                                    console.log('Prepared items for API:', items);

                                    if (items.length === 0) {
                                        const unmatched = salesData
                                            .filter(item => !item.apiData.matched)
                                            .map(item => item.apiData.originalName)
                                            .join(', ');
                                            
                                        throw new Error(
                                            `No valid menu items found. Unmatched items: ${unmatched}. ` +
                                            `Please check if these items exist in the menu.`
                                        );
                                    }

                                    console.log('Sending sale data:', items);

                                    // Call the sales API
                                    const result = await SalesService.createSale({
                                        businessId: 1, // Using the seeded business ID
                                        items,
                                        paymentMethod: 'Cash' // Default to cash, can be made configurable
                                    });

                                    if (result.success) {
                                        
                                        // Create detailed success message
                                        let successMessage = `Successfully processed sale and deducted ingredients for ${items.length} items!\n`;
                                        
                                        // Add inventory update information if available
                                        if (result.data.updatedInventory) {
                                            const lowStockItems = result.data.updatedInventory.filter(
                                                item => item.stock_status === 'Low stock' || item.stock_status === 'Out of stock'
                                            );
                                            
                                            if (lowStockItems.length > 0) {
                                                successMessage += '\nInventory Status Alerts:';
                                                lowStockItems.forEach(item => {
                                                    successMessage += `\n- ${item.item_name}: ${item.stock_status} (${item.current_stock} remaining)`;
                                                });
                                            }
                                        }
                                        
                                        // Show success message
                                        setError({
                                            type: 'success',
                                            message: successMessage
                                        });
                                        
                                        // Log inventory updates
                                        console.log('Sale processed successfully:', result.data);
                                        
                                        // Clear the sales data after successful processing
                                        setTimeout(() => {
                                            setSalesData([]);
                                            setRowComplementary({});
                                            setTotalAmount('₹0');
                                        }, 5000); // Clear after 5 seconds
                                    }
                                } catch (err) {
                                    const backendMsg = err?.response?.data?.message || err?.data?.message;
                                    const message = backendMsg || err?.message || 'Failed to process sale and deduct ingredients';
                                    setError({
                                        type: 'error',
                                        message
                                    });
                                } finally {
                                    setIsDeducting(false);
                                }
                            }}
                            disabled={isDeducting}
                        >
                            {isDeducting ? 'Processing...' : `Confirm & Deduct Ingredients (${salesData.length} items)`}
                        </button>
                    </div>
                )}
            </div>
            
        </>
    );
};

export default TodaysSalesReport;