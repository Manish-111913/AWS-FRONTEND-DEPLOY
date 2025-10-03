import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ArrowUpRight, FileText, Share2, ArrowLeft } from 'lucide-react';
import { exportSectionsToPDF } from '../utils/pdfExport';
import { Line } from 'react-chartjs-2';
import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Filler,
    Legend,
} from 'chart.js';
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';
import 'highcharts/highcharts-3d';
import 'highcharts/modules/exporting';
import 'highcharts/modules/accessibility';
import './stockrepo.css';
import { getTenant } from '../services/tenantContext';
import { StandardSearch, highlightMatch } from '../styles/standardStyles';

Chart.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler, Legend);

const CalendarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

const AppLoader = () => <div className="loader">Loading Reports...</div>;

// Re-added proper component wrapper after accidental removal during refactor
export const StockAndWastageReportsDetail = ({ onBack, selectedReportId }) => {
    const reportRefs = useRef({});
    const containerRef = useRef(null);
    const [isExporting, setIsExporting] = useState(false);
    const [showExportSuccess, setShowExportSuccess] = useState(false);
    const [headerData, setHeaderData] = useState(null);
    const [itemWiseSalesData, setItemWiseSalesData] = useState([]);
    const [performanceSummaryData, setPerformanceSummaryData] = useState([]);
    const [rawMaterialStockData, setRawMaterialStockData] = useState([]);
    const [wastageChartData, setWastageChartData] = useState(null);
    const [keyInsightsData, setKeyInsightsData] = useState(null);
    const [performanceAnalyticsData, setPerformanceAnalyticsData] = useState(null);
    // Removed Raw Material Consumption card/data
    const [estimatedRealtimeData, setEstimatedRealtimeData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedGraphPopup, setSelectedGraphPopup] = useState(null);
    const [popupData, setPopupData] = useState(null);

    // Handle graph card click to open popup
    const handleGraphCardClick = (cardType, data, title) => {
        setSelectedGraphPopup(cardType);
        setPopupData(data);
    };

    // Close popup
    const closeGraphPopup = () => {
        setSelectedGraphPopup(null);
        setPopupData(null);
    };
    const [error, setError] = useState(null);

    const [period, setPeriod] = useState('all');
    const [customDate, setCustomDate] = useState(null);
    const formatDate = (d) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    useEffect(() => {
        if (selectedReportId && reportRefs.current[selectedReportId] && !loading) {
            setTimeout(() => {
                const element = reportRefs.current[selectedReportId];
                if (element) element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
            }, 300);
        }
    }, [selectedReportId, loading]);

    useEffect(() => {
        const fetchAllData = async () => {
            try {
                setLoading(true);
                const tenant = getTenant();
                if (!tenant) {
                    setError('Tenant not set. Please select or initialize a business.');
                    setLoading(false);
                    return;
                }
                let qs = `?period=${period}`;
                if (period === 'custom' && customDate) {
                    const d = formatDate(customDate);
                    qs += `&start=${d}&end=${d}`;
                }
                const endpoints = [
                    `/api/stockrepo/header-summary${qs}`,
                    `/api/stockrepo/item-wise-sales${qs}`,
                    `/api/stockrepo/raw-material-stock${qs}`,
                    `/api/stockrepo/performance-analytics${qs}`,
                    `/api/stockrepo/performance-summary${qs}`,
                    `/api/stockrepo/wastage-comparison${qs}`,
                    `/api/stockrepo/key-insights${qs}`,
                    `/api/stockrepo/estimated-vs-realtime${qs}`
                ];
                const responses = await Promise.all(endpoints.map(url => fetch(url, { headers: { 'X-Tenant-Id': tenant } })));
                for (const res of responses) {
                    if (!res.ok) {
                        let bodyText = '';
                        try { bodyText = await res.text(); } catch {}
                        throw new Error(`Failed to fetch from ${res.url}: ${res.status} ${res.statusText}${bodyText ? ' - ' + bodyText : ''}`);
                    }
                }
                const [headerRes, salesRes, stockRes, analyticsRes, performanceRes, wastageRes, insightsRes, estRtRes] = await Promise.all(responses.map(res => res.json()));
                const hdrTotalSales = Math.round(Number(headerRes.totalSales || 0));
                const hdrGrossProfit = Math.round(Number(headerRes.grossProfit || 0));
                setHeaderData({
                    title: 'Total Sales & Stock Report',
                    itemsSold: `${headerRes.itemsSoldCount || 0} sold`,
                    totalSales: hdrTotalSales,
                    grossProfit: hdrGrossProfit,
                    change: '12.5%',
                });
                setItemWiseSalesData(salesRes);
                setRawMaterialStockData(stockRes.map(i => {
                    const unit = i.unit || '';
                    const hasNew = Object.prototype.hasOwnProperty.call(i, 'before_qty') || Object.prototype.hasOwnProperty.call(i, 'after_qty');
                    const before = hasNew ? Math.round(Number(i.before_qty || 0)) : Math.round(Number(i.quantity || 0));
                    const deductedVal = hasNew ? Math.round(Number(i.deducted_qty || 0)) : null;
                    const after = hasNew ? Math.round(Number(i.after_qty || 0)) : Math.round(Number(i.quantity || 0));
                    const fmt = (n) => (Number.isFinite(n) ? n.toString() : '--');
                    const safeDeducted = deductedVal === null ? '-' : `${fmt(deductedVal)} ${unit}`.trim();
                    return {
                        name: i.name,
                        before: `${fmt(before)} ${unit}`.trim(),
                        deducted: safeDeducted, // show positive quantity consumed
                        after: `${fmt(after)} ${unit}`.trim(),
                        status: i.stock_level || 'Sufficient'
                    };
                }));
                const roundedAnalytics = analyticsRes && analyticsRes.items ? {
                    total: Math.round(Number(analyticsRes.total || 0)),
                    items: analyticsRes.items.map(it => ({ ...it, value: Math.round(Number(it.value || 0)) }))
                } : analyticsRes;
                setPerformanceAnalyticsData(roundedAnalytics);
                setPerformanceSummaryData((performanceRes || []).map(r => ({ item: r.item, sales: Math.round(Number(r.sales || 0)), profit: Math.round(Number(r.profit || 0)), wastage: Math.round(Number(r.wastage || 0)) })));
                setWastageChartData(wastageRes ? { labels: wastageRes.labels, data: (wastageRes.data || []).map(v => Math.round(Number(v || 0))) } : wastageRes);
                const ki = { ...insightsRes };
                if (ki && ki.mostWasted && typeof ki.mostWasted.value === 'string') {
                    const num = Number(String(ki.mostWasted.value).replace(/[^0-9.-]/g, '')); ki.mostWasted.value = `₹${Math.round(Number.isFinite(num) ? num : 0)}`;
                }
                setKeyInsightsData(ki);
                setEstimatedRealtimeData(estRtRes);
            } catch (err) {
                console.error('Failed to load report data:', err); setError(err.message || 'Failed to load report data');
            } finally { setLoading(false); }
        };
        fetchAllData();
    }, [period, customDate]);

    const TopBar = ({ title }) => (
        <div className="top-bar">
            <h1 className="top-bar-title">
                <span onClick={onBack} className="stockrepo-back-btn" aria-label="Back">
                    <ArrowLeft size={24} className="top-bar-icon" />
                </span>
                {title}
            </h1>
        </div>
    );

    const DatePicker = ({ isOpen, onClose, onDateSelect }) => {
        const [viewDate, setViewDate] = useState(new Date());
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
        const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

        const handleDateClick = (day) => {
            const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
            onDateSelect(selectedDate);
            onClose();
        };

        const navigateMonth = (direction) => {
            setViewDate(prevDate => {
                const newDate = new Date(prevDate);
                newDate.setMonth(newDate.getMonth() + direction);
                return newDate;
            });
        };

        const renderCalendar = () => {
            const daysInMonth = getDaysInMonth(viewDate);
            const firstDay = getFirstDayOfMonth(viewDate);
            const days = [];
            const today = new Date();
            // Normalize today's date to ignore time
            const normToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
            }
            for (let day = 1; day <= daysInMonth; day++) {
                const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                const isToday = cellDate.getTime() === normToday.getTime();
                const isFuture = cellDate.getTime() > normToday.getTime();
                days.push(
                    <div
                        key={day}
                        className={`calendar-day ${isToday ? 'today' : ''} ${isFuture ? 'disabled' : ''}`}
                        onClick={!isFuture ? () => handleDateClick(day) : undefined}
                        style={isFuture ? { pointerEvents: 'none', opacity: 0.45, cursor: 'not-allowed' } : {}}
                    >
                        {day}
                    </div>
                );
            }
            return days;
        };

        if (!isOpen) return null;

        return (
            <div className="date-picker-overlay" onClick={onClose}>
                <div className="date-picker-popup" onClick={e => e.stopPropagation()}>
                    <div className="calendar-header">
                        <button onClick={() => navigateMonth(-1)}>‹</button>
                        <h3>{monthNames[viewDate.getMonth()]} {viewDate.getFullYear()}</h3>
                        <button onClick={() => navigateMonth(1)}>›</button>
                    </div>
                    <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => <div key={day} className="weekday">{day}</div>)}
                    </div>
                    <div className="calendar-grid">{renderCalendar()}</div>
                </div>
            </div>
        );
    };

    const DateSelector = ({ period, setPeriod, customDate, setCustomDate }) => {
        const [showDatePicker, setShowDatePicker] = useState(false);
        const [open, setOpen] = useState(false);

        const handleSelect = (value) => {
            setPeriod(value);
            if (value !== 'custom') setCustomDate(null);
            setOpen(false);
        };

        const handleCalendarClick = () => setShowDatePicker(true);

        const handleDateSelect = (date) => {
            setCustomDate(date);
            setPeriod('custom');
            setShowDatePicker(false);
        };

        const customLabel = customDate ? customDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Custom Date';

        return (
            <>
                <div className="date-picker">
                    <div onClick={handleCalendarClick} style={{ cursor: 'pointer' }}>
                        <CalendarIcon />
                    </div>
                    <div className="period-trigger" onClick={() => setOpen(!open)}>
                        <span className="label">{
                            period === 'custom' && customDate ? customLabel :
                                period === 'today' ? 'Today' :
                                    period === 'week' ? 'This Week' :
                                        period === 'month' ? 'This Month' :
                                            period === 'year' ? 'This Year' : 'All Time'
                        }</span>
                        <span className="chevron-down" />
                    </div>
                    {open && (
                        <div className="period-menu">
                            <div className="select-list">
                                <div className={`period-option ${period === 'today' ? 'active' : ''}`} onClick={() => handleSelect('today')}>Today</div>
                                <div className={`period-option ${period === 'week' ? 'active' : ''}`} onClick={() => handleSelect('week')}>This Week</div>
                                <div className={`period-option ${period === 'month' ? 'active' : ''}`} onClick={() => handleSelect('month')}>This Month</div>
                                <div className={`period-option ${period === 'year' ? 'active' : ''}`} onClick={() => handleSelect('year')}>This Year</div>
                                <div className={`period-option ${period === 'all' ? 'active' : ''}`} onClick={() => handleSelect('all')}>All Time</div>
                                {customDate && (
                                    <div className={`period-option ${period === 'custom' ? 'active' : ''}`} onClick={() => handleSelect('custom')}>{customLabel}</div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <DatePicker
                    isOpen={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    onDateSelect={handleDateSelect}
                />
            </>
        );
    };

    // Graph Popup Modal Component
    const GraphPopup = ({ isOpen, onClose, title, children }) => {
        if (!isOpen) return null;

        return (
            <div className="graph-popup-overlay" onClick={onClose}>
                <div className="graph-popup-content" onClick={e => e.stopPropagation()}>
                    <div className="graph-popup-header">
                        <h2 className="graph-popup-title">{title}</h2>
                        <button className="graph-popup-close" onClick={onClose}>×</button>
                    </div>
                    <div className="graph-popup-body">
                        {children}
                    </div>
                </div>
            </div>
        );
    };

    const SummaryBoxes = ({ data }) => (<div className="summary-boxes"><div className="summary-box"><p className="summary-label">Total Sales</p><p className="summary-value">₹{data.totalSales}</p><p className="summary-change"><ArrowUpRight size={14} className="summary-change-icon" />{data.change}</p></div><div className="summary-box"><p className="summary-label">Gross Profit</p><p className="summary-value">₹{data.grossProfit}</p><p className="summary-change"><ArrowUpRight size={14} className="summary-change-icon" />{data.change}</p></div></div>);

    const ItemWiseSalesCard = ({ data, isSelected, forwardedRef, onCardClick }) => {
        const [searchTerm, setSearchTerm] = useState('');
        
        // Use priority-based search: items starting with search term first
        const filteredData = useMemo(() => {
            if (!searchTerm.trim()) return data;
            
            const searchLower = searchTerm.toLowerCase();
            const startsWithMatches = data.filter(item => 
                item.name && item.name.toLowerCase().startsWith(searchLower)
            );
            const containsMatches = data.filter(item => 
                item.name && 
                item.name.toLowerCase().includes(searchLower) && 
                !item.name.toLowerCase().startsWith(searchLower)
            );
            
            return [...startsWithMatches, ...containsMatches];
        }, [data, searchTerm]);
        return (
            <div ref={forwardedRef} className={`${isSelected ? 'highlighted' : ''}`}>
                <h3 className="card-title-external">Item Wise Sales Report</h3>
                <div 
                    className="card item-sales-card"
                >
                    <div className="card-search-container">
                        <StandardSearch
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search items..."
                            showClearButton={true}
                            style={{ marginBottom: '16px' }}
                        />
                    </div>
                    <div className="card-content-scrollable">
                        {filteredData.map((item, index) => (
                            <div key={index} className="item-row-new">
                                <div className="item-row-left">
                                    <img src={item.image || 'https://placehold.co/50x50'} alt={item.name} className="item-image-new" />
                                    <div className="item-details-new">
                                        <h4 className="item-name-new">{highlightMatch(item.name, searchTerm)}</h4>
                                        <p className="item-price-new">{item.price} • {item.sold}</p>
                                        <p className="item-wastage-new">{item.wastage}</p>
                                    </div>
                                </div>
                                <div className="item-profit-new">
                                    <p className="item-profit-value-new">
                                        <span className="currency-symbol">₹</span>
                                        <span  style={{color:'black'}} className="profit-amount">{String(item.grossProfit || '').replace('₹', '')}</span>
                                    </p>
                                    <p className="item-profit-change-new">{item.change}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const PerformanceSummaryCard = ({ data, isSelected, forwardedRef, onCardClick }) => {
        const [searchTerm, setSearchTerm] = useState('');
        
        // Use priority-based search: items starting with search term first
        const filteredData = useMemo(() => {
            if (!searchTerm.trim()) return data;
            
            const searchLower = searchTerm.toLowerCase();
            const startsWithMatches = data.filter(row => 
                row.item && row.item.toLowerCase().startsWith(searchLower)
            );
            const containsMatches = data.filter(row => 
                row.item && 
                row.item.toLowerCase().includes(searchLower) && 
                !row.item.toLowerCase().startsWith(searchLower)
            );
            
            return [...startsWithMatches, ...containsMatches];
        }, [data, searchTerm]);
        return (
            <div ref={forwardedRef} className={`${isSelected ? 'highlighted' : ''}`}>
                <h3 className="card-title-external">Performance Summary</h3>
                <div 
                    className="card performance-summary-card"
                >
                    <div className="card-search-container">
                        <StandardSearch
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search items..."
                            showClearButton={true}
                            style={{ marginBottom: '16px' }}
                        />
                    </div>

                    {/* Fixed Header */}
                    <div className="performance-summary-header">
                        <div className="summary-list-header">
                            <span>Item</span>
                            <span>Sales (₹)</span>
                            <span>Profit (%)</span>
                            <span>Wastage (₹)</span>
                        </div>
                    </div>

                    {/* Scrollable Content */}
                    <div className="performance-summary-content">
                        {filteredData.map((row, index) => (
                            <div key={index} className="summary-list-row-new">
                                <span className="summary-item-name">{highlightMatch(row.item, searchTerm)}</span>
                                <span className="summary-item-sales">{row.sales}</span>
                                <span className="summary-item-profit">{row.profit}</span>
                                <span className="summary-item-wastage">{row.wastage}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const RawMaterialStockCard = ({ data, isSelected, forwardedRef, onCardClick }) => {
        const [searchTerm, setSearchTerm] = useState('');
        
        // Use priority-based search: items starting with search term first
        const filteredData = useMemo(() => {
            if (!searchTerm.trim()) return data;
            
            const searchLower = searchTerm.toLowerCase();
            const startsWithMatches = data.filter(item => 
                item.name && item.name.toLowerCase().startsWith(searchLower)
            );
            const containsMatches = data.filter(item => 
                item.name && 
                item.name.toLowerCase().includes(searchLower) && 
                !item.name.toLowerCase().startsWith(searchLower)
            );
            
            return [...startsWithMatches, ...containsMatches];
        }, [data, searchTerm]);
        return (
            <div ref={forwardedRef} className={`${isSelected ? 'highlighted' : ''}`}>
                <h3 className="card-title-external">Raw Material Stock Report</h3>
                <div 
                    className="card raw-material-stock-card"
                >
                    <div className="card-search-container">
                        <StandardSearch
                            value={searchTerm}
                            onChange={setSearchTerm}
                            placeholder="Search materials..."
                            showClearButton={true}
                            style={{ marginBottom: '16px' }}
                        />
                    </div>
                    <div className="card-content-scrollable">
                        {filteredData.map((item, index) => (
                            <div key={index} className="stock-item-card">
                                <div className="stock-item-header">
                                    <h4 className="stock-item-name">{highlightMatch(item.name, searchTerm)}</h4>
                                    <span className={`stock-item-status ${item.status === 'Sufficient' ? 'status-sufficient' : 'status-low'}`}>{item.status}</span>
                                </div>
                                <div className="stock-item-details">
                                    <div className="stock-detail-item">
                                        <span className="stock-detail-label">Before</span>
                                        <span className="stock-detail-value">{item.before}</span>
                                    </div>
                                    <div className="stock-detail-item">
                                        <span className="stock-detail-label">Deducted</span>
                                        <span className="stock-detail-value negative">{item.deducted}</span>
                                    </div>
                                    <div className="stock-detail-item">
                                        <span className="stock-detail-label">After</span>
                                        <span className="stock-detail-value">{item.after}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    };

    const KeyInsightsCard = ({ data, isSelected, forwardedRef }) => {
        if (!data) return null;
        return (
            <div ref={forwardedRef} className={`${isSelected ? 'highlighted' : ''}`}>
                <h3 className="card-title-external">Key Insights</h3>
                <div className="card insights-card">
                    <div className="insight-row"><p className="insight-label">Best Selling Item:</p><p className="insight-value">{data.bestSelling?.item} ({data.bestSelling?.value})</p></div>
                    <div className="insight-row"><p className="insight-label">Most Wasted Item:</p><p className="insight-value">{data.mostWasted?.item} {data.mostWasted?.value}</p></div>
                </div>
            </div>
        );
    };

    const handleExport = async () => {
        if (isExporting) return;
        try {
            setIsExporting(true);
            const sectionSelectors = [
                '.summary-boxes',
                '.item-sales-card',
                '.analytics-card',
                '.raw-material-stock-card',
                '.estimated-realtime-card',
                '.performance-summary-card',
                '.wastage-card',
                '.insights-card'
            ];
            const periodLabel = period === 'custom' && customDate ? customDate.toLocaleDateString() : period;
            const containerEl = containerRef.current || document.body;

            // Remove fixed heights on cards we want fully (item/performance/raw material) & expand scroll areas
            const expandedOriginals = [];
            // Inject a temporary style tag to aggressively force heights to auto for capture
            const tempStyle = document.createElement('style');
            tempStyle.setAttribute('data-pdf-capture', 'true');
            tempStyle.textContent = `
                            .pdf-capture-mode .item-sales-card,
                            .pdf-capture-mode .performance-summary-card,
                            .pdf-capture-mode .raw-material-stock-card,
                            .pdf-capture-mode .wastage-card { height: auto !important; }
                            .pdf-capture-mode .card-content-scrollable,
                            .pdf-capture-mode .performance-summary-content { height: auto !important; max-height: none !important; overflow: visible !important; }
                        `;
            document.head.appendChild(tempStyle);
            containerEl.classList.add('pdf-capture-mode');
            const selectorsToExpand = [
                '.card-content-scrollable',
                '.performance-summary-content'
            ];
            const fixedHeightCards = [
                '.item-sales-card',
                '.performance-summary-card',
                '.raw-material-stock-card'
            ];
            fixedHeightCards.forEach(sel => {
                containerEl.querySelectorAll(sel).forEach(card => {
                    expandedOriginals.push({ el: card, height: card.style.height });
                    card.style.height = 'auto';
                });
            });
            const allToExpand = new Set();
            selectorsToExpand.forEach(sel => containerEl.querySelectorAll(sel).forEach(el => allToExpand.add(el)));
            containerEl.querySelectorAll('*').forEach(el => {
                if (!(el instanceof HTMLElement)) return;
                const cs = getComputedStyle(el);
                const oy = cs.overflowY;
                if ((oy === 'auto' || oy === 'scroll' || oy === 'hidden') && el.scrollHeight > el.clientHeight + 2) {
                    allToExpand.add(el);
                }
            });
            allToExpand.forEach(el => {
                expandedOriginals.push({ el, height: el.style.height, maxHeight: el.style.maxHeight, overflow: el.style.overflow, overflowY: el.style.overflowY });
                el.style.height = el.scrollHeight + 'px';
                el.style.maxHeight = 'none';
                el.style.overflow = 'visible';
                el.style.overflowY = 'visible';
            });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            try {
                await exportSectionsToPDF({
                    container: containerEl,
                    sectionSelectors,
                    title: 'Stock & Wastage Report',
                    periodLabel
                });
                setShowExportSuccess(true);
                setTimeout(() => setShowExportSuccess(false), 2500);
            } finally {
                expandedOriginals.forEach(rec => {
                    const { el, height, maxHeight, overflow, overflowY } = rec;
                    if (height !== undefined) el.style.height = height;
                    if (maxHeight !== undefined) el.style.maxHeight = maxHeight;
                    if (overflow !== undefined) el.style.overflow = overflow;
                    if (overflowY !== undefined) el.style.overflowY = overflowY;
                });
                containerEl.classList.remove('pdf-capture-mode');
                if (tempStyle && tempStyle.parentNode) tempStyle.parentNode.removeChild(tempStyle);
            }
        } catch (e) {
            console.error('PDF export failed:', e);
        } finally {
            setIsExporting(false);
        }
    };

    const ExportShareButtons = () => (
        <div className="button-group">
            <button className="report-button" onClick={handleExport} disabled={isExporting} style={isExporting ? { opacity: .6, cursor: 'not-allowed' } : {}}>
                <FileText size={18} className="button-icon" />{isExporting ? 'Exporting…' : 'Export PDF'}
            </button>
            <button className="report-button"><Share2 size={18} className="button-icon" />Share Report</button>
        </div>
    );


    const PerformanceAnalyticsCard = ({ data, isSelected, forwardedRef, onCardClick }) => {
        const [isFullscreen, setIsFullscreen] = useState(false);
        if (!data || !data.items || data.items.length === 0) {
            return (
                <div className={`${isSelected ? 'highlighted' : ''}`}>
                    <h3 className="card-title-external">Sales Performance Chart</h3>
                    <div className="card analytics-card">
                        <p style={{ textAlign: 'center', padding: '20px' }}>No performance data available.</p>
                    </div>
                </div>
            );
        }

        // Prepare data for flat donut (2D) with outside labels
        const chartData = data.items.map((item, index) => ({
            name: item.name,
            y: item.value,
            // Palette inspired by the screenshots (soft, readable colors)
            color: [
                '#ff8c1a', // Chrome (orange)
                '#6d28d9', // Safari (purple)
                '#a78bfa', // Samsung Internet (lavender)
                '#f472b6', // UC Browser (pink)
                '#ef4444', // Opera (red)
                '#f59e0b', // Others (amber)
                '#60a5fa', '#34d399', '#fbbf24', '#93c5fd', '#fca5a5', '#86efac'
            ][index % 12]
        }));

        // Calculate total for center display if needed
        const total = data.total || data.items.reduce((sum, item) => sum + item.value, 0);

        // Helper for INR formatting within chart scope
        const formatINR = (val) => {
            try {
                return new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(val || 0);
            } catch {
                return Highcharts.numberFormat(val || 0, 0);
            }
        };

        // Helper to wrap long labels nicely over 2-3 lines
        const wrapLabel = (txt, max = 16) => {
            if (!txt) return '';
            const words = String(txt).split(' ');
            const lines = [];
            let line = '';
            words.forEach(w => {
                const tryLine = line.length ? line + ' ' + w : w;
                if (tryLine.length > max) {
                    if (line) lines.push(line);
                    line = w;
                } else {
                    line = tryLine;
                }
            });
            if (line) lines.push(line);
            return lines.slice(0, 3).join('<br/>');
        };

        const openFullscreen = () => setIsFullscreen(true);
        const closeFullscreen = () => setIsFullscreen(false);

        // Make labels more readable around chart with wrapping and connectors
        const chartOptions = {
            chart: {
                type: 'pie',
                backgroundColor: 'transparent',
                height: 420,
                // Flat donut (no 3D)
                options3d: { enabled: false },
                events: {
                    click: openFullscreen
                }
            },
            title: {
                useHTML: true,
                text: `<div style="line-height:1.3; font-weight:600; color:#111827;">Total Sales<br/>₹${formatINR(total)}</div>`,
                align: 'center',
                verticalAlign: 'middle',
                y: 10,
                style: {
                    fontSize: '16px',
                    fontWeight: '600',
                    color: '#1f2937'
                }
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                borderColor: '#ffffff',
                borderRadius: 10,
                borderWidth: 2,
                style: {
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: 'bold'
                },
                headerFormat: '<b>{point.key}</b><br/>',
                pointFormat: 'Sales: <b>₹{point.y:,.0f}</b>',
                shadow: true
            },
            legend: { enabled: false },
            plotOptions: {
                pie: {
                    allowPointSelect: true,
                    cursor: 'pointer',
                    innerSize: '60%',
                    size: '85%',
                    startAngle: 0,
                    endAngle: 360,
                    slicedOffset: 8,
                    dataLabels: {
                        enabled: true,
                        distance: 28,
                        softConnector: true,
                        connectorColor: '#d1d5db',
                        connectorWidth: 1.5,
                        connectorPadding: 6,
                        padding: 2,
                        crop: false,
                        overflow: 'allow',
                        useHTML: true,
                        formatter: function () {
                            const name = String(this.point.name || '');
                            const label = wrapLabel(name, 16);
                            return `<div style="max-width:140px;white-space:normal;line-height:1.15;color:#6b7280">${label}: ₹${formatINR(this.y)}</div>`;
                        },
                        style: {
                            fontSize: '12px',
                            fontWeight: '500',
                            color: '#6b7280',
                            textOutline: 'none'
                        },
                        allowOverlap: false
                    },
                    showInLegend: false,
                    point: {
                        events: {
                            mouseOver: function () {
                                // Gently pop out on hover
                                if (!this.sliced) this.slice(true, false);
                            },
                            mouseOut: function () {
                                if (this.sliced) this.slice(false, false);
                            },
                            click: function () { openFullscreen(); }
                        }
                    },
                    states: {
                        hover: {
                            brightness: 0.05,
                            halo: { size: 8, opacity: 0.15 }
                        },
                        select: {
                            color: null,
                            borderWidth: 3,
                            borderColor: '#f59e0b'
                        }
                    },
                    borderWidth: 1,
                    borderColor: '#ffffff'
                }
            },
            series: [{
                name: 'Sales (₹)',
                colorByPoint: true,
                data: chartData,
                animation: {
                    duration: 1200
                }
            }],
            credits: {
                enabled: false
            },
            responsive: {
                rules: [{
                    condition: {
                        maxWidth: 600
                    },
                    chartOptions: {
                        title: {
                            style: {
                                fontSize: '14px'
                            }
                        }
                    }
                }]
            }
        };

        return (
            <div ref={forwardedRef} className={`${isSelected ? 'highlighted' : ''}`}>
                <h3 className="card-title-external">Sales Performance Chart</h3>
                <div 
                    className="card analytics-card donut-card-flat clickable-card"
                    onClick={() => onCardClick && onCardClick('performance-analytics', data, 'Sales Performance Chart')}
                >
                    <div className="highcharts-container">
                        <HighchartsReact
                            highcharts={Highcharts}
                            options={chartOptions}
                            containerProps={{ className: 'highcharts-chart' }}
                        />
                    </div>
                </div>
                {isFullscreen && (
                    <div className="chart-modal-overlay" onClick={closeFullscreen}>
                        <div className="chart-modal" onClick={(e) => e.stopPropagation()}>
                            <button className="chart-modal-close" onClick={closeFullscreen} aria-label="Close">✕</button>
                            <h3 className="chart-modal-title">Sales Performance</h3>
                            <div className="chart-modal-body">
                                <HighchartsReact
                                    highcharts={Highcharts}
                                    options={{
                                        ...chartOptions,
                                        chart: {
                                            ...chartOptions.chart,
                                            height: (typeof window !== 'undefined' ? Math.round(window.innerHeight * 0.72) : 560)
                                        },
                                        plotOptions: {
                                            ...chartOptions.plotOptions,
                                            pie: {
                                                ...chartOptions.plotOptions.pie,
                                                size: '88%',
                                                dataLabels: {
                                                    ...chartOptions.plotOptions.pie.dataLabels,
                                                    distance: 36,
                                                    formatter: function () {
                                                        const name = String(this.point.name || '');
                                                        const label = wrapLabel(name, 22);
                                                        return `<div style="max-width:220px;white-space:normal;line-height:1.2;color:#4b5563;font-size:13px">${label}: ₹${formatINR(this.y)}</div>`;
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    containerProps={{ className: 'highcharts-chart fullscreen' }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    };

        // component removed entirely

    const WastageComparisonCard = ({ data, isSelected, forwardedRef, onCardClick }) => {
        if (!data) return null;

        // Currency formatter (INR)
        const formatINR = (v) => {
            try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v || 0)); }
            catch { return `₹${(Number(v || 0)).toLocaleString('en-IN')}`; }
        };

        // Shorten long item names for the x-axis (full name appears in tooltips)
        const shorten = (label) => {
            if (!label) return '';
            const trimmed = String(label).trim();
            return trimmed.length > 14 ? `${trimmed.slice(0, 14)}…` : trimmed;
        };

        // Lightweight crosshair plugin (vertical tracker)
        const crosshairPlugin = {
            id: 'wastageCrosshair',
            afterDatasetsDraw(chart, args, pluginOptions) {
                const tooltip = chart.tooltip;
                const active = tooltip?.getActiveElements?.();
                if (!active || !active.length) return;
                const ctx = chart.ctx;
                const x = active[0].element.x;
                const { top, bottom } = chart.chartArea;
                ctx.save();
                ctx.strokeStyle = pluginOptions?.color || '#9ca3af';
                ctx.lineWidth = pluginOptions?.lineWidth || 1;
                ctx.setLineDash(pluginOptions?.dash || [5, 5]);
                ctx.beginPath();
                ctx.moveTo(x, top);
                ctx.lineTo(x, bottom);
                ctx.stroke();
                ctx.restore();
            }
        };

        const chartData = {
            labels: data.labels,
            datasets: [{
                label: 'Wastage (₹)',
                data: data.data,
                borderColor: '#3b82f6',
                borderWidth: 3,
                // Dynamic vertical gradient fill
                backgroundColor: (context) => {
                    const { chart } = context;
                    const { ctx, chartArea } = chart;
                    if (!chartArea) return 'rgba(59,130,246,0.2)';
                    const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, 'rgba(59,130,246,0.35)');
                    gradient.addColorStop(1, 'rgba(59,130,246,0.05)');
                    return gradient;
                },
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#3b82f6',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointHitRadius: 12,
                clip: 10,
            }],
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            layout: { padding: { right: 12, left: 8, top: 10, bottom: 0 } },
            interaction: { intersect: false, mode: 'index', axis: 'x' },
            animation: { duration: 800, easing: 'easeOutCubic' },
            plugins: {
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(17,24,39,0.92)',
                    titleColor: '#f9fafb',
                    bodyColor: '#e5e7eb',
                    borderColor: '#60a5fa',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false,
                    callbacks: {
                        title: (items) => (items?.[0]?.label ?? ''),
                        label: (ctx) => {
                            const value = ctx.parsed.y;
                            // Delta against previous point
                            const prev = ctx.dataIndex > 0 ? ctx.dataset.data[ctx.dataIndex - 1] : null;
                            const delta = prev != null ? (value - prev) : null;
                            const deltaStr = delta == null ? '' : `  (${delta >= 0 ? '+' : ''}${formatINR(delta)})`;
                            return `Wastage: ${formatINR(value)}${deltaStr}`;
                        }
                    }
                },
                wastageCrosshair: { color: '#94a3b8', lineWidth: 1, dash: [4, 4] }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#eef2ff' },
                    ticks: {
                        color: '#6b7280',
                        callback: (value) => formatINR(value)
                    },
                    border: { display: false }
                },
                x: {
                    grid: { display: false },
                    ticks: {
                        color: '#374151',
                        maxRotation: 45,
                        minRotation: 45,
                        callback: (val, idx) => shorten(data.labels[idx])
                    },
                    border: { display: false }
                }
            },
            onHover: (evt, activeEls) => {
                evt.native && (evt.native.target.style.cursor = activeEls.length ? 'pointer' : 'default');
            },
            // Click to focus a point (pin tooltip)
            onClick: (evt, activeEls, chart) => {
                if (!activeEls?.length) return;
                chart.setActiveElements(activeEls);
                chart.tooltip?.setActiveElements?.(activeEls, { x: evt.x, y: evt.y });
                chart.update();
            }
        };

        return (
            <div ref={forwardedRef} className={`${isSelected ? 'highlighted' : ''}`}>
                <h3 className="card-title-external">Wastage Comparison (in ₹)</h3>
                <div 
                    className="card wastage-card clickable-card"
                    onClick={() => onCardClick && onCardClick('wastage-comparison', data, 'Wastage Comparison (in ₹)')}
                >
                    <span className="see-all-link">See All</span>
                    <div className="line-graph-container">
                        <Line options={chartOptions} data={chartData} plugins={[crosshairPlugin]} />
                    </div>
                </div>
            </div>
        );
    };

    const EstimatedVsRealtimeCard = ({ data, period, isSelected, forwardedRef, onCardClick }) => {
        const [isFullscreen, setIsFullscreen] = useState(false);
        const [drilldownData, setDrilldownData] = useState(null);
        const [loadingDrill, setLoadingDrill] = useState(false);
        const formatINR = (v) => {
            try { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(Number(v || 0)); }
            catch { return `₹${(Number(v || 0)).toLocaleString('en-IN')}`; }
        };

        if (!data || !data.labels || data.labels.length === 0 || ((data.estimated || []).length === 0 && (data.realtime || []).length === 0)) {
            return (
                <div ref={forwardedRef} className={`${isSelected ? 'highlighted' : ''}`}>
                    <h3 className="card-title-external">Estimated vs Real-Time Usage</h3>
                    <div className="card estimated-realtime-card">
                        <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#718096' }}>
                            No data available
                        </div>
                    </div>
                </div>
            );
        }

    // Downsample for safety: keep the last N points
    const isMonthly = (data.labels?.[0] || '').length === 7; // 'YYYY-MM'
    const MAX_POINTS = isMonthly ? 60 : 180; // 5 years monthly or ~6 months daily
    let categories, estSeries, rtSeries;

    if (period === 'today' && data.mode === 'item-today' && Array.isArray(data.itemLabels)) {
        categories = data.itemLabels;
        estSeries = data.itemEstimated || [];
        rtSeries = data.itemRealtime || [];
    } else if (period === 'month') {
        // Compress to single total pair for the month
        const estTotal = (data.estimated || []).reduce((a, b) => a + (Number(b) || 0), 0);
        const rtTotal = (data.realtime || []).reduce((a, b) => a + (Number(b) || 0), 0);
        categories = ['This Month'];
        estSeries = [estTotal];
        rtSeries = [rtTotal];
    } else {
        const total = data.labels.length;
        const startIdx = total > MAX_POINTS ? (total - MAX_POINTS) : 0;
        categories = data.labels.slice(startIdx);
        estSeries = (data.estimated || []).slice(startIdx);
        rtSeries = (data.realtime || []).slice(startIdx);
    }
        const loadMonthlyDrilldown = async () => {
            try {
                setLoadingDrill(true);
                const now = new Date();
                const ms = new Date(now.getFullYear(), now.getMonth(), 1);
                const me = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                const tenant = getTenant();
                const url = `/api/stockrepo/estimated-vs-realtime?period=custom&start=${fmt(ms)}&end=${fmt(me)}`;
                const resp = await fetch(url, { headers: { 'X-Tenant-Id': tenant || '' } });
                const json = await resp.json();
                setDrilldownData(json);
            } catch (e) {
                console.error('Drilldown load failed', e);
            } finally {
                setLoadingDrill(false);
            }
        };

        const options = {
            chart: {
                type: 'column',
                backgroundColor: 'transparent',
                height: 380,
                spacing: [10, 10, 10, 10],
                // Increase left margin to prevent currency labels from truncating
                margin: [40, 20, 60, 90],
                events: { click: async () => {
                    // For monthly view, clicking should open daily drilldown for that month
                    if (period === 'month') {
                        setIsFullscreen(true);
                        if (!drilldownData) await loadMonthlyDrilldown();
                    } else {
                        setIsFullscreen(true);
                    }
                } },
                style: { fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }
            },
            title: { text: null },
            credits: { enabled: false },
            exporting: { enabled: false },
            xAxis: {
                categories,
                title: { text: null },
                labels: { style: { color: '#374151', fontSize: '12px', fontWeight: '500' } },
                lineWidth: 1,
                lineColor: '#374151'
            },
            yAxis: {
                min: 0,
                title: { text: 'Amount (₹)', style: { color: '#374151', fontSize: '13px', fontWeight: '600' } },
                labels: {
                    // Ensure labels render fully without ellipsis
                    useHTML: false,
                    reserveSpace: true,
                    style: {
                        color: '#374151',
                        fontSize: '12px',
                        fontWeight: '500',
                        whiteSpace: 'nowrap',
                        textOverflow: 'none'
                    },
                    formatter: function () { return formatINR(this.value); }
                },
                // Show the Y-axis line/border and ticks clearly
                lineWidth: 1,
                lineColor: '#374151',
                tickWidth: 1,
                tickLength: 6,
                tickColor: '#374151',
                gridLineColor: '#f3f4f6'
            },
            legend: {
                enabled: true,
                align: 'center',
                verticalAlign: 'top',
                layout: 'horizontal',
                y: 10,
                itemStyle: { color: '#374151', fontSize: '12px', fontWeight: '500' }
            },
            tooltip: {
                useHTML: true,
                backgroundColor: 'rgba(17,24,39,0.92)',
                borderWidth: 1,
                borderColor: '#60a5fa',
                style: { color: '#e5e7eb' },
                formatter: function () {
                    const label = (this.key !== undefined && this.key !== null) ? String(this.key) : '';
                    const showHeader = !!label && label !== '0';
                    const header = showHeader ? `<div style="font-weight:600;color:#f9fafb;margin-bottom:6px">${label}</div>` : '';
                    return `<div style="padding:8px 10px">${header}<div><span style="color:${this.color};font-weight:600">${this.series.name}:</span> <span style="font-weight:600;color:#f9fafb">${formatINR(this.y)}</span></div>${period==='today' && data.mode==='item-today' ? '<div style="margin-top:4px;font-size:11px;color:#9ca3af">Per item for today</div>' : ''}</div>`;
                }
            },
            plotOptions: {
                column: {
                    borderWidth: 0,
                    borderRadius: 4,
                    pointPadding: 0.1,
                    groupPadding: 0.15,
                    maxPointWidth: 60,
                    dataLabels: { enabled: false }
                }
            },
            series: [
                { name: 'Estimated', data: estSeries, color: '#f97316' },
                { name: 'Real-Time', data: rtSeries, color: '#8b5cf6' }
            ]
            ,
            responsive: { rules: [{ condition: { maxWidth: 768 }, chartOptions: { xAxis: { labels: { style: { fontSize: '10px' } } }, yAxis: { labels: { style: { fontSize: '10px' } } } } }] }
        };

        const needsScroll = period === 'today' && data.mode === 'item-today' && (categories?.length || 0) > 2;
        return (
            <div ref={forwardedRef} className={`${isSelected ? 'highlighted' : ''}`}>
                <h3 className="card-title-external">Estimated vs Real-Time Usage</h3>
                <div
                    className="card estimated-realtime-card clickable-card"
                    onClick={async () => {
                        if (period === 'month') {
                            setIsFullscreen(true);
                            await loadMonthlyDrilldown();
                        } else {
                            onCardClick && onCardClick('estimated-realtime', data, 'Estimated vs Real-Time Usage');
                        }
                    }}
                    style={needsScroll ? { overflowX: 'auto', overflowY: 'hidden' } : {}}
                >
                    <div style={needsScroll ? { minWidth: Math.max(600, categories.length * 140) } : {}}>
                        <HighchartsReact highcharts={Highcharts} options={options} containerProps={{ className: 'highcharts-chart' }} />
                    </div>
                </div>
                {isFullscreen && (
                    <div className="fullscreen-modal" onClick={() => setIsFullscreen(false)}>
                        <div className="fullscreen-modal-content" onClick={(e) => e.stopPropagation()}>
                            <button className="fullscreen-close-btn" onClick={() => setIsFullscreen(false)} aria-label="Close">×</button>
                            <h3 style={{ margin: '0 0 20px 0', textAlign: 'center' }}>
                                {period === 'month' ? 'Estimated vs Real-Time (Daily Drilldown)' : 'Estimated vs Real-Time Usage'}
                            </h3>
                            <div style={{
                                width: '100%',
                                height: 'calc(95vh - 120px)',
                                overflowX: 'auto',
                                overflowY: 'hidden',
                                paddingBottom: 8 // ensure OS scrollbar has space
                            }}>
                                {period === 'month' && drilldownData ? (
                                    <div style={{ minWidth: `${Math.max(1600, ((drilldownData.labels || []).length || 1) * 60)}px` }}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={{
                                                ...options,
                                                chart: {
                                                    ...options.chart,
                                                    height: 'calc(95vh - 180px)',
                                                    scrollablePlotArea: {
                                                        minWidth: Math.max(1600, ((drilldownData.labels || []).length || 1) * 60),
                                                        scrollPositionX: 0.5
                                                    }
                                                },
                                                xAxis: {
                                                    ...options.xAxis,
                                                    categories: drilldownData.labels || [],
                                                    labels: {
                                                        ...(options.xAxis?.labels || {}),
                                                        step: (() => {
                                                            const n = (drilldownData.labels || []).length || 1;
                                                            return Math.max(1, Math.ceil(n / 10));
                                                        })()
                                                    }
                                                },
                                                // Inherit yAxis styles (border and full labels)
                                                yAxis: {
                                                    ...options.yAxis,
                                                    labels: {
                                                        ...(options.yAxis?.labels || {}),
                                                        reserveSpace: true,
                                                        style: { ...(options.yAxis?.labels?.style || {}), whiteSpace: 'nowrap', textOverflow: 'none' }
                                                    },
                                                    lineWidth: 1,
                                                    lineColor: '#374151',
                                                    tickWidth: 1,
                                                    tickLength: 6,
                                                    tickColor: '#374151'
                                                },
                                                plotOptions: {
                                                    ...options.plotOptions,
                                                    column: {
                                                        ...options.plotOptions.column,
                                                        pointPadding: 0.02,
                                                        groupPadding: 0.06,
                                                        pointWidth: 22,
                                                        maxPointWidth: 36
                                                    }
                                                },
                                                series: [
                                                    { name: 'Estimated', data: (drilldownData.estimated || []).map(n => Number(n) || 0), color: '#f97316' },
                                                    { name: 'Real-Time', data: (drilldownData.realtime || []).map(n => Number(n) || 0), color: '#8b5cf6' }
                                                ]
                                            }}
                                            containerProps={{ className: 'highcharts-chart fullscreen', style: { maxWidth: '1200px', margin: '0 auto' } }}
                                        />
                                    </div>
                                ) : (
                                    <div style={{ minWidth: `${Math.max(1600, (Array.isArray(options?.xAxis?.categories) ? options.xAxis.categories.length : 1) * 60)}px` }}>
                                        <HighchartsReact
                                            highcharts={Highcharts}
                                            options={{
                                                ...options,
                                                chart: {
                                                    ...options.chart,
                                                    height: 'calc(95vh - 180px)',
                                                    scrollablePlotArea: {
                                                        minWidth: Math.max(1600, (Array.isArray(options?.xAxis?.categories) ? options.xAxis.categories.length : 1) * 60),
                                                        scrollPositionX: 0.5
                                                    }
                                                },
                                                xAxis: {
                                                    ...options.xAxis,
                                                    labels: {
                                                        ...(options.xAxis?.labels || {}),
                                                        step: (() => {
                                                            const n = Array.isArray(options?.xAxis?.categories) ? options.xAxis.categories.length : 1;
                                                            return Math.max(1, Math.ceil(n / 10));
                                                        })()
                                                    }
                                                },
                                                yAxis: {
                                                    ...options.yAxis,
                                                    labels: {
                                                        ...(options.yAxis?.labels || {}),
                                                        reserveSpace: true,
                                                        style: { ...(options.yAxis?.labels?.style || {}), whiteSpace: 'nowrap', textOverflow: 'none' }
                                                    },
                                                    lineWidth: 1,
                                                    lineColor: '#374151',
                                                    tickWidth: 1,
                                                    tickLength: 6,
                                                    tickColor: '#374151'
                                                },
                                                plotOptions: {
                                                    ...options.plotOptions,
                                                    column: {
                                                        ...options.plotOptions.column,
                                                        pointPadding: 0.02,
                                                        groupPadding: 0.06,
                                                        pointWidth: 22,
                                                        maxPointWidth: 36
                                                    }
                                                }
                                            }}
                                            containerProps={{ className: 'highcharts-chart fullscreen', style: { maxWidth: '1200px', margin: '0 auto' } }}
                                        />
                                    </div>
                                )}
                            </div>
                            {period === 'month' && loadingDrill && (
                                <div style={{ textAlign: 'center', padding: '10px', color: '#6b7280' }}>Loading daily data…</div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        );
    };


    if (loading) return <AppLoader />;
    if (error) return <div className="error-message">Error: {error}</div>;

    return (
        <>
            <div className={`screen-content stockrepo-container ${isExporting ? 'capture-mode' : ''}`} ref={containerRef}>
                <TopBar title={headerData?.title} />
                <div className="main-content-area">
                    <DateSelector period={period} setPeriod={setPeriod} customDate={customDate} setCustomDate={setCustomDate} />
                    {headerData && <SummaryBoxes data={headerData} />}
                    <ItemWiseSalesCard 
                        data={itemWiseSalesData} 
                        isSelected={selectedReportId === 'stock-itemwise'} 
                        forwardedRef={el => reportRefs.current['stock-itemwise'] = el}
                        onCardClick={handleGraphCardClick}
                    />
                    <PerformanceSummaryCard 
                        data={performanceSummaryData} 
                        isSelected={false} 
                        forwardedRef={el => reportRefs.current['performance-summary'] = el}
                        onCardClick={handleGraphCardClick}
                    />
                    <RawMaterialStockCard 
                        data={rawMaterialStockData} 
                        isSelected={false} 
                        forwardedRef={el => reportRefs.current['raw-material-stock'] = el}
                        onCardClick={handleGraphCardClick}
                    />
                    <PerformanceAnalyticsCard 
                        data={performanceAnalyticsData} 
                        isSelected={selectedReportId === 'stock-performance'} 
                        forwardedRef={el => reportRefs.current['stock-performance'] = el}
                        onCardClick={handleGraphCardClick}
                    />
                    {/* Raw Material Stock vs Consumption removed */}
                    <EstimatedVsRealtimeCard 
                        data={estimatedRealtimeData} 
                        period={period}
                        isSelected={false} 
                        forwardedRef={el => reportRefs.current['estimated-realtime'] = el}
                        onCardClick={handleGraphCardClick}
                    />
                    <WastageComparisonCard 
                        data={wastageChartData} 
                        isSelected={selectedReportId === 'wastage-comparison'} 
                        forwardedRef={el => reportRefs.current['wastage-comparison'] = el}
                        onCardClick={handleGraphCardClick}
                    />
                    <KeyInsightsCard data={keyInsightsData} isSelected={false} forwardedRef={el => reportRefs.current['key-insights'] = el} />
                    <ExportShareButtons />
                </div>
            </div>
            {showExportSuccess && (
                <div className="export-toast" role="status" aria-live="polite">
                    <span className="export-toast-icon">✓</span>
                    <span className="export-toast-text">PDF exported</span>
                </div>
            )}

            {/* Graph Popup */}
            <GraphPopup 
                isOpen={!!selectedGraphPopup} 
                onClose={closeGraphPopup}
                title={selectedGraphPopup === 'item-wise-sales' ? 'Item Wise Sales Report' : 
                       selectedGraphPopup === 'performance-summary' ? 'Performance Summary' :
                       selectedGraphPopup === 'wastage-comparison' ? 'Wastage Comparison (in ₹)' :
                       selectedGraphPopup === 'raw-material-stock' ? 'Raw Material Stock Report' :
                       selectedGraphPopup === 'performance-analytics' ? 'Sales Performance Chart' :
                       
                   selectedGraphPopup === 'estimated-realtime' ? 'Estimated vs Real-Time Usage' : ''}
            >
                {selectedGraphPopup === 'item-wise-sales' && popupData && (
                    <ItemWiseSalesCard 
                        data={popupData} 
                        isSelected={false} 
                        forwardedRef={() => {}}
                    />
                )}
                {selectedGraphPopup === 'performance-summary' && popupData && (
                    <PerformanceSummaryCard 
                        data={popupData} 
                        isSelected={false} 
                        forwardedRef={() => {}}
                    />
                )}
                {selectedGraphPopup === 'wastage-comparison' && popupData && (
                    <WastageComparisonCard 
                        data={popupData} 
                        isSelected={false} 
                        forwardedRef={() => {}}
                    />
                )}
                {selectedGraphPopup === 'raw-material-stock' && popupData && (
                    <RawMaterialStockCard 
                        data={popupData} 
                        isSelected={false} 
                        forwardedRef={() => {}}
                    />
                )}
                {selectedGraphPopup === 'performance-analytics' && popupData && (
                    <PerformanceAnalyticsCard 
                        data={popupData} 
                        isSelected={false} 
                        forwardedRef={() => {}}
                    />
                )}
                
                {selectedGraphPopup === 'estimated-realtime' && popupData && (
                    <EstimatedVsRealtimeCard 
                        data={popupData} 
                        period={period}
                        isSelected={false} 
                        forwardedRef={() => {}}
                    />
                )}
            </GraphPopup>
        </>
    );
};