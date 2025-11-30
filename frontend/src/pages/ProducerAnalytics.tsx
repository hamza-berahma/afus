import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  ShoppingCart, 
  Users,
  BarChart3,
  PieChart,
  Activity,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns';

type Period = '7d' | '30d' | '90d' | 'all';

export const ProducerAnalytics: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');

  // Fetch analytics data
  const { data: analyticsData, isLoading } = useQuery({
    queryKey: ['producer-analytics', selectedPeriod],
    queryFn: async () => {
      const response = await apiService.getDashboardAnalytics({ period: selectedPeriod });
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch dashboard stats for additional metrics
  const { data: dashboardStats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiService.getDashboardStats();
      return response.data.data;
    },
    enabled: !!user,
  });

  // Fetch transactions for detailed analytics
  const { data: transactionsData } = useQuery({
    queryKey: ['producer-transactions', selectedPeriod],
    queryFn: async () => {
      const response = await apiService.getWalletTransactions({ limit: 100 });
      return response.data.data?.transactions || [];
    },
  });

  const transactions = transactionsData || [];
  const analytics = analyticsData || {};
  const stats = dashboardStats || {};

  // Calculate period-based metrics
  const getPeriodDates = (period: Period) => {
    const now = new Date();
    switch (period) {
      case '7d':
        return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
      case '30d':
        return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
      case '90d':
        return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
      default:
        return { start: null, end: null };
    }
  };

  const periodDates = getPeriodDates(selectedPeriod);
  const filteredTransactions = periodDates.start
    ? transactions.filter((t: any) => {
        const txDate = new Date(t.createdAt);
        return txDate >= periodDates.start! && txDate <= periodDates.end!;
      })
    : transactions;

  // Calculate metrics
  const totalRevenue = filteredTransactions
    .filter((t: any) => t.status === 'SETTLED' && user?.id === t.seller?.id)
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const totalOrders = filteredTransactions.filter(
    (t: any) => user?.id === t.seller?.id
  ).length;

  const completedOrders = filteredTransactions.filter(
    (t: any) => t.status === 'SETTLED' && user?.id === t.seller?.id
  ).length;

  const pendingOrders = filteredTransactions.filter(
    (t: any) => ['ESCROWED', 'SHIPPED', 'DELIVERED'].includes(t.status) && user?.id === t.seller?.id
  ).length;

  const averageOrderValue = completedOrders > 0 ? totalRevenue / completedOrders : 0;

  // Calculate growth (simplified - compare with previous period)
  const previousPeriod = selectedPeriod === '7d' ? '30d' : selectedPeriod === '30d' ? '90d' : 'all';
  const previousTransactions = transactions; // Simplified - would need separate query in real app
  const previousRevenue = previousTransactions
    .filter((t: any) => t.status === 'SETTLED' && user?.id === t.seller?.id)
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const revenueGrowth = previousRevenue > 0 
    ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 
    : 0;

  const ordersGrowth = previousTransactions.length > 0
    ? ((totalOrders - previousTransactions.length) / previousTransactions.length) * 100
    : 0;

  if (isLoading) {
    return (
      <ProtectedRoute requiredRole="PRODUCER">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="120px" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton height="400px" />
            <Skeleton height="400px" />
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="PRODUCER">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Analytics Dashboard</h1>
            <p className="text-gray-600 mt-2">Track your business performance and insights</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {(['7d', '30d', '90d', 'all'] as Period[]).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : period === '90d' ? '90 Days' : 'All Time'}
              </Button>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/producer')}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-primary-50 to-primary-100 border-primary-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-primary-500 rounded-lg">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
              {revenueGrowth !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  revenueGrowth > 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {revenueGrowth > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(revenueGrowth).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
            <p className="text-3xl font-bold text-gray-900">{totalRevenue.toFixed(2)} MAD</p>
            <p className="text-xs text-gray-500 mt-2">{completedOrders} completed orders</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-secondary-50 to-secondary-100 border-secondary-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-secondary-500 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-white" />
              </div>
              {ordersGrowth !== 0 && (
                <div className={`flex items-center gap-1 text-sm font-semibold ${
                  ordersGrowth > 0 ? 'text-success-600' : 'text-error-600'
                }`}>
                  {ordersGrowth > 0 ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  {Math.abs(ordersGrowth).toFixed(1)}%
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mb-1">Total Orders</p>
            <p className="text-3xl font-bold text-gray-900">{totalOrders}</p>
            <p className="text-xs text-gray-500 mt-2">{pendingOrders} pending</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-success-50 to-success-100 border-success-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-success-500 rounded-lg">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Average Order Value</p>
            <p className="text-3xl font-bold text-gray-900">{averageOrderValue.toFixed(2)} MAD</p>
            <p className="text-xs text-gray-500 mt-2">Per completed order</p>
          </Card>

          <Card className="p-6 bg-gradient-to-br from-warning-50 to-warning-100 border-warning-200">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-warning-500 rounded-lg">
                <Activity className="w-6 h-6 text-white" />
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-1">Completion Rate</p>
            <p className="text-3xl font-bold text-gray-900">
              {totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : 0}%
            </p>
            <p className="text-xs text-gray-500 mt-2">{completedOrders} of {totalOrders} orders</p>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart Placeholder */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
                <p className="text-sm text-gray-600">Revenue over time</p>
              </div>
              <BarChart3 className="w-5 h-5 text-gray-400" />
            </div>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-500">Chart visualization</p>
                <p className="text-xs text-gray-400 mt-1">Would integrate with charting library</p>
              </div>
            </div>
          </Card>

          {/* Orders Status Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Orders Status</h3>
                <p className="text-sm text-gray-600">Order distribution</p>
              </div>
              <PieChart className="w-5 h-5 text-gray-400" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-success-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Completed</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{completedOrders}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-warning-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Pending</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{pendingOrders}</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">Total</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{totalOrders}</span>
              </div>
            </div>
          </Card>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary-100 rounded-lg">
                <Package className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-secondary-100 rounded-lg">
                <Users className="w-6 h-6 text-secondary-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.activeProducts || 0}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-warning-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-warning-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-gray-900">{stats.lowStockProducts || 0}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
};

