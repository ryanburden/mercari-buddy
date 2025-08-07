import React, { useMemo, useState } from 'react';
import { DashboardData } from '../../services/api';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';
import { motion } from 'framer-motion';

// US Map GeoJSON URL
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

interface GeographicMapProps {
  data: DashboardData;
}

interface TooltipData {
  state: string;
  revenue: number;
  orders: number;
  x: number;
  y: number;
}

const GeographicMap: React.FC<GeographicMapProps> = ({ data }) => {
  const [tooltipData, setTooltipData] = useState<TooltipData | null>(null);

  const topStates = Object.entries(data.analytics.geographicData.stateRevenue)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10);

  // Calculate color scale
  const colorScale = useMemo(() => {
    const revenues = Object.values(data.analytics.geographicData.stateRevenue);
    const max = Math.max(...revenues);
    const min = Math.min(...revenues);
    
    return scaleLinear<string>()
      .domain([min, max])
      .range(["rgba(139, 92, 246, 0.1)", "rgba(139, 92, 246, 1)"]);
  }, [data.analytics.geographicData.stateRevenue]);

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

  const getOrdersForState = (geoStateName: string) => {
    // Try both full name and abbreviation
    return data.analytics.geographicData.stateOrders[geoStateName] || 
           data.analytics.geographicData.stateOrders[stateNameMap[geoStateName]] || 0;
  };

  return (
    <div className="space-y-8">
      <div className="card">
        <h3 className="text-xl font-semibold text-white mb-6">Revenue by State Heatmap</h3>
        
        {/* US Map */}
        <div className="bg-white/5 rounded-lg p-6 mb-6 relative">
          <div className="w-full aspect-[2/1] relative">
            <ComposableMap
              projection="geoAlbersUsa"
              projectionConfig={{
                scale: 1000
              }}
            >
              <ZoomableGroup>
                <Geographies geography={geoUrl}>
                  {({ geographies }) =>
                    geographies.map(geo => {
                      const revenue = getRevenueForState(geo.properties.name);
                      return (
                        <motion.g
                          key={geo.rsmKey}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Geography
                            geography={geo}
                            fill={colorScale(revenue)}
                            stroke="rgba(255, 255, 255, 0.2)"
                            strokeWidth={0.5}
                            style={{
                              default: {
                                outline: 'none',
                              },
                              hover: {
                                fill: 'rgba(139, 92, 246, 0.8)',
                                outline: 'none',
                                cursor: 'pointer',
                              },
                              pressed: {
                                outline: 'none',
                              },
                            }}
                            onMouseEnter={(evt) => {
                              const { clientX, clientY } = evt;
                              const rect = evt.currentTarget.getBoundingClientRect();
                              const x = clientX - rect.left;
                              const y = clientY - rect.top;
                              
                              setTooltipData({
                                state: geo.properties.name,
                                revenue: revenue,
                                orders: getOrdersForState(geo.properties.name),
                                x,
                                y
                              });
                            }}
                            onMouseLeave={() => {
                              setTooltipData(null);
                            }}
                          />
                        </motion.g>
                      );
                    })
                  }
                </Geographies>
              </ZoomableGroup>
            </ComposableMap>
          </div>

          {/* Tooltip */}
          {tooltipData && (
            <div
              className="absolute bg-gray-900 text-white p-3 rounded-lg shadow-lg z-10 pointer-events-none"
              style={{
                left: tooltipData.x + 10,
                top: tooltipData.y + 10,
                transform: 'translate(-50%, -50%)',
                minWidth: '200px'
              }}
            >
              <div className="font-semibold text-lg mb-2">{tooltipData.state}</div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/70">Revenue:</span>
                  <span className="text-white">${tooltipData.revenue.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Orders:</span>
                  <span className="text-white">{tooltipData.orders.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/70">Avg. Order Value:</span>
                  <span className="text-white">
                    ${(tooltipData.revenue / (tooltipData.orders || 1)).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {/* Color Scale Legend */}
          <div className="mt-4 flex items-center justify-center">
            <div className="flex items-center space-x-4">
              <span className="text-white/70 text-sm">Revenue Scale:</span>
              <div className="flex items-center space-x-2">
                {[0, 0.25, 0.5, 0.75, 1].map((value, index) => {
                  const revenue = value * (Math.max(...Object.values(data.analytics.geographicData.stateRevenue)));
                  return (
                    <div key={index} className="flex items-center space-x-1">
                      <div 
                        className="w-4 h-4 rounded"
                        style={{ backgroundColor: colorScale(revenue) }}
                      />
                      <span className="text-white/60 text-xs">
                        ${revenue.toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Top States List */}
        <div>
          <h4 className="font-semibold text-white mb-4">Top States by Revenue</h4>
          <div className="space-y-2">
            {topStates.map(([state, revenue], index) => {
              const orders = getOrdersForState(state);
              return (
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
                      {orders.toLocaleString()} orders
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Geographic Insights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Regional Distribution</h4>
            {Object.entries(data.analytics.geographicData.regionRevenue).map(([region, revenue]) => (
              <div key={region} className="flex justify-between text-sm">
                <span className="text-white/70">{region}</span>
                <span className="text-white">${revenue.toLocaleString()}</span>
              </div>
            ))}
          </div>
          
          <div className="p-4 bg-white/5 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Geographic Insights</h4>
            <div className="space-y-2 text-sm">
              <div className="text-white/70">📍 Top Market: <span className="text-white">{topStates[0]?.[0] || 'N/A'}</span></div>
              <div className="text-white/70">🗺️ States Covered: <span className="text-white">{Object.keys(data.analytics.geographicData.stateRevenue).length}</span></div>
              <div className="text-white/70">🎯 Market Concentration: <span className="text-white">{Math.round(topStates.slice(0, 3).reduce((sum, [, revenue]) => sum + revenue, 0) / data.analytics.totalRevenue * 100)}%</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeographicMap; 