// API service for ecommerce intelligence platform
export interface AnalysisRequest {
  file: File;
  apiTier?: 'tier1' | 'tier2' | 'tier3' | 'tier4' | 'tier5';
}

export interface AnalysisStatus {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  message: string;
  startTime?: string;
  endTime?: string;
  processingRate?: number;
  totalProducts?: number;
  processedProducts?: number;
}

export interface ProductData {
  'Item Title': string;
  'Sold Date': string;
  'Item Price': number;
  'Shipped to State': string;
  'Net Seller Proceeds': number;
  'Seller Shipping Fee': number;
  openai_category?: string;
  openai_subcategory?: string;
  day_of_week?: string;
  season?: string;
  [key: string]: any;
}

export interface DashboardData {
  products: ProductData[];
  analytics: {
    totalRevenue: number;
    totalProfit: number;
    totalItems: number;
    avgMargin: number;
    categoryDistribution: Record<string, number>;
    temporalPatterns: {
      dayOfWeek: Record<string, number>;
      seasonal: Record<string, number>;
      monthlyTrends: Array<{ month: string; revenue: number; category: string }>;
    };
    geographicData: {
      stateRevenue: Record<string, number>;
      regionRevenue: Record<string, number>;
    };
    recommendations: string[];
  };
}

export interface ExportData {
  format: 'csv' | 'xlsx' | 'json';
  data: ProductData[];
  analytics: DashboardData['analytics'];
}

export interface EbaySearchRequest {
  item_name: string;
  days_back?: number;
  limit?: number;
}

export interface EbaySearchResult {
  query: string;
  search_period_days: number;
  total_items_found: number;
  requested_limit: number;
  statistics?: {
    average_price: number;
    min_price: number;
    max_price: number;
    median_price: number;
    currency: string;
  };
  items: Array<{
    title: string;
    price: number;
    currency: string;
    url: string;
    soldDate: string;
    imageUrl?: string;
  }>;
  date_range: {
    start_date: string;
    end_date: string;
  };
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = config.API_URL;
  }

  // Upload and start analysis
  async uploadAndAnalyze(request: AnalysisRequest): Promise<{ analysisId: string }> {
    const formData = new FormData();
    formData.append('file', request.file);
    formData.append('api_tier', request.apiTier || 'tier5');

    const response = await fetch(`${this.baseUrl}/api/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Get analysis status
  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    const response = await fetch(`${this.baseUrl}/api/analysis/${analysisId}/status`);
    
    if (!response.ok) {
      throw new Error(`Failed to get status: ${response.statusText}`);
    }

    return response.json();
  }

  // Get dashboard data
  async getDashboardData(analysisId: string): Promise<DashboardData> {
    const response = await fetch(`${this.baseUrl}/api/analysis/${analysisId}/data`);
    
    if (!response.ok) {
      throw new Error(`Failed to get dashboard data: ${response.statusText}`);
    }

    return response.json();
  }

  // Export processed data
  async exportData(analysisId: string, format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}/api/export/${analysisId}?format=${format}`);
    
    if (!response.ok) {
      throw new Error(`Export failed: ${response.statusText}`);
    }

    return response.blob();
  }

  // WebSocket connection for real-time updates
  createWebSocketConnection(analysisId: string): WebSocket {
    const wsUrl = this.baseUrl.replace('http', 'ws') + `/ws/analysis/${analysisId}`;
    return new WebSocket(wsUrl);
  }

  // Search eBay for item prices
  async searchEbayPrices(request: EbaySearchRequest): Promise<EbaySearchResult> {
    const response = await fetch(`${this.baseUrl}/api/ebay/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`eBay search failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// Mock API service for development (when backend is not ready)
class MockApiService {
  private uploadedFileData: ProductData[] = [];
  private analysisStartTime: number | null = null;
  private processingDuration = 15000; // 15 seconds
  
  private generateMockData(rowCount: number = 1000): ProductData[] {
    const categories = ['Electronics', 'Clothing', 'Home & Kitchen', 'Beauty', 'Sports & Outdoors', 'Books', 'Toys & Games'];
    const subcategories: Record<string, string[]> = {
      'Electronics': ['Smartphones', 'Laptops', 'Headphones', 'Tablets'],
      'Clothing': ['T-Shirts', 'Jeans', 'Dresses', 'Shoes'],
      'Home & Kitchen': ['Kitchen Appliances', 'Furniture', 'Decor', 'Bedding'],
      'Beauty': ['Skincare', 'Makeup', 'Hair Care', 'Fragrances'],
      'Sports & Outdoors': ['Fitness Equipment', 'Outdoor Gear', 'Sports Apparel', 'Athletic Shoes'],
      'Books': ['Fiction', 'Non-Fiction', 'Educational', 'Children\'s Books'],
      'Toys & Games': ['Action Figures', 'Board Games', 'Educational Toys', 'Video Games']
    };
    const states = ['California', 'Texas', 'Florida', 'New York', 'Pennsylvania', 'Illinois', 'Ohio', 'Georgia', 'North Carolina', 'Michigan'];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];

    return Array.from({ length: rowCount }, (_, i) => {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const subcategory = subcategories[category][Math.floor(Math.random() * subcategories[category].length)];
      const price = Math.floor(Math.random() * 200) + 10;
      const profit = price * (0.2 + Math.random() * 0.3); // 20-50% profit margin
      const shippingFee = Math.floor(Math.random() * 10) + 2;

      return {
        'Item Title': `${subcategory} Product ${i + 1}`,
        'Sold Date': new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        'Item Price': price,
        'Shipped to State': states[Math.floor(Math.random() * states.length)],
        'Net Seller Proceeds': profit,
        'Seller Shipping Fee': shippingFee,
        openai_category: category,
        openai_subcategory: subcategory,
        day_of_week: daysOfWeek[Math.floor(Math.random() * daysOfWeek.length)],
        season: seasons[Math.floor(Math.random() * seasons.length)]
      };
    });
  }

  private async parseCSVFile(file: File): Promise<ProductData[]> {
    return new Promise((resolve, reject) => {
      console.log('📋 Reading file:', file.name, 'Size:', (file.size / 1024).toFixed(2), 'KB');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const csv = e.target?.result as string;
          console.log('📄 CSV content length:', csv.length);
          
          const lines = csv.split('\n').filter(line => line.trim());
          console.log('📊 Total lines found:', lines.length);
          
          if (lines.length < 4) { // Need at least header + 1 data row + 2 summary rows
            throw new Error('CSV file appears to be empty or has insufficient data rows');
          }
          
          // Show what we're about to remove (last 2 rows)
          console.log('🗑️ Last 2 rows to be removed:');
          console.log('  Second-to-last:', lines[lines.length - 2]);
          console.log('  Last:', lines[lines.length - 1]);
          
          // Remove the last 2 rows (summary row + timestamp row)
          const dataLines = lines.slice(0, -2);
          console.log('✂️ Removed last 2 summary rows. Data rows remaining:', dataLines.length - 1);
          
          const headers = dataLines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          console.log('📋 Headers found:', headers);
          
          const data: ProductData[] = [];
          
          for (let i = 1; i < dataLines.length; i++) {
            const line = dataLines[i].trim();
            if (!line) continue; // Skip empty lines
            
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            if (values.length < headers.length) {
              console.warn(`⚠️ Skipping row ${i}: insufficient columns (${values.length} < ${headers.length})`);
              continue;
            }
            
            const row: any = {};
            headers.forEach((header, index) => {
              row[header] = values[index];
            });
            
            // Convert numeric fields with better validation
            const itemPrice = parseFloat(row['Item Price']?.toString().replace(/[^0-9.-]/g, '')) || 0;
            const netProceeds = parseFloat(row['Net Seller Proceeds']?.toString().replace(/[^0-9.-]/g, '')) || 0;
            const shippingFee = parseFloat(row['Seller Shipping Fee']?.toString().replace(/[^0-9.-]/g, '')) || 0;
            
            row['Item Price'] = itemPrice;
            row['Net Seller Proceeds'] = netProceeds;
            row['Seller Shipping Fee'] = shippingFee;
            
            // Debug logging for first few rows
            if (data.length < 3) {
              console.log(`🔍 Row ${data.length + 1} parsing:`, {
                'Item Title': row['Item Title'],
                'Item Price': itemPrice,
                'Net Seller Proceeds': netProceeds,
                'Shipping Fee': shippingFee
              });
            }
            
            // Generate AI categories (mock OpenAI categorization)
            const title = row['Item Title'] || '';
            const { category, subcategory } = this.mockCategorizeProduct(title);
            row['openai_category'] = category;
            row['openai_subcategory'] = subcategory;
            
            // Add temporal features with robust date parsing
            if (row['Sold Date']) {
              const dateStr = row['Sold Date'].toString().trim();
              let date = null;
              
              // Try multiple date parsing strategies
              try {
                // First try direct parsing
                date = new Date(dateStr);
                
                // If that fails, try common date formats
                if (isNaN(date.getTime())) {
                  // Try MM/DD/YYYY format
                  const mmddyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                  if (mmddyyyy) {
                    date = new Date(parseInt(mmddyyyy[3]), parseInt(mmddyyyy[1]) - 1, parseInt(mmddyyyy[2]));
                  }
                  
                  // Try DD/MM/YYYY format
                  if (isNaN(date.getTime())) {
                    const ddmmyyyy = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
                    if (ddmmyyyy) {
                      date = new Date(parseInt(ddmmyyyy[3]), parseInt(ddmmyyyy[2]) - 1, parseInt(ddmmyyyy[1]));
                    }
                  }
                  
                  // Try YYYY-MM-DD format
                  if (isNaN(date.getTime())) {
                    const yyyymmdd = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
                    if (yyyymmdd) {
                      date = new Date(parseInt(yyyymmdd[1]), parseInt(yyyymmdd[2]) - 1, parseInt(yyyymmdd[3]));
                    }
                  }
                }
                
                // Only proceed if we have a valid date
                if (date && !isNaN(date.getTime()) && date.getFullYear() > 1900 && date.getFullYear() < 2030) {
                  row['day_of_week'] = date.toLocaleDateString('en-US', { weekday: 'long' });
                  const month = date.getMonth();
                  if (month >= 2 && month <= 4) row['season'] = 'Spring';
                  else if (month >= 5 && month <= 7) row['season'] = 'Summer';
                  else if (month >= 8 && month <= 10) row['season'] = 'Fall';
                  else row['season'] = 'Winter';
                  
                  // Store the properly formatted date
                  row['Sold Date'] = date.toISOString();
                } else {
                  console.warn(`⚠️ Could not parse date: "${dateStr}"`);
                  row['day_of_week'] = 'Unknown';
                  row['season'] = 'Unknown';
                }
              } catch (dateError) {
                console.warn(`⚠️ Date parsing error for "${dateStr}":`, dateError);
                row['day_of_week'] = 'Unknown';
                row['season'] = 'Unknown';
              }
            }
            
            data.push(row as ProductData);
          }
          
          console.log(`✅ Successfully parsed ${data.length} products`);
          console.log('📊 Sample parsed product:', data[0]);
          
          // Check for potential issues that might cause doubling
          const revenues = data.map(p => p['Item Price']).filter(p => p > 0);
          const totalRevenue = revenues.reduce((sum, price) => sum + price, 0);
          console.log('🔍 CSV parsing check:', {
            'Total products': data.length,
            'Products with valid prices': revenues.length,
            'Sum of Item Prices': totalRevenue.toLocaleString(),
            'Average price': revenues.length > 0 ? (totalRevenue / revenues.length).toFixed(2) : 0
          });
          
          resolve(data);
        } catch (error) {
          reject(new Error('Failed to parse CSV file: ' + error));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }
  
  private mockCategorizeProduct(title: string): { category: string; subcategory: string } {
    const titleLower = title.toLowerCase();
    
    // Simple keyword-based categorization (mimicking OpenAI)
    if (titleLower.includes('phone') || titleLower.includes('iphone') || titleLower.includes('samsung')) {
      return { category: 'Electronics', subcategory: 'Smartphones' };
    } else if (titleLower.includes('laptop') || titleLower.includes('computer') || titleLower.includes('macbook')) {
      return { category: 'Electronics', subcategory: 'Laptops' };
    } else if (titleLower.includes('shirt') || titleLower.includes('tee') || titleLower.includes('blouse')) {
      return { category: 'Clothing', subcategory: 'T-Shirts' };
    } else if (titleLower.includes('jeans') || titleLower.includes('pants') || titleLower.includes('trousers')) {
      return { category: 'Clothing', subcategory: 'Jeans' };
    } else if (titleLower.includes('shoe') || titleLower.includes('sneaker') || titleLower.includes('boot')) {
      return { category: 'Clothing', subcategory: 'Shoes' };
    } else if (titleLower.includes('makeup') || titleLower.includes('lipstick') || titleLower.includes('foundation')) {
      return { category: 'Beauty', subcategory: 'Makeup' };
    } else if (titleLower.includes('book') || titleLower.includes('novel') || titleLower.includes('guide')) {
      return { category: 'Books', subcategory: 'Fiction' };
    } else if (titleLower.includes('toy') || titleLower.includes('game') || titleLower.includes('puzzle')) {
      return { category: 'Toys & Games', subcategory: 'Educational Toys' };
    } else if (titleLower.includes('kitchen') || titleLower.includes('cookware') || titleLower.includes('appliance')) {
      return { category: 'Home & Kitchen', subcategory: 'Kitchen Appliances' };
    } else if (titleLower.includes('sport') || titleLower.includes('fitness') || titleLower.includes('exercise')) {
      return { category: 'Sports & Outdoors', subcategory: 'Fitness Equipment' };
    } else {
      return { category: 'General', subcategory: 'Miscellaneous' };
    }
  }

  async uploadAndAnalyze(request: AnalysisRequest): Promise<{ analysisId: string }> {
    try {
      console.log('📁 Starting to parse CSV file:', request.file.name);
      
      // Parse the actual uploaded CSV file
      this.uploadedFileData = await this.parseCSVFile(request.file);
      console.log(`✅ Successfully parsed ${this.uploadedFileData.length} products from your CSV file`);
      console.log('📊 Sample data:', this.uploadedFileData.slice(0, 2));
      
      // Start the analysis timer
      this.analysisStartTime = Date.now();
      this.processingDuration = Math.max(5000, this.uploadedFileData.length * 10); // 10ms per product, min 5 seconds
      
      // Simulate upload delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      return { analysisId: 'real-analysis-' + Date.now() };
    } catch (error) {
      console.error('❌ Failed to parse CSV:', error);
      throw new Error(`Failed to process your CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getAnalysisStatus(analysisId: string): Promise<AnalysisStatus> {
    if (!this.analysisStartTime) {
      this.analysisStartTime = Date.now();
    }
    
    // Calculate progress based on elapsed time since analysis started
    const elapsed = Date.now() - this.analysisStartTime;
    const progress = Math.min(100, (elapsed / this.processingDuration) * 100);
    const isCompleted = progress >= 100;
    
    return {
      id: analysisId,
      status: isCompleted ? 'completed' : 'processing',
      progress: Math.floor(progress),
      message: isCompleted ? 'Analysis completed successfully!' : 'Processing with OpenAI tier-5 settings...',
      startTime: new Date(Date.now() - 10000).toISOString(),
      endTime: isCompleted ? new Date().toISOString() : undefined,
      processingRate: 4800,
      totalProducts: this.uploadedFileData.length > 0 ? this.uploadedFileData.length : 1000,
      processedProducts: Math.floor(progress * (this.uploadedFileData.length > 0 ? this.uploadedFileData.length : 1000) / 100)
    };
  }

  async getDashboardData(analysisId: string): Promise<DashboardData> {
    console.log('📊 Getting dashboard data. Uploaded data count:', this.uploadedFileData.length);
    
    // Use real uploaded data if available, otherwise fall back to mock data
    const products = this.uploadedFileData.length > 0 ? this.uploadedFileData : this.generateMockData(1000);
    
    console.log(`📈 Using ${this.uploadedFileData.length > 0 ? 'REAL' : 'MOCK'} data with ${products.length} products`);
    
    // Calculate analytics with debugging
    console.log('💰 Calculating analytics for', products.length, 'products');
    
    // Revenue = sum of Item Price (gross sales)
    const totalRevenue = products.reduce((sum, p) => sum + (p['Item Price'] || 0), 0);
    
    // Profit = sum of Net Seller Proceeds (after fees)
    const totalProfit = products.reduce((sum, p) => sum + (p['Net Seller Proceeds'] || 0), 0);
    const avgMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
    
    // Debug: Check for potential doubling issues
    const sampleProducts = products.slice(0, 5);
    console.log('🔍 Sample products for debugging:', sampleProducts.map(p => ({
      title: p['Item Title'],
      itemPrice: p['Item Price'],
      netProceeds: p['Net Seller Proceeds'],
      category: p['openai_category']
    })));
    
    // Check for duplicates
    const titleCounts = new Map();
    products.forEach(p => {
      const title = p['Item Title'];
      titleCounts.set(title, (titleCounts.get(title) || 0) + 1);
    });
    const duplicates = Array.from(titleCounts.entries()).filter(([title, count]) => count > 1);
    if (duplicates.length > 0) {
      console.warn('⚠️ Found potential duplicate products:', duplicates.slice(0, 3));
    }
    
    console.log('📊 Revenue calculations:', {
      'Total Revenue (Item Price)': totalRevenue.toLocaleString(),
      'Total Profit (Net Seller Proceeds)': totalProfit.toLocaleString(),
      'Average Margin': avgMargin.toFixed(1) + '%',
      'Product Count': products.length
    });

    // Category distribution using revenue (Item Price)
    const categoryDistribution: Record<string, number> = {};
    products.forEach(p => {
      const category = p.openai_category || 'Unknown';
      const revenue = p['Item Price'] || 0;
      categoryDistribution[category] = (categoryDistribution[category] || 0) + revenue;
    });

    // Temporal patterns using revenue (Item Price)
    const dayOfWeek: Record<string, number> = {};
    const seasonal: Record<string, number> = {};
    products.forEach(p => {
      const day = p.day_of_week || 'Unknown';
      const season = p.season || 'Unknown';
      const revenue = p['Item Price'] || 0;
      dayOfWeek[day] = (dayOfWeek[day] || 0) + revenue;
      seasonal[season] = (seasonal[season] || 0) + revenue;
    });

    // Geographic data
    const stateRevenue: Record<string, number> = {};
    const regionMapping: Record<string, string> = {
      'California': 'West', 'Texas': 'South', 'Florida': 'South', 'New York': 'Northeast',
      'Pennsylvania': 'Northeast', 'Illinois': 'Midwest', 'Ohio': 'Midwest', 'Georgia': 'South',
      'North Carolina': 'South', 'Michigan': 'Midwest'
    };
    const regionRevenue: Record<string, number> = {};

    products.forEach(p => {
      const state = p['Shipped to State'];
      const revenue = p['Item Price'] || 0;
      stateRevenue[state] = (stateRevenue[state] || 0) + revenue;
      const region = regionMapping[state] || 'Other';
      regionRevenue[region] = (regionRevenue[region] || 0) + revenue;
    });

    // Mock monthly trends
    const monthlyTrends = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(2023, i, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
      revenue: Math.floor(Math.random() * 50000) + 20000,
      category: Object.keys(categoryDistribution)[0]
    }));

    return {
      products,
      analytics: {
        totalRevenue,
        totalProfit,
        totalItems: products.length,
        avgMargin,
        categoryDistribution,
        temporalPatterns: {
          dayOfWeek,
          seasonal,
          monthlyTrends
        },
        geographicData: {
          stateRevenue,
          regionRevenue
        },
        recommendations: [
          'Focus on Electronics category - highest revenue generator',
          'Weekend sales show 15% higher conversion rates',
          'Consider expanding to California market - high performance',
          'Summer season shows strongest performance for outdoor categories'
        ]
      }
    };
  }

  async exportData(analysisId: string, format: 'csv' | 'xlsx' | 'json' = 'csv'): Promise<Blob> {
    const data = await this.getDashboardData(analysisId);
    const content = format === 'json' ? JSON.stringify(data, null, 2) : 'Mock CSV data';
    return new Blob([content], { type: format === 'json' ? 'application/json' : 'text/csv' });
  }

  createWebSocketConnection(analysisId: string): WebSocket {
    // Return a mock WebSocket for development
    return new WebSocket('wss://echo.websocket.org/');
  }

  async searchEbayPrices(request: EbaySearchRequest): Promise<EbaySearchResult> {
    // Mock eBay search for development
    await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API delay
    
    const mockItems = Array.from({ length: Math.min(request.limit || 100, 50) }, (_, i) => ({
      title: `${request.item_name} - Item ${i + 1}`,
      price: Math.floor(Math.random() * 100) + 20,
      currency: 'USD',
      url: `https://www.ebay.com/itm/mock-item-${i + 1}`,
      soldDate: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      imageUrl: `https://picsum.photos/200/200?random=${i}` // Mock placeholder images
    }));

    const prices = mockItems.map(item => item.price);
    const averagePrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const medianPrice = prices.sort((a, b) => a - b)[Math.floor(prices.length / 2)];

    return {
      query: request.item_name,
      search_period_days: request.days_back || 7,
      total_items_found: mockItems.length,
      requested_limit: request.limit || 100,
      statistics: {
        average_price: Math.round(averagePrice * 100) / 100,
        min_price: minPrice,
        max_price: maxPrice,
        median_price: medianPrice,
        currency: 'USD'
      },
      items: mockItems.slice(0, 20),
      date_range: {
        start_date: new Date(Date.now() - (request.days_back || 7) * 24 * 60 * 60 * 1000).toISOString(),
        end_date: new Date().toISOString()
      }
    };
  }
}

import { config } from '../config/environment';

// Export the appropriate service based on environment
const apiService = config.USE_MOCK_API
  ? new MockApiService() 
  : new ApiService();

export default apiService; 