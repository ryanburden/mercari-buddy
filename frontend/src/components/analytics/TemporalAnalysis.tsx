import React from 'react';
import { DashboardData } from '../../services/api';

interface TemporalAnalysisProps {
  data: DashboardData;
}

const TemporalAnalysis: React.FC<TemporalAnalysisProps> = ({ data }) => {
  return (
    <div className="space-y-8">
      <div className="card">
        <h3 className="text-xl font-semibold text-white mb-6">Temporal Sales Patterns</h3>
        <div className="text-white/70">
          <p>Temporal analysis will include:</p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Day-of-week sales patterns (radar chart)</li>
            <li>Seasonal trend analysis</li>
            <li>Monthly revenue trends</li>
            <li>Holiday impact analysis</li>
          </ul>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Day of Week Patterns</h4>
              {Object.entries(data.analytics.temporalPatterns.dayOfWeek).map(([day, revenue]) => (
                <div key={day} className="flex justify-between text-sm">
                  <span>{day}</span>
                  <span>${revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <h4 className="font-semibold text-white mb-2">Seasonal Patterns</h4>
              {Object.entries(data.analytics.temporalPatterns.seasonal).map(([season, revenue]) => (
                <div key={season} className="flex justify-between text-sm">
                  <span>{season}</span>
                  <span>${revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemporalAnalysis; 