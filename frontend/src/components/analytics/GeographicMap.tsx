import React, { useMemo } from 'react';
import { DashboardData } from '../../services/api';

interface GeographicMapProps {
  data: DashboardData;
}

const GeographicMap: React.FC<GeographicMapProps> = ({ data }) => {
  const topStates = Object.entries(data.analytics.geographicData.stateRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  // Calculate color intensity based on revenue
  const maxRevenue = Math.max(...Object.values(data.analytics.geographicData.stateRevenue));
  const minRevenue = Math.min(...Object.values(data.analytics.geographicData.stateRevenue));

  const getColorIntensity = (revenue: number) => {
    if (maxRevenue === minRevenue) return 0.3;
    const intensity = (revenue - minRevenue) / (maxRevenue - minRevenue);
    return Math.max(0.1, Math.min(1, intensity));
  };

  const getStateColor = (stateName: string) => {
    const revenue = data.analytics.geographicData.stateRevenue[stateName];
    if (!revenue) return 'rgba(255, 255, 255, 0.1)';
    
    const intensity = getColorIntensity(revenue);
    // Use a blue to purple gradient
    return `rgba(139, 92, 246, ${intensity})`;
  };

  // State name mapping (geographic data uses full names, our data might use abbreviations)
  const stateNameMap: { [key: string]: string } = {
    'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
    'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
    'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
    'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
    'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
    'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
    'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
    'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
    'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
    'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY'
  };

  const getRevenueForState = (geoStateName: string) => {
    // Try both full name and abbreviation
    return data.analytics.geographicData.stateRevenue[geoStateName] || 
           data.analytics.geographicData.stateRevenue[stateNameMap[geoStateName]] || 0;
  };

  const colorScale = useMemo(() => {
    const revenues = Object.values(data.analytics.geographicData.stateRevenue);
    const max = Math.max(...revenues);
    const min = Math.min(...revenues);
    const step = (max - min) / 5;
    
    return [
      { threshold: min, color: 'rgba(139, 92, 246, 0.1)', label: '$0' },
      { threshold: min + step, color: 'rgba(139, 92, 246, 0.3)', label: `$${(min + step).toLocaleString()}` },
      { threshold: min + step * 2, color: 'rgba(139, 92, 246, 0.5)', label: `$${(min + step * 2).toLocaleString()}` },
      { threshold: min + step * 3, color: 'rgba(139, 92, 246, 0.7)', label: `$${(min + step * 3).toLocaleString()}` },
      { threshold: min + step * 4, color: 'rgba(139, 92, 246, 0.9)', label: `$${(min + step * 4).toLocaleString()}` },
      { threshold: max, color: 'rgba(139, 92, 246, 1)', label: `$${max.toLocaleString()}+` }
    ];
  }, [data.analytics.geographicData.stateRevenue]);

  return (
    <div className="space-y-8">
      <div className="card">
        <h3 className="text-xl font-semibold text-white mb-6">Revenue by State Heatmap</h3>
        
                {/* US States Grid Heatmap */}
        <div className="bg-white/5 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-10 gap-2">
            {Object.entries(data.analytics.geographicData.stateRevenue)
              .sort(([,a], [,b]) => b - a)
              .map(([state, revenue]) => {
                const intensity = getColorIntensity(revenue);
                return (
                  <div
                    key={state}
                    className="group relative aspect-square rounded-lg border border-white/20 flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-105"
                    style={{ 
                      backgroundColor: `rgba(139, 92, 246, ${intensity})`,
                      minHeight: '60px'
                    }}
                  >
                    <div className="text-white text-xs font-bold text-center px-1">
                      {state}
                    </div>
                    
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
                      <div className="font-semibold">{state}</div>
                      <div>${revenue.toLocaleString()}</div>
                      <div className="text-xs text-gray-300">
                        {((revenue / data.analytics.totalRevenue) * 100).toFixed(1)}% of total
                      </div>
                      {/* Arrow */}
                      <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
                    </div>
                  </div>
                );
              })}
          </div>
          
          {/* Color Scale Legend */}
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <span className="text-white/70 text-sm">Revenue Scale:</span>
              <div className="flex items-center space-x-2">
                {colorScale.map((item, index) => (
                  <div key={index} className="flex items-center space-x-1">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-white/60 text-xs">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Top States List */}
        <div>
          <h4 className="font-semibold text-white mb-4">Top States by Revenue</h4>
          <div className="space-y-2">
            {topStates.map(([state, revenue], index) => (
              <div key={state} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {index + 1}
                  </div>
                  <span className="font-medium text-white">{state}</span>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-white">${revenue.toLocaleString()}</div>
                  <div className="text-xs text-white/60">
                    {((revenue / data.analytics.totalRevenue) * 100).toFixed(1)}% of total
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Geographic Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Regional Distribution</h4>
            {Object.entries(data.analytics.geographicData.regionRevenue).map(([region, revenue]) => (
              <div key={region} className="flex justify-between text-sm">
                <span>{region}</span>
                <span>${revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Geographic Insights</h4>
            <div className="space-y-2 text-sm">
              <div>📍 Top Market: {topStates[0]?.[0] || 'N/A'}</div>
              <div>🗺️ States Covered: {Object.keys(data.analytics.geographicData.stateRevenue).length}</div>
              <div>🎯 Market Concentration: {Math.round(topStates.slice(0, 3).reduce((sum, [, revenue]) => sum + revenue, 0) / data.analytics.totalRevenue * 100)}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicMap; 