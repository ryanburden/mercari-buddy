import React from 'react';
import { DashboardData } from '../../services/api';

interface CategoryAnalysisProps {
  data: DashboardData;
  compact?: boolean;
}

const CategoryAnalysis: React.FC<CategoryAnalysisProps> = ({ data, compact = false }) => {
  return (
    <div className="card">
      <h3 className="text-xl font-semibold text-white mb-6">Category Performance Analysis</h3>
      <div className="text-white/70">
        <p>Category analysis component will show:</p>
        <ul className="list-disc list-inside mt-2 space-y-1">
          <li>Category volume vs margin scatter plots</li>
          <li>Subcategory breakdown analysis</li>
          <li>Price distribution by category</li>
          <li>Performance matrix visualization</li>
        </ul>
        <div className="mt-4 p-4 bg-white/5 rounded-lg">
          <p className="text-sm">Total Categories: {Object.keys(data.analytics.categoryDistribution).length}</p>
          <p className="text-sm">Top Category: {Object.entries(data.analytics.categoryDistribution)
            .sort(([,a], [,b]) => b - a)[0]?.[0] || 'N/A'}</p>
        </div>
      </div>
    </div>
  );
};

export default CategoryAnalysis; 