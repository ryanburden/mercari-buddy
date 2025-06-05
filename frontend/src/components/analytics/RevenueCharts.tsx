import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { DashboardData } from '../../services/api';
import { format } from 'date-fns';

interface RevenueChartsProps {
  data: DashboardData;
  compact?: boolean;
}

const COLORS = [
  '#3b82f6', '#8b5cf6', '#06d6a0', '#f72585', '#f8961e',
  '#90e0ef', '#c77dff', '#a7f3d0', '#fbb4ae', '#fed9b7'
];

const RevenueCharts: React.FC<RevenueChartsProps> = ({ data, compact = false }) => {
  // Prepare monthly revenue data by category
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, Record<string, number>>();
    
    data.products.forEach(product => {
      try {
        const date = new Date(product['Sold Date']);
        if (isNaN(date.getTime())) {
          console.warn('Invalid date found:', product['Sold Date']);
          return; // Skip this product
        }
        
        const monthKey = format(date, 'MMM yyyy');
        const category = product.openai_category || 'Unknown';
        const revenue = product['Item Price'] || 0;
      
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {});
        }
        
        const monthData = monthMap.get(monthKey)!;
        monthData[category] = (monthData[category] || 0) + revenue;
        monthData.total = (monthData.total || 0) + revenue;
      } catch (dateError) {
        console.warn('Error processing date for product:', product['Item Title'], dateError);
      }
    });
    
    return Array.from(monthMap.entries())
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => new Date(a.month).getTime() - new Date(b.month).getTime());
  }, [data.products]);

  // Category revenue data for pie chart
  const categoryData = useMemo(() => {
    return Object.entries(data.analytics.categoryDistribution)
      .map(([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [data.analytics.categoryDistribution]);

  // Top categories for bar chart
  const topCategories = useMemo(() => {
    return categoryData.slice(0, compact ? 5 : 10);
  }, [categoryData, compact]);

  // Custom tooltip for charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-white/20 rounded-lg p-3 shadow-xl">
          <p className="text-white font-semibold mb-2">{label}</p>
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

  if (compact) {
    return (
      <div className="space-y-6">
        {/* Revenue by Category - Pie Chart */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Revenue by Category</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categoryData.slice(0, 6)}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="revenue"
                nameKey="category"
                label={({ category, percent }) => 
                  percent > 5 ? `${category} ${(percent * 100).toFixed(0)}%` : ''
                }
              >
                {categoryData.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Legend 
                wrapperStyle={{ color: '#fff' }}
                formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                dataKey="month" 
                stroke="#9CA3AF"
                fontSize={12}
              />
              <YAxis 
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="total"
                stroke="#3b82f6"
                fill="url(#colorRevenue)"
                strokeWidth={2}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Revenue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card text-center">
          <div className="text-2xl font-bold gradient-text mb-1">
            ${data.analytics.totalRevenue.toLocaleString()}
          </div>
          <p className="text-white/70 text-sm">Total Revenue</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold gradient-text mb-1">
            ${data.analytics.totalProfit.toLocaleString()}
          </div>
          <p className="text-white/70 text-sm">Total Profit</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold gradient-text mb-1">
            ${(data.analytics.totalRevenue / data.analytics.totalItems).toFixed(0)}
          </div>
          <p className="text-white/70 text-sm">Avg Order Value</p>
        </div>
        <div className="card text-center">
          <div className="text-2xl font-bold gradient-text mb-1">
            {data.analytics.avgMargin.toFixed(1)}%
          </div>
          <p className="text-white/70 text-sm">Avg Margin</p>
        </div>
      </div>

      {/* Monthly Revenue Trends by Category */}
      <div className="card">
        <h3 className="text-xl font-semibold text-white mb-6">Monthly Revenue Trends by Category</h3>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              stroke="#9CA3AF"
              fontSize={12}
            />
            <YAxis 
              stroke="#9CA3AF"
              fontSize={12}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend 
              wrapperStyle={{ color: '#fff' }}
              formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>}
            />
            {Object.keys(data.analytics.categoryDistribution).slice(0, 5).map((category, index) => (
              <Line
                key={category}
                type="monotone"
                dataKey={category}
                stroke={COLORS[index]}
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Revenue by Category - Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="card">
          <h3 className="text-xl font-semibold text-white mb-6">Top Categories by Revenue</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={topCategories} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis 
                type="number"
                stroke="#9CA3AF"
                fontSize={12}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="category"
                stroke="#9CA3AF"
                fontSize={12}
                width={120}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="revenue" 
                fill="url(#gradientBar)"
                radius={[0, 4, 4, 0]}
              />
              <defs>
                <linearGradient id="gradientBar" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h3 className="text-xl font-semibold text-white mb-6">Revenue Distribution (Top 10 Categories)</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={topCategories}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percent }) => 
                  percent > 3 ? `${category} ${(percent * 100).toFixed(0)}%` : ''
                }
                outerRadius={120}
                fill="#8884d8"
                dataKey="revenue"
                nameKey="category"
              >
                {topCategories.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [`$${value.toLocaleString()}`, name]}
                labelFormatter={(label) => `Category: ${label}`}
              />
              <Legend 
                wrapperStyle={{ color: '#fff' }}
                formatter={(value) => <span style={{ color: '#fff' }}>{value}</span>}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Revenue Performance Summary */}
      <div className="card">
        <h3 className="text-xl font-semibold text-white mb-6">Revenue Performance Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categoryData.slice(0, 6).map((category, index) => (
            <div key={category.category} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-white">{category.category}</h4>
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index] }}
                />
              </div>
              <div className="text-2xl font-bold gradient-text mb-1">
                ${category.revenue.toLocaleString()}
              </div>
              <div className="text-sm text-white/60">
                {((category.revenue / data.analytics.totalRevenue) * 100).toFixed(1)}% of total
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RevenueCharts; 