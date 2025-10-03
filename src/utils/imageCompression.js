/**
 * Image Compression Utility
 * 
 * This utility provides functions to compress and resize images before uploading
 * to prevent timeout issues with the OCR API.
 */

/**
 * Compresses an image file to a specified maximum size
 * @param {File} file - The image file to compress
 * @param {Object} options - Compression options
 * @param {number} options.maxSizeMB - Maximum size in MB (default: 1MB)
 * @param {number} options.maxWidthOrHeight - Maximum width or height in pixels (default: 1920)
 * @param {number} options.quality - JPEG quality 0-1 (default: 0.8)
 * @returns {Promise<File>} - A promise that resolves with the compressed file
 */
export const compressImage = async (file, options = {}) => {
  const { 
    maxSizeMB = 1, 
    maxWidthOrHeight = 1920,
    quality = 0.8 
  } = options;
  
  // If file is already smaller than max size, return it as is
  if (file.size / 1024 / 1024 < maxSizeMB) {
    console.log('📏 Image already smaller than max size, skipping compression');
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      
      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > maxWidthOrHeight) {
            height = Math.round(height * maxWidthOrHeight / width);
            width = maxWidthOrHeight;
          }
        } else {
          if (height > maxWidthOrHeight) {
            width = Math.round(width * maxWidthOrHeight / height);
            height = maxWidthOrHeight;
          }
        }
        
        // Create canvas and resize image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        
        // Convert to blob with specified quality
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas to Blob conversion failed'));
            return;
          }
          
          // Create new file from blob
          const compressedFile = new File(
            [blob], 
            file.name, 
            { 
              type: 'image/jpeg', 
              lastModified: Date.now() 
            }
          );
          
          console.log('📏 Image compressed:', {
            originalSize: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
            compressedSize: `${(compressedFile.size / 1024 / 1024).toFixed(2)} MB`,
            originalDimensions: `${img.width}x${img.height}`,
            newDimensions: `${width}x${height}`
          });
          
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for compression'));
      };
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file for compression'));
    };
  });
};

/**
 * Automatically compresses an image based on its size
 * - Small images (<1MB): No compression
 * - Medium images (1-5MB): Medium compression
 * - Large images (>5MB): High compression
 * 
 * @param {File} file - The image file to compress
 * @returns {Promise<File>} - A promise that resolves with the compressed file
 */
export const autoCompressImage = async (file) => {
  const fileSizeMB = file.size / 1024 / 1024;
  
  // Skip compression for small files
  if (fileSizeMB < 1) {
    return file;
  }
  
  // Medium compression for medium-sized files
  if (fileSizeMB < 5) {
    return compressImage(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      quality: 0.8
    });
  }
  
  // High compression for large files
  return compressImage(file, {
    maxSizeMB: 1,
    maxWidthOrHeight: 1280,
    quality: 0.7
  });
};