import React, { useState } from 'react';
import Layout from './components/Layout';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorks from './components/HowItWorks';
import FileUpload from './components/FileUpload';
import AnalyticsDashboard from './components/AnalyticsDashboard';

type AppView = 'landing' | 'upload' | 'analytics';

function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [analysisId, setAnalysisId] = useState<string | null>(null);

  const handleUploadComplete = (id: string) => {
    setAnalysisId(id);
    setCurrentView('analytics');
  };

  const handleBackToUpload = () => {
    setCurrentView('upload');
    setAnalysisId(null);
  };

  const handleGetStarted = () => {
    setCurrentView('upload');
  };

  if (currentView === 'analytics' && analysisId) {
    return (
      <AnalyticsDashboard 
        analysisId={analysisId}
        onBackToUpload={handleBackToUpload}
      />
    );
  }

  if (currentView === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Layout>
          <div className="py-20">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <button
                  onClick={() => setCurrentView('landing')}
                  className="mb-6 text-primary-400 hover:text-primary-300 transition-colors"
                >
                  ← Back to Home
                </button>
                <h1 className="text-4xl font-display font-bold text-white mb-4">
                  Upload Your Sales Data
                </h1>
                <p className="text-xl text-white/70 max-w-2xl mx-auto">
                  Upload your CSV file to get AI-powered insights with our 
                  <span className="text-primary-400 font-semibold"> Tier-5 processing engine</span> 
                  - analyzing up to 5000+ products per minute!
                </p>
              </div>

              <FileUpload onUploadComplete={handleUploadComplete} />

              <div className="mt-16 text-center">
                <div className="card max-w-2xl mx-auto">
                  <h3 className="text-lg font-semibold text-white mb-4">
                    🚀 What happens after upload?
                  </h3>
                  <div className="space-y-3 text-left text-white/70">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-400 rounded-full" />
                      <span>AI categorizes products with OpenAI structured outputs</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-400 rounded-full" />
                      <span>Extracts temporal patterns (day-of-week, seasons)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-purple-400 rounded-full" />
                      <span>Analyzes geographic sales distribution</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full" />
                      <span>Generates actionable business recommendations</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Layout>
      </div>
    );
  }

  return (
    <Layout>
      <HeroSection onGetStarted={handleGetStarted} />
      <FeaturesSection />
      <HowItWorks />
    </Layout>
  );
}

export default App; 