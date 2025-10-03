import React, { useState, useEffect } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import QRCode from 'qrcode';
import './QRManagement.css';

const QRManagement = () => {
    const [qrCodes, setQrCodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [generatedQR, setGeneratedQR] = useState(null);
    const [tablesCount, setTablesCount] = useState('');
    const [searchTable, setSearchTable] = useState('');
    const [bulkQRCodes, setBulkQRCodes] = useState([]);
    const [bulkGenerating, setBulkGenerating] = useState(false);

    // Generate bulk QR codes based on table count
    const generateBulkQRCodes = async () => {
        if (!tablesCount.trim() || parseInt(tablesCount) <= 0) {
            setError('Please enter a valid number of tables');
            return;
        }

        setBulkGenerating(true);
        setError('');
        setGeneratedQR(null); // Clear any single QR display

        try {
            const count = parseInt(tablesCount);
            const tableNumbers = [];
            for (let i = 1; i <= count; i++) {
                tableNumbers.push(i.toString());
            }

            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api'}/qr/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    tables: tableNumbers,
                    businessId: 1
                }),
            });

            const data = await response.json();

            if (response.ok) {
                // Handle both new and existing QR codes
                let allQRCodes = data.qrCodes || [];
                
                // If there are existing QR codes in errors, add them to the list
                if (data.errors && data.errors.length > 0) {
                    const existingQRs = data.errors
                        .filter(error => error.existing)
                        .map(error => ({
                            ...error.existing,
                            table_number: error.table
                        }));
                    allQRCodes = [...allQRCodes, ...existingQRs];
                }
                
                console.log('Bulk QR Codes processed:', allQRCodes);
                
                // Sort the QR codes by table number in ascending order
                const sortedQRCodes = allQRCodes.sort((a, b) => {
                    const tableA = parseInt(a.table_number);
                    const tableB = parseInt(b.table_number);
                    return tableA - tableB;
                });
                setBulkQRCodes(sortedQRCodes);
                setTablesCount('');
                setError('');
            } else {
                setError(data.error || 'Failed to generate QR codes');
            }
        } catch (err) {
            setError('Network error occurred');
            console.error('Error:', err);
        } finally {
            setBulkGenerating(false);
        }
    };

    // Search for specific table from the generated bulk codes
    const handleTableSearch = () => {
        if (!searchTable.trim()) {
            setError('Please enter a table number to search');
            return;
        }
        
        if (bulkQRCodes.length === 0) {
            setError('Please generate tables first using the table count above');
            return;
        }

        const foundQR = bulkQRCodes.find(qr => qr.table_number === searchTable);
        if (foundQR) {
            setGeneratedQR(foundQR);
            setError('');
        } else {
            setError(`Table ${searchTable} not found in generated tables (1-${bulkQRCodes.length})`);
        }
        setSearchTable('');
    };

    const fetchQRCodes = async () => {
        try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'https://ofsmmmkot9.execute-api.ap-south-1.amazonaws.com/api'}/qr/list?businessId=1`);
            const data = await response.json();
            
            if (response.ok) {
                setQrCodes(data.qrCodes || []);
            }
        } catch (err) {
            console.error('Error fetching QR codes:', err);
        }
    };

    const downloadQRCode = async (qrCode) => {
        try {
            const qrCodeDataURL = await QRCode.toDataURL(qrCode.anchor_url, {
                width: 512,
                margin: 2,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF'
                }
            });

            const link = document.createElement('a');
            link.href = qrCodeDataURL;
            link.download = `QR-Table-${qrCode.table_number}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (err) {
            console.error('Error downloading QR code:', err);
            setError('Failed to download QR code');
        }
    };

    const copyURL = (url) => {
        navigator.clipboard.writeText(url).then(() => {
            alert('URL copied to clipboard!');
        }).catch(() => {
            alert('Failed to copy URL');
        });
    };

    useEffect(() => {
        fetchQRCodes();
    }, []);

    return (
        <div className="qr-management-container">
            <div className="qr-management-content">
                {/* Header */}
                <div className="qr-header">
                    <h1>🔗 QR Code Generator</h1>
                    <p>Enter number of tables to generate QR codes</p>
                </div>

                {/* Step 1: Generate Tables */}
                <div className="qr-main-card">
                    <div className="generate-section">
                        <h2>📋 Generate QR Codes</h2>
                        <div className="generate-group">
                            <input
                                type="number"
                                value={tablesCount}
                                onChange={(e) => setTablesCount(e.target.value)}
                                placeholder="Enter number of tables (e.g., 5 = tables 1-5)"
                                min="1"
                                max="100"
                                className="generate-input"
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter') {
                                        generateBulkQRCodes();
                                    }
                                }}
                            />
                            <button
                                onClick={generateBulkQRCodes}
                                disabled={bulkGenerating || !tablesCount.trim()}
                                className="generate-btn"
                            >
                                {bulkGenerating ? '🔄 Generating...' : `Generate Tables 1-${tablesCount || '0'}`}
                            </button>
                        </div>
                        
                        {error && <div className="error-message">{error}</div>}
                    </div>
                </div>

                {/* Step 2: Display Generated QR Codes */}
                {bulkQRCodes.length > 0 && (
                    <div className="qr-main-card">
                        <div className="qr-codes-header">
                            <h2>📱 Generated QR Codes ({bulkQRCodes.length})</h2>
                            <button 
                                className="refresh-btn"
                                onClick={() => setBulkQRCodes([])}
                            >
                                🔄 Refresh
                            </button>
                        </div>
                        
                        <div className="qr-codes-list">
                            {bulkQRCodes.map((qr, index) => (
                                <div key={qr.qr_id || index} className="qr-code-item">
                                    <div className="qr-item-header">
                                        <span className="table-number">{qr.table_number}</span>
                                        <div className="qr-badges">
                                            <span className="badge table-badge">TABLE</span>
                                            <span className="badge active-badge">ACTIVE</span>
                                        </div>
                                    </div>
                                    
                                    <div className="qr-item-body">
                                        <QRCodeCanvas
                                            value={qr.anchor_url}
                                            size={120}
                                            level="H"
                                            includeMargin={true}
                                        />
                                        <div className="qr-item-info">
                                            <p className="qr-title">QR Code for {qr.table_number}</p>
                                            <p className="qr-url">Anchor URL:</p>
                                            <p className="qr-url-text">{qr.anchor_url}</p>
                                            <p className="qr-created">Created: {new Date().toLocaleDateString()}</p>
                                        </div>
                                    </div>
                                    
                                    <div className="qr-item-actions">
                                        <button className="action-btn deactivate-btn">
                                            ⏸️ Deactivate
                                        </button>
                                        <button 
                                            className="action-btn download-btn"
                                            onClick={() => downloadQRCode(qr)}
                                        >
                                            🔒 Download
                                        </button>
                                        <button 
                                            className="action-btn copy-btn"
                                            onClick={() => copyURL(qr.anchor_url)}
                                        >
                                            📋 Copy URL
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Step 3: Search Specific Table */}
                {bulkQRCodes.length > 0 && (
                    <div className="qr-main-card">
                        <div className="search-section">
                            <h2>🔍 Find Specific Table</h2>
                            <div className="search-group">
                                <input
                                    type="number"
                                    value={searchTable}
                                    onChange={(e) => setSearchTable(e.target.value)}
                                    placeholder={`Search table (1-${bulkQRCodes.length})`}
                                    min="1"
                                    className="search-input"
                                    onKeyPress={(e) => {
                                        if (e.key === 'Enter') {
                                            handleTableSearch();
                                        }
                                    }}
                                />
                                <button
                                    onClick={handleTableSearch}
                                    disabled={loading || !searchTable.trim()}
                                    className="search-btn"
                                >
                                    🔍 Search
                                </button>
                            </div>
                        </div>

                        {/* Step 4: Display Single QR Code */}
                        {generatedQR && (
                            <div className="single-qr-display">
                                <div className="single-qr-header">
                                    <span className="single-table-number">{generatedQR.table_number}</span>
                                    <div className="single-qr-badges">
                                        <span className="badge table-badge">TABLE</span>
                                        <span className="badge active-badge">ACTIVE</span>
                                    </div>
                                </div>
                                
                                <div className="single-qr-container">
                                    <QRCodeCanvas
                                        value={generatedQR.anchor_url}
                                        size={300}
                                        level="H"
                                        includeMargin={true}
                                    />
                                </div>
                                
                                <div className="single-qr-info">
                                    <p className="single-qr-title">QR Code for {generatedQR.table_number}</p>
                                    <p className="single-qr-url-label">Anchor URL:</p>
                                    <div className="single-qr-url-container">
                                        <p className="single-qr-url">{generatedQR.anchor_url}</p>
                                    </div>
                                    <p className="single-qr-created">Created: {new Date().toLocaleDateString()}</p>
                                </div>
                                
                                <div className="single-qr-actions">
                                    <button className="single-action-btn deactivate-btn">
                                        ⏸️ Deactivate
                                    </button>
                                    <button 
                                        className="single-action-btn download-btn"
                                        onClick={() => downloadQRCode(generatedQR)}
                                    >
                                        🔒 Download
                                    </button>
                                    <button 
                                        className="single-action-btn copy-btn"
                                        onClick={() => copyURL(generatedQR.anchor_url)}
                                    >
                                        📋 Copy URL
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default QRManagement;