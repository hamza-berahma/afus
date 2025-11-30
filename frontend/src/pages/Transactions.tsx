import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, Link } from 'react-router-dom';
import { Package, ArrowRight, Filter, Search, Calendar } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';

const statusColors: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'gray' | 'secondary'> = {
  INITIATED: 'gray',
  FEE_SIMULATED: 'secondary',
  ESCROWED: 'warning',
  SHIPPED: 'secondary',
  DELIVERED: 'primary',
  SETTLED: 'success',
  FAILED: 'error',
};

export const Transactions: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [filters, setFilters] = useState({
    status: '',
    search: '',
    role: '', // 'buyer' or 'seller'
  });

  const { data, isLoading, error } = useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      const response = await apiService.getWalletTransactions();
      return response.data.data;
    },
  });

  const transactions = data?.transactions || [];

  // Filter transactions client-side (since backend doesn't support these filters yet)
  const filteredTransactions = transactions.filter((tx: any) => {
    if (filters.status && tx.status !== filters.status) return false;
    if (filters.role && tx.userRole !== filters.role) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      return (
        tx.product?.name?.toLowerCase().includes(searchLower) ||
        tx.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('fr-MA', { style: 'currency', currency: 'MAD' }).format(amount);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Skeleton height="60px" className="mb-6" />
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton height="120px" key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <EmptyState
            title="Failed to load transactions"
            description="Please try again later."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900 mb-2">
            Transaction History
          </h1>
          <p className="text-gray-600">View all your transactions</p>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Input
              placeholder="Search transactions..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              icon={<Search className="w-5 h-5" />}
              clearable
              onClear={() => setFilters({ ...filters, search: '' })}
            />
            <Select
              value={filters.status}
              onChange={(value) => {
                setFilters({ ...filters, status: value });
              }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Initiated', value: 'INITIATED' },
                { label: 'Escrowed', value: 'ESCROWED' },
                { label: 'Shipped', value: 'SHIPPED' },
                { label: 'Delivered', value: 'DELIVERED' },
                { label: 'Settled', value: 'SETTLED' },
                { label: 'Failed', value: 'FAILED' },
              ]}
            />
            <Select
              value={filters.role}
              onChange={(value) => {
                setFilters({ ...filters, role: value });
              }}
              options={[
                { label: 'All Roles', value: '' },
                { label: 'As Buyer', value: 'buyer' },
                { label: 'As Seller', value: 'seller' },
              ]}
            />
            <Button
              variant="secondary"
              onClick={() => {
                setFilters({ status: '', search: '', role: '' });
              }}
              icon={<Filter className="w-5 h-5" />}
            >
              Clear Filters
            </Button>
          </div>
        </Card>

        {/* Transactions List */}
        {filteredTransactions.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No transactions found"
            description="You haven't made any transactions yet."
            action={{
              label: 'Browse Products',
              onClick: () => navigate('/products'),
            }}
          />
        ) : (
          <div className="space-y-4">
            {filteredTransactions.map((transaction: any) => (
              <Card key={transaction.id} hoverable onClick={() => navigate(`/transactions/${transaction.id}`)}>
                <div className="p-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-900">
                          {transaction.product?.name || 'Unknown Product'}
                        </h3>
                        <Badge color={statusColors[transaction.status] || 'gray'} size="sm">
                          {transaction.status}
                        </Badge>
                        <Badge color={transaction.userRole === 'buyer' ? 'primary' : 'secondary'} size="sm">
                          {transaction.userRole === 'buyer' ? 'Buyer' : 'Seller'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                        <span>ID: {transaction.id.substring(0, 8)}...</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(transaction.createdAt), 'MMM dd, yyyy')}
                        </span>
                        {transaction.userRole === 'buyer' && transaction.seller && (
                          <span>Seller: {transaction.seller.email}</span>
                        )}
                        {transaction.userRole === 'seller' && transaction.buyer && (
                          <span>Buyer: {transaction.buyer.email}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total Amount</p>
                        <p className="text-xl font-bold text-primary-600">
                          {formatCurrency(transaction.totalAmount)}
                        </p>
                        {transaction.fee > 0 && (
                          <p className="text-xs text-gray-500">
                            Fee: {formatCurrency(transaction.fee)}
                          </p>
                        )}
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

