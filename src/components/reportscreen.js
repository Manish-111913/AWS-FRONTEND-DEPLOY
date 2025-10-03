import React, { useState } from 'react';
import { IoStatsChart, IoBriefcase, IoTrash, IoChevronForward, IoArrowBack } from 'react-icons/io5';
import './reportscreen.css';
import { StandardSearch, highlightMatch } from '../styles/standardStyles';
// --- CORRECTED IMPORT PATH ---
// Changed from './components/stockrepo.js' to './StockRepo.js'
import { StockAndWastageReportsDetail } from './stockrepo.js';

// --- Data for the Main Reports Screen with updated names ---
const reportData = {
  sales: [
    { id: 'sales-0', title: "Daily Sales Summary", subtitle: "Overview of daily revenue and transactions", screen: "sales-report", section: "sales-trend" },
    { id: 'sales-1', title: "Sale Trend", subtitle: "Performance analysis by menu categories", screen: "sales-report", section: "gross-profit" },
    { id: 'sales-2', title: "Top Items by Revenue", subtitle: "Sales distribution throughout the day", screen: "sales-report", section: "top-items" },
  ],
  stock: [
    { id: 'stock-itemwise', title: "Item Wise Sales Report", subtitle: "Items requiring immediate restock" },
    { id: 'stock-performance', title: "Performance analytics", subtitle: "Current stock worth and valuation" },
    { id: 'stock-consumption', title: "Raw Material Consumption", subtitle: "Consumption patterns and trends" },
  ],
  wastage: [
    { id: 'wastage-comparison', title: "Wastage Comparison", subtitle: "Daily food waste tracking" },
  ],
};


// --- Placeholder for Sales Reports Detail View ---
const SalesReportsDetailView = ({ onBack, selectedReportId }) => {
  const report = reportData.sales.find(r => r.id === selectedReportId);
  return (
    <div className="screen-content">
      <header className="reports-header">
        <button onClick={onBack} className="back-button"><IoArrowBack size={24} /></button>
        <h1>Sales Report Detail</h1>
      </header>
      <main className="reports-list" style={{padding:'0.7rem'}}>
        <div className="report-card highlighted">
          <div className="card-text">
            <div className="card-title">{report?.title}</div>
            <div className="card-subtitle">{report?.subtitle}</div>
            <p style={{ color: 'var(--highlight-color)', fontSize: '0.8rem', marginTop: '8px' }}>A detailed view for this sales report would be shown here.</p>
          </div>
        </div>
      </main>
    </div>
  );
};

const ReportsScreen = ({ goTo }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [view, setView] = useState('list');
  const [selectedReportId, setSelectedReportId] = useState(null);

  const handleReportClick = (reportId) => {
    // Find the report data to check if it has a specific screen to navigate to
    const reportSection = Object.keys(reportData).find(section => 
      reportData[section].some(report => report.id === reportId)
    );
    
    if (reportSection) {
      const report = reportData[reportSection].find(r => r.id === reportId);
      
      // Check if this report should navigate to a specific screen
      if (report && report.screen) {
        // Navigate to the specified screen with the section info
        if (goTo) {
          if (report.section) {
            sessionStorage.setItem('highlightSection', report.section);
          }
          goTo(report.screen);
        }
        return;
      }
    }
    
    // Default behavior for reports without specific screens
    setSelectedReportId(reportId);
    setView('details');
  };

  const handleBack = () => {
    setView('list');
    setSelectedReportId(null);
  };

  const getFilteredReports = () => {
    if (!searchTerm) return reportData;
    const filtered = {};
    Object.keys(reportData).forEach((section) => {
      if (!searchTerm.trim()) {
        filtered[section] = reportData[section];
        return;
      }
      
      const searchLower = searchTerm.toLowerCase();
      
      // Priority 1: Items with title starting with search term
      const titleStartsWithMatches = reportData[section].filter(item =>
        item.title.toLowerCase().startsWith(searchLower)
      );
      
      // Priority 2: Items with subtitle starting with search term (but title doesn't start with it)
      const subtitleStartsWithMatches = reportData[section].filter(item =>
        !item.title.toLowerCase().startsWith(searchLower) &&
        item.subtitle.toLowerCase().startsWith(searchLower)
      );
      
      // Priority 3: Items containing search term in title (but not starting with it)
      const titleContainsMatches = reportData[section].filter(item =>
        item.title.toLowerCase().includes(searchLower) &&
        !item.title.toLowerCase().startsWith(searchLower)
      );
      
      // Priority 4: Items containing search term in subtitle (but not starting with it)
      const subtitleContainsMatches = reportData[section].filter(item =>
        !item.title.toLowerCase().includes(searchLower) &&
        item.subtitle.toLowerCase().includes(searchLower) &&
        !item.subtitle.toLowerCase().startsWith(searchLower)
      );
      
      const filteredItems = [
        ...titleStartsWithMatches,
        ...subtitleStartsWithMatches,
        ...titleContainsMatches,
        ...subtitleContainsMatches
      ];
      
      if (filteredItems.length > 0) {
        filtered[section] = filteredItems;
      }
    });
    return filtered;
  };

  const filteredReports = getFilteredReports();

  const ReportCard = ({ id, title, subtitle, onClick }) => (
    <div className="report-card" onClick={onClick}>
      <div className="card-text">
        <div className="card-title">{highlightMatch(title, searchTerm)}</div>
        <div className="card-subtitle">{highlightMatch(subtitle, searchTerm)}</div>
      </div>
      <IoChevronForward className="card-arrow-icon" />
    </div>
  );

  const renderCurrentView = () => {
    if (view === 'details') {
      if (selectedReportId.startsWith('stock') || selectedReportId.startsWith('wastage')) {
        return <StockAndWastageReportsDetail onBack={handleBack} selectedReportId={selectedReportId} />;
      } else {
        return <SalesReportsDetailView onBack={handleBack} selectedReportId={selectedReportId} />;
      }
    }

    return (
      <div className="screen-content">
        <header className="reports-header"><h1>Reports</h1></header>
        <div className="search-container">
          <StandardSearch
            style={{width:'100%'}}
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search reports"
          />
        </div>
        <main className="reports-list" style={{padding:'0.7rem'}}>
          {Object.keys(filteredReports).length > 0 ? (
            <>
              {filteredReports.sales && (
                <section className="report-section">
                  <div className="section-title-header"><IoStatsChart className="section-icon" /><h3>Sales Reports</h3></div>
                  {filteredReports.sales.map((item) => (<ReportCard key={item.id} {...item} onClick={() => handleReportClick(item.id)} />))}
                </section>
              )}
              {filteredReports.stock && (
                <section className="report-section">
                  <div className="section-title-header"><IoBriefcase className="section-icon" /><h3>Stock Report</h3></div>
                  {filteredReports.stock.map((item) => (<ReportCard key={item.id} {...item} onClick={() => handleReportClick(item.id)} />))}
                </section>
              )}
              {filteredReports.wastage && (
                <section className="report-section">
                  <div className="section-title-header"><IoTrash className="section-icon" /><h3>Wastage Reports</h3></div>
                  {filteredReports.wastage.map((item) => (<ReportCard key={item.id} {...item} onClick={() => handleReportClick(item.id)} />))}
                </section>
              )}
            </>
          ) : (
            <div className="no-results"><p>No reports found for "{searchTerm}"</p></div>
          )}
        </main>
      </div>
    );
  };

  // Handle navigation from the report screen
  const handleNavigate = (screen) => {
    if (goTo) {
      goTo(screen);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="phone-container">
        {renderCurrentView()}
        {/* We're using the app's global FooterNav now, so no need for a footer here */}
      </div>
    </div>
  );
};

export default ReportsScreen;