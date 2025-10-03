import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { getTenant } from '../services/tenantContext';
import { http } from '../services/apiClient';
import { Check, Search, Plus, Star, Phone, Mail, ArrowLeft } from 'lucide-react';
import MinimalStockService from '../services/minimalStockService';
import './CreateReorder.css';
import { StandardScrollStyles, highlightMatch, performSmartSearch, defaultTextSizes, standardScrollStyles } from '../styles/standardStyles';

// Using lucide-react's ArrowLeft icon directly

const CreateReorder = ({ onNavigateBack, onNavigateToVendor, selectedVendor, onClearSelectedVendor, goTo }) => {
    
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

    // Canonicalize vendor categories for uniqueness and consistent matching
    const canonicalizeVendorCategory = useCallback((rawCategory) => {
        const s = (rawCategory || '').toString().trim().toLowerCase();
        if (!s) return { key: 'other', label: 'Other' };
        // common synonyms
        const map = [
            { keys: ['auto ingredients'], key: 'wholesale', label: 'Wholesale' },
            { keys: ['wholesale', 'general', 'grocery', 'staples'], key: 'wholesale', label: 'Wholesale' },
            { keys: ['dairy', 'milk', 'curd', 'paneer', 'cheese', 'butter'], key: 'dairy', label: 'Dairy' },
            { keys: ['meat', 'butcher', 'chicken', 'mutton', 'poultry'], key: 'meat', label: 'Meat' },
            { keys: ['seafood', 'sea food', 'fish', 'prawn', 'prawns'], key: 'seafood', label: 'Seafood' },
            { keys: ['vegetables', 'veg', 'produce', 'greens'], key: 'vegetables', label: 'Vegetables' },
            { keys: ['fruits', 'fruit'], key: 'fruits', label: 'Fruits' },
            { keys: ['spices', 'masala', 'masalas'], key: 'spices', label: 'Spices' },
            { keys: ['grains', 'pulses', 'flour', 'atta', 'rice', 'dal', 'millets'], key: 'grains', label: 'Grains' },
            { keys: ['bakery', 'bread'], key: 'bakery', label: 'Bakery' },
            { keys: ['beverages', 'drinks', 'juice', 'tea', 'coffee'], key: 'beverages', label: 'Beverages' },
            { keys: ['oils', 'oil'], key: 'oils', label: 'Oils' },
            { keys: ['condiments', 'sauces', 'ketchup', 'chutney'], key: 'condiments', label: 'Condiments' },
            { keys: ['snacks', 'namkeen'], key: 'snacks', label: 'Snacks' },
            { keys: ['frozen'], key: 'frozen', label: 'Frozen' },
        ];
        for (const m of map) {
            if (m.keys.some(k => s.includes(k))) return { key: m.key, label: m.label };
        }
        // default: title case the raw input
        const label = s.replace(/\b\w/g, (c) => c.toUpperCase());
        const key = s.replace(/[^a-z0-9]+/g, '-');
        return { key: key || 'other', label: label || 'Other' };
    }, []);

    // Helper to attach normalized category metadata to a vendor object
    const withNormalizedCategory = useCallback((vendor, categoryOverride = null) => {
        const raw = (categoryOverride || vendor.vendor_category || vendor.category || '').toString();
        const { key, label } = canonicalizeVendorCategory(raw);
        return {
            ...vendor,
            normalizedCategoryKey: key,
            normalizedCategoryLabel: label,
            // Keep a consistent category field for display/search when missing
            category: vendor.category || vendor.vendor_category || label,
            vendor_category: vendor.vendor_category || vendor.category || label,
        };
    }, [canonicalizeVendorCategory]);

    const dedupeByCategory = useCallback((list) => {
        const seen = new Set();
        const out = [];
        for (const v of list) {
            const key = (v.normalizedCategoryKey || '').toString();
            if (!seen.has(key)) {
                seen.add(key);
                out.push(v);
            }
        }
        return out;
    }, []);

    // Derive a vendor category key for an item using name overrides first, then category synonyms
    const deriveVendorCategoryKey = useCallback((inventoryCategory, itemName = '') => {
        const name = (itemName || '').toString().toLowerCase();
        // Item-name overrides
        const nameOverrides = [
            { k: 'chicken', key: 'meat' },
            { k: 'beef', key: 'meat' },
            { k: 'mutton', key: 'meat' },
            { k: 'lamb', key: 'meat' },
            { k: 'pork', key: 'meat' },
            { k: 'fish', key: 'seafood' },
            { k: 'prawn', key: 'seafood' },
            { k: 'prawns', key: 'seafood' },
            { k: 'shrimp', key: 'seafood' },
            { k: 'crab', key: 'seafood' },
            { k: 'lobster', key: 'seafood' },
            { k: 'milk', key: 'dairy' },
            { k: 'paneer', key: 'dairy' },
            { k: 'cheese', key: 'dairy' },
            { k: 'butter', key: 'dairy' },
            { k: 'yogurt', key: 'dairy' },
            { k: 'curd', key: 'dairy' },
        ];
    const processedKeywords = ['masala', 'powder', 'mix', 'premix', 'soup', 'broth', 'stock', 'seasoning', 'spice', 'spices', 'gravy', 'base', 'paste', 'pepper', 'tikka', 'tandoori', 'marinade', 'marination', 'rub', 'coating', 'batter'];
        const isProcessed = processedKeywords.some(k => name.includes(k));
        if (!isProcessed) {
            const hit = nameOverrides.find(o => name.includes(o.k));
            if (hit) return hit.key;
        }

        // Fallback to category-based normalization
        const cat = (inventoryCategory || '').toString();
        if (!cat && !name) return 'wholesale';
        return canonicalizeVendorCategory(cat).key;
    }, [canonicalizeVendorCategory]);

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
    const searchInputRef = useRef(null);
    
    // Search handlers
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
    };
    
    const clearSearch = () => {
        setSearchTerm('');
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    };
    const [availableItems, setAvailableItems] = useState([]);
    const [preferredVendors, setPreferredVendors] = useState([]);

    // Human-friendly quantity formatter (matches screenshots)
    // - If unit is kg and value < 1, show grams
    // - If unit is L and value < 1, show milliliters
    // - Else show up to 1 decimal for stock display; 2 decimals for ROP where needed
    const formatQtyDisplay = useCallback((value, unit, opts = { decimals: 1 }) => {
        const v = Number(value || 0);
        const u = (unit || '').toString().trim();
        const d = Number.isFinite(opts.decimals) ? opts.decimals : 1;
        if (!u) return { value: v.toFixed(d), unit: '' };
        const lc = u.toLowerCase();
        // Normalize common variants
        const isKg = lc === 'kg' || lc === 'kilogram' || lc === 'kilograms';
        const isL = lc === 'l' || lc === 'liter' || lc === 'liters' || lc === 'ltr';
        if (isKg) {
            if (v > 0 && v < 1) {
                return { value: (v * 1000).toFixed(Math.max(1, d)), unit: 'g' };
            }
            return { value: v.toFixed(d), unit: 'kg' };
        }
        if (isL) {
            if (v > 0 && v < 1) {
                return { value: (v * 1000).toFixed(Math.max(1, d)), unit: 'ml' };
            }
            return { value: v.toFixed(d), unit: 'L' };
        }
        // Default units, print as-is with provided decimals
        return { value: v.toFixed(d), unit: u };
    }, []);

    // Quantity formatting with full unit words as per screenshot (Kilogram/Gram, Liter/Milliliter)
    const formatQtyWithWords = useCallback((value, unit) => {
        const base = formatQtyDisplay(value, unit, { decimals: 1 });
        const u = base.unit.toLowerCase();
        let word = base.unit;
        if (u === 'kg') word = 'Kilogram';
        else if (u === 'g') word = 'Gram';
        else if (u === 'l') word = 'Liter';
        else if (u === 'ml') word = 'Milliliter';
        else if (u === 'units' || u === 'unit') word = 'Units';
        else word = (unit || '').toString();
        return { value: base.value, unit: word };
    }, [formatQtyDisplay]);

    // Rehydrate preferred vendors from localStorage (if any)
    useEffect(() => {
        try {
            const raw = localStorage.getItem('preferredVendors');
            if (raw) {
                const parsed = JSON.parse(raw);
                const normalized = dedupeByCategory((parsed || []).map(v => withNormalizedCategory(v)));
                setPreferredVendors(normalized);
            }
        } catch {}
    }, [dedupeByCategory, withNormalizedCategory]);

    useEffect(() => {
        // Helper: build ABC category lookup supporting multiple legacy/new response shapes
        const buildABCLookup = (abcRes) => {
            const map = new Map();
            if (!abcRes) return map;
            // Newest shape: { success, data: { analysis_results: [ { item_id, abc_category } ] } }
            const candidateArrays = [];
            if (Array.isArray(abcRes?.data?.analysis_results)) candidateArrays.push(abcRes.data.analysis_results);
            if (Array.isArray(abcRes?.analysis_results)) candidateArrays.push(abcRes.analysis_results);
            if (Array.isArray(abcRes?.data?.items)) candidateArrays.push(abcRes.data.items);
            if (Array.isArray(abcRes?.items)) candidateArrays.push(abcRes.items);
            for (const arr of candidateArrays) {
                arr.forEach(row => {
                    const id = row.item_id || row.id || row.itemId;
                    const cat = row.abc_category || row.manual_abc_category || row.category;
                    if (id && cat && !map.has(id)) map.set(id, String(cat).trim().toUpperCase());
                });
            }
            return map;
        };

        const load = async () => {
            // Acquire tenant once for both smart categorization and fallback paths (needed in catch scope too)
            const tenant = getTenant();
            if (!tenant) {
                setError('Tenant not set. Please select or initialize a business before using Reorder.');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                // Onboarding-based behavior: first 7 days show ALL items
                const now = Date.now();
                let firstAt = 0;
                try {
                    const saved = localStorage.getItem('reorderOnboardingAt');
                    if (saved) firstAt = parseInt(saved, 10) || 0;
                } catch {}
                if (!firstAt) {
                    firstAt = now;
                    try { localStorage.setItem('reorderOnboardingAt', String(firstAt)); } catch {}
                }
                const daysSince = Math.floor((now - firstAt) / (24 * 60 * 60 * 1000));
                let inFirst7Days = daysSince <= 7;
                const after14Days = daysSince >= 14;
                // Optional dev override via URL or localStorage: ?showAll=1
                try {
                    const url = new URL(window.location.href);
                    const showAllParam = url.searchParams.get('showAll');
                    const lsOverride = localStorage.getItem('reorderShowAllOverride');
                    if (showAllParam === '1' || lsOverride === '1') inFirst7Days = true;
                } catch {}
                
                console.log('🔄 Using SMART CATEGORIZATION system for perfect vendor distribution...');
                
                                // Use the smart categorization endpoint for perfect vendor assignments
                const [categoryAssignmentsRes, overviewRes, allItemsRes, abcAnalysisRes] = await Promise.all([
                    http.get(`/inventory/items/${tenant}/category-assignments?includeAll=true`).catch(() => null),
                    http.get(`/stock-in/inventory/overview?business_id=${tenant}`).catch(() => null),
                    http.get(`/inventory/items/${tenant}`).catch(() => null),
                    http.get(`/abc-analysis/calculate?businessId=${tenant}`).catch(() => null)
                ]);

                                // Validate response shape: backend returns { success, data: { assignments: [ { vendor, vendorCategory, items, itemCount } ] } }
                                if (!categoryAssignmentsRes?.success || !Array.isArray(categoryAssignmentsRes?.data?.assignments)) {
                                        console.warn('⚠️ Smart categorization missing/invalid, falling back to old system');
                                        throw new Error(categoryAssignmentsRes?.error || 'Invalid category-assignments response');
                                }

                                const assignments = categoryAssignmentsRes.data.assignments;
                                console.log('✅ Smart categorization loaded:', { assignmentsCount: assignments.length });

                                const overviewListRaw = (overviewRes?.success ? (overviewRes.data || []) : []);
                                // Build quick lookups
                                const categoryByItemId = new Map(
                                    (allItemsRes?.success ? (allItemsRes.data || []) : [])
                                        .map(row => [row.item_id, row.category])
                                );
                                const overviewMap = overviewListRaw
                                    .reduce((acc, it) => {
                                        acc[it.item_id] = {
                                            unit_cost: Number(it.unit_cost || 0),
                                            unit: it.unit || it.unit_symbol || it.unit_name || '',
                                            quantity: Number(it.quantity || 0),
                                            name: it.item_name,
                                            is_newly_added: !!it.is_newly_added
                                        };
                                        return acc;
                                    }, {});

                                // Build ABC category lookup from ABC analysis results
                                const abcCategoryMap = buildABCLookup(abcAnalysisRes);
                                console.log('✅ ABC Analysis loaded (normalized):', { categoriesCount: abcCategoryMap.size });

                                // Build vendors and low stock items from assignments
                                const allVendors = [];
                                const allEnhancedItems = [];

                                assignments.forEach(a => {
                                    const vendor = a.vendor;
                                    const categoryKey = a.vendorCategory || vendor?.vendor_category || vendor?.category || 'wholesale';
                                    const items = Array.isArray(a.items) ? a.items : [];

                                    // collect vendor once
                                    if (vendor && !allVendors.find(v => v.vendor_id === vendor.vendor_id)) {
                                        allVendors.push({
                                            ...vendor,
                                            category: vendor.vendor_category || categoryKey,
                                            vendor_category: vendor.vendor_category || categoryKey
                                        });
                                    }

                                    // enhance items
                                    items.forEach(item => {
                                        const ov = overviewMap[item.item_id] || {};
                                        const liveQty = Number(ov.quantity ?? item.current_stock ?? 0);
                                        const unitLabel = item.unit || ov.unit || '';
                                        const rp = Number(item.reorder_point || 0);
                                        const ss = Number(item.safety_stock || 0);
                                        const isLow = (rp > 0 && liveQty <= rp) || (ss > 0 && liveQty <= ss);
                                        const abcCat = abcCategoryMap.get(item.item_id) || 'C';
                                        const enhancedBase = {
                                            ...item,
                                            item_id: item.item_id,
                                            name: item.name,
                                            unit: unitLabel,
                                            current_stock: liveQty,
                                            reorder_point: rp,
                                            safety_stock: ss,
                                            manual_abc_category: abcCat, // legacy field retained
                                            abc_category: abcCat, // unified field
                                            smart_vendor_category: categoryKey,
                                            smart_vendor: vendor,
                                            is_low_stock: isLow
                                        };
                                        const enhancedItem = {
                                            ...enhancedBase,
                                            reorder_qty: item.reorder_qty || computeSuggestedQty(enhancedBase)
                                        };
                                        allEnhancedItems.push(enhancedItem);
                                    });
                                });

                                if (allEnhancedItems.length === 0) {
                                    console.warn('⚠️ Smart categorization returned no items; falling back');
                                    throw new Error('No categorized items');
                                }
                
                // Derive low-stock list directly from enhanced items (no dashboard intersection now)
                const onlyLow = allEnhancedItems.filter(x => x.is_low_stock === true);
                const sortByUrgency = (a, b) => {
                    const baseA = (a.reorder_point || a.safety_stock || 1);
                    const baseB = (b.reorder_point || b.safety_stock || 1);
                    const ratioA = baseA > 0 ? (a.current_stock / baseA) : 1;
                    const ratioB = baseB > 0 ? (b.current_stock / baseB) : 1;
                    if (ratioA !== ratioB) return ratioA - ratioB;
                    if (a.is_newly_added !== b.is_newly_added) return a.is_newly_added ? 1 : -1;
                    return a.name.localeCompare(b.name);
                };
                const sortedLow = onlyLow.sort(sortByUrgency);

                // First 7 days: show ALL items from overview
                let itemsForOrder = sortedLow;
                if (inFirst7Days) {
                    itemsForOrder = overviewListRaw.map(it => ({
                        item_id: it.item_id,
                        name: it.item_name || it.name,
                        unit: it.unit || it.unit_symbol || it.unit_name || '',
                        current_stock: Number(it.quantity || 0),
                        reorder_point: Number(it.reorder_point || it.minimum_stock_level || 0),
                        safety_stock: Number(it.safety_stock || it.maximum_stock_level || 0),
                        smart_vendor_category: (() => {
                            const fromSmart = assignments.find(a => (a.items || []).some(x => x.item_id === it.item_id))?.vendorCategory;
                            if (fromSmart) return canonicalizeVendorCategory(fromSmart).key;
                            const cat = categoryByItemId.get(it.item_id) || '';
                            return deriveVendorCategoryKey(cat, it.item_name || it.name || '');
                        })(),
                        is_low_stock: false,
                        reorder_qty: 0,
                        is_newly_added: !!it.is_newly_added
                    })).sort((a, b) => {
                        if (a.is_newly_added !== b.is_newly_added) return a.is_newly_added ? 1 : -1;
                        return a.name.localeCompare(b.name);
                    });
                    console.log('🟢 First-7-days active: showing all items =', itemsForOrder.length);
                }
                
                // Separate items by ABC category for critical items section (normalize field names)
                // Critical subset: only A-category items that are actually low (from sortedLow)
                const criticalAItems = sortedLow.filter(item => {
                    const cat = (item.abc_category || item.manual_abc_category || item.ABC_category || item.category_abc || '').toString().toUpperCase();
                    return cat === 'A';
                });
                
                console.log('📊 Smart categorization results:', {
                    totalItems: itemsForOrder.length,
                    categories: [...new Set((itemsForOrder || []).map(i => i.smart_vendor_category))],
                    vendors: allVendors.map(v => `${v.name} (${v.vendor_category || v.category})`)
                });
                
                // loaded items and categories from smart system
                
                // If not in first 7 days, ensure itemsForOrder respects dashboard alert intersection too
                // No dashboard alert intersection filtering (ensuring all qualified low-stock items appear)
                setItems(itemsForOrder);
                // If itemsForOrder includes non-low entries (first 7 days onboarding), only keep those that are ALSO in sortedLow
                const lowIds = new Set(sortedLow.map(i => i.item_id));
                const criticalSubset = criticalAItems.filter(i => lowIds.has(i.item_id));
                setCriticalItems(criticalSubset);
                setVendors(allVendors);
                setAvailableItems(allItemsRes?.success ? (allItemsRes.data || []) : []);
                // If no preferred vendors in storage, seed one vendor per category (first found)
                try {
                    const stored = JSON.parse(localStorage.getItem('preferredVendors') || '[]');
                    if (!Array.isArray(stored) || stored.length === 0) {
                        const seeded = dedupeByCategory((allVendors || []).map(v => withNormalizedCategory(v)));
                        setPreferredVendors(seeded);
                        localStorage.setItem('preferredVendors', JSON.stringify(seeded));
                    }
                } catch {}
                
                // Preselect items with positive suggested qty (will be none in first-7-days by default)
                const sel = {};
                itemsForOrder.forEach(x => { if ((x.reorder_qty || 0) > 0) sel[x.item_id] = true; });
                setSelected(sel);
                
                // Set default delivery date (7 days from now)
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 7);
                setRequestedDeliveryDate(defaultDate.toISOString().split('T')[0]);

                // Deferred suggestion enhancement (after14Days) to reduce initial blocking time
                if (!inFirst7Days && after14Days) {
                    (async () => {
                        try {
                            const suggestedRes = await http.get(`/reorder/suggested-items/${tenant}`).catch(() => null);
                            if (suggestedRes?.success && Array.isArray(suggestedRes.suggestedItems) && suggestedRes.suggestedItems.length > 0) {
                                const suggested = suggestedRes.suggestedItems;
                                const assignmentCategoryByItem = new Map();
                                assignments.forEach(a => (a.items || []).forEach(x => assignmentCategoryByItem.set(x.item_id, a.vendorCategory || 'wholesale')));
                                const newItemsForOrder = suggested.map(s => {
                                    const ov = overviewMap[s.itemId] || {};
                                    return {
                                        item_id: s.itemId,
                                        name: s.itemName,
                                        unit: ov.unit || '',
                                        current_stock: Number(ov.quantity ?? 0),
                                        reorder_point: Number(s.reorderPoint ?? 0),
                                        safety_stock: Number(s.safetyStock ?? 0),
                                        smart_vendor_category: (() => {
                                            const fromSmart = assignmentCategoryByItem.get(s.itemId);
                                            if (fromSmart) return canonicalizeVendorCategory(fromSmart).key;
                                            const cat = (allItemsRes?.success ? (allItemsRes.data || []) : []).find(r => r.item_id === s.itemId)?.category || '';
                                            return deriveVendorCategoryKey(cat, s.itemName || '');
                                        })(),
                                        is_low_stock: true,
                                        reorder_qty: Number(s.recommendedOrderQty || 0),
                                        is_newly_added: !!ov.is_newly_added,
                                        urgency_score: Number(s.urgencyScore || 999)
                                    };
                                }).sort((a, b) => {
                                    if (a.is_newly_added !== b.is_newly_added) return a.is_newly_added ? 1 : -1;
                                    if (a.urgency_score !== b.urgency_score) return a.urgency_score - b.urgency_score;
                                    return a.name.localeCompare(b.name);
                                });
                                setItems(newItemsForOrder);
                                console.log('🟢 Deferred suggestions applied:', newItemsForOrder.length);
                            } else {
                                console.log('ℹ️ Deferred suggestions: none or empty');
                            }
                        } catch (e) {
                            console.warn('⚠️ Deferred suggested-items fetch failed:', e.message);
                        }
                    })();
                }
                
            } catch (e) {
                console.warn('⚠️ Smart categorization failed, falling back to old system:', e.message);
                
                try {
                    // Fallback to old system
                    const [itemsRes, vendorsRes, overviewRes, abcAnalysisRes] = await Promise.all([
                        MinimalStockService.getCriticalItems(tenant),
                        http.get(`/vendor-management/vendors/${tenant}`).catch(() => null),
                        http.get(`/stock-in/inventory/overview?business_id=${tenant}`).catch(() => null),
                        http.get(`/abc-analysis/calculate?businessId=${tenant}`).catch(() => null)
                    ]);
                    
                    if (!itemsRes?.success) throw new Error(itemsRes?.error || 'Failed to load items');
                    if (!vendorsRes?.success) throw new Error(vendorsRes?.error || 'Failed to load vendors');
                    
                    // Create ABC category mapping for fallback
                    const abcCategoryLookupFB = buildABCLookup(abcAnalysisRes);
                    
                    // Use old system data processing
                    const overviewMapFB = (overviewRes?.success ? (overviewRes.data || []) : [])
                        .reduce((acc, it) => {
                            acc[it.item_id] = {
                                unit: it.unit || it.unit_symbol || it.unit_name || '',
                                quantity: Number(it.quantity || 0)
                            };
                            return acc;
                        }, {});

                    const enriched = (itemsRes.data || []).map(x => {
                        const ov = overviewMapFB[x.item_id] || {};
                        const liveQty = Number(ov.quantity ?? x.current_stock ?? 0);
                        const rp = Number(x.reorder_point || 0);
                        const ss = Number(x.safety_stock || 0);
                        const base = {
                            ...x,
                            unit: x.unit || ov.unit || '',
                            current_stock: liveQty,
                            reorder_point: rp,
                            safety_stock: ss,
                            abc_category: abcCategoryLookupFB.get(x.item_id) || 'C',
                            manual_abc_category: abcCategoryLookupFB.get(x.item_id) || 'C'
                        };
                        return {
                            ...base,
                            reorder_qty: computeSuggestedQty(base),
                            is_low_stock: (rp > 0 && liveQty <= rp) || (ss > 0 && liveQty <= ss)
                        };
                    });

                    // Default view: only low stock, sorted by urgency
                    const lowOnly = enriched.filter(i => i.is_low_stock);
                    const sorted = lowOnly.sort((a, b) => {
                        const baseA = (a.reorder_point || a.safety_stock || 1);
                        const baseB = (b.reorder_point || b.safety_stock || 1);
                        const ratioA = baseA > 0 ? (a.current_stock / baseA) : 1;
                        const ratioB = baseB > 0 ? (b.current_stock / baseB) : 1;
                        if (ratioA !== ratioB) return ratioA - ratioB;
                        if (a.is_newly_added !== b.is_newly_added) return a.is_newly_added ? 1 : -1;
                        return a.name.localeCompare(b.name);
                    });
                    
                    const criticalAItems = sorted.filter(item => {
                        const cat = (item.abc_category || item.manual_abc_category || '').toString().toUpperCase();
                        return cat === 'A';
                    });
                    
                    setItems(sorted);
                    setCriticalItems(criticalAItems);
                    setVendors(vendorsRes.data || []);
                    
                    // Set minimal preferred vendors for fallback
                    const allVendors = vendorsRes.data || [];
                    const topWholesale = allVendors.filter(v => (v.category || v.vendor_category) === 'Wholesale')[0] || null;
                    const initialPreferred = [];
                    if (topWholesale) initialPreferred.push(withNormalizedCategory(topWholesale));
                    setPreferredVendors(initialPreferred);
                    
                    // Preselect items
                    const sel = {};
                    // Preselect from the final sorted low-stock list
                    sorted.forEach(x => { if ((x.reorder_qty || 0) > 0) sel[x.item_id] = true; });
                    setSelected(sel);
                    
                    console.log('✅ Fallback system loaded successfully');
                    
                } catch (fallbackError) {
                    console.error('❌ Both smart categorization and fallback failed:', fallbackError);
                    setError(fallbackError.message);
                }
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const addVendorDirectly = useCallback((vendor, categoryOverride = null) => {
        console.log('🟢 addVendorDirectly called with vendor:', vendor);
        const enriched = withNormalizedCategory(vendor, categoryOverride);
        console.log('🟢 Enriched vendor category:', enriched.normalizedCategoryKey, '/', enriched.normalizedCategoryLabel);

        setPreferredVendors(prev => {
            const list = Array.isArray(prev) ? prev : [];
            // Replace any existing vendor from the same normalized category
            const filtered = list.filter(v => (v.normalizedCategoryKey || '') !== enriched.normalizedCategoryKey);
            const newPreferred = [...filtered, enriched];
            const deduped = dedupeByCategory(newPreferred);
            console.log('🟢 Preferred vendors after add (count):', deduped.length, deduped.map(v => v.normalizedCategoryLabel));
            localStorage.setItem('preferredVendors', JSON.stringify(deduped));
            console.log('🟢 New preferred vendors:', deduped);
            return deduped;
        });
    }, [withNormalizedCategory, dedupeByCategory]);

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
        if (!searchTerm) return [];
        
        // Use smart search for better results - preserves priority ordering (prefix matches first)
        const searchResults = performSmartSearch(availableItems, searchTerm, ['name']);
        
        // Sort within each priority group to maintain search relevance while organizing by newly added status
        const startsWithTerm = searchResults.filter(item => 
            item.name.toLowerCase().startsWith(searchTerm.toLowerCase())
        );
        const containsTerm = searchResults.filter(item => 
            item.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !item.name.toLowerCase().startsWith(searchTerm.toLowerCase())
        );
        
        // Sort each group by newly added status, but preserve priority order
        const sortByNewlyAdded = (items) => items.sort((a, b) => {
            if (a.is_newly_added !== b.is_newly_added) {
                return a.is_newly_added ? 1 : -1;
            }
            return 0; // Preserve existing order within same newly_added status
        });
        
        const sortedStartsWith = sortByNewlyAdded([...startsWithTerm]);
        const sortedContains = sortByNewlyAdded([...containsTerm]);
        
        return [...sortedStartsWith, ...sortedContains].slice(0, 10);
    }, [searchTerm, availableItems, items]);

    const selectedItems = useMemo(() => {
        return items.filter(x => selected[x.item_id] && (x.reorder_qty || 0) > 0);
    }, [items, selected]);

    // Create a per-category bill image (PNG) using Canvas API
    const generateBillImage = useCallback((params) => {
        const { categoryLabel, vendor, items, notes, deliveryDate } = params;
        const pad = 36;
        const width = 1024;
        const baseHeader = 200;
        const rowH = 36;
        const footer = 80;
        const notesLines = (notes && notes.trim()) ? Math.min(6, Math.ceil(notes.trim().length / 60)) : 0;
        const height = baseHeader + (items.length + 2) * rowH + (notesLines ? (notesLines + 1) * rowH : 0) + footer;
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = Math.max(480, height);
        const ctx = canvas.getContext('2d');
        // background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        // header
        ctx.fillStyle = '#111827';
        ctx.font = '700 36px Arial';
        ctx.fillText('Purchase Order Draft', pad, pad + 20);
        ctx.font = '400 18px Arial';
        const nowStr = new Date().toLocaleString();
        ctx.fillText(`Generated: ${nowStr}`, pad, pad + 52);
        if (deliveryDate) {
            ctx.fillText(`Requested Delivery: ${deliveryDate}`, pad, pad + 78);
        }
        // category pill
        const catText = `Category: ${categoryLabel}`;
        ctx.font = '600 22px Arial';
        const catW = ctx.measureText(catText).width + 24;
        const catX = pad;
        const catY = pad + 112;
        ctx.fillStyle = '#f3f4f6';
        ctx.fillRect(catX, catY - 26, catW, 34);
        ctx.strokeStyle = '#e5e7eb';
        ctx.strokeRect(catX, catY - 26, catW, 34);
        ctx.fillStyle = '#111827';
        ctx.fillText(catText, catX + 12, catY);
        // vendor box
        const vX = pad;
        const vY = pad + 150;
        const vW = width - pad * 2;
        const vH = 60;
        ctx.fillStyle = '#f9fafb';
        ctx.fillRect(vX, vY, vW, vH);
        ctx.strokeStyle = '#e5e7eb';
        ctx.strokeRect(vX, vY, vW, vH);
        ctx.fillStyle = '#111827';
        ctx.font = '600 20px Arial';
        const vName = vendor?.name || 'Unassigned Vendor';
        ctx.fillText(`Vendor: ${vName}`, vX + 12, vY + 24);
        ctx.font = '400 16px Arial';
        const vLine2 = [vendor?.contact_phone, vendor?.contact_email].filter(Boolean).join(' · ');
        if (vLine2) ctx.fillText(vLine2, vX + 12, vY + 46);
        // table header
        let y = vY + vH + 32;
        ctx.font = '700 18px Arial';
        ctx.fillStyle = '#374151';
        ctx.fillText('#', pad, y);
        ctx.fillText('Item', pad + 40, y);
        ctx.fillText('Qty', width - pad - 180, y);
        ctx.fillText('Unit', width - pad - 80, y);
        y += 10;
        ctx.strokeStyle = '#e5e7eb';
        ctx.beginPath();
        ctx.moveTo(pad, y);
        ctx.lineTo(width - pad, y);
        ctx.stroke();
        y += 22;
        // table rows
        ctx.font = '400 17px Arial';
        ctx.fillStyle = '#111827';
        items.forEach((it, idx) => {
            const qtyVal = Number(it.reorder_qty || 0).toFixed(2);
            const unitVal = (it.unit || '').toString();
            ctx.fillText(String(idx + 1), pad, y);
            // item name with simple truncation
            const maxItemWidth = width - pad * 2 - 260;
            let name = (it.name || '').toString();
            while (ctx.measureText(name).width > maxItemWidth && name.length > 4) {
                name = name.slice(0, -1);
            }
            if (name.length < (it.name || '').length) name += '…';
            ctx.fillText(name, pad + 40, y);
            ctx.fillText(qtyVal, width - pad - 180, y);
            ctx.fillText(unitVal, width - pad - 80, y);
            y += rowH;
        });
        // notes
        if (notes && notes.trim()) {
            y += 8;
            ctx.strokeStyle = '#e5e7eb';
            ctx.beginPath();
            ctx.moveTo(pad, y);
            ctx.lineTo(width - pad, y);
            ctx.stroke();
            y += 28;
            ctx.font = '700 18px Arial';
            ctx.fillStyle = '#374151';
            ctx.fillText('Notes', pad, y);
            y += 26;
            ctx.font = '400 16px Arial';
            ctx.fillStyle = '#111827';
            const words = notes.trim().split(/\s+/);
            let line = '';
            const maxW = width - pad * 2;
            for (let i = 0; i < words.length; i++) {
                const test = line ? line + ' ' + words[i] : words[i];
                if (ctx.measureText(test).width > maxW) {
                    ctx.fillText(line, pad, y);
                    y += rowH;
                    line = words[i];
                } else {
                    line = test;
                }
            }
            if (line) {
                ctx.fillText(line, pad, y);
                y += rowH;
            }
        }
        return canvas.toDataURL('image/png');
    }, []);

    const [draftSuccessInfo, setDraftSuccessInfo] = useState(null);

    const handleSaveDraft = useCallback(() => {
        try {
            const chosen = items.filter(x => selected[x.item_id] && (x.reorder_qty || 0) > 0);
            if (chosen.length === 0) {
                setError('Please select at least one item before saving draft.');
                return;
            }
            // group by vendor category
            const groups = new Map(); // key -> { label, items: [] }
            chosen.forEach(it => {
                const rawCat = it.smart_vendor_category || it.vendor_category || it.category || 'wholesale';
                const { key, label } = canonicalizeVendorCategory(rawCat);
                const g = groups.get(key) || { key, label, items: [] };
                g.items.push(it);
                groups.set(key, g);
            });
            const ts = new Date();
            const tsName = ts.toISOString().replace(/[:T]/g, '-').split('.')[0];
            const savedMeta = [];
            const filesForSave = [];
            groups.forEach(g => {
                // find matching vendor from preferred vendors, fallback to any vendor with same category
                const pv = preferredVendors.find(v => (v.normalizedCategoryKey || '').toString() === g.key) ||
                           vendors.find(v => (v.vendor_category || v.category || '').toString().toLowerCase().includes(g.key));
                const dataUrl = generateBillImage({
                    categoryLabel: g.label,
                    vendor: pv,
                    items: g.items,
                    notes: orderNotes || '',
                    deliveryDate: requestedDeliveryDate || ''
                });
                const filename = `PO_Draft_${g.label}_${tsName}.png`;
                // prepare File for share/save APIs
                try {
                    const file = dataUrlToFile(filename, dataUrl);
                    filesForSave.push(file);
                } catch {}
                savedMeta.push({
                    categoryKey: g.key,
                    categoryLabel: g.label,
                    vendorId: pv?.vendor_id || null,
                    vendorName: pv?.name || null,
                    filename,
                    dataUrl,
                    createdAt: ts.toISOString()
                });
            });
            // persist draft and images metadata
            const draftPayload = {
                items: chosen.map(i => ({ item_id: i.item_id, name: i.name, reorder_qty: i.reorder_qty, unit: i.unit, category: i.smart_vendor_category || i.vendor_category || i.category || 'wholesale' })),
                notes: orderNotes || '',
                requestedDeliveryDate: requestedDeliveryDate || '',
                preferredVendors: preferredVendors || [],
                savedAt: ts.toISOString()
            };
            localStorage.setItem('reorderDraft', JSON.stringify(draftPayload));
            const prevBills = JSON.parse(localStorage.getItem('reorderDraftBills') || '[]');
            localStorage.setItem('reorderDraftBills', JSON.stringify([...(Array.isArray(prevBills) ? prevBills : []), ...savedMeta]));
            // Try best-effort auto save depending on environment
            (async () => {
                const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
                const canShareFiles = !!(navigator.canShare && filesForSave.length && navigator.canShare({ files: [filesForSave[0]] }));
                const canPickDir = typeof window.showDirectoryPicker === 'function';

                try {
                    if (isMobile && canShareFiles) {
                        // Share each image; user can pick Photos/WhatsApp/etc.
                        for (const f of filesForSave) {
                            await navigator.share({ files: [f], title: 'Purchase Order Draft', text: 'Category-wise PO Draft' });
                        }
                        setDraftSuccessInfo({ mode: 'shared', count: savedMeta.length });
                        return;
                    }
                    if (!isMobile && canPickDir) {
                        // Ask user to choose a save folder (e.g., Pictures), then write files
                        const dir = await window.showDirectoryPicker({ mode: 'readwrite' });
                        for (const f of filesForSave) {
                            const fileHandle = await dir.getFileHandle(f.name, { create: true });
                            const writable = await fileHandle.createWritable();
                            await writable.write(await f.arrayBuffer());
                            await writable.close();
                        }
                        setDraftSuccessInfo({ mode: 'folder', count: savedMeta.length });
                        return;
                    }
                } catch (e) {
                    // fall through to download fallback
                    console.warn('Auto-save via Share/FS failed, falling back to downloads:', e);
                }

                // Fallback: trigger standard downloads for each image
                savedMeta.forEach(meta => {
                    const a = document.createElement('a');
                    a.href = meta.dataUrl;
                    a.download = meta.filename;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                });
                setDraftSuccessInfo({ mode: 'download', count: savedMeta.length });
            })();
        } catch (err) {
            console.error('Save draft failed:', err);
            setError('Failed to save draft.');
        }
    }, [items, selected, canonicalizeVendorCategory, preferredVendors, vendors, generateBillImage, orderNotes, requestedDeliveryDate]);

    const handleCreateReorder = async () => {
        if (selectedItems.length === 0) {
            setError('Please select at least one item to reorder');
            return;
        }

        setCreating(true);
        setError(null);

        try {
            if (preferredVendors.length === 0) {
                throw new Error('No preferred vendors available. Please add vendors to your preferred list first.');
            }

            console.log('\n  PREFERRED VENDORS ONLY ORDER DISTRIBUTION');
            console.log(`  Total items to order: ${selectedItems.length}`);
            console.log(`🏪 Available preferred vendors: ${preferredVendors.length}`);

            // Acquire tenant once for entire reorder creation flow
            const tenant = getTenant();
            if (!tenant) throw new Error('Tenant not set. Cannot create reorder.');

            let orderResults = [];
            let totalOrderCount = 0;

            // Category-based distribution
            for (let i = 0; i < preferredVendors.length; i++) {
                const vendor = preferredVendors[i];
                const vendorCategoryKey = (vendor.normalizedCategoryKey || vendor.category || vendor.vendor_category || 'wholesale')
                    .toString().trim().toLowerCase();

                const vendorItems = selectedItems.filter(item => {
                    const itemCategory = (item.smart_vendor_category || 'wholesale').toString().trim().toLowerCase();
                    return itemCategory === vendorCategoryKey;
                });

                if (vendorItems.length === 0) continue;

                const orderData = {
                    businessId: tenant,
                    vendorId: vendor.vendor_id,
                    selectedItems: vendorItems.map(item => ({
                        itemId: item.item_id,
                        orderQuantity: item.reorder_qty,
                        notes: `Smart categorization: ${item.smart_vendor_category || 'wholesale'}. Current: ${item.current_stock || 'N/A'}, ROP: ${item.reorder_point || 'N/A'}`
                    })),
                    orderNotes: `${orderNotes || ''}\n\nSmart categorized order for ${vendorCategoryKey} vendor. Items: ${vendorItems.map(i => i.name).join(', ')}`.trim(),
                    requestedDeliveryDate,
                    createdBy: 1
                };

                try {
                    const result = await http.post('/reorder/create-purchase-order', orderData).catch(e => ({ success:false, error:e.message }));
            if (result?.success) {
                        orderResults.push({
                            vendor: vendor.name,
                            vendorId: vendor.vendor_id,
                            category: vendor.vendor_category || vendor.category || vendorCategoryKey,
                            poNumber: result.purchaseOrder?.poNumber,
                itemCount: vendorItems.length
                        });
                        totalOrderCount++;
                    }
                } catch (err) {
                    // continue
                }
            }

            // Fallback: broadcast same order to all preferred vendors
            if (orderResults.length === 0) {
                console.log('\n🔄 FALLING BACK TO MULTI-VENDOR BROADCAST MODE');
                orderResults = [];
                totalOrderCount = 0;

                for (let i = 0; i < preferredVendors.length; i++) {
                    const vendor = preferredVendors[i];
                    const orderData = {
                        businessId: tenant,
                        vendorId: vendor.vendor_id,
                        selectedItems: selectedItems.map(item => ({
                            itemId: item.item_id,
                            orderQuantity: item.reorder_qty,
                            notes: `Reorder due to low stock. Current: ${item.current_stock || 'N/A'}, ROP: ${item.reorder_point || 'N/A'}`
                        })),
                        orderNotes: `${orderNotes || ''}\n\nMulti-vendor order - sent to all preferred vendors (${selectedItems.map(i => i.name).join(', ')})`.trim(),
                        requestedDeliveryDate,
                        createdBy: 1
                    };

                    try {
                        const result = await http.post('/reorder/create-purchase-order', orderData).catch(e => ({ success:false, error:e.message }));
            if (result?.success) {
                            orderResults.push({
                                vendor: vendor.name,
                                vendorId: vendor.vendor_id,
                                category: vendor.vendor_category || vendor.category || 'All',
                                poNumber: result.purchaseOrder?.poNumber,
                itemCount: selectedItems.length
                            });
                            totalOrderCount++;
                        }
                    } catch (err) {
                        // continue
                    }
                }
            }

            if (orderResults.length === 0) {
                throw new Error('Failed to create orders for any preferred vendors');
            }

            // Final success info
            setSuccessInfo({
                poNumber: orderResults.map(r => r.poNumber).join(', '),
                totalAmount: orderResults.length > 1 ? 'Multiple Orders' : 'Single Order',
                itemCount: orderResults.reduce((total, r) => total + r.itemCount, 0),
                orderCount: totalOrderCount,
                vendorBreakdown: orderResults
            });

            console.log('🎉 All purchase orders created successfully:', orderResults);
        } catch (e) {
            console.error('Error creating reorder:', e);
            setError(e.message || 'Failed to create reorder');
        } finally {
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
            <StandardScrollStyles />
            
            {/* Header */}
            <div className="cr-header">
            <div onClick={onNavigateBack} style={{ cursor: 'pointer' }}>
                <ArrowLeft size={24} />
            </div>
                <h1>Create Reorder</h1>
            </div>

            {loading && (
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 'calc(100vh - 140px)',
                    background: '#fafbfc',
                    margin: 0,
                    padding: 0
                }}>
                    <div style={{ fontSize: 24, fontWeight: 600, color: '#222', marginBottom: 16 }}>Create Reorder...</div>
                    <div className="cr-loader" style={{ width: 48, height: 48, border: '6px solid #e5e7eb', borderTop: '6px solid #2196f3', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    <style>{`@keyframes spin { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }`}</style>
                </div>
            )}
            
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
                            
                            {/* WhatsApp integration removed */}
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

            {/* Save Draft Success Modal */}
            {draftSuccessInfo && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
                }}>
                    <div style={{
                        width: 'min(380px, 90vw)', background: '#fff', borderRadius: 12,
                        boxShadow: '0 8px 32px rgba(0,0,0,0.12)', padding: '24px',
                        textAlign: 'center'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                            <div style={{
                                width: '60px', height: '60px', borderRadius: '50%', border: '3px solid #22c55e',
                                backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Check size={36} color="#22c55e" strokeWidth={3} />
                            </div>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: '600', marginBottom: '8px', color: '#1f2937' }}>
                            Draft Saved Successfully
                        </div>
                        <div style={{ color: '#4b5563', fontSize: '13px', marginBottom: '16px' }}>
                            {draftSuccessInfo.count || 0} image(s) {draftSuccessInfo.mode === 'shared' ? 'shared' : draftSuccessInfo.mode === 'folder' ? 'saved' : 'downloaded'}
                        </div>
                        <button
                            onClick={() => setDraftSuccessInfo(null)}
                            style={{
                                padding: '10px 24px', backgroundColor: '#22c55e', color: '#fff', border: 'none',
                                borderRadius: '8px', fontSize: '14px', fontWeight: '600', cursor: 'pointer'
                            }}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}

            {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}

            {!loading && !error && (
                <>
                    {/* Critical Low Stock Items */}
                    <div className="cr-section">
                        <h2 className="cr-section-title">
                            Critical Low Stock Items 
                            {criticalItems.length > 0 && (
                                <span style={{ 
                                    color: '#dc2626', 
                                    fontSize: '14px', 
                                    fontWeight: '700',
                                    marginLeft: '8px',
                                    textTransform: 'uppercase'
                                }}>
                                    ({criticalItems.length} ITEMS NEED IMMEDIATE ATTENTION)
                                </span>
                            )}
                        </h2>
                        <div className="cr-low-stock-card">
                            {criticalItems.map(item => {
                                const stockLevel = Number(item.current_stock || 0);
                                const qty = formatQtyWithWords(stockLevel, item.unit);
                                // Determine severity based on closeness to minimal stock
                                const minimalBase = Number(item.reorder_point ?? item.minimum_stock_level ?? item.safety_stock ?? 0);
                                const ratio = minimalBase > 0 ? (stockLevel / minimalBase) : 0; // 1.0 = exactly at minimal
                                // Thresholds: tweakable based on business preference
                                const RED_THRESHOLD = 0.85;    // <=85% of minimal -> Red (more urgent)
                                const YELLOW_THRESHOLD = 1.0;  // (85%, 100%] of minimal -> Yellow (near minimal, ~2-3 days)
                                const isRed = ratio <= RED_THRESHOLD;
                                const isYellow = !isRed && ratio <= YELLOW_THRESHOLD;
                                return (
                                    <div
                                        key={item.item_id}
                                        className={`cr-low-row ${isRed ? 'cr-critical-bg' : 'cr-warning-bg'}`}
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => {
                                            if (typeof goTo === 'function') {
                                                goTo('abc');
                                            } else {
                                                // fallback: set a global event or use window.location hash
                                                window.dispatchEvent(new CustomEvent('navigate', { detail: { screen: 'abc' } }));
                                            }
                                        }}
                                    >
                                        <div className="cr-item-name-wrapper">
                                            <div className={`cr-dot ${isRed ? 'cr-critical-dot' : 'cr-warning-dot'}`}></div>
                                            <p className="cr-low-simple-name">{item.name}</p>
                                        </div>
                                        <div className={`cr-low-simple-qty ${isRed ? 'cr-critical-text' : 'cr-warning-text'}`}>{qty.value} {qty.unit}</div>
                                    </div>
                                );
                            })}
                            {criticalItems.length === 0 && (
                                <div style={{ 
                                    padding: '32px 16px', 
                                    textAlign: 'center', 
                                    color: 'var(--secondary-text)',
                                    backgroundColor: '#f8fafc',
                                    borderRadius: '8px',
                                    border: '2px dashed #e2e8f0'
                                }}>
                                    <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
                                    <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px', color: '#059669' }}>
                                        Great News!
                                    </div>
                                    <div style={{ fontSize: '14px' }}>
                                        No critical A-category items are currently low on stock
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Preferred Vendors */}
                    <div className="cr-section">
                        <h2 className="cr-section-title" style={{ margin: '0 0 12px -16px', padding: 0, textAlign: 'left' }}>Preferred Vendors</h2>
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
                            onClick={() => onNavigateToVendor && onNavigateToVendor('All')}
                        >
                            <Plus size={20} />
                            Add Vendors
                        </button>
                    </div>

                    {/* Order Items */}
                    <div className="cr-section">
                        <h2 className="cr-section-title" style={{ margin: '0 0 12px -16px', padding: 0, textAlign: 'left' }}>Order Items</h2>
                        <div className="cr-order-list-container" style={standardScrollStyles}>
                            {items.map(item => {
                                // Removed 'Recommended' severity logic and badge
                                return (
                                <div key={item.item_id} className="cr-order-item-card" data-item-id={item.item_id} style={{ position: 'relative' }}>
                                    {/* Newly badge if item.is_newly_added */}
                                    {item.is_newly_added && (
                                        <div style={{
                                            position: 'absolute',
                                            top: 5,
                                            right: 5,
                                            background: '#fff',
                                            color: 'rgb(150 91 250)',
                                            border: '2px solid rgb(150 91 250)',
                                            borderRadius: 6,
                                            padding: '2px 12px',
                                            fontSize: 12,
                                            fontWeight: 700,
                                            zIndex: 2,
                                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)'
                                        }}>
                                            New
                                        </div>
                                    )}
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', marginBottom: '4px', gap: 8 }}>
                                            <p className="cr-item-name" style={defaultTextSizes}>{item.name}</p>
                                            {/* Removed Recommended badge */}
                                            {/* Removed extra orange 'NEWLY ADDED ITEM' badge */}
                                        </div>
                                        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'nowrap', minWidth: 0 }}>
                                            <span className="cr-item-stock" style={{ ...defaultTextSizes, fontSize: '0.9em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                Current stock: {Number(item.current_stock).toFixed(1)} {String(item.unit).replace(/Kilogram/i, 'kg').replace(/Gram/i, 'g').replace(/Liter/i, 'L').replace(/Milliliter/i, 'ml')}
                                            </span>
                                            <span className="cr-item-stock" style={{ ...defaultTextSizes, fontSize: '0.9em', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                Minimal stock: {Number(item.reorder_point ?? item.minimum_stock_level ?? 0).toFixed(1)} {String(item.unit).replace(/Kilogram/i, 'kg').replace(/Gram/i, 'g').replace(/Liter/i, 'L').replace(/Milliliter/i, 'ml')}
                                            </span>
                                        </div>
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
                            )})}
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
                                    <div className="cr-inline-add-list" style={standardScrollStyles}>
                                        {filteredAvailableItems.length > 0 ? (
                                            filteredAvailableItems.map(item => {
                                                const isInOrder = items.find(x => x.item_id === item.item_id);
                                                
                                                return (
                                                    <div
                                                        key={item.item_id}
                                                        className="cr-inline-add-item"
                                                        onClick={() => addItemToOrder(item)}
                                                    >
                                                        <span style={defaultTextSizes}>
                                                            {searchTerm 
                                                                ? highlightMatch(item.name, searchTerm)
                                                                : item.name
                                                            }
                                                            {isInOrder && (
                                                                <small style={{ color: '#ff9800', marginLeft: '8px', ...defaultTextSizes }}>
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
                            <h2 className="cr-section-title" style={{ margin: '0 0 12px -16px', padding: 0, textAlign: 'left' }}>Order Summary</h2>
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
                                        Category-Based Assignment:
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
                    {/* <div className="cr-section">
                        <h2 className="cr-section-title" style={{ margin: '0 0 12px -16px', padding: 0, textAlign: 'left' }}>Order Details</h2>
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
                    </div> */}

                    {/* Action Buttons */}
                    <div className="cr-actions">
                        <button 
                            className="cr-draft-btn"
                            onClick={handleSaveDraft}
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

// Utilities
function dataUrlToFile(filename, dataUrl) {
    const [meta, content] = dataUrl.split(',');
    const mimeMatch = /data:(.*?);base64/.exec(meta);
    const mime = mimeMatch ? mimeMatch[1] : 'image/png';
    const bin = atob(content);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
}
