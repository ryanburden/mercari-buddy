import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

import { DashboardData } from '../../services/api';

interface TemporalAnalysisProps {
  data: DashboardData;
}

const TemporalAnalysis: React.FC<TemporalAnalysisProps> = ({ data }) => {
  // Process data for visualizations
  const processedData = useMemo(() => {
    // Day of week data for radar chart
    const dayOfWeekData = Object.entries(data.analytics.temporalPatterns.dayOfWeek).map(([day, revenue]) => ({
      day: day.slice(0, 3), // Shorten day names
      revenue: revenue,
      sales: Math.floor(revenue / 50) // Estimate sales count
    }));

    // Seasonal data for pie chart
    const seasonalData = Object.entries(data.analytics.temporalPatterns.seasonal).map(([season, revenue]) => ({
      name: season,
      value: revenue,
      sales: Math.floor(revenue / 50)
    }));

    // Category distribution by season
    const categoryBySeasonData = data.products.reduce((acc, product) => {
      const season = product.season || 'Unknown';
      const category = product.openai_category || 'Unknown';
      const key = `${season}-${category}`;
      
      if (!acc[key]) {
        acc[key] = { season, category, revenue: 0, count: 0 };
      }
      acc[key].revenue += product['Item Price'] || 0;
      acc[key].count += 1;
      return acc;
    }, {} as Record<string, { season: string; category: string; revenue: number; count: number }>);

    // Convert to array and group by season
    const seasonalCategoryData = Object.values(categoryBySeasonData)
      .reduce((acc, item) => {
        if (!acc[item.season]) {
          acc[item.season] = [];
        }
        acc[item.season].push({
          category: item.category,
          revenue: item.revenue,
          count: item.count
        });
        return acc;
      }, {} as Record<string, Array<{ category: string; revenue: number; count: number }>>);

    // Monthly trends
    const monthlyData = data.analytics.temporalPatterns.monthlyTrends || [];

    return {
      dayOfWeekData,
      seasonalData,
      seasonalCategoryData,
      monthlyData
    };
  }, [data]);

  const colors = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];
  const seasonColors: Record<string, string> = {
    'Spring': '#10b981',
    'Summer': '#f59e0b', 
    'Fall': '#ef4444',
    'Winter': '#06b6d4'
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/20 rounded-lg p-3 shadow-lg">
          <p className="text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {entry.name}: ${entry.value?.toLocaleString()}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-white mb-4">
          Temporal Sales Analysis
        </h2>
        <p className="text-white/70 max-w-3xl mx-auto">
          Analyze your sales patterns across time periods, seasons, and days of the week to identify trends and optimize your selling strategy.
        </p>
      </div>



      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Day of Week Radar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Sales by Day of Week</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={processedData.dayOfWeekData}>
                <PolarGrid stroke="#ffffff20" />
                <PolarAngleAxis dataKey="day" tick={{ fill: '#ffffff80', fontSize: 12 }} />
                <PolarRadiusAxis 
                  tick={{ fill: '#ffffff60', fontSize: 10 }} 
                  axisLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Radar
                  name="Revenue"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip content={<CustomTooltip />} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Seasonal Distribution Pie Chart */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Revenue by Season</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={processedData.seasonalData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {processedData.seasonalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={seasonColors[entry.name] || colors[index % colors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '8px',
                    color: 'white'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Seasonal Category Breakdown */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="card"
      >
        <h3 className="text-xl font-semibold text-white mb-6">Top Categories by Season</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Object.entries(processedData.seasonalCategoryData).map(([season, categories]) => (
            <div key={season} className="bg-white/5 rounded-lg p-4">
              <h4 className="font-semibold text-white mb-3 flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: seasonColors[season] || '#8b5cf6' }}
                />
                {season}
              </h4>
              <div className="space-y-2">
                {categories
                  .sort((a, b) => b.revenue - a.revenue)
                  .slice(0, 5)
                  .map((cat, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="text-white/80 truncate">{cat.category}</span>
                      <span className="text-white/60">${cat.revenue.toLocaleString()}</span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Monthly Trends Line Chart (if data available) */}
      {processedData.monthlyData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="card"
        >
          <h3 className="text-xl font-semibold text-white mb-6">Monthly Revenue Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={processedData.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: '#ffffff80', fontSize: 12 }}
                  axisLine={{ stroke: '#ffffff40' }}
                />
                <YAxis 
                  tick={{ fill: '#ffffff80', fontSize: 12 }}
                  axisLine={{ stroke: '#ffffff40' }}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#8b5cf6"
                  strokeWidth={3}
                  dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#8b5cf6', strokeWidth: 2, fill: '#ffffff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Summary Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Day of Week Summary */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Day of Week Performance</h3>
          <div className="space-y-3">
            {processedData.dayOfWeekData
              .sort((a, b) => b.revenue - a.revenue)
              .map((day, index) => (
                <div key={day.day} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold ${
                      index === 0 ? 'bg-yellow-500 text-black' : 
                      index === 1 ? 'bg-gray-400 text-black' :
                      index === 2 ? 'bg-orange-600 text-white' : 'bg-white/20 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <span className="text-white font-medium">{day.day}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">${day.revenue.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">{day.sales} sales</div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>

        {/* Seasonal Summary */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="card"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Seasonal Performance</h3>
          <div className="space-y-3">
            {processedData.seasonalData
              .sort((a, b) => b.value - a.value)
              .map((season, index) => (
                <div key={season.name} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: seasonColors[season.name] || colors[index] }}
                    />
                    <span className="text-white font-medium">{season.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-white font-semibold">${season.value.toLocaleString()}</div>
                    <div className="text-white/60 text-sm">{season.sales} sales</div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default TemporalAnalysis; 