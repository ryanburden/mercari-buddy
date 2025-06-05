import React from 'react';
import { Upload, Brain, BarChart3, Download, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: Upload,
    title: 'Upload CSV',
    description: 'Simply drag and drop your sales data CSV file. We support files up to 50MB with automatic validation.',
    color: 'from-blue-500 to-cyan-500',
    step: '01'
  },
  {
    icon: Brain,
    title: 'AI Processing',
    description: 'Our advanced AI categorizes products, analyzes temporal patterns, and extracts insights at lightning speed.',
    color: 'from-purple-500 to-pink-500',
    step: '02'
  },
  {
    icon: BarChart3,
    title: 'Smart Analysis',
    description: 'Get comprehensive analytics including category distribution, seasonal trends, and performance metrics.',
    color: 'from-green-500 to-teal-500',
    step: '03'
  },
  {
    icon: Download,
    title: 'Export Results',
    description: 'Download enriched data with AI categories, insights, and actionable recommendations for your business.',
    color: 'from-orange-500 to-red-500',
    step: '04'
  }
];

const HowItWorks: React.FC = () => {
  return (
    <section id="how-it-works" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            How It Works
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Transform your ecommerce data in four simple steps with our AI-powered platform
          </p>
        </div>

        {/* Desktop Flow */}
        <div className="hidden lg:block">
          <div className="relative">
            {/* Connection Lines */}
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-y-1/2"></div>
            
            <div className="grid grid-cols-4 gap-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={index} className="relative">
                    {/* Step Card */}
                    <div className="card text-center group hover:scale-105 transition-all duration-300">
                      {/* Step Number */}
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`
                          w-8 h-8 rounded-full bg-gradient-to-r ${step.color} 
                          flex items-center justify-center text-white font-bold text-sm
                        `}>
                          {step.step}
                        </div>
                      </div>

                      <div className="pt-6 space-y-4">
                        {/* Icon */}
                        <div className={`
                          mx-auto w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} 
                          flex items-center justify-center group-hover:scale-110 transition-transform duration-300
                        `}>
                          <Icon className="h-8 w-8 text-white" />
                        </div>

                        {/* Content */}
                        <div>
                          <h3 className="text-xl font-display font-semibold text-white mb-3">
                            {step.title}
                          </h3>
                          <p className="text-white/70 text-sm leading-relaxed">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Arrow (except for last step) */}
                    {index < steps.length - 1 && (
                      <div className="absolute top-1/2 -right-4 transform -translate-y-1/2 z-10">
                        <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
                          <ArrowRight className="h-4 w-4 text-white/60" />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Mobile Flow */}
        <div className="lg:hidden space-y-8">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div key={index} className="relative">
                <div className="card">
                  <div className="flex items-start space-x-4">
                    {/* Step Number & Icon */}
                    <div className="flex-shrink-0">
                      <div className={`
                        w-12 h-12 rounded-xl bg-gradient-to-r ${step.color} 
                        flex items-center justify-center relative
                      `}>
                        <Icon className="h-6 w-6 text-white" />
                        <div className="absolute -top-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-gray-900">{step.step}</span>
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="text-lg font-display font-semibold text-white mb-2">
                        {step.title}
                      </h3>
                      <p className="text-white/70 text-sm leading-relaxed">
                        {step.description}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Connector Line (except for last step) */}
                {index < steps.length - 1 && (
                  <div className="flex justify-center py-4">
                    <div className="w-0.5 h-8 bg-gradient-to-b from-white/20 to-transparent"></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="card max-w-2xl mx-auto">
            <h3 className="text-2xl font-display font-bold text-white mb-4">
              Ready to Get Started?
            </h3>
            <p className="text-white/80 mb-6">
              Upload your first CSV file and experience the power of AI-driven ecommerce intelligence
            </p>
            <button className="btn-primary">
              Start Your Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks; 