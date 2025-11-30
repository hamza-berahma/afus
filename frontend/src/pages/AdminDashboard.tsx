import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  ShoppingCart,
  Package,
  DollarSign,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { apiService } from '../services/api';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'gray' | 'secondary'> = {
  INITIATED: 'gray',
  FEE_SIMULATED: 'secondary',
  ESCROWED: 'warning',
  SHIPPED: 'secondary',
  DELIVERED: 'primary',
  SETTLED: 'success',
  FAILED: 'error',
};

export const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Fetch dashboard stats
  const {
    data: dashboardStats,
    isLoading: statsLoading,
    error: statsError,
    refetch: refetchStats,
  } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await apiService.getDashboardStats();
      return response.data.data;
    },
    retry: false,
  });

  // Fetch analytics
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
  } = useQuery({
    queryKey: ['dashboard-analytics', selectedPeriod],
    queryFn: async () => {
      const response = await apiService.getDashboardAnalytics({ period: selectedPeriod });
      return response.data.data;
    },
    enabled: !!dashboardStats,
  });

  const handleRefresh = () => {
    refetchStats();
    toast.success('Dashboard refreshed');
  };

  const stats = dashboardStats || {};
  const analytics = analyticsData || {};

  if (statsLoading) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-6">
            <Skeleton height="60px" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height="120px" />
              ))}
            </div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (statsError) {
    return (
      <ProtectedRoute requiredRole="ADMIN">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EmptyState
            title="Failed to load dashboard"
            description="Please try again later."
            icon={AlertCircle}
          />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="ADMIN">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">System overview and analytics</p>
          </div>
          <Button
            variant="secondary"
            onClick={handleRefresh}
            icon={<RefreshCw size={20} />}
            loading={statsLoading}
          >
            Refresh
          </Button>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Users</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalUsers || 0}</p>
                <div className="flex gap-4 mt-2 text-xs text-gray-500">
                  <span>{stats.totalProducers || 0} Producers</span>
                  <span>{stats.totalBuyers || 0} Buyers</span>
                </div>
              </div>
              <Users size={32} className="text-primary-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Products</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalProducts || 0}</p>
                <p className="text-xs text-gray-500 mt-2">Active products</p>
              </div>
              <Package size={32} className="text-secondary-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Transactions</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions || 0}</p>
                {stats.statusBreakdown && (
                  <p className="text-xs text-gray-500 mt-2">
                    {stats.statusBreakdown.SETTLED || 0} settled
                  </p>
                )}
              </div>
              <ShoppingCart size={32} className="text-warning-500" />
            </div>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">
                  {(stats.totalRevenue || 0).toFixed(2)} MAD
                </p>
                <p className="text-xs text-gray-500 mt-2">From settled transactions</p>
              </div>
              <DollarSign size={32} className="text-success-500" />
            </div>
          </Card>
        </div>

        {/* Transaction Status Breakdown */}
        {stats.statusBreakdown && (
          <Card className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">Transaction Status</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              {Object.entries(stats.statusBreakdown).map(([status, count]: [string, any]) => (
                <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
                  <Badge color={statusColors[status] || 'gray'} size="sm" className="mb-2">
                    {status}
                  </Badge>
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Recent Transactions */}
        <Card className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-gray-900">Recent Transactions</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/transactions')}
            >
              View All <ArrowRight size={16} className="ml-1" />
            </Button>
          </div>
          {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {stats.recentTransactions.slice(0, 10).map((transaction: any) => (
                <div
                  key={transaction.id}
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-900">{transaction.product || 'Product'}</p>
                        <Badge color={statusColors[transaction.status] || 'gray'} size="sm">
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>
                          Buyer: {transaction.buyer || 'N/A'} • Seller: {transaction.seller || 'N/A'}
                        </p>
                        {transaction.createdAt && (
                          <p className="text-gray-500">
                            {format(new Date(transaction.createdAt), 'PPp')}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600">
                        {transaction.amount?.toFixed(2) || '0.00'} MAD
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No transactions yet"
              description="Transactions will appear here as users make purchases."
            />
          )}
        </Card>

        {/* Recent Users */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-gray-900">Recent Users</h2>
          </div>
          {stats.recentUsers && stats.recentUsers.length > 0 ? (
            <div className="space-y-4">
              {stats.recentUsers.map((user: any) => (
                <div
                  key={user.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900">{user.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          color={
                            user.role === 'ADMIN'
                              ? 'error'
                              : user.role === 'PRODUCER'
                              ? 'secondary'
                              : 'primary'
                          }
                          size="sm"
                        >
                          {user.role}
                        </Badge>
                        {user.createdAt && (
                          <span className="text-xs text-gray-500">
                            Joined {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              title="No users yet"
              description="Users will appear here as they register."
            />
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
};

