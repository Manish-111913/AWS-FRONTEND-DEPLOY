import { autoCompressImage } from '../utils/imageCompression';
import { http } from './apiClient';

class OCRService {
  static async processImage(imageFile, options = {}) {
    // Compress image before uploading if not disabled
    let fileToUpload = imageFile;
    if (options.skipCompression !== true) {
      try {
        console.log('📏 Compressing image before upload...');
        fileToUpload = await autoCompressImage(imageFile);

        console.log('📏 Image compression results:', {
          originalSize: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
          compressedSize: `${(fileToUpload.size / 1024 / 1024).toFixed(2)} MB`,
          compressionRatio: `${(imageFile.size / fileToUpload.size).toFixed(2)}x`
        });
      } catch (error) {
        console.warn('⚠️ Image compression failed, using original image:', error);
        // Continue with original file if compression fails
      }
    }

    const formData = new FormData();
    formData.append('image', fileToUpload);
    formData.append('language', options.language || 'eng');
    formData.append('mode', (options.mode || 'auto'));
  // Removed legacy OCR.space params (engine, detectOrientation, isTable)

  console.log('📤 Sending OCR request to OCR endpoint');
    console.log('📁 File details:', {
      name: imageFile.name,
      size: imageFile.size,
      type: imageFile.type
    });

    try {
  const result = await http.postForm('/ocr/upload', formData, { timeoutMs: 60000 });
      console.log('✅ OCR Success:', result);
      return result;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timed out. Please try again with a smaller image.');
      }

      if (error.message && error.message.includes('fetch')) {
        throw new Error('Cannot connect to server. Please check your network connection and ensure the backend is running.');
      }

      console.error('❌ OCR Service Error:', error);
      throw error;
    }
  }

  static async processImageFromURL(imageUrl, options = {}) {
    try {
      const result = await http.post('/ocr/process-url', {
        imageUrl,
        language: options.language || 'eng'
      });
      return result;
    } catch (error) {
      console.error('OCR Service Error:', error);
      throw error;
    }
  }

  static async processBase64Image(base64Data, options = {}) {
    try {
      const result = await http.post('/ocr/process-base64', {
        imageData: base64Data,
        language: options.language || 'eng'
      });
      return result;
    } catch (error) {
      console.error('OCR Service Error:', error);
      throw error;
    }
  }

  static async processAndCreateStock(imageFile, options = {}) {
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('shift', options.shift || 'Morning');
    formData.append('autoSubmit', options.autoSubmit || false);

    try {
  const result = await http.postForm('/ocr/process-and-create-stock', formData);
  return result;
    } catch (error) {
      console.error('OCR Service Error:', error);
      throw error;
    }
  }

  static async validateAPIKey() {
    try {
  const result = await http.get('/ocr/validate-api');
  return result;
    } catch (error) {
      console.error('OCR Service Error:', error);
      throw error;
    }
  }

  // Get uploaded images
  static async getUploadedImages(businessId = 1, scanType = null, limit = 50) {
    try {
  const params = new URLSearchParams({ business_id: businessId, limit });
  if (scanType) params.append('scan_type', scanType);
  const data = await http.get(`/ocr/images?${params.toString()}`);
  if (!data.success) throw new Error(data.error || 'Failed to fetch uploaded images');
  return data;
    } catch (error) {
      console.error('Error fetching uploaded images:', error);
      throw error;
    }
  }

  // Process OCR for specific image
  static async processOCR(imageId) {
    try {
  const data = await http.post(`/ocr/process/${imageId}`);
  if (!data.success) throw new Error(data.error || 'Failed to process OCR');
  return data;
    } catch (error) {
      console.error('Error processing OCR:', error);
      throw error;
    }
  }

  // Upload image file
  static async uploadImage(imageFile, scanType = 'Other', businessId = 1) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);
      formData.append('scan_type', scanType);
      formData.append('business_id', businessId);

  const data = await http.postForm('/ocr/upload', formData);
  if (!data.success) throw new Error(data.error || 'Failed to upload image');
  return data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Process sales report
  static async processSalesReport(imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

  const data = await http.postForm('/sales-report/process-sales-report', formData);
  if (!data.success) throw new Error(data.error || 'Failed to process sales report');
  return data;
    } catch (error) {
      console.error('Error processing sales report:', error);
      throw error;
    }
  }
}

export default OCRService;