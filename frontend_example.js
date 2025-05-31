// components/Dashboard.jsx - Modern Next.js frontend example
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, BarChart3, TrendingUp, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [analyses, setAnalyses] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/user/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setUser(data.user);
      setAnalyses(data.recent_analyses);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });

      if (response.ok) {
        const analysis = await response.json();
        // Redirect to analysis page or show success
        router.push(`/analysis/${analysis.id}`);
      }
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">
                Mercari Sales Intelligence
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.subscription_tier} Plan
              </span>
              <Button variant="outline">Upgrade</Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">$15,750</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products Analyzed</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,250</div>
              <p className="text-xs text-muted-foreground">
                750 remaining this month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Confidence</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">84%</div>
              <p className="text-xs text-muted-foreground">
                +2% from last upload
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Upload Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Upload Sales Data</CardTitle>
            <p className="text-sm text-gray-600">
              Upload your Mercari sales report CSV to get AI-powered insights
            </p>
          </CardHeader>
          <CardContent>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <div className="space-y-2">
                <p className="text-lg font-medium">Drop your CSV file here</p>
                <p className="text-sm text-gray-500">or click to browse</p>
              </div>
              <input
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button 
                  disabled={isUploading} 
                  className="mt-4"
                  asChild
                >
                  <span>
                    {isUploading ? 'Uploading...' : 'Choose File'}
                  </span>
                </Button>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Recent Analyses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Analyses</CardTitle>
          </CardHeader>
          <CardContent>
            {analyses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No analyses yet. Upload your first sales report to get started!
              </div>
            ) : (
              <div className="space-y-4">
                {analyses.map((analysis) => (
                  <div 
                    key={analysis.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div>
                      <h3 className="font-medium">{analysis.filename}</h3>
                      <p className="text-sm text-gray-500">
                        {analysis.total_products} products • {analysis.created_at}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">
                      View Report
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
} 