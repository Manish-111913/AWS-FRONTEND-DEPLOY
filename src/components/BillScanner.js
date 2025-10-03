import React, { useState, useRef, useCallback, useEffect } from 'react';
import { faCamera, faUpload, faSearch, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import './BillScanner-module.css';
import { autoCompressImage } from '../utils/imageCompression';
import { http } from '../services/apiClient';

const BillScanner = ({ onItemsExtracted, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [extractedItems, setExtractedItems] = useState([]);
  const [rawOcrText, setRawOcrText] = useState('');
  const [showRawText, setShowRawText] = useState(true); // default visible so user instantly sees it
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const controllerRef = useRef(null);
  const timeoutRef = useRef(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    if (controllerRef.current) {
      controllerRef.current.abort();
      controllerRef.current = null;
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  // Handle file selection
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Cleanup previous state
    setError(null);
    setSuccess(null);
    setExtractedItems([]);
  setRawOcrText('');
    setProcessingProgress(0);
    
    // Revoke previous preview URL to prevent memory leaks
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage);
    }

    setSelectedFile(file);
    
    // Validate file type - allow images and PDFs
    const isImage = file.type.startsWith('image/');
    const isPDF = file.type === 'application/pdf';
    
    if (!isImage && !isPDF) {
      setError('Please select a valid image file (JPG, PNG, etc.) or PDF file');
      return;
    }

    // Validate file size (max 50MB)
    if (file.size > 50 * 1024 * 1024) {
      setError('File is too large. Please select a file smaller than 50MB.');
      return;
    }
    
    // Create preview - only for images
    if (isImage) {
      const reader = new FileReader();
      reader.onload = (e) => {
        console.log('🖼️ Preview image created, length:', e.target.result.length);
        setPreviewImage(e.target.result);
      };
      reader.onerror = () => {
        setError('Failed to read the selected file');
      };
      reader.readAsDataURL(file);
    } else if (isPDF) {
      // Set a PDF placeholder for preview
      console.log('📄 PDF file selected:', file.name);
      setPreviewImage('PDF_PLACEHOLDER');
    }
  }, [previewImage]);

  // Handle camera capture
  const handleCameraCapture = useCallback(() => {
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  }, []);

  // Handle file upload
  const handleFileUpload = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // Cancel processing
  const cancelProcessing = useCallback(() => {
    cleanup();
    setIsProcessing(false);
    setProcessingProgress(0);
    setError('Processing cancelled by user');
  }, [cleanup]);

  // Update progress with safety checks
  const updateProgress = useCallback((progress) => {
    setProcessingProgress(prevProgress => {
      const newProgress = Math.min(Math.max(progress, prevProgress), 100);
      return newProgress;
    });
  }, []);

  // Process image with OCR
  const processImage = useCallback(async () => {
    if (!selectedFile) {
      setError('Please select an image first');
      return;
    }

    // Reset states
    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setProcessingProgress(0);
    setExtractedItems([]);

    let retryCount = 0;
    const maxRetries = 2;

    try {
      // Start progress simulation
      progressIntervalRef.current = setInterval(() => {
        updateProgress(prev => prev < 30 ? prev + 5 : prev);
      }, 500);
      
      // Check if file is PDF or image
      const isPDF = selectedFile.type === 'application/pdf';
      let fileToUpload = selectedFile;
      
      if (isPDF) {
        // PDF files don't need compression
        updateProgress(30);
        console.log('📄 PDF file selected, skipping compression:', {
          fileName: selectedFile.name,
          fileSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`
        });
      } else {
        // Compress image
        updateProgress(10);
        fileToUpload = await autoCompressImage(selectedFile);
        updateProgress(30);
        
        console.log('📏 Image compression results:', {
          originalSize: `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB`,
          compressedSize: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
          compressionRatio: `${(selectedFile.size / fileToUpload.size).toFixed(2)}x`
        });
      }

      // Clear progress interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      const formData = new FormData();
    formData.append('image', fileToUpload, selectedFile.name);
    formData.append('language', 'eng'); // Google Vision only needs language (optional)
    formData.append('mode', 'auto'); // auto: document first then fallback to text if zero items
  // Removed legacy OCR.space fields: engine, detectOrientation, isTable

  console.log('📤 Uploading image to OCR upload endpoint via centralized client');

      // Upload with timeout
      controllerRef.current = new AbortController();
      timeoutRef.current = setTimeout(() => {
        if (controllerRef.current) {
          controllerRef.current.abort();
        }
      }, 60000);

      updateProgress(40);

  const uploadResponse = await http.postForm('/ocr/upload', formData, { signal: controllerRef.current.signal });

      // Clear timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      updateProgress(60);

  const uploadResult = uploadResponse; // already parsed JSON
      console.log('📥 OCR Upload Result:', uploadResult);

      if (!uploadResult.success || !uploadResult.data?.image_id) {
        throw new Error(uploadResult.error || 'Upload did not return image_id');
      }

      const imageId = uploadResult.data.image_id;
      updateProgress(70);

      // Process with retry logic
      let processResult = null;
      let lastError = null;

      while (retryCount <= maxRetries && !processResult) {
        try {
          if (retryCount > 0) {
            console.log(`🔄 Retry attempt ${retryCount} of ${maxRetries}...`);
            setError(`Processing failed. Retrying... (${retryCount}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          updateProgress(75 + (retryCount * 5));

          processResult = await http.post(`/ocr/process/${imageId}`);
          console.log('✅ OCR Process Response:', processResult);
          break;
        } catch (err) {
          lastError = err;
          retryCount++;
          
          if (retryCount > maxRetries) {
            throw lastError;
          }
        }
      }

      updateProgress(90);

  if (processResult?.success && processResult?.data) {
        const extracted = processResult.data.items || [];
        const rawText = processResult.data.extracted_text || '';
    const vendorName = processResult.data.vendor_name || null;
    const vendorPhone = processResult.data.vendor_phone || null;

        setExtractedItems(extracted);
    setRawOcrText(rawText);
        updateProgress(100);
        
        // Small delay to show 100% completion
        setTimeout(() => {
          setSuccess(`Successfully extracted ${extracted.length} items from the image!`);
          
          if (onItemsExtracted) {
            onItemsExtracted({
              items: extracted,
              rawText,
              filename: selectedFile?.name || 'scanned-receipt',
      previewImage,
      vendor_name: vendorName,
      vendor_phone: vendorPhone
            });
          }
        }, 500);
      } else {
        throw new Error(processResult?.error || 'OCR processing failed - no data returned');
      }

    } catch (error) {
      console.error('❌ OCR processing error:', error);
      
      let errorMessage = 'Failed to process image';
      
      if (error.name === 'AbortError') {
        errorMessage = 'Request timed out. Please try again with a smaller image.';
      } else if (error.message.includes('fetch') || error.message.includes('NetworkError') || error.message.includes('Failed to fetch')) {
        errorMessage = `Cannot connect to server. Please check:
• Your device and computer are on the same network
• Backend server is running on your computer
• Use your computer's IP address instead of localhost`;
      } else if (error.message.includes('500')) {
        errorMessage = `Server error processing the receipt. Please try:
• Taking a clearer photo with good lighting
• Ensuring receipt text is clearly visible
• Using manual entry if problems persist`;
      } else if (error.message.includes('Processing failed')) {
        errorMessage = `Receipt processing failed after multiple attempts. Please try:
• Using a clearer image with better lighting
• Making sure all text is visible and straight
• Using manual entry if problems continue`;
      } else {
        errorMessage = error.message || 'Unknown error occurred';
      }
      
      setError(errorMessage);
      
      if (onError) {
        onError({
          ...error,
          previewImage: previewImage || (selectedFile ? URL.createObjectURL(selectedFile) : null)
        });
      }
    } finally {
      cleanup();
      setIsProcessing(false);
      
      // Reset progress after delay
      setTimeout(() => {
        setProcessingProgress(0);
      }, 2000);
    }
  }, [selectedFile, onItemsExtracted, onError, previewImage, updateProgress, cleanup]);

  // Reset scanner
  const resetScanner = useCallback(() => {
    console.log('🔄 Resetting scanner - clearing all state');
    
    // Cleanup any ongoing operations
    cleanup();
    
    // Revoke preview URL to prevent memory leaks
    if (previewImage && previewImage.startsWith('blob:')) {
      URL.revokeObjectURL(previewImage);
    }
    
    // Reset all state
    setSelectedFile(null);
    setPreviewImage(null);
    setExtractedItems([]);
    setError(null);
    setSuccess(null);
    setProcessingProgress(0);
    setIsProcessing(false);
    
    // Clear file inputs
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
  }, [previewImage, cleanup]);

  // Handle manual entry request
  const handleManualEntry = useCallback(() => {
    if (onError) {
      onError(new Error('user_requested_manual_entry'));
    }
  }, [onError]);

  // Handle continue with extracted items
  const handleContinueWithItems = useCallback(() => {
    if (onItemsExtracted && extractedItems.length > 0) {
      onItemsExtracted({
        items: extractedItems,
        rawText: rawOcrText,
        filename: selectedFile?.name || 'scanned-receipt',
        previewImage: previewImage
      });
    }
  }, [onItemsExtracted, extractedItems, selectedFile, previewImage, rawOcrText]);

  return (
    <div className="bill-scanner-container">
      {!previewImage && (
        <div className="scanner-options">
          <div 
            className="scan-bill-section" 
            onClick={handleCameraCapture}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleCameraCapture()}
          >
            <FontAwesomeIcon icon={faCamera} className="camera-icon" />
            <div className="scan-title">Scan Bill</div>
            <div className="scan-subtitle">Take a photo of your bill</div>
          </div>

          <div 
            className="upload-section" 
            onClick={handleFileUpload}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && handleFileUpload()}
          >
            <FontAwesomeIcon icon={faUpload} className="upload-icon" />
            <div className="upload-title">Upload Image or PDF</div>
            <div className="upload-subtitle">Choose from gallery</div>
          </div>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        onChange={handleFileSelect}
        className="file-input"
        style={{ display: 'none' }}
      />
      
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="file-input"
        style={{ display: 'none' }}
      />

      {/* Image/PDF Preview */}
      {previewImage && (
        <div className="image-preview">
          {previewImage === 'PDF_PLACEHOLDER' ? (
            <div className="pdf-preview-placeholder">
              <FontAwesomeIcon icon={faUpload} className="pdf-icon" style={{ fontSize: '48px', color: '#666' }} />
              <div className="pdf-info">
                <p><strong>PDF Selected</strong></p>
                <p>{selectedFile?.name}</p>
                <p>Ready for processing</p>
              </div>
            </div>
          ) : (
            <img 
              src={previewImage} 
              alt="Receipt preview" 
              className="preview-image"
              onError={() => setError('Failed to load preview image')}
            />
          )}
          
          <div className="preview-actions">
            <button 
              onClick={resetScanner}
              className="reset-button"
              disabled={isProcessing}
              type="button"
            >
              {previewImage === 'PDF_PLACEHOLDER' ? 'Select Another File' : 'Take Another Photo'}
            </button>
            
            <button 
              onClick={processImage}
              className="process-button"
              disabled={isProcessing || !selectedFile}
              type="button"
            >
              <FontAwesomeIcon icon={faSearch} style={{ marginRight: '8px' }} />
              {isProcessing ? 'Processing...' : 'Extract Items'}
            </button>
          </div>
        </div>
      )}

      {/* Error message with fallback option */}
      {error && (
        <div className="error-container">
          <div className="error-message">
            <FontAwesomeIcon icon={faExclamationTriangle} style={{ marginRight: '8px', color: '#dc3545' }} />
            {error}
          </div>
          
          <div className="fallback-options">
            <button 
              className="retry-button"
              onClick={resetScanner}
              type="button"
            >
              Try Again
            </button>
            <button 
              className="manual-entry-button"
              onClick={handleManualEntry}
              type="button"
            >
              Switch to Manual Entry
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="success-message">
          ✅ {success}
        </div>
      )}

      {/* Processing Overlay */}
      {isProcessing && (
        <div className="processing-overlay">
          <div className="processing-content">
            <div className="processing-spinner"></div>
            <h3>Processing Your Receipt...</h3>
            
            <div className="processing-progress">
              <div 
                className="progress-bar" 
                style={{ width: `${processingProgress}%` }}
              ></div>
            </div>
            
            <p>{processingProgress}% Complete</p>
            
            <button 
              onClick={cancelProcessing}
              className="cancel-processing-btn"
              type="button"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Extracted Items Preview */}
      {(rawOcrText || extractedItems.length > 0) && !isProcessing && (
        <div className="extraction-results-wrapper">
          {/* Raw OCR Text Panel */}
          {rawOcrText && (
            <div className="raw-ocr-text-panel">
              <div className="raw-ocr-header">
                <h3 style={{ margin: 0 }}>🧾 Raw OCR Text</h3>
                <div className="raw-ocr-actions">
                  <button
                    type="button"
                    className="toggle-raw-text-btn"
                    onClick={() => setShowRawText(prev => !prev)}
                  >
                    {showRawText ? 'Hide' : 'Show'}
                  </button>
                  <button
                    type="button"
                    className="copy-raw-text-btn"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(rawOcrText);
                        setSuccess('Raw OCR text copied to clipboard');
                        setTimeout(() => setSuccess(null), 1500);
                      } catch (e) {
                        console.warn('Clipboard copy failed', e);
                      }
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>
              {showRawText && (
                <pre className="raw-ocr-text" style={{ whiteSpace: 'pre-wrap', maxHeight: '200px', overflowY: 'auto', marginTop: '8px', background: '#1f1f1f', color: '#eee', padding: '8px', borderRadius: '6px', fontSize: '0.8rem' }}>
{rawOcrText}
                </pre>
              )}
            </div>
          )}
          {/* Extracted Items Panel */}
          {extractedItems.length > 0 && (
            <div className="extracted-items-preview">
              <h3>📋 Extracted Items ({extractedItems.length})</h3>
              {extractedItems.map((item, index) => (
                <div key={`${item.item_name}-${index}`} className="extracted-item">
                  <div className="item-info">
                    <div className="item-name">{item.item_name || 'Unknown Item'}</div>
                    <div className="item-details">
                      {item.quantity || '1'} {item.unit || 'pc'} • {item.category || 'Miscellaneous'}
                    </div>
                  </div>
                  <div className="item-price">
                    ₹{item.unit_price || '0.00'}
                  </div>
                </div>
              ))}
              <button 
                onClick={handleContinueWithItems}
                className="continue-button"
                type="button"
              >
                ✅ Continue with These Items
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BillScanner;
