import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  DollarSign, 
  TrendingUp, 
  BarChart3,
  ExternalLink,
  Loader2,
  AlertCircle,
  Calendar,
  Package,
  ImageIcon
} from 'lucide-react';
import apiService, { EbaySearchRequest, EbaySearchResult } from '../../services/api';

const EbayPriceAnalysis: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [daysBack, setDaysBack] = useState(7);
  const [limit, setLimit] = useState(100);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<EbaySearchResult | null>(null);
  const [showImages, setShowImages] = useState(true);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!searchQuery.trim()) {
      setError('Please enter an item name to search');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSearchResult(null);

    try {
      const request: EbaySearchRequest = {
        item_name: searchQuery.trim(),
        days_back: daysBack,
        limit: limit
      };

      const result = await apiService.searchEbayPrices(request);
      setSearchResult(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to search eBay prices');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-display font-bold text-white mb-4">
          eBay Price Intelligence
        </h2>
        <p className="text-white/70 max-w-2xl mx-auto">
          Analyze current market prices for any product on eBay.
          Get insights on pricing trends and market data from active listings.
        </p>
      </div>

      {/* Search Form */}
      <div className="card max-w-2xl mx-auto">
        <form onSubmit={handleSearch} className="space-y-6">
          <div>
            <label htmlFor="search-query" className="block text-sm font-medium text-white mb-2">
              Item Name
            </label>
            <div className="relative">
              <Package className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
              <input
                id="search-query"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., tommy hilfiger shirt, calvin klein jeans"
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="days-back" className="block text-sm font-medium text-white mb-2">
                Search Period (Days) - Not Used
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <select
                  id="days-back"
                  value={daysBack}
                  onChange={(e) => setDaysBack(Number(e.target.value))}
                  disabled
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white/50 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent cursor-not-allowed"
                >
                  <option value={7}>Active Listings Only</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="limit" className="block text-sm font-medium text-white mb-2">
                Max Items
              </label>
              <div className="relative">
                <BarChart3 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-white/40" />
                <select
                  id="limit"
                  value={limit}
                  onChange={(e) => setLimit(Number(e.target.value))}
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent"
                >
                  <option value={25}>25 items</option>
                  <option value={50}>50 items</option>
                  <option value={100}>100 items</option>
                  <option value={200}>200 items</option>
                </select>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading || !searchQuery.trim()}
            className="w-full btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Searching eBay...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Search Prices
              </>
            )}
          </button>
        </form>
      </div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card border-red-500/20 bg-red-500/10 max-w-2xl mx-auto"
        >
          <div className="flex items-center space-x-3">
            <AlertCircle className="h-6 w-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-semibold text-red-300 mb-1">Search Failed</h3>
              <p className="text-red-200/80">{error}</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Search Results */}
      {searchResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Statistics Cards */}
          {searchResult.statistics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card text-center">
                <div className="text-3xl font-bold gradient-text mb-2">
                  ${searchResult.statistics.average_price}
                </div>
                <p className="text-white/70">Average Price</p>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-green-400 mb-2">
                  ${searchResult.statistics.min_price}
                </div>
                <p className="text-white/70">Lowest Price</p>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-blue-400 mb-2">
                  ${searchResult.statistics.max_price}
                </div>
                <p className="text-white/70">Highest Price</p>
              </div>
              <div className="card text-center">
                <div className="text-3xl font-bold text-purple-400 mb-2">
                  ${searchResult.statistics.median_price}
                </div>
                <p className="text-white/70">Median Price</p>
              </div>
            </div>
          ) : (
            <div className="card text-center">
              <Package className="h-16 w-16 text-white/40 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">No Results Found</h3>
              <p className="text-white/70">
                {searchResult.message || 'No items found for this search query'}
              </p>
            </div>
          )}

          {/* Search Info */}
          <div className="card">
            <div className="flex flex-col md:flex-row md:items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Search Results for "{searchResult.query}"
                </h3>
                <div className="flex flex-wrap gap-4 text-sm text-white/70">
                  <span>📦 {searchResult.total_items_found} active listings found</span>
                  <span>🎯 Limit: {searchResult.requested_limit}</span>
                  <span>📅 Current market data</span>
                </div>
              </div>
              <div className="mt-4 md:mt-0">
                <button
                  onClick={() => setShowImages(!showImages)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm">{showImages ? 'Hide Images' : 'Show Images'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Recent Items */}
          {searchResult.items && searchResult.items.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-white mb-4">Current Listings</h3>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {searchResult.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center flex-1 min-w-0 mr-4">
                      {/* Item Image */}
                      {showImages && (
                        <div className="flex-shrink-0 mr-3">
                          {item.imageUrl ? (
                            <img
                              src={item.imageUrl}
                              alt={item.title}
                              loading="lazy"
                              className="w-16 h-16 object-cover rounded-lg bg-white/10"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center"
                            style={{ display: item.imageUrl ? 'none' : 'flex' }}
                          >
                            <Package className="h-6 w-6 text-white/40" />
                          </div>
                        </div>
                      )}
                      
                      {/* Item Details */}
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{item.title}</p>
                        <p className="text-white/60 text-sm">
                          Current listing price
                        </p>
                      </div>
                    </div>
                    
                    {/* Price and Link */}
                    <div className="flex items-center space-x-3">
                      <span className="text-lg font-bold text-primary-400">
                        ${item.price}
                      </span>
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                      >
                        <ExternalLink className="h-4 w-4 text-white/60" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
};

export default EbayPriceAnalysis; 