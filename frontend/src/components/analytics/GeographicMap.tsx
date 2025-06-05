import React from 'react';
import { DashboardData } from '../../services/api';

interface GeographicMapProps {
  data: DashboardData;
}

const GeographicMap: React.FC<GeographicMapProps> = ({ data }) => {
  const topStates = Object.entries(data.analytics.geographicData.stateRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  return (
    <div className="space-y-8">
      <div className="card">
        <h3 className="text-xl font-semibold text-white mb-6">Geographic Sales Analysis</h3>
        <div className="text-white/70">
          <p>Geographic visualization will include:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Interactive US map with state-level heatmap</li>
            <li>Regional performance breakdown</li>
            <li>Shipping cost analysis by location</li>
            <li>Market penetration insights</li>
          </ul>
          
          <div className="mt-6">
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
                <div>🎯 Market Concentration: {topStates.slice(0, 3).reduce((sum, [, revenue]) => sum + revenue, 0) / data.analytics.totalRevenue * 100 | 0}%</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicMap; 