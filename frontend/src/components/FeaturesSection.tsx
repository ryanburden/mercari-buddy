import React from 'react';
import { Brain, Clock, BarChart3, Zap, Target, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: Brain,
    title: 'AI-Powered Categorization',
    description: 'Advanced OpenAI integration automatically categorizes your products with 99.9% accuracy using structured outputs.',
    color: 'from-blue-500 to-purple-500',
    stats: '99.9% accuracy'
  },
  {
    icon: Zap,
    title: 'Ultra-Fast Processing',
    description: 'Process thousands of products in seconds with our optimized tier-5 processing pipeline.',
    color: 'from-yellow-500 to-orange-500',
    stats: '5000+ products/min'
  },
  {
    icon: Clock,
    title: 'Temporal Analysis',
    description: 'Discover seasonal trends and day-of-week patterns to optimize your sales strategy.',
    color: 'from-green-500 to-teal-500',
    stats: 'Real-time insights'
  },
  {
    icon: BarChart3,
    title: 'Smart Analytics',
    description: 'Get actionable insights with comprehensive data visualization and trend analysis.',
    color: 'from-purple-500 to-pink-500',
    stats: 'Advanced metrics'
  },
  {
    icon: Target,
    title: 'Precision Targeting',
    description: 'Identify your best-performing product categories and optimize inventory decisions.',
    color: 'from-red-500 to-rose-500',
    stats: 'Data-driven decisions'
  },
  {
    icon: TrendingUp,
    title: 'Growth Optimization',
    description: 'Leverage AI insights to identify growth opportunities and market trends.',
    color: 'from-indigo-500 to-blue-500',
    stats: 'Maximize ROI'
  }
];

const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">
            Powerful Features for
            <span className="block gradient-text">Smart Ecommerce</span>
          </h2>
          <p className="text-xl text-white/80 max-w-3xl mx-auto">
            Transform your raw sales data into actionable intelligence with our comprehensive suite of AI-powered tools
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card group hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="flex flex-col items-center text-center space-y-4">
                  {/* Icon */}
                  <div className={`
                    p-4 rounded-2xl bg-gradient-to-r ${feature.color} 
                    group-hover:scale-110 transition-transform duration-300
                  `}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-display font-semibold text-white">
                      {feature.title}
                    </h3>
                    <p className="text-white/70 leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Stats Badge */}
                  <div className="inline-flex items-center px-3 py-1 bg-white/10 rounded-full">
                    <span className="text-sm font-medium text-white/90">
                      {feature.stats}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Performance Metrics */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
              5000+
            </div>
            <p className="text-white/70">Products per minute</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
              99.9%
            </div>
            <p className="text-white/70">Categorization accuracy</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
              &lt;10s
            </div>
            <p className="text-white/70">Processing time</p>
          </div>
          <div className="text-center">
            <div className="text-3xl md:text-4xl font-bold gradient-text mb-2">
              24/7
            </div>
            <p className="text-white/70">Available processing</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 