import React from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { RefreshCw, Plus, ArrowRight, TrendingUp, TrendingDown, AlertCircle, CreditCard, ShoppingCart, CheckCircle, Clock, DollarSign } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { ProtectedRoute } from '../components/shared/ProtectedRoute';
import { apiService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const statusColors: Record<string, string> = {
  INITIATED: 'gray',
  FEE_SIMULATED: 'info',
  ESCROWED: 'warning',
  SHIPPED: 'secondary',
  DELIVERED: 'primary',
  SETTLED: 'success',
  FAILED: 'error',
};

export const WalletDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showActivateModal, setShowActivateModal] = React.useState(false);

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

  // Fetch wallet balance (fallback)
  const {
    data: balanceData,
    isLoading: balanceLoading,
    error: balanceError,
    refetch: refetchBalance,
  } = useQuery({
    queryKey: ['wallet-balance'],
    queryFn: async () => {
      const response = await apiService.getWalletBalance();
      return response.data.data;
    },
    retry: false,
    enabled: !dashboardStats?.walletBalance,
  });

  // Activate wallet mutation
  const activateWalletMutation = useMutation({
    mutationFn: () => apiService.activateWallet(),
    onSuccess: () => {
      toast.success('Wallet activated successfully!');
      setShowActivateModal(false);
      refetchBalance();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to activate wallet');
    },
  });

  const isWalletNotActivated = balanceError && (balanceError as any).response?.status === 400;

  // Fetch recent transactions
  const {
    data: transactionsData,
    isLoading: transactionsLoading,
    refetch: refetchTransactions,
  } = useQuery({
    queryKey: ['wallet-transactions'],
    queryFn: async () => {
      const response = await apiService.getWalletTransactions({ limit: 10, offset: 0 });
      return response.data.data;
    },
  });

  const handleRefresh = () => {
    refetchStats();
    refetchBalance();
    refetchTransactions();
    toast.success('Dashboard refreshed');
  };

  const isLoading = statsLoading || balanceLoading || transactionsLoading;
  const walletBalance = dashboardStats?.walletBalance ?? balanceData?.balance ?? 0;
  const transactions = transactionsData?.transactions || [];
  const stats = dashboardStats || {};

  return (
    <ProtectedRoute>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-heading font-bold text-gray-900">Wallet Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your wallet and view transaction history</p>
        </div>

        {/* Stats Cards */}
        {!isWalletNotActivated && stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Spent</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {stats.totalSpent?.toFixed(2) || '0.00'} MAD
                  </p>
                </div>
                <DollarSign size={32} className="text-primary-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.totalTransactions || 0}</p>
                </div>
                <ShoppingCart size={32} className="text-secondary-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Pending Orders</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.pendingOrders || 0}</p>
                </div>
                <Clock size={32} className="text-warning-500" />
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Completed</p>
                  <p className="text-3xl font-bold text-gray-900">{stats.completedOrders || 0}</p>
                </div>
                <CheckCircle size={32} className="text-success-500" />
              </div>
            </Card>
          </div>
        )}

        {/* Balance Card */}
        <Card className="mb-8 p-8 bg-primary-50 border border-primary-200">
          {isWalletNotActivated ? (
            <div className="text-center py-8">
              <CreditCard size={48} className="text-primary-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Wallet Not Activated</h3>
              <p className="text-gray-600 mb-6">
                Activate your wallet to start making transactions
              </p>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowActivateModal(true)}
                loading={activateWalletMutation.isPending}
              >
                Activate Wallet
              </Button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-2">Available Balance</p>
                {isLoading ? (
                  <Skeleton height="60px" width="200px" />
                ) : (
                  <div className="flex items-baseline gap-2">
                    <h2 className="text-5xl font-bold text-gray-900">
                      {walletBalance.toFixed(2)}
                    </h2>
                    <span className="text-xl text-gray-600">MAD</span>
                  </div>
                )}
                {balanceData?.walletId && (
                  <p className="text-xs text-gray-500 mt-2">
                    Wallet ID: {balanceData.walletId.substring(0, 12)}...
                  </p>
                )}
                {stats.totalSpent !== undefined && (
                  <p className="text-sm text-gray-600 mt-2">
                    Lifetime spending: {stats.totalSpent.toFixed(2)} MAD
                  </p>
                )}
              </div>
              <Button
                variant="secondary"
                onClick={handleRefresh}
                icon={<RefreshCw size={20} />}
                loading={isLoading}
              >
                Refresh
              </Button>
            </div>
          )}
        </Card>

        {/* Activate Wallet Modal */}
        <Modal
          isOpen={showActivateModal}
          onClose={() => setShowActivateModal(false)}
          title="Activate Wallet"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Activating your wallet will create a CIH Bank wallet account linked to your Afus ⴰⴼⵓⵙ account.
              This process may take a few moments.
            </p>
            <div className="flex gap-4">
              <Button
                variant="secondary"
                onClick={() => setShowActivateModal(false)}
                fullWidth
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => activateWalletMutation.mutate()}
                loading={activateWalletMutation.isPending}
                fullWidth
              >
                Activate
              </Button>
            </div>
          </div>
        </Modal>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/products')}
            icon={<Plus size={20} />}
            fullWidth
          >
            Browse Products
          </Button>
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/transactions')}
            icon={<ArrowRight size={20} />}
            fullWidth
          >
            View All Transactions
          </Button>
        </div>

        {/* Recent Transactions */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-heading font-bold text-gray-900">Recent Transactions</h2>
            {transactions.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/transactions')}
              >
                View All <ArrowRight size={16} className="ml-1" />
              </Button>
            )}
          </div>

          {transactionsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} height="100px" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <EmptyState
              title="No transactions yet"
              description="Start by browsing products and making your first purchase."
              action={{
                label: 'Browse Products',
                onClick: () => navigate('/products'),
              }}
            />
          ) : (
            <div className="space-y-4">
              {(stats.recentTransactions || transactions).slice(0, 5).map((transaction: any) => {
                // Handle both dashboard stats format and full transaction format
                const txId = transaction.id || transaction._id?.toString();
                const txProduct = transaction.product || transaction.productName;
                const txAmount = transaction.amount || transaction.totalAmount;
                const txStatus = transaction.status;
                const txCreatedAt = transaction.createdAt;
                const isBuyer = user?.id === transaction.buyer?.id || true; // Default to buyer for dashboard
                const counterparty = transaction.seller || transaction.buyer;
                const amount = isBuyer ? -txAmount : txAmount;
                const isPositive = amount > 0;

                return (
                  <div
                    key={txId}
                    onClick={() => txId && navigate(`/transactions/${txId}`)}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-grow">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`text-2xl font-bold ${isPositive ? 'text-success-600' : 'text-error-600'}`}>
                            {isPositive ? '+' : ''}
                            {Math.abs(amount).toFixed(2)} MAD
                          </div>
                          <Badge color={statusColors[txStatus] as any} size="sm">
                            {txStatus}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                          {counterparty?.email && (
                            <p>
                              <span className="font-medium">{isBuyer ? 'To:' : 'From:'}</span>{' '}
                              {counterparty.email}
                            </p>
                          )}
                          {txProduct && (
                            <p>
                              <span className="font-medium">Product:</span> {txProduct}
                            </p>
                          )}
                          {txCreatedAt && (
                            <p className="text-gray-500">
                              {format(new Date(txCreatedAt), 'PPp')}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center text-gray-400">
                        {isPositive ? (
                          <TrendingUp size={20} className="text-success-500" />
                        ) : (
                          <TrendingDown size={20} className="text-error-500" />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
};

