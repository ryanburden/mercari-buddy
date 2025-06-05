export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  fileInfo?: {
    name: string;
    size: string;
    rowCount?: number;
  };
}

export const validateCSVFile = (file: File): FileValidationResult => {
  // Check file type
  if (!file.name.toLowerCase().endsWith('.csv') && file.type !== 'text/csv') {
    return {
      isValid: false,
      error: 'Please upload a CSV file (.csv extension required)'
    };
  }

  // Check file size (max 50MB)
  const maxSize = 50 * 1024 * 1024; // 50MB in bytes
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File size must be less than 50MB'
    };
  }

  // Check minimum file size (at least 1KB)
  if (file.size < 1024) {
    return {
      isValid: false,
      error: 'File appears to be too small. Please ensure it contains data.'
    };
  }

  return {
    isValid: true,
    fileInfo: {
      name: file.name,
      size: formatFileSize(file.size)
    }
  };
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const previewCSVFile = async (file: File): Promise<{
  headers: string[];
  rowCount: number;
  preview: string[][];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        if (lines.length === 0) {
          reject(new Error('File appears to be empty'));
          return;
        }

        // Parse headers
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        
        // Parse preview rows (first 5 data rows)
        const preview = lines.slice(1, 6).map(line => 
          line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        );

        resolve({
          headers,
          rowCount: lines.length - 1, // Subtract header row
          preview
        });
      } catch (error) {
        reject(new Error('Failed to parse CSV file'));
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}; 