import React, { useState, useRef } from 'react';
import { OCRService } from '../services';

const OCRUpload = ({ goTo }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [error, setError] = useState(null);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const fileInputRef = useRef(null);

  const [ocrOptions, setOcrOptions] = useState({
    language: 'eng',
    skipCompression: false
  });

  React.useEffect(() => {
    loadUploadedImages();
  }, []);

  const loadUploadedImages = async () => {
    setIsLoadingImages(true);
    try {
      const response = await OCRService.getUploadedImages(1, null, 10);
      setUploadedImages(response.data || []);
    } catch (err) {
      console.error('Error loading uploaded images:', err);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrResult(null);
      setError(null);
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setOcrResult(null);
      setError(null);
    }
  };

  const handleDragOver = (event) => {
    event.preventDefault();
  };

  const processOCR = async () => {
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setOcrResult(null);

    try {
      const result = await OCRService.processImage(selectedFile, ocrOptions);
      setOcrResult(result);
      
      // Reload uploaded images to show the new one
      await loadUploadedImages();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const processExistingImage = async (imageId) => {
    setIsProcessing(true);
    setError(null);
    setOcrResult(null);

    try {
      const result = await OCRService.processOCR(imageId);
      setOcrResult(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const clearSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setOcrResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const goToStockIn = () => {
    if (ocrResult && goTo) {
      // Pass OCR result to StockInForm
      goTo('stock-in', { ocrData: ocrResult });
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>📄 OCR Document Scanner</h2>
        {goTo && (
          <button
            onClick={() => goTo('overview')}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            ← Back to Overview
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Upload Section */}
        <div>
          <h3>Upload New Image</h3>
          
          {/* File Upload Area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            style={{
              border: '2px dashed #ddd',
              borderRadius: '8px',
              padding: '40px',
              textAlign: 'center',
              backgroundColor: '#f8f9fa',
              cursor: 'pointer',
              marginBottom: '20px'
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            {previewUrl ? (
              <div>
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '4px',
                    marginBottom: '10px'
                  }}
                />
                <p>{selectedFile?.name}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearSelection();
                  }}
                  style={{
                    padding: '5px 10px',
                    backgroundColor: '#dc3545',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Clear
                </button>
              </div>
            ) : (
              <div>
                <p style={{ fontSize: '48px', margin: '0' }}>📁</p>
                <p>Click or drag & drop an image here</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  Supports: JPG, PNG, GIF, BMP, TIFF
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
          />

          {/* OCR Options */}
          <div style={{
            backgroundColor: '#f8f9fa',
            padding: '16px',
            borderRadius: '8px',
            marginBottom: '20px'
          }}>
            <h4>OCR Options</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px' }}>
                  Language:
                </label>
                <select
                  value={ocrOptions.language}
                  onChange={(e) => setOcrOptions(prev => ({ ...prev, language: e.target.value }))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="eng">English</option>
                  <option value="hin">Hindi</option>
                  <option value="eng+hin">English + Hindi</option>
                </select>
              </div>
              
              {/* Engine selection removed (not applicable for Google Vision) */}
            </div>
            
            <div style={{ marginTop: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', fontSize: '14px', marginTop: '0' }}>
                <input
                  type="checkbox"
                  checked={ocrOptions.skipCompression}
                  onChange={(e) => setOcrOptions(prev => ({ ...prev, skipCompression: e.target.checked }))}
                  style={{ marginRight: '8px' }}
                />
                Skip Image Compression
              </label>
            </div>
          </div>

          {/* Process Button */}
          <button
            onClick={processOCR}
            disabled={!selectedFile || isProcessing}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: !selectedFile || isProcessing ? '#6c757d' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !selectedFile || isProcessing ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {isProcessing ? '🔄 Processing...' : '🔍 Process OCR'}
          </button>
        </div>

        {/* Results Section */}
        <div>
          <h3>Results</h3>
          
          {error && (
            <div style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #f5c6cb'
            }}>
              Error: {error}
            </div>
          )}

          {ocrResult && (
            <div style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '16px',
              borderRadius: '8px',
              marginBottom: '16px',
              border: '1px solid #c3e6cb'
            }}>
              <h4>✅ OCR Processing Complete!</h4>
              
              {ocrResult.data?.items && ocrResult.data.items.length > 0 && (
                <div>
                  <p><strong>Found {ocrResult.data.items.length} items:</strong></p>
                  <ul style={{ marginLeft: '20px' }}>
          {ocrResult.data.items.slice(0, 3).map((item, index) => (
                      <li key={index}>
            {item.item_name} - {Number.isInteger(item.quantity) ? item.quantity : item.quantity} {item.unit} @ ₹{item.unit_price}
                      </li>
                    ))}
                    {ocrResult.data.items.length > 3 && (
                      <li>... and {ocrResult.data.items.length - 3} more items</li>
                    )}
                  </ul>
                  
                  <button
                    onClick={goToStockIn}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#28a745',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      marginTop: '10px',
                      fontWeight: 'bold'
                    }}
                  >
                    📦 Create Stock In Record
                  </button>
                </div>
              )}
              
              {ocrResult.data?.rawText && (
                <details style={{ marginTop: '12px' }}>
                  <summary style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                    View Raw OCR Text
                  </summary>
                  <pre style={{
                    backgroundColor: '#f8f9fa',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    marginTop: '8px'
                  }}>
                    {ocrResult.data.rawText}
                  </pre>
                </details>
              )}
            </div>
          )}

          {/* Previously Uploaded Images */}
          <div>
            <h4>Previously Uploaded Images</h4>
            {isLoadingImages ? (
              <p>Loading images...</p>
            ) : uploadedImages.length === 0 ? (
              <p style={{ color: '#666', fontStyle: 'italic' }}>No uploaded images found.</p>
            ) : (
              <div style={{
                maxHeight: '400px',
                overflowY: 'auto',
                border: '1px solid #ddd',
                borderRadius: '8px',
                padding: '12px'
              }}>
                {uploadedImages.map((image, index) => (
                  <div key={image.image_id || index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px',
                    borderBottom: '1px solid #f0f0f0',
                    marginBottom: '8px'
                  }}>
                    <div>
                      <strong>{image.filename || `Image ${index + 1}`}</strong>
                      <br />
                      <small style={{ color: '#666' }}>
                        {image.scan_type || 'Unknown'} • {new Date(image.upload_date || image.created_at).toLocaleDateString()}
                      </small>
                    </div>
                    <button
                      onClick={() => processExistingImage(image.image_id)}
                      disabled={isProcessing}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: isProcessing ? '#6c757d' : '#17a2b8',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: isProcessing ? 'not-allowed' : 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      {isProcessing ? '...' : 'Process'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OCRUpload;