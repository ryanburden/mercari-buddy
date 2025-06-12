import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ListingOptimizer: React.FC = () => {
  const [listingText, setListingText] = useState('');
  const [optimizedText, setOptimizedText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [listingType, setListingType] = useState<'title' | 'description'>('title');

  const handleOptimize = async () => {
    if (!listingText.trim()) {
      setError('Please enter a listing title or description');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/optimize-listing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          listing_text: listingText,
          listing_type: listingType
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to optimize listing');
      }

      const data = await response.json();
      setOptimizedText(data.optimized_text);
    } catch (err) {
      setError('Failed to optimize listing. Please try again.');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-bold text-white mb-6">
          Optimize Your Product Listings
        </h2>
        
        <div className="space-y-6">
          <div className="flex space-x-4">
            <button
              onClick={() => setListingType('title')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                listingType === 'title'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Optimize Title
            </button>
            <button
              onClick={() => setListingType('description')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                listingType === 'description'
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              Optimize Description
            </button>
          </div>

          <div>
            <label htmlFor="listing" className="block text-sm font-medium text-white mb-2">
              Enter your product {listingType}
            </label>
            <textarea
              id="listing"
              rows={listingType === 'description' ? 6 : 3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder={listingType === 'title' 
                ? 'e.g., Vintage leather jacket brown size M'
                : 'e.g., Genuine leather jacket in classic brown. Features zip front closure and multiple pockets...'}
              value={listingText}
              onChange={(e) => setListingText(e.target.value)}
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleOptimize}
            disabled={isLoading}
            className="w-full py-3 px-4 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Optimizing...' : `Optimize ${listingType === 'title' ? 'Title' : 'Description'}`}
          </button>

          {optimizedText && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8"
            >
              <h3 className="text-lg font-medium text-white mb-3">
                Optimized {listingType === 'title' ? 'Title' : 'Description'}:
              </h3>
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <p className="text-white whitespace-pre-wrap">{optimizedText}</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ListingOptimizer; 