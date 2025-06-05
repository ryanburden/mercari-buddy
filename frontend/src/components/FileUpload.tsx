import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, CheckCircle, AlertCircle, X, Eye, Loader2, Brain, Zap } from 'lucide-react';
import { validateCSVFile, previewCSVFile, FileValidationResult } from '../utils/fileValidation';
import apiService from '../services/api';

interface FileUploadProps {
  onUploadComplete: (analysisId: string) => void;
}

interface FilePreview {
  headers: string[];
  rowCount: number;
  preview: string[][];
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadComplete }) => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<FileValidationResult | null>(null);
  const [filePreview, setFilePreview] = useState<FilePreview | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);

    // Validate file
    const validation = validateCSVFile(file);
    setValidationResult(validation);

    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      setIsProcessing(false);
      return;
    }

    try {
      // Preview file content
      const preview = await previewCSVFile(file);
      setFilePreview(preview);
      setUploadedFile(file);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process file');
    } finally {
      setIsProcessing(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
    },
    maxFiles: 1,
    multiple: false,
  });

  const resetUpload = () => {
    setUploadedFile(null);
    setValidationResult(null);
    setFilePreview(null);
    setError(null);
    setShowPreview(false);
  };

  const handleAnalyze = async () => {
    if (!uploadedFile || !filePreview) return;
    
    setIsProcessing(true);
    setError(null);
    
    try {
      // Upload file and start analysis with tier-5 AI processing
      const result = await apiService.uploadAndAnalyze({
        file: uploadedFile,
        apiTier: 'tier5' // Ultra-fast maximum speed mode!
      });
      
      // Redirect to analytics dashboard
      onUploadComplete(result.analysisId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <section id="upload" className="py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Upload Your Sales Data
          </h2>
          <p className="text-xl text-white/80 max-w-2xl mx-auto">
            Drop your CSV file below and watch our AI transform it into actionable insights
          </p>
        </div>

        <div className="card max-w-2xl mx-auto">
          {!uploadedFile ? (
            // Upload Area
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300
                ${isDragActive 
                  ? 'border-primary-400 bg-primary-500/10' 
                  : 'border-white/30 hover:border-white/50 hover:bg-white/5'
                }
              `}
            >
              <input {...getInputProps()} />
              
              <div className="flex flex-col items-center space-y-4">
                <div className={`
                  p-4 rounded-full transition-colors duration-300
                  ${isDragActive ? 'bg-primary-500/20' : 'bg-white/10'}
                `}>
                  <Upload className={`h-12 w-12 ${isDragActive ? 'text-primary-400' : 'text-white/70'}`} />
                </div>
                
                <div>
                  <p className="text-xl font-semibold text-white mb-2">
                    {isDragActive ? 'Drop your CSV file here' : 'Drag & drop your CSV file'}
                  </p>
                  <p className="text-white/60">
                    or <span className="text-primary-400 font-medium">click to browse</span>
                  </p>
                </div>
                
                <div className="text-sm text-white/50 space-y-1">
                  <p>Supports: CSV files up to 50MB</p>
                  <p>Expected columns: Item Title, Sold Date, etc.</p>
                </div>
              </div>
            </div>
          ) : (
            // File Info & Preview
            <div className="space-y-6">
              {/* File Info Header */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <FileText className="h-5 w-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">{uploadedFile.name}</p>
                    <p className="text-sm text-white/60">
                      {validationResult?.fileInfo?.size} • {filePreview?.rowCount} rows
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={resetUpload}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="h-5 w-5 text-white/60" />
                </button>
              </div>

              {/* Success Message */}
              <div className="flex items-center space-x-3 p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <CheckCircle className="h-5 w-5 text-green-400" />
                <span className="text-green-400 font-medium">File uploaded successfully!</span>
              </div>

              {/* Preview Toggle */}
              <button
                onClick={() => setShowPreview(!showPreview)}
                className="flex items-center space-x-2 text-primary-400 hover:text-primary-300 transition-colors"
              >
                <Eye className="h-4 w-4" />
                <span>{showPreview ? 'Hide' : 'Show'} Preview</span>
              </button>

              {/* File Preview */}
              {showPreview && filePreview && (
                <div className="bg-white/5 rounded-xl p-4 overflow-x-auto">
                  <h4 className="text-white font-semibold mb-3">Data Preview</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/20">
                          {filePreview.headers.map((header, index) => (
                            <th key={index} className="text-left py-2 px-3 text-white/80 font-medium">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filePreview.preview.map((row, rowIndex) => (
                          <tr key={rowIndex} className="border-b border-white/10">
                            {row.map((cell, cellIndex) => (
                              <td key={cellIndex} className="py-2 px-3 text-white/70">
                                {cell.length > 30 ? `${cell.substring(0, 30)}...` : cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* AI Analysis Section */}
              <div className="space-y-4">
                <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Brain className="h-6 w-6 text-purple-400" />
                    <h4 className="font-semibold text-white">AI-Powered Analysis Ready</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-white/70">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-400" />
                      <span>Tier-5 Processing (5000+ products/min)</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Brain className="h-4 w-4 text-purple-400" />
                      <span>OpenAI Structured Categorization</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-400" />
                      <span>99.9% Accuracy Rate</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-blue-400" />
                      <span>Real-time Progress Tracking</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleAnalyze}
                  disabled={isProcessing}
                  className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                      Starting AI Analysis...
                    </>
                  ) : (
                    <>
                      <Brain className="mr-3 h-6 w-6" />
                      Start AI Analysis
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 flex items-center space-x-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-400">{error}</span>
            </div>
          )}
        </div>

        {/* Processing Indicator */}
        {isProcessing && !uploadedFile && (
          <div className="mt-8 text-center">
            <div className="inline-flex items-center space-x-3 px-6 py-3 bg-white/10 rounded-full">
              <Loader2 className="h-5 w-5 animate-spin text-primary-400" />
              <span className="text-white">Processing your file...</span>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default FileUpload; 