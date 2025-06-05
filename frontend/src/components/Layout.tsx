import React from 'react';
import { Brain, BarChart3, Zap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full z-50 glass-effect">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-display font-bold text-white">
                EcomIntel
              </span>
            </div>
            
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-white/80 hover:text-white transition-colors">
                Features
              </a>
              <a href="#how-it-works" className="text-white/80 hover:text-white transition-colors">
                How It Works
              </a>
              <a href="#upload" className="btn-secondary">
                Get Started
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-xl">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <span className="text-xl font-display font-bold text-white">
                  EcomIntel
                </span>
              </div>
              <p className="text-white/70 max-w-md">
                AI-powered ecommerce intelligence platform that transforms your sales data 
                into actionable insights with lightning-fast processing.
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Features</h3>
              <ul className="space-y-2 text-white/70">
                <li className="flex items-center space-x-2">
                  <Brain className="h-4 w-4" />
                  <span>AI Categorization</span>
                </li>
                <li className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4" />
                  <span>Temporal Analysis</span>
                </li>
                <li className="flex items-center space-x-2">
                  <Zap className="h-4 w-4" />
                  <span>Ultra-Fast Processing</span>
                </li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Performance</h3>
              <ul className="space-y-2 text-white/70">
                <li>5000+ products/minute</li>
                <li>99.9% accuracy</li>
                <li>Real-time insights</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-white/10 mt-8 pt-8 text-center text-white/60">
            <p>&copy; 2024 EcomIntel. Powered by AI for smarter ecommerce decisions.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout; 