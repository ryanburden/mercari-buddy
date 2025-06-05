import React from 'react';
import { motion } from 'framer-motion';
import { Loader2, Zap, Brain, Clock, CheckCircle } from 'lucide-react';
import { AnalysisStatus } from '../../services/api';

interface ProcessingStatusProps {
  status: AnalysisStatus | null;
  onBackToUpload: () => void;
}

const ProcessingStatus: React.FC<ProcessingStatusProps> = ({ status, onBackToUpload }) => {
  if (!status) {
    return (
      <div className="card max-w-2xl">
        <div className="text-center">
          <Loader2 className="h-16 w-16 text-primary-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-2xl font-bold text-white mb-2">Initializing Analysis</h2>
          <p className="text-white/70">Setting up your AI-powered categorization...</p>
        </div>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'queued':
        return <Clock className="h-16 w-16 text-yellow-400" />;
      case 'processing':
        return <Brain className="h-16 w-16 text-primary-400 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-16 w-16 text-green-400" />;
      default:
        return <Loader2 className="h-16 w-16 text-primary-400 animate-spin" />;
    }
  };

  const getStatusMessage = () => {
    switch (status.status) {
      case 'queued':
        return 'Your analysis is queued and will start shortly...';
      case 'processing':
        return 'AI is categorizing your products at maximum speed!';
      case 'completed':
        return 'Analysis completed successfully!';
      default:
        return status.message || 'Processing your data...';
    }
  };

  return (
    <div className="card max-w-2xl">
      <div className="text-center space-y-6">
        {/* Status Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          {getStatusIcon()}
        </motion.div>

        {/* Title */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {status.status === 'completed' ? 'Analysis Complete!' : 'Processing Your Data'}
          </h2>
          <p className="text-white/70">{getStatusMessage()}</p>
        </div>

        {/* Progress Bar */}
        {status.status === 'processing' && (
          <div className="space-y-4">
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-primary-500 to-secondary-500"
                initial={{ width: 0 }}
                animate={{ width: `${status.progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
            <p className="text-sm text-white/60">
              {status.progress}% complete • {status.processedProducts || 0} of {status.totalProducts || 0} products
            </p>
          </div>
        )}

        {/* Performance Metrics */}
        {status.status === 'processing' && status.processingRate && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Zap className="h-5 w-5 text-yellow-400" />
                <span className="text-sm text-white/70">Processing Rate</span>
              </div>
              <div className="text-xl font-bold gradient-text">
                {status.processingRate.toLocaleString()}/min
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Brain className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-white/70">AI Tier</span>
              </div>
              <div className="text-xl font-bold gradient-text">
                Tier 5
              </div>
            </div>
            
            <div className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-center space-x-2 mb-2">
                <Clock className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-white/70">ETA</span>
              </div>
              <div className="text-xl font-bold gradient-text">
                {Math.ceil((100 - status.progress) / 10)}s
              </div>
            </div>
          </div>
        )}

        {/* Processing Features */}
        <div className="bg-white/5 rounded-lg p-4 text-left">
          <h3 className="text-lg font-semibold text-white mb-3">What's happening:</h3>
          <div className="space-y-2 text-sm text-white/70">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full" />
              <span>AI categorizing products with OpenAI structured outputs</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-400 rounded-full" />
              <span>Extracting temporal features (day-of-week, seasons)</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-purple-400 rounded-full" />
              <span>Analyzing geographic patterns</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-400 rounded-full" />
              <span>Generating business insights</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {status.status === 'completed' && (
          <motion.button
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="btn-primary w-full"
            onClick={() => {/* Will be handled by parent component */}}
          >
            View Analytics Dashboard
          </motion.button>
        )}

        {/* Back Button */}
        <button
          onClick={onBackToUpload}
          className="btn-secondary w-full"
        >
          Upload New File
        </button>
      </div>
    </div>
  );
};

export default ProcessingStatus; 