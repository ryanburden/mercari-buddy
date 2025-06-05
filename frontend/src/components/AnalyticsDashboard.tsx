import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  MapPin, 
  Calendar, 
  Target, 
  Download,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import apiService, { DashboardData, AnalysisStatus } from '../services/api';
import RevenueCharts from './analytics/RevenueCharts';
import GeographicMap from './analytics/GeographicMap';
import CategoryAnalysis from './analytics/CategoryAnalysis';
import TemporalAnalysis from './analytics/TemporalAnalysis';
import RecommendationsPanel from './analytics/RecommendationsPanel';
import ProcessingStatus from './analytics/ProcessingStatus';

interface AnalyticsDashboardProps {
  analysisId: string;
  onBackToUpload: () => void;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ 
  analysisId, 
  onBackToUpload 
}) => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Poll for analysis status
  useEffect(() => {
    let interval: NodeJS.Timeout;

    const checkStatus = async () => {
      try {
        const status = await apiService.getAnalysisStatus(analysisId);
        setAnalysisStatus(status);

        if (status.status === 'completed') {
          // Load dashboard data when analysis is complete
          const data = await apiService.getDashboardData(analysisId);
          setDashboardData(data);
          setIsLoading(false);
          clearInterval(interval);
        } else if (status.status === 'failed') {
          setError('Analysis failed. Please try again.');
          setIsLoading(false);
          clearInterval(interval);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to get analysis status');
        setIsLoading(false);
        clearInterval(interval);
      }
    };

    // Initial check
    checkStatus();

    // Poll every 2 seconds while processing
    interval = setInterval(checkStatus, 2000);

    return () => clearInterval(interval);
  }, [analysisId]);

  const handleExport = async (format: 'csv' | 'xlsx' | 'json') => {
    try {
      const blob = await apiService.exportData(analysisId, format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecommerce-analysis-${analysisId}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'revenue', label: 'Revenue', icon: TrendingUp },
    { id: 'geography', label: 'Geography', icon: MapPin },
    { id: 'categories', label: 'Categories', icon: Target },
    { id: 'temporal', label: 'Temporal', icon: Calendar },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <ProcessingStatus 
          status={analysisStatus}
          onBackToUpload={onBackToUpload}
        />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="card max-w-lg text-center">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Analysis Failed</h2>
          <p className="text-white/70 mb-6">{error}</p>
          <button 
            onClick={onBackToUpload}
            className="btn-primary"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="card max-w-lg text-center">
          <Loader2 className="h-16 w-16 text-primary-400 mx-auto mb-4 animate-spin" />
          <h2 className="text-xl font-bold text-white mb-2">Loading Dashboard</h2>
          <p className="text-white/70">Preparing your analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={onBackToUpload}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <RefreshCw className="h-5 w-5 text-white/60" />
              </button>
              <div>
                <h1 className="text-2xl font-display font-bold text-white">
                  Ecommerce Analytics Dashboard
                </h1>
                <p className="text-white/70">
                  Analysis of {dashboardData.analytics.totalItems.toLocaleString()} products
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mt-4 lg:mt-0">
              <div className="flex items-center space-x-2 text-green-400">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm">Analysis Complete</span>
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={() => handleExport('csv')}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="btn-secondary text-sm py-2 px-4"
                >
                  <Download className="h-4 w-4 mr-2" />
                  JSON
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="glass-effect border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    flex items-center space-x-2 py-4 px-2 border-b-2 transition-colors
                    ${activeTab === tab.id
                      ? 'border-primary-400 text-primary-400'
                      : 'border-transparent text-white/60 hover:text-white/80'
                    }
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="card text-center">
                    <div className="text-3xl font-bold gradient-text mb-2">
                      ${dashboardData.analytics.totalRevenue.toLocaleString()}
                    </div>
                    <p className="text-white/70">Total Revenue</p>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold gradient-text mb-2">
                      ${dashboardData.analytics.totalProfit.toLocaleString()}
                    </div>
                    <p className="text-white/70">Total Profit</p>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold gradient-text mb-2">
                      {dashboardData.analytics.totalItems.toLocaleString()}
                    </div>
                    <p className="text-white/70">Items Sold</p>
                  </div>
                  <div className="card text-center">
                    <div className="text-3xl font-bold gradient-text mb-2">
                      {dashboardData.analytics.avgMargin.toFixed(1)}%
                    </div>
                    <p className="text-white/70">Avg Margin</p>
                  </div>
                </div>

                {/* Quick Overview Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <RevenueCharts data={dashboardData} compact />
                  <CategoryAnalysis data={dashboardData} compact />
                </div>

                {/* Recommendations */}
                <RecommendationsPanel data={dashboardData} />
              </div>
            )}

            {activeTab === 'revenue' && <RevenueCharts data={dashboardData} />}
            {activeTab === 'geography' && <GeographicMap data={dashboardData} />}
            {activeTab === 'categories' && <CategoryAnalysis data={dashboardData} />}
            {activeTab === 'temporal' && <TemporalAnalysis data={dashboardData} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AnalyticsDashboard; 