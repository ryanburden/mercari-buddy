import React from 'react';
import { motion } from 'framer-motion';
import { 
  Lightbulb, 
  TrendingUp, 
  Target, 
  AlertTriangle, 
  Star,
  ArrowRight 
} from 'lucide-react';
import { DashboardData } from '../../services/api';

interface RecommendationsPanelProps {
  data: DashboardData;
}

const RecommendationsPanel: React.FC<RecommendationsPanelProps> = ({ data }) => {
  // Generate smart recommendations based on data
  const generateRecommendations = () => {
    const recommendations = [];
    const { analytics } = data;
    
    // Top category analysis
    const topCategory = Object.entries(analytics.categoryDistribution)
      .sort(([,a], [,b]) => b - a)[0];
    
    if (topCategory) {
      const [categoryName, revenue] = topCategory;
      const percentage = (revenue / analytics.totalRevenue * 100).toFixed(1);
      
      recommendations.push({
        type: 'opportunity',
        icon: TrendingUp,
        title: 'Focus on Top Performer',
        description: `${categoryName} generates ${percentage}% of your revenue. Consider expanding this category with more inventory or premium products.`,
        impact: 'High',
        color: 'text-green-400'
      });
    }

    // Seasonal analysis
    const seasonalData = analytics.temporalPatterns.seasonal;
    if (seasonalData) {
      const topSeason = Object.entries(seasonalData)
        .filter(([season]) => season !== 'Unknown')
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topSeason) {
        const [season, revenue] = topSeason;
        recommendations.push({
          type: 'insight',
          icon: Star,
          title: `${season} Season Optimization`,
          description: `${season} is your strongest season. Plan inventory and marketing campaigns around this peak period.`,
          impact: 'Medium',
          color: 'text-blue-400'
        });
      }
    }

    // Profit margin optimization
    if (analytics.avgMargin < 25) {
      recommendations.push({
        type: 'warning',
        icon: AlertTriangle,
        title: 'Improve Profit Margins',
        description: `Average margin of ${analytics.avgMargin.toFixed(1)}% is below optimal. Consider raising prices or reducing costs.`,
        impact: 'High',
        color: 'text-yellow-400'
      });
    } else if (analytics.avgMargin > 40) {
      recommendations.push({
        type: 'success',
        icon: Target,
        title: 'Excellent Profit Margins',
        description: `Your ${analytics.avgMargin.toFixed(1)}% average margin is excellent. Consider expanding volume while maintaining quality.`,
        impact: 'Medium',
        color: 'text-green-400'
      });
    }

    // Geographic expansion
    const topStates = Object.entries(analytics.geographicData.stateRevenue)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);
    
    if (topStates.length > 0) {
      const [topState] = topStates[0];
      recommendations.push({
        type: 'opportunity',
        icon: Target,
        title: 'Geographic Expansion',
        description: `${topState} is your top market. Consider targeted marketing or regional inventory optimization for similar markets.`,
        impact: 'Medium',
        color: 'text-purple-400'
      });
    }

    // Day of week optimization
    const dayData = analytics.temporalPatterns.dayOfWeek;
    if (dayData) {
      const topDay = Object.entries(dayData)
        .filter(([day]) => day !== 'Unknown')
        .sort(([,a], [,b]) => b - a)[0];
      
      if (topDay) {
        const [day] = topDay;
        recommendations.push({
          type: 'insight',
          icon: Lightbulb,
          title: 'Optimal Listing Timing',
          description: `${day} shows highest sales. Schedule new listings and promotions on this day for maximum impact.`,
          impact: 'Low',
          color: 'text-cyan-400'
        });
      }
    }

    return recommendations;
  };

  const recommendations = generateRecommendations();

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'opportunity': return '🚀';
      case 'warning': return '⚠️';
      case 'success': return '✅';
      case 'insight': return '💡';
      default: return '📊';
    }
  };

  return (
    <div className="card">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg">
          <Lightbulb className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-white">AI-Powered Recommendations</h3>
          <p className="text-white/70 text-sm">Data-driven insights to grow your business</p>
        </div>
      </div>

      <div className="space-y-4">
        {recommendations.map((rec, index) => {
          const IconComponent = rec.icon;
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white/5 border border-white/10 rounded-lg p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className={`p-2 rounded-lg ${rec.color.replace('text-', 'bg-').replace('400', '500/20')}`}>
                    <IconComponent className={`h-5 w-5 ${rec.color}`} />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">{getTypeIcon(rec.type)}</span>
                      <h4 className="font-semibold text-white">{rec.title}</h4>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getImpactColor(rec.impact)}`}>
                      {rec.impact} Impact
                    </span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {rec.description}
                  </p>
                </div>
                
                <div className="flex-shrink-0">
                  <ArrowRight className="h-4 w-4 text-white/40" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action Items */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <h4 className="font-semibold text-white mb-4">Quick Action Items</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-lg p-4">
            <h5 className="font-medium text-white mb-2">📈 Optimize Top Categories</h5>
            <p className="text-white/70 text-sm">
              Focus marketing spend on your highest-performing product categories
            </p>
          </div>
          <div className="bg-gradient-to-r from-green-500/10 to-teal-500/10 border border-green-500/20 rounded-lg p-4">
            <h5 className="font-medium text-white mb-2">🎯 Seasonal Planning</h5>
            <p className="text-white/70 text-sm">
              Prepare inventory and campaigns for your peak seasons
            </p>
          </div>
        </div>
      </div>

      {/* Performance Score */}
      <div className="mt-6 pt-6 border-t border-white/10">
        <div className="text-center">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-full px-4 py-2">
            <Star className="h-5 w-5 text-green-400" />
                         <span className="text-green-400 font-semibold">
               Business Health Score: {Math.min(95, Math.round(data.analytics.avgMargin * 2 + 15))}/100
             </span>
          </div>
          <p className="text-white/60 text-sm mt-2">
            Based on profit margins, category diversity, and growth trends
          </p>
        </div>
      </div>
    </div>
  );
};

export default RecommendationsPanel; 