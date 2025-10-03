import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { FiPlus, FiMinus, FiX, FiUser, FiCamera } from 'react-icons/fi';
import { faCheck } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './StockOutForm-module.css';
import { uploadWastagePhotos } from '../services/wastageService';
import { http, API_BASE_URL } from '../services/apiClient';
import RecipesService from '../services/recipesService';
import Usage from './Usage';
import { StandardSearch, StandardScrollStyles, smartSearch, highlightMatch, defaultTextSizes, standardScrollStyles } from '../styles/standardStyles';
import Counter from './Counter';

// Using centralized API_BASE_URL for display only; requests go through http
// Regular Modal for selection lists
const Modal = ({ children, onClose }) => (
    <div className="stock-out-modal-overlay" onClick={onClose}>
        <div className="stock-out-modal-content" onClick={e => e.stopPropagation()}>
            {children}
        </div>
    </div>
);

// Success Modal with animation
const SuccessModal = ({ show, message, onClose }) => {
    if (!show) return null;

    return (
        <div className="stock-out-modal-overlay" onClick={onClose}>
            <div className="stock-out-success-modal-box" onClick={e => e.stopPropagation()}>
                <FontAwesomeIcon icon={faCheck} className="checkmark green" />
                <p>{message}</p>
                <button onClick={onClose} className="ok-btn">OK</button>
            </div>
        </div>
    );
};

// Image component with multiple fallback handling
const ImageWithFallback = ({ src, alt, fallback, placeholder, ...props }) => {
    const [imgSrc, setImgSrc] = useState(src);
    const [errorCount, setErrorCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const handleError = (e) => {
        console.log(`🚫 Image error for ${alt}:`, {
            currentSrc: imgSrc,
            errorCount,
            naturalWidth: e.target.naturalWidth,
            naturalHeight: e.target.naturalHeight
        });

        if (errorCount === 0 && fallback && fallback !== imgSrc) {
            console.log(`🔄 Trying fallback for ${alt}: ${fallback}`);
            setImgSrc(fallback);
            setErrorCount(1);
        } else if (errorCount === 1 && placeholder && placeholder !== imgSrc) {
            console.log(`🔄 Trying placeholder for ${alt}: ${placeholder}`);
            setImgSrc(placeholder);
            setErrorCount(2);
        } else {
            console.log(`❌ All fallbacks failed for ${alt}, creating canvas placeholder`);
            // Create a simple colored placeholder if all else fails
            const canvas = document.createElement('canvas');
            canvas.width = 300;
            canvas.height = 200;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#ff6b35';
            ctx.fillRect(0, 0, 300, 200);
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const text = alt.length > 12 ? alt.substring(0, 10) + '..' : alt;
            ctx.fillText(text, 150, 100);
            setImgSrc(canvas.toDataURL());
            setErrorCount(3);
        }
        setIsLoading(false);
    };

    const handleLoad = (e) => {
        setIsLoading(false);
        console.log(`✅ Image loaded successfully for ${alt}:`, {
            src: imgSrc,
            naturalWidth: e.target.naturalWidth,
            naturalHeight: e.target.naturalHeight
        });
    };

    useEffect(() => {
        console.log(`🔄 ImageWithFallback useEffect for ${alt}:`, { src, fallback, placeholder });
        setImgSrc(src);
        setErrorCount(0);
        setIsLoading(true);
    }, [src, alt]);

    return (
        <img
            src={imgSrc}
            alt={alt}
            onError={handleError}
            onLoad={handleLoad}
            {...props}
            style={{
                ...props.style,
                backgroundColor: isLoading ? '#f8f9fa' : 'transparent',
                opacity: isLoading ? 0.7 : 1,
                transition: 'opacity 0.3s ease'
            }}
        />
    );
};

const StockOutForm = () => {
    // State for UI
    const [activeSubTab, setActiveSubTab] = useState('Waste');
    const [searchTerm, setSearchTerm] = useState('');
    const searchInputRef = useRef(null);
    const [activeCategory, setActiveCategory] = useState('All');
    const [wastedItems, setWastedItems] = useState({});
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState([]);
    const fileInputRef = useRef(null);

    // State for API data
    const [menuItems, setMenuItems] = useState([]);
    const [menuItemsWithRecipeCost, setMenuItemsWithRecipeCost] = useState([]);
    const [wasteReasons, setWasteReasons] = useState([]);
    const [staffMembers, setStaffMembers] = useState([]);
    const [categories, setCategories] = useState(['All']);
    const [rawItems, setRawItems] = useState([]);
    const [inventoryOverview, setInventoryOverview] = useState([]);

    // State for selections
    const [wasteReason, setWasteReason] = useState(null);
    const [recordedBy, setRecordedBy] = useState(null);

    // State for modals
    const [isReasonModalOpen, setReasonModalOpen] = useState(false);
    const [isStaffModalOpen, setStaffModalOpen] = useState(false);
    const [isConfirmModalOpen, setConfirmModalOpen] = useState(false);

    // State for loading and errors
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    // Removed manual refresh state (auto background refresh every 10s now)

    // Calculate manufacturing cost from recipe ingredients with real-time pricing
    const calculateRecipeCost = useCallback(async (menuItem, useLatestInventory = true) => {
        try {
            console.log(`🔍 Calculating real-time recipe cost for ${menuItem.name} (ID: ${menuItem.id})`);

            // Get recipe ingredients for this menu item
            const ingredients = await RecipesService.getRecipeIngredients(menuItem.id);
            console.log(`📦 Found ${ingredients?.length || 0} ingredients for ${menuItem.name}:`, ingredients);

            if (!ingredients || ingredients.length === 0) {
                console.warn(`⚠️ No ingredients found for ${menuItem.name}, using original price`);
                return parseFloat(menuItem.price) || 0;
            }

            // If requesting latest inventory, refresh inventory data for accurate costs
            let currentInventory = inventoryOverview;
            if (useLatestInventory) {
                try {
                    const latestResult = await http.get('/stock-in/inventory/overview?business_id=1&includeComplimentary=true&hideExpired=false&hideZeroStock=false&excludeUncategorized=false&sources=all&realTime=true');
                    if (latestResult.success && latestResult.data) {
                        currentInventory = latestResult.data;
                        console.log('✅ Using latest real-time inventory costs');
                    }
                } catch (error) {
                    // Ignore AbortErrors for inventory refresh calls
                    if (error.name === 'AbortError' || error.aborted) {
                        console.log('Inventory refresh request aborted - using cached data');
                    } else {
                        console.warn('⚠️ Could not fetch latest inventory, using cached data:', error);
                    }
                }
            }

            // Helpers for unit conversion
            const normalizeUnit = (u) => {
                const s = String(u || '').trim().toLowerCase();
                if (!s) return 'count';
                if (['kg', 'kilogram', 'kilograms'].includes(s)) return 'kg';
                if (['g', 'gram', 'grams'].includes(s)) return 'g';
                if (['l', 'liter', 'litre', 'liters', 'litres'].includes(s)) return 'l';
                if (['ml', 'milliliter', 'millilitre', 'milliliters', 'millilitres'].includes(s)) return 'ml';
                if (['pc', 'pcs', 'piece', 'pieces', 'unit', 'units'].includes(s)) return 'count';
                if (['plate', 'plates', 'serving', 'servings'].includes(s)) return 'count';
                return s; // fallback
            };
            const conversionFactor = (fromU, toU) => {
                const from = normalizeUnit(fromU);
                const to = normalizeUnit(toU);
                if (from === to) return 1;
                // weight
                if (from === 'g' && to === 'kg') return 1 / 1000;
                if (from === 'kg' && to === 'g') return 1000;
                // volume
                if (from === 'ml' && to === 'l') return 1 / 1000;
                if (from === 'l' && to === 'ml') return 1000;
                // otherwise unknown mapping -> assume same
                return 1;
            };

            let totalCost = 0;

            // Calculate cost based on ingredients and their current unit costs
            for (const ingredient of ingredients) {
                const ingredientName = ingredient.ingredient_name || ingredient.item_name || ingredient.name;

                console.log(`🔍 Processing ingredient: "${ingredientName}"`, {
                    ingredient_name: ingredient.ingredient_name,
                    item_name: ingredient.item_name,
                    name: ingredient.name,
                    quantity_per_plate: ingredient.quantity,
                    unit: ingredient.unit
                });

                // Try multiple matching strategies (case-insensitive)
                let inventoryItem = null;

                // 1. Try exact name match (case-insensitive)
                inventoryItem = currentInventory.find(item =>
                    item.name && item.name.toLowerCase() === ingredientName?.toLowerCase()
                );

                // 2. Try fuzzy name matching if exact match fails
                if (!inventoryItem && ingredientName) {
                    const searchName = ingredientName.toLowerCase();
                    inventoryItem = currentInventory.find(item => {
                        if (!item.name) return false;
                        const itemName = item.name.toLowerCase();
                        return itemName.includes(searchName) || searchName.includes(itemName);
                    });
                }

                console.log(`🎯 Ingredient "${ingredientName}" matched to:`,
                    inventoryItem ? { name: inventoryItem.name, unit_cost: inventoryItem.unit_cost, unit: inventoryItem.unit } : 'No match found'
                );

                console.log(`🎯 Ingredient "${ingredientName}" matched to:`,
                    inventoryItem ? { 
                        name: inventoryItem.name, 
                        unit_cost: inventoryItem.unit_cost, 
                        unit: inventoryItem.unit,
                        updated_at: inventoryItem.updated_at 
                    } : 'No match found'
                );

                const qtyField = ingredient.quantity_per_plate ?? ingredient.quantity; // support both
                if (inventoryItem && qtyField) {
                    const unitCost = parseFloat(inventoryItem.unit_cost || 0);
                    const quantityNeeded = parseFloat(qtyField || 0);
                    // Convert recipe unit to inventory unit before multiplying cost
                    const factor = conversionFactor(ingredient.unit, inventoryItem.unit);
                    const quantityInInventoryUnits = quantityNeeded * factor;
                    const ingredientCost = unitCost * quantityInInventoryUnits;
                    totalCost += ingredientCost;

                    console.log(`💰 ${ingredientName}: ${quantityNeeded} ${ingredient.unit || ''} -> ${quantityInInventoryUnits} ${inventoryItem.unit || ''} × ₹${unitCost} = ₹${ingredientCost.toFixed(2)} (Real-time)`);
                } else {
                    console.warn(`❌ Missing data for ingredient "${ingredientName}":`, {
                        hasInventoryItem: !!inventoryItem,
                        inventoryUnitCost: inventoryItem?.unit_cost,
                        hasQuantity: !!qtyField,
                        quantityValue: qtyField
                    });
                }
            }

            console.log(`✅ Total real-time recipe cost for ${menuItem.name}: ₹${totalCost}`);
            return totalCost > 0 ? totalCost : parseFloat(menuItem.price) || 0;
        } catch (error) {
            // Ignore AbortErrors to prevent noise in console
            if (error.name === 'AbortError' || error.aborted) {
                console.log(`Recipe cost calculation aborted for ${menuItem.name} - component unmounted or request cancelled`);
                return parseFloat(menuItem.price) || 0;
            }
            console.error(`❌ Error calculating real-time recipe cost for ${menuItem.name}:`, error);
            // Fallback to original price if recipe calculation fails
            return parseFloat(menuItem.price) || 0;
        }
    }, [inventoryOverview]);

    // Load inventory overview data with real-time costs
    const loadInventoryOverview = useCallback(async (forceRefresh = false) => {
        try {
            console.log('🔍 Loading inventory overview with real-time costs...');
            // Include ALL items: complimentary, expired, zero stock, uncategorized, and all sources
            const result = await http.get('/stock-in/inventory/overview?business_id=1&includeComplimentary=true&hideExpired=false&hideZeroStock=false&excludeUncategorized=false&sources=all&realTime=true', {
                timeoutMs: 90000 // 90 second timeout for inventory data
            });
            if (result.success && result.data) {
                console.log(`📦 Loaded ${result.data.length} inventory items with real-time costs:`);
                console.log('📋 Real-time inventory costs:', result.data.map(item => ({ 
                    name: item.name, 
                    unit_cost: item.unit_cost,
                    updated_at: item.updated_at 
                })));
                setInventoryOverview(result.data);
                
                // If this is a forced refresh, also refresh menu item costs
                if (forceRefresh && menuItems.length > 0) {
                    console.log('🔄 Force refreshing menu item costs...');
                    await loadMenuItemsWithRecipeCosts(true);
                }
            } else {
                console.warn('❌ Failed to load inventory overview:', result);
            }
        } catch (error) {
            // Ignore AbortErrors to prevent noise in console
            if (error.name === 'AbortError' || error.aborted) {
                console.log('Inventory overview request aborted - component unmounted or request cancelled');
                return;
            }
            console.error('❌ Error loading inventory overview:', error);
        }
    // NOTE: intentionally NOT depending on menuItems to avoid re-creating the function
    // which was triggering the initial load effect repeatedly (causing perpetual loading state).
    }, []);

    // Load menu items with real-time recipe costs
    const loadMenuItemsWithRecipeCosts = useCallback(async (forceRealTime = false, silent = false) => {
        if (menuItems.length === 0) {
            console.log('⏳ No menu items loaded yet');
            return;
        }

        if (inventoryOverview.length === 0 && !forceRealTime) {
            console.log('⏳ No inventory data loaded yet, using original prices as fallback');
            // Use original prices if inventory data is not available
            const itemsWithOriginalPrices = menuItems.map(item => ({
                // Preserve all original fields including image fallbacks added by /api/menu/items
                ...item,
                originalPrice: item.price,
                price: parseFloat(item.price) || 0,
                isRecipeCostCalculated: false,
                lastUpdated: new Date().toISOString(),
                // Defensive: if backend changed keys ensure we still have predictable props
                img: item.img || item.image_url || item.imageUrl || item.image || item.img_src || item.src || '',
                fallback_img: item.fallback_img || item.fallbackImg || item.fallback || '',
                placeholder_img: item.placeholder_img || item.placeholderImg || item.placeholder || ''
            }));
            setMenuItemsWithRecipeCost(itemsWithOriginalPrices);
            return;
        }

        console.log('🔄 Starting real-time recipe cost calculation for', menuItems.length, 'menu items');

        const itemsWithRecipeCosts = await Promise.all(
            menuItems.map(async (item) => {
                const recipeCost = await calculateRecipeCost(item, forceRealTime);
                return {
                    ...item,
                    originalPrice: item.price, // Keep original selling price
                    price: recipeCost, // Use real-time recipe cost for wastage calculation
                    isRecipeCostCalculated: recipeCost !== parseFloat(item.price),
                    lastUpdated: new Date().toISOString(),
                    isRealTime: forceRealTime,
                    // Re-assert image properties (the spread should already keep them but ensure consistency)
                    img: item.img || item.image_url || item.imageUrl || item.image || item.img_src || item.src || '',
                    fallback_img: item.fallback_img || item.fallbackImg || item.fallback || '',
                    placeholder_img: item.placeholder_img || item.placeholderImg || item.placeholder || ''
                };
            })
        );

        console.log('✅ Real-time recipe costs calculated:', itemsWithRecipeCosts.map(item => ({
            name: item.name,
            originalPrice: item.originalPrice,
            calculatedCost: item.price,
            lastUpdated: item.lastUpdated,
            isRealTime: item.isRealTime
        })));
        if (silent) {
            // Shallow diff: only update if length changed or any price changed
            let changed = itemsWithRecipeCosts.length !== menuItemsWithRecipeCost.length;
            if (!changed) {
                for (let i = 0; i < itemsWithRecipeCosts.length; i++) {
                    const a = itemsWithRecipeCosts[i];
                    const b = menuItemsWithRecipeCost[i];
                    if (!b || a.id !== b.id || a.price !== b.price) { changed = true; break; }
                }
            }
            if (changed) setMenuItemsWithRecipeCost(itemsWithRecipeCosts);
        } else {
            setMenuItemsWithRecipeCost(itemsWithRecipeCosts);
        }
    }, [menuItems, inventoryOverview, calculateRecipeCost, menuItemsWithRecipeCost]);
    const fetchData = useCallback(async (path, setter, errorMessage) => {
        try {
            const json = await http.get(path);

            if (json.success) {
                let data = json.data || [];
                if (path === '/wastage/reasons' || path.startsWith('/wastage/reasons')) {
                    data = data.filter((item, index, self) =>
                        index === self.findIndex(t => (t.reason_id || t.id) === (item.reason_id || item.id))
                    );
                }

                // Ensure menu items have numeric prices
                if (path === '/menu/items' && data.length > 0) {
                    data = data.map(item => ({
                        ...item,
                        price: parseFloat(item.price) || 0
                    }));
                }

                setter(data);
            } else {
                setError(`${errorMessage}: ${json.error || 'Unknown error'}`);
            }
        } catch (e) {
            // Ignore AbortErrors to prevent noise in console
            if (e.name === 'AbortError' || e.aborted) {
                console.log(`Request aborted for ${path} - component unmounted or request cancelled`);
                return;
            }
            if (e.name === 'TypeError' && e.message.includes('fetch')) {
                setError(`${errorMessage}: Network connection failed`);
            } else {
                setError(`${errorMessage}: ${e.message}`);
            }
        }
    }, []);

    // Load all data on component mount
    useEffect(() => {
        // Run only once on mount to prevent infinite re-fetch loops caused by
        // function identity changes in dependencies.
        let cancelled = false;
        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                await http.get('/health');
            } catch (healthError) {
                if (!cancelled) {
                    // Handle AbortErrors for health check
                    if (healthError.name === 'AbortError' || healthError.aborted) {
                        console.log('Health check aborted - component unmounted');
                        return;
                    }
                    setError(`Cannot connect to server at ${API_BASE_URL}. Please check if the backend is running.`);
                    setIsLoading(false);
                }
                return;
            }
            try {
                await Promise.all([
                    fetchData('/menu/items', setMenuItems, 'Failed to load menu items'),
                    fetchData('/wastage/reasons?business_id=1', setWasteReasons, 'Failed to load waste reasons'),
                    fetchData('/users?business_id=1', setStaffMembers, 'Failed to load staff members'),
                    loadInventoryOverview()
                ]);
                // After base data is loaded, compute recipe costs if both sets are present
                // (we trigger explicitly here to avoid race conditions due to removed deps above)
                if (!cancelled) {
                    if (menuItems.length > 0 && inventoryOverview.length > 0) {
                        await loadMenuItemsWithRecipeCosts();
                    }
                    setIsLoading(false);
                }
            } catch (e) {
                if (!cancelled) {
                    // Handle AbortErrors gracefully 
                    if (e.name === 'AbortError' || e.aborted) {
                        console.log('Main data loading aborted - component unmounted');
                        return;
                    }
                    setError(`Unexpected error while loading data: ${e.message}`);
                    setIsLoading(false);
                }
            }
        };
        loadData();
        return () => { cancelled = true; };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set categories when menu items are loaded
    useEffect(() => {
        if (menuItems.length > 0) {
            const uniqueCategories = ['All', ...new Set(menuItems.map(item => item.category).filter(Boolean)), 'Raw Items'];
            setCategories(uniqueCategories);
        }
    }, [menuItems]);

    // Load recipe costs when both menu items and inventory data are available
    useEffect(() => {
        if (menuItems.length > 0 && inventoryOverview.length > 0) {
            loadMenuItemsWithRecipeCosts();
        }
    }, [menuItems, inventoryOverview, loadMenuItemsWithRecipeCosts]);

    // Real-time cost refresh function
    // Silent auto refresh every 10 seconds without UI flicker
    useEffect(() => {
        let active = true;
        const doRefresh = async () => {
            if (menuItems.length === 0) return;
            try {
                await loadInventoryOverview(true);
                if (active && inventoryOverview.length > 0) {
                    await loadMenuItemsWithRecipeCosts(true, true); // silent diff update
                }
            } catch (_) { /* silent */ }
        };
        const interval = setInterval(doRefresh, 10000); // 10s
        return () => { active = false; clearInterval(interval); };
    }, [menuItems.length, inventoryOverview.length, loadInventoryOverview, loadMenuItemsWithRecipeCosts]);

    const fetchRawItems = useCallback(async () => {
        try {
            const result = await http.get('/unit-mapping/inventory-items/1');

            if (result.success && result.data) {
                let detailedItems = [];
                try {
                    // Fetch with real-time + all items flags to ensure comprehensive data
                    const detailedResult = await http.get('/stock-in/inventory/overview?business_id=1&includeComplimentary=true&hideExpired=false&hideZeroStock=false&excludeUncategorized=false&sources=all&realTime=true');
                    if (detailedResult.success && detailedResult.data) {
                        detailedItems = detailedResult.data;
                    }
                } catch (detailError) {
                    console.warn('Could not fetch detailed inventory data:', detailError);
                }

                const processedRawItems = result.data.map(item => {
                    const detailedItem = detailedItems.find(d => d.item_id === item.id);

                    return {
                        id: `raw_${item.id}`,
                        originalId: item.id,
                        name: item.name,
                        category: 'Raw Items',
                        // Use real-time unit_cost (already includes complimentary + current pricing if backend supports)
                        price: parseFloat(detailedItem?.unit_cost || 0),
                        quantity: parseFloat(detailedItem?.quantity || 0),
                        unit: detailedItem?.unit || item.standardUnit || 'units',
                        stockLevel: detailedItem?.stock_level || 'adequate',
                        daysToExpiry: parseInt(detailedItem?.days_to_expiry || 999),
                        nearestExpiry: detailedItem?.expiry_date,
                        reorderPoint: detailedItem?.minimum_stock_level || 0,
                        safetyStock: detailedItem?.maximum_stock_level || 0,
                        batchNumber: detailedItem?.batch_number || 'N/A'
                    };
                });

                setRawItems(processedRawItems);
            }
        } catch (error) {
            console.error('Error fetching raw items:', error);
        }
    }, []);

    useEffect(() => {
        fetchRawItems();
    }, [fetchRawItems]);

    // Set default waste reason when reasons are loaded
    useEffect(() => {
        if (wasteReasons.length > 0 && !wasteReason) {
            // Prefer a sensible default, else first
            const defaultReason =
                wasteReasons.find(r => (r.reason_label || '').toLowerCase().includes('excess')) ||
                wasteReasons[0];
            setWasteReason(defaultReason);
        }
    }, [wasteReasons, wasteReason]);

    // Draft functionality
    const handleSaveDraft = () => {
        const draftData = {
            wasteReason,
            wastedItems,
            notes,
            recordedBy,
        };

        localStorage.setItem('stockOutDraft', JSON.stringify(draftData));
        // Show success in modal instead of green banner
        setSuccessMessage('Draft saved successfully!');
        setShowSuccessModal(true);
    };

    // Load draft on component mount
    useEffect(() => {
        const savedDraftString = localStorage.getItem('stockOutDraft');
        if (savedDraftString) {
            const userChoice = window.confirm('You have a saved draft. Would you like to load it?');
            if (userChoice) {
                try {
                    const draftData = JSON.parse(savedDraftString);
                    setWastedItems(draftData.wastedItems || {});
                    setNotes(draftData.notes || '');
                    if (draftData.recordedBy) setRecordedBy(draftData.recordedBy);
                    if (draftData.wasteReason) setWasteReason(draftData.wasteReason);
                    localStorage.removeItem('stockOutDraft');
                } catch (e) {
                    console.error('Error loading draft:', e);
                }
            }
        }
    }, []);

    // Search handlers
    const clearSearch = () => {
        setSearchTerm('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };

    const handleQuantityChange = (itemId, amount) => {
        setWastedItems(prev => {
            const currentCount = prev[itemId] || 0;
            const newCount = currentCount + amount;

            if (newCount <= 0) {
                const { [itemId]: _, ...rest } = prev;
                return rest;
            }

            return { ...prev, [itemId]: newCount };
        });
    };

    // Calculate totals
    const { totalItems, totalCost } = useMemo(() => {
        return Object.entries(wastedItems).reduce((acc, [id, count]) => {
            // Check both menu items and raw items
            let item = menuItemsWithRecipeCost.find(i => i.id.toString() === id);
            if (!item) {
                item = rawItems.find(i => i.id.toString() === id);
            }

            if (item) {
                acc.totalItems += count;
                acc.totalCost += (item.price * count);
            }
            return acc;
        }, { totalItems: 0, totalCost: 0 });
    }, [wastedItems, menuItemsWithRecipeCost, rawItems]);

    // Filter displayed items
    const displayedItems = useMemo(() => {
        let items = [];

        if (activeCategory === 'Raw Items') {
            items = rawItems;
        } else if (activeCategory === 'All') {
            items = menuItemsWithRecipeCost; // Use recipe cost items
        } else {
            items = menuItemsWithRecipeCost.filter(item => item.category === activeCategory);
        }

        if (searchTerm) {
            items = smartSearch(items, searchTerm, ['name']);
        }
        // Debug any items missing image src once (avoid noisy logs)
        items.forEach(it => {
            if (!it._imgDebugged && (typeof it.img === 'undefined' || it.img === null || it.img === '')) {
                console.warn('🖼️ Menu item missing primary image src, will rely on fallback/placeholder:', {
                    id: it.id, name: it.name, fallback_img: it.fallback_img, placeholder_img: it.placeholder_img
                });
                it._imgDebugged = true; // mark to prevent repeated logs
            }
        });
        return items;
    }, [menuItemsWithRecipeCost, rawItems, activeCategory, searchTerm]);

    const handleCameraClick = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = async (event) => {
        const files = Array.from(event.target.files);
        if (files.length > 0) {
            try {
                // Import the image compression utility
                const { autoCompressImage } = await import('../utils/imageCompression');

                const processedPhotos = await Promise.all(files.map(async file => {
                    try {
                        const compressedFile = await autoCompressImage(file);
                        return {
                            file: compressedFile,
                            url: URL.createObjectURL(compressedFile),
                            originalFile: file
                        };
                    } catch (error) {
                        return {
                            file: file,
                            url: URL.createObjectURL(file),
                            compressionFailed: true
                        };
                    }
                }));

                setPhotos(prev => [...prev, ...processedPhotos]);
            } catch (error) {
                const newPhotos = files.map(file => ({
                    file: file,
                    url: URL.createObjectURL(file)
                }));
                setPhotos(prev => [...prev, ...newPhotos]);
            }
        }
        event.target.value = null;
    };

    const handleRemovePhoto = (index) => {
        setPhotos(photos.filter((_, i) => i !== index));
    };

    // Handle form submission

    const handleSubmit = async () => {
        if (!wasteReason) {
            setError('Please select a reason.');
            return;
        }
        if (!recordedBy) {
            setError('Please select a staff member.');
            setStaffModalOpen(true);
            return;
        }
        if (totalItems === 0 && wasteReason?.reason_label !== "No wastage recorded") {
            setError('Please add at least one item (unless "No wastage recorded")');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const items = Object.entries(wastedItems)
                .filter(([menu_item_id, quantity]) => {
                    const qty = parseFloat(quantity);
                    let isValidId = false;
                    if (menu_item_id.toString().startsWith('raw_')) {
                        const rawId = menu_item_id.toString().replace('raw_', '');
                        isValidId = !isNaN(parseInt(rawId)) && parseInt(rawId) > 0;
                    } else {
                        const id = parseInt(menu_item_id);
                        isValidId = !isNaN(id) && id > 0;
                    }
                    return isValidId && !isNaN(qty) && qty > 0;
                })
                .map(([menu_item_id, quantity]) => ({
                    menu_item_id: menu_item_id,
                    quantity: parseFloat(quantity)
                }));

            if (items.length === 0) {
                throw new Error('No valid items to record. Please add items with positive quantities.');
            }

            // Submit individual wastage records for each item
            const results = [];
            let totalEstimatedCost = 0;

            for (const item of items) {
                let itemId, itemType, actualItem;
                if (item.menu_item_id.toString().startsWith('raw_')) {
                    const rawItemId = item.menu_item_id.toString().replace('raw_', '');
                    actualItem = rawItems.find(r => r.originalId == rawItemId || r.id === item.menu_item_id);
                    itemId = actualItem ? actualItem.originalId : parseInt(rawItemId);
                    itemType = 'InventoryItem';
                } else {
                    itemId = parseInt(item.menu_item_id);
                    itemType = 'MenuItem';
                    actualItem = menuItemsWithRecipeCost.find(m => m.id == itemId);
                }

                const itemPrice = actualItem ? actualItem.price : 0;
                const estimatedCost = item.quantity * itemPrice;

                const payload = {
                    item_id: itemId,
                    item_type: itemType,
                    quantity: item.quantity,
                    waste_reason_id: wasteReason.reason_id,
                    notes: notes || `Waste recorded via mobile app - ${new Date().toLocaleString()}`,
                    deducted_by_user_id: recordedBy?.user_id || recordedBy?.id || 1,
                    business_id: 1,
                    unit_id: 5,
                    estimated_cost_impact: estimatedCost
                };

                const response = await http.post('/wastage', payload);
                const result = response;
                results.push(result);
                totalEstimatedCost += parseFloat(result.data.estimated_cost || estimatedCost);
            }

            const summaryResult = {
                success: true,
                data: {
                    total_items: items.length,
                    total_estimated_cost: totalEstimatedCost.toFixed(2),
                    stock_out_id: results[0]?.data?.stock_out_id
                }
            };

            const result = summaryResult;

            if (result.success) {
                if (photos.length > 0 && result.data.stock_out_id) {
                    try {
                        const photoUploadResult = await uploadWastagePhotos(photos, result.data.stock_out_id);
                        const photoMsg = photoUploadResult.success
                            ? `\nUploaded ${photoUploadResult.data.length} photos.`
                            : '\nPhoto upload failed.';
                        const successMsg = `Successfully recorded waste for ${result.data.total_items} items. Estimated cost: ₹${result.data.total_estimated_cost}${photoMsg}`;
                        setSuccessMessage(successMsg);
                    } catch (photoError) {
                        const successMsg = `Successfully recorded waste for ${result.data.total_items} items. Estimated cost: ₹${result.data.total_estimated_cost}\nNote: Photo upload failed.`;
                        setSuccessMessage(successMsg);
                    }
                } else {
                    const successMsg = `Successfully recorded waste for ${result.data.total_items} items. Estimated cost: ₹${result.data.total_estimated_cost}`;
                    setSuccessMessage(successMsg);
                }

                setShowSuccessModal(true);
                setWastedItems({});
                setNotes('');
                setPhotos([]);
                localStorage.removeItem('stockOutDraft');
                setConfirmModalOpen(false);

                // Refresh raw items data to reflect updated quantities
                fetchRawItems();
            } else {
                // Handle specific error cases
                if (result.error && result.error.includes('Insufficient stock')) {
                    setError(`Insufficient stock: ${result.error}`);
                } else {
                    throw new Error(result.error || result.details || 'Failed to record waste');
                }
            }
        } catch (error) {
            console.error('Error submitting waste record:', error);
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setError('Network error: Unable to connect to server. Please check if the backend is running.');
            } else {
                setError(`Failed to record waste: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const isConfirmDisabled = !wasteReason || (totalItems === 0 && wasteReason?.reason_label !== "No wastage recorded");

    // Helper to compute digit places for Counter based on the number of digits
    const getPlaces = (num) => {
        const n = Math.max(0, Math.floor(Math.abs(Number(num) || 0)));
        const len = Math.max(1, Math.floor(Math.log10(n || 1)) + 1);
        const places = [];
        for (let i = len - 1; i >= 0; i--) places.push(10 ** i);
        return places;
    };

    return (
        <div className="stock-out-container">
            <div className="stock-out-page">
                <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: 'none' }}
                    multiple
                />

                {/* Loading State */}
                {isLoading && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        background: '#fafbfc',
                        zIndex: 9999,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <div style={{ fontSize: 24, fontWeight: 600, color: '#222', marginBottom: 16 }}>Loading data...</div>
                        <div style={{ width: 48, height: 48, border: '6px solid #e5e7eb', borderTop: '6px solid #2196f3', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
                    </div>
                )}

                {/* Error Message */}
                {error && (
                    <div style={{
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        padding: '12px',
                        borderRadius: '8px',
                        marginBottom: '16px',
                        border: '1px solid #f5c6cb'
                    }}>
                        {error}
                    </div>
                )}

                {/* Success Message is now shown only in the modal */}

                {!isLoading && (
                    <>
                        <StandardScrollStyles />
                        <div className="waste-subheader">
                            <div className="stock-tabs" style={{ display: 'flex', width: '100%' }}>
                                <button
                                    className={`tab-btn ${activeSubTab === 'Usage' ? 'active' : ''}`}
                                    onClick={() => setActiveSubTab('Usage')}
                                    aria-pressed={activeSubTab === 'Usage'}
                                    style={{ flex: 1 }}
                                >
                                    Usage
                                </button>
                                <button
                                    className={`tab-btn ${activeSubTab === 'Waste' ? 'active' : ''}`}
                                    onClick={() => setActiveSubTab('Waste')}
                                    aria-pressed={activeSubTab === 'Waste'}
                                    style={{ flex: 1 }}
                                >
                                    Waste
                                </button>
                            </div>
                        </div>

                        {/* Render Usage component when Usage tab is active */}
                        {activeSubTab === 'Usage' && <Usage />}

                        {/* Render Waste form when Waste tab is active */}
                        {activeSubTab === 'Waste' && (
                            <>
                                <div className="form-group reason-group">
                                    <label className="form-label-main">Reason: {wasteReason?.reason_label || 'Select reason'}</label>
                                    <button className="change-reason-btn" onClick={() => setReasonModalOpen(true)}>Change</button>
                                </div>

                                {wasteReason?.reason_label !== "No wastage recorded" && (
                                    <>
                                        {/* Search Input */}
                                        <StandardSearch
                                            value={searchTerm}
                                            onChange={setSearchTerm}
                                            onClear={clearSearch}
                                            placeholder="Search items..."
                                            inputRef={searchInputRef}
                                            style={{ marginBottom: '16px' }}
                                        />

                                        <div className="category-pills">
                                            {categories.map(cat => <button key={cat} className={activeCategory === cat ? 'active' : ''} onClick={() => setActiveCategory(cat)}>{cat}</button>)}
                                        </div>
                                        <div className="form-group">
                                            <div className="item-grid" style={standardScrollStyles}>
                                                {displayedItems.map((item, index) => (
                                                    <div className="dish-card" key={`${item.id}-${item.category}-${index}`}>
                                                        {item.category === 'Raw Items' ? (
                                                            <div className="raw-item-placeholder">
                                                                <span className="raw-item-icon">📦</span>
                                                                <div className="raw-item-info">
                                                                    <small>{item.quantity} {item.unit} available</small>
                                                                    <small className={`stock-level ${item.stockLevel}`}>
                                                                        {item.stockLevel === 'low' ? '⚠️ Low Stock' :
                                                                            item.stockLevel === 'out-of-stock' ? '❌ Out of Stock' :
                                                                                item.stockLevel === 'overstocked' ? '📈 Overstocked' :
                                                                                    '✅ Adequate'}
                                                                    </small>
                                                                    {item.daysToExpiry < 999 && (
                                                                        <small className={`expiry-info ${item.daysToExpiry <= 3 ? 'urgent' : item.daysToExpiry <= 7 ? 'warning' : 'normal'}`}>
                                                                            {item.daysToExpiry <= 0 ? '🔴 Expired' :
                                                                                item.daysToExpiry === 1 ? '🟡 Expires Tomorrow' :
                                                                                    item.daysToExpiry <= 3 ? `🟡 ${item.daysToExpiry} days left` :
                                                                                        item.daysToExpiry <= 7 ? `🟢 ${item.daysToExpiry} days left` :
                                                                                            '🟢 Fresh'}
                                                                        </small>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <ImageWithFallback
                                                                src={item.img}
                                                                alt={item.name}
                                                                fallback={item.fallback_img}
                                                                placeholder={item.placeholder_img}
                                                            />
                                                        )}
                                                        <p className="dish-name" style={defaultTextSizes}>
                                                            {searchTerm
                                                                ? highlightMatch(item.name, searchTerm)
                                                                : item.name
                                                            }
                                                        </p>
                                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 8 }}>
                                                            {item.category === 'Raw Items' ?
                                                                <span style={{ color: '#111', fontWeight: 700, fontSize: 16, marginBottom: 2, textAlign: 'center' }}>
                                                                    ₹{(parseFloat(item.price) || 0).toFixed(2)}/{item.unit}
                                                                </span>
                                                                :
                                                                <>
                                                                    <span style={{ color: '#888', fontWeight: 700, fontSize: 13, marginBottom: 2 }}>Manufacturing Cost</span>
                                                                    <span style={{ color: '#111', fontWeight: 700, fontSize: 16, marginBottom: 2, textAlign: 'center' }}>₹{(parseFloat(item.price) || 0).toFixed(2)}/plate</span>
                                                                </>
                                                            }
                                                        </div>
                                                        <div className="quantity-stepper">
                                                            <button
                                                                style={{ border: '1px solid rgb(209, 213, 219)' }}
                                                                onClick={() => handleQuantityChange(item.id, -1)}
                                                                disabled={!wastedItems[item.id] || wastedItems[item.id] <= 0}
                                                            >
                                                                <FiMinus />
                                                            </button>
                                                            <span className="quantity-display" data-item-id={item.id}>
                                                                <Counter
                                                                    value={wastedItems[item.id] || 0}
                                                                    fontSize={16}
                                                                    padding={0}
                                                                    places={getPlaces(wastedItems[item.id] || 0)}
                                                                    gap={0}
                                                                    horizontalPadding={0}
                                                                    borderRadius={0}
                                                                    gradientHeight={0}
                                                                    textColor="currentColor"
                                                                    fontWeight="inherit"
                                                                />
                                                            </span>
                                                            <button style={{ border: '1px solid rgb(209, 213, 219)' }} onClick={() => handleQuantityChange(item.id, 1)}>
                                                                <FiPlus />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        {/* ✅ New wrapper div for the card */}
                                        <div className="summary-notes-card">
                                            <div className="waste-summary">
                                                <span style={{ color: "#000" }}>Total Items:</span>
                                                <span>
                                                    <Counter
                                                        value={totalItems}
                                                        fontSize={16}
                                                        padding={0}
                                                        places={getPlaces(totalItems)}
                                                        gap={0}
                                                        horizontalPadding={0}
                                                        borderRadius={0}
                                                        gradientHeight={0}
                                                        textColor="currentColor"
                                                        fontWeight="inherit"
                                                    />
                                                </span>
                                                <span style={{ color: "#000" }}>Estimated Waste Cost:</span>
                                                <span className="total-cost-amount" style={{ color: '#111' }}>
                                                    {(() => {
                                                        const fixed = totalCost.toFixed(2);
                                                        const [intPart, fracPart] = fixed.split('.')
                                                        return (
                                                            <span style={{ color: '#111' }}>
                                                                <span className="rupee-symbol">₹</span>
                                                                <Counter
                                                                    value={parseInt(intPart, 10) || 0}
                                                                    fontSize={16}
                                                                    padding={0}
                                                                    places={getPlaces(parseInt(intPart, 10) || 0)}
                                                                    gap={0}
                                                                    horizontalPadding={0}
                                                                    borderRadius={0}
                                                                    gradientHeight={0}
                                                                    textColor="#111"
                                                                    fontWeight="inherit"
                                                                />
                                                                <span className="fraction-part">.{fracPart}</span>
                                                            </span>
                                                        );
                                                    })()}
                                                </span>
                                            </div>
                                            {/* I've added a "notes-group" class for better styling */}
                                            <div className="form-group notes-group">
                                                <label className="form-label-main">Additional Notes (Optional)</label>
                                                <textarea placeholder="Add specific context about the waste..." value={notes} onChange={e => setNotes(e.target.value)}></textarea>
                                            </div>
                                        </div>
                                    </>
                                )}

                                <div className="recorder-and-photo-section">
                                    <div className="recorder-group">
                                        <div className="form-group">
                                            <label className="form-label-main">Recorded by: {recordedBy?.name || ' '}</label>
                                            <button className="recorder-select-btn" onClick={() => setStaffModalOpen(true)}>
                                                <FiUser /> {recordedBy ? 'Change Staff' : 'Select Staff'}
                                            </button>
                                        </div>
                                    </div>
                                    <div className="photo-upload-group">
                                        <button className="photo-upload-box" onClick={handleCameraClick}>
                                            <FiCamera />
                                        </button>
                                    </div>
                                </div>
                                {photos.length > 0 && (
                                    <div className="photo-previews">
                                        {photos.map((photo, index) => (
                                            <div key={index} className="preview-image-container">
                                                <img src={photo.url} alt={`Waste preview ${index + 1}`} />
                                                <button onClick={() => handleRemovePhoto(index)} className="remove-photo-btn"><FiX /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* --- UPDATED: Added onClick handler to the Draft button --- */}
                                <div className="form-actions">
                                    <button className="draft-btn" onClick={handleSaveDraft}>Save as Draft</button>
                                    <button
                                        className="submit-btn waste-confirm"
                                        disabled={isConfirmDisabled}
                                        onClick={() => {
                                            if (!recordedBy) {
                                                setStaffModalOpen(true);
                                            } else {
                                                setConfirmModalOpen(true);
                                            }
                                        }}
                                    >
                                        Confirm Waste
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Modals - shown for both Usage and Waste tabs */}
                        {isReasonModalOpen && (
                            <Modal onClose={() => setReasonModalOpen(false)}>
                                <div className="stock-out-modal-list">
                                    <h3>Select Waste Reason</h3>
                                    <div>
                                        {wasteReasons
                                            .filter((reason, index, self) =>
                                                index === self.findIndex(r => r.reason_id === reason.reason_id)
                                            )
                                            .map(r => (
                                                <button
                                                    key={r.reason_id}
                                                    className={wasteReason?.reason_id === r.reason_id ? 'active' : ''}
                                                    onClick={() => {
                                                        setWasteReason(r);
                                                        setReasonModalOpen(false);
                                                    }}
                                                >
                                                    <h4>{r.reason_label}</h4>
                                                    <p>{r.reason_category || 'General Waste'}</p>
                                                </button>
                                            ))
                                        }
                                    </div>
                                    <button className="cancel-btn" onClick={() => setReasonModalOpen(false)}>
                                        Cancel
                                    </button>
                                </div>
                            </Modal>
                        )}
                        {isStaffModalOpen && (
                            <Modal onClose={() => setStaffModalOpen(false)}>
                                <div className="stock-out-modal-list">
                                    <h3>Select Staff Member</h3>
                                    {staffMembers.map(s => (
                                        <button key={s.user_id || s.id} onClick={() => { setRecordedBy(s); setStaffModalOpen(false); }}>
                                            <h4>{s.name}</h4>
                                            <p>{s.role_name || s.role || ''}</p>
                                        </button>
                                    ))}
                                    <button className="cancel-btn" onClick={() => setStaffModalOpen(false)}>Cancel</button>
                                </div>
                            </Modal>
                        )}
                        {isConfirmModalOpen && (
                            <Modal onClose={() => setConfirmModalOpen(false)}>
                                <div className="confirm-modal">
                                    <h3>Confirm Waste Record</h3>
                                    <div className="confirm-details">

                                        {/* This is the detailed, scrollable list of items */}
                                        <div className="item-breakdown-list" style={{ width: '100%', minWidth: '100%', maxHeight: '160px', overflowY: 'auto', marginBottom: '8px' }}>
                                            {Object.entries(wastedItems).map(([id, quantity]) => {
                                                const item = menuItemsWithRecipeCost.find(i => i.id.toString() === id) || rawItems.find(i => i.id.toString() === id);
                                                if (!item) return null;
                                                return (
                                                    <div className="item-row" key={id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', minHeight: '38px', width: '100%' }}>
                                                        <span style={{ fontWeight: 700, color: '#111', fontSize: '16px', flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', height: '38px', width: '100%' }}>{item.name}</span>
                                                        <span style={{ fontWeight: 700, color: '#111', fontSize: '16px', flex: 0, minWidth: '60px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '38px' }}>
                                                            x&nbsp;
                                                            <Counter
                                                                value={quantity}
                                                                fontSize={16}
                                                                padding={0}
                                                                places={getPlaces(quantity)}
                                                                gap={0}
                                                                horizontalPadding={0}
                                                                borderRadius={0}
                                                                gradientHeight={0}
                                                                textColor="#111"
                                                                fontWeight={700}
                                                            />
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* This is the final, single summary section */}
                                        <p>
                                            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111', flex: 1, textAlign: 'left', display: 'flex', alignItems: 'center', height: '38px' }}>Total Items:</span>
                                            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111', flex: 0, minWidth: '60px', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', height: '38px' }}>
                                                <Counter
                                                    value={totalItems}
                                                    fontSize={16}
                                                    padding={0}
                                                    places={getPlaces(totalItems)}
                                                    gap={0}
                                                    horizontalPadding={0}
                                                    borderRadius={0}
                                                    gradientHeight={0}
                                                    textColor="#111"
                                                    fontWeight={700}
                                                />
                                            </span>
                                        </p>
                                        <p className="total-cost-summary">
                                            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>Estimated Waste Cost:</span>
                                            <span className="total-cost-amount" style={{ color: '#111', fontWeight: 700, fontSize: '16px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                                                <span className="rupee-symbol" style={{ color: '#111', fontWeight: 700, fontSize: '16px', verticalAlign: 'middle', display: 'inline-block' }}>₹</span>
                                                <span style={{ fontWeight: 700, fontSize: '16px', color: '#111', verticalAlign: 'middle', display: 'inline-block' }}>
                                                    {parseInt(totalCost.toFixed(2).split('.')[0], 10) || 0}
                                                </span>
                                                <span className="fraction-part" style={{ color: '#111', fontWeight: 700, fontSize: '16px', verticalAlign: 'middle', display: 'inline-block' }}>.{totalCost.toFixed(2).split('.')[1]}</span>
                                            </span>
                                        </p>
                                        <hr />
                                        <p>
                                            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>Reason:</span>
                                            <span style={{ fontWeight: 400, fontSize: '16px', color: '#111' }}>{wasteReason?.reason_label || 'N/A'}</span>
                                        </p>
                                        <p>
                                            <span style={{ fontWeight: 700, fontSize: '16px', color: '#111' }}>Recorded by:</span>
                                            <span style={{ fontWeight: 400, fontSize: '16px', color: '#111' }}>{recordedBy?.name || 'N/A'}</span>
                                        </p>
                                    </div>

                                    <div className="confirm-actions">
                                        <button className="cancel-btn" onClick={() => setConfirmModalOpen(false)}>Cancel</button>
                                        <button
                                            className="confirm-btn-final"
                                            onClick={handleSubmit}
                                            disabled={isSubmitting}
                                        >
                                            {isSubmitting ? 'Processing...' : 'Confirm'}
                                        </button>
                                    </div>
                                </div>
                            </Modal>
                        )}
                        {/* Success Modal with green animation tick */}
                        <SuccessModal
                            show={showSuccessModal}
                            message={successMessage}
                            onClose={() => setShowSuccessModal(false)}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default StockOutForm;