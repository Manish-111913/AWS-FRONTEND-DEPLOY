import React, { useState, useEffect, useRef } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { http } from '../services/apiClient';
import {
    ResponsiveContainer,
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    Sector
} from 'recharts';
// Pie chart colors
const PIE_COLORS = [
    '#FF6B1C', '#7B38FF', '#3860FF', '#FF38B3', '#38FFE7', '#FFD500', '#FF8042', '#4ECDC4', '#82CA9D', '#FFC658', '#FF6666', '#00C49F'
];

const RedArrowDownIcon = () => (
    <svg width="17" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#ff3b30' }}>
        <path d="M12 5v14M19 12l-7 7-7-7" />
    </svg>
);

const GreenArrowUpIcon = () => (
    <svg width="17" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{ color: '#34c759' }}>
        <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
);

// useScrollToSection hook removed (unused)

const CalendarIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
        <line x1="16" y1="2" x2="16" y2="6"></line>
        <line x1="8" y1="2" x2="8" y2="6"></line>
        <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
);

// Payment icons removed (payment section removed)

const ExportIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"></path>
    </svg>
);

const ShareIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="18" cy="5" r="3"></circle>
        <circle cx="6" cy="12" r="3"></circle>
        <circle cx="18" cy="19" r="3"></circle>
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
    </svg>
);



const DatePicker = ({ isOpen, onClose, onDateSelect }) => {
    const [viewDate, setViewDate] = useState(new Date());

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const handleDateClick = (day) => {
        const selectedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        onDateSelect(selectedDate);
        onClose();
    };

    const navigateMonth = (direction) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + direction);
        setViewDate(newDate);
    };

    const renderCalendar = () => {
        const daysInMonth = getDaysInMonth(viewDate);
        const firstDay = getFirstDayOfMonth(viewDate);
        const days = [];
        const today = new Date();

        for (let i = 0; i < firstDay; i++) {
            days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
        }

        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
            const isToday =
                day === today.getDate() &&
                viewDate.getMonth() === today.getMonth() &&
                viewDate.getFullYear() === today.getFullYear();
            const isFuture = cellDate > today;
            days.push(
                <div
                    key={day}
                    className={`calendar-day${isToday ? ' today' : ''}${isFuture ? ' disabled' : ''}`}
                    onClick={!isFuture ? () => handleDateClick(day) : undefined}
                    style={isFuture ? { pointerEvents: 'none', opacity: 0.4, cursor: 'not-allowed' } : {}}
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
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="weekday">{day}</div>
                    ))}
                </div>
                <div className="calendar-grid">
                    {renderCalendar()}
                </div>
            </div>
        </div>
    );
};



// ✅ keep all your icons and DatePicker component as-is (no change from your code)

const SalesReport = ({ goTo }) => {
    const [hoverIndex, setHoverIndex] = useState(null);
    const [activeSection, setActiveSection] = useState(null);
    const reportRef = useRef(null);
    const [showExportToast, setShowExportToast] = useState(false);
    const [showExportModal, setShowExportModal] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    // Effect to handle scrolling to section and highlighting
    useEffect(() => {
        const section = sessionStorage.getItem('highlightSection');
        if (section) {
            setActiveSection(section);
            
            // Function to attempt scrolling
            const attemptScroll = (retries = 0) => {
                const element = document.getElementById(section);
                if (element) {
                    const executeScroll = () => {
                        const headerOffset = 100;
                        const elementRect = element.getBoundingClientRect();
                        const absoluteElementTop = elementRect.top + window.pageYOffset;
                        
                        // Scroll to element
                        window.scrollTo({
                            top: Math.max(0, absoluteElementTop - headerOffset),
                            behavior: 'smooth'
                        });
                        
                        // Visual feedback
                        element.style.transition = 'all 0.3s ease';
                        element.style.boxShadow = '0 0 20px rgba(66, 153, 225, 0.6)';
                        
                        setTimeout(() => {
                            element.style.boxShadow = 'none';
                        }, 1500);
                    };

                    // Ensure the element is actually in the document
                    if (element.offsetParent !== null) {
                        executeScroll();
                        return true;
                    }
                }
                
                // If element not found or not in document and we haven't exceeded retries
                if (retries < 5) {
                    setTimeout(() => attemptScroll(retries + 1), 300);
                    return false;
                }
                return false;
            };

            // Start the first attempt after a short delay
            setTimeout(() => attemptScroll(), 300);
            
            // Clear the section from sessionStorage after handling
            sessionStorage.removeItem('highlightSection');
        }
    }, []);
    
    // Summary comparison data
    const [summaryComparison, setSummaryComparison] = useState(null);
    // Pie chart data for today or selected date
    const [pieData, setPieData] = useState([]);
    const [pieDate, setPieDate] = useState(null); // YYYY-MM-DD string
    const [selectedPeriod, setSelectedPeriod] = useState('This Week');
    const [periodOpen, setPeriodOpen] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [selectedDate, setSelectedDate] = useState(null);
    const [displayText, setDisplayText] = useState('This Week');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // ✅ state for backend data
    const [summary, setSummary] = useState({
        total_sales: 0,
        total_orders: 0,
        gross_profit: 0,
        avg_order_value: 0,
    });
    // Removed Sales by Payment UI; no paymentMethods state needed
    const [salesTrend, setSalesTrend] = useState([]);
    const [topItems, setTopItems] = useState([]);

    // Handle section highlighting and scrolling
    useEffect(() => {
        if (activeSection) {
            const element = document.getElementById(activeSection);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeSection]);

    // Fetch all data when selectedPeriod changes
    useEffect(() => {
        // Fetch summary comparison for percentage change
        const fetchSummaryComparison = async () => {
            try {
                let periodQuery = '';
                if (selectedPeriod === 'Today') {
                    // For today, compare with previous day
                    const today = new Date();
                    const todayStr = today.toLocaleDateString('en-CA');
                    periodQuery = `?date=${todayStr}`;
                } else if (selectedDate) {
                    const dateStr = selectedDate.toLocaleDateString('en-CA');
                    periodQuery = `?date=${dateStr}`;
                } else {
                    let periodParam = '';
                    if (selectedPeriod === 'This Week') periodParam = 'week';
                    else if (selectedPeriod === 'This Month') periodParam = 'month';
                    else if (selectedPeriod === 'This Year') periodParam = 'year';
                    if (periodParam) periodQuery = `?period=${periodParam}`;
                }
                const compResult = await http.get(`/reports/summary-comparison${periodQuery}`).catch(() => null);
                setSummaryComparison(compResult);
            } catch (err) {
                setSummaryComparison(null);
            }
        };
        fetchSummaryComparison();
        const fetchAllData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                let queryStr = '';
                if (selectedPeriod === 'Today') {
                    const today = new Date();
                    queryStr = `?date=${today.toLocaleDateString('en-CA')}`;
                } else if (selectedDate) {
                    queryStr = `?date=${selectedDate.toLocaleDateString('en-CA')}`;
                } else {
                    let periodParam = '';
                    if (selectedPeriod === 'This Week') periodParam = 'week';
                    else if (selectedPeriod === 'This Month') periodParam = 'month';
                    else if (selectedPeriod === 'This Year') periodParam = 'year';
                    if (periodParam) queryStr = `?period=${periodParam}`;
                }
                const [summaryResult, trendResult, itemsResult, analysisResult] = await Promise.all([
                    http.get(`/reports/summary${queryStr}`).catch(() => ({ total_sales: 0, total_orders: 0, gross_profit: 0, avg_order_value: 0 })),
                    http.get(`/reports/trend${queryStr}`).catch(() => []),
                    http.get(`/reports/top-items${queryStr}`).catch(() => []),
                    http.get(`/reports/key-analysis${queryStr}`).catch(() => null)
                ]);
                setSummary(summaryResult);
                setSalesTrend(Array.isArray(trendResult) ? trendResult : []);
                setTopItems(Array.isArray(itemsResult) ? itemsResult : []);
                setKeyAnalysis(analysisResult);

                // Pie chart logic for today or selected date
                setPieDate(queryStr.includes('date=') ? queryStr.split('date=')[1] : null);
                if (queryStr.includes('date=')) {
                    const pieResult = await http.get(`/reports/items-by-date${queryStr}`).catch(() => []);
                    setPieData(Array.isArray(pieResult) ? pieResult : []);
                } else {
                    setPieData([]);
                }
            } catch (err) {
                setError('Failed to load sales data. Please try again.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchAllData();
    }, [selectedPeriod, selectedDate]);
    // Pie chart renderers
    const renderPieChart = (data, dataKey, title, sectionId) => (
        <div 
            id={sectionId}
            className="trends-wrapper" 
            style={{ 
                border: `3px solid ${sectionId === activeSection ? '#2196F3' : '#e0e0e0'}`,
                minHeight: 350, 
                marginBottom: 24,
                transition: 'all 0.3s ease',
                scrollMarginTop: '100px',
                scrollMarginBottom: '20px'
            }}
            onMouseLeave={() => setHoverIndex(null)}
        >
            <h2 className="section-title">{title}</h2>
            {data && data.length > 0 ? (
                <ResponsiveContainer width="100%" height={340}>
                    <PieChart onMouseLeave={() => setHoverIndex(null)}>
                        <Pie
                            data={data.map(entry => ({
                                ...entry,
                                total_sales: Number(entry.total_sales),
                                gross_profit: Number(entry.gross_profit)
                            }))}
                            dataKey={dataKey}
                            nameKey="item_name"
                            cx="50%"
                            cy="50%"
                            outerRadius={110}
                            innerRadius={0}
                            startAngle={30}
                            endAngle={390}
                            isAnimationActive={true}
                            label={({ name, cx, cy, midAngle, outerRadius, index }) => {
                                const RADIAN = Math.PI / 180;
                                const radius = outerRadius + 18;
                                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                return (
                                    <text
                                        x={x}
                                        y={y}
                                        fill="#666"
                                        textAnchor={x > cx ? 'start' : 'end'}
                                        dominantBaseline="central"
                                        fontSize={15}
                                        fontWeight={500}
                                        style={{ pointerEvents: 'none' }} // Prevent label from interfering with hover
                                    >
                                        {name}
                                    </text>
                                );
                            }}
                            activeIndex={0}
                            activeShape={props => {
                                // Explode the first slice
                                const RADIAN = Math.PI / 180;
                                const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
                                const sin = Math.sin(-RADIAN * midAngle);
                                const cos = Math.cos(-RADIAN * midAngle);
                                const sx = cx + (outerRadius + 10) * cos;
                                const sy = cy + (outerRadius + 10) * sin;
                                const mx = cx + (outerRadius + 30) * cos;
                                const my = cy + (outerRadius + 30) * sin;
                                const ex = mx + (cos >= 0 ? 1 : -1) * 22;
                                const ey = my;
                                return (
                                    <g>
                                        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
                                        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
                                        <Sector
                                            cx={cx}
                                            cy={cy}
                                            innerRadius={innerRadius}
                                            outerRadius={outerRadius + 10}
                                            startAngle={startAngle}
                                            endAngle={endAngle}
                                            fill={fill}
                                        />
                                    </g>
                                );
                            }}
                            explode={true}
                            explodeOffset={10}
                        >
                            {data.map((entry, idx) => (
                                <Cell 
                                    key={`cell-${idx}`} 
                                    fill={PIE_COLORS[idx % PIE_COLORS.length]}
                                    style={{
                                        opacity: hoverIndex === null ? 1 : (hoverIndex === idx ? 1 : 0.3),
                                        transition: 'opacity 0.3s ease'
                                    }}
                                    onMouseEnter={() => setHoverIndex(idx)}
                                    onMouseLeave={() => setHoverIndex(null)}
                                />
                            ))}
                        </Pie>
                        <Tooltip
                            isAnimationActive={false}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const entry = payload[0].payload;
                                    return (
                                        <div style={{ background: '#222', color: '#fff', borderRadius: 8, padding: 12, minWidth: 120 }}>
                                            <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 4 }}>{entry.item_name}</div>
                                            <div style={{ fontWeight: 500 }}>Value: <span style={{ fontWeight: 700 }}>₹{Number(entry[dataKey]).toLocaleString()}</span></div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>
            ) : (
                <div style={{ textAlign: 'center', color: '#ff6600', fontWeight: 500, padding: '2rem 0' }}>
                    No data available for this date.
                </div>
            )}
        </div>
    );

    // 🔹 handle period change
    const handlePeriodChange = (value) => {
        setSelectedPeriod(value);
        setDisplayText(value);
        setSelectedDate(null);
        setPeriodOpen(false);
    };

    const handleCalendarClick = () => setShowDatePicker(true);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        const formattedDate = date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
        setDisplayText(formattedDate);
        setSelectedPeriod('');
    };

    // key analysis
    const [keyAnalysis, setKeyAnalysis] = useState(null);

    // ===== Chart Data Calculation for Sales Trend =====
    let chartData = [];
    let grossProfitChartData = [];
    if (!isLoading && !error) {
        if (selectedPeriod === 'This Month') {
            // Always show 4 weeks, use numeric values
            const weekLabels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
            chartData = [0, 1, 2, 3].map(i => {
                const week = salesTrend[i];
                return {
                    label: weekLabels[i],
                    total_sales: week ? Number(week.total_sales) : 0
                };
            });
            grossProfitChartData = [0, 1, 2, 3].map(i => {
                const week = salesTrend[i];
                return {
                    label: weekLabels[i],
                    gross_profit: week ? Number(week.gross_profit || 0) : 0
                };
            });
        } else if (selectedPeriod === 'This Year') {
            // Always show 12 months, use numeric values
            const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
            chartData = months.map((label, i) => {
                const month = salesTrend[i];
                return {
                    label,
                    total_sales: month ? Number(month.total_sales) : 0
                };
            });
            grossProfitChartData = months.map((label, i) => {
                const month = salesTrend[i];
                return {
                    label,
                    gross_profit: month ? Number(month.gross_profit || 0) : 0
                };
            });
        } else if (selectedPeriod === 'This Week') {
            // Always show Mon-Sun, use numeric values
            const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            // Map backend ISO date strings to weekday index using getUTCDay()
            const dayMap = {};
            const grossProfitMap = {};
            salesTrend.forEach(entry => {
                const dateObj = new Date(entry.label);
                const dayIdx = dateObj.getUTCDay();
                const dayName = weekDays[dayIdx];
                dayMap[dayName] = Number(entry.total_sales);
                grossProfitMap[dayName] = Number(entry.gross_profit || 0);
            });
            // Display Mon-Sun in order
            const orderedDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
            chartData = orderedDays.map(day => ({ label: day, total_sales: dayMap[day] || 0 }));
            grossProfitChartData = orderedDays.map(day => ({ label: day, gross_profit: grossProfitMap[day] || 0 }));
        } else {
            // Default: show whatever is returned
            chartData = salesTrend.map(d => {
                const dateObj = new Date(d.label);
                return {
                    ...d,
                    label: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
                    total_sales: Number(d.total_sales)
                };
            });
            grossProfitChartData = salesTrend.map(d => {
                const dateObj = new Date(d.label);
                return {
                    ...d,
                    label: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
                    gross_profit: Number(d.gross_profit || 0)
                };
            });
        }
        console.log('Chart Data:', chartData);
        console.log('Gross Profit Chart Data:', grossProfitChartData);
    }

    return (
        <>
            <div className={`report-container ${isExporting ? 'capture-mode' : ''}`} ref={reportRef}>
                {/* ===== HEADER ===== */}
                <header className="report-header">
                    <div className="header-row">
                        <div onClick={() => goTo('reports')} style={{ cursor: 'pointer' }}>
                            <ArrowLeftIcon />
                        </div>
                        <h1>Sales Reports</h1>
                    </div>
                    <div className="date-picker" style={{ position: 'relative' }}>
                        <div onClick={handleCalendarClick} style={{ cursor: 'pointer' }}>
                            <CalendarIcon />
                        </div>
                        <div className="period-trigger" onClick={() => setPeriodOpen(o => !o)}>
                            <span className="label">{selectedDate ? displayText : selectedPeriod}</span>
                            <span className="chevron-down" />
                        </div>
                        {periodOpen && (
                            <div className="period-menu">
                                <div className="select-list">
                                    <div className={`period-option ${selectedPeriod === 'Today' ? 'active' : ''}`} onClick={() => handlePeriodChange('Today')}>Today</div>
                                    <div className={`period-option ${selectedPeriod === 'This Week' ? 'active' : ''}`} onClick={() => handlePeriodChange('This Week')}>This Week</div>
                                    <div className={`period-option ${selectedPeriod === 'This Month' ? 'active' : ''}`} onClick={() => handlePeriodChange('This Month')}>This Month</div>
                                    <div className={`period-option ${selectedPeriod === 'This Year' ? 'active' : ''}`} onClick={() => handlePeriodChange('This Year')}>This Year</div>
                                    {selectedDate && (
                                        <div className={`period-option ${selectedPeriod === '' ? 'active' : ''}`} onClick={() => { setSelectedPeriod(''); setDisplayText(displayText); setPeriodOpen(false); }}>{displayText}</div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                {/* Loading State */}
                {isLoading && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '2rem',
                        fontSize: '1.1rem',
                        color: '#6c757d'
                    }}>
                        Loading sales data...
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div style={{
                        backgroundColor: '#f8d7da',
                        color: '#721c24',
                        padding: '1rem',
                        borderRadius: '8px',
                        margin: '1rem 0',
                        border: '1px solid #f5c6cb',
                        textAlign: 'center'
                    }}>
                        {error}
                    </div>
                )}

                {/* ===== SUMMARY CARDS ===== */}
                {!isLoading && !error && (
                <main>
                    <div className="stats-grid">
                        {/* Total Sales */}
                        <div className="stat-card">
                            <p className="card-title">Total Sales</p>
                            <p className="card-value">₹{(summary.total_sales || 0).toLocaleString()}</p>
                            {summaryComparison && summaryComparison.total_sales ? (
                                <p className="percentage-up" style={{ color: Number(summaryComparison.total_sales.percent) >= 0 ? '#34c759' : '#ff3b30' }}>
                                    {Number(summaryComparison.total_sales.percent) >= 0 ? <GreenArrowUpIcon /> : <RedArrowDownIcon />}
                                    {Math.abs(Number(summaryComparison.total_sales.percent)).toFixed(1)}%
                                </p>
                            ) : (
                                <p className="percentage-up">--</p>
                            )}
                        </div>
                        {/* Orders */}
                        <div className="stat-card">
                            <p className="card-title">Orders</p>
                            <p className="card-value">{summary.total_orders || 0}</p>
                            {summaryComparison && summaryComparison.total_orders ? (
                                <p className="percentage-up" style={{ color: Number(summaryComparison.total_orders.percent) >= 0 ? '#34c759' : '#ff3b30' }}>
                                    {Number(summaryComparison.total_orders.percent) >= 0 ? <GreenArrowUpIcon /> : <RedArrowDownIcon />}
                                    {Math.abs(Number(summaryComparison.total_orders.percent)).toFixed(1)}%
                                </p>
                            ) : (
                                <p className="percentage-up">--</p>
                            )}
                        </div>
                        {/* Gross Profit */}
                        <div className="stat-card">
                            <p className="card-title">Gross Profit</p>
                            <p className="card-value">₹{(summary.gross_profit || 0).toLocaleString()}</p>
                            {summaryComparison && summaryComparison.gross_profit ? (
                                <p className="percentage-up" style={{ color: Number(summaryComparison.gross_profit.percent) >= 0 ? '#34c759' : '#ff3b30' }}>
                                    {Number(summaryComparison.gross_profit.percent) >= 0 ? <GreenArrowUpIcon /> : <RedArrowDownIcon />}
                                    {Math.abs(Number(summaryComparison.gross_profit.percent)).toFixed(1)}%
                                </p>
                            ) : (
                                <p className="percentage-up">--</p>
                            )}
                        </div>
                        {/* Avg Order Value */}
                        <div className="stat-card">
                            <p className="card-title">Avg Order Value</p>
                            <p className="card-value">₹{(summary.avg_order_value || 0).toLocaleString()}</p>
                            {summaryComparison && summaryComparison.avg_order_value ? (
                                <p className="percentage-up" style={{ color: Number(summaryComparison.avg_order_value.percent) >= 0 ? '#34c759' : '#ff3b30' }}>
                                    {Number(summaryComparison.avg_order_value.percent) >= 0 ? <GreenArrowUpIcon /> : <RedArrowDownIcon />}
                                    {Math.abs(Number(summaryComparison.avg_order_value.percent)).toFixed(1)}%
                                </p>
                            ) : (
                                <p className="percentage-up">--</p>
                            )}
                        </div>
                    </div>

                    {/* Sales by Payment section removed as requested */}

                    {/* ===== SALES TREND (Graph or Pie) ===== */}
                    {/* ===== SALES TREND (Graph) ===== */}
                    {(selectedPeriod === 'Today' || selectedDate) && pieData.length > 0 && (
                        <>
                            <div>
                                {renderPieChart(pieData, 'total_sales', 'Sales Trend (Today)', 'sales-trend')}
                            </div>
                            <div>
                                {renderPieChart(pieData, 'gross_profit', 'Gross Profit Trend (Today)', 'gross-profit')}
                            </div>
                        </>
                    )}
                    {!(selectedPeriod === 'Today' || selectedDate) && (
                        <>
                            <h2 className="section-title">Sales Trend</h2>
                            <div 
                                id="sales-trend" 
                                className="trends-wrapper"
                                style={{
                                    border: isExporting ? 'none' : (activeSection === 'sales-trend' ? '2px solid #4299e1' : 'none'),
                                    transition: 'all 0.3s ease',
                                    scrollMarginTop: '100px'
                                }}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        {!isExporting && <CartesianGrid strokeDasharray="3 3" />}
                                        <XAxis dataKey="label" />
                                        <YAxis />
                                        <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="total_sales" name="Sales" stroke="#8884d8" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Dynamic Period Cards Below Sales Trend */}
                            <div className="pdf-break-before period-cards-row" style={{
                                display: 'flex',
                                gap: '1rem',
                                margin: '1.5rem 0',
                                flexWrap: 'nowrap',
                                overflowX: 'auto',
                                WebkitOverflowScrolling: 'touch',
                                paddingBottom: '0.5rem',
                                scrollbarWidth: 'thin',
                                scrollbarColor: '#888 #eee'
                            }}>
                                {chartData.map((d, idx) => (
                                    <div key={idx} style={{
                                        background: '#111',
                                        color: '#27ff7e',
                                        borderRadius: '12px',
                                        padding: '0.7rem 1.2rem',
                                        minWidth: 80,
                                        textAlign: 'center',
                                        fontWeight: 600,
                                        fontSize: '1.1rem',
                                        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
                                        flex: '0 0 auto'
                                    }}>
                                        <div style={{ color: '#fff', fontSize: '1rem', marginBottom: 2 }}>{d.label}</div>
                                        <div style={{ color: '#27ff7e', fontSize: '1.1rem' }}>₹{Number(d.total_sales || d.value || 0).toLocaleString()}</div>
                                    </div>
                                ))}
                            </div>
                            <h2 className="section-title">Gross Profit Trend</h2>
                            <div 
                                id="gross-profit"
                                className="trends-wrapper"
                                style={{
                                    border: isExporting ? 'none' : (activeSection === 'gross-profit' ? '2px solid #4299e1' : 'none'),
                                    transition: 'all 0.3s ease',
                                    scrollMarginTop: '100px'
                                }}
                            >
                                <ResponsiveContainer width="100%" height={250}>
                                    <LineChart data={grossProfitChartData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                                        {!isExporting && <CartesianGrid strokeDasharray="3 3" />}
                                        <XAxis dataKey="label" />
                                        <YAxis />
                                        <Tooltip formatter={v => `₹${v.toLocaleString()}`} />
                                        <Legend />
                                        <Line type="monotone" dataKey="gross_profit" name="Gross Profit" stroke="#34c759" strokeWidth={3} dot={{ r: 4 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </>
                    )}








                 {/* ===== TOP ITEMS ===== */}
                 <div 
                    id="top-items" 
                    className="trends-wrapper"
                    style={{
                        border: isExporting ? 'none' : (activeSection === 'top-items' ? '2px solid #4299e1' : 'none'),
                        transition: 'all 0.3s ease',
                        scrollMarginTop: '100px',
                        marginBottom: '24px',
                        padding: '20px',
                        minHeight: '100px',
                        position: 'relative',
                        display: 'block'
                    }}
                >
                    <h2 className="section-title">Top Items by Revenue</h2>
                    <div className="items-list">
                        {topItems.length > 0 ? (
                            topItems.map((item, idx) => (
                                <div key={idx} className="item-cards">
                                    <img 
                                        // Use local placeholder to avoid external DNS failures
                                        src={item.image_url || require('../assets/placeholder-menu-item.png')} 
                                        onError={(e)=>{ if(!e.target.dataset.fallback){ e.target.dataset.fallback='1'; e.target.src=require('../assets/placeholder-menu-item.png'); }}} 
                                        alt={item.item_name} 
                                    />
                                    <div className="item-info">
                                        <p className="item-name">{item.item_name}</p>
                                        <p className="item-sold">{item.total_qty} sold</p>
                                    </div>
                                    <div className="item-revenue">
                                        <p className="item-price">₹{(parseFloat(item.total_revenue) || 0).toLocaleString()}</p>
                                        <p className="percentage-up" style={{ color: '#22C55E' }}><GreenArrowUpIcon /> ₹{(parseFloat(item.gross_profit) || 0).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p>No items</p>
                        )}
                    </div>
                </div>

                {/* ===== KEY ANALYSIS ===== */}
                <div className="analysis-section">
                    <h2 className="section-title">Key Analysis</h2>
                    <div className="analysis-card">
                        <p className="analysis-title">Order Summary</p>
                        {keyAnalysis ? (
                            <>
                                <div className="analysis-row">
                                    <span>Best Revenue Day:</span>
                                    <span>
                                        {keyAnalysis.best_day && keyAnalysis.best_day !== "N/A"
                                            ? `${keyAnalysis.best_day} (₹${Number(keyAnalysis.best_day_revenue || 0).toLocaleString()})`
                                            : "N/A"}
                                    </span>
                                </div>

                                

                                <div className="analysis-row">
                                    <span>Profit Margin:</span>
                                    <span>₹{Number(keyAnalysis.profit_margin || 0).toLocaleString()}</span>
                                </div>
                            </>
                        ) : (
                            <p>No data available</p>
                        )}
                    </div>
                </div>


                </main>
                )}

                {/* ===== FOOTER ===== */}
                <footer className="report-footer">
                    <button className="footer-btn export-btn" onClick={async () => {
                        if (isExporting) return; // prevent double clicks
                        setIsExporting(true);
                        try {
                            /*
                             * Simplified & memory-safe PDF export:
                             *  - Capture each major section individually (summary, charts, top items, analysis)
                             *  - Avoid one huge html2canvas invocation that was freezing the tab
                             *  - Auto-add each image to PDF with page breaks and a header/footer
                             *  - Ensures hidden overflow content (horizontal scrollers) is fully included
                             */
                            const container = reportRef.current;
                            if (!container) throw new Error('Container not found');

                            // Temporarily expand horizontally scrollable rows so full content is visible
                            const hScrollSelectors = ['.period-cards-row'];
                            const revertedStyles = [];
                            hScrollSelectors.forEach(sel => {
                                container.querySelectorAll(sel).forEach(el => {
                                    revertedStyles.push({ el, style: { overflow: el.style.overflow, whiteSpace: el.style.whiteSpace, flexWrap: el.style.flexWrap } });
                                    el.style.overflow = 'visible';
                                    el.style.whiteSpace = 'normal';
                                    el.style.flexWrap = 'wrap';
                                });
                            });

                            // NEW: Expand all vertical scrollable containers (lists, tables) so full content appears in the PDF
                            const scrollExpanded = [];
                            container.querySelectorAll('*').forEach(el => {
                                if (!(el instanceof HTMLElement)) return;
                                const cs = getComputedStyle(el);
                                const oy = cs.overflowY;
                                const ox = cs.overflowX;
                                const couldScrollY = (oy === 'auto' || oy === 'scroll' || oy === 'hidden') && el.scrollHeight > el.clientHeight + 2;
                                const couldScrollX = (ox === 'auto' || ox === 'scroll') && el.scrollWidth > el.clientWidth + 2; // keep for completeness
                                if (couldScrollY) {
                                    scrollExpanded.push({
                                        el,
                                        height: el.style.height,
                                        maxHeight: el.style.maxHeight,
                                        overflow: el.style.overflow,
                                        overflowY: el.style.overflowY
                                    });
                                    el.style.height = el.scrollHeight + 'px';
                                    el.style.maxHeight = 'none';
                                    el.style.overflow = 'visible';
                                    el.style.overflowY = 'visible';
                                }
                                if (couldScrollX) {
                                    // ensure full horizontal content (rare here but safe)
                                    scrollExpanded.push({
                                        el,
                                        width: el.style.width,
                                        overflowX: el.style.overflowX
                                    });
                                    el.style.width = el.scrollWidth + 'px';
                                    el.style.overflowX = 'visible';
                                }
                            });
                            // Ensure layout flush before capture
                            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

                            const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight = pdf.internal.pageSize.getHeight();
                            const margin = 10;
                            const headerHeight = 8;
                            const contentWidth = pageWidth - margin * 2;
                            const usableHeight = pageHeight - margin - (margin + headerHeight); // after header & bottom margin

                            const periodLabel = (() => {
                                if (selectedPeriod === 'Today') return `Today (${new Date().toLocaleDateString()})`;
                                if (selectedDate) return selectedDate.toLocaleDateString();
                                return selectedPeriod || displayText || '';
                            })();

                            const addHeaderFooter = (pageNo) => {
                                pdf.setFontSize(12);
                                pdf.text('Sales Report', margin, margin + 5);
                                pdf.setFontSize(9);
                                pdf.text(`Period: ${periodLabel}`, pageWidth - margin, margin + 5, { align: 'right' });
                                pdf.text(`Page ${pageNo}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
                            };

                            const pxToMm = (px, canvasWidthPx) => (px * contentWidth) / canvasWidthPx; // proportional scaling

                            // Sections to capture in order (only those currently rendered)
                            const sectionSelectors = [
                                '.stats-grid',        // Summary cards
                                '#sales-trend',       // Sales trend chart
                                '#gross-profit',      // Gross profit chart
                                '#top-items',         // Top items list
                                '.analysis-section'   // Key analysis
                            ].filter(sel => container.querySelector(sel));

                            // Track vertical placement so multiple sections share a page when they fit
                            let currentPage = 1;
                            addHeaderFooter(currentPage);
                            const startY = margin + headerHeight;
                            const sectionSpacing = 4; // mm gap between stacked sections
                            let currentY = startY;

                            const ensurePageSpace = (neededMm) => {
                                const remaining = pageHeight - margin - currentY;
                                if (neededMm > remaining) {
                                    pdf.addPage();
                                    currentPage++;
                                    addHeaderFooter(currentPage);
                                    currentY = startY;
                                }
                            };

                            // Utility: trim pure white rows from top & bottom of a canvas (tolerance ~5)
                            const trimCanvas = (cv) => {
                                const ctx = cv.getContext('2d');
                                const { width, height } = cv;
                                const imgData = ctx.getImageData(0, 0, width, height).data;
                                const isRowWhite = (y) => {
                                    const rowStart = y * width * 4;
                                    const rowEnd = rowStart + width * 4;
                                    for (let i = rowStart; i < rowEnd; i += 4) {
                                        const r = imgData[i], g = imgData[i+1], b = imgData[i+2], a = imgData[i+3];
                                        // treat near-white or transparent as white
                                        if (a > 10 && (r < 250 || g < 250 || b < 250)) return false;
                                    }
                                    return true;
                                };
                                let top = 0; let bottom = height - 1;
                                while (top < height && isRowWhite(top)) top++;
                                while (bottom > top && isRowWhite(bottom)) bottom--;
                                const newH = bottom - top + 1;
                                if (newH >= height || newH <= 0) return cv; // nothing to trim
                                const trimmed = document.createElement('canvas');
                                trimmed.width = width; trimmed.height = newH;
                                trimmed.getContext('2d').drawImage(cv, 0, top, width, newH, 0, 0, width, newH);
                                return trimmed;
                            };

                            for (const selector of sectionSelectors) {
                                const el = container.querySelector(selector);
                                if (!el) continue;

                                // Render section
                                let canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
                                canvas = trimCanvas(canvas);
                                const fullHeightMm = pxToMm(canvas.height, canvas.width);

                                // Fits whole on current page
                                if (fullHeightMm <= (pageHeight - margin - currentY)) {
                                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, fullHeightMm, undefined, 'FAST');
                                    currentY += fullHeightMm + sectionSpacing;
                                    continue;
                                }

                                // If single section taller than remaining but shorter than a fresh page, move to new page
                                if (fullHeightMm <= usableHeight) {
                                    // New page then draw at top
                                    if (currentY !== startY) {
                                        pdf.addPage();
                                        currentPage++;
                                        addHeaderFooter(currentPage);
                                        currentY = startY;
                                    }
                                    pdf.addImage(canvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, fullHeightMm, undefined, 'FAST');
                                    currentY += fullHeightMm + sectionSpacing;
                                    continue;
                                }

                                // Tall section: slice into page-sized chunks without overlap
                                const sliceHeightPx = Math.floor((usableHeight * canvas.width) / contentWidth); // px per full page chunk
                                let y = 0;
                                while (y < canvas.height) {
                                    const remainingPx = canvas.height - y;
                                    const nextSlicePx = Math.min(sliceHeightPx, remainingPx);
                                    const sliceCanvas = document.createElement('canvas');
                                    sliceCanvas.width = canvas.width;
                                    sliceCanvas.height = nextSlicePx;
                                    const ctx = sliceCanvas.getContext('2d');
                                    ctx.drawImage(canvas, 0, y, canvas.width, nextSlicePx, 0, 0, canvas.width, nextSlicePx);
                                    const sliceMm = pxToMm(nextSlicePx, canvas.width);

                                    // Always start slices at top of a fresh page to keep continuity clean
                                    if (currentY !== startY) {
                                        pdf.addPage();
                                        currentPage++;
                                        addHeaderFooter(currentPage);
                                        currentY = startY;
                                    }
                                    pdf.addImage(sliceCanvas.toDataURL('image/png'), 'PNG', margin, currentY, contentWidth, sliceMm, undefined, 'FAST');
                                    y += nextSlicePx;
                                    // Prepare next page if more slices remain
                                    if (y < canvas.height) {
                                        pdf.addPage();
                                        currentPage++;
                                        addHeaderFooter(currentPage);
                                        currentY = startY;
                                    } else {
                                        currentY += sliceMm + sectionSpacing;
                                    }
                                }
                            }

                            // Restore modified scroll styles
                            revertedStyles.forEach(({ el, style }) => {
                                el.style.overflow = style.overflow;
                                el.style.whiteSpace = style.whiteSpace;
                                el.style.flexWrap = style.flexWrap;
                            });
                            scrollExpanded.forEach(rec => {
                                const { el } = rec;
                                if (rec.height !== undefined) el.style.height = rec.height;
                                if (rec.maxHeight !== undefined) el.style.maxHeight = rec.maxHeight;
                                if (rec.overflow !== undefined) el.style.overflow = rec.overflow;
                                if (rec.overflowY !== undefined) el.style.overflowY = rec.overflowY;
                                if (rec.width !== undefined) el.style.width = rec.width;
                                if (rec.overflowX !== undefined) el.style.overflowX = rec.overflowX;
                            });

                            const fileName = `Sales_Report_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.pdf`;
                            setShowExportToast(true);
                            setTimeout(() => setShowExportToast(false), 2500);
                            setShowExportModal(true);
                            pdf.save(fileName); // triggers automatic download
                        } catch (err) {
                            console.error('PDF export failed', err);
                        } finally {
                            setIsExporting(false);
                        }
                    }}><ExportIcon /> {isExporting ? 'Exporting…' : 'Export PDF'}</button>
                    <button className="footer-btn share-btn"><ShareIcon /> Share Report</button>
                </footer>

                <DatePicker 
                    isOpen={showDatePicker}
                    onClose={() => setShowDatePicker(false)}
                    onDateSelect={handleDateSelect}
                />
            </div>

            {showExportToast && (
                <div className="export-toast" role="status" aria-live="polite">
                    <span className="check-icon" aria-hidden="true">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 6L9 17l-5-5" />
                        </svg>
                    </span>
                    Exported successfully
                </div>
            )}

            {showExportModal && (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="modal-card">
                        <div className="modal-icon">
                            <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" stroke="#4ade80" fill="#f0fdf4"/>
                                <path d="M20 6L9 17l-5-5" stroke="#4ade80" />
                            </svg>
                        </div>
                        <div className="modal-text">Exported successfully</div>
                        <button className="modal-btn" onClick={() => setShowExportModal(false)}>OK</button>
                    </div>
                </div>
            )}

            <style>
                {`
                    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

                    body {
                        margin: 0;
                        background-color: #f0f2f5;
                        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                    }

                    .report-container {
                        max-width: 600px;
                        width: 100vw;
                        margin: 0 auto;
                        background-color: #fff;
                        min-height: 100vh;
                        padding: 35px;
                        box-sizing: border-box;
                        position: relative;
                        padding-bottom: 4rem;
                    }
                    /* Remove decorative borders during PDF capture */
                    .report-container.capture-mode .trends-wrapper { border: none !important; box-shadow: none !important; }

                    @media (max-width: 768px) {
                        .report-container {
                            padding: 25px 25px 4rem 25px;
                        }
                    }

                    @media (max-width: 480px) {
                        .report-container {
                            padding: 25px 25px 4rem 25px;
                        }
                    }

                    .date-picker-overlay {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background-color: rgba(0, 0, 0, 0.5);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 1000;
                    }

                    .date-picker-popup {
                        background: white;
                        border-radius: 12px;
                        padding: 20px;
                        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
                        max-width: 300px;
                        width: 90%;
                    }

                    .calendar-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                        margin-bottom: 20px;
                    }

                    .calendar-header button {
                        background: none;
                        border: none;
                        font-size: 18px;
                        cursor: pointer;
                        padding: 5px 10px;
                        border-radius: 4px;
                    }

                    .calendar-header button:hover {
                        background-color: #f0f2f5;
                    }

                    .calendar-header h3 {
                        margin: 0;
                        font-size: 16px;
                        font-weight: 600;
                    }

                    .calendar-weekdays {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 5px;
                        margin-bottom: 10px;
                    }

                    .weekday {
                        text-align: center;
                        font-size: 12px;
                        font-weight: 500;
                        color: #6c757d;
                        padding: 5px;
                    }

                    .calendar-grid {
                        display: grid;
                        grid-template-columns: repeat(7, 1fr);
                        gap: 5px;
                    }

                    .calendar-day {
                        aspect-ratio: 1;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 14px;
                        cursor: pointer;
                        border-radius: 4px;
                        transition: background-color 0.2s;
                    }

                    .calendar-day:hover {
                        background-color: #f0f2f5;
                    }

                    .calendar-day.today {
                        background-color: #007aff;
                        color: white;
                    }

                    .calendar-day.empty {
                        cursor: default;
                    }

                    .calendar-day.empty:hover {
                        background-color: transparent;
                    }

                    .report-header {
                        display: flex;
                        flex-direction: column;
                        padding: 0.5rem 0;
                        margin-bottom: 1rem;
                    }

                    .header-row {
                        display: flex;
                        justify-content: flex-start;
                        align-items: center;
                        gap: 1rem;
                    }

                    .report-header h1 {
                        font-size: 1.2rem;
                        font-weight: 600;
                        margin: 0;
                    }

                    .date-picker {
                        display: flex;
                        align-items: center;
                        justify-content: space-between;
                        background-color: #f0f2f5;
                        padding: 0.5rem 1rem;
                        border-radius: 8px;
                        font-size: 0.9rem;
                        font-weight: 500;
                        width: 100%;
                        margin-top: 1rem;
                                                position: relative;
                    }

                                        /* Match stockrepo dropdown styles */
                                        .period-trigger {
                                            flex: 1;
                                            display: flex;
                                            align-items: center;
                                            justify-content: space-between;
                                            color: #000;
                                            padding: 10px 14px;
                                            cursor: pointer;
                                        }
                                        .period-trigger .label { font-weight: 500; font-size: 14px; }

                                        .period-menu {
                                            position: absolute;
                                            top: calc(100% + 6px);
                                            left: 46px; /* leave space for calendar icon */
                                            right: 0;
                                            background: #fff;
                                            border: 1px solid #e5e7eb;
                                            border-radius: 12px;
                                            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.18);
                                            z-index: 1100;
                                            padding: 6px; /* soften edge */
                                        }
                                        .period-menu .select-list {
                                            max-height: 240px;
                                            overflow-y: auto;
                                            overflow-x: hidden;
                                            -webkit-overflow-scrolling: touch;
                                            border-radius: 10px;
                                            background: #fff;
                                            clip-path: inset(0 round 10px);
                                        }
                                        .period-option {
                                            padding: 12px 14px;
                                            display: flex;
                                            align-items: center;
                                            justify-content: space-between;
                                            cursor: pointer;
                                            font-size: 14px;
                                            font-weight: 500;
                                        }
                                        .period-option:hover { background: #f5f5f5; }
                                        .period-option.active { background: #f5f5f5; font-weight: 600; }
                                        .chevron-down {
                                                border: solid black;
                                                border-width: 0 2px 2px 0;
                                                display: inline-block;
                                                padding: 3px;
                                                transform: rotate(45deg);
                                                -webkit-transform: rotate(45deg);
                                                position: absolute;
                                                right: 1rem;
                                        }

                    .section-title {
                        font-size: 1.1rem;
                        font-weight: 600;
                        margin: 2rem 0 1rem 0;
                        text-align: left;
                    }

                    .percentage-up {
                        color: #34c759;
                        font-size: 0.95rem;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                        margin: 0;
                    }

                    .stats-grid {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                    }

                    .stat-card {
                        background-color: #fff;
                        border-radius: 12px;
                        padding: 1rem;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                        text-align: left;
                    }

                    @media (max-width: 480px) {
                        .stats-grid {
                            grid-template-columns: repeat(2, 1fr);
                            gap: 0.75rem;
                        }
                    }

                    .card-title {
                        font-size: 0.9rem;
                        color: #6c757d;
                        margin: 0 0 0.5rem 0;
                        padding-bottom:5px;
                    }

                    .card-value {
                        font-size: 1.3rem;
                        font-weight: 700;
                        color: #000;
                        margin: 0;
                        padding-bottom:10px;
                    }

                    .payment-methods {
                        display: flex;
                        flex-direction: row;
                        gap: 1rem;
                        justify-content: space-between;
                    }

                    .payment-card {
                        background-color: #fff;
                        border-radius: 12px;
                        padding: 1rem;
                        border: 2px solid transparent;
                        display: flex;
                        justify-content: space-between;
                        align-items: flex-start;
                        flex: 1;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                    }

                    @media (max-width: 600px) {
                        .payment-methods {
                            flex-direction: row !important;
                            gap: 0.5rem;
                        }
                        .payment-card {
                            padding: 0.7rem 0.3rem;
                        }
                    }

                    .payment-left {
                        display: flex;
                        flex-direction: column;
                        align-items: flex-start;
                    }

                    .payment-left svg {
                        margin-bottom: 0.5rem;
                    }

                    .payment-title {
                        margin: 0;
                        font-weight: 500;
                    }

                    .payment-right {
                        text-align: right;
                    }

                    .payment-percent {
                        margin: 0;
                        font-weight: 700;
                        font-size: 1.2rem;
                        color: #3B82F6;
                        padding-bottom: 0.2rem;
                    }

                    .payment-value {
                        margin: 0.5rem 0 0 0;
                        color: #22C55E;
                        font-size: 0.8rem;
                    }

                    .trends-wrapper {
                        background-color: #ffffff;
                        border-radius: 12px;
                        padding: 1.3rem;
                        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
                        margin-bottom: 1.5rem;
                    }

                    .trend-container {
                        background-color: #F9FAFB;
                        border-radius: 12px;
                        padding: 1.5rem;
                        height: 200px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-bottom: 1rem;
                        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    }

                    /* During capture, drop chart shadows/borders entirely */
                    .report-container.capture-mode .trends-wrapper {
                        box-shadow: none !important;
                        border: none !important;
                    }

                    @media (max-width: 768px) {
                        .trends-wrapper {
                            padding: 1rem;
                        }
                        
                        .trend-container {
                            padding: 1rem;
                            height: auto;
                            min-height: 180px;
                        }
                    }

                    @media (max-width: 480px) {
                        .trends-wrapper {
                            padding: 0.75rem;
                        }
                        
                        .trend-container {
                            padding: 0.75rem;
                            min-height: 160px;
                        }
                    }

                    .trend-card-main {
                        text-align: center;
                    }

                    .trend-card-main h3 {
                        margin: 0 0 0.5rem 0;
                        font-weight: 600;
                        font-size: 1.5rem;
                        padding-bottom:5px;
                        line-height: 28px;
                    }

                    .trend-peak {
                        font-size: 1.2rem;
                        font-weight: 700;
                        color: #007aff;
                        margin: 0 0 0.5rem 0;
                        padding: 10px;
                    }

                    .trend-peak.secondary {
                        color: #007aff;
                    }

                    .profit-details {
                        display: flex;
                        flex-direction: column;
                        gap: 0.5rem;
                        margin-top: 1rem;
                    }

                    .trend-days {
                        display: flex;
                        gap: 0.75rem;
                        margin-top: 1.5rem;
                        overflow-x: auto;
                        white-space: nowrap;
                        padding-bottom: 0.5rem;
                        -webkit-overflow-scrolling: touch;
                    }

                    .day-card {
                        flex: 0 0 auto;
                        background-color: #000;
                        color: #fff;
                        text-align: center;
                        padding: 0.75rem;
                        border-radius: 8px;
                        font-weight: 500;
                        font-size: 0.9rem;
                        width: 100px;
                        box-sizing: border-box;
                    }

                    @media (max-width: 480px) {
                        .trend-days {
                            gap: 0.5rem;
                        }
                        
                        .day-card {
                            padding: 0.5rem;
                            font-size: 0.8rem;
                            width: 80px;
                        }
                        
                        .day-card span {
                            font-size: 0.8rem;
                        }
                    }

                    .day-card span {
                        display: block;
                        font-weight: 600;
                        margin-top: 0.25rem;
                        color: #22C55E;
                    }

                    .section-header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }

                    .items-list {
                        display: flex;
                        flex-direction: column;
                        gap: 0;
                        max-height: 267px;
                        overflow-y: auto;
                        padding-right: 8px;
                    }

                    .item-cards {
                        display: flex;
                        align-items: center;
                        padding: 0.75rem 0;
                        border-bottom: 1px solid #e9ecef;
                        min-height: 65px;
                    }

                    @media (max-width: 480px) {
                        .section-header {
                            margin-top: 1.5rem;
                        }
                        
                        .section-title {
                            font-size: 1rem;
                        }
                        
                        .item-cards {
                            padding: 0.5rem 0;
                        }
                        
                        .item-cards img {
                            width: 40px;
                            height: 40px;
                            margin-right: 0.75rem;
                        }
                        
                        .item-name {
                            font-size: 0.9rem;
                        }
                        
                        .item-sold {
                            font-size: 0.75rem;
                        }
                        
                        .item-price {
                            font-size: 0.9rem;
                        }
                    }

                    .item-cards:last-child {
                        border-bottom: none;
                    }

                    .item-cards img {
                        width: 50px;
                        height: 50px;
                        border-radius: 8px;
                        object-fit: cover;
                        margin-right: 1rem;
                    }

                    .item-info {
                        flex-grow: 1;
                        text-align: left;
                        padding-left: 0.5rem;
                    }

                    .item-name {
                        font-weight: 600;
                        margin: 0;
                        text-align: left;
                    }

                    .item-sold {
                        font-size: 0.85rem;
                        color: #6c757d;
                        margin: 0.25rem 0 0 0;
                    }

                    .item-revenue {
                        text-align: right;
                    }

                    .item-price {
                        font-weight: 600;
                        margin: 0;
                        font-size: 14px;
                        line-height:20px;
                        color: black;
                    }

                    .item-revenue .percentage-up {
                        justify-content: flex-end;
                    }

                    .analysis-card {
                        background-color: #fff;
                        border-radius: 12px;
                        padding: 1.5rem;
                        border: 1px solid #E5E7EB;
                    }

                    .analysis-title {
                        font-weight: 600;
                        font-size: 1.1rem;
                        margin: 0 0 1rem 0;
                        text-align: left;
                        padding-bottom: 0.3rem;
                    }

                    @media (max-width: 480px) {
                        .analysis-card {
                            padding: 1rem;
                        }
                        
                        .analysis-title {
                            font-size: 1rem;
                        }
                        
                        .analysis-row {
                            font-size: 0.9rem;
                        }
                    }

                    .analysis-row {
                        display: flex;
                        justify-content: space-between;
                        padding: 0.75rem 0;
                        border-bottom: 1px solid #e9ecef;
                    }

                    .analysis-row:last-child {
                        border-bottom: none;
                        padding-bottom: 0;
                    }

                    .analysis-row:first-of-type {
                        padding-top: 0;
                    }

                    .analysis-row span:first-child {
                        color: #6c757d;
                    }

                    .analysis-row span:last-child {
                        font-weight: 600;
                    }

                    .report-footer {
                        display: flex;
                        gap: 1rem;
                        padding: 1rem 0;
                    }

                    .footer-btn {
                        flex: 1;
                        padding: 0.75rem;
                        border-radius: 8px;
                        border: none;
                        font-size: 0.9rem;
                        font-weight: 600;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 0.5rem;
                    }

                    @media (max-width: 480px) {
                        .report-footer {
                            flex-direction: column;
                            gap: 0.75rem;
                            padding: 1.5rem 0 1rem;
                        }
                        
                        .footer-btn {
                            padding: 0.75rem 0;
                            font-size: 0.85rem;
                        }
                    }

                    .export-btn {
                        background-color: #e9ecef;
                        color: #000;
                    }

                    .share-btn {
                        background-color: #000;
                        color: #fff;
                    }

                    .revenue-growth {
                        color: #F86C36;
                        font-size: 0.95rem;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                        margin: 0;
                        padding: 0 0 5px 15px;
                    }

                    .gross-profit {
                        color: #34c759;
                        font-size: 0.95rem;
                        font-weight: 500;
                        display: flex;
                        align-items: center;
                        gap: 0.25rem;
                        margin: 0;
                        padding-left: 15px;
                    }

                    /* Custom scrollbar styles */
                    .items-list,
                    .trend-days {
                        scrollbar-width: thin;
                        scrollbar-color: #cfd8dc #f0f2f5;
                    }

                    .items-list::-webkit-scrollbar,
                    .trend-days::-webkit-scrollbar {
                        width: 6px;
                        height: 6px;
                        background: #f0f2f5;
                        border-radius: 8px;
                    }

                    .items-list::-webkit-scrollbar-thumb,
                    .trend-days::-webkit-scrollbar-thumb {
                        background: #cfd8dc;
                        border-radius: 8px;
                    }

                    .items-list::-webkit-scrollbar-thumb:hover,
                    .trend-days::-webkit-scrollbar-thumb:hover {
                        background: #b0bec5;
                    }
                    
                    /* Highlighted section styling */
                    .highlighted-section {
                        animation: highlight-pulse 1.5s ease-in-out;
                        border: 3px solid #3b82f6;
                        box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
                    }
                    
                    @keyframes highlight-pulse {
                        0% { box-shadow: 0 0 5px rgba(59, 130, 246, 0.3); }
                        50% { box-shadow: 0 0 20px rgba(59, 130, 246, 0.7); }
                        100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.5); }
                    }

                    /* ================= Extra Cards (Profit + Peak Hour) ================= */
                    .extra-cards {
                        display: grid;
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                        margin-top: 1.5rem;
                    }

                    .profit-card, .peak-card {
                        background: #fff;
                        border-radius: 12px;
                        padding: 1rem;
                        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                        text-align: center;
                    }

                    .profit-card h3, .peak-card h3 {
                        margin: 0 0 0.5rem;
                        font-size: 1rem;
                        font-weight: 600;
                    }

                    .profit-card p, .peak-card p {
                        margin: 0;
                        font-size: 1.3rem;
                        font-weight: 700;
                        color: #000;
                    }


                    .trend-card {
    background: #fff;
    border-radius: 12px;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    border: 1px solid #e5e7eb;
    text-align: center;
}

.trend-title {
    font-size: 1.2rem;
    font-weight: 700;
    margin: 0 0 0.75rem 0;
}

.trend-value {
    font-size: 1.1rem;
    font-weight: 600;
    color: #2563eb;
    margin-bottom: 1rem;
}

.gross-profit {
    color: #34c759;
    font-size: 0.95rem;
    font-weight: 500;
    margin: 0.25rem 0;
}

.revenue-growth {
    color: #f86c36;
    font-size: 0.95rem;
    font-weight: 500;
    margin: 0.25rem 0;
}

.trend-peak {
    font-size: 1rem;
    font-weight: 600;
    color: #007aff;
    margin-bottom: 1rem;
}

/* Hour breakdown grid */
.hour-grid {
    display: flex;
    justify-content: space-around;
    margin-top: 1rem;
}

.hour-item {
    text-align: center;
    font-size: 0.9rem;
}

.hour-item span {
    display: block;
}

.hour-value {
    margin-top: 0.25rem;
    color: #22c55e;
    font-weight: 600;
}

/* Center popup style for export success */
.export-toast {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #ffffff;
    border: 1px solid #a7f3d0;
    color: #065f46;
    padding: 26px 34px 22px;
    border-radius: 22px;
    box-shadow: 0 22px 48px -12px rgba(16, 185, 129, 0.35), 0 8px 20px -6px rgba(16,185,129,0.25);
    z-index: 2147483647;
    font-weight: 600;
    font-size: 1rem;
    display: flex;
    align-items: center;
    gap: 14px;
    pointer-events: none;
    animation: exportPop .38s cubic-bezier(.4,0,.2,1);
}

.export-toast .check-icon {
    width: 42px;
    height: 42px;
    border-radius: 50%;
    background: #10b981;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
    box-shadow: 0 0 0 6px #d1fae5;
}

@keyframes exportPop { from { opacity:0; transform: translate(-50%, -46%) scale(.9);} to { opacity:1; transform: translate(-50%, -50%) scale(1);} }

/* Centered success modal */
.modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2147483647;
}

.modal-card {
    background: #fff;
    width: min(92vw, 360px);
    border-radius: 16px;
    padding: 24px 16px 16px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.25);
    text-align: center;
}

.modal-icon { margin-bottom: 8px; display:flex; justify-content:center; }

.modal-text {
    font-weight: 700;
    color: #0f172a;
    margin: 8px 0 16px;
}

.modal-btn {
    background: #22c55e;
    color: #fff;
    border: none;
    border-radius: 999px;
    padding: 8px 14px;
    font-weight: 700;
    cursor: pointer;
    width: auto;
    min-width: 96px;
    font-size: 0.9rem;
    margin: 0 auto;
}



                `}
            </style>



        </>
    );
};

export default SalesReport;
