import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Check, PartyPopper, Search, Plus, Star, Phone, Mail } from 'lucide-react';
import MinimalStockService from '../services/minimalStockService';
import './CreateReorder.css';

const CreateReorder = ({ onNavigateBack, onNavigateToVendor, selectedVendor, onClearSelectedVendor }) => {
    
    // Helper function to normalize category names to match VendorManagement filters
    const normalizeCategoryName = (category) => {
        if (!category) return 'All';
        const normalized = category.toString().toLowerCase();
        const categoryMap = {
            'wholesale': 'Wholesale',
            'dairy': 'Dairy', 
            'meat': 'Meat',
            'seafood': 'Seafood',
            'vegetables': 'Vegetables',
            'fruits': 'Fruits'
        };
        const result = categoryMap[normalized] || 'All';
        console.log('🟡 CreateReorder normalizing category:', category, '->', result);
        return result;
    };

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [items, setItems] = useState([]); // All low stock items for Order Items section
    const [criticalItems, setCriticalItems] = useState([]); // Only A-category items for Critical section
    const [selected, setSelected] = useState({});
    const [creating, setCreating] = useState(false);
    const [vendors, setVendors] = useState([]);
    const [orderNotes, setOrderNotes] = useState('');
    const [requestedDeliveryDate, setRequestedDeliveryDate] = useState('');
    const [successInfo, setSuccessInfo] = useState(null);
    const [showInlineAdd, setShowInlineAdd] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [availableItems, setAvailableItems] = useState([]);
    const [preferredVendors, setPreferredVendors] = useState([]);

    useEffect(() => {
        const load = async () => {
            try {
                setLoading(true);
                
                // Load critical items, vendors, inventory overview, and all items in parallel
                const [itemsRes, vendorsRes, overviewRes, allItemsRes] = await Promise.all([
                    MinimalStockService.getCriticalItems(1),
                    fetch('/api/vendor-management/vendors/1').then(r => r.json()),
                    fetch('/api/stock-in/inventory/overview').then(r => r.json()).catch(() => null),
                    fetch('/api/inventory/items/1').then(r => r.json()).catch(() => null)
                ]);
                
                // fetched items and vendors
                
                if (!itemsRes?.success) throw new Error(itemsRes?.error || 'Failed to load items');
                if (!vendorsRes?.success) throw new Error(vendorsRes?.error || 'Failed to load vendors');
                
                const overviewMap = (overviewRes?.success ? (overviewRes.data || []) : [])
                    .reduce((acc, it) => { acc[it.item_id] = { unit_cost: Number(it.unit_cost || 0), unit: it.unit }; return acc; }, {});
                
                // Map all low stock items and ensure we have all necessary data
                const allLowStockItems = (itemsRes.data || []).map(x => ({
                    ...x,
                    reorder_qty: computeSuggestedQty(x),
                    unit: x.unit || overviewMap[x.item_id]?.unit || '',
                    // Ensure we have proper stock and reorder point values
                    current_stock: Number(x.current_stock || 0),
                    reorder_point: Number(x.reorder_point || 0)
                }))
                // Sort items: newly added items go to the END of the list
                .sort((a, b) => {
                    // First sort by is_newly_added: false (regular items) first, true (newly added) last
                    if (a.is_newly_added !== b.is_newly_added) {
                        return a.is_newly_added ? 1 : -1;
                    }
                    // Then sort alphabetically by name within each group
                    return a.name.localeCompare(b.name);
                });
                
                // Separate items by ABC category
                const criticalAItems = allLowStockItems.filter(item => 
                    item.manual_abc_category === 'A'
                );
                
                // loaded items and categories
                
                setItems(allLowStockItems); // All low stock items for Order Items section
                setCriticalItems(criticalAItems); // Only A-category items for Critical section
                setVendors(vendorsRes.data || []);
                setAvailableItems(allItemsRes?.success ? (allItemsRes.data || []) : []);
                
                // Find preferred vendors (top-rated from Wholesale and Dairy categories)
                const allVendors = vendorsRes.data || [];
                const wholesaleVendors = allVendors.filter(v => v.category === 'Wholesale').sort((a, b) => (Number(b.average_rating || 0)) - (Number(a.average_rating || 0)));
                const dairyVendors = allVendors.filter(v => v.category === 'Dairy').sort((a, b) => (Number(b.average_rating || 0)) - (Number(a.average_rating || 0)));
                
                // Merge with any previously-set preferred vendors
                setPreferredVendors(prev => {
                    const initialVendors = [];
                    
                    // Add wholesale vendor if available and not already in list
                    if (wholesaleVendors[0] && !prev.find(v => (v.category || '').toLowerCase() === 'wholesale')) {
                        initialVendors.push(wholesaleVendors[0]);
                    }
                    
                    // Add dairy vendor if available and not already in list
                    if (dairyVendors[0] && !prev.find(v => (v.category || '').toLowerCase() === 'dairy')) {
                        initialVendors.push(dairyVendors[0]);
                    }
                    
                    // Combine previous vendors with initial vendors
                    const merged = [...prev, ...initialVendors];
                    localStorage.setItem('preferredVendors', JSON.stringify(merged));
                    return merged;
                });
                
                // Preselect all items with a positive suggested qty
                const sel = {};
                allLowStockItems.forEach(x => { if ((x.reorder_qty || 0) > 0) sel[x.item_id] = true; });
                setSelected(sel);
                
                // Set default delivery date (7 days from now)
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 7);
                setRequestedDeliveryDate(defaultDate.toISOString().split('T')[0]);
                
            } catch (e) {
                setError(e.message);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const addVendorDirectly = useCallback((vendor, categoryOverride = null) => {
        console.log('🟢 addVendorDirectly called with vendor:', vendor);
        // normalize category for reliable comparisons
        const raw = (categoryOverride || vendor.category || vendor.vendor_category || '').toString();
        const normalized = raw.trim().toLowerCase();
        console.log('🟢 Category normalized:', raw, '->', normalized);

        setPreferredVendors(prev => {
            console.log('🟢 Previous preferred vendors:', prev);
            
            // Check if category already exists in the array
            const existingIndex = prev.findIndex(v => 
                (v.category || v.vendor_category || '').toLowerCase() === normalized
            );
            
            let newPreferred;
            
            if (existingIndex !== -1) {
                // Category exists - replace the existing vendor
                newPreferred = [...prev];
                newPreferred[existingIndex] = vendor;
                console.log('🟢 Replaced existing vendor in category:', normalized);
            } else {
                // Category doesn't exist - add new vendor to the array
                newPreferred = [...prev, vendor];
                console.log('🟢 Added new vendor for category:', normalized);
            }

            console.log('🟢 New preferred vendors:', newPreferred);
            localStorage.setItem('preferredVendors', JSON.stringify(newPreferred));
            return newPreferred;
        });
    }, []);

    // Backup check for vendor selection from localStorage
    useEffect(() => {
        const checkPendingVendor = () => {
            const pendingVendor = localStorage.getItem('pendingVendorSelection');
            if (pendingVendor) {
                try {
                    const vendor = JSON.parse(pendingVendor);
                    addVendorDirectly(vendor);
                    localStorage.removeItem('pendingVendorSelection');
                } catch (e) {
                    localStorage.removeItem('pendingVendorSelection');
                }
            }
        };
        
        checkPendingVendor();
        const timer = setTimeout(checkPendingVendor, 500);
        return () => clearTimeout(timer);
    }, [addVendorDirectly]); // ensure stable callback is used

    // Handle selected vendor from vendor management
    useEffect(() => {
        console.log('🔵 CreateReorder useEffect triggered - selectedVendor:', selectedVendor);
        // Check URL parameters for vendor selection as backup
        const urlParams = new URLSearchParams(window.location.search);
        const vendorFromUrl = urlParams.get('selectedVendor');
        
        if (vendorFromUrl) {
            try {
                const parsedVendor = JSON.parse(decodeURIComponent(vendorFromUrl));
                console.log('🔵 Vendor from URL:', parsedVendor);
                addVendorDirectly(parsedVendor);
                // Clean up URL
                window.history.replaceState({}, '', window.location.pathname);
            } catch (e) {
                console.error('🔴 Error parsing vendor from URL:', e);
            }
        }
        
        if (selectedVendor) {
            console.log('🔵 Processing selectedVendor:', selectedVendor);
            addVendorDirectly(selectedVendor);
            
            // Clear the selected vendor after adding
            if (onClearSelectedVendor) {
                onClearSelectedVendor();
            }
        }
    }, [selectedVendor, onClearSelectedVendor, addVendorDirectly]); // include stable callback

    const toggle = (id) => setSelected(s => ({ ...s, [id]: !s[id] }));
    const updateQty = (id, qty) => setItems(list => list.map(x => x.item_id === id ? { ...x, reorder_qty: qty } : x));

    const addItemToOrder = (item) => {
        // Check if item is already in the order
        const exists = items.find(x => x.item_id === item.item_id);
        
            if (exists) {
            // Always scroll to existing item instead of adding (both first 7 days and normal mode)
            const itemElement = document.querySelector(`[data-item-id="${item.item_id}"]`);
            if (itemElement) {
                itemElement.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center'
                });
                // Highlight the item briefly
                itemElement.style.backgroundColor = '#e3f2fd';
                setTimeout(() => {
                    itemElement.style.backgroundColor = '';
                }, 2000);
            }
            setShowInlineAdd(false);
            setSearchTerm('');
            return;
        }

        // Add the item to the order list (item doesn't exist in order)
        const newItem = {
            ...item,
            reorder_qty: 1
        };
        setItems(prev => [...prev, newItem]);
        setSelected(prev => ({ ...prev, [item.item_id]: true }));
        setShowInlineAdd(false);
        setSearchTerm('');
    };

    const filteredAvailableItems = useMemo(() => {
    // search debug removed
        
        if (!searchTerm) return [];
        
        // Always show ALL matching items (whether in order or not)
        const filtered = availableItems.filter(item => {
            const nameMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
            // search match check
            return nameMatch;
        });
        
    // filtered results
        
        return filtered
        // Sort search results: newly added items go to the END
        .sort((a, b) => {
            // First sort by is_newly_added: false (regular items) first, true (newly added) last
            if (a.is_newly_added !== b.is_newly_added) {
                return a.is_newly_added ? 1 : -1;
            }
            // Then sort alphabetically by name within each group
            return a.name.localeCompare(b.name);
        })
        .slice(0, 10);
    }, [searchTerm, availableItems, items]);

    const selectedItems = useMemo(() => {
        return items.filter(x => selected[x.item_id] && (x.reorder_qty || 0) > 0);
    }, [items, selected]);

    const handleCreateReorder = async () => {
        if (selectedItems.length === 0) {
            setError('Please select at least one item to reorder');
            return;
        }

        try {
            setCreating(true);
            setError(null);

            // =================== MULTI-VENDOR MESSAGE SHARING ===================
            console.log('\n🚀 MULTI-VENDOR ORDER DISTRIBUTION');
            console.log(`📦 Total items to order: ${selectedItems.length}`);
            console.log(`🏪 Available preferred vendors: ${preferredVendors.length}`);
            
            if (preferredVendors.length === 0) {
                throw new Error('No preferred vendors available. Please add vendors to your preferred list first.');
            }

            // Step 1: Create category mapping for item-to-vendor distribution
            const categoryMapping = {
                // Map inventory categories to vendor categories
                'vegetables': ['vegetables', 'wholesale'],
                'dairy products': ['dairy', 'wholesale'],
                'dairy': ['dairy', 'wholesale'],
                'meat & seafood': ['meat', 'seafood', 'wholesale'],
                'meat & poultry': ['meat', 'wholesale'],
                'meat': ['meat', 'wholesale'],
                'seafood': ['seafood', 'wholesale'],
                'spices & seasonings': ['wholesale'],
                'spices': ['wholesale'],
                'grains & cereals': ['wholesale'],
                'beverages': ['wholesale'],
                'oils': ['wholesale'],
                'oils & fats': ['wholesale'],
                'bakery': ['wholesale'],
                'legumes & flours': ['wholesale'],
                'sweets': ['wholesale'],
                'auto ingredients': ['wholesale'],
                'complimentary items': ['wholesale']
            };

            // Step 2: Analyze vendor assignments and item categories
            console.log('\n� PREFERRED VENDORS ANALYSIS:');
            preferredVendors.forEach((vendor, index) => {
                console.log(`   ${index + 1}. ${vendor.name} → Category: ${vendor.vendor_category || 'No category'}`);
            });

            console.log('\n📦 ITEM CATEGORY ANALYSIS:');
            selectedItems.forEach((item, index) => {
                console.log(`   ${index + 1}. ${item.name} → Category: ${item.category || 'No category'}`);
            });

            // Step 3: Create vendor assignments based on categories
            const vendorAssignments = {};
            const unassignedItems = [];

            console.log('\n🔄 CATEGORY MATCHING PROCESS:');
            
            selectedItems.forEach(item => {
                const itemCategory = (item.category || '').toLowerCase();
                console.log(`\n   📦 Processing: ${item.name} (${itemCategory})`);
                
                // Find which vendor categories can handle this item
                const acceptableVendorCategories = categoryMapping[itemCategory] || ['wholesale'];
                console.log(`      Acceptable vendor categories: ${acceptableVendorCategories.join(', ')}`);
                
                // Find preferred vendors that match these categories
                const matchingVendors = preferredVendors.filter(vendor => {
                    const vendorCategory = (vendor.vendor_category || '').toLowerCase();
                    return acceptableVendorCategories.includes(vendorCategory);
                });
                
                if (matchingVendors.length > 0) {
                    // Use the first matching vendor (or implement priority logic)
                    const selectedVendor = matchingVendors[0];
                    console.log(`      ✅ Assigned to: ${selectedVendor.name} (${selectedVendor.vendor_category})`);
                    
                    if (!vendorAssignments[selectedVendor.vendor_id]) {
                        vendorAssignments[selectedVendor.vendor_id] = {
                            vendor: selectedVendor,
                            items: [],
                            category: selectedVendor.vendor_category || 'wholesale'
                        };
                    }
                    vendorAssignments[selectedVendor.vendor_id].items.push(item);
                } else {
                    console.log(`      ⚠️ No matching vendor found, will assign to wholesale fallback`);
                    unassignedItems.push(item);
                }
            });

            // Step 4: Handle unassigned items (assign to wholesale vendor or first vendor)
            if (unassignedItems.length > 0) {
                console.log(`\n⚠️ HANDLING ${unassignedItems.length} UNASSIGNED ITEMS:`);
                
                // Try to find a wholesale vendor first
                const wholesaleVendor = preferredVendors.find(v => 
                    (v.vendor_category || '').toLowerCase() === 'wholesale'
                );
                
                if (wholesaleVendor) {
                    console.log(`   ✅ Assigning to wholesale vendor: ${wholesaleVendor.name}`);
                    if (!vendorAssignments[wholesaleVendor.vendor_id]) {
                        vendorAssignments[wholesaleVendor.vendor_id] = {
                            vendor: wholesaleVendor,
                            items: [],
                            category: 'wholesale'
                        };
                    }
                    vendorAssignments[wholesaleVendor.vendor_id].items.push(...unassignedItems);
                } else {
                    // No wholesale vendor, assign to first preferred vendor
                    const fallbackVendor = preferredVendors[0];
                    console.log(`   ⚠️ No wholesale vendor, using fallback: ${fallbackVendor.name}`);
                    if (!vendorAssignments[fallbackVendor.vendor_id]) {
                        vendorAssignments[fallbackVendor.vendor_id] = {
                            vendor: fallbackVendor,
                            items: [],
                            category: 'fallback'
                        };
                    }
                    vendorAssignments[fallbackVendor.vendor_id].items.push(...unassignedItems);
                }
            }

            // Step 5: Create orders for each vendor assignment
            console.log('\n📋 FINAL VENDOR ASSIGNMENTS:');
            const assignmentEntries = Object.entries(vendorAssignments);
            console.log(`   Total vendors receiving orders: ${assignmentEntries.length}`);
            
            assignmentEntries.forEach(([vendorId, assignment], index) => {
                console.log(`   ${index + 1}. ${assignment.vendor.name} (${assignment.category}): ${assignment.items.length} items`);
                console.log(`      Items: ${assignment.items.map(item => item.name).join(', ')}`);
            });

            console.log('\n📤 CREATING CATEGORY-BASED ORDERS...');
            const orderResults = [];
            let totalOrderCount = 0;

            // Create and send orders to each assigned vendor
            for (let i = 0; i < assignmentEntries.length; i++) {
                const [vendorId, assignment] = assignmentEntries[i];
                const { vendor, items, category } = assignment;
                
                console.log(`\n🔄 ${i + 1}/${assignmentEntries.length} - Creating order for: ${vendor.name} (${category})`);
                console.log(`   Items (${items.length}): ${items.map(item => item.name).join(', ')}`);

                const orderData = {
                    businessId: 1,
                    vendorId: parseInt(vendorId),
                    selectedItems: items.map(item => ({
                        itemId: item.item_id,
                        orderQuantity: item.reorder_qty,
                        notes: `Category-based reorder: ${item.category}. Current: ${item.current_stock || 'N/A'}, ROP: ${item.reorder_point || 'N/A'}`
                    })),
                    orderNotes: `${orderNotes || ''}\n\nCategory-based assignment: ${category.toUpperCase()} items (${items.map(i => i.name).join(', ')})`.trim(),
                    requestedDeliveryDate,
                    createdBy: 1
                };

                try {
                    const response = await fetch('/api/reorder/create-purchase-order', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(orderData)
                    });

                    const result = await response.json();

                    if (result.success) {
                        orderResults.push({
                            vendor: vendor.name,
                            vendorId: vendor.vendor_id,
                            poNumber: result.purchaseOrder.poNumber,
                            itemCount: items.length,
                            category: category,
                            items: items.map(i => i.name),
                            whatsappStatus: result.purchaseOrder.whatsappStatus
                        });

                        totalOrderCount++;
                        console.log(`   ✅ Order created: PO ${result.purchaseOrder.poNumber}`);
                        console.log(`   📱 WhatsApp: ${result.purchaseOrder.whatsappStatus?.success ? 'Sent' : 'Failed'}`);
                    } else {
                        console.log(`   ❌ Failed to create order: ${result.error}`);
                    }
                } catch (error) {
                    console.log(`   ❌ Error creating order: ${error.message}`);
                }
            }

            if (orderResults.length === 0) {
                throw new Error('Failed to create orders for any preferred vendors');
            }

            // Success! Show comprehensive success modal with category breakdown
            console.log(`\n🎉 CATEGORY-BASED ORDERS COMPLETE!`);
            console.log(`   ✅ ${orderResults.length} vendors received category-specific orders`);
            console.log(`   � ${selectedItems.length} items distributed based on categories`);
            
            orderResults.forEach((result, index) => {
                console.log(`   ${index + 1}. ${result.vendor} (${result.category}): ${result.itemCount} items - PO: ${result.poNumber}`);
                console.log(`      Items: ${result.items.join(', ')}`);
                console.log(`      WhatsApp: ${result.whatsappStatus?.success ? '✅' : '❌'}`);
            });

            setSuccessInfo({
                poNumber: orderResults.map(r => r.poNumber).join(', '),
                totalAmount: 'Category-Based Orders',
                itemCount: selectedItems.length,
                orderCount: totalOrderCount,
                vendorBreakdown: orderResults,
                whatsappStatus: { 
                    success: orderResults.every(r => r.whatsappStatus?.success),
                    message: `${orderResults.filter(r => r.whatsappStatus?.success).length}/${orderResults.length} vendors notified`
                }
            });
            
            console.log('🎉 All category-based purchase orders created successfully!');
            setCreating(false);

        } catch (e) {
            console.error('Error creating reorder:', e);
            setError(e.message);
            setCreating(false);
        }
    };

    const preview = useMemo(() => {
        const chosen = items.filter(x => selected[x.item_id] && (x.reorder_qty || 0) > 0);
        if (chosen.length === 0) return 'No items selected.';
        
        const lines = chosen.map(x => `- ${x.name}: ${Number(x.reorder_qty).toFixed(2)} ${x.unit || ''}`);
        
        return [
            'Purchase Order Request - Multi-Vendor Distribution',
            `Date: ${new Date().toLocaleDateString()}`,
            `Vendors: ${preferredVendors.length} preferred vendors (all will receive the same order)`,
            `Delivery Date: ${requestedDeliveryDate || 'Not specified'}`,
            '',
            'Items to Order (sent to ALL preferred vendors):',
            ...lines,
            '',
            `Notes: ${orderNotes || 'None'}`,
            '____________________________________________________'
        ].join('\n');
    }, [items, selected, preferredVendors, requestedDeliveryDate, orderNotes]);

    return (
        <div className="cr-page-container" style={{ paddingBottom: '100px' }}>
            {/* Success Modal */}
            {successInfo && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        width: 'min(400px, 90vw)', background: '#fff', borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '24px',
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
                                <Check size={36} color="#22c55e" strokeWidth={3} />
                            </div>
                        </div>
                        
                        {/* Success Message */}
                        <div style={{ 
                            fontSize: '18px', 
                            fontWeight: '600', 
                            marginBottom: '16px',
                            color: '#1f2937'
                        }}>
                            {successInfo.orderCount > 1 
                                ? `${successInfo.orderCount} Purchase Orders Created Successfully`
                                : 'Purchase Order Created Successfully'
                            }
                        </div>
                        
                        {/* Order Details */}
                        <div style={{ 
                            color: '#4b5563', 
                            lineHeight: '1.6', 
                            fontSize: '14px', 
                            marginBottom: '20px' 
                        }}>
                            <div style={{ marginBottom: '8px' }}>
                                <strong>Total Items:</strong> {successInfo.itemCount}
                                {successInfo.orderCount > 1 && (
                                    <span style={{ marginLeft: '8px', color: '#6b7280' }}>
                                        across {successInfo.orderCount} vendors
                                    </span>
                                )}
                            </div>

                            {/* Vendor Breakdown for Multiple Orders */}
                            {successInfo.vendorBreakdown && successInfo.vendorBreakdown.length > 1 && (
                                <div style={{ 
                                    marginTop: '12px', 
                                    padding: '10px',
                                    backgroundColor: '#f9fafb',
                                    borderRadius: '6px',
                                    border: '1px solid #e5e7eb'
                                }}>
                                    <div style={{ 
                                        fontSize: '12px',
                                        fontWeight: '600',
                                        marginBottom: '8px',
                                        color: '#374151'
                                    }}>
                                        📋 Order Breakdown:
                                    </div>
                                    {successInfo.vendorBreakdown.map((order, index) => (
                                        <div key={index} style={{ 
                                            fontSize: '11px',
                                            marginBottom: '4px',
                                            color: '#6b7280'
                                        }}>
                                            • <strong>{order.vendor}</strong> ({order.category}): {order.itemCount} items - {order.poNumber}
                                        </div>
                                    ))}
                                </div>
                            )}
                            
                            {/* WhatsApp Status */}
                            {successInfo.whatsappStatus && (
                                <div style={{ 
                                    marginTop: '12px', 
                                    padding: '8px', 
                                    borderRadius: '6px',
                                    backgroundColor: successInfo.whatsappStatus.success ? '#f0f9f0' : '#fef2f2',
                                    border: `1px solid ${successInfo.whatsappStatus.success ? '#22c55e' : '#ef4444'}`
                                }}>
                                    <div style={{ 
                                        color: successInfo.whatsappStatus.success ? '#166534' : '#dc2626',
                                        fontSize: '12px',
                                        fontWeight: '600'
                                    }}>
                                        📱 WhatsApp Status:
                                    </div>
                                    <div style={{ 
                                        color: successInfo.whatsappStatus.success ? '#166534' : '#dc2626',
                                        fontSize: '11px',
                                        marginTop: '2px'
                                    }}>
                                        {successInfo.whatsappStatus.success 
                                            ? (successInfo.orderCount > 1 
                                                ? `✅ ${successInfo.whatsappStatus.message}` 
                                                : `✅ PDF sent to vendor successfully!`
                                              )
                                            : `❌ ${successInfo.whatsappStatus.error || successInfo.whatsappStatus.message || 'Failed to send PDF'}`
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {/* OK Button */}
                        <button
                            onClick={() => {
                                // Reset form when user clicks OK
                                setSelected({});
                                setOrderNotes('');
                                // Close popup
                                setSuccessInfo(null);
                            }}
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

            {/* Header */}
            <div className="cr-header">
                <button className="cr-back-btn" onClick={onNavigateBack}>←</button>
                <h1>Create Reorder</h1>
            </div>

            {loading && <div>Loading suggestions…</div>}
            {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

            {!loading && !error && (
                <>
                    {/* Critical Low Stock Items */}
                    <div className="cr-section">
                        <h2 className="cr-section-title">Critical Low Stock Items</h2>
                        <div className="cr-low-stock-card">
                            {criticalItems.map(item => (
                                <div 
                                    key={item.item_id} 
                                    className="cr-low-stock-item cr-critical-bg"
                                >
                                    <div className="cr-item-name-wrapper">
                                        <div className="cr-dot cr-critical-dot"></div>
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                                            <p>{item.name}</p>
                                            {item.is_newly_added && (
                                                <span className="cr-newly-added-badge">
                                                    Newly Added Item
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <span className="cr-item-quantity cr-critical-text">
                                        {Number(item.current_stock).toFixed(1)} {item.unit}
                                    </span>
                                </div>
                            ))}
                            {criticalItems.length === 0 && (
                                <div style={{ padding: 16, textAlign: 'center', color: 'var(--secondary-text)' }}>
                                    No critical A-category items found
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preferred Vendors */}
                    <div className="cr-section">
                        <h2 className="cr-section-title">Preferred Vendors</h2>
                        <div className="cr-preferred-vendors-container">
                            {/* Dynamic Vendor Rendering */}
                            {preferredVendors.map((vendor, index) => (
                                <div key={`${vendor.vendor_id}-${vendor.category}-${index}`} className="cr-vendor-card">
                                    <div className="cr-vendor-info">
                                        <h3>{vendor.name}</h3>
                                        <div style={{ 
                                            fontSize: '12px', 
                                            color: 'var(--secondary-text)', 
                                            marginBottom: '8px',
                                            fontWeight: '500',
                                            textAlign: 'left'
                                        }}>
                                            {vendor.vendor_category || vendor.category || 'Other'}
                                        </div>
                                        <div className="cr-vendor-rating">
                                            {[...Array(5)].map((_, i) => (
                                                <Star 
                                                    key={i} 
                                                    size={14} 
                                                    fill={i < Math.floor(Number(vendor.average_rating || 0)) ? "#ffc107" : "none"}
                                                    color="#ffc107"
                                                />
                                            ))}
                                            <span>({Number(vendor.average_rating || 0).toFixed(1)} {vendor.total_purchase_orders || '0'} orders)</span>
                                        </div>
                                        {vendor.contact_phone && (
                                            <div className="cr-vendor-contact">
                                                <Phone size={16} />
                                                <span>{vendor.contact_phone}</span>
                                            </div>
                                        )}
                                        {vendor.contact_email && (
                                            <div className="cr-vendor-contact">
                                                <Mail size={16} />
                                                <span>{vendor.contact_email}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ position: 'relative' }} className="cr-vendor-dropdown-container">
                                        <button 
                                            className="cr-change-btn"
                                            onClick={() => {
                                                console.log('🟡 Vendor object:', vendor);
                                                onNavigateToVendor(normalizeCategoryName(vendor.vendor_category || vendor.category));
                                            }}
                                            style={{ 
                                                minWidth: '70px',
                                                textAlign: 'center',
                                                fontSize: '14px',
                                                fontWeight: '600',
                                                position: 'relative'
                                            }}
                                        >
                                            Change
                                        </button>
                                    </div>
                                </div>
                            ))}

                            {/* No vendors fallback - only show if no vendors */}
                            {preferredVendors.length === 0 && (
                                <div style={{ 
                                    padding: '20px', 
                                    textAlign: 'center', 
                                    color: 'var(--secondary-text)',
                                    width: '100%'
                                }}>
                                    <p>No preferred vendors available</p>
                                    <button 
                                        className="cr-change-btn"
                                        onClick={() => {
                                            onNavigateToVendor();
                                        }}
                                        style={{ marginTop: '12px' }}
                                    >
                                        Browse All Vendors
                                    </button>
                                </div>
                            )}
                        </div>
                        
                        {/* Add Vendors Button */}
                        <button 
                            className="cr-add-more-btn"
                            onClick={() => onNavigateToVendor()}
                        >
                            <Plus size={20} />
                            Add Vendors
                        </button>
                    </div>

                    {/* Order Items */}
                    <div className="cr-section">
                        <h2 className="cr-section-title">Order Items</h2>
                        <div className="cr-order-list-container">
                            {items.map(item => (
                                <div key={item.item_id} className="cr-order-item-card" data-item-id={item.item_id}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px' }}>
                                            <p className="cr-item-name">{item.name}</p>
                                            {item.is_newly_added && (
                                                <span className="cr-newly-added-badge">
                                                    Newly Added Item
                                                </span>
                                            )}
                                        </div>
                                        <p className="cr-item-stock">
                                            Current stock: {Number(item.current_stock).toFixed(1)} {item.unit}
                                        </p>
                                    </div>
                                    <div className="cr-quantity-selector">
                                        <button 
                                            onClick={() => {
                                                const newQty = Math.max(0, (item.reorder_qty || 0) - 1);
                                                updateQty(item.item_id, newQty);
                                                if (newQty === 0) {
                                                    setSelected(prev => ({ ...prev, [item.item_id]: false }));
                                                } else {
                                                    setSelected(prev => ({ ...prev, [item.item_id]: true }));
                                                }
                                            }}
                                        >
                                            −
                                        </button>
                                        <input
                                            type="number"
                                            step="0.01"
                                            value={item.reorder_qty ?? 0}
                                            onChange={(e) => {
                                                const newQty = Math.max(0, parseFloat(e.target.value || '0'));
                                                updateQty(item.item_id, newQty);
                                                if (newQty === 0) {
                                                    setSelected(prev => ({ ...prev, [item.item_id]: false }));
                                                } else {
                                                    setSelected(prev => ({ ...prev, [item.item_id]: true }));
                                                }
                                            }}
                                        />
                                        <button 
                                            onClick={() => {
                                                const newQty = (item.reorder_qty || 0) + 1;
                                                updateQty(item.item_id, newQty);
                                                setSelected(prev => ({ ...prev, [item.item_id]: true }));
                                            }}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Search Bar and Results - appears above button when expanded */}
                        {showInlineAdd && (
                            <div className="cr-inline-add-container">
                                <div className="cr-inline-add-header">
                                    <div className="cr-inline-add-search-wrapper">
                                        <Search size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search ingredient"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>
                                    <button 
                                        className="cr-inline-add-close-btn"
                                        onClick={() => {
                                            setShowInlineAdd(false);
                                            setSearchTerm('');
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>

                                {/* Search Results */}
                                {searchTerm ? (
                                    <div className="cr-inline-add-list">
                                        {filteredAvailableItems.length > 0 ? (
                                            filteredAvailableItems.map(item => {
                                                const isInOrder = items.find(x => x.item_id === item.item_id);
                                                
                                                return (
                                                    <div
                                                        key={item.item_id}
                                                        className="cr-inline-add-item"
                                                        onClick={() => addItemToOrder(item)}
                                                    >
                                                        <span>
                                                            {item.name}
                                                            {isInOrder && (
                                                                <small style={{ color: '#ff9800', marginLeft: '8px' }}>
                                                                    (In order)
                                                                </small>
                                                            )}
                                                        </span>
                                                        <button className="cr-inline-add-plus-btn">
                                                            +
                                                        </button>
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <div className="cr-inline-add-no-items">No ingredients found</div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="cr-inline-add-no-items">Start typing to search ingredients</div>
                                )}
                            </div>
                        )}

                        {/* Add More Items Button */}
                        <button 
                            className="cr-add-more-btn"
                            onClick={() => setShowInlineAdd(!showInlineAdd)}
                        >
                            <Plus size={16} />
                            Add More Items
                        </button>
                    </div>

                    {/* Order Summary */}
                    {selectedItems.length > 0 && (
                        <div className="cr-section">
                            <h2 className="cr-section-title">Order Summary</h2>
                            <div className="cr-summary-card">
                                <div className="cr-summary-item">
                                    <span>Items Selected</span>
                                    <span>{selectedItems.length}</span>
                                </div>
                                <div className="cr-summary-item">
                                    <span>Preferred Vendors</span>
                                    <span>{preferredVendors.length}</span>
                                </div>
                                <div className="cr-summary-item">
                                    <span>Delivery Date</span>
                                    <span>{requestedDeliveryDate || 'Not set'}</span>
                                </div>
                                {/* Category Assignment Preview */}
                                <div style={{ 
                                    marginTop: '12px', 
                                    padding: '10px',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '6px',
                                    fontSize: '12px'
                                }}>
                                    <div style={{ fontWeight: '600', marginBottom: '6px', color: '#1f2937' }}>
                                        📦 Category-Based Assignment:
                                    </div>
                                    <div style={{ color: '#6b7280', lineHeight: '1.4' }}>
                                        Items will be automatically assigned to vendors based on their categories
                                        (vegetables → vegetable vendor, meat → meat vendor, etc.)
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Additional Order Details */}
                    <div className="cr-section">
                        <h2 className="cr-section-title">Order Details</h2>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'var(--secondary-text)', marginBottom: 4 }}>
                                    Requested Delivery Date
                                </label>
                                <input 
                                    type="date" 
                                    value={requestedDeliveryDate}
                                    onChange={(e) => setRequestedDeliveryDate(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: 8,
                                        fontSize: 14
                                    }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: 12, color: 'var(--secondary-text)', marginBottom: 4 }}>
                                    Order Notes
                                </label>
                                <textarea 
                                    value={orderNotes}
                                    onChange={(e) => setOrderNotes(e.target.value)}
                                    placeholder="Add any special instructions..."
                                    rows="3"
                                    style={{ 
                                        width: '100%', 
                                        padding: '12px', 
                                        border: '1px solid var(--border-color)', 
                                        borderRadius: 8,
                                        fontSize: 14,
                                        resize: 'vertical'
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="cr-actions">
                        <button 
                            className="cr-draft-btn"
                            onClick={onNavigateBack}
                        >
                            Save Draft
                        </button>
                        <button 
                            className="cr-review-btn"
                            onClick={handleCreateReorder}
                            disabled={creating || preferredVendors.length === 0 || selectedItems.length === 0}
                            style={{ 
                                opacity: creating || preferredVendors.length === 0 || selectedItems.length === 0 ? 0.6 : 1,
                                cursor: creating || preferredVendors.length === 0 || selectedItems.length === 0 ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {creating ? 'Creating Orders...' : 'Review & Send'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
};

function computeSuggestedQty(x) {
    const current = toNum(x.current_stock);
    const rop = toNum(x.reorder_point);
    const safety = toNum(x.safety_stock);
    const deficit = Math.max(0, rop - current);
    const suggested = deficit + safety;
    return round2(suggested);
}

const toNum = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
};

const round2 = (v) => Math.round((v + Number.EPSILON) * 100) / 100;

export default CreateReorder;
