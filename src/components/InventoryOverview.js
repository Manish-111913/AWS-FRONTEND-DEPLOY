import React, { useState, useEffect, useCallback, useRef } from 'react';
import StockInForm from './StockInForm';
import BillScanner from './BillScanner';
import OCRTest from './OCRTest';
import { IoChevronDown } from 'react-icons/io5';
import './InventoryOverview-module.css';
import { http, categorizeError } from '../services/apiClient';
import StockOutForm from './StockOutForm';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFilter, faAngleDown, faAngleUp, faTrashCan } from '@fortawesome/free-solid-svg-icons';
import { StandardSearch, StandardScrollStyles, highlightMatch, standardTextSizes } from '../styles/standardStyles';
import TruckLoader from './TruckLoader';


// API calls now use centralized api client
const InventoryOverview = ({ goTo, initialTab = 'overview' }) => {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [searchTerm, setSearchTerm] = useState('');
  const searchInputRef = useRef(null);
  const [currentFilter, setCurrentFilter] = useState('expiry-nearest');
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  // First-load truck loader state
  const [showTruckLoader, setShowTruckLoader] = useState(true);
  const [truckLeaving, setTruckLeaving] = useState(false);
  const truckMinTimeReachedRef = useRef(false);

  // Search handlers
  const clearSearch = () => {
    setSearchTerm('');
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Real-time refs and state
  const intervalRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastFetchTime = useRef(0);
  const mountedRef = useRef(true);
  
  // Connection failure tracking for exponential backoff
  const connectionFailures = useRef(0);
  const maxFailures = 3;
  const baseInterval = 5000; // 5 seconds
  const maxInterval = 60000; // 1 minute

  // Stock in sub-tab state
  const [stockInTab, setStockInTab] = useState('scan');
  // Auto-correct is now always on (backend Google AI). Removed toggle UI.
  // OCR data state
  const [ocrData, setOcrData] = useState(null);
  const [showStockInForm, setShowStockInForm] = useState(false);

  // Expanded cards state
  const [expandedCards, setExpandedCards] = useState(new Set());

  // State for batch details
  const [batchDetails, setBatchDetails] = useState({});
  const [loadingBatches, setLoadingBatches] = useState(new Set());
  const [batchErrors, setBatchErrors] = useState({}); // itemId -> error message 
  // Auto-update state (commented out unused variables)
  // const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  // const [autoUpdateEnabled, setAutoUpdateEnabled] = useState(true);
  // Filter dropdown state
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const filterDropdownRef = useRef(null);
  // Debounced search
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const searchTimeoutRef = useRef(null);
  
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchTerm]);
  // Optimized fetch with abort controller and caching
  const fetchInventoryData = useCallback(async (showLoader = false, forceRefresh = false) => {
    // Allow force refresh to bypass debouncing
    if (!forceRefresh) {
      // Prevent duplicate requests with shorter interval
      const now = Date.now();
      if (now - lastFetchTime.current < 500) return;
      lastFetchTime.current = now;
    }
    
    // Cancel previous request only if not force refresh
    if (abortControllerRef.current && !forceRefresh) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    try {
      if (showLoader) setIsLoading(true);
      setError(null);
      const result = await http.get('/stock-in/inventory/overview', {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' },
        signal: abortControllerRef.current.signal,
      });
      
      // Handle null response (cancelled requests)
      if (result === null) {
        console.log('Request was cancelled - keeping existing inventory data');
        return;
      }
      
      if (result.success && result.data) {
        // Process the data with real-time calculations and automatic updates
        let processedData = result.data.map(item => {
          const now = new Date();
          const expiryDate = item.expiry_date ? new Date(item.expiry_date) : null;
          const daysToExpiry = expiryDate ? Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24)) : 999;        
          // Automatic status calculation
          let autoStatus = 'Good';
          let urgencyLevel = 'normal';
          
          if (daysToExpiry < 0) {
            autoStatus = 'Expired';
            urgencyLevel = 'critical';
          } else if (daysToExpiry === 0) {
            autoStatus = 'Expires Today';
            urgencyLevel = 'critical';
          } else if (daysToExpiry === 1) {
            autoStatus = 'Expires Tomorrow';
            urgencyLevel = 'urgent';
          } else if (daysToExpiry <= 3) {
            autoStatus = `Expires in ${daysToExpiry} days`;
            urgencyLevel = 'urgent';
          } else if (daysToExpiry <= 7) {
            autoStatus = `Expires in ${daysToExpiry} days`;
            urgencyLevel = 'warning';
          } else if (daysToExpiry <= 30) {
            autoStatus = 'Fresh';
            urgencyLevel = 'normal';
          }
          // Automatic stock level calculation
          const quantity = parseFloat(item.quantity) || 0;
          const minStock = item.minimum_stock_level || 0;
          const maxStock = item.maximum_stock_level || 0;        
          let stockStatus = 'adequate';
          if (quantity <= 0) {
            stockStatus = 'out-of-stock';
          } else if (quantity <= minStock) {
            stockStatus = 'low';
          } else if (maxStock > 0 && quantity >= maxStock) {
            stockStatus = 'overstocked';
          }
          return {
            id: item.item_id,
            name: item.item_name,
            quantity: quantity,
            unit: item.unit || 'units',
            category: item.category || 'Uncategorized',
            status: autoStatus,
            expiryDate: item.expiry_date,
            daysToExpiry: daysToExpiry,
            stockLevel: stockStatus,
            batchNumber: item.batch_number || 'N/A',
            lastUpdated: new Date().toISOString(), // Always current time for real-time feel
            minStock: minStock,
            maxStock: maxStock,
            urgencyLevel: urgencyLevel,
            isExpired: daysToExpiry < 0,
            isExpiringSoon: daysToExpiry <= 3 && daysToExpiry >= 0,
            isFresh: daysToExpiry > 7,
            // FIFO information
            fifoStatus: daysToExpiry <= 7 ? 'USE FIRST' : 'NORMAL',
            procuredDate: item.received_date || item.created_at,
            supplier: item.supplier || item.supplier_name || item.vendor || item.vendor_name || 'N/A',
            // Additional fields for filters
            unitCost: Number(item.unit_cost || 0),
            createdAt: item.created_at ? new Date(item.created_at) : null,
            isNewlyAdded: item.is_newly_added === true
          };
        });
        // Removal strategy for expired items:
        // 1. Automatic purge of any item whose expiry is more than 5 days in the past (daysToExpiry < -5)
        // 2. When a new batch for an expired item arrives (handled server-side), the old expired batch
        //    should be removed; here we simply ensure we do not display the stale expired >5d items.
        processedData = processedData.filter(it => it.daysToExpiry >= -5);

        // Consumable filtering: prefer explicit backend flag when present among any items; otherwise fallback heuristic.
        const anyFlagged = processedData.some(it => it.is_consumable === true || it.isConsumable === true || it.consumable === true);
        if (anyFlagged) {
          processedData = processedData.filter(it => (it.is_consumable === true) || (it.isConsumable === true) || (it.consumable === true));
        } else {
          const consumableKeywords = ['veg', 'vegetable', 'fruit', 'meat', 'dairy', 'beverage', 'spice', 'herb', 'grain', 'oil', 'condiment', 'seafood'];
          processedData = processedData.filter(it => {
            const cat = (it.category || '').toLowerCase();
            return consumableKeywords.some(k => cat.includes(k));
          });
        }

        setInventoryItems(processedData);
        
        // Reset failure count on success
        connectionFailures.current = 0;
      } else if (result !== null) {
        // Only throw error if result is not null (not a cancelled request)
        throw new Error((result && result.error) || 'Invalid response format');
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      
      // Special handling for null response errors
      if (error.message && error.message.includes('Cannot read properties of null')) {
        console.log('Null response detected - request was likely cancelled');
        return; // Exit early, don't update error state
      }
      
      if (errorInfo.type !== 'cancelled' && errorInfo.type !== 'circuit_breaker') {
        // Increment failure count
        connectionFailures.current++;
        
        console.error('Error fetching inventory data:', errorInfo.message);
        
        // Set user-friendly error message
        let userMessage = errorInfo.userFriendly ? errorInfo.message : `Failed to load inventory data: ${errorInfo.message}`;
        setError(userMessage);

        // Keep existing data on error
        if (inventoryItems.length === 0) {
          setInventoryItems([]);
        }
      } else if (errorInfo.type === 'circuit_breaker') {
        console.log('Circuit breaker is open - inventory polling paused');
        setError('Backend server is temporarily unavailable. Polling paused temporarily.');
        connectionFailures.current = maxFailures; // Max out failures for circuit breaker
      }
    } finally {
      if (showLoader) setIsLoading(false);
    }
  }, [inventoryItems.length]);

  // Setup real-time updates with minimal latency
  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchInventoryData(true);

    // Setup high-frequency real-time updates for minimal latency
    const startRealTimeUpdates = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Dynamic interval based on inventory urgency and connection failures
      const updateInterval = () => {
        // If we have connection failures, use exponential backoff
        if (connectionFailures.current > 0) {
          const backoffMultiplier = Math.min(Math.pow(2, connectionFailures.current), maxInterval / baseInterval);
          const backoffInterval = baseInterval * backoffMultiplier;
          console.log(`Using exponential backoff: ${backoffInterval}ms (failures: ${connectionFailures.current})`);
          return backoffInterval;
        }
        
        // Normal operation: dynamic interval based on urgency
        const hasUrgentItems = inventoryItems.some(item => 
          item.daysToExpiry <= 1 || item.stockLevel === 'low'
        );
        return hasUrgentItems ? 2000 : 5000; // 2s for urgent, 5s for normal
      };

      intervalRef.current = setInterval(() => {
        if (!mountedRef.current) return;
        fetchInventoryData(false);
      }, updateInterval());
    };

    startRealTimeUpdates();
    // Cleanup
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [fetchInventoryData]);

  // Manual refresh function for external use  
  const forceRefresh = useCallback(() => {
    console.log('🔄 Force refreshing inventory overview after manual entry');
    // Clear previous abort controller to prevent conflicts
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    // Reset failure count and fetch with force refresh
    connectionFailures.current = 0;
    fetchInventoryData(false, true); // Force refresh without showing loader
  }, [fetchInventoryData]);

  // Expose refresh function globally for other components
  useEffect(() => {
    window.refreshInventoryOverview = forceRefresh;
    
    // Listen for manual entry events
    const handleManualEntry = (event) => {
      console.log('📝 Manual entry detected - refreshing inventory', event);
      // Longer delay to ensure backend processing is complete
      setTimeout(() => {
        console.log('📝 Executing delayed refresh after manual entry');
        forceRefresh();
      }, 1000);
    };
    
    window.addEventListener('manualEntryAdded', handleManualEntry);
    
    return () => {
      window.removeEventListener('manualEntryAdded', handleManualEntry);
      delete window.refreshInventoryOverview;
    };
  }, [forceRefresh]);

  // Hide the truck loader once initial data (or an error) arrives
  // Ensure the truck animation runs at least 4s before leaving
  useEffect(() => {
    if (!showTruckLoader) return;
    const timer = setTimeout(() => {
      truckMinTimeReachedRef.current = true;
      // If data already loaded, initiate exit now
      if (!isLoading) {
        setTruckLeaving(true);
        const t2 = setTimeout(() => setShowTruckLoader(false), 1300);
        return () => clearTimeout(t2);
      }
    }, 4000); // Changed from 5000 to 4000 (4 seconds)
    return () => clearTimeout(timer);
  }, [showTruckLoader, isLoading]);

  // When data loads after the 5s gate, start the drive-out
  useEffect(() => {
    if (!isLoading && showTruckLoader && truckMinTimeReachedRef.current) {
      setTruckLeaving(true);
      const t = setTimeout(() => setShowTruckLoader(false), 1300);
      return () => clearTimeout(t);
    }
  }, [isLoading, showTruckLoader]);

  // Real-time clock for automatic expiry calculations (commented out due to unused variables)
  /*
  useEffect(() => {
    const clockInterval = setInterval(() => {
      setLastUpdateTime(new Date());
      // Recalculate expiry status for all items automatically
      if (inventoryItems.length > 0 && autoUpdateEnabled) {
        const updatedItems = inventoryItems.map(item => {
          if (!item.expiryDate) return item;
          
          const now = new Date();
          const expiryDate = new Date(item.expiryDate);
          const daysToExpiry = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
          
          let autoStatus = 'Good';
          let urgencyLevel = 'normal';

          if (daysToExpiry < 0) {
            autoStatus = 'Expired';
            urgencyLevel = 'critical';
          } else if (daysToExpiry === 0) {
            autoStatus = 'Expires Today';
            urgencyLevel = 'critical';
          } else if (daysToExpiry === 1) {
            autoStatus = 'Expires Tomorrow';
            urgencyLevel = 'urgent';
          } else if (daysToExpiry <= 3) {
            autoStatus = `Expires in ${daysToExpiry} days`;
            urgencyLevel = 'urgent';
          } else if (daysToExpiry <= 7) {
            autoStatus = `Expires in ${daysToExpiry} days`;
            urgencyLevel = 'warning';
          }
          return {
            ...item,
            daysToExpiry,
            status: autoStatus,
            urgencyLevel,
            fifoStatus: daysToExpiry <= 7 ? 'USE FIRST' : 'NORMAL',
            isExpired: daysToExpiry < 0,
            isExpiringSoon: daysToExpiry <= 3 && daysToExpiry >= 0
          };
        });    
  // Purge items expired more than 5 days ago
  const purged = updatedItems.filter(it => it.daysToExpiry >= -5);
  setInventoryItems(purged);
      }
    }, 60000); // Update every minute for real-time expiry calculations

    return () => clearInterval(clockInterval);
  }, [inventoryItems, autoUpdateEnabled]);
  */
  // Optimized filtering and searching with memoization
  useEffect(() => {
    let filtered = [...inventoryItems];
    // Apply search filter - ONLY search by item name with priority ordering
    if (debouncedSearchTerm) {
      const searchLower = debouncedSearchTerm.toLowerCase().trim();
      // Priority 1: Items that start with the search term (exact prefix match)
      const startsWithMatches = filtered.filter(item => 
        item.name && item.name.toLowerCase().startsWith(searchLower)
      );
      // Priority 2: Items that contain the search term but don't start with it
      const containsMatches = filtered.filter(item => 
        item.name && 
        item.name.toLowerCase().includes(searchLower) && 
        !item.name.toLowerCase().startsWith(searchLower)
      );
      // Combine results with priority order
      filtered = [...startsWithMatches, ...containsMatches];
    }

    // Apply sorting based on current filter ONLY if no search term is active
    if (!debouncedSearchTerm) {
      if (currentFilter === 'expiry-nearest') {
        filtered.sort((a, b) => {
          if (a.daysToExpiry === b.daysToExpiry) {
            return a.name.localeCompare(b.name);
          }
          return a.daysToExpiry - b.daysToExpiry;
        });
      } else if (currentFilter === 'quantity-high-low') {
        filtered.sort((a, b) => {
          if (a.quantity === b.quantity) {
            return a.name.localeCompare(b.name);
          }
          return b.quantity - a.quantity;
        });
      } else if (currentFilter === 'quantity-low-high') {
        filtered.sort((a, b) => {
          if (a.quantity === b.quantity) {
            return a.name.localeCompare(b.name);
          }
          return a.quantity - b.quantity;
        });
      } else if (currentFilter === 'cost-high-low') {
        filtered.sort((a, b) => {
          if (a.unitCost === b.unitCost) return a.name.localeCompare(b.name);
          return b.unitCost - a.unitCost;
        });
      } else if (currentFilter === 'cost-low-high') {
        filtered.sort((a, b) => {
          if (a.unitCost === b.unitCost) return a.name.localeCompare(b.name);
          return a.unitCost - b.unitCost;
        });
      } else if (currentFilter === 'newly-added') {
        // Newest created first; items lacking createdAt go last
        filtered.sort((a, b) => {
          const atA = a.createdAt ? a.createdAt.getTime() : -Infinity;
          const atB = b.createdAt ? b.createdAt.getTime() : -Infinity;
          if (atA === atB) {
            // Prefer isNewlyAdded true items if timestamps tie or missing
            if (a.isNewlyAdded !== b.isNewlyAdded) return (a.isNewlyAdded ? -1 : 1);
            return a.name.localeCompare(b.name);
          }
          return atB - atA;
        });
      } else if (currentFilter === 'category') {
        filtered.sort((a, b) => {
          if (a.category === b.category) {
            return a.name.localeCompare(b.name);
          }
          return a.category.localeCompare(b.category);
        });
      }
    }

    setFilteredItems(filtered);
  }, [debouncedSearchTerm, currentFilter, inventoryItems]);

  // Manual refresh with loading state
  const handleRefresh = useCallback(() => {
    // Clear batch details cache on manual refresh
    setBatchDetails({});
    setLoadingBatches(new Set());
    
    // Clear expanded cards to force fresh batch data on re-expansion
    setExpandedCards(new Set());
    
    fetchInventoryData(true);
  }, [fetchInventoryData]);

  // Handle filter dropdown toggle
  const toggleFilterDropdown = useCallback(() => {
    setShowFilterDropdown(prev => !prev);
  }, []);

  // Handle filter option selection
  const handleFilterSelect = useCallback((selectedFilter) => {
    setCurrentFilter(selectedFilter);
    setShowFilterDropdown(false);
  }, []);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(event.target)) {
        setShowFilterDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Fetch batch details for an item
  const fetchBatchDetails = useCallback(async (itemId, forceRefresh = false) => {
    if (!forceRefresh && (batchDetails[itemId] || loadingBatches.has(itemId))) {
      return; // Already loaded or loading
    }

    setLoadingBatches(prev => new Set(prev).add(itemId));

  try {
  const result = await http.get(`/inventory/items/${itemId}/batches`);

      if (result.success) {
        const processedBatches = result.data.map((batch, index) => {
          const displayBatchNo = (batch.invoice_reference && String(batch.invoice_reference).trim().length > 0)
            ? String(batch.invoice_reference).trim()
            : `#${batch.batch_id}`;
          const supplierName = batch.supplier || batch.supplier_name || batch.vendor || batch.vendor_name || 'N/A';

          return {
            id: batch.batch_id,
            batchNumber: displayBatchNo,
            quantity: parseFloat(batch.quantity) || 0,
            unit: batch.unit || 'units',
            procuredDate: batch.procured_date ? new Date(batch.procured_date).toLocaleDateString('en-US') : 'N/A',
            expiryDate: batch.expiry_date ? new Date(batch.expiry_date).toLocaleDateString('en-US') : 'No expiry',
            supplier: supplierName,
            status: batch.status,
            useFirst: index === 0, // First batch (FIFO) should be used first
            daysToExpiry: batch.days_to_expiry
          };
        });

        setBatchDetails(prev => ({
          ...prev,
          [itemId]: processedBatches
        }));
        setBatchErrors(prev => ({ ...prev, [itemId]: undefined }));
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      
      // Don't log cancelled requests or circuit breaker states
      if (errorInfo.type !== 'cancelled' && errorInfo.type !== 'circuit_breaker') {
        console.error('Error fetching batch details:', errorInfo.message);
      }
      
      // Store empty array to indicate failure without showing fabricated data
      setBatchDetails(prev => ({
        ...prev,
        [itemId]: []
      }));
      setBatchErrors(prev => ({ 
        ...prev, 
        [itemId]: errorInfo.userFriendly ? errorInfo.message : 'Failed to load batches' 
      }));
    } finally {
      setLoadingBatches(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  }, [batchDetails, loadingBatches]);

  // Toggle card expansion
  const toggleCardExpansion = useCallback((itemId) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
        // Fetch batch details when expanding
        fetchBatchDetails(itemId);
      }
      return newSet;
    });
  }, [fetchBatchDetails]);

  // Delete item from database
  const deleteItem = useCallback(async (itemId, batchId) => {
    try {
      const result = await http.delete(`/inventory/items/${itemId}/batches/${batchId}`);

      if (result.success) {
        // Clear batch details cache for the deleted item
        setBatchDetails(prev => {
          const newDetails = { ...prev };
          delete newDetails[itemId];
          return newDetails;
        });
        
        // Remove from loading batches if it was loading
        setLoadingBatches(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });

        // Immediately refresh inventory data after successful deletion
        fetchInventoryData(false);

        // Remove from expanded cards if it was expanded
        setExpandedCards(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });

        // Clear any existing errors
        setError(null);
      } else {
        throw new Error(result.error || 'Failed to delete item');
      }
    } catch (error) {
      const errorInfo = categorizeError(error);
      
      // Don't log cancelled requests or circuit breaker states
      if (errorInfo.type !== 'cancelled' && errorInfo.type !== 'circuit_breaker') {
        console.error('Error deleting item:', errorInfo.message);
      }
      
      setError(errorInfo.userFriendly ? errorInfo.message : `Failed to delete item: ${errorInfo.message}`);
    }
  }, [fetchInventoryData]);

  // Get batch details for expanded view
  const getBatchDetails = useCallback((item) => {
    return batchDetails[item.id] || [];
  }, [batchDetails]);

  // Get status class for styling
  const getStatusClass = useCallback((status, daysToExpiry) => {
    if (daysToExpiry < 0) return 'expired-red';
    if (daysToExpiry <= 7) return 'expired-orange';
    return 'expired-green';
  }, []);

  // Handle OCR items extraction
  const handleOCRItemsExtracted = useCallback((data) => {
    console.log('OCR items extracted:', data);
    setOcrData(data);
    setShowStockInForm(true);
    setStockInTab('manual'); // Switch to manual tab to show the form
  }, []);

  // Handle successful stock-in submission
  const handleStockInSuccess = useCallback(() => {
    // Clear batch details cache so new batches will be fetched
    setBatchDetails({});
    setLoadingBatches(new Set());
    
    // Also clear expanded cards to force re-expansion with fresh data
    setExpandedCards(new Set());
    
    // Immediately refresh inventory data after successful stock-in
    fetchInventoryData(false);
    
    // Auto-trigger notifications for low stock items after update
    setTimeout(() => {
      const lowStockItems = inventoryItems.filter(item => 
        item.stockLevel === 'low' || item.stockLevel === 'out-of-stock'
      );
      
      if (lowStockItems.length > 0) {
        console.log(`🚨 Auto-alert: ${lowStockItems.length} items need restocking`);
      }
      
      // Auto-alert for expiring items
      const expiringItems = inventoryItems.filter(item => 
        item.urgencyLevel === 'critical' || item.urgencyLevel === 'urgent'
      );
      
      if (expiringItems.length > 0) {
        console.log(`⏰ Auto-alert: ${expiringItems.length} items expiring soon`);
      }
    }, 2000);
  }, [fetchInventoryData, inventoryItems]);

  // Handle OCR error
  const handleOCRError = useCallback((error) => {
    console.error('OCR error:', error);
    setError(`OCR processing failed: ${error.message}`);
    
    // Automatically switch to manual entry mode when OCR fails with a 500 error
    if (error.status === 500 || error.message.includes('500')) {
      setStockInTab('manual');
      setShowStockInForm(true);
      
      // If the error contains a preview image, pass it to the StockInForm
      // so the user doesn't have to re-upload the image
      if (error.previewImage) {
        setOcrData({
          items: [], // No items extracted
          previewImage: error.previewImage,
          rawText: '',
          filename: 'failed-ocr-image'
        });
      } else {
        setOcrData(null); // Clear any partial OCR data
      }
    }
  }, []);

  return (
    <div className="container-of-Overview">
      <StandardScrollStyles />
      {showTruckLoader && (
        <div className={`truck-loader-overlay ${truckLeaving ? 'truck-loading-leave' : ''}`}>
          <TruckLoader message={isLoading ? 'Truck is delivering your inventory…' : 'Unloading complete'} />
        </div>
      )}
      <header className="app-header">
        <h1 style={standardTextSizes.xl}>Inventory Management System</h1>
      </header>
      {/* Main Tabs */}
      <div className="top-tabs">
        <div
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </div>
        <div
          className={`tab ${activeTab === 'stock-in' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock-in')}
        >
          Stock In
        </div>
        <div
          className={`tab ${activeTab === 'stock-out' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock-out')}
        >
          Stock Out
        </div>
        {process.env.NODE_ENV === 'development' && (
          <div
            className={`tab ${activeTab === 'ocr-test' ? 'active' : ''}`}
            onClick={() => setActiveTab('ocr-test')}
          >
            🧪 OCR Test
          </div>
        )}
      </div>

      {/* Overview Tab Content */}
      {activeTab === 'overview' && (
        <div className="overview-container">
          <div className="inventory-overview">
            {/* Search and Filter Header */}
            <div className="overview-header">
              <div className="search-filter-row">
                <StandardSearch
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onClear={clearSearch}
                  placeholder="Search by item name..."
                  inputRef={searchInputRef}
                  style={{ flex: 1, marginRight: '12px', marginBottom: 0 }}
                />
                <div className="filter-container" ref={filterDropdownRef}>
                  <button
                    className="filter-btn"
                    onClick={toggleFilterDropdown}
                  >
                    <FontAwesomeIcon icon={faFilter} className="filter-icon" />
                    <IoChevronDown className="dropdown-arrow" />
                  </button>

                  {/* Filter Dropdown Menu */}
                  {showFilterDropdown && (
                    <div className="filter-dropdown-menu">
                      <div
                        className={`filter-option ${currentFilter === 'expiry-nearest' ? 'active' : ''}`}
                        onClick={() => handleFilterSelect('expiry-nearest')}
                      >
                        Expiry: Nearest First
                      </div>
                      <div
                        className={`filter-option ${currentFilter === 'newly-added' ? 'active' : ''}`}
                        onClick={() => handleFilterSelect('newly-added')}
                      >
                        Newly Added
                      </div>
                      <div
                        className={`filter-option ${currentFilter === 'cost-high-low' ? 'active' : ''}`}
                        onClick={() => handleFilterSelect('cost-high-low')}
                      >
                        Cost: High to Low
                      </div>
                      <div
                        className={`filter-option ${currentFilter === 'cost-low-high' ? 'active' : ''}`}
                        onClick={() => handleFilterSelect('cost-low-high')}
                      >
                        Cost: Low to High
                      </div>

                      <div
                        className={`filter-option ${currentFilter === 'quantity-high-low' ? 'active' : ''}`}
                        onClick={() => handleFilterSelect('quantity-high-low')}
                      >
                        Quantity: High to Low
                      </div>

                      <div
                        className={`filter-option ${currentFilter === 'quantity-low-high' ? 'active' : ''}`}
                        onClick={() => handleFilterSelect('quantity-low-high')}
                      >
                        Quantity: Low to High
                      </div>

                      <div
                        className={`filter-option ${currentFilter === 'category' ? 'active' : ''}`}
                        onClick={() => handleFilterSelect('category')}
                      >
                        Category
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="timestamp">
                Data as of: {new Date().toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: true
                })}
              </div>
            </div>

            {/* Inventory Items Grid */}
            <div className="inventory-grid">
              {error && inventoryItems.length === 0 ? (
                <div className="error-state">
                  <p>❌ Failed to load inventory data</p>
                  <p>{error}</p>
                  <button onClick={handleRefresh} className="retry-btn">
                    Retry</button>
                  </div>
              ) : filteredItems.length === 0 ? (
                <div className="no-items">
                  {debouncedSearchTerm ? (
                    <p>No items found matching "{debouncedSearchTerm}"</p>
                  ) : (
                    <div>
                      <p>No inventory items found.</p>
                      <p>Add some items using the <strong>Stock In</strong> tab to see them here.</p>
                      <button
                        onClick={() => setActiveTab('stock-in')}
                        className="goto-manual-btn"
                      >
                        Go to Stock In
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isExpanded = expandedCards.has(item.id);
                  const batchDetailsData = getBatchDetails(item);

                  let expandIcon = faAngleDown;
                  if (isExpanded) {
                    expandIcon = faAngleUp;
                  }

                  return (
                    <div key={`${item.id}-${item.batchNumber}`} className={`inventory-item-card ${isExpanded ? 'expanded' : ''}`}>
                      <div
                        className="card-header"
                        onClick={() => toggleCardExpansion(item.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div className="title-quantity-row">
                          <h3 className="item-title">{highlightMatch(item.name, debouncedSearchTerm)}</h3>
                          <div className="item-quantity">{item.quantity} {item.unit}</div>
                        </div>
                        <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>
                          <FontAwesomeIcon icon={expandIcon} />
                        </span>
                      </div>

                      <div className="item-details-container">
                        <div className="left-section">
                          <div className="item-category-text">{item.category}</div>
                        </div>
                        <div className="right-section">
                          <div className="item-status-row">
                            <span className={`status-text ${getStatusClass(item.status, item.daysToExpiry)}`}>
                              {item.daysToExpiry < 0 ? '• EXPIRED' :
                                item.daysToExpiry === 0 ? '• EXPIRES TODAY' :
                                item.daysToExpiry === 1 ? '• EXPIRES TOMORROW' :
                                item.daysToExpiry <= 7 ? `• EXPIRES IN ${item.daysToExpiry} DAYS` :
                                item.daysToExpiry <= 30 ? '• FRESH' :
                                item.daysToExpiry === 999 ? '• NO EXPIRY' :
                                '• GOOD'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Content - FIFO Batch Details */}
                      {isExpanded && (
                        <div className="expanded-content">
                          <div className="fifo-header">
                            <h4>FIFO Batch Details:</h4>
                          </div>

                          {batchErrors[item.id] && (
                            <div className="batch-error-box">
                              <p className="batch-error-text">Failed to load batch details: {batchErrors[item.id]}</p>
                              <button
                                className="retry-batch-btn"
                                onClick={(e) => { e.stopPropagation(); fetchBatchDetails(item.id, true); }}
                                disabled={loadingBatches.has(item.id)}
                              >{loadingBatches.has(item.id) ? 'Retrying…' : 'Retry'}</button>
                            </div>
                          )}
                          {!batchErrors[item.id] && batchDetailsData.length === 0 && (
                            <div className="no-batches-msg">No batch details available.</div>
                          )}
                          {batchDetailsData.map((batch, index) => (
                            <div key={batch.id} className="batch-item">
                              <div className="batch-header">
                                <div className="batch-info">
                                  {batch.useFirst && (
                                    <span className="use-first-badge">USE FIRST</span>
                                  )}
                                  <span className="batch-number">{batch.batchNumber}</span>
                                </div>
                                <button
                                  className="delete-batch-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteItem(item.id, batch.id);
                                  }}
                                  title="Delete this batch"
                                >
                                  <FontAwesomeIcon icon={faTrashCan} />
                                </button>
                              </div>

                              <div className="batch-quantity">
                                Quantity: {batch.quantity} {batch.unit}
                              </div>

                              <div className="batch-details">
                                <div className="batch-detail-row">
                                  <span className="detail-label">Procured:</span>
                                  <span className="detail-value">{batch.procuredDate}</span>
                                </div>
                                <div className="batch-detail-row">
                                  <span className="detail-label">Expires:</span>
                                  <span className="detail-value">{batch.expiryDate}</span>
                                </div>
                                <div className="batch-detail-row">
                                  <span className="detail-label">Supplier:</span>
                                  <span className="detail-value">{batch.supplier}</span>
                                </div>
                              </div>

                              <div className="batch-status">
                                <span className={`batch-status-text ${batch.status.toLowerCase()}`}>
                                  {batch.status}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Stock In Tab Content */}
      {activeTab === 'stock-in' && (
        <div className="stock-in-container">
          <div className="sub-tabs">
            <div
              className={`sub-tab ${stockInTab === 'scan' ? 'active' : ''}`}
              onClick={() => {
                setStockInTab('scan');
                setShowStockInForm(false);
                setOcrData(null);
              }}
            >
              Scan Bill
            </div>
            <div
              className={`sub-tab ${stockInTab === 'manual' ? 'active' : ''}`}
              onClick={() => {
                setStockInTab('manual');
                setShowStockInForm(true);
                setOcrData(null);
              }}
            >
              Manual Entry
            </div>
          </div>
          {/* Auto-correct toggle removed: feature is always enabled via backend AI */}
          
          {stockInTab === 'scan' && !showStockInForm && (
            <BillScanner 
              onItemsExtracted={handleOCRItemsExtracted}
              onError={handleOCRError}
            />
          )}
          
          {(stockInTab === 'manual' || showStockInForm) && (
            <>
              {/* key forces remount to avoid stale disabled state on quantity input observed for some vegetables */}
              <StockInForm
                key={`${stockInTab}-${ocrData ? 'ocr' : 'manual'}`}
                ocrData={ocrData}
                onBack={null}
                onSuccess={handleStockInSuccess}
                autoCorrect={true}
              />
            </>
          )}
        </div>
      )}

      {/* Stock Out Tab Content */}
      {activeTab === 'stock-out' && (
        <div className="stock-out-container">
          <StockOutForm />
        </div>
      )}

      {/* OCR Test Tab Content (Development Only) */}
      {activeTab === 'ocr-test' && process.env.NODE_ENV === 'development' && (
        <div className="ocr-test-container">
          <OCRTest />
        </div>
      )}
    </div>
  );
};

export default InventoryOverview;