import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, Clock, Shield, AlertTriangle } from 'lucide-react';
import axios from 'axios';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartData
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type AnalyticsData = {
  totalVerifications: number;
  successRate: number;
  averageRiskScore: number;
  averageVerificationTime: number;
  chartData: {
    date: string;
    total: number;
    successful: number;
    successRate: number;
  }[];
};

const Analytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('7d');

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        // In a real implementation, this would fetch from the API with the timeRange parameter
        // For demo purposes, we'll simulate a delay and return mock data
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockData: AnalyticsData = {
          totalVerifications: 12547,
          successRate: 98.7,
          averageRiskScore: 0.23,
          averageVerificationTime: 856,
          chartData: Array.from({ length: 7 }).map((_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            return {
              date: date.toISOString().split('T')[0],
              total: Math.floor(Math.random() * 1000) + 1000,
              successful: Math.floor(Math.random() * 900) + 900,
              successRate: Math.floor(Math.random() * 5) + 95
            };
          })
        };
        
        setAnalyticsData(mockData);
        setLoading(false);
      } catch (err: any) {
        setError('Failed to load analytics: ' + (err.response?.data?.error || err.message));
        setLoading(false);
      }
    }
    
    fetchAnalytics();
  }, [timeRange]);

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Verification Activity',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  const prepareChartData = (): ChartData<'line'> => {
    if (!analyticsData) {
      return {
        labels: [],
        datasets: []
      };
    }

    return {
      labels: analyticsData.chartData.map(item => item.date),
      datasets: [
        {
          label: 'Total Verifications',
          data: analyticsData.chartData.map(item => item.total),
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.5)',
          tension: 0.3,
        },
        {
          label: 'Successful Verifications',
          data: analyticsData.chartData.map(item => item.successful),
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          tension: 0.3,
        }
      ],
    };
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <BarChart3 className="text-indigo-600 mr-2" size={24} />
              <h2 className="text-2xl font-semibold text-gray-800">Analytics Dashboard</h2>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === '7d'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === '30d'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-3 py-1 text-sm rounded-md ${
                  timeRange === '90d'
                    ? 'bg-indigo-100 text-indigo-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>
          
          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {analyticsData && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Verifications</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{analyticsData.totalVerifications.toLocaleString()}</p>
                    </div>
                    <div className="bg-indigo-100 p-2 rounded-md">
                      <Shield className="text-indigo-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <TrendingUp size={16} className="mr-1" />
                    +12.5% from previous period
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Success Rate</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{analyticsData.successRate.toFixed(1)}%</p>
                    </div>
                    <div className="bg-green-100 p-2 rounded-md">
                      <TrendingUp className="text-green-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <TrendingUp size={16} className="mr-1" />
                    +0.8% from previous period
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Risk Score</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{analyticsData.averageRiskScore.toFixed(2)}</p>
                    </div>
                    <div className="bg-yellow-100 p-2 rounded-md">
                      <AlertTriangle className="text-yellow-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-red-600 flex items-center">
                    <TrendingDown size={16} className="mr-1" />
                    -0.05 from previous period
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Avg. Verification Time</p>
                      <p className="mt-1 text-2xl font-semibold text-gray-900">{analyticsData.averageVerificationTime}ms</p>
                    </div>
                    <div className="bg-blue-100 p-2 rounded-md">
                      <Clock className="text-blue-600" size={20} />
                    </div>
                  </div>
                  <div className="mt-2 text-sm text-green-600 flex items-center">
                    <TrendingDown size={16} className="mr-1" />
                    -45ms from previous period
                  </div>
                </div>
              </div>
              
              <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5 mb-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Verification Trends</h3>
                <div className="h-80">
                  <Line options={chartOptions} data={prepareChartData()} />
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Bot Detection by Type</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <p className="text-center">
                      <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
                      Chart will be integrated here
                    </p>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-5">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Geographic Distribution</h3>
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <p className="text-center">
                      <BarChart3 size={48} className="mx-auto mb-2 opacity-50" />
                      Chart will be integrated here
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;