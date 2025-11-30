import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  ShoppingCart, 
  Truck, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  DollarSign,
  BarChart3,
  ArrowLeft
} from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const statusColors: Record<string, string> = {
  INITIATED: 'gray',
  FEE_SIMULATED: 'info',
  ESCROWED: 'warning',
  SHIPPED: 'secondary',
  DELIVERED: 'primary',
  SETTLED: 'success',
  FAILED: 'error',
};

export const ProcessingAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState<string | 'all'>('all');

  // Fetch all transactions
  const { data: transactionsData, isLoading } = useQuery({
    queryKey: ['all-transactions', selectedStatus],
    queryFn: async () => {
      const response = await apiService.getWalletTransactions({ limit: 1000 });
      return response.data.data?.transactions || [];
    },
  });

  const transactions = transactionsData || [];
  
  // Filter by status if needed
  const filteredTransactions = selectedStatus === 'all'
    ? transactions
    : transactions.filter((t: any) => t.status === selectedStatus);

  // Calculate statistics
  const stats = {
    total: transactions.length,
    byStatus: {
      INITIATED: transactions.filter((t: any) => t.status === 'INITIATED').length,
      ESCROWED: transactions.filter((t: any) => t.status === 'ESCROWED').length,
      SHIPPED: transactions.filter((t: any) => t.status === 'SHIPPED').length,
      DELIVERED: transactions.filter((t: any) => t.status === 'DELIVERED').length,
      SETTLED: transactions.filter((t: any) => t.status === 'SETTLED').length,
      FAILED: transactions.filter((t: any) => t.status === 'FAILED').length,
    },
    totalRevenue: transactions
      .filter((t: any) => t.status === 'SETTLED')
      .reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0),
    pendingRevenue: transactions
      .filter((t: any) => ['ESCROWED', 'SHIPPED', 'DELIVERED'].includes(t.status))
      .reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0),
    averageOrderValue: transactions.length > 0
      ? transactions.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0) / transactions.length
      : 0,
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} height="120px" />
            ))}
          </div>
          <Skeleton height="400px" />
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              icon={<ArrowLeft size={16} />}
              className="mb-4"
            >
              Back
            </Button>
            <h1 className="text-3xl font-heading font-bold text-gray-900">Processing & Orders Analytics</h1>
            <p className="text-gray-600 mt-2">Track all orders and processing status</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-xs text-gray-500 mt-2">All transactions</p>
              </div>
              <ShoppingCart size={32} className="text-primary-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalRevenue.toFixed(2)} MAD</p>
                <p className="text-xs text-gray-500 mt-2">From settled orders</p>
              </div>
              <DollarSign size={32} className="text-success-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Pending Revenue</p>
                <p className="text-3xl font-bold text-gray-900">{stats.pendingRevenue.toFixed(2)} MAD</p>
                <p className="text-xs text-gray-500 mt-2">In processing</p>
              </div>
              <Clock size={32} className="text-warning-500" />
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">Avg Order Value</p>
                <p className="text-3xl font-bold text-gray-900">{stats.averageOrderValue.toFixed(2)} MAD</p>
                <p className="text-xs text-gray-500 mt-2">Per transaction</p>
              </div>
              <TrendingUp size={32} className="text-secondary-500" />
            </div>
          </Card>
        </div>

        {/* Status Breakdown */}
        <Card className="mb-8">
          <h2 className="text-2xl font-heading font-bold text-gray-900 mb-6">Order Status Breakdown</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {Object.entries(stats.byStatus).map(([status, count]) => (
              <button
                key={status}
                onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
                className={`p-4 rounded-lg border-2 transition-all text-center ${
                  selectedStatus === status
                    ? 'border-primary-600 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Badge color={statusColors[status] as any} size="sm" className="mb-2">
                  {status}
                </Badge>
                <p className="text-2xl font-bold text-gray-900">{count}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* Transactions List */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-gray-900">
              {selectedStatus === 'all' ? 'All Orders' : `${selectedStatus} Orders`}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/transactions')}
            >
              View All Transactions
            </Button>
          </div>

          {filteredTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No orders found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredTransactions.slice(0, 50).map((transaction: any) => (
                <div
                  key={transaction.id}
                  onClick={() => navigate(`/transactions/${transaction.id}`)}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-medium text-gray-900">
                          {transaction.product?.name || 'Product'}
                        </p>
                        <Badge color={statusColors[transaction.status] as any} size="sm">
                          {transaction.status}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>Qty: {transaction.quantity} {transaction.product?.unit || ''}</span>
                        {transaction.buyer && (
                          <span>Buyer: {transaction.buyer.email}</span>
                        )}
                        {transaction.seller && (
                          <span>Seller: {transaction.seller.email}</span>
                        )}
                        <span>
                          {transaction.createdAt && format(new Date(transaction.createdAt), 'PPp')}
                        </span>
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-primary-600 text-lg">
                        {transaction.totalAmount?.toFixed(2) || '0.00'} MAD
                      </p>
                      {transaction.fee > 0 && (
                        <p className="text-xs text-gray-500">Fee: {transaction.fee.toFixed(2)} MAD</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
};

