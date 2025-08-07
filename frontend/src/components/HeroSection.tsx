import React from 'react';
import { ArrowRight, Sparkles, TrendingUp, Zap } from 'lucide-react';

interface HeroSectionProps {
  onGetStarted: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onGetStarted }) => {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl animate-pulse-slow"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary-500/20 rounded-full blur-3xl animate-pulse-slow delay-1000"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-8 animate-fade-in">
            <Sparkles className="h-4 w-4 text-yellow-400" />
            <span className="text-sm font-medium text-white">
              AI-Powered Ecommerce Intelligence
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold text-white mb-6 animate-slide-up">
            Transform Your
            <span className="block gradient-text">
              Sales Data
            </span>
            Into Intelligence
          </h1>

          {/* Subtitle */}
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-8 leading-relaxed animate-fade-in delay-300">
            Upload your CSV sales data and get instant AI-powered product categorization, 
            temporal analysis, and actionable insights in seconds.
          </p>



          {/* CTA Buttons */}
          <div className="flex justify-center animate-fade-in delay-700">
            <button
              onClick={onGetStarted}
              className="btn-primary group"
            >
              <span>Upload Your CSV</span>
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </button>
          </div>


        </div>
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce-gentle">
        <div className="w-3 h-3 bg-primary-400 rounded-full opacity-60"></div>
      </div>
      <div className="absolute top-40 right-20 animate-bounce-gentle delay-500">
        <div className="w-2 h-2 bg-secondary-400 rounded-full opacity-60"></div>
      </div>
      <div className="absolute bottom-20 left-20 animate-bounce-gentle delay-1000">
        <div className="w-4 h-4 bg-yellow-400 rounded-full opacity-40"></div>
      </div>
    </section>
  );
};

export default HeroSection; 